import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Project, User } from "@/entities/all";
import MediaDisplay from "./MediaDisplay";
import HorizontalScrollContainer from "./HorizontalScrollContainer";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";

export default function FeedProjectHighlights({ 
  project, 
  currentUser, 
  onProjectUpdate 
}) {
  const [uploaderProfiles, setUploaderProfiles] = useState({});
  
  const allProjectHighlights = project.highlights || [];

  // Fetch uploader profiles
  useEffect(() => {
    const fetchUploaderProfiles = async () => {
      if (!allProjectHighlights || allProjectHighlights.length === 0) return;
      
      const uploaderEmails = [...new Set(allProjectHighlights.map(h => h.uploaded_by).filter(Boolean))];
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
  }, [allProjectHighlights]);

  const handleDeleteHighlight = async (index, highlight) => {
    const isUploader = currentUser && currentUser.email === highlight.uploaded_by;
    const isProjectOwner = currentUser && currentUser.email === project.created_by;
    
    if (!isUploader && !isProjectOwner) {
      toast.error("Only the uploader can delete this media");
      return;
    }

    if (window.confirm("Are you sure you want to delete this highlight?")) {
      try {
        const updatedHighlights = allProjectHighlights.filter((_, i) => i !== index);
        await Project.update(project.id, { highlights: updatedHighlights });
        if (onProjectUpdate) onProjectUpdate();
      } catch (error) {
        console.error("Error deleting highlight:", error);
        toast.error("Failed to delete highlight");
      }
    }
  };

  if (!allProjectHighlights || allProjectHighlights.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <HorizontalScrollContainer 
        className="pb-2"
        showArrows={allProjectHighlights.length > 1}
      >
        {allProjectHighlights.map((highlight, index) => {
          const mediaUrl = highlight.media_url || highlight.image_url;
          const mediaType = highlight.media_type || 'image';
          const thumbnailUrl = highlight.thumbnail_url;
          const uploaderProfile = uploaderProfiles[highlight.uploaded_by];
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
                  alt={highlight.caption || `${project.title} highlight ${index + 1}`}
                  caption={highlight.caption}
                  thumbnailUrl={thumbnailUrl}
                  className="w-full h-full object-cover"
                  allMedia={allProjectHighlights.map(h => ({
                    media_url: h.media_url || h.image_url,
                    media_type: h.media_type || 'image',
                    caption: h.caption,
                    thumbnail_url: h.thumbnail_url
                  }))}
                  currentIndex={index}
                  loading="lazy"
                />
                
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteHighlight(index, highlight);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}

                {mediaType === 'video' && (
                  <div className="absolute top-2 left-12 bg-black/70 text-white rounded px-2 py-1 text-xs font-medium flex items-center gap-1 z-10">
                    <Video className="w-3 h-3" />
                    VIDEO
                  </div>
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
    </div>
  );
}