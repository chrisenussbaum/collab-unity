import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckSquare, Plus, Edit, Trash2, Calendar, User, AlertCircle, Circle, Clock, CheckCircle2, Flag, MessageSquare, TrendingUp } from "lucide-react";
import { Task, Notification, ActivityLog } from "@/entities/all";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import TaskDetailModal from "./TaskDetailModal";

// Retry logic for rate limiting
const withRetry = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

const statusColumns = [
  { id: "todo", label: "To Do", color: "bg-gray-100" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-100" },
  { id: "done", label: "Done", color: "bg-green-100" }
];

export default function TaskBoard({ project, currentUser, collaborators, isCollaborator, isProjectOwner, projectOwnerName }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assigned_to: "",
    due_date: "",
    progress: 0
  });

  const retryCountRef = useRef(0);

  const fetchTasks = useCallback(async () => {
    if (!project?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await withRetry(() => Task.filter({ project_id: project.id }, '-created_date'));
      setTasks(Array.isArray(data) ? data : []);
      retryCountRef.current = 0;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      // Only show error toast if it's not a rate limit issue (those are retried silently)
      if (error.response?.status !== 429) {
        toast.error("Failed to load tasks");
      }
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assigned_to: "",
      due_date: "",
      progress: 0
    });
    setEditingTask(null);
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        assigned_to: task.assigned_to || "",
        due_date: task.due_date || "",
        progress: task.progress || 0
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData = {
        ...formData,
        project_id: project.id
      };

      if (editingTask) {
        await Task.update(editingTask.id, taskData);
        
        await ActivityLog.create({
          project_id: project.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
          action_type: "task_updated",
          action_description: `Updated task: ${formData.title}`,
          entity_type: "task",
          entity_id: editingTask.id
        });

        // toast.success("Task updated successfully"); // Removed success toast
      } else {
        const newTask = await Task.create(taskData);
        
        await ActivityLog.create({
          project_id: project.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
          action_type: "task_created",
          action_description: `Created task: ${formData.title}`,
          entity_type: "task",
          entity_id: newTask.id
        });

        // Notify assigned user if different from current user
        if (formData.assigned_to && formData.assigned_to !== currentUser.email) {
          await Notification.create({
            user_email: formData.assigned_to,
            title: "New task assigned",
            message: `You've been assigned a task "${formData.title}" in ${project.title}`,
            type: "project_task_assigned",
            related_project_id: project.id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email
          });
        }

        // toast.success("Task created successfully"); // Removed success toast
      }

      await fetchTasks();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (task) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;

    try {
      await Task.delete(task.id);
      
      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: "task_deleted",
        action_description: `Deleted task: ${task.title}`,
        entity_type: "task",
        entity_id: task.id
      });

      // toast.success("Task deleted"); // Removed success toast
      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const wasCompleted = task.status === 'done';
      const isNowCompleted = newStatus === 'done';
      const justCompleted = !wasCompleted && isNowCompleted;

      await Task.update(task.id, { status: newStatus });
      
      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: newStatus === 'done' ? "task_completed" : "task_status_changed",
        action_description: `Changed task "${task.title}" status to ${newStatus}`,
        entity_type: "task",
        entity_id: task.id
      });

      // Notify assigned user if different from current user
      if (task.assigned_to && task.assigned_to !== currentUser.email) {
        await Notification.create({
          user_email: task.assigned_to,
          title: "Task status updated",
          message: `"${task.title}" status changed to ${newStatus.replace('_', ' ')}`,
          type: "project_task_status_updated",
          related_project_id: project.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email
        });
      }

      // New notification logic for task completion
      if (justCompleted) {
        const collaboratorsToNotify = new Set();
        
        // Notify project owner if they're not the one completing the task
        if (project.created_by && project.created_by !== currentUser.email) {
          collaboratorsToNotify.add(project.created_by);
        }

        // Notify all collaborators except the current user and the project owner (if already added)
        if (collaborators) {
          collaborators.forEach(collab => {
            if (collab.email !== currentUser.email && collab.email !== project.created_by) {
              collaboratorsToNotify.add(collab.email);
            }
          });
        }
        
        // Send notifications
        for (const email of collaboratorsToNotify) {
          await Notification.create({
            user_email: email,
            title: "Task completed",
            message: `${currentUser.full_name || currentUser.email} marked the task "${task.title}" as completed in "${project.title}".`,
            type: "project_task_completed",
            related_project_id: project.id,
            related_entity_id: task.id, // ID of the task itself
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            metadata: {
              project_title: project.title,
              task_title: task.title,
              task_id: task.id
            }
          });
        }
      }

      // toast.success("Task status updated"); // Removed success toast
      await fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  if (!project) {
    return (
      <Card className="cu-card">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Project not found</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="cu-card">
        <CardContent className="p-6 text-center">
          <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Sign In to View Tasks</h3>
          <p className="text-gray-600 mb-4">Please sign in to view project tasks.</p>
          <Button onClick={() => User.login()} className="cu-button">
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isCollaborator) {
    return (
      <Card className="cu-card">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Read-Only Access</h3>
            <p className="text-gray-600 mb-4">
              You're viewing this project's tasks. Join the project to contribute and manage tasks.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No tasks have been created yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {['todo', 'in_progress', 'done'].map(status => {
                const statusTasks = tasks.filter(t => t.status === status);
                if (statusTasks.length === 0) return null;

                const statusConfig = {
                  todo: { title: 'To Do', color: 'bg-gray-100', icon: Circle },
                  in_progress: { title: 'In Progress', color: 'bg-blue-100', icon: Clock },
                  done: { title: 'Done', color: 'bg-green-100', icon: CheckCircle2 }
                };
                const config = statusConfig[status];
                const StatusIcon = config.icon;

                return (
                  <div key={status}>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <StatusIcon className="w-4 h-4 mr-2" />
                      {config.title} ({statusTasks.length})
                    </h4>
                    <div className="space-y-2">
                      {statusTasks.map(task => {
                        const assignedUser = collaborators?.find(c => c.email === task.assigned_to);
                        return (
                          <Card key={task.id} className="cu-card">
                            <CardContent className="p-3">
                              <h5 className="font-medium text-gray-900 mb-1">{task.title}</h5>
                              {task.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                {assignedUser && (
                                  <span>Assigned to: {assignedUser.full_name || assignedUser.email.split('@')[0]}</span>
                                )}
                                {task.due_date && (
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {format(new Date(task.due_date), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="cu-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-purple-600" />
            Task Board
          </CardTitle>
          <Button onClick={() => handleOpenDialog()} className="cu-button">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statusColumns.map((column) => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            
            return (
              <Card key={column.id} className="cu-card">
                <CardHeader className={`${column.color} rounded-t-lg`}>
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>{column.label}</span>
                    <Badge variant="secondary">{columnTasks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 min-h-[200px]">
                  <AnimatePresence>
                    {columnTasks.map((task) => {
                      const assignedUser = collaborators?.find(c => c.email === task.assigned_to);
                      
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <Card 
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsTaskDetailOpen(true);
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm flex-1">{task.title}</h4>
                                {task.priority && task.priority !== 'medium' && (
                                  <Flag className={`w-3 h-3 ml-2 ${
                                    task.priority === 'urgent' ? 'text-red-500' : 
                                    task.priority === 'high' ? 'text-orange-500' : 
                                    'text-blue-500'
                                  }`} />
                                )}
                              </div>
                              {task.description && (
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                              )}
                              {task.progress > 0 && (
                                <div className="mb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500">Progress</span>
                                    <span className="text-xs font-medium text-purple-600">{task.progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-purple-600 h-1.5 rounded-full"
                                      style={{ width: `${task.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                {task.due_date && (
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {format(new Date(task.due_date), 'MMM d')}
                                  </span>
                                )}
                                {assignedUser && (
                                  <span className="flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    {assignedUser.full_name || assignedUser.email.split('@')[0]}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                              <Select
                                value={task.status}
                                onValueChange={(value) => {
                                  handleStatusChange(task, value);
                                }}
                              >
                                <SelectTrigger 
                                  className="w-24 h-7 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent onClick={(e) => e.stopPropagation()}>
                                  {statusColumns.map((col) => (
                                    <SelectItem key={col.id} value={col.id}>
                                      {col.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                    setIsTaskDetailOpen(true);
                                  }}
                                  title="View task details"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(task);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No tasks</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What needs to be done?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusColumns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Assign To</label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collaborator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Unassigned</SelectItem> {/* Changed null to "" for consistency with select value */}
                  {collaborators?.map((collab) => (
                    <SelectItem key={collab.email} value={collab.email}>
                      {collab.full_name || collab.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cu-button">
                {isSubmitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        currentUser={currentUser}
        collaborators={collaborators}
        projectId={project.id}
        projectTitle={project.title}
        onTaskUpdate={fetchTasks}
      />
    </div>
  );
}