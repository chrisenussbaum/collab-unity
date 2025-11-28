import React, { useState, useEffect } from "react";
import { Thought, ActivityLog } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Plus, Pencil, Trash2, Pin, PinOff, Eye, Lock, Feather } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function ThoughtsTab({ project, currentUser, isCollaborator, isProjectOwner, projectOwnerName }) {
  const [thoughts, setThoughts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingThought, setEditingThought] = useState(null);
  const [selectedThought, setSelectedThought] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [],
  });

  const hasWriteAccess = isProjectOwner || (currentUser && project.collaborator_emails?.includes(currentUser.email));
  const hasReadAccess = !!currentUser;

  useEffect(() => {
    if (project?.id && hasReadAccess) {
      loadThoughts();
    } else {
      setIsLoading(false);
    }
  }, [project?.id, hasReadAccess]);

  const loadThoughts = async () => {
    try {
      setIsLoading(true);
      const projectThoughts = await Thought.filter({ project_id: project.id }, "-created_date");
      setThoughts(Array.isArray(projectThoughts) ? projectThoughts : []);
    } catch (error) {
      console.error("Error loading thoughts:", error);
      toast.error("Failed to load thoughts.");
      setThoughts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasWriteAccess) {
      toast.error("You don't have permission to create thoughts.");
      return;
    }

    try {
      const thoughtData = {
        ...formData,
        project_id: project.id,
        last_edited_by: currentUser.email,
      };

      if (editingThought) {
        await Thought.update(editingThought.id, thoughtData);
        
        await ActivityLog.create({
          project_id: project.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
          action_type: "thought_updated",
          action_description: `updated thought "${formData.title}"`,
          entity_type: "thought",
          entity_id: editingThought.id
        });
        
        toast.success("Thought updated successfully!");
      } else {
        const newThought = await Thought.create(thoughtData);
        
        await ActivityLog.create({
          project_id: project.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
          action_type: "thought_created",
          action_description: `created thought "${formData.title}"`,
          entity_type: "thought",
          entity_id: newThought.id
        });
        
        toast.success("Thought published successfully!");
      }

      setShowCreateModal(false);
      setEditingThought(null);
      setFormData({ title: "", content: "", category: "", tags: [] });
      loadThoughts();
    } catch (error) {
      console.error("Error saving thought:", error);
      toast.error("Failed to save thought.");
    }
  };

  const handleEdit = (thought) => {
    setEditingThought(thought);
    setFormData({
      title: thought.title,
      content: thought.content,
      category: thought.category || "",
      tags: thought.tags || [],
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (thoughtId) => {
    if (!hasWriteAccess) return;
    
    if (window.confirm("Are you sure you want to delete this thought?")) {
      try {
        await Thought.delete(thoughtId);
        toast.success("Thought deleted successfully!");
        loadThoughts();
      } catch (error) {
        console.error("Error deleting thought:", error);
        toast.error("Failed to delete thought.");
      }
    }
  };

  const handlePin = async (thought) => {
    if (!hasWriteAccess) return;

    try {
      await Thought.update(thought.id, {
        is_pinned: !thought.is_pinned,
      });
      loadThoughts();
      toast.success(thought.is_pinned ? "Thought unpinned" : "Thought pinned");
    } catch (error) {
      console.error("Error pinning thought:", error);
      toast.error("Failed to update thought.");
    }
  };

  const pinnedThoughts = thoughts.filter(t => t.is_pinned);
  const unpinnedThoughts = thoughts.filter(t => !t.is_pinned);

  if (isLoading && hasReadAccess) {
    return (
      <Card className="cu-card">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading thoughts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4 pb-6 border-b">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Project Thoughts</h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Share your insights, feelings, and journey throughout this project.
        </p>
        {hasWriteAccess && (
          <Button onClick={() => setShowCreateModal(true)} className="cu-button" size="lg">
            <Feather className="w-4 h-4 mr-2" />
            Write a Thought
          </Button>
        )}
      </div>

      {!hasReadAccess ? (
        <Card className="cu-card">
          <CardContent className="p-8 sm:p-12 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">Thoughts Access Required</p>
            <p className="text-sm text-gray-500">
              Please log in to view project thoughts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {!hasWriteAccess && (
            <Card className="cu-card border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-amber-800">
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">You can view thoughts but cannot create or edit them. Join this project to contribute.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {pinnedThoughts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Pin className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pinned</h3>
              </div>
              {pinnedThoughts.map((thought) => (
                <ThoughtCard
                  key={thought.id}
                  thought={thought}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  onView={setSelectedThought}
                  hasWriteAccess={hasWriteAccess}
                />
              ))}
            </div>
          )}

          {unpinnedThoughts.length > 0 ? (
            <div className="space-y-6">
              {pinnedThoughts.length > 0 && (
                <div className="pt-6 mt-6 border-t">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">All Thoughts</h3>
                </div>
              )}
              {unpinnedThoughts.map((thought) => (
                <ThoughtCard
                  key={thought.id}
                  thought={thought}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  onView={setSelectedThought}
                  hasWriteAccess={hasWriteAccess}
                />
              ))}
            </div>
          ) : (
            !pinnedThoughts.length && (
              <Card className="cu-card border-dashed border-2">
                <CardContent className="p-12 sm:p-16 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No thoughts shared yet</h3>
                  {hasWriteAccess && (
                    <p className="text-gray-500 mb-6">
                      Be the first to share your reflections about this project.
                    </p>
                  )}
                  {hasWriteAccess && (
                    <Button onClick={() => setShowCreateModal(true)} className="cu-button">
                      <Feather className="w-4 h-4 mr-2" />
                      Write Your First Thought
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingThought ? "Edit Your Thought" : "Share Your Thoughts"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Give your thought a compelling title..."
                className="text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={12}
                placeholder="Share your insights, experiences, or reflections..."
                className="resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Category (Optional)</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Planning, Technical, Design, Personal..."
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="cu-button w-full sm:w-auto">
                {editingThought ? "Update Thought" : "Publish Thought"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      {selectedThought && (
        <Dialog open={!!selectedThought} onOpenChange={() => setSelectedThought(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                  {selectedThought.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span>Last edited {formatDistanceToNow(new Date(selectedThought.updated_date), { addSuffix: true })}</span>
                  {selectedThought.category && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-sm">{selectedThought.category}</Badge>
                    </>
                  )}
                </div>
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed">
                <ReactMarkdown>{selectedThought.content}</ReactMarkdown>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ThoughtCard({ thought, onEdit, onDelete, onPin, onView, hasWriteAccess }) {
  return (
    <Card className="cu-card hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => onView(thought)}>
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-4">
          {/* Header with actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {thought.category && (
                <Badge variant="secondary" className="mb-3">
                  {thought.category}
                </Badge>
              )}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight group-hover:text-purple-600 transition-colors">
                {thought.title}
              </h3>
            </div>
            {hasWriteAccess && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPin(thought); }} className="h-8 w-8">
                  {thought.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(thought); }} className="h-8 w-8">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(thought.id); }} className="h-8 w-8 text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Content preview */}
          <p className="text-gray-600 leading-relaxed line-clamp-3">
            {thought.content.substring(0, 200)}...
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-gray-400">
              {formatDistanceToNow(new Date(thought.updated_date), { addSuffix: true })}
            </span>
            <Button variant="link" size="sm" className="text-purple-600 hover:text-purple-700 p-0 h-auto font-medium">
              Read more →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}