import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, Calendar, User, AlertCircle, Flag, 
  TrendingUp, Send, Edit2, Trash2, X, Save, Paperclip, Link as LinkIcon, Upload, FileText, ExternalLink, Download
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const priorityConfig = {
  low: { color: "bg-blue-100 text-blue-700", label: "Low" },
  medium: { color: "bg-yellow-100 text-yellow-700", label: "Medium" },
  high: { color: "bg-orange-100 text-orange-700", label: "High" },
  urgent: { color: "bg-red-100 text-red-700", label: "Urgent" }
};

export default function TaskDetailModal({ 
  task, 
  isOpen, 
  onClose, 
  currentUser, 
  collaborators,
  projectId,
  projectTitle,
  onTaskUpdate 
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [localProgress, setLocalProgress] = useState(task?.progress || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [showAddLink, setShowAddLink] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (task && isOpen) {
      setLocalProgress(task.progress || 0);
      setEditedTask({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        assigned_to: task.assigned_to || "",
        due_date: task.due_date || "",
        progress: task.progress || 0
      });
      setIsEditing(false);
      fetchComments();
    }
  }, [task?.id, isOpen]);

  const fetchComments = async () => {
    if (!task?.id) return;
    
    setIsLoadingComments(true);
    try {
      const data = await base44.entities.TaskComment.filter(
        { task_id: task.id }, 
        'created_date'
      );
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await base44.entities.TaskComment.create({
        task_id: task.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        user_avatar: currentUser.profile_image,
        content: newComment.trim()
      });

      // Notify task assignee
      if (task.assigned_to && task.assigned_to !== currentUser.email) {
        await base44.entities.Notification.create({
          user_email: task.assigned_to,
          title: "New comment on your task",
          message: `${currentUser.full_name || currentUser.email} commented on "${task.title}"`,
          type: "project_task_comment",
          related_project_id: projectId,
          related_entity_id: task.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email,
          metadata: {
            project_title: projectTitle,
            task_title: task.title,
            comment: newComment.trim()
          }
        });
      }

      setNewComment("");
      await fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;

    try {
      await base44.entities.TaskComment.delete(commentId);
      await fetchComments();
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleProgressUpdate = async (value) => {
    setLocalProgress(value[0]);
  };

  const handleProgressSave = async () => {
    if (!task) return;
    
    setIsUpdatingProgress(true);
    try {
      await base44.entities.Task.update(task.id, { 
        progress: localProgress 
      });

      // Activity log
      await base44.entities.ActivityLog.create({
        project_id: projectId,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: "task_updated",
        action_description: `Updated task "${task.title}" progress to ${localProgress}%`,
        entity_type: "task",
        entity_id: task.id
      });

      // Notify collaborators if significant progress
      if (localProgress === 100 && task.assigned_to && task.assigned_to !== currentUser.email) {
        await base44.entities.Notification.create({
          user_email: task.assigned_to,
          title: "Task progress updated",
          message: `${currentUser.full_name || currentUser.email} marked "${task.title}" as 100% complete`,
          type: "project_task_updated",
          related_project_id: projectId,
          related_entity_id: task.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email
        });
      }

      onTaskUpdate();
      toast.success("Progress updated");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editedTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setIsSaving(true);
    try {
      // Include progress in the save
      const updateData = {
        ...editedTask,
        progress: localProgress
      };
      await base44.entities.Task.update(task.id, updateData);

      await base44.entities.ActivityLog.create({
        project_id: projectId,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: "task_updated",
        action_description: `Updated task: ${editedTask.title}`,
        entity_type: "task",
        entity_id: task.id
      });

      setIsEditing(false);
      onTaskUpdate();
      toast.success("Task updated");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newAttachment = {
        type: "file",
        name: file.name,
        url: file_url,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: currentUser.email,
        uploaded_at: new Date().toISOString()
      };

      const updatedAttachments = [...(task.attachments || []), newAttachment];
      await base44.entities.Task.update(task.id, { attachments: updatedAttachments });

      await base44.entities.ActivityLog.create({
        project_id: projectId,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: "task_updated",
        action_description: `Added file "${file.name}" to task "${task.title}"`,
        entity_type: "task",
        entity_id: task.id
      });

      onTaskUpdate();
      toast.success("File uploaded");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddLink = async () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      toast.error("Please provide both link name and URL");
      return;
    }

    if (!newLinkUrl.startsWith('http://') && !newLinkUrl.startsWith('https://')) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    try {
      const newAttachment = {
        type: "link",
        name: newLinkName.trim(),
        url: newLinkUrl.trim(),
        uploaded_by: currentUser.email,
        uploaded_at: new Date().toISOString()
      };

      const updatedAttachments = [...(task.attachments || []), newAttachment];
      await base44.entities.Task.update(task.id, { attachments: updatedAttachments });

      await base44.entities.ActivityLog.create({
        project_id: projectId,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: "task_updated",
        action_description: `Added link "${newLinkName.trim()}" to task "${task.title}"`,
        entity_type: "task",
        entity_id: task.id
      });

      setNewLinkName("");
      setNewLinkUrl("");
      setShowAddLink(false);
      onTaskUpdate();
      toast.success("Link added");
    } catch (error) {
      console.error("Error adding link:", error);
      toast.error("Failed to add link");
    }
  };

  const handleDeleteAttachment = async (attachmentIndex) => {
    if (!confirm("Delete this attachment?")) return;

    try {
      const updatedAttachments = task.attachments.filter((_, index) => index !== attachmentIndex);
      await base44.entities.Task.update(task.id, { attachments: updatedAttachments });

      await base44.entities.ActivityLog.create({
        project_id: projectId,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: "task_updated",
        action_description: `Removed attachment from task "${task.title}"`,
        entity_type: "task",
        entity_id: task.id
      });

      onTaskUpdate();
      toast.success("Attachment deleted");
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    }
  };

  if (!task) return null;

  const assignedUser = collaborators?.find(c => c.email === task.assigned_to);
  const priorityInfo = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            {isEditing ? (
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="text-xl font-bold"
              />
            ) : (
              <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isEditing) {
                  handleSaveEdit();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={isSaving}
            >
              {isEditing ? (
                isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-1" /> Save</>
              ) : (
                <><Edit2 className="w-4 h-4 mr-1" /> Edit</>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Task Details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
              {isEditing ? (
                <Textarea
                  value={editedTask.description}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  rows={4}
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {task.description || "No description"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Flag className="w-4 h-4 mr-1" />
                  Priority
                </h4>
                {isEditing ? (
                  <Select
                    value={editedTask.priority}
                    onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={priorityInfo.color}>
                    {priorityInfo.label}
                  </Badge>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Due Date
                </h4>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedTask.due_date}
                    onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                  />
                ) : task.due_date ? (
                  <p className="text-sm text-gray-600">
                    {format(new Date(task.due_date), 'MMMM d, yyyy')}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">No due date</p>
                )}
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Assigned To
                </h4>
                {isEditing ? (
                  <Select
                    value={editedTask.assigned_to}
                    onValueChange={(value) => setEditedTask({ ...editedTask, assigned_to: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Unassigned</SelectItem>
                      {collaborators?.map((collab) => (
                        <SelectItem key={collab.email} value={collab.email}>
                          {collab.full_name || collab.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : assignedUser ? (
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={assignedUser.profile_image} />
                      <AvatarFallback className="text-xs">
                        {assignedUser.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">
                      {assignedUser.full_name || assignedUser.email}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Unassigned</p>
                )}
              </div>
            </div>

            {/* Progress Tracker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Progress
                </h4>
                <span className="text-sm font-medium text-purple-600">
                  {localProgress}%
                </span>
              </div>
              <Slider
                value={[localProgress]}
                onValueChange={handleProgressUpdate}
                onValueCommit={isEditing ? undefined : handleProgressSave}
                max={100}
                step={5}
                className="mb-2"
                disabled={isUpdatingProgress}
              />
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${localProgress}%` }}
                />
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Paperclip className="w-4 h-4 mr-1" />
                Files & Links ({task.attachments?.length || 0})
              </h4>
              
              <div className="space-y-2 mb-3">
                {task.attachments && task.attachments.length > 0 ? (
                  task.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {attachment.type === 'file' ? (
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        ) : (
                          <LinkIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-900 hover:text-purple-600 truncate block"
                          >
                            {attachment.name}
                          </a>
                          {attachment.type === 'file' && attachment.file_size && (
                            <p className="text-xs text-gray-500">
                              {(attachment.file_size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(attachment.url, '_blank')}
                            title={attachment.type === 'file' ? 'Download file' : 'Open link'}
                          >
                            {attachment.type === 'file' ? (
                              <Download className="w-3 h-3" />
                            ) : (
                              <ExternalLink className="w-3 h-3" />
                            )}
                          </Button>
                          {attachment.uploaded_by === currentUser.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteAttachment(index)}
                              title="Delete attachment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No files or links attached yet
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {isUploadingFile ? "Uploading..." : "Upload File"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddLink(!showAddLink)}
                  className="flex-1"
                >
                  <LinkIcon className="w-4 h-4 mr-1" />
                  Add Link
                </Button>
              </div>

              {showAddLink && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2"
                >
                  <Input
                    placeholder="Link name (e.g., Design Mockup)"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                  />
                  <Input
                    placeholder="https://example.com"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddLink}
                      disabled={!newLinkName.trim() || !newLinkUrl.trim()}
                      className="cu-button flex-1"
                    >
                      Add Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddLink(false);
                        setNewLinkName("");
                        setNewLinkUrl("");
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              Comments ({comments.length})
            </h4>

            <form onSubmit={handleAddComment} className="mb-4">
              <div className="flex space-x-2">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={currentUser.profile_image} />
                  <AvatarFallback className="text-xs">
                    {currentUser.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="cu-button"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      {isSubmittingComment ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-3">
                {isLoadingComments ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  <AnimatePresence>
                    {comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={comment.user_avatar} />
                          <AvatarFallback className="text-xs">
                            {comment.user_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.user_name || comment.user_email}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {format(new Date(comment.created_date), 'MMM d, h:mm a')}
                              </span>
                              {comment.user_email === currentUser.email && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-gray-400 hover:text-red-600"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}