import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Notification, User } from '@/entities/all';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Briefcase,
  Users,
  HandHeart,
  MessageCircle,
  Share2,
  Target,
  CheckSquare,
  AlertCircle,
  FileStack,
  Trophy,
  AtSign,
  UserPlus,
  Lightbulb,
  PencilLine,
  UserMinus,
  UserX
} from 'lucide-react';
import { formatDistanceToNow } from "date-fns";

const withRetry = async (apiCall, maxRetries = 4, baseDelay = 3000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000;
        console.warn(`Notifications rate limit hit, retrying in ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

const notificationIcons = {
  project_application: Briefcase,
  project_update: Users,
  general: Bell,
  feed_applaud: HandHeart,
  feed_comment: MessageCircle,
  feed_comment_mention: AtSign,
  feed_share: Share2,
  discussion_comment: MessageCircle,
  discussion_comment_mention: AtSign,
  project_comment: MessageCircle,
  project_task_assigned: CheckSquare,
  project_task_completed: Trophy,
  project_milestone_update: Target,
  project_issue_assigned: AlertCircle,
  project_issue_status_changed: AlertCircle,
  project_asset_upload: FileStack,
  project_wiki_update: Bell,
  project_deliverable_update: Trophy,
  advertisement_approved: CheckCheck,
  advertisement_rejected: AlertCircle,
  advertisement_expired: Bell,
  project_member_added: Users,
  project_status_changed: Target,
  direct_message: MessageCircle,
  collaboration_request: UserPlus,
  project_thought_created: Lightbulb,
  project_ideation_updated: PencilLine,
  project_member_left: UserMinus,
  project_member_removed: UserX
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchNotifications = useCallback(async (user, forceRefresh = false) => {
    if (!user || isLoading || !isMounted.current) return;
    
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 3000) {
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await withRetry(() =>
        Notification.filter({ user_email: user.email }, "-created_date", 10)
      );
      
      if (!isMounted.current) return;
      
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
        setLastFetchTime(now);
      }
    } catch (e) {
      if (!isMounted.current) return;
      
      console.error("Failed to fetch notifications", e);
      if (e.response?.status === 429) {
        console.warn("Notifications rate limited, will retry later");
      } else {
        console.error("Notification fetch error:", e);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isLoading, lastFetchTime]);

  useEffect(() => {
    let mounted = true;
    
    User.me().then(user => {
      if (mounted && isMounted.current) {
        setCurrentUser(user);
        fetchNotifications(user);
      }
    }).catch(() => {
      if (mounted && isMounted.current) {
        setCurrentUser(null);
      }
    });
    
    return () => {
      mounted = false;
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id, shouldNavigate, path) => {
    if (!isMounted.current) return;
    
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));

      await withRetry(() => Notification.update(id, { read: true }));
      
      if (shouldNavigate && isMounted.current) {
        navigate(path);
      }
    } catch (e) {
      if (!isMounted.current) return;
      
      console.error("Failed to mark notification as read", e);
      if (e.response?.status === 429) {
        if (shouldNavigate) navigate(path);
      }
      if (currentUser) {
        fetchNotifications(currentUser, true);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!isMounted.current) return;
    
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length === 0) {
      return;
    }

    setIsMarkingAllRead(true);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const batchSize = 2;
      const unreadIds = unreadNotifs.map(n => n.id);
      
      for (let i = 0; i < unreadIds.length; i += batchSize) {
        if (!isMounted.current) break;
        
        const batch = unreadIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(id => withRetry(() => Notification.update(id, { read: true })))
        );
        if (i + batchSize < unreadIds.length && isMounted.current) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (e) {
      if (!isMounted.current) return;
      
      console.error("Failed to mark all as read", e);
      if (currentUser) {
        fetchNotifications(currentUser, true);
      }
    } finally {
      if (isMounted.current) {
        setIsMarkingAllRead(false);
      }
    }
  };

  const handleOpenChange = (open) => {
    if (!isMounted.current) return;
    
    setIsOpen(open);
    if (open && currentUser) {
      fetchNotifications(currentUser);
    }
  };

  if (!currentUser) {
    return (
      <Link to={createPageUrl("Notifications")} className="text-gray-600 hover:text-purple-600 p-2 rounded-full">
        <Bell className="w-5 h-5" />
      </Link>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-transparent group">
          <Bell className={`w-5 h-5 transition-colors ${isOpen ? 'text-purple-600' : 'text-gray-600 group-hover:text-purple-600'}`} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
          <h3 className="font-semibold text-lg flex items-center">
            <Bell className="w-5 h-5 mr-2 text-purple-600" />
            Notifications
          </h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <>
                <Badge className="bg-red-500 text-white">
                  {unreadCount} new
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAllRead}
                  className="text-xs h-7 px-2"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  {isMarkingAllRead ? 'Marking...' : 'Read All'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="text-center py-8 px-4">
                <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            notifications.map(notification => {
              const Icon = notificationIcons[notification.type] || Bell;

              const getNotificationLink = (notif) => {
                if (notif.type === 'direct_message' && notif.related_entity_id) {
                  return createPageUrl(`Sync?conversation=${notif.related_entity_id}`);
                }
                
                const isFeedInteraction = ['feed_applaud', 'feed_comment', 'feed_share', 'feed_comment_mention'].includes(notif.type);
                if (isFeedInteraction && notif.related_project_id) {
                    return createPageUrl('Feed') + '#project-' + notif.related_project_id;
                }
                const isDiscussionInteraction = ['discussion_comment', 'discussion_comment_mention'].includes(notif.type);
                if (isDiscussionInteraction && notif.related_project_id) {
                    return createPageUrl(`ProjectDetail?id=${notif.related_project_id}&tab=discussion`);
                }
                if (notif.related_project_id) {
                    return createPageUrl(`ProjectDetail?id=${notif.related_project_id}`);
                }
                return createPageUrl('Notifications');
              };

              const path = getNotificationLink(notification);

              // Show sender avatar for direct messages
              const showAvatar = notification.type === 'direct_message' && notification.metadata?.sender_profile_image;

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-purple-50' : ''}`}
                  onClick={() => {
                    handleMarkAsRead(notification.id, true, path);
                    setIsOpen(false);
                  }}
                >
                  {showAvatar ? (
                    <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                      <AvatarImage src={notification.metadata.sender_profile_image} />
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                        {notification.actor_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Icon className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{notification.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && <div className="w-2 h-2 bg-purple-500 rounded-full self-center flex-shrink-0"></div>}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t p-3 text-center">
          <Link to={createPageUrl("Notifications")} className="text-sm font-medium text-purple-600 hover:underline" onClick={() => setIsOpen(false)}>
            View All Notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}