import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, BookOpen, Tv, ChevronRight, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { getPublicUserProfilesForDiscovery } from "@/functions/getPublicUserProfilesForDiscovery";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import UserProfileCard from "@/components/feed/UserProfileCard";
import TrendingProjects from "@/components/feed/TrendingProjects";
import LibraryOfApps from "@/components/feed/LibraryOfApps";

export default function FeedSidebar({ currentUser }) {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setIsLoadingUsers(false);
      return;
    }
    let cancelled = false;
    const fetchUsers = async () => {
      try {
        const { data: allUsers } = await getPublicUserProfilesForDiscovery();
        if (cancelled) return;
        const filtered = (allUsers || []).filter(
          (u) => u.email !== currentUser.email && u.id !== currentUser.id
        );
        const scored = filtered
          .map((u) => ({ ...u, matchScore: calculateUserMatchScore(u, currentUser) }))
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 5);
        setSuggestedUsers(scored);
      } catch (e) {
        console.error("Error fetching suggested users:", e);
      } finally {
        if (!cancelled) setIsLoadingUsers(false);
      }
    };
    fetchUsers();
    return () => { cancelled = true; };
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="space-y-5">
      {/* User Profile Card */}
      <UserProfileCard currentUser={currentUser} />

      {/* Trending Projects */}
      <TrendingProjects />

      {/* Library of Apps */}
      <LibraryOfApps currentUser={currentUser} />

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Explore</h3>
        <div className="space-y-2">
          <Link to="/LearningHub" className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition-colors group">
            <div className="w-8 h-8 rounded-lg cu-gradient flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 group-hover:text-purple-700 transition-colors">Learning Hub</p>
              <p className="text-[10px] text-gray-500">Courses & videos</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 flex-shrink-0 transition-colors" />
          </Link>
          <Link to="/NewsEntertainment" className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition-colors group">
            <div className="w-8 h-8 rounded-lg cu-gradient flex items-center justify-center flex-shrink-0">
              <Tv className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 group-hover:text-purple-700 transition-colors">News & Entertainment</p>
              <p className="text-[10px] text-gray-500">Trending news</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 flex-shrink-0 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Suggested Collaborators */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-sm text-gray-900">Suggested Collaborators</h3>
        </div>
        <p className="text-[11px] text-gray-500 mb-4 ml-10">Based on your skills & interests</p>

        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
        ) : suggestedUsers.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No suggestions yet.</p>
        ) : (
          <div className="space-y-1">
            {suggestedUsers.map((user) => (
              <SidebarUserRow key={user.id} user={user} currentUser={currentUser} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarUserRow({ user, currentUser }) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  const profileUrl = user.username
    ? createPageUrl(`UserProfile?username=${user.username}`)
    : createPageUrl(`UserProfile?email=${user.email}`);

  const isActive = user.last_activity_at &&
    (Date.now() - new Date(user.last_activity_at).getTime()) < 5 * 60 * 1000;

  return (
    <>
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
        <Link to={profileUrl} className="flex-shrink-0 relative">
          <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
            <AvatarImage src={user.profile_image} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-xs font-bold">
              {user.full_name?.[0] || user.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          {isActive && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={profileUrl} className="block">
            <p className="font-semibold text-sm text-gray-900 hover:text-purple-600 transition-colors truncate">
              {user.full_name || "Anonymous"}
            </p>
          </Link>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {user.skills?.slice(0, 2).map((skill, i) => (
              <Badge key={i} variant="outline" className="text-[9px] py-0 px-1 bg-purple-50 border-purple-200 text-purple-700">
                {skill}
              </Badge>
            ))}
            {user.matchScore > 0 && (
              <Badge className="text-[9px] py-0 px-1 bg-indigo-600 text-white">
                <Sparkles className="w-2 h-2 mr-0.5" />
                {user.matchScore}
              </Badge>
            )}
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-400 hover:text-purple-600 hover:bg-purple-50 flex-shrink-0"
          onClick={() => setShowConnectDialog(true)}
          title="Chat"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat with {user.full_name}?</DialogTitle>
            <DialogDescription>
              Start a conversation with {user.full_name} to chat about a project or collaboration opportunity.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Avatar className="w-12 h-12 border-2 border-purple-200">
              <AvatarImage src={user.profile_image} />
              <AvatarFallback className="bg-purple-100 text-purple-600">
                {user.full_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{user.full_name}</p>
              <p className="text-sm text-gray-500">@{user.username || user.email.split("@")[0]}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)} disabled={isConnecting}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!currentUser) {
                  toast.info("Please sign in to connect with users");
                  return;
                }
                setIsConnecting(true);
                try {
                  const existingConv1 = await base44.entities.Conversation.filter({
                    participant_1_email: currentUser.email,
                    participant_2_email: user.email,
                  });
                  const existingConv2 = await base44.entities.Conversation.filter({
                    participant_1_email: user.email,
                    participant_2_email: currentUser.email,
                  });
                  let conversation;
                  if (existingConv1.length > 0) {
                    conversation = existingConv1[0];
                  } else if (existingConv2.length > 0) {
                    conversation = existingConv2[0];
                  } else {
                    conversation = await base44.entities.Conversation.create({
                      participant_1_email: currentUser.email,
                      participant_2_email: user.email,
                      last_message: "",
                      last_message_time: new Date().toISOString(),
                      participant_1_unread_count: 0,
                      participant_2_unread_count: 0,
                    });
                  }
                  setShowConnectDialog(false);
                  navigate(`${createPageUrl("Chat")}?conversation=${conversation.id}`);
                } catch (error) {
                  console.error("Error connecting:", error);
                  toast.error("Failed to start conversation. Please try again.");
                } finally {
                  setIsConnecting(false);
                }
              }}
              disabled={isConnecting}
              className="cu-button"
            >
              {isConnecting ? "Chatting..." : "Yes, Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function calculateUserMatchScore(user, currentUser) {
  let score = 0;
  const cs = currentUser.skills || [];
  const ci = currentUser.interests || [];
  const ct = currentUser.tools_technologies || [];

  if (user.skills && cs.length > 0) {
    const matching = user.skills.filter((s) =>
      cs.some((us) => us.toLowerCase() === s.toLowerCase())
    );
    score += matching.length * 3;
  }
  if (user.tools_technologies && ct.length > 0) {
    const matching = user.tools_technologies.filter((t) =>
      ct.some((ut) => ut.toLowerCase() === t.toLowerCase())
    );
    score += matching.length * 2;
  }
  if (user.interests && ci.length > 0) {
    const matching = user.interests.filter((i) =>
      ci.some((ui) => ui.toLowerCase() === i.toLowerCase())
    );
    score += matching.length * 2;
  }
  if (user.location && currentUser.location) {
    if (
      user.location.toLowerCase().includes(currentUser.location.toLowerCase()) ||
      currentUser.location.toLowerCase().includes(user.location.toLowerCase())
    ) {
      score += 1;
    }
  }
  return score;
}