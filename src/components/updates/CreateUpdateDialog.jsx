import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export default function CreateUpdateDialog({ isOpen, onClose, currentUser, onCreated, initialFile }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const processFile = (file) => {
    if (file.type.startsWith('image/')) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Image must be under 10MB");
        return false;
      }
      setMediaType('image');
    } else if (file.type.startsWith('video/')) {
      if (file.size > MAX_VIDEO_SIZE) {
        toast.error("Video must be under 50MB");
        return false;
      }
      setMediaType('video');
    } else {
      toast.error("Please select an image or video file");
      return false;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    return true;
  };

  // Process the file that was selected directly from the UpdatesBar plus button
  useEffect(() => {
    if (isOpen && initialFile) {
      const success = processFile(initialFile);
      if (!success) {
        onClose();
      }
    }
  }, [isOpen, initialFile]);

  const resetState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    setCaption("");
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
      <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Post Update</DialogTitle>
        </DialogHeader>

        {previewUrl ? (
          <div className="py-2 flex flex-col items-center">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-[9/16] max-h-[420px] flex items-center justify-center mx-auto">
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
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={200}
                  autoFocus
                  className="w-full bg-white/20 backdrop-blur-md text-white placeholder-white/70 rounded-full px-4 py-2 text-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>
            <Button onClick={handleUpload} disabled={isUploading} className="w-full cu-button mt-3">
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isUploading ? "Posting..." : "Post Update"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No file selected.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}