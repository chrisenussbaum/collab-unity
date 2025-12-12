import React, { useState, useEffect, useRef } from "react";
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
  PartyPopper,
  Upload,
  Image as ImageIcon,
  Video
} from "lucide-react";
import { FeedPost, Project } from "@/entities/all";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

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
  const [statusProject, setStatusProject] = useState("");
  const [userProjects, setUserProjects] = useState([]);
  const [mediaAttachments, setMediaAttachments] = useState([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef(null);
  
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
    setStatusProject("");
    setMediaAttachments([]);
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

  // Function to generate thumbnail from video using canvas
  const generateVideoThumbnailFromBlob = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      const videoURL = URL.createObjectURL(videoFile);
      video.src = videoURL;

      video.addEventListener('loadeddata', () => {
        // Seek to 1 second or 10% of video duration
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      });

      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(videoURL);
          if (blob) {
            // Create a File object from the blob
            const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
            resolve(thumbnailFile);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.85);
      });

      video.addEventListener('error', (e) => {
        URL.revokeObjectURL(videoURL);
        reject(new Error('Failed to load video for thumbnail generation'));
      });

      // Start loading the video
      video.load();
    });
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (mediaAttachments.length + files.length > 5) {
      toast.error("Maximum 5 media files allowed");
      return;
    }

    setIsUploadingMedia(true);
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          toast.error(`${file.name} is not a valid image or video file`);
          continue;
        }

        if (file.size > 100 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 100MB`);
          continue;
        }

        let thumbnailUrl = null;
        
        // Generate thumbnail BEFORE uploading the video
        if (isVideo) {
          try {
            const thumbnailFile = await generateVideoThumbnailFromBlob(file);
            const { file_url: thumb_url } = await base44.integrations.Core.UploadFile({ file: thumbnailFile });
            thumbnailUrl = thumb_url;
          } catch (thumbError) {
            console.warn("Could not generate thumbnail, video will show without thumbnail:", thumbError);
            // Continue without thumbnail rather than failing the entire upload
          }
        }

        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        setMediaAttachments(prev => [...prev, {
          media_url: file_url,
          media_type: isVideo ? 'video' : 'image',
          thumbnail_url: thumbnailUrl,
          caption: ''
        }]);
      }
      toast.success("Media uploaded successfully!");
    } catch (error) {
      console.error("Error uploading media:", error);
      toast.error("Failed to upload media. Please try again.");
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeMedia = (index) => {
    setMediaAttachments(prev => prev.filter((_, i) => i !== index));
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
      postData.media_attachments = mediaAttachments;
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
        <Label>Media (Optional) <span className="text-xs text-gray-500">(up to 5 images or videos)</span></Label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleMediaUpload}
          accept="image/*,video/*"
          multiple
          className="hidden"
        />
        
        {mediaAttachments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 mb-3">
            {mediaAttachments.map((media, index) => (
              <div key={index} className="relative group">
                {media.media_type === 'image' ? (
                  <img
                    src={media.media_url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                ) : (
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                    {media.thumbnail_url ? (
                      <img
                        src={media.thumbnail_url}
                        alt={`Video ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Video className="w-8 h-8 text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMedia(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {mediaAttachments.length < 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingMedia}
            className="mt-2 w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploadingMedia ? "Uploading..." : "Upload Images/Videos"}
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