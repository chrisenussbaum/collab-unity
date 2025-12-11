import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Notification, User, ProjectApplication, Project, ProjectInvitation } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellOff,
  Calendar,
  Users,
  Briefcase,
  Check,
  X,
  HandHeart,
  MessageCircle,
  Share2,
  Target,
  CheckSquare,
  AlertCircle,
  FileStack,
  Trophy,
  Filter,
  AtSign,
  CheckCheck,
  Lightbulb,
  UserPlus,
  Loader2,
  MoreVertical,
  Trash2,
  PencilLine,
  UserMinus,
  UserX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Utility function to retry API calls
const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Retry attempt ${i + 1} for function failed. Retrying in ${delay}ms...`, error);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
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

const notificationColors = {
  project_application: "bg-blue-100 text-blue-800",
  project_update: "bg-green-100 text-green-800",
  general: "bg-gray-100 text-gray-800",
  feed_applaud: "bg-purple-100 text-purple-800",
  feed_comment: "bg-indigo-100 text-indigo-800",
  feed_comment_mention: "bg-teal-100 text-teal-800",
  feed_share: "bg-cyan-100 text-cyan-800",
  discussion_comment: "bg-indigo-100 text-indigo-800",
  discussion_comment_mention: "bg-teal-100 text-teal-800",
  project_comment: "bg-indigo-100 text-indigo-800",
  project_task_assigned: "bg-orange-100 text-orange-800",
  project_task_completed: "bg-teal-100 text-teal-800",
  project_asset_upload: "bg-yellow-100 text-yellow-800",
  project_ideation_updated: "bg-purple-100 text-purple-800",
  project_thought_created: "bg-indigo-100 text-indigo-800",
  advertisement_approved: "bg-green-100 text-green-800",
  advertisement_rejected: "bg-red-100 text-red-800",
  advertisement_expired: "bg-gray-100 text-gray-800",
  project_member_added: "bg-blue-100 text-blue-800",
  collaboration_request: "bg-blue-100 text-blue-800",
  direct_message: "bg-purple-100 text-purple-800"
};

const notificationTypes = [
  { value: 'all', label: 'All Notifications' },
  { value: 'project_application', label: 'Project Applications' },
  { value: 'collaboration_request', label: 'Collaboration Requests' },
  { value: 'direct_message', label: 'Messages' },
  { value: 'project_update', label: 'Project Updates' },
  { value: 'project_task_assigned', label: 'Task Assignments' },
  { value: 'project_task_completed', label: 'Task Completions' },
  { value: 'project_member_added', label: 'New Members' },
  { value: 'project_ideation_updated', label: 'Ideation Updates' },
  { value: 'project_thought_created', label: 'New Thoughts' },
  { value: 'feed_applaud', label: 'Applauds' },
  { value: 'feed_comment', label: 'Feed Comments' },
  { value: 'feed_comment_mention', label: 'Feed Mentions' },
  { value: 'discussion_comment', label: 'Discussion Comments' },
  { value: 'discussion_comment_mention', label: 'Discussion Mentions' },
  { value: 'advertisement_approved', label: 'Ad Approvals' },
  { value: 'advertisement_rejected', label: 'Ad Rejections' },
];

export default function Notifications({ currentUser, authIsLoading }) {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [relatedEntities, setRelatedEntities] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const navigate = useNavigate();

  const fetchRelatedEntities = useCallback(async (notifs) => {
    const applicationIds = notifs
      .filter(n => n.type === 'project_application' && n.related_entity_id)
      .map(n => n.related_entity_id);

    const relatedData = {};

    if (applicationIds.length > 0) {
      try {
        const applications = await ProjectApplication.filter({ id: { $in: applicationIds } });
        applications.forEach(a => { relatedData[a.id] = { type: 'application', data: a }; });
      } catch (e) { console.error("Could not fetch applications", e)}
    }

    setRelatedEntities(relatedData);
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!currentUser) {
        if (!authIsLoading) setIsLoading(false);
        return;
      }

      const userNotifications = await Notification.filter(
        { user_email: currentUser.email },
        "-created_date",
        100
      );
      setNotifications(userNotifications);
      setFilteredNotifications(userNotifications);
      await fetchRelatedEntities(userNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchRelatedEntities, currentUser, authIsLoading]);

  useEffect(() => {
    if (!authIsLoading) {
      loadNotifications();
    }
  }, [loadNotifications, authIsLoading]);


  useEffect(() => {
    if (selectedType === "all") {
      setFilteredNotifications(notifications);
    } else {
      const filtered = notifications.filter(notif => notif.type === selectedType);
      setFilteredNotifications(filtered);
    }
  }, [selectedType, notifications]);

  const handleMarkAsRead = async (notification) => {
    try {
      await withRetry(() => Notification.update(notification.id, { read: true }));
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notification.id
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark as read.");
    }
  };

  const handleDeleteNotification = async (notification) => {
    try {
      await withRetry(() => Notification.delete(notification.id));
      setNotifications(prev => prev.filter(notif => notif.id !== notification.id));
      toast.success("Notification deleted.");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification.");
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = filteredNotifications.filter(notif => !notif.read);

    if (unreadNotifications.length === 0) {
      toast.info("No unread notifications to mark as read.");
      return;
    }

    setIsMarkingAllRead(true);
    try {
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );

      const batchSize = 3;
      for (let i = 0; i < unreadNotifications.length; i += batchSize) {
        const batch = unreadNotifications.slice(i, i + batchSize);
        await Promise.all(
          batch.map(notif =>
            withRetry(() => Notification.update(notif.id, { read: true }))
          )
        );
        if (i + batchSize < unreadNotifications.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast.success("All notifications marked as read!");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all as read. Please try again.");
      await loadNotifications();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleApplicationAction = async (notification, action) => {
    const application = relatedEntities[notification.related_entity_id]?.data;
    if (!application || application.status !== 'pending') {
      toast.info("This application is no longer pending.");
      await handleMarkAsRead(notification);
      loadNotifications();
      return;
    }

    setIsUpdating(notification.id);
    try {
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      await withRetry(() => ProjectApplication.update(application.id, { status: newStatus }));

      const [projectDetails] = await Project.filter({ id: application.project_id });

      if (newStatus === 'accepted' && projectDetails) {
        const newCollaboratorsCount = (projectDetails.current_collaborators_count || 0) + 1;
        const updatedCollaboratorEmails = [...(projectDetails.collaborator_emails || []), application.applicant_email];

        const updateData = {
          current_collaborators_count: newCollaboratorsCount,
          collaborator_emails: updatedCollaboratorEmails
        };

        if (newCollaboratorsCount >= projectDetails.collaborators_needed) {
          updateData.status = "in_progress";
        }
        await withRetry(() => Project.update(projectDetails.id, updateData));
      }

      await withRetry(() => Notification.create({
        user_email: application.applicant_email,
        title: `Application ${newStatus === 'accepted' ? 'Accepted' : 'Declined'}`,
        message: `Your application for "${projectDetails?.title || 'a project'}" was ${newStatus === 'accepted' ? 'accepted' : 'declined'}.`,
        type: "general",
        related_project_id: application.project_id
      }));

      await handleMarkAsRead(notification);

      setRelatedEntities(prev => ({
        ...prev,
        [application.id]: { ...prev[application.id], data: { ...application, status: newStatus } }
      }));
      toast.success(`Application ${newStatus}.`);
      loadNotifications();
    } catch (error) {
      console.error("Error handling application action:", error);
      toast.error("Failed to process application. Please try again.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleAcceptInvitation = async (notification) => {
    if (!currentUser || !notification.related_project_id) return;

    setIsUpdating(notification.id);
    try {
      const invitations = await ProjectInvitation.filter({
        project_id: notification.related_project_id,
        invitee_email: currentUser.email,
        status: "pending"
      });

      if (invitations.length === 0) {
        toast.info("Invitation not found or already responded to.");
        await handleMarkAsRead(notification);
        loadNotifications();
        return;
      }

      const invitation = invitations[0];
      
      const project = await withRetry(() => Project.get(notification.related_project_id));

      if (project.collaborator_emails?.includes(currentUser.email)) {
        toast.info("You are already a member of this project.");
        await withRetry(() => ProjectInvitation.update(invitation.id, {
          status: "accepted",
          responded_at: new Date().toISOString()
        }));
        await handleMarkAsRead(notification);
        loadNotifications();
        return;
      }

      await withRetry(() => ProjectInvitation.update(invitation.id, {
        status: "accepted",
        responded_at: new Date().toISOString()
      }));

      const updatedCollaborators = [...(project.collaborator_emails || []), currentUser.email];
      const newCollaboratorsCount = (project.current_collaborators_count || 0) + 1;
      
      await withRetry(() => Project.update(project.id, {
        collaborator_emails: updatedCollaborators,
        current_collaborators_count: newCollaboratorsCount
      }));

      await handleMarkAsRead(notification);

      await withRetry(() => Notification.create({
        user_email: project.created_by,
        title: "Invitation Accepted",
        message: `${currentUser.full_name || currentUser.email} has accepted your invitation to join "${project.title}".`,
        type: "project_member_added",
        related_project_id: project.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        metadata: {
          project_title: project.title,
          new_member_email: currentUser.email
        }
      }));

      toast.success("Invitation accepted! You're now a member of the project.");
      loadNotifications();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation. Please try again.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeclineInvitation = async (notification) => {
    if (!currentUser || !notification.related_project_id) return;

    setIsUpdating(notification.id);
    try {
      const invitations = await ProjectInvitation.filter({
        project_id: notification.related_project_id,
        invitee_email: currentUser.email,
        status: "pending"
      });

      if (invitations.length === 0) {
        toast.info("Invitation not found or already responded to.");
        await handleMarkAsRead(notification);
        loadNotifications();
        return;
      }

      const invitation = invitations[0];
      const project = await withRetry(() => Project.get(notification.related_project_id));

      await withRetry(() => ProjectInvitation.update(invitation.id, {
        status: "declined",
        responded_at: new Date().toISOString()
      }));

      await handleMarkAsRead(notification);

      await withRetry(() => Notification.create({
        user_email: project.created_by,
        title: "Invitation Declined",
        message: `${currentUser.full_name || currentUser.email} has declined your invitation to join "${project.title}".`,
        type: "general",
        related_project_id: project.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        metadata: {
          project_title: project.title,
          declined_by_email: currentUser.email
        }
      }));

      toast.success("Invitation declined.");
      loadNotifications();
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Failed to decline invitation. Please try again.");
    } finally {
      setIsUpdating(null);
    }
  };

  const getNotificationLink = useCallback((notification) => {
    // Handle direct message notifications
    if (notification.type === 'direct_message' && notification.related_entity_id) {
      return `${createPageUrl('Chat')}?conversation=${notification.related_entity_id}`;
    }
    
    const isFeedInteraction = ['feed_applaud', 'feed_comment', 'feed_share', 'feed_comment_mention'].includes(notification.type);
    if (isFeedInteraction && notification.related_project_id) {
        return createPageUrl('Feed') + '#project-' + notification.related_project_id;
    }
    const isDiscussionInteraction = ['discussion_comment', 'discussion_comment_mention'].includes(notification.type);
    if (isDiscussionInteraction && notification.related_project_id) {
        return createPageUrl(`ProjectDetail?id=${notification.related_project_id}&tab=discussion`);
    }
    const isIdeationInteraction = ['project_ideation_updated', 'project_thought_created'].includes(notification.type);
    if (isIdeationInteraction && notification.related_project_id) {
      return createPageUrl(`ProjectDetail?id=${notification.related_project_id}&tab=ideate`);
    }
    if (notification.related_project_id) {
        return createPageUrl(`ProjectDetail?id=${notification.related_project_id}`);
    }
    return createPageUrl('Notifications');
  }, []);

  const unreadCount = filteredNotifications.filter(notif => !notif.read).length;
  const selectedTypeInfo = notificationTypes.find(type => type.value === selectedType);
  const SelectedTypeIcon = selectedTypeInfo?.value === 'all' ? Bell : notificationIcons[selectedTypeInfo?.value] || Bell;

  if (authIsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">
            {authIsLoading ? "Authenticating user..." : "Loading notifications..."}
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BellOff className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Sign In to See Your Notifications
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            You need to be signed in to view your notifications. Please log in or create an account to get started.
          </p>
          <Button className="mt-6" onClick={() => navigate('/signin')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              Stay updated on your projects and collaborations
            </p>
          </div>

          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {unreadCount > 0 && (
              <>
                <Badge variant="secondary" className="px-3 py-1">
                  {unreadCount} unread
                </Badge>
                <Button
                  variant="outline"
                  onClick={markAllAsRead}
                  disabled={isMarkingAllRead}
                  className="text-sm"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  {isMarkingAllRead ? 'Marking...' : 'Mark All Read'}
                </Button>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="cu-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-500" />
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-64">
                    <SelectValue>
                      <div className="flex items-center space-x-2">
                        {SelectedTypeIcon && <SelectedTypeIcon className="w-4 h-4" />}
                        <span>{selectedTypeInfo?.label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((typeOption) => {
                      const TypeOptionIcon = typeOption.value === 'all' ? Bell : notificationIcons[typeOption.value] || Bell;
                      return (
                        <SelectItem key={typeOption.value} value={typeOption.value}>
                          <div className="flex items-center space-x-2">
                            <TypeOptionIcon className="w-4 h-4" />
                            <span>{typeOption.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BellOff className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No Notifications
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {selectedType === "all"
                ? "You're all caught up! No new notifications."
                : `No ${selectedTypeInfo?.label.toLowerCase()} notifications found.`
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const colorClass = notificationColors[notification.type] || "bg-gray-100 text-gray-800";
                const link = getNotificationLink(notification);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card className={`cu-card hover:shadow-md transition-all ${!notification.read ? 'border-l-4 border-l-purple-500 bg-purple-50/30' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 mb-1">{notification.title}</p>
                                <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                                {notification.metadata?.message && notification.type === 'connection_request' && (
                                  <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded mb-2">
                                    "{notification.metadata.message}"
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>{formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}</span>
                                  {!notification.read && (
                                    <Badge variant="secondary" className="text-xs">New</Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Project Application Actions */}
                            {notification.type === 'project_application' && !notification.read && notification.related_entity_id && relatedEntities[notification.related_entity_id]?.data?.status === 'pending' && (
                               <div className="flex space-x-2 mt-4 pt-4 border-t">
                                 <Button
                                   size="sm"
                                   className="cu-button"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleApplicationAction(notification, 'accept');
                                   }}
                                   disabled={isUpdating === notification.id}
                                 >
                                   <Check className="w-4 h-4 mr-1" />
                                   {isUpdating === notification.id ? 'Processing...' : 'Accept'}
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleApplicationAction(notification, 'reject');
                                   }}
                                   disabled={isUpdating === notification.id}
                                 >
                                   <X className="w-4 h-4 mr-1" />
                                   Decline
                                 </Button>
                                 {link && (
                                   <Link to={link}>
                                     <Button size="sm" variant="ghost">
                                       View Details
                                     </Button>
                                   </Link>
                                 )}
                               </div>
                             )}

                            {/* Collaboration Request Actions */}
                            {notification.type === 'collaboration_request' && !notification.read && (
                              <div className="flex space-x-2 mt-4 pt-4 border-t">
                                <Button
                                  size="sm"
                                  className="cu-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptInvitation(notification);
                                  }}
                                  disabled={isUpdating === notification.id}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  {isUpdating === notification.id ? 'Processing...' : 'Accept'}
                                 </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeclineInvitation(notification);
                                  }}
                                  disabled={isUpdating === notification.id}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                                {link && (
                                  <Link to={link}>
                                    <Button size="sm" variant="ghost">
                                      View Details
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            )}

                            {/* Default Action Buttons for other notification types */}
                            {notification.type !== 'project_application' &&
                             notification.type !== 'collaboration_request' && (
                              <div className="flex items-center space-x-2 mt-3">
                                {link && link !== createPageUrl('Notifications') && (
                                  <Link to={link} onClick={() => !notification.read && handleMarkAsRead(notification)}>
                                    <Button size="sm" variant="outline">
                                      View Details
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.read && (
                                <DropdownMenuItem onClick={() => handleMarkAsRead(notification)}>
                                  <Check className="w-4 h-4 mr-2" />
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteNotification(notification)}
                                className="text-red-600 focus:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}