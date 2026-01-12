import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Image as ImageIcon, Video, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Project, ActivityLog, User, Notification } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import MediaDisplay from "../MediaDisplay";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import { optimizeImage, validateVideo, isImageFile, isVideoFile, formatFileSize } from "../mediaOptimization";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";

export default function ProjectHighlights({ project, currentUser, onProjectUpdate, isCollaborator }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploaderProfiles, setUploaderProfiles] = useState({});

  const highlights = project?.highlights || [];
  const canEdit = currentUser && (
    currentUser.email === project?.created_by ||
    project?.collaborator_emails?.includes(currentUser.email)
  );

  // Fetch uploader profiles (including project creator as fallback)
  useEffect(() => {
    const fetchUploaderProfiles = async () => {
      if (!highlights || highlights.length === 0) return;
      
      // Collect uploader emails and include project creator as fallback
      const uploaderEmails = [...new Set([
        ...highlights.map(h => h.uploaded_by).filter(Boolean),
        project?.created_by // Always fetch project creator for fallback
      ].filter(Boolean))];
      
      if (uploaderEmails.length === 0) return;

      try {
        const { data: profiles } = await getPublicUserProfiles({ emails: uploaderEmails });
        const profilesMap = {};
        (profiles || []).forEach(profile => {
          profilesMap[profile.email] = {
            full_name: profile.full_name,
            profile_image: profile.profile_image,
            email: profile.email
          };
        });
        setUploaderProfiles(profilesMap);
      } catch (error) {
        console.error("Error fetching uploader profiles:", error);
      }
    };

    fetchUploaderProfiles();
  }, [highlights, project?.created_by]);

  // Function to generate thumbnail from video using canvas
  const generateVideoThumbnailFromBlob = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      
      const videoURL = URL.createObjectURL(videoFile);
      video.src = videoURL;

      let hasGenerated = false;

      const cleanup = () => {
        URL.revokeObjectURL(videoURL);
      };

      const generateThumbnail = () => {
        if (hasGenerated) return;
        hasGenerated = true;

        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            cleanup();
            if (blob) {
              const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
              resolve(thumbnailFile);
            } else {
              reject(new Error('Canvas toBlob failed to generate thumbnail'));
            }
          }, 'image/jpeg', 0.9);
        } catch (err) {
          cleanup();
          reject(new Error('Error drawing video frame: ' + err.message));
        }
      };

      video.addEventListener('loadeddata', () => {
        // Ensure video has valid dimensions
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const seekTime = Math.min(0.5, video.duration * 0.05);
          video.currentTime = seekTime;
        } else {
          cleanup();
          reject(new Error('Video has invalid dimensions'));
        }
      });

      video.addEventListener('seeked', generateThumbnail);

      video.addEventListener('error', (e) => {
        cleanup();
        reject(new Error('Failed to load video: ' + (e.message || 'Unknown error')));
      });

      // Timeout fallback - if seeking takes too long, try generating anyway
      setTimeout(() => {
        if (!hasGenerated && video.readyState >= 2) {
          generateThumbnail();
        } else if (!hasGenerated) {
          cleanup();
          reject(new Error('Video thumbnail generation timeout'));
        }
      }, 10000);

      video.load();
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;

    if (!isImageFile(file)) {
      toast.error("Please select a valid image file (JPG, PNG, GIF, WebP)");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Optimizing image...");

    try {
      const optimizedFile = await optimizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85
      });

      setUploadProgress("Uploading...");
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: optimizedFile });

      const newHighlight = {
        media_url: file_url,
        media_type: "image",
        caption: "",
        uploaded_by: currentUser.email,
        uploaded_at: new Date().toISOString(),
        file_name: optimizedFile.name,
        file_size: optimizedFile.size
      };

      const updatedHighlights = [...highlights, newHighlight];
      await Project.update(project.id, { highlights: updatedHighlights });

      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: "asset_uploaded",
        action_description: "added a project highlight image",
        entity_type: "highlight",
        metadata: { file_name: optimizedFile.name }
      });

      // ADDED: Notify all followers about new highlight
      try {
        const allUsers = await User.filter({});
        const followersToNotify = allUsers.filter(user => 
          user.followed_projects?.includes(project.id) && 
          user.email !== currentUser.email
        );

        for (const follower of followersToNotify) {
          await Notification.create({
            user_email: follower.email,
            title: "New project highlight added",
            message: `"${project.title}" has a new highlight image.`,
            type: "project_update",
            related_project_id: project.id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            metadata: {
              project_title: project.title,
              update_type: "highlight_added",
              media_type: "image"
            }
          });
        }
      } catch (error) {
        console.error("Error notifying followers about new highlight:", error);
        // Don't fail the upload if follower notifications fail
      }

      if (onProjectUpdate) onProjectUpdate();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      e.target.value = "";
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;

    if (!isVideoFile(file)) {
      toast.error("Please select a valid video file (MP4, MOV, AVI)");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Validating video...");

    try {
      // Validate video first
      await validateVideo(file, {
        maxSizeMB: 50,
        maxDurationSeconds: 300
      });

      // Generate thumbnail from video
      setUploadProgress("Generating thumbnail...");
      let thumbnailUrl = null;
      
      try {
        const thumbnailFile = await generateVideoThumbnailFromBlob(file);
        setUploadProgress("Uploading thumbnail...");
        const { file_url: thumb_url } = await base44.integrations.Core.UploadFile({ file: thumbnailFile });
        thumbnailUrl = thumb_url;
      } catch (thumbError) {
        console.warn("Could not generate thumbnail, video will show without thumbnail:", thumbError);
        // Continue without thumbnail rather than failing the entire upload
      }

      setUploadProgress(`Uploading video (${formatFileSize(file.size)})...`);
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setUploadProgress("Processing complete...");

      const newHighlight = {
        media_url: file_url,
        media_type: "video",
        thumbnail_url: thumbnailUrl,
        caption: "",
        uploaded_by: currentUser.email,
        uploaded_at: new Date().toISOString(),
        file_name: file.name,
        file_size: file.size
      };

      const updatedHighlights = [...highlights, newHighlight];
      await Project.update(project.id, { highlights: updatedHighlights });

      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: "asset_uploaded",
        action_description: "added a project highlight video",
        entity_type: "highlight",
        metadata: { file_name: file.name }
      });

      // ADDED: Notify all followers about new highlight
      try {
        const allUsers = await User.filter({});
        const followersToNotify = allUsers.filter(user => 
          user.followed_projects?.includes(project.id) && 
          user.email !== currentUser.email
        );

        for (const follower of followersToNotify) {
          await Notification.create({
            user_email: follower.email,
            title: "New project highlight added",
            message: `"${project.title}" has a new highlight video.`,
            type: "project_update",
            related_project_id: project.id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            metadata: {
              project_title: project.title,
              update_type: "highlight_added",
              media_type: "video"
            }
          });
        }
      } catch (error) {
        console.error("Error notifying followers about new highlight:", error);
        // Don't fail the upload if follower notifications fail
      }

      if (onProjectUpdate) onProjectUpdate();
    } catch (error) {
      console.error("Error uploading video:", error);
      const errorMessage = error.message || error.response?.data?.message || "Failed to upload video";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      e.target.value = "";
    }
  };

  const handleDelete = async (index, highlight) => {
    // Only allow the uploader or project owner to delete
    const isUploader = currentUser && currentUser.email === highlight.uploaded_by;
    const isProjectOwner = currentUser && currentUser.email === project.created_by;
    
    if (!isUploader && !isProjectOwner) {
      toast.error("Only the uploader can delete this media");
      return;
    }

    if (window.confirm("Are you sure you want to delete this highlight?")) {
      try {
        const updatedHighlights = highlights.filter((_, i) => i !== index);
        await Project.update(project.id, { highlights: updatedHighlights });
        if (onProjectUpdate) onProjectUpdate();
      } catch (error) {
        console.error("Error deleting highlight:", error);
        toast.error("Failed to delete highlight");
      }
    }
  };

  return (
    <Card className="cu-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Project Highlights</h3>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
            <label htmlFor="image-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cu-text-responsive-xs"
                disabled={isUploading}
                onClick={() => document.getElementById('image-upload').click()}
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                <span className="hidden sm:inline">Image</span>
              </Button>
            </label>

            <input
              type="file"
              id="video-upload"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
              disabled={isUploading}
            />
            <label htmlFor="video-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cu-text-responsive-xs"
                disabled={isUploading}
                onClick={() => document.getElementById('video-upload').click()}
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                <Video className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                <span className="hidden sm:inline">Video</span>
              </Button>
            </label>
          </div>
        )}
      </div>

      {isUploading && uploadProgress && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="text-sm text-purple-700 font-medium">{uploadProgress}</span>
          </div>
        </div>
      )}

      {highlights.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-gray-500">
          <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
          <p className="cu-text-responsive-sm">No project highlights yet</p>
          {canEdit && (
            <p className="text-xs sm:text-sm mt-2 text-gray-400">
              Upload images or videos to showcase your project
            </p>
          )}
        </div>
      ) : (
        <HorizontalScrollContainer 
          className="pb-2"
          showArrows={highlights.length > 1}
        >
          {highlights.map((highlight, index) => {
            const mediaUrl = highlight.media_url || highlight.image_url;
            const mediaType = highlight.media_type || 'image';
            const thumbnailUrl = highlight.thumbnail_url;
            // Use uploader profile, or fall back to project creator profile
            const uploaderProfile = uploaderProfiles[highlight.uploaded_by] || uploaderProfiles[project?.created_by];
            const isUploader = currentUser && currentUser.email === highlight.uploaded_by;
            const isProjectOwner = currentUser && currentUser.email === project.created_by;
            const canDeleteThis = isUploader || isProjectOwner;
            
            return (
              <div 
                key={index} 
                className="relative flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px]"
              >
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                  <MediaDisplay
                    src={mediaUrl}
                    mediaType={mediaType}
                    alt={highlight.caption || `Project highlight ${index + 1}`}
                    caption={highlight.caption}
                    thumbnailUrl={thumbnailUrl}
                    className="w-full h-full object-cover"
                    allMedia={highlights.map(h => ({
                      media_url: h.media_url || h.image_url,
                      media_type: h.media_type || 'image',
                      caption: h.caption,
                      thumbnail_url: h.thumbnail_url
                    }))}
                    currentIndex={index}
                    loading="lazy"
                  />
                  
                  {/* Uploader Avatar */}
                  {uploaderProfile && (
                    <div className="absolute top-2 right-2 z-10">
                      <Avatar className="w-8 h-8 border-2 border-white shadow-lg">
                        <AvatarImage src={uploaderProfile.profile_image} />
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                          {uploaderProfile.full_name?.[0] || uploaderProfile.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  
                  {canDeleteThis && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={() => handleDelete(index, highlight)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  {highlight.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-white text-sm line-clamp-2">{highlight.caption}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </HorizontalScrollContainer>
      )}
    </Card>
  );
}