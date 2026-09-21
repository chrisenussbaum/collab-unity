import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OptimizedAvatar from "../OptimizedAvatar";

export default function CollaboratorCard({ user, currentUser }) {
  const navigate = useNavigate();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const profileUrl = user.username
    ? createPageUrl(`UserProfile?username=${user.username}`)
    : createPageUrl(`UserProfile?email=${user.email}`);

  const handleChat = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || isStartingChat) return;
    setIsStartingChat(true);
    try {
      const existing1 = await base44.entities.Conversation.filter({
        participant_1_email: currentUser.email,
        participant_2_email: user.email,
      });
      const existing2 = await base44.entities.Conversation.filter({
        participant_1_email: user.email,
        participant_2_email: currentUser.email,
      });
      let conversation;
      if (existing1.length > 0) conversation = existing1[0];
      else if (existing2.length > 0) conversation = existing2[0];
      else {
        conversation = await base44.entities.Conversation.create({
          participant_1_email: currentUser.email,
          participant_2_email: user.email,
          last_message: "",
          last_message_time: new Date().toISOString(),
          participant_1_unread_count: 0,
          participant_2_unread_count: 0,
        });
      }
      navigate(`${createPageUrl("Chat")}?conversation=${conversation.id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setIsStartingChat(false);
    }
  };

  const skills = user.skills || [];

  return (
    <div className="cu-card flex flex-col items-center text-center p-4 border border-gray-100 group transition-all hover:shadow-md hover:border-purple-200">
      <Link to={profileUrl} className="flex flex-col items-center w-full">
        <OptimizedAvatar
          src={user.profile_image}
          alt={user.full_name}
          fallback={(user.full_name || "U")[0]}
          size="default"
          className="w-16 h-16 mb-2"
        />
        <p className="font-semibold text-sm text-gray-900 truncate w-full group-hover:text-purple-700 transition-colors">
          {user.full_name}
        </p>
        {user.username && (
          <p className="text-xs text-gray-500 truncate w-full">@{user.username}</p>
        )}
      </Link>

      {(user.bio || skills.length > 0) && (
        <p className="text-xs text-gray-500 line-clamp-1 mt-1 w-full">
          {user.bio || skills[0]}
        </p>
      )}

      {skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {skills.slice(0, 3).map((skill, idx) => (
            <Badge key={idx} className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200">
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && (
            <Badge variant="outline" className="text-[10px] text-gray-500">
              +{skills.length - 3}
            </Badge>
          )}
        </div>
      )}

      {currentUser && currentUser.email !== user.email && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleChat}
          disabled={isStartingChat}
          className="mt-3 w-full h-8 text-xs border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
        >
          <MessageCircle className="w-3.5 h-3.5 mr-1" />
          {isStartingChat ? "Starting..." : "Chat"}
        </Button>
      )}
    </div>
  );
}