import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Search, Plus, Users, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { getAllPublicUserProfiles } from "@/functions/getAllPublicUserProfiles";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ConfirmationDialog from "@/components/ConfirmationDialog";

export default function Chat({ currentUser, authIsLoading }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [showDeleteConversationDialog, setShowDeleteConversationDialog] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Use React Query for conversations with real-time polling
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['conversations', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return { conversations: [], userProfiles: {} };

      const [conv1, conv2] = await Promise.all([
        base44.entities.Conversation.filter({
          participant_1_email: currentUser.email
        }, "-last_message_time"),
        base44.entities.Conversation.filter({
          participant_2_email: currentUser.email
        }, "-last_message_time")
      ]);

      const allConversations = [...conv1, ...conv2];
      const uniqueConversations = allConversations.reduce((acc, current) => {
        if (!acc.find(item => item.id === current.id)) {
          acc.push(current);
        }
        return acc;
      }, []);

      uniqueConversations.sort((a, b) => 
        new Date(b.last_message_time || b.created_date) - new Date(a.last_message_time || a.created_date)
      );

      // Fetch user profiles for all conversation participants
      const otherEmails = uniqueConversations.map(conv => 
        conv.participant_1_email === currentUser.email 
          ? conv.participant_2_email 
          : conv.participant_1_email
      );
      
      let profilesMap = {};
      if (otherEmails.length > 0) {
        try {
          const { data: profiles } = await getPublicUserProfiles({ emails: otherEmails });
          (profiles || []).forEach(profile => {
            profilesMap[profile.email] = profile;
          });
        } catch (error) {
          console.error("Error fetching user profiles:", error);
        }
      }

      // Filter out conversations where the other user no longer exists
      const validConversations = uniqueConversations.filter(conv => {
        const otherEmail = conv.participant_1_email === currentUser.email 
          ? conv.participant_2_email 
          : conv.participant_1_email;
        return profilesMap[otherEmail]; // Only keep conversations where we found the user profile
      });

      return { 
        conversations: validConversations, 
        userProfiles: profilesMap 
      };
    },
    enabled: !authIsLoading && !!currentUser,
    initialData: { conversations: [], userProfiles: {} },
    staleTime: 10 * 1000, // 10 seconds for chat (needs to be fresh)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5000, // Poll every 5 seconds for new messages
    refetchOnWindowFocus: true,
  });

  const conversations = conversationsData?.conversations || [];
  const userProfiles = conversationsData?.userProfiles || {};

  // Load messages when conversation is selected - LOCAL LOADING
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    
    try {
      const msgs = await base44.entities.Message.filter({
        conversation_id: conversation.id
      }, "created_date");

      setMessages(msgs || []);

      const unreadMessages = msgs.filter(msg => 
        msg.sender_email !== currentUser.email && !msg.is_read
      );

      if (unreadMessages.length > 0) {
        // Mark as read without blocking UI
        Promise.all(unreadMessages.map(msg => 
          base44.entities.Message.update(msg.id, {
            is_read: true,
            read_at: new Date().toISOString()
          })
        )).catch(err => console.error("Error marking messages as read:", err));

        const isParticipant1 = conversation.participant_1_email === currentUser.email;
        base44.entities.Conversation.update(conversation.id, {
          [isParticipant1 ? 'participant_1_unread_count' : 'participant_2_unread_count']: 0
        }).catch(err => console.error("Error updating unread count:", err));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Handle deep linking from notifications
  useEffect(() => {
    if (!currentUser || conversations.length === 0) return;

    const params = new URLSearchParams(location.search);
    const conversationId = params.get('conversation');
    
    if (conversationId) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        handleSelectConversation(conversation);
        navigate(createPageUrl('Chat'), { replace: true });
      }
    }
  }, [currentUser, conversations, location.search]);

  // Fetch messages for the selected conversation
  const fetchMessages = async (conversationId) => {
    try {
      const msgs = await base44.entities.Message.filter({
        conversation_id: conversationId
      }, "created_date");
      setMessages(msgs || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const createdMessage = await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        sender_email: currentUser.email,
        content: messageContent,
        is_read: false
      });

      // Optimistically add message to local state
      setMessages(prev => [...prev, createdMessage]);

      const isParticipant1 = selectedConversation.participant_1_email === currentUser.email;
      const otherParticipantUnreadField = isParticipant1 
        ? 'participant_2_unread_count' 
        : 'participant_1_unread_count';
      const otherParticipantEmail = isParticipant1
        ? selectedConversation.participant_2_email
        : selectedConversation.participant_1_email;

      // Update conversation without awaiting
      base44.entities.Conversation.update(selectedConversation.id, {
        last_message: messageContent.substring(0, 100),
        last_message_time: new Date().toISOString(),
        [otherParticipantUnreadField]: (selectedConversation[otherParticipantUnreadField] || 0) + 1
      }).catch(err => console.error("Error updating conversation:", err));

      // Create notification without awaiting
      base44.entities.Notification.create({
        user_email: otherParticipantEmail,
        title: `New message from ${currentUser.full_name}`,
        message: messageContent.substring(0, 100),
        type: 'direct_message',
        related_entity_id: selectedConversation.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        metadata: {
          conversation_id: selectedConversation.id,
          sender_profile_image: currentUser.profile_image,
          message_preview: messageContent.substring(0, 100)
        }
      }).catch(err => console.error("Error creating notification:", err));

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    setIsDeleting(true);
    try {
      await base44.entities.Message.delete(messageToDelete.id);
      
      // Update local state
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
      
      // Update conversation last message if this was the last message
      const remainingMessages = messages.filter(m => m.id !== messageToDelete.id);
      if (remainingMessages.length > 0) {
        const lastMsg = remainingMessages[remainingMessages.length - 1];
        await base44.entities.Conversation.update(selectedConversation.id, {
          last_message: lastMsg.content.substring(0, 100),
          last_message_time: lastMsg.created_date
        });
      } else {
        await base44.entities.Conversation.update(selectedConversation.id, {
          last_message: "",
          last_message_time: new Date().toISOString()
        });
      }

      setShowDeleteDialog(false);
      setMessageToDelete(null);
      queryClient.invalidateQueries(['conversations']);
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle conversation deletion (only for conversations with no messages)
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);
    try {
      // Check if conversation has messages
      const msgs = await base44.entities.Message.filter({
        conversation_id: conversationToDelete.id
      });

      if (msgs && msgs.length > 0) {
        toast.error("Cannot delete conversations with messages");
        setShowDeleteConversationDialog(false);
        setConversationToDelete(null);
        setIsDeleting(false);
        return;
      }

      // Delete the conversation
      await base44.entities.Conversation.delete(conversationToDelete.id);
      
      // Clear selected conversation if it was the one being deleted
      if (selectedConversation?.id === conversationToDelete.id) {
        setSelectedConversation(null);
        setMessages([]);
      }

      queryClient.invalidateQueries(['conversations']);
      setShowDeleteConversationDialog(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setIsDeleting(false);
    }
  };

  // Start a new conversation
  const handleStartConversation = async (otherUser) => {
    try {
      const existingConv1 = await base44.entities.Conversation.filter({
        participant_1_email: currentUser.email,
        participant_2_email: otherUser.email
      });

      const existingConv2 = await base44.entities.Conversation.filter({
        participant_1_email: otherUser.email,
        participant_2_email: currentUser.email
      });

      let conversation;
      if (existingConv1.length > 0) {
        conversation = existingConv1[0];
      } else if (existingConv2.length > 0) {
        conversation = existingConv2[0];
      } else {
        conversation = await base44.entities.Conversation.create({
          participant_1_email: currentUser.email,
          participant_2_email: otherUser.email,
          last_message: "",
          last_message_time: new Date().toISOString(),
          participant_1_unread_count: 0,
          participant_2_unread_count: 0
        });
      }

      setShowNewChatDialog(false);
      queryClient.invalidateQueries(['conversations']);
      handleSelectConversation(conversation);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  // Load all users for new chat dialog
  const handleOpenNewChatDialog = async () => {
    setShowNewChatDialog(true);
    setIsLoadingUsers(true);
    try {
      const { data: users } = await getAllPublicUserProfiles();
      const filteredUsers = users.filter(u => u.email !== currentUser.email);
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Get other participant info
  const getOtherParticipant = (conversation) => {
    const otherEmail = conversation.participant_1_email === currentUser.email
      ? conversation.participant_2_email
      : conversation.participant_1_email;
    
    return userProfiles[otherEmail] || {
      email: otherEmail,
      full_name: otherEmail.split('@')[0],
      profile_image: null
    };
  };

  // Get unread count for current user
  const getUnreadCount = (conversation) => {
    const isParticipant1 = conversation.participant_1_email === currentUser.email;
    return isParticipant1 
      ? conversation.participant_1_unread_count 
      : conversation.participant_2_unread_count;
  };

  // Filter users for search
  const filteredUsers = allUsers.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authIsLoading || isLoading) {
    return (
      <div className="cu-container py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="cu-container py-8">
        <div className="text-center py-16">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to chat</h2>
          <p className="text-gray-600 mb-6">Connect with other users on Collab Unity</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="cu-button">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cu-container py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="w-8 h-8 mr-3 text-purple-600" />
                Chat
              </h1>
              <p className="text-gray-600 mt-1">Chat with collaborators and community members</p>
            </div>
            <Button className="cu-button" onClick={handleOpenNewChatDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="cu-card lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Messages</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">No conversations yet</p>
                    <p className="text-gray-400 text-xs mt-1">Start chatting with your collaborators!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conv) => {
                      const otherUser = getOtherParticipant(conv);
                      const unreadCount = getUnreadCount(conv);
                      const hasNoMessages = !conv.last_message || conv.last_message.trim() === "";
                      
                      return (
                        <div
                          key={conv.id}
                          className={`w-full p-4 hover:bg-gray-50 transition-colors flex items-start space-x-3 group ${
                            selectedConversation?.id === conv.id ? 'bg-purple-50' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleSelectConversation(conv)}
                            className="flex-1 flex items-start space-x-3 text-left"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={otherUser.profile_image} />
                              <AvatarFallback className="bg-purple-100 text-purple-600">
                                {otherUser.full_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 py-1 pr-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-gray-900 truncate">
                                  {otherUser.full_name}
                                </p>
                                {unreadCount > 0 && (
                                  <Badge className="bg-purple-600 text-white ml-2">
                                    {unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-1">
                                {conv.last_message || "Start a conversation"}
                              </p>
                              {conv.last_message_time && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                                </p>
                              )}
                            </div>
                          </button>
                          {hasNoMessages && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setConversationToDelete(conv);
                                setShowDeleteConversationDialog(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2"
                              title="Delete conversation"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="cu-card lg:col-span-2">
            {!selectedConversation ? (
              <div className="flex items-center justify-center h-[680px]">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation from the left to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getOtherParticipant(selectedConversation).profile_image} />
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {getOtherParticipant(selectedConversation).full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getOtherParticipant(selectedConversation).full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        @{getOtherParticipant(selectedConversation).username || getOtherParticipant(selectedConversation).email.split('@')[0]}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <ScrollArea className="h-[500px] p-4">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Loading messages...</p>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {messages.map((message, index) => {
                          const isOwn = message.sender_email === currentUser.email;
                          const senderProfile = userProfiles[message.sender_email] || {
                            full_name: message.sender_email.split('@')[0],
                            profile_image: null
                          };

                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
                            >
                              <div className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                {!isOwn && (
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={senderProfile.profile_image} />
                                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                      {senderProfile.full_name?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="relative">
                                  <div className={`rounded-2xl px-4 py-2 ${
                                    isOwn 
                                      ? 'bg-purple-600 text-white' 
                                      : 'bg-gray-100 text-gray-900'
                                  }`}>
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                  </div>
                                  <div className="flex items-center justify-between mt-1 px-2">
                                    <p className="text-xs text-gray-400">
                                      {formatDistanceToNow(new Date(message.created_date), { addSuffix: true })}
                                    </p>
                                    {isOwn && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setMessageToDelete(message);
                                          setShowDeleteDialog(true);
                                        }}
                                        className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  <div className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={!newMessage.trim() || isSending}
                        className="cu-button"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Message Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteMessage}
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* Delete Conversation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConversationDialog}
        onOpenChange={setShowDeleteConversationDialog}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This will permanently remove it from your messages."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConversation}
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a New Conversation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search collaborators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[400px]">
              {isLoadingUsers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No collaborators found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.email}
                      onClick={() => handleStartConversation(user)}
                      className="w-full p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3 text-left"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {user.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.full_name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          @{user.username || user.email.split('@')[0]}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}