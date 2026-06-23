import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, MoreVertical, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const IMAGE_DURATION = 5000; // 5 seconds per image

export default function UpdateViewer({ userGroup, allUserGroups, onClose, onNavigate, currentUser, onDelete }) {
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUser?.email === userGroup.user_email;

  const updates = userGroup.updates;
  const currentUpdate = updates[currentUpdateIndex];
  const isVideo = currentUpdate?.media_type === 'video';

  const currentUserIndex = allUserGroups.findIndex(g => g.user_email === userGroup.user_email);
  const nextUserGroup = currentUserIndex >= 0 && currentUserIndex < allUserGroups.length - 1
    ? allUserGroups[currentUserIndex + 1]
    : null;

  const goToNext = () => {
    if (currentUpdateIndex < updates.length - 1) {
      setCurrentUpdateIndex(i => i + 1);
      setVideoProgress(0);
    } else if (nextUserGroup) {
      onNavigate(nextUserGroup);
      setCurrentUpdateIndex(0);
      setVideoProgress(0);
    } else {
      onClose();
    }
  };

  const goToPrev = () => {
    if (currentUpdateIndex > 0) {
      setCurrentUpdateIndex(i => i - 1);
      setVideoProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!currentUpdate) return;
    setIsDeleting(true);
    try {
      await base44.entities.Update.delete(currentUpdate.id);
      toast.success("Update deleted");
      setShowMenu(false);
      if (onDelete) onDelete();
      onClose();
    } catch (error) {
      console.error("Error deleting update:", error);
      toast.error("Failed to delete update");
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-advance for images
  useEffect(() => {
    if (!currentUpdate || isVideo) return;
    const timer = setTimeout(goToNext, IMAGE_DURATION);
    return () => clearTimeout(timer);
  }, [currentUpdateIndex, userGroup.user_email]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentUpdateIndex, userGroup.user_email]);

  if (!currentUpdate) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#f3f0ff' }}>
      <style>{`@keyframes story-progress { from { width: 0%; } to { width: 100%; } }`}</style>

      {/* Progress bars */}
      <div className="flex gap-1 p-3 absolute top-0 left-0 right-0 z-20">
        {updates.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 bg-purple-200 rounded-full overflow-hidden">
            {idx < currentUpdateIndex && <div className="h-full bg-purple-500 w-full" />}
            {idx === currentUpdateIndex && (
              isVideo ? (
                <div className="h-full bg-purple-500 transition-all duration-75" style={{ width: `${videoProgress}%` }} />
              ) : (
                <div
                  className="h-full bg-purple-500"
                  style={{ animation: `story-progress ${IMAGE_DURATION}ms linear forwards` }}
                />
              )
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-3 pt-6 absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center space-x-2">
          {userGroup.user_avatar ? (
            <img src={userGroup.user_avatar} alt={userGroup.user_name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-sm font-medium">
              {userGroup.user_name?.[0] || 'U'}
            </div>
          )}
          <div>
            <p className="text-gray-900 text-sm font-medium">{userGroup.user_name}</p>
            <p className="text-gray-500 text-xs">{formatDistanceToNow(new Date(currentUpdate.created_date))} ago</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-700 p-2 hover:bg-purple-100 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-40 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden min-w-[160px]">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isDeleting ? "Deleting..." : "Delete Update"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <button onClick={onClose} className="text-gray-700 p-2 hover:bg-purple-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Media - clicking closes the viewer */}
      <div
        className="flex-1 flex items-center justify-center relative"
        onClick={onClose}
      >
        {isVideo ? (
          <video
            key={currentUpdate.id}
            src={currentUpdate.media_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            playsInline
            onEnded={goToNext}
            onError={goToNext}
            onTimeUpdate={(e) => {
              const video = e.target;
              if (video.duration) {
                setVideoProgress((video.currentTime / video.duration) * 100);
              }
            }}
          />
        ) : (
          <img
            key={currentUpdate.id}
            src={currentUpdate.media_url}
            alt={currentUpdate.caption || 'Update'}
            className="max-w-full max-h-full object-contain"
            onError={goToNext}
          />
        )}

        {currentUpdate.caption && (
          <div className="absolute bottom-8 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
            <p className="text-white text-sm">{currentUpdate.caption}</p>
          </div>
        )}
      </div>

      {/* Navigation arrows (desktop) */}
      <button
        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goToNext(); }}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
      >
        <ChevronRight className="w-8 h-8" />
      </button>
    </div>
  );
}