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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Loader2 } from "lucide-react";
import { Demo, Project, Notification } from "@/entities/all";
import MentionTextarea from "@/components/MentionTextarea";
import { getCachedAllUserProfiles } from "@/lib/userProfileCache";
import { extractMentionedEmails } from "@/lib/mentions";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function CreateDemoDialog({ isOpen, onClose, currentUser, onDemoCreated }) {
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [relatedProject, setRelatedProject] = useState("");
  const [userProjects, setUserProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !isOpen) return;
    Project.filter({ created_by: currentUser.email }, "-created_date")
      .then(setUserProjects)
      .catch(() => {});
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    getCachedAllUserProfiles().then(setAllUsers).catch(() => {});
  }, [isOpen]);

  const resetForm = () => {
    setCaption("");
    setMediaUrl("");
    setMediaType("image");
    setThumbnailUrl("");
    setRelatedProject("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const generateVideoThumbnail = (file) =>
    new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(video);
      video.src = url;
      video.addEventListener("loadeddata", () => {
        video.currentTime = Math.min(1, (video.duration || 10) * 0.1);
      });
      video.addEventListener("seeked", () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            blob
              ? resolve(new File([blob], "thumb.jpg", { type: "image/jpeg" }))
              : reject(new Error("thumbnail failed"));
          },
          "image/jpeg",
          0.85
        );
      });
      video.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        reject(new Error("video load failed"));
      });
      video.load();
    });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("Please select an image or video");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File too large (max 100MB)");
      return;
    }
    setIsUploading(true);
    try {
      let thumb = "";
      if (isVideo) {
        try {
          const tFile = await generateVideoThumbnail(file);
          const { file_url } = await base44.integrations.Core.UploadFile({ file: tFile });
          thumb = file_url;
        } catch {
          /* thumbnail optional */
        }
      }
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMediaUrl(file_url);
      setMediaType(isVideo ? "video" : "image");
      setThumbnailUrl(thumb);
      toast.success("Media ready");
    } catch {
      toast.error("Failed to upload media");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (!mediaUrl) {
      toast.error("Please upload a photo or video");
      return;
    }
    if (!caption.trim()) {
      toast.error("Please add a caption");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = {
        caption: caption.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        thumbnail_url: thumbnailUrl || undefined,
        is_visible: true,
      };
      if (relatedProject && relatedProject !== "null") {
        data.related_project_id = relatedProject;
      }
      const created = await Demo.create(data);
      const mentioned = extractMentionedEmails(caption, allUsers).filter(
        (e) => e !== currentUser.email
      );
      if (mentioned.length) {
        Promise.all(
          mentioned.map((email) =>
            Notification.create({
              user_email: email,
              title: "You were mentioned in a demo",
              message: `${currentUser.full_name || currentUser.email} mentioned you in a demo.`,
              type: "feed_comment_mention",
              related_project_id: created.id,
              actor_email: currentUser.email,
              actor_name: currentUser.full_name || currentUser.email,
              read: false,
              metadata: { demo_id: created.id },
            })
          )
        ).catch(() => {});
      }
      handleClose();
      if (onDemoCreated) onDemoCreated();
    } catch {
      toast.error("Failed to post demo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a Demo</DialogTitle>
          <DialogDescription>
            Share a video or photo demoing your project progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />

          {mediaUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
              {mediaType === "image" ? (
                <img
                  src={mediaUrl}
                  alt="demo"
                  className="w-full max-h-80 object-contain bg-black"
                />
              ) : (
                <video
                  src={mediaUrl}
                  controls
                  playsInline
                  poster={thumbnailUrl || undefined}
                  className="w-full max-h-80 object-contain bg-black"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setMediaUrl("");
                  setThumbnailUrl("");
                }}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
              ) : (
                <Upload className="w-6 h-6 mb-2" />
              )}
              <span className="text-sm font-medium">
                {isUploading ? "Uploading..." : "Upload photo or video"}
              </span>
            </button>
          )}

          <div>
            <Label>Caption *</Label>
            <MentionTextarea
              value={caption}
              onChange={setCaption}
              placeholder="Describe what you're demoing..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <Label>Related Project (Optional)</Label>
            <Select value={relatedProject} onValueChange={setRelatedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">None</SelectItem>
                {userProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading || !mediaUrl}
            className="cu-button"
          >
            {isSubmitting ? "Posting..." : "Post Demo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}