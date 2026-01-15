import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Plus, Edit, Trash2, CheckCircle, Circle, Clock, Calendar as CalendarIcon, Target } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

export default function MilestonesTab({ project, currentUser, isCollaborator, isProjectOwner }) {
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_date: null,
    status: "not_started"
  });

  const hasWriteAccess = isProjectOwner || (currentUser && project.collaborator_emails?.includes(currentUser.email));

  useEffect(() => {
    if (project?.id) {
      loadMilestones();
    }
  }, [project?.id]);

  const loadMilestones = async () => {
    try {
      setIsLoading(true);
      const projectMilestones = await base44.entities.ProjectMilestone.filter(
        { project_id: project.id }, 
        "target_date"
      );
      setMilestones(Array.isArray(projectMilestones) ? projectMilestones : []);
    } catch (error) {
      console.error("Error loading milestones:", error);
      toast.error("Failed to load milestones.");
      setMilestones([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasWriteAccess) {
      toast.error("You don't have permission to create milestones.");
      return;
    }

    try {
      const milestoneData = {
        ...formData,
        project_id: project.id,
        target_date: formData.target_date ? formData.target_date.toISOString() : null
      };

      if (editingMilestone) {
        await base44.entities.ProjectMilestone.update(editingMilestone.id, milestoneData);
        toast.success("Milestone updated successfully!");
      } else {
        await base44.entities.ProjectMilestone.create(milestoneData);
        toast.success("Milestone created successfully!");
      }

      setShowCreateModal(false);
      setEditingMilestone(null);
      setFormData({ title: "", description: "", target_date: null, status: "not_started" });
      loadMilestones();
    } catch (error) {
      console.error("Error saving milestone:", error);
      toast.error("Failed to save milestone.");
    }
  };

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
      target_date: milestone.target_date ? new Date(milestone.target_date) : null,
      status: milestone.status
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (milestoneId) => {
    if (!hasWriteAccess) return;
    
    if (window.confirm("Are you sure you want to delete this milestone?")) {
      try {
        await base44.entities.ProjectMilestone.delete(milestoneId);
        toast.success("Milestone deleted successfully!");
        loadMilestones();
      } catch (error) {
        console.error("Error deleting milestone:", error);
        toast.error("Failed to delete milestone.");
      }
    }
  };

  const handleStatusChange = async (milestoneId, newStatus) => {
    if (!hasWriteAccess) return;

    try {
      await base44.entities.ProjectMilestone.update(milestoneId, { status: newStatus });
      loadMilestones();
    } catch (error) {
      console.error("Error updating milestone status:", error);
      toast.error("Failed to update milestone status.");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const completedCount = milestones.filter(m => m.status === "completed").length;
  const progressPercentage = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="cu-card">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading milestones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="cu-card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Flag className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Project Milestones</h2>
              </div>
              <p className="text-gray-600">Define major goals and track key achievements that mark significant progress</p>
            </div>
            {hasWriteAccess && (
              <Button onClick={() => setShowCreateModal(true)} className="cu-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            )}
          </div>

          {milestones.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-bold text-purple-600">
                  {completedCount} / {milestones.length} completed
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones List */}
      {milestones.length > 0 ? (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <Card key={milestone.id} className="cu-card hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">{getStatusIcon(milestone.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
                        <Badge className={getStatusColor(milestone.status)}>
                          {milestone.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {milestone.description && (
                        <p className="text-gray-600 mb-3">{milestone.description}</p>
                      )}
                      {milestone.target_date && (
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Target: {format(new Date(milestone.target_date), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>

                  {hasWriteAccess && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {milestone.status !== "completed" && (
                        <Select 
                          value={milestone.status} 
                          onValueChange={(value) => handleStatusChange(milestone.id, value)}
                        >
                          <SelectTrigger className="w-[140px] h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">Not Started</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(milestone)}
                        className="h-9 w-9"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(milestone.id)}
                        className="h-9 w-9 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="cu-card border-dashed border-2">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No milestones yet</h3>
            <p className="text-gray-500 mb-6">
              Milestones represent major goals and phases of your project. Break down your project into significant achievements like "Complete Beta Version" or "Launch to 1000 Users". Use Tasks tab for day-to-day action items.
            </p>
            {hasWriteAccess && (
              <Button onClick={() => setShowCreateModal(true)} className="cu-button">
                <Plus className="w-4 h-4 mr-2" />
                Create First Milestone
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? "Edit Milestone" : "Create New Milestone"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Launch Beta Version, Reach 1000 Users, Complete Phase 1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe the major goal or achievement this milestone represents..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Target Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.target_date ? format(formData.target_date, "MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.target_date}
                      onSelect={(date) => setFormData({ ...formData, target_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setShowCreateModal(false);
                setEditingMilestone(null);
                setFormData({ title: "", description: "", target_date: null, status: "not_started" });
              }}>
                Cancel
              </Button>
              <Button type="submit" className="cu-button">
                {editingMilestone ? "Update Milestone" : "Create Milestone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}