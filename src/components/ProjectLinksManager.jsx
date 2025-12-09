import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ExternalLink, Edit, Trash2, Plus, ChevronUp, ChevronDown, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Project } from "@/entities/all";

export default function ProjectLinksManager({ project, currentUser, onProjectUpdate }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedLinks, setEditedLinks] = useState(project.project_urls || []);
  const [newLink, setNewLink] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = currentUser && project.created_by === currentUser.email;
  const projectLinks = project.project_urls || [];

  useEffect(() => {
    setEditedLinks(project.project_urls || []);
  }, [project.project_urls]);

  const handleOpenEdit = () => {
    setEditedLinks([...projectLinks]);
    setIsEditModalOpen(true);
  };

  const handleAddLink = () => {
    if (!newLink.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      new URL(newLink);
      const linkObj = {
        title: newLinkTitle.trim() || '',
        url: newLink.trim()
      };
      setEditedLinks([...editedLinks, linkObj]);
      setNewLink("");
      setNewLinkTitle("");
      toast.success("Link added! Click 'Save Changes' to save.");
    } catch (e) {
      toast.error("Invalid URL. Please include http:// or https://");
    }
  };

  const handleRemoveLink = (index) => {
    setEditedLinks(editedLinks.filter((_, i) => i !== index));
    toast.success("Link removed! Click 'Save Changes' to save.");
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const newLinks = [...editedLinks];
    [newLinks[index - 1], newLinks[index]] = [newLinks[index], newLinks[index - 1]];
    setEditedLinks(newLinks);
    toast.success("Link moved up! Click 'Save Changes' to save.");
  };

  const handleMoveDown = (index) => {
    if (index === editedLinks.length - 1) return;
    
    const newLinks = [...editedLinks];
    [newLinks[index], newLinks[index + 1]] = [newLinks[index + 1], newLinks[index]];
    setEditedLinks(newLinks);
    toast.success("Link moved down! Click 'Save Changes' to save.");
  };

  const handleSave = async () => {
    if (editedLinks.length === 0) {
      toast.error("Please add at least one project link");
      return;
    }

    setIsSaving(true);
    try {
      await Project.update(project.id, {
        project_urls: editedLinks
      });

      toast.success("Feed project links updated successfully!");
      
      setIsEditModalOpen(false);
      
      if (onProjectUpdate) {
        await onProjectUpdate();
      }
      
    } catch (error) {
      console.error("Error updating feed project links:", error);
      toast.error("Failed to update feed project links. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedLinks([...projectLinks]);
    setNewLink("");
    setNewLinkTitle("");
    setIsEditModalOpen(false);
  };

  const getLinkUrl = (linkItem) => {
    return typeof linkItem === 'object' ? linkItem.url : linkItem;
  };

  const getLinkTitle = (linkItem) => {
    return typeof linkItem === 'object' ? linkItem.title : '';
  };

  const getDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
  };

  const handleEditLinkTitle = (index, newTitle) => {
    const updatedLinks = [...editedLinks];
    if (typeof updatedLinks[index] === 'object') {
      updatedLinks[index] = { ...updatedLinks[index], title: newTitle };
    } else {
      updatedLinks[index] = { url: updatedLinks[index], title: newTitle };
    }
    setEditedLinks(updatedLinks);
  };

  if (projectLinks.length === 0 && !isOwner) {
    return null;
  }

  return (
    <>
      <Card className="cu-card">
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
              Showcase Links
            </CardTitle>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenEdit}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {projectLinks.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">No feed project links added yet</p>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEdit}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Links
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {projectLinks.map((linkItem, index) => {
                const url = getLinkUrl(linkItem);
                const title = getLinkTitle(linkItem);
                return (
                  <a
                    key={`link-${index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-gray-100"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <ExternalLink className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        {title && (
                          <p className="font-semibold text-sm text-gray-900 truncate">{title}</p>
                        )}
                        <p className={`text-xs ${title ? 'text-gray-500' : 'font-medium text-gray-900'} truncate`}>
                          {getDomain(url)}
                        </p>
                        {index === 0 && (
                          <p className="text-xs text-purple-600 mt-0.5">Shown on Feed</p>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Feed Showcase Links</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-purple-700">
                Use the arrow buttons to reorder links. Move your most important link to the top!
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-link-title">Add Showcase Link</Label>
              <Input
                id="new-link-title"
                placeholder="Link title (e.g., Live Demo, GitHub Repo, Live Stream)"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  id="new-link"
                  type="url"
                  placeholder="https://example.com"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                />
                <Button onClick={handleAddLink} className="cu-button" type="button">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {editedLinks.length > 0 && (
              <div className="space-y-2">
                <Label>Current Links (Use arrows to reorder, edit titles inline)</Label>
                <div className="space-y-2">
                  {editedLinks.map((linkItem, index) => {
                    const url = getLinkUrl(linkItem);
                    const title = getLinkTitle(linkItem);
                    return (
                      <div
                        key={`link-${index}`}
                        className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="h-6 w-6 p-0 hover:bg-purple-50 disabled:opacity-30"
                            type="button"
                          >
                            <ChevronUp className="w-4 h-4 text-purple-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === editedLinks.length - 1}
                            className="h-6 w-6 p-0 hover:bg-purple-50 disabled:opacity-30"
                            type="button"
                          >
                            <ChevronDown className="w-4 h-4 text-purple-600" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <Input
                            placeholder="Link title (optional)"
                            value={title}
                            onChange={(e) => handleEditLinkTitle(index, e.target.value)}
                            className="text-sm h-8"
                          />
                          <p className="text-xs text-gray-500 truncate">{getDomain(url)}</p>
                          {index === 0 && (
                            <p className="text-xs text-purple-600">Main showcase link</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLink(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || editedLinks.length === 0}
              className="cu-button"
              type="button"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}