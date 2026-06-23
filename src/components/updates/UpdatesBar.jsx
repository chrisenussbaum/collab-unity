import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import UpdateViewer from "./UpdateViewer";
import CreateUpdateDialog from "./CreateUpdateDialog";

export default function UpdatesBar({ currentUser }) {
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingUserEmail, setViewingUserEmail] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const allUpdates = await base44.entities.Update.filter({}, "-created_date", 200);
        setUpdates(allUpdates);
      } catch (error) {
        console.error("Error fetching updates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUpdates();
  }, [refreshKey]);

  // Group updates by user
  const groupedByUser = useMemo(() => {
    const map = {};
    updates.forEach(u => {
      if (!map[u.user_email]) {
        map[u.user_email] = {
          user_email: u.user_email,
          user_name: u.user_name,
          user_avatar: u.user_avatar,
          updates: [],
        };
      }
      map[u.user_email].updates.push(u);
    });
    return Object.values(map).sort((a, b) =>
      new Date(b.updates[0].created_date) - new Date(a.updates[0].created_date)
    );
  }, [updates]);

  const hasUnviewed = (userGroup) => {
    if (!currentUser) return true;
    return userGroup.updates.some(u => !u.viewers?.includes(currentUser.email));
  };

  const handleViewed = async (userGroup) => {
    if (!currentUser) return;
    const unviewed = userGroup.updates.filter(u => !u.viewers?.includes(currentUser.email));
    if (unviewed.length === 0) return;
    try {
      await Promise.all(unviewed.map(u =>
        base44.entities.Update.update(u.id, {
          viewers: [...(u.viewers || []), currentUser.email]
        })
      ));
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error("Error marking updates as viewed:", error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setShowCreateDialog(true);
    e.target.value = '';
  };

  const myGroup = currentUser ? groupedByUser.find(g => g.user_email === currentUser.email) : null;
  const otherGroups = groupedByUser.filter(g => g.user_email !== currentUser?.email);

  const viewingGroup = viewingUserEmail ? groupedByUser.find(g => g.user_email === viewingUserEmail) : null;

  // Don't render if no updates and no current user
  if (!isLoading && otherGroups.length === 0 && !currentUser) return null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide py-1">
          {/* Your Update */}
          {currentUser && (
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative">
                <button
                  className="block group"
                  onClick={() => myGroup ? setViewingUserEmail(currentUser.email) : fileInputRef.current?.click()}
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                    myGroup
                      ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                      : 'bg-gray-200'
                  }`}>
                    <Avatar className="w-full h-full rounded-full border-2 border-white">
                      <AvatarImage src={currentUser.profile_image} />
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                        {currentUser.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" strokeWidth={2.5} />
                </button>
              </div>
              <span className="text-xs text-gray-700 mt-1.5 max-w-[60px] truncate">
                {myGroup ? "Your Update" : "Add Update"}
              </span>
            </div>
          )}

          {/* Other users' updates */}
          {otherGroups.map((group) => {
            const unviewed = hasUnviewed(group);
            return (
              <button
                key={group.user_email}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                onClick={() => {
                  setViewingUserEmail(group.user_email);
                  handleViewed(group);
                }}
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                  unviewed
                    ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                    : 'bg-gray-300'
                }`}>
                  <Avatar className="w-full h-full rounded-full border-2 border-white">
                    <AvatarImage src={group.user_avatar} />
                    <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                      {group.user_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs text-gray-700 mt-1.5 max-w-[60px] truncate">
                  {group.user_name?.split(' ')[0] || 'User'}
                </span>
              </button>
            );
          })}

          {/* Loading skeletons */}
          {isLoading && [...Array(4)].map((_, i) => (
            <div key={`skeleton-${i}`} className="flex flex-col items-center flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-12 h-3 bg-gray-200 rounded mt-1.5 animate-pulse" />
            </div>
          ))}
      </div>

      {viewingGroup && (
        <UpdateViewer
          key={viewingGroup.user_email}
          userGroup={viewingGroup}
          allUserGroups={groupedByUser}
          onClose={() => setViewingUserEmail(null)}
          onNavigate={(group) => {
            setViewingUserEmail(group.user_email);
            handleViewed(group);
          }}
          currentUser={currentUser}
          onDelete={() => setRefreshKey(k => k + 1)}
        />
      )}

      <CreateUpdateDialog
        isOpen={showCreateDialog}
        onClose={() => { setShowCreateDialog(false); setSelectedFile(null); }}
        currentUser={currentUser}
        initialFile={selectedFile}
        onCreated={() => {
          setShowCreateDialog(false);
          setSelectedFile(null);
          setRefreshKey(k => k + 1);
        }}
      />
    </>
  );
}