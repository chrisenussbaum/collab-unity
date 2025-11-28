
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BookOpen, Plus, Edit, Trash2, Search, Pin, PinOff, Tag, AlertCircle } from "lucide-react";
import { WikiPage, ActivityLog, User } from "@/entities/all"; // Added User import
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';

export default function WikiTab({ project, currentUser, isCollaborator, isProjectOwner, projectOwnerName }) {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPage, setSelectedPage] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [],
    is_pinned: false
  });
  const [newTag, setNewTag] = useState("");

  const fetchPages = useCallback(async () => {
    if (!project?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await WikiPage.filter({ project_id: project.id });
      // Sort: pinned pages first, then by creation date
      const sortedPages = (Array.isArray(data) ? data : []).sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
      });
      setPages(sortedPages);
    } catch (error) {
      console.error("Error fetching wiki pages:", error);
      toast.error("Failed to load wiki pages");
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      content: "",
      category: "",
      tags: [],
      is_pinned: false
    });
    setNewTag("");
    setEditingPage(null);
  }, []);

  const handleOpenDialog = useCallback((page = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        title: page.title || "",
        content: page.content || "",
        category: page.category || "",
        tags: page.tags || [],
        is_pinned: page.is_pinned || false
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    resetForm();
  }, [resetForm]);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  }, [newTag, formData.tags]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Please enter a page title");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Please add some content");
      return;
    }

    setIsSubmitting(true);
    try {
      const pageData = {
        ...formData,
        project_id: project.id,
        last_edited_by: currentUser.email
      };

      if (editingPage) {
        await WikiPage.update(editingPage.id, pageData);
        
        await ActivityLog.create({
          project_id: project.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
          action_type: "wiki_updated",
          action_description: `Updated wiki page: ${formData.title}`,
          entity_type: "wiki",
          entity_id: editingPage.id
        });

        toast.success("Wiki page updated successfully!");
      } else {
        const newPage = await WikiPage.create(pageData);
        
        await ActivityLog.create({
          project_id: project.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
          action_type: "wiki_created",
          action_description: `Created wiki page: ${formData.title}`,
          entity_type: "wiki",
          entity_id: newPage.id
        });

        toast.success("Wiki page created successfully!");
      }

      fetchPages();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving wiki page:", error);
      toast.error("Failed to save wiki page");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (page) => {
    try {
      await WikiPage.update(page.id, { is_pinned: !page.is_pinned });
      toast.success(page.is_pinned ? "Page unpinned" : "Page pinned to top");
      fetchPages();
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update pin status");
    }
  };

  const handleDeletePage = async (page) => {
    if (!confirm(`Delete "${page.title}"? This action cannot be undone.`)) return;

    try {
      await WikiPage.delete(page.id);
      toast.success("Wiki page deleted successfully!");
      fetchPages();
      if (selectedPage?.id === page.id) {
        setSelectedPage(null);
      }
    } catch (error) {
      console.error("Error deleting wiki page:", error);
      toast.error("Failed to delete wiki page");
    }
  };

  const filteredPages = pages.filter(page =>
    page.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!project) {
    return (
      <Card className="cu-card">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Project not found</p>
        </CardContent>
      </Card>
    );
  }

  // Handle case where currentUser is not defined (user not logged in)
  if (!currentUser) {
    return (
      <Card className="cu-card">
        <CardContent className="p-6 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Sign In to View Wiki</h3>
          <p className="text-gray-600 mb-4">Please sign in to view project documentation.</p>
          <Button onClick={() => User.login()} className="cu-button">
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Read-only access for non-collaborators
  if (!isCollaborator) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="cu-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                Wiki Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Read-Only Access</h3>
                <p className="text-gray-600">
                  You're viewing this project's documentation. Join the project to contribute and edit pages.
                </p>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Loading pages...</p>
                </div>
              ) : pages.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 mb-2">
                    No documentation has been created yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pages.map(page => (
                    <div
                      key={page.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedPage?.id === page.id ? 'bg-purple-50 border-purple-300' : 'bg-white'
                      }`}
                      onClick={() => setSelectedPage(page)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {page.is_pinned && <Pin className="w-3 h-3 text-purple-600 flex-shrink-0" />}
                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                              {page.title}
                            </h4>
                          </div>
                          {page.category && (
                            <Badge variant="outline" className="text-xs mb-1">
                              {page.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="cu-card">
            {selectedPage ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {selectedPage.is_pinned && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        {selectedPage.category && (
                          <Badge variant="outline">{selectedPage.category}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-2xl">{selectedPage.title}</CardTitle>
                      {selectedPage.tags && selectedPage.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedPage.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{selectedPage.content}</ReactMarkdown>
                  </div>
                  <div className="mt-6 pt-4 border-t text-xs text-gray-500">
                    Last edited by {selectedPage.last_edited_by || 'Unknown'}
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Page Selected</h3>
                <p className="text-gray-500 mb-6">
                  Select a page from the sidebar to view its content.
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar - Page List */}
      <div className="lg:col-span-1">
        <Card className="cu-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
              Wiki Pages
            </CardTitle>
            <Button onClick={() => handleOpenDialog()} className="cu-button" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Page
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Loading pages...</p>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500 mb-2">
                  {searchQuery ? "No pages found" : "No wiki pages yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredPages.map((page) => (
                    <motion.div
                      key={page.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedPage?.id === page.id ? 'bg-purple-50 border-purple-300' : 'bg-white'
                      }`}
                      onClick={() => setSelectedPage(page)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {page.is_pinned && <Pin className="w-3 h-3 text-purple-600 flex-shrink-0" />}
                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                              {page.title}
                            </h4>
                          </div>
                          {page.category && (
                            <Badge variant="outline" className="text-xs mb-1">
                              {page.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Page Viewer */}
      <div className="lg:col-span-2">
        <Card className="cu-card">
          {selectedPage ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedPage.is_pinned && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Pin className="w-3 h-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {selectedPage.category && (
                        <Badge variant="outline">{selectedPage.category}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{selectedPage.title}</CardTitle>
                    {selectedPage.tags && selectedPage.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedPage.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePin(selectedPage)}
                      className="text-gray-600 hover:text-purple-600"
                    >
                      {selectedPage.is_pinned ? (
                        <PinOff className="w-4 h-4" />
                      ) : (
                        <Pin className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(selectedPage)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePage(selectedPage)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{selectedPage.content}</ReactMarkdown>
                </div>
                <div className="mt-6 pt-4 border-t text-xs text-gray-500">
                  Last edited by {selectedPage.last_edited_by || 'Unknown'}
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Page Selected</h3>
              <p className="text-gray-500 mb-6">
                Select a page from the sidebar or create a new one
              </p>
              <Button onClick={() => handleOpenDialog()} className="cu-button">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Page
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Edit Wiki Page' : 'Create Wiki Page'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Page title..."
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Documentation, Guides, etc."
                />
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag..."
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your content here (Markdown supported)..."
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Supports Markdown formatting</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pin"
                checked={formData.is_pinned}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_pinned: checked }))}
              />
              <Label htmlFor="pin" className="text-sm font-normal cursor-pointer">
                Pin this page to the top
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cu-button">
                {isSubmitting ? 'Saving...' : editingPage ? 'Update Page' : 'Create Page'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
