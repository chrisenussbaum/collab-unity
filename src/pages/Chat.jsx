import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Search, Plus, Users, Trash2, Smile, MoreVertical, Settings, ArrowLeft, ArrowDown } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { getAllPublicUserProfiles } from "@/functions/getAllPublicUserProfiles";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import MessageBubble from "@/components/chat/MessageBubble";
import MediaAttachmentButton from "@/components/chat/MediaAttachmentButton";
import NewGroupChatDialog from "@/components/chat/NewGroupChatDialog";
import GroupSettingsDialog from "@/components/chat/GroupSettingsDialog";
import TypingIndicator from "@/components/chat/TypingIndicator";
import VideoCallButton from "@/components/chat/VideoCallButton";
import PresenceIndicator from "@/components/chat/PresenceIndicator";
import EmojiPicker from "emoji-picker-react";
import ConversationSkeleton from "@/components/skeletons/ConversationSkeleton";

export default function Chat({ currentUser, authIsLoading }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [showDeleteConversationDialog, setShowDeleteConversationDialog] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const prevMessagesLengthRef = useRef(0);
  const shouldScrollRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef(null);

  const scrollToBottom = (behavior = "auto") => {
    // Use requestAnimationFrame to ensure DOM is updated before scrolling
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  };

  // Scroll when new messages are added OR when explicitly triggered
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current || shouldScrollRef.current) {
      scrollToBottom();
      shouldScrollRef.current = false;
      setShowScrollButton(false);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Detect scroll position to show/hide scroll button
  const handleScroll = (e) => {
    const element = e.target;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll for typing indicators
  useEffect(() => {
    if (!selectedConversation || !currentUser) return;

    const pollTyping = async () => {
      try {
        const cutoffTime = new Date(Date.now() - 5000).toISOString();
        const indicators = await base44.entities.TypingIndicator.filter({
          conversation_id: selectedConversation.id,
          last_typing_at: { $gte: cutoffTime }
        });

        const typingUserNames = indicators
          .filter(ind => ind.user_email !== currentUser.email)
          .map(ind => ind.user_name);

        setTypingUsers(typingUserNames);
      } catch (error) {
        console.error("Error fetching typing indicators:", error);
      }
    };

    const interval = setInterval(pollTyping, 2000);
    return () => clearInterval(interval);
  }, [selectedConversation, currentUser]);

  // Real-time subscription for conversation updates
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = base44.entities.Conversation.subscribe((event) => {
      // Only refetch if this is a conversation the current user is part of
      if (event.type === 'create' || event.type === 'update') {
        const conversation = event.data;
        
        // Check if current user is part of this conversation
        const isParticipant = 
          conversation.conversation_type === 'group'
            ? conversation.participants?.includes(currentUser.email)
            : conversation.participant_1_email === currentUser.email || 
              conversation.participant_2_email === currentUser.email;
        
        // Only refetch if user is part of the conversation AND it's not the currently selected one
        // (to avoid overwriting optimistic updates)
        if (isParticipant && (!selectedConversation || selectedConversation.id !== conversation.id)) {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      }
    });

    return unsubscribe;
  }, [currentUser, queryClient, selectedConversation]);

  // Use React Query for conversations with real-time polling
  const { data: conversationsData, isLoading, isFetching } = useQuery({
    queryKey: ['conversations', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return { conversations: [], userProfiles: {} };

      // Fetch direct chats (backward compatible - works with old conversations too)
      const [conv1, conv2] = await Promise.all([
        base44.entities.Conversation.filter({
          participant_1_email: currentUser.email
        }, "-last_message_time"),
        base44.entities.Conversation.filter({
          participant_2_email: currentUser.email
        }, "-last_message_time")
      ]);

      // Fetch group chats
      const groupChats = await base44.entities.Conversation.filter({
        conversation_type: "group"
      }, "-last_message_time").then(chats => 
        chats.filter(chat => chat.participants?.includes(currentUser.email))
      );

      const allConversations = [...conv1, ...conv2, ...groupChats];
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
      const participantEmails = new Set();
      
      uniqueConversations.forEach(conv => {
        if (conv.conversation_type === 'group' && conv.participants) {
          conv.participants.forEach(email => participantEmails.add(email));
        } else {
          const otherEmail = conv.participant_1_email === currentUser.email 
            ? conv.participant_2_email 
            : conv.participant_1_email;
          if (otherEmail) participantEmails.add(otherEmail);
        }
      });
      
      let profilesMap = {};
      const emailsArray = Array.from(participantEmails);
      if (emailsArray.length > 0) {
        try {
          const { data: profiles } = await getPublicUserProfiles({ emails: emailsArray });
          (profiles || []).forEach(profile => {
            profilesMap[profile.email] = profile;
          });
        } catch (error) {
          console.error("Error fetching user profiles:", error);
        }
      }

      // Filter out invalid conversations
      const validConversations = uniqueConversations.filter(conv => {
        if (conv.conversation_type === 'group') {
          return conv.participants && conv.participants.length >= 2;
        }
        const otherEmail = conv.participant_1_email === currentUser.email 
          ? conv.participant_2_email 
          : conv.participant_1_email;
        return profilesMap[otherEmail];
      });

      return { 
        conversations: validConversations, 
        userProfiles: profilesMap 
      };
    },
    enabled: !authIsLoading && !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false, // Rely on real-time subscription instead
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  });

  const conversations = conversationsData?.conversations || [];
  const userProfiles = conversationsData?.userProfiles || {};

  // Load messages when conversation is selected
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    
    // Optimistically update the unread count in local state
    queryClient.setQueryData(['conversations', currentUser?.email], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        conversations: oldData.conversations.map(conv => {
          if (conv.id === conversation.id) {
            if (conv.conversation_type === 'group') {
              return {
                ...conv,
                unread_counts: {
                  ...(conv.unread_counts || {}),
                  [currentUser.email]: 0
                }
              };
            } else {
              const isParticipant1 = conv.participant_1_email === currentUser.email;
              return {
                ...conv,
                [isParticipant1 ? 'participant_1_unread_count' : 'participant_2_unread_count']: 0
              };
            }
          }
          return conv;
        })
      };
    });
    
    try {
      const msgs = await base44.entities.Message.filter({
        conversation_id: conversation.id
      }, "created_date");

      setMessages(msgs || []);
      
      // Trigger scroll when messages are loaded
      shouldScrollRef.current = true;

      // Mark messages as read and clear notifications
      const unreadMessages = msgs.filter(msg => 
        msg.sender_email !== currentUser.email && 
        (!msg.is_read || (msg.read_by && !msg.read_by.includes(currentUser.email)))
      );

      if (unreadMessages.length > 0) {
        // Mark all messages as read
        await Promise.all(unreadMessages.map(msg => {
          const updateData = conversation.conversation_type === 'group'
            ? { read_by: [...(msg.read_by || []), currentUser.email] }
            : { is_read: true, read_at: new Date().toISOString() };
          
          return base44.entities.Message.update(msg.id, updateData);
        }));

        // Update conversation unread count to 0
        if (conversation.conversation_type === 'group') {
          const unreadCounts = { ...(conversation.unread_counts || {}) };
          unreadCounts[currentUser.email] = 0;
          await base44.entities.Conversation.update(conversation.id, { unread_counts: unreadCounts });
        } else {
          const isParticipant1 = conversation.participant_1_email === currentUser.email;
          await base44.entities.Conversation.update(conversation.id, {
            [isParticipant1 ? 'participant_1_unread_count' : 'participant_2_unread_count']: 0
          });
        }

        // Mark related notifications as read
        try {
          const notifications = await base44.entities.Notification.filter({
            user_email: currentUser.email,
            type: 'direct_message',
            read: false
          });

          // Filter for this conversation and mark all as read
          const conversationNotifs = notifications.filter(n => 
            n.metadata?.conversation_id === conversation.id
          );

          if (conversationNotifs.length > 0) {
            // Mark all notifications as read in parallel for faster processing
            await Promise.all(
              conversationNotifs.map(notif => 
                base44.entities.Notification.update(notif.id, { read: true })
              )
            );
          }
        } catch (err) {
          console.error("Error marking notifications as read:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Handle deep linking from notifications
  useEffect(() => {
    if (!currentUser || isLoading) return;

    const params = new URLSearchParams(location.search);
    const conversationId = params.get('conversation');
    
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation && (!selectedConversation || selectedConversation.id !== conversationId)) {
        handleSelectConversation(conversation);
        navigate(createPageUrl('Chat'), { replace: true });
      }
    }
  }, [currentUser, conversations, location.search, isLoading]);

  // Handle typing indicator
  const handleTyping = async () => {
    if (!selectedConversation || !currentUser || isTyping) return;

    setIsTyping(true);

    try {
      // Find or create typing indicator
      const existing = await base44.entities.TypingIndicator.filter({
        conversation_id: selectedConversation.id,
        user_email: currentUser.email
      });

      if (existing.length > 0) {
        await base44.entities.TypingIndicator.update(existing[0].id, {
          last_typing_at: new Date().toISOString()
        });
      } else {
        await base44.entities.TypingIndicator.create({
          conversation_id: selectedConversation.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
          last_typing_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error updating typing indicator:", error);
    }

    // Clear typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleMediaSelect = async (file, mediaType) => {
    setIsUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Send message with media
      await sendMessage({
        media_url: file_url,
        media_type: mediaType,
        media_name: file.name,
        media_size: file.size
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      toast.error("Failed to upload media");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle video call initiation
  const handleStartVideoCall = async (videoCallData) => {
    if (!selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const isGroup = selectedConversation.conversation_type === 'group';
      const messageContent = `📹 ${currentUser.full_name || currentUser.email} started a ${videoCallData.platform} call`;

      const messageData = {
        conversation_id: selectedConversation.id,
        sender_email: currentUser.email,
        content: messageContent,
        is_read: false,
        metadata: {
          video_call: videoCallData
        },
        ...(isGroup && {
          read_by: []
        })
      };

      const createdMessage = await base44.entities.Message.create(messageData);
      setMessages(prev => [...prev, createdMessage]);

      // Update conversation
      const conversationUpdate = {
        last_message: messageContent.substring(0, 100),
        last_message_time: new Date().toISOString()
      };

      if (isGroup) {
        const unreadCounts = { ...(selectedConversation.unread_counts || {}) };
        selectedConversation.participants?.forEach(email => {
          if (email !== currentUser.email) {
            unreadCounts[email] = (unreadCounts[email] || 0) + 1;
          }
        });
        conversationUpdate.unread_counts = unreadCounts;

        // Create notifications for all group members
        const notificationPromises = selectedConversation.participants
          ?.filter(email => email !== currentUser.email)
          .map(email => 
            base44.entities.Notification.create({
              user_email: email,
              title: `Video call in ${selectedConversation.group_name || 'Group Chat'}`,
              message: `${currentUser.full_name || currentUser.email} started a ${videoCallData.platform} call`,
              type: 'direct_message',
              related_entity_id: selectedConversation.id,
              actor_email: currentUser.email,
              actor_name: currentUser.full_name || currentUser.email,
              read: false,
              metadata: {
                conversation_id: selectedConversation.id,
                sender_profile_image: currentUser.profile_image,
                message_preview: messageContent,
                is_group: true,
                group_name: selectedConversation.group_name
              }
            })
          );

        Promise.all([
          base44.entities.Conversation.update(selectedConversation.id, conversationUpdate),
          ...(notificationPromises || [])
        ]).catch(err => console.error("Error in background updates:", err));

      } else {
        const isParticipant1 = selectedConversation.participant_1_email === currentUser.email;
        const otherParticipantUnreadField = isParticipant1 
          ? 'participant_2_unread_count' 
          : 'participant_1_unread_count';
        const otherParticipantEmail = isParticipant1
          ? selectedConversation.participant_2_email
          : selectedConversation.participant_1_email;

        conversationUpdate[otherParticipantUnreadField] = 
          (selectedConversation[otherParticipantUnreadField] || 0) + 1;

        Promise.all([
          base44.entities.Conversation.update(selectedConversation.id, conversationUpdate),
          base44.entities.Notification.create({
            user_email: otherParticipantEmail,
            title: `Video call from ${currentUser.full_name || currentUser.email}`,
            message: `Started a ${videoCallData.platform} call`,
            type: 'direct_message',
            related_entity_id: selectedConversation.id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            read: false,
            metadata: {
              conversation_id: selectedConversation.id,
              sender_profile_image: currentUser.profile_image,
              message_preview: messageContent
            }
          })
        ]).catch(err => console.error("Error in background updates:", err));
      }

      toast.success('Video call link shared');
    } catch (error) {
      console.error("Error starting video call:", error);
      toast.error("Failed to share video call link");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  // Handle sending a message
  const sendMessage = async (mediaData = null) => {
    if ((!newMessage.trim() && !mediaData) || !selectedConversation || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    if (!mediaData) setNewMessage("");

    try {
      const messageData = {
        conversation_id: selectedConversation.id,
        sender_email: currentUser.email,
        content: messageContent,
        is_read: false,
        ...(mediaData && {
          media_url: mediaData.media_url,
          media_type: mediaData.media_type,
          media_name: mediaData.media_name,
          media_size: mediaData.media_size
        }),
        ...(selectedConversation.conversation_type === 'group' && {
          read_by: []
        })
      };

      const createdMessage = await base44.entities.Message.create(messageData);

      // Optimistically add message to local state
      setMessages(prev => [...prev, createdMessage]);

      const isGroup = selectedConversation.conversation_type === 'group';

      // Update conversation
      const lastMessagePreview = messageContent || 
        (mediaData?.media_type === 'image' ? '📷 Image' : 
         mediaData?.media_type === 'video' ? '🎥 Video' : 
         mediaData?.media_type === 'file' ? `📎 ${mediaData.media_name}` : '');

      const conversationUpdate = {
        last_message: lastMessagePreview.substring(0, 100),
        last_message_time: new Date().toISOString()
      };

      if (isGroup) {
        const unreadCounts = { ...(selectedConversation.unread_counts || {}) };
        selectedConversation.participants?.forEach(email => {
          if (email !== currentUser.email) {
            unreadCounts[email] = (unreadCounts[email] || 0) + 1;
          }
        });
        conversationUpdate.unread_counts = unreadCounts;

        // Notifications are handled by the "Notify on New Message" automation
        base44.entities.Conversation.update(selectedConversation.id, conversationUpdate)
          .catch(err => console.error("Error updating conversation:", err));

      } else {
        const isParticipant1 = selectedConversation.participant_1_email === currentUser.email;
        const otherParticipantUnreadField = isParticipant1 
          ? 'participant_2_unread_count' 
          : 'participant_1_unread_count';

        conversationUpdate[otherParticipantUnreadField] = 
          (selectedConversation[otherParticipantUnreadField] || 0) + 1;

        // Notifications are handled by the "Notify on New Message" automation
        base44.entities.Conversation.update(selectedConversation.id, conversationUpdate)
          .then(() => queryClient.invalidateQueries({ queryKey: ['conversations'] }))
          .catch(err => console.error("Error updating conversation:", err));
      }

      // Optimistically update the conversation list in the sidebar
      queryClient.setQueryData(['conversations', currentUser?.email], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          conversations: oldData.conversations
            .map(conv => {
              if (conv.id !== selectedConversation.id) return conv;
              return { ...conv, ...conversationUpdate };
            })
            .sort((a, b) =>
              new Date(b.last_message_time || b.created_date) - new Date(a.last_message_time || a.created_date)
            )
        };
      });

      // Also update the selectedConversation ref so subsequent messages use the latest unread counts
      setSelectedConversation(prev => prev ? { ...prev, ...conversationUpdate } : prev);

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      if (!mediaData) setNewMessage(messageContent);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    await sendMessage();
  };

  // Handle message deletion
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    setIsDeleting(true);
    try {
      await base44.entities.Message.delete(messageToDelete.id);
      
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
      
      const remainingMessages = messages.filter(m => m.id !== messageToDelete.id);
      if (remainingMessages.length > 0) {
        const lastMsg = remainingMessages[remainingMessages.length - 1];
        await base44.entities.Conversation.update(selectedConversation.id, {
          last_message: lastMsg.content?.substring(0, 100) || '',
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

  // Handle conversation deletion
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);
    try {
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

      await base44.entities.Conversation.delete(conversationToDelete.id);
      
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

  // Start a new direct conversation
  const handleStartConversation = async (otherUser) => {
    try {
      const existingConv1 = await base44.entities.Conversation.filter({
        conversation_type: "direct",
        participant_1_email: currentUser.email,
        participant_2_email: otherUser.email
      });

      const existingConv2 = await base44.entities.Conversation.filter({
        conversation_type: "direct",
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
          conversation_type: "direct",
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

  // Create group chat
  const handleCreateGroup = async ({ groupName, groupImage, participants }) => {
    try {
      const participantEmails = [currentUser.email, ...participants.map(u => u.email)];
      const unreadCounts = {};
      participantEmails.forEach(email => {
        unreadCounts[email] = 0;
      });

      const conversation = await base44.entities.Conversation.create({
        conversation_type: "group",
        group_name: groupName,
        group_image: groupImage || "",
        participants: participantEmails,
        admin_emails: [currentUser.email],
        last_message: "",
        last_message_time: new Date().toISOString(),
        unread_counts: unreadCounts
      });

      // Send notifications to all group members
      await Promise.all(
        participants.map(user =>
          base44.entities.Notification.create({
            user_email: user.email,
            title: "Added to Group Chat",
            message: `${currentUser.full_name || currentUser.email} added you to "${groupName}"`,
            type: 'direct_message',
            related_entity_id: conversation.id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            read: false,
            metadata: {
              conversation_id: conversation.id,
              is_group: true,
              group_name: groupName
            }
          })
        )
      );

      setShowNewGroupDialog(false);
      queryClient.invalidateQueries(['conversations']);
      handleSelectConversation(conversation);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
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

  const handleOpenNewGroupDialog = async () => {
    setShowNewGroupDialog(true);
    if (allUsers.length === 0) {
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
    }
  };

  // Get conversation display info
  const getConversationInfo = (conversation) => {
    if (conversation.conversation_type === 'group') {
      return {
        name: conversation.group_name || 'Group Chat',
        image: conversation.group_image,
        isGroup: true,
        participantCount: conversation.participants?.length || 0
      };
    }

    const otherEmail = conversation.participant_1_email === currentUser.email
      ? conversation.participant_2_email
      : conversation.participant_1_email;
    
    const otherUser = userProfiles[otherEmail] || {
      email: otherEmail,
      full_name: otherEmail.split('@')[0],
      profile_image: null
    };

    return {
      name: otherUser.full_name,
      image: otherUser.profile_image,
      username: otherUser.username || otherEmail.split('@')[0],
      isGroup: false
    };
  };

  // Get unread count for current user
  const getUnreadCount = (conversation) => {
    if (conversation.conversation_type === 'group') {
      return conversation.unread_counts?.[currentUser.email] || 0;
    }
    const isParticipant1 = conversation.participant_1_email === currentUser.email;
    return isParticipant1 
      ? conversation.participant_1_unread_count 
      : conversation.participant_2_unread_count;
  };

  // Filter conversations by search
  const handleUpdateGroup = async (updateData) => {
    if (!selectedConversation) return;

    try {
      await base44.entities.Conversation.update(selectedConversation.id, updateData);
      
      // Update local state
      setSelectedConversation(prev => ({ ...prev, ...updateData }));
      
      queryClient.invalidateQueries(['conversations']);
    } catch (error) {
      console.error("Error updating group:", error);
      throw error;
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedConversation) return;

    try {
      const updatedParticipants = selectedConversation.participants.filter(
        email => email !== currentUser.email
      );
      const updatedAdmins = selectedConversation.admin_emails?.filter(
        email => email !== currentUser.email
      ) || [];
      const unreadCounts = { ...(selectedConversation.unread_counts || {}) };
      delete unreadCounts[currentUser.email];

      await base44.entities.Conversation.update(selectedConversation.id, {
        participants: updatedParticipants,
        admin_emails: updatedAdmins,
        unread_counts: unreadCounts
      });

      setShowGroupSettings(false);
      setSelectedConversation(null);
      setMessages([]);
      queryClient.invalidateQueries(['conversations']);
      toast.success("Left group successfully");
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Failed to leave group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedConversation) return;

    try {
      // Delete all messages first
      const msgs = await base44.entities.Message.filter({
        conversation_id: selectedConversation.id
      });

      if (msgs.length > 0) {
        await Promise.all(msgs.map(msg => base44.entities.Message.delete(msg.id)));
      }

      // Delete the conversation
      await base44.entities.Conversation.delete(selectedConversation.id);

      setShowGroupSettings(false);
      setSelectedConversation(null);
      setMessages([]);
      queryClient.invalidateQueries(['conversations']);
      toast.success("Group deleted successfully");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const info = getConversationInfo(conv);
    return info.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (authIsLoading || isLoading) {
    return (
      <div className="cu-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="cu-card lg:col-span-1">
            <CardContent className="p-0">
              <div className="divide-y">
                {[...Array(6)].map((_, i) => (
                  <ConversationSkeleton key={i} />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="cu-card lg:col-span-2">
            <div className="flex items-center justify-center h-[680px]">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          </Card>
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

  const selectedInfo = selectedConversation ? getConversationInfo(selectedConversation) : null;

  return (
    <>
      <div className="cu-container py-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="w-8 h-8 mr-3 text-purple-600" />
              Chat
            </h1>
            <p className="text-gray-600 mt-1">Messages and group conversations</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button className="cu-button" onClick={handleOpenNewChatDialog}>
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
            <Button variant="outline" onClick={handleOpenNewGroupDialog}>
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Group</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className={`cu-card lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : ''}`}>
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {isLoading ? (
                  <div className="divide-y">
                    {[...Array(4)].map((_, i) => (
                      <ConversationSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">No conversations yet</p>
                    <p className="text-gray-400 text-xs mt-1">Start chatting!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => {
                      const info = getConversationInfo(conv);
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
                           className="flex-1 flex items-start space-x-3 text-left min-w-0 overflow-hidden"
                          >
                           <div className="relative flex-shrink-0">
                             <Avatar className="w-10 h-10">
                               <AvatarImage src={info.image} />
                               <AvatarFallback className="bg-purple-100 text-purple-600">
                                 {info.isGroup ? <Users className="w-5 h-5" /> : info.name?.[0] || 'U'}
                               </AvatarFallback>
                             </Avatar>
                             {info.isGroup ? (
                               <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                                 <Users className="w-3 h-3 text-white" />
                               </div>
                             ) : (
                               <div className="absolute -bottom-0.5 -right-0.5">
                                 <PresenceIndicator 
                                   lastActive={userProfiles[conv.participant_1_email === currentUser.email ? conv.participant_2_email : conv.participant_1_email]?.last_active}
                                   size="small"
                                 />
                               </div>
                             )}
                           </div>
                            <div className="flex-1 min-w-0 py-1 overflow-hidden max-w-full">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-medium text-gray-900 truncate flex-1 min-w-0">
                                  {info.name}
                                </p>
                                {unreadCount > 0 && (
                                  <Badge className="bg-purple-600 text-white flex-shrink-0">
                                    {unreadCount}
                                  </Badge>
                                )}
                              </div>
                              {info.isGroup && (
                                <p className="text-xs text-gray-500 mb-1">
                                  {info.participantCount} members
                                </p>
                              )}
                              <p 
                                className="text-sm text-gray-600 w-full overflow-hidden"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {conv.last_message || "Start a conversation"}
                              </p>
                              {conv.last_message_time && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {(() => {
                                    try {
                                      const messageDate = new Date(conv.last_message_time);
                                      const now = new Date();
                                      // Only format if the date is valid and not in the future
                                      if (messageDate <= now) {
                                        return formatDistanceToNow(messageDate, { addSuffix: true });
                                      }
                                      return 'Just now';
                                    } catch (e) {
                                      return '';
                                    }
                                  })()}
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
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 flex-shrink-0"
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
          <Card className={`cu-card lg:col-span-2 ${!selectedConversation ? 'hidden lg:block' : ''}`}>
            {!selectedConversation ? (
              <div className="flex items-center justify-center h-[680px]">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedInfo.image} />
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            {selectedInfo.isGroup ? <Users className="w-5 h-5" /> : selectedInfo.name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {!selectedInfo.isGroup && (
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <PresenceIndicator 
                              lastActive={userProfiles[selectedConversation.participant_1_email === currentUser.email ? selectedConversation.participant_2_email : selectedConversation.participant_1_email]?.last_active}
                              size="default"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedInfo.name}
                        </h3>
                        {selectedInfo.isGroup ? (
                          <p className="text-sm text-gray-500">
                            {selectedInfo.participantCount} members
                          </p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-500">
                              @{selectedInfo.username}
                            </p>
                            <PresenceIndicator 
                              lastActive={userProfiles[selectedConversation.participant_1_email === currentUser.email ? selectedConversation.participant_2_email : selectedConversation.participant_1_email]?.last_active}
                              showLabel
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <VideoCallButton 
                        onStartCall={handleStartVideoCall}
                        disabled={isSending || isUploadingMedia}
                      />
                      {selectedInfo.isGroup && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowGroupSettings(true)}>
                              <Settings className="w-4 h-4 mr-2" />
                              Group Settings
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 relative">
                  <ScrollArea 
                    className="h-[500px] p-4" 
                    ref={scrollAreaRef}
                    onScrollCapture={handleScroll}
                  >
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

                          // Check if should show avatar (first message from user or different sender than previous)
                          const showAvatar = index === 0 || 
                            messages[index - 1].sender_email !== message.sender_email;

                          const isRead = selectedInfo.isGroup 
                            ? message.read_by && message.read_by.length > 0
                            : message.is_read;

                          return (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              isOwn={isOwn}
                              senderProfile={senderProfile}
                              onDelete={(msg) => {
                                setMessageToDelete(msg);
                                setShowDeleteDialog(true);
                              }}
                              showAvatar={showAvatar}
                              isGroupChat={selectedInfo.isGroup}
                              isRead={isRead}
                            />
                          );
                        })}
                      </AnimatePresence>
                    )}
                    
                    {/* Typing Indicator */}
                    <TypingIndicator users={typingUsers} />
                    
                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  {/* Scroll to Bottom Button */}
                  {showScrollButton && messages.length > 0 && (
                    <button
                      onClick={() => {
                        scrollToBottom("smooth");
                        setShowScrollButton(false);
                      }}
                      className="absolute bottom-20 right-6 z-10 w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
                      title="Scroll to bottom"
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  )}

                  <div className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                      <div className="flex items-center space-x-1">
                        <MediaAttachmentButton 
                          onMediaSelect={handleMediaSelect}
                          isUploading={isUploadingMedia}
                          disabled={isSending}
                        />
                        
                        <div className="relative" ref={emojiPickerRef}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            disabled={isSending}
                            className="text-gray-500 hover:text-purple-600"
                          >
                            <Smile className="w-5 h-5" />
                          </Button>
                          {showEmojiPicker && (
                            <div className="absolute bottom-12 left-0 z-50">
                              <EmojiPicker
                                onEmojiClick={handleEmojiClick}
                                width={320}
                                height={400}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={handleMessageChange}
                        disabled={isSending || isUploadingMedia}
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={(!newMessage.trim() && !isUploadingMedia) || isSending}
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

      {/* New Direct Chat Dialog */}
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
                <div className="space-y-2 p-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : allUsers.filter(user =>
                  user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.username?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No collaborators found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allUsers
                    .filter(user =>
                      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
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

      {/* New Group Chat Dialog */}
      <NewGroupChatDialog
        isOpen={showNewGroupDialog}
        onClose={() => setShowNewGroupDialog(false)}
        allUsers={allUsers}
        currentUser={currentUser}
        onCreateGroup={handleCreateGroup}
        isLoading={isLoadingUsers}
      />

      {/* Group Settings Dialog */}
      <GroupSettingsDialog
        isOpen={showGroupSettings}
        onClose={() => setShowGroupSettings(false)}
        conversation={selectedConversation}
        currentUser={currentUser}
        userProfiles={userProfiles}
        onUpdateGroup={handleUpdateGroup}
        onLeaveGroup={handleLeaveGroup}
        onDeleteGroup={handleDeleteGroup}
        allUsers={allUsers}
      />
    </>
  );
}