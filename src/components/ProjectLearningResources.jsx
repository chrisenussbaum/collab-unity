
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, ExternalLink, Plus, Trash2, Loader2 } from 'lucide-react'; // Added Loader2
import { Project } from "@/entities/all";
import { toast } from "sonner";

export default function ProjectLearningResources({ project, onProjectUpdate, currentUser, isCollaborator }) {
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false); // Renamed from isSubmitting
  const [isDeleting, setIsDeleting] = useState(null); // New state to track item being deleted by index

  const handleAddResource = async () => {
    if (!newResourceUrl.trim()) {
      toast.warning("Please enter a URL.");
      return;
    }

    if (!newResourceUrl.startsWith('http://') && !newResourceUrl.startsWith('https://')) {
      toast.error("Please enter a valid URL including http:// or https://");
      return;
    }

    setIsAdding(true); // Use isAdding
    try {
      let title = newResourceUrl;
      try {
        const urlObject = new URL(newResourceUrl);
        title = urlObject.hostname.replace('www.', '');
      } catch (e) {
        // Keep the original URL as title if parsing fails
      }

      const newResource = {
        title: title,
        url: newResourceUrl,
        description: `Added by ${currentUser?.full_name || 'a collaborator'}`
      };

      const updatedResources = [...(project.learning_resources || []), newResource];
      await Project.update(project.id, { learning_resources: updatedResources });
      onProjectUpdate({ ...project, learning_resources: updatedResources });
      
      setNewResourceUrl("");
      toast.success("Learning resource added!");

    } catch (error) {
      console.error("Error adding learning resource:", error);
      toast.error("Failed to add resource. Please try again.");
    } finally {
      setIsAdding(false); // Use isAdding
    }
  };

  const handleDeleteResource = async (indexToDelete) => { // Renamed from handleRemoveResource, changed parameter
    setIsDeleting(indexToDelete); // Set the index of the item being deleted
    try {
      const updatedResources = project.learning_resources.filter(
        (_, index) => index !== indexToDelete
      );
      await Project.update(project.id, { learning_resources: updatedResources });
      onProjectUpdate({ ...project, learning_resources: updatedResources });
      toast.success("Resource removed.");
    } catch (error) {
      console.error("Error removing resource:", error);
      toast.error("Failed to remove resource.");
    } finally {
      setIsDeleting(null); // Reset isDeleting
    }
  };

  return (
    <Card className="cu-card">
      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="flex items-center text-base sm:text-lg">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
          Learning Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <p className="text-sm text-gray-600 mb-4">
          {isCollaborator 
            ? "Add helpful links, tutorials, or documentation for the team." 
            : "View resources shared by the project team."}
        </p>

        {isCollaborator && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="https://example.com/resource"
              value={newResourceUrl}
              onChange={(e) => setNewResourceUrl(e.target.value)}
              className="flex-1 text-sm"
              disabled={isAdding}
            />
            <Button
              onClick={handleAddResource}
              disabled={!newResourceUrl.trim() || isAdding}
              size="icon"
              className="flex-shrink-0"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {(!project.learning_resources || project.learning_resources.length === 0) ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No learning resources added yet
            </p>
          ) : (
            project.learning_resources.map((resource, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline truncate">
                      {resource.title || (new URL(resource.url).hostname.replace('www.', ''))}
                    </p>
                    {resource.description && (
                      <p className="text-xs text-gray-500 truncate">{resource.description}</p>
                    )}
                  </div>
                </a>
                {isCollaborator && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteResource(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                    disabled={isDeleting === index}
                  >
                    {isDeleting === index ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
