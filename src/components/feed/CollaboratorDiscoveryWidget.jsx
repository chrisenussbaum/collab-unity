import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OptimizedAvatar from "@/components/OptimizedAvatar";

export default function CollaboratorDiscoveryWidget({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await base44.functions.invoke("getPublicUserProfilesForDiscovery");
        const filtered = (data || []).filter((u) => u.email !== currentUser?.email);
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        setUsers(shuffled.slice(0, 2));
      } catch (e) {
        console.error("Error fetching collaborator profiles:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [currentUser]);

  const handleChat = async (user) => {
    if (!currentUser) return;
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
    }
  };

  if (isLoading || users.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <Card className="cu-card border-l-4 border-l-pink-400 hover:shadow-lg transition-all overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-pink-600">
              Connect with Collaborators
            </span>
          </div>
          <div className="space-y-3">
            {users.map((user, i) => {
              const profileUrl = user.username
                ? createPageUrl(`UserProfile?username=${user.username}`)
                : createPageUrl(`UserProfile?email=${user.email}`);
              return (
                <div key={i} className="flex items-center gap-3 group">
                  <Link to={profileUrl}>
                    <OptimizedAvatar
                      src={user.profile_image}
                      alt={user.full_name}
                      fallback={user.full_name?.[0] || "U"}
                      size="sm"
                      className="w-10 h-10 cursor-pointer"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={profileUrl} className="block">
                      <p className="font-bold text-sm text-gray-900 group-hover:text-pink-600 transition-colors truncate">
                        {user.full_name}
                      </p>
                    </Link>
                    {user.bio ? (
                      <p className="text-xs text-gray-500 line-clamp-1">{user.bio}</p>
                    ) : (
                      user.skills?.length > 0 && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {user.skills.slice(0, 3).join(" · ")}
                        </p>
                      )
                    )}
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {user.skills?.slice(0, 2).map((skill, idx) => (
                        <Badge key={idx} className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200">
                          {skill}
                        </Badge>
                      ))}
                      {user.interests?.slice(0, 1).map((interest, idx) => (
                        <Badge key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleChat(user)}
                    className="flex-shrink-0 h-8 text-xs border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1" />
                    Chat
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}