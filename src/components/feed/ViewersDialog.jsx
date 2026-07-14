import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Eye, FolderOpen, UserCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function ViewerRow({ viewer }) {
  const profileUrl = viewer.username
    ? createPageUrl(`UserProfile?username=${viewer.username}`)
    : null;

  const avatar = (
    <Avatar className="w-9 h-9 flex-shrink-0">
      <AvatarImage src={viewer.profile_image} className="object-cover" />
      <AvatarFallback className="bg-purple-100 text-purple-600 text-xs font-semibold">
        {viewer.full_name?.[0] || viewer.email?.[0] || "U"}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-gray-50 transition-colors">
      {profileUrl ? (
        <Link to={profileUrl}>{avatar}</Link>
      ) : (
        avatar
      )}
      <div className="flex-1 min-w-0">
        {profileUrl ? (
          <Link
            to={profileUrl}
            className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors truncate block"
          >
            {viewer.full_name || viewer.email || "Anonymous"}
          </Link>
        ) : (
          <p className="text-sm font-medium text-gray-900 truncate">
            {viewer.full_name || viewer.email || "Anonymous"}
          </p>
        )}
        <p className="text-xs text-gray-400">{timeAgo(viewer.viewed_at)}</p>
      </div>
    </div>
  );
}

export default function ViewersDialog({ open, onOpenChange, type }) {
  const [viewers, setViewers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchViewers = async () => {
      setIsLoading(true);
      try {
        const res = await base44.functions.invoke("getViewers");
        const data = res?.data || res;
        if (cancelled) return;
        if (type === "profile") {
          setViewers(data.profile_viewers || []);
        } else {
          setViewers(data.project_viewers || []);
        }
      } catch (e) {
        console.error("Error fetching viewers:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchViewers();
    return () => { cancelled = true; };
  }, [open, type]);

  const title = type === "profile" ? "Profile Views" : "Project Views";
  const Icon = type === "profile" ? Eye : FolderOpen;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Recent {type === "profile" ? "profile" : "project"} viewers
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          ) : viewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserCircle2 className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">
                No {type === "profile" ? "profile" : "project"} views yet from logged-in users
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {viewers.map((viewer, i) => (
                <ViewerRow key={viewer.email + i} viewer={viewer} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}