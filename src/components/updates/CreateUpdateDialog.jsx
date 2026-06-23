import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export default function CreateUpdateDialog({ isOpen, onClose, currentUser, onCreated }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const resetState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    setCaption("");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Image must be under 10MB");
        return;
      }
      setMediaType('image');
    } else if (file.type.startsWith('video/')) {
      if (file.size > MAX_VIDEO_SIZE) {
        toast.error("Video must be under 50MB");
        return;
      }
      setMediaType('video');
    } else {
      toast.error("Please select an image or video file");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      await base44.entities.Update.create({
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        user_avatar: currentUser.profile_image || "",
        media_url: file_url,
        media_type: mediaType,
        caption: caption.trim(),
        viewers: [],
      });
      toast.success("Update posted!");
      resetState();
      onCreated();
    } catch (error) {
      console.error("Error creating update:", error);
      toast.error("Failed to post update");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Update</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Updates disappear after 24 hours
          </DialogDescription>
        </DialogHeader>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!previewUrl ? (
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-6 h-6 text-purple-600" />
                <span className="text-sm">Take Photo/Video</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => galleryInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-purple-600" />
                <span className="text-sm">Upload from Device</span>
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Max 10MB for images, 50MB for videos
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-[9/16] max-h-[400px] flex items-center justify-center">
              {mediaType === 'video' ? (
                <video src={previewUrl} className="max-w-full max-h-full object-contain" controls />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
              )}
              <button
                onClick={() => { resetState(); }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Input
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
            />
            <Button onClick={handleUpload} disabled={isUploading} className="w-full cu-button">
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isUploading ? "Posting..." : "Post Update"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}