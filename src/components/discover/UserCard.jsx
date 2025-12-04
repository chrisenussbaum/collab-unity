import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, MessageCircle, Linkedin, Globe, Heart, Star, Wrench } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const UserCard = ({ user, currentUser, index }) => {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();
  const hasWebLinks = user.linkedin_url || user.website_url;
  const profileUrl = user.username 
    ? createPageUrl(`UserProfile?username=${user.username}`)
    : createPageUrl(`UserProfile?email=${user.email}`);
  
  // Check if user is active (within last 5 minutes)
  const isActive = user.last_activity_at && 
    (Date.now() - new Date(user.last_activity_at).getTime()) < 5 * 60 * 1000;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="cu-card h-full flex flex-col bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-5 flex flex-col flex-grow">
          {/* Header with Avatar and Name */}
          <div className="flex flex-col items-center text-center mb-4">
            <Link to={profileUrl} className="mb-3">
              <Avatar className="w-20 h-20 border-4 border-purple-100 hover:border-purple-300 transition-all duration-300 shadow-sm">
                <AvatarImage src={user.profile_image} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-xl font-bold">
                  {user.full_name?.[0] || user.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <div className="flex items-center gap-2">
              <Link to={profileUrl} className="font-bold text-lg text-gray-900 hover:text-purple-600 transition-colors mb-1">
                {user.full_name || 'Anonymous'}
              </Link>
              {isActive && (
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full mb-1" title="Active now" />
              )}
            </div>
            
            {user.username && (
              <span className="text-sm text-gray-500 mb-2">@{user.username}</span>
            )}
            
            {user.location && (
              <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
                <span className="truncate max-w-[180px]">{user.location}</span>
              </div>
            )}
          </div>

          {/* Mission Statement / Bio */}
          {user.bio && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed text-center italic">
                "{user.bio}"
              </p>
            </div>
          )}

          {/* Skills Section */}
          {user.skills && user.skills.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 mr-1.5 text-purple-600" />
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Skills</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.slice(0, 4).map((skill, idx) => (
                  <Badge 
                    key={idx} 
                    className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
                {user.skills.length > 4 && (
                  <Badge variant="outline" className="text-xs px-2.5 py-1 border-purple-300 text-purple-600 font-semibold">
                    +{user.skills.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Tools & Technologies Section */}
          {user.tools_technologies && user.tools_technologies.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <Wrench className="w-4 h-4 mr-1.5 text-blue-600" />
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Tools</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.tools_technologies.slice(0, 3).map((tool, idx) => (
                  <Badge 
                    key={idx} 
                    className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {tool}
                  </Badge>
                ))}
                {user.tools_technologies.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2.5 py-1 border-blue-300 text-blue-600 font-semibold">
                    +{user.tools_technologies.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Interests Section */}
          {user.interests && user.interests.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Heart className="w-4 h-4 mr-1.5 text-pink-600" />
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Interests</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.slice(0, 3).map((interest, idx) => (
                  <Badge 
                    key={idx} 
                    className="text-xs px-2.5 py-1 bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors"
                  >
                    {interest}
                  </Badge>
                ))}
                {user.interests.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2.5 py-1 border-pink-300 text-pink-600 font-semibold">
                    +{user.interests.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Web Links Section */}
          {hasWebLinks && (
            <div className="mb-4 pb-4 border-t border-gray-100 pt-4">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 text-center">Connect</h4>
              <div className="flex gap-2 justify-center">
                {user.linkedin_url && (
                  <a
                    href={user.linkedin_url.startsWith('http') ? user.linkedin_url : `https://${user.linkedin_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all duration-200 hover:scale-110"
                    title="LinkedIn Profile"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {user.website_url && (
                  <a
                    href={user.website_url.startsWith('http') ? user.website_url : `https://${user.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 hover:scale-110"
                    title="Personal Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Sync Button */}
          <Button 
            onClick={() => setShowConnectDialog(true)}
            disabled={!currentUser}
            className="mt-auto cu-button w-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Sync
          </Button>
        </CardContent>
      </Card>

      {/* Sync Confirmation Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync with {user.full_name}?</DialogTitle>
            <DialogDescription>
              Start a conversation with {user.full_name} to sync about a project or collaboration opportunity.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Avatar className="w-12 h-12 border-2 border-purple-200">
              <AvatarImage src={user.profile_image} />
              <AvatarFallback className="bg-purple-100 text-purple-600">
                {user.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{user.full_name}</p>
              <p className="text-sm text-gray-500">@{user.username || user.email.split('@')[0]}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConnectDialog(false)}
              disabled={isConnecting}
            >
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
                  // Check for existing conversation
                  const existingConv1 = await base44.entities.Conversation.filter({
                    participant_1_email: currentUser.email,
                    participant_2_email: user.email
                  });

                  const existingConv2 = await base44.entities.Conversation.filter({
                    participant_1_email: user.email,
                    participant_2_email: currentUser.email
                  });

                  let conversation;
                  if (existingConv1.length > 0) {
                    conversation = existingConv1[0];
                  } else if (existingConv2.length > 0) {
                    conversation = existingConv2[0];
                  } else {
                    // Create new conversation
                    conversation = await base44.entities.Conversation.create({
                      participant_1_email: currentUser.email,
                      participant_2_email: user.email,
                      last_message: "",
                      last_message_time: new Date().toISOString(),
                      participant_1_unread_count: 0,
                      participant_2_unread_count: 0
                    });
                  }

                  setShowConnectDialog(false);
                  // Navigate to Sync page with conversation ID
                  navigate(createPageUrl(`Sync?conversation=${conversation.id}`));
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
              {isConnecting ? "Syncing..." : "Yes, Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default UserCard;