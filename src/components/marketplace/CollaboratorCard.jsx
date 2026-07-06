import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageCircle, MapPin, Briefcase, Eye, Volume2, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";

export default function CollaboratorCard({ user, currentUser, index = 0 }) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const voiceAudioRef = useRef(null);
  const navigate = useNavigate();

  const handleVoicePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user.voice_intro_url) return;
    if (!voiceAudioRef.current) {
      voiceAudioRef.current = new Audio(user.voice_intro_url);
      voiceAudioRef.current.onended = () => setIsPlayingVoice(false);
    }
    if (isPlayingVoice) {
      voiceAudioRef.current.pause();
      setIsPlayingVoice(false);
    } else {
      voiceAudioRef.current.play();
      setIsPlayingVoice(true);
    }
  };

  const profileUrl = user.username
    ? createPageUrl(`UserProfile?username=${user.username}`)
    : createPageUrl(`UserProfile?email=${user.email}`);

  const isActive = user.last_active_at &&
    (Date.now() - new Date(user.last_active_at).getTime()) < 5 * 60 * 1000;

  const handleStartChat = async () => {
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
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
      className="h-full"
    >
      <Card className="cu-card h-full flex flex-col bg-white border border-gray-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 overflow-hidden">
        {/* Cover + Avatar */}
        <div className="relative h-20 bg-gradient-to-r from-purple-500 to-indigo-500">
          {user.cover_image && (
            <img src={user.cover_image} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-10" />
          {user.average_rating > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-gray-800">{user.average_rating}</span>
              {user.review_count > 0 && (
                <span className="text-xs text-gray-500">({user.review_count})</span>
              )}
            </div>
          )}
        </div>

        <CardContent className="p-4 sm:p-5 flex flex-col flex-grow items-center text-center -mt-10">
          <Link to={profileUrl} className="mb-2">
            <OptimizedAvatar
              src={user.profile_image}
              alt={user.full_name}
              fallback={user.full_name?.[0] || "U"}
              size="md"
              className="w-16 h-16 border-4 border-white shadow-lg hover:border-purple-300 transition-all duration-300"
            />
          </Link>

          <div className="flex items-center gap-2 justify-center">
            <Link to={profileUrl} className="font-bold text-base sm:text-lg text-gray-900 hover:text-purple-600 transition-colors">
              {user.full_name || "Anonymous"}
            </Link>
            {isActive && (
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full" title="Active now" />
            )}
            {user.voice_intro_url && (
              <button
                onClick={handleVoicePlay}
                title="Play voice intro"
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                  isPlayingVoice
                    ? "bg-purple-700 text-white animate-pulse"
                    : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                }`}
              >
                {isPlayingVoice ? <Square className="w-2 h-2" /> : <Volume2 className="w-2.5 h-2.5" />}
              </button>
            )}
          </div>

          {user.username && (
            <span className="text-sm text-gray-500 mb-1">@{user.username}</span>
          )}

          {user.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <MapPin className="w-3 h-3" />
              {user.location}
            </div>
          )}

          {user.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3 px-1">
              {user.bio}
            </p>
          )}

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center mb-3">
              {user.skills.slice(0, 4).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                  {skill}
                </Badge>
              ))}
              {user.skills.length > 4 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{user.skills.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-4 w-full py-2 mb-3 border-y border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold">{user.project_count || 0}</span>
              <span className="text-gray-400">Projects</span>
            </div>
            {user.review_count > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{user.average_rating}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full mt-auto">
            <Button
              asChild
              variant="outline"
              className="flex-1 text-sm font-semibold border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Link to={profileUrl}>
                <Eye className="w-4 h-4 mr-1.5" />
                Profile
              </Link>
            </Button>
            <Button
              onClick={() => setShowConnectDialog(true)}
              disabled={!currentUser}
              className="flex-1 text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat Confirmation Dialog */}
      {showConnectDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowConnectDialog(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Message {user.full_name}?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start a conversation about a project or collaboration opportunity.
            </p>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-4">
              <Avatar className="w-10 h-10 border-2 border-purple-200">
                <AvatarImage src={user.profile_image} />
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  {user.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{user.full_name}</p>
                <p className="text-xs text-gray-500">@{user.username || user.email?.split("@")[0]}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConnectDialog(false)} disabled={isConnecting}>
                Cancel
              </Button>
              <Button onClick={handleStartChat} disabled={isConnecting} className="bg-purple-600 hover:bg-purple-700">
                {isConnecting ? "Starting..." : "Yes, Message"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}