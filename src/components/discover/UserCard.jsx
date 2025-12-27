import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { MessageCircle, Wrench, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
        <div className="relative h-24 bg-gradient-to-r from-purple-500 to-indigo-500">
          {user.cover_image && (
            <img src={user.cover_image} alt="Cover" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-10" />
        </div>
        <CardContent className="p-5 flex flex-col flex-grow items-center text-center -mt-12">
          <Link to={profileUrl} className="mb-3">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg hover:border-purple-300 transition-all duration-300">
              <AvatarImage src={user.profile_image} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-xl font-bold">
                {user.full_name?.[0] || user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
            
          <div className="flex items-center gap-2 justify-center">
            <Link to={profileUrl} className="font-bold text-lg text-gray-900 hover:text-purple-600 transition-colors mb-1">
              {user.full_name || 'Anonymous'}
            </Link>
            {isActive && (
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full mb-1" title="Active now" />
            )}
          </div>
          
          {user.username && (
            <span className="text-sm text-gray-500 mb-3">@{user.username}</span>
          )}
          
          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{user.bio}</p>
          )}
          
          {/* Skills, Interests, Tools Display */}
          <div className="w-full space-y-2 mb-4 text-left">
            {user.skills && user.skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {user.skills.slice(0, 3).map(skill => (
                    <Badge key={skill} className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                      {skill}
                    </Badge>
                  ))}
                  {user.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{user.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {user.interests && user.interests.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Interests</p>
                <div className="flex flex-wrap gap-1">
                  {user.interests.slice(0, 3).map(interest => (
                    <Badge key={interest} className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200">
                      {interest}
                    </Badge>
                  ))}
                  {user.interests.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{user.interests.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {user.tools_technologies && user.tools_technologies.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Tools</p>
                <div className="flex flex-wrap gap-1">
                  {user.tools_technologies.slice(0, 3).map(tool => (
                    <Badge key={tool} className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                      {tool}
                    </Badge>
                  ))}
                  {user.tools_technologies.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{user.tools_technologies.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Chat Button */}
          <Button 
            onClick={() => setShowConnectDialog(true)}
            disabled={!currentUser}
            className="mt-auto cu-button w-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </CardContent>
      </Card>

      {/* Chat Confirmation Dialog */}
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
                  // Navigate to Chat page with conversation ID
                  navigate(`${createPageUrl('Chat')}?conversation=${conversation.id}`);
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
    </motion.div>
  );
};

export default UserCard;