import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function SaveAsTemplateDialog({ open, onOpenChange, project }) {
  const [templateData, setTemplateData] = useState({
    title: project?.title || "",
    description: project?.description || "",
    category: "web_development",
    difficulty_level: "intermediate",
    estimated_duration: "",
    thumbnail_url: project?.logo_url || "",
    is_public: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!templateData.title || !templateData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await base44.entities.ProjectTemplate.create({
        ...templateData,
        classification: project.classification,
        industry: project.industry,
        skills_needed: project.skills_needed || [],
        tools_needed: project.tools_needed || [],
        project_instructions: project.project_instructions || null,
        source_project_id: project.id,
        is_official: false,
        usage_count: 0
      });

      toast.success("Template saved successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Create a reusable template from this project. Other users will be able to use it to start their own projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Template Name *</Label>
            <Input
              id="title"
              placeholder="E.g., Simple Portfolio Website"
              value={templateData.title}
              onChange={(e) => setTemplateData({ ...templateData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what this template is for and what it includes..."
              value={templateData.description}
              onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={templateData.category}
                onValueChange={(value) => setTemplateData({ ...templateData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web_development">Web Development</SelectItem>
                  <SelectItem value="mobile_app">Mobile App</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={templateData.difficulty_level}
                onValueChange={(value) => setTemplateData({ ...templateData, difficulty_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration</Label>
            <Input
              id="duration"
              placeholder="E.g., 2-4 weeks, 1-2 months"
              value={templateData.estimated_duration}
              onChange={(e) => setTemplateData({ ...templateData, estimated_duration: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail URL</Label>
            <Input
              id="thumbnail"
              placeholder="https://..."
              value={templateData.thumbnail_url}
              onChange={(e) => setTemplateData({ ...templateData, thumbnail_url: e.target.value })}
            />
            {templateData.thumbnail_url && (
              <div className="mt-2">
                <img 
                  src={templateData.thumbnail_url} 
                  alt="Template thumbnail"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={templateData.is_public}
              onChange={(e) => setTemplateData({ ...templateData, is_public: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="is_public" className="cursor-pointer">
              Make this template public (visible to all users)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}