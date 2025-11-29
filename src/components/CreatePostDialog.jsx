import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  BookOpen, 
  Users, 
  X, 
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  PartyPopper
} from "lucide-react";
import { FeedPost, Project } from "@/entities/all";
import { toast } from "sonner";

const POST_TYPES = [
  {
    type: "status_update",
    title: "Project Status Update",
    icon: TrendingUp,
    description: "Share progress on a project you're working on",
    color: "text-blue-600"
  },
  {
    type: "narrative",
    title: "Story & Insights",
    icon: BookOpen,
    description: "Share a personal story or lesson learned",
    color: "text-purple-600"
  },
  {
    type: "collaboration_call",
    title: "Call for Collaboration",
    icon: Users,
    description: "Seek opinions, feedback, or collaborators",
    color: "text-green-600"
  }
];

const STATUS_OPTIONS = [
  { value: "on_track", label: "On Track", icon: CheckCircle, color: "text-green-600" },
  { value: "at_risk", label: "At Risk", icon: AlertCircle, color: "text-yellow-600" },
  { value: "delayed", label: "Delayed", icon: Clock, color: "text-red-600" },
  { value: "completed", label: "Completed", icon: PartyPopper, color: "text-purple-600" }
];

export default function CreatePostDialog({ isOpen, onClose, currentUser, onPostCreated }) {
  const [selectedType, setSelectedType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Status Update fields
  const [status, setStatus] = useState("on_track");
  const [statusTitle, setStatusTitle] = useState("");
  const [statusContent, setStatusContent] = useState("");
  const [keyPoints, setKeyPoints] = useState([""]);
  const [statusProject, setStatusProject] = useState("");
  const [userProjects, setUserProjects] = useState([]);
  
  // Narrative fields
  const [narrativeTitle, setNarrativeTitle] = useState("");
  const [narrativeContent, setNarrativeContent] = useState("");
  const [narrativeTags, setNarrativeTags] = useState([]);
  const [narrativeTagInput, setNarrativeTagInput] = useState("");
  const [narrativeProject, setNarrativeProject] = useState("");
  
  // Collaboration Call fields
  const [collabTitle, setCollabTitle] = useState("");
  const [collabContent, setCollabContent] = useState("");
  const [collabProject, setCollabProject] = useState("");
  const [collabTags, setCollabTags] = useState([]);
  const [collabTagInput, setCollabTagInput] = useState("");

  useEffect(() => {
    const loadUserProjects = async () => {
      if (!currentUser || !isOpen) return;
      
      try {
        const projects = await Project.filter({ 
          created_by: currentUser.email 
        }, "-created_date");
        setUserProjects(projects || []);
      } catch (error) {
        console.error("Error loading user projects:", error);
      }
    };

    loadUserProjects();
  }, [currentUser, isOpen]);

  const resetForm = () => {
    setSelectedType(null);
    setStatus("on_track");
    setStatusTitle("");
    setStatusContent("");
    setKeyPoints([""]);
    setStatusProject("");
    setNarrativeTitle("");
    setNarrativeContent("");
    setNarrativeTags([]);
    setNarrativeTagInput("");
    setNarrativeProject("");
    setCollabTitle("");
    setCollabContent("");
    setCollabProject("");
    setCollabTags([]);
    setCollabTagInput("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addKeyPoint = () => {
    if (keyPoints.length < 5) {
      setKeyPoints([...keyPoints, ""]);
    }
  };

  const removeKeyPoint = (index) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== index));
  };

  const updateKeyPoint = (index, value) => {
    const updated = [...keyPoints];
    updated[index] = value;
    setKeyPoints(updated);
  };

  const addTag = (tagValue, type) => {
    if (!tagValue.trim()) return;
    
    if (type === "narrative") {
      if (!narrativeTags.includes(tagValue.trim()) && narrativeTags.length < 5) {
        setNarrativeTags([...narrativeTags, tagValue.trim()]);
        setNarrativeTagInput("");
      }
    } else if (type === "collaboration") {
      if (!collabTags.includes(tagValue.trim()) && collabTags.length < 5) {
        setCollabTags([...collabTags, tagValue.trim()]);
        setCollabTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove, type) => {
    if (type === "narrative") {
      setNarrativeTags(narrativeTags.filter(tag => tag !== tagToRemove));
    } else if (type === "collaboration") {
      setCollabTags(collabTags.filter(tag => tag !== tagToRemove));
    }
  };

  const validateStatusUpdate = () => {
    if (!statusTitle.trim()) {
      toast.error("Please enter a title for your status update");
      return false;
    }
    if (!statusContent.trim()) {
      toast.error("Please enter a status description");
      return false;
    }
    const filledKeyPoints = keyPoints.filter(kp => kp.trim());
    if (filledKeyPoints.length < 2) {
      toast.error("Please add at least 2 key points");
      return false;
    }
    return true;
  };

  const validateNarrative = () => {
    if (!narrativeTitle.trim()) {
      toast.error("Please enter a title for your story");
      return false;
    }
    if (!narrativeContent.trim()) {
      toast.error("Please share your story");
      return false;
    }
    if (narrativeContent.trim().length < 100) {
      toast.error("Your story should be at least 100 characters");
      return false;
    }
    return true;
  };

  const validateCollaboration = () => {
    if (!collabTitle.trim()) {
      toast.error("Please enter a title");
      return false;
    }
    if (!collabContent.trim()) {
      toast.error("Please describe what you're looking for");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedType || !currentUser) return;

    let postData = {
      post_type: selectedType,
      is_visible: true
    };

    // Validate and prepare data based on post type
    if (selectedType === "status_update") {
      if (!validateStatusUpdate()) return;
      
      postData.title = statusTitle.trim();
      postData.content = statusContent.trim();
      postData.status = status;
      postData.key_points = keyPoints.filter(kp => kp.trim());
      if (statusProject) {
        postData.related_project_id = statusProject;
      }
    } else if (selectedType === "narrative") {
      if (!validateNarrative()) return;
      
      postData.title = narrativeTitle.trim();
      postData.content = narrativeContent.trim();
      postData.tags = narrativeTags;
      if (narrativeProject) {
        postData.related_project_id = narrativeProject;
      }
    } else if (selectedType === "collaboration_call") {
      if (!validateCollaboration()) return;
      
      postData.title = collabTitle.trim();
      postData.content = collabContent.trim();
      postData.tags = collabTags;
      if (collabProject) {
        postData.related_project_id = collabProject;
      }
    }

    setIsSubmitting(true);
    try {
      await FeedPost.create(postData);
      handleClose();
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTypeSelection = () => (
    <div className="grid gap-4">
      {POST_TYPES.map((type) => {
        const Icon = type.icon;
        return (
          <button
            key={type.type}
            onClick={() => setSelectedType(type.type)}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
          >
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-full bg-gray-100 group-hover:bg-white flex items-center justify-center flex-shrink-0 ${type.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{type.title}</h3>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderStatusUpdateForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="statusTitle">Title *</Label>
        <Input
          id="statusTitle"
          value={statusTitle}
          onChange={(e) => setStatusTitle(e.target.value)}
          placeholder="Give your update a descriptive title..."
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">{statusTitle.length}/100</p>
      </div>

      <div>
        <Label htmlFor="status">Status *</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center">
                    <Icon className={`w-4 h-4 mr-2 ${option.color}`} />
                    {option.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="statusContent">Status Description * <span className="text-xs text-gray-500">(one sentence)</span></Label>
        <Input
          id="statusContent"
          value={statusContent}
          onChange={(e) => setStatusContent(e.target.value)}
          placeholder="Summarize your project's current state in one sentence..."
          maxLength={150}
        />
        <p className="text-xs text-gray-500 mt-1">{statusContent.length}/150</p>
      </div>

      <div>
        <Label>Key Points * <span className="text-xs text-gray-500">(2-5 points)</span></Label>
        <div className="space-y-2 mt-2">
          {keyPoints.map((point, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Input
                value={point}
                onChange={(e) => updateKeyPoint(index, e.target.value)}
                placeholder={`Key point ${index + 1}...`}
                className="flex-1"
              />
              {keyPoints.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKeyPoint(index)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {keyPoints.length < 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addKeyPoint}
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Key Point
          </Button>
        )}
      </div>

      <div>
        <Label htmlFor="statusProject">Related Project (Optional)</Label>
        <Select value={statusProject} onValueChange={setStatusProject}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">None</SelectItem> {/* Changed to string "null" */}
            {userProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderNarrativeForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="narrativeTitle">Story Title *</Label>
        <Input
          id="narrativeTitle"
          value={narrativeTitle}
          onChange={(e) => setNarrativeTitle(e.target.value)}
          placeholder="Give your story a compelling title..."
          maxLength={100}
        />
      </div>

      <div>
        <Label htmlFor="narrativeContent">Your Story * <span className="text-xs text-gray-500">(min. 100 characters)</span></Label>
        <Textarea
          id="narrativeContent"
          value={narrativeContent}
          onChange={(e) => setNarrativeContent(e.target.value)}
          placeholder="Share your experience, insights, or lessons learned..."
          rows={8}
          className="resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{narrativeContent.length} characters</p>
      </div>

      <div>
        <Label htmlFor="narrativeProject">Related Project (Optional)</Label>
        <Select value={narrativeProject} onValueChange={setNarrativeProject}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">None</SelectItem> {/* Changed to string "null" */}
            {userProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tags (Optional) <span className="text-xs text-gray-500">(up to 5)</span></Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {narrativeTags.map((tag) => (
            <Badge key={tag} className="bg-purple-100 text-purple-700">
              {tag}
              <button
                onClick={() => removeTag(tag, "narrative")}
                className="ml-1 hover:text-purple-900"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        {narrativeTags.length < 5 && (
          <div className="flex space-x-2">
            <Input
              value={narrativeTagInput}
              onChange={(e) => setNarrativeTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(narrativeTagInput, "narrative");
                }
              }}
              placeholder="Add a tag (press Enter)..."
            />
            <Button
              variant="outline"
              onClick={() => addTag(narrativeTagInput, "narrative")}
            >
              Add
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCollaborationForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="collabTitle">What are you looking for? *</Label>
        <Input
          id="collabTitle"
          value={collabTitle}
          onChange={(e) => setCollabTitle(e.target.value)}
          placeholder="E.g., 'Seeking UX Designer for Mobile App Project'"
          maxLength={100}
        />
      </div>

      <div>
        <Label htmlFor="collabContent">Description *</Label>
        <Textarea
          id="collabContent"
          value={collabContent}
          onChange={(e) => setCollabContent(e.target.value)}
          placeholder="Describe what you're working on, what kind of collaboration you need, and what skills or expertise you're looking for..."
          rows={6}
          className="resize-none"
        />
      </div>

      <div>
        <Label htmlFor="collabProject">Related Project (Optional)</Label>
        <Select value={collabProject} onValueChange={setCollabProject}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">None</SelectItem> {/* Changed to string "null" */}
            {userProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tags (Optional) <span className="text-xs text-gray-500">(up to 5)</span></Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {collabTags.map((tag) => (
            <Badge key={tag} className="bg-green-100 text-green-700">
              {tag}
              <button
                onClick={() => removeTag(tag, "collaboration")}
                className="ml-1 hover:text-green-900"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        {collabTags.length < 5 && (
          <div className="flex space-x-2">
            <Input
              value={collabTagInput}
              onChange={(e) => setCollabTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(collabTagInput, "collaboration");
                }
              }}
              placeholder="Add a tag (press Enter)..."
            />
            <Button
              variant="outline"
              onClick={() => addTag(collabTagInput, "collaboration")}
            >
              Add
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {!selectedType ? "Create a Post" : POST_TYPES.find(t => t.type === selectedType)?.title}
          </DialogTitle>
          <DialogDescription>
            {!selectedType 
              ? "Choose the type of post you want to share with your network" 
              : "Share your update with the community"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!selectedType ? (
            renderTypeSelection()
          ) : (
            <>
              {selectedType === "status_update" && renderStatusUpdateForm()}
              {selectedType === "narrative" && renderNarrativeForm()}
              {selectedType === "collaboration_call" && renderCollaborationForm()}
            </>
          )}
        </div>

        <DialogFooter>
          {selectedType && (
            <Button
              variant="outline"
              onClick={() => setSelectedType(null)}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {selectedType && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="cu-button"
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}