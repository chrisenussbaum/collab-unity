import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Eye,
  Lock,
  MessageSquare,
  Send,
  Loader2,
  Pin,
  Edit, // Added Edit icon for consistency with outline
  Trash2,
  CornerDownRight,
  MoreVertical,
  Pencil, // Added Pencil icon as per outline
} from "lucide-react";
import { Comment, Notification, ActivityLog } from "@/entities/all"; // Added ActivityLog
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { getAllPublicUserProfiles } from "@/functions/getAllPublicUserProfiles";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Placeholder for createPageUrl - assuming this utility exists elsewhere in the project.
// If it does not exist, a simple implementation like below is used.
const createPageUrl = (path) => `/${path}`;

// Utility function to handle rate limits with exponential backoff
const withRetry = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`Rate limit hit, retrying in ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

export default function DiscussionBoard({ project, currentUser, onProjectUpdate, isCollaborator, isProjectOwner, projectOwnerName }) {
  const [comments, setComments] = useState([]); // Now a flat list of all comments
  const [commentProfiles, setCommentProfiles] = useState({});
  const [newComment, setNewComment] = useState(""); // For main comment input
  const [isSubmitting, setIsSubmitting] = useState(false); // Global submitting state for all operations
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null); // Stores the comment.id being replied to, or null
  const [replyContent, setReplyContent] = useState(""); // For reply input
  const [editingComment, setEditingComment] = useState(null); // Stores the comment.id being edited
  const [editContent, setEditContent] = useState(""); // For edit input

  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [allUsers, setAllUsers] = useState([]); // This will serve as 'collaborators' for renderCommentContent
  const [mentions, setMentions] = useState([]); // For tracking emails of mentioned users in new comment/reply
  const [mentionQuery, setMentionQuery] = useState(''); // Current query for mention search

  const textareaRef = useRef(null); // Ref for main comment textarea
  const replyInputRef = useRef(null); // Ref for reply textarea

  const [deletingCommentId, setDeletingCommentId] = useState(null); // For delete confirmation dialog

  const hasReadAccess = !!currentUser;
  const [isPinningCommentItem, setIsPinningCommentItem] = useState(false); // Local state for pin action loader

  useEffect(() => {
    const loadAllUsers = async () => {
      if (!currentUser) return;
      try {
        const { data: profiles } = await withRetry(() => getAllPublicUserProfiles());
        setAllUsers(profiles || []);
      } catch (error) {
        console.error("Error loading all users for mentions:", error);
        setAllUsers([]);
      }
    };
    loadAllUsers();
  }, [currentUser]);

  const loadComments = useCallback(async () => {
    if (!project?.id) return;
    setIsLoading(true);
    try {
      // Fetch all comments and keep them as a flat list with retry logic
      const projectComments = await withRetry(() => 
        Comment.filter({ project_id: project.id, context: "discussion" }, "-created_date")
      );
      const validComments = Array.isArray(projectComments) ? projectComments : [];

      const userEmails = new Set(validComments.flatMap(c => [c.user_email, ...(c.mentions || [])]));

      if (userEmails.size > 0) {
        const { data: profiles } = await withRetry(() => 
          getPublicUserProfiles({ emails: [...userEmails] })
        );
        const profilesMap = (profiles || []).reduce((acc, profile) => {
          acc[profile.email] = profile;
          return acc;
        }, {});
        setCommentProfiles(profilesMap);
      }

      // Sort top-level comments: Pinned comments first, then by created date descending
      // For replies, they will be sorted when rendered recursively.
      const sortedComments = validComments.sort((a, b) => {
        if (a.parent_comment_id && !b.parent_comment_id) return 1; // Replies after top-level
        if (!a.parent_comment_id && b.parent_comment_id) return -1; // Top-level before replies

        if (a.is_pinned && !b.is_pinned) return -1; // Pinned comes before unpinned
        if (!a.is_pinned && b.is_pinned) return 1; // Unpinned comes after pinned

        return new Date(b.created_date) - new Date(a.created_date); // Latest first
      });

      setComments(sortedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Failed to load discussion comments.");
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    if (hasReadAccess) {
        loadComments();
    }
  }, [loadComments, hasReadAccess]);

  const extractMentions = useCallback((text) => {
    const mentionEmails = [];
    const mentionRegex = /(^|\s)@([\w.-]+)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const usernameOrEmailPart = match[2];
      const mentionedUser = allUsers.find(
        (u) => u.username?.toLowerCase() === usernameOrEmailPart.toLowerCase() ||
                 u.email?.split('@')[0]?.toLowerCase() === usernameOrEmailPart.toLowerCase()
      );
      if (mentionedUser && mentionedUser.email) {
        mentionEmails.push(mentionedUser.email);
      }
    }
    return [...new Set(mentionEmails)]; // Return unique emails
  }, [allUsers]);

  // CommentContent component for rendering content with mentions and links
  const CommentContent = ({ content }) => {
    if (!content) return null;

    const mentionRegex = /(^|\s)(@[\w.-]+)/g;
    const collaborators = allUsers; // Using allUsers for mention lookup

    return (
      <React.Fragment>
        {content.split(mentionRegex).map((part, index) => {
          if (index % 3 === 2) { // This is the captured mention group (e.g., "@username")
            const username = part.substring(1); // Remove '@'
            const mentionedUser = collaborators.find(
              (u) => u.username?.toLowerCase() === username.toLowerCase() ||
                       u.email?.split('@')[0]?.toLowerCase() === username.toLowerCase()
            );

            if (mentionedUser) {
              const mentionProfileUrl = mentionedUser.username
                ? createPageUrl(`UserProfile?username=${mentionedUser.username}`)
                : createPageUrl(`UserProfile?email=${mentionedUser.email}`);
              return (
                <Link
                  key={index}
                  to={mentionProfileUrl}
                  className="font-semibold text-purple-600 hover:underline bg-purple-50 px-1 py-0.5 rounded-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  {part}
                </Link>
              );
            }
            return part; // Return mention as text if user not found
          } else if (index % 3 === 1) {
             // This is the captured whitespace or start of string
             return part;
          } else { // This is regular text (index % 3 === 0)
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            return part.split(urlRegex).map((textPart, i) => {
              if (i % 2 === 1) {
                return (
                  <a
                    key={`${index}-${i}`}
                    href={textPart}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {textPart}
                  </a>
                );
              }
              return <span key={`${index}-${i}`}>{textPart}</span>;
            });
          }
        })}
      </React.Fragment>
    );
  };

  // Universal text change handler for mention suggestions
  const handleTextareaChangeWithMentions = useCallback((e, isReplyTextarea = false) => {
    const text = e.target.value;
    if (isReplyTextarea) {
        setReplyContent(text);
    } else {
        setNewComment(text);
    }

    const cursorPos = e.target.selectionStart;
    const textToCursor = text.substring(0, cursorPos);
    const match = textToCursor.match(/@(\w*)$/);

    if (match) {
      const query = match[1];
      setMentionQuery(query);
      const users = allUsers.filter(user =>
          (user.full_name?.toLowerCase().includes(query.toLowerCase()) ||
           user.username?.toLowerCase().includes(query.toLowerCase())) &&
          user.email !== currentUser?.email
      ).slice(0, 5);
      setFilteredUsers(users);
      setShowMentionSuggestions(users.length > 0);
    } else {
      setMentionQuery('');
      setFilteredUsers([]);
      setShowMentionSuggestions(false);
    }
  }, [allUsers, currentUser?.email]);

  // Universal mention select handler
  const handleMentionSelect = useCallback((user) => {
    const textarea = replyingTo
      ? document.querySelector(`textarea[data-reply-to-id="${replyingTo}"]`)
      : textareaRef.current;

    if (!textarea) {
        console.error("No active textarea found for mention selection.");
        return;
    }

    const isReplyTextareaActive = !!replyingTo;
    const currentCommentValue = isReplyTextareaActive ? replyContent : newComment;

    const mentionDisplayName = user.username || user.full_name || user.email.split('@')[0];
    const mentionText = `@${mentionDisplayName}`;
    const cursorPos = textarea.selectionStart;

    const textBeforeCursor = currentCommentValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf(`@${mentionQuery}`);

    if (lastAtIndex !== -1) {
        const newContent = currentCommentValue.substring(0, lastAtIndex) + mentionText + ' ' + currentCommentValue.substring(cursorPos);
        if (isReplyTextareaActive) {
            setReplyContent(newContent);
        } else {
            setNewComment(newContent);
        }

        setMentions(prev => {
            if (user.email && !prev.includes(user.email)) {
                return [...prev, user.email];
            }
            return prev;
        });

        setTimeout(() => {
            const newCursorPos = lastAtIndex + mentionText.length + 1;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
        }, 0);
    }
    setShowMentionSuggestions(false);
    setFilteredUsers([]);
    setMentionQuery('');
  }, [newComment, replyContent, replyingTo, mentionQuery, mentions]);


  // Main comment submission
  const handlePostComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment.");
      return;
    }
    if (!isCollaborator) {
      toast.error("You must be a collaborator to post a comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const extractedMentions = extractMentions(newComment);
      
      const newCommentData = await Comment.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        user_avatar: currentUser.profile_image,
        content: newComment.trim(),
        context: "discussion",
        mentions: extractedMentions,
        parent_comment_id: null,
        is_pinned: false,
      });

      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        action_type: "comment_posted",
        action_description: "posted a discussion comment",
        entity_type: "comment",
        entity_id: newCommentData.id,
      });
      
      // Fetch profiles for any newly mentioned users
      const newProfilesToFetch = extractedMentions.filter(email => !commentProfiles[email]);
      if (newProfilesToFetch.length > 0) {
        const { data: newProfiles } = await getPublicUserProfiles({ emails: newProfilesToFetch });
        setCommentProfiles(prev => {
          const updatedProfiles = { ...prev };
          (newProfiles || []).forEach(p => { updatedProfiles[p.email] = p; });
          return updatedProfiles;
        });
      }

      setNewComment("");
      setMentions([]);
      setMentionQuery('');
      setShowMentionSuggestions(false);
      setFilteredUsers([]);

      loadComments();
      toast.success("Comment posted successfully!");

      const notificationPromises = [];

      // Notify mentioned users
      for (const email of extractedMentions) {
        if (email !== currentUser.email) {
          const notificationPromise = Notification.create({
            user_email: email,
            title: `${currentUser.full_name || currentUser.email.split('@')[0]} mentioned you in a discussion`,
            message: `On project: "${project.title}"`,
            type: 'discussion_comment_mention',
            related_project_id: project.id,
            related_entity_id: newCommentData.id, // Added related_entity_id
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email.split('@')[0],
          });
          notificationPromises.push(notificationPromise);
        }
      }

      // Notify project owner if different from commenter and not already mentioned
      if (project.created_by !== currentUser.email && !extractedMentions.includes(project.created_by)) {
        const ownerNotificationPromise = Notification.create({
          user_email: project.created_by,
          title: `New discussion comment on ${project.title}`,
          message: `${currentUser.full_name || currentUser.email.split('@')[0]} commented: "${newCommentData.content.substring(0, 50)}..."`,
          type: 'discussion_comment',
          related_project_id: project.id,
          related_entity_id: newCommentData.id, // Added related_entity_id
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email.split('@')[0],
        });
        notificationPromises.push(ownerNotificationPromise);
      }

      if (notificationPromises.length > 0) {
        await Promise.all(notificationPromises);
      }

    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reply submission
  const handleReply = async (parentCommentId) => {
    if (!replyContent.trim()) {
      toast.error("Please enter a reply.");
      return;
    }
    if (!isCollaborator) {
      toast.error("You must be a collaborator to post a reply.");
      return;
    }

    setIsSubmitting(true);
    try {
      const extractedMentions = extractMentions(replyContent);

      const replyData = await Comment.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        user_avatar: currentUser.profile_image,
        content: replyContent.trim(),
        context: "discussion",
        parent_comment_id: parentCommentId,
        mentions: extractedMentions,
      });

      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        action_type: "comment_posted",
        action_description: "replied to a discussion comment",
        entity_type: "comment",
        entity_id: replyData.id,
      });

      const newProfilesToFetch = extractedMentions.filter(email => !commentProfiles[email]);
      if (newProfilesToFetch.length > 0) {
        const { data: newProfiles } = await getPublicUserProfiles({ emails: newProfilesToFetch });
        setCommentProfiles(prev => {
          const updatedProfiles = { ...prev };
          (newProfiles || []).forEach(p => { updatedProfiles[p.email] = p; });
          return updatedProfiles;
        });
      }

      setReplyingTo(null);
      setReplyContent("");
      setMentions([]);
      setMentionQuery('');
      setShowMentionSuggestions(false);
      setFilteredUsers([]);

      loadComments();
      toast.success("Reply posted successfully!");

      const notificationPromises = [];

      // Notify mentioned users
      for (const email of extractedMentions) {
        if (email !== currentUser.email) {
          const notificationPromise = Notification.create({
            user_email: email,
            title: `${currentUser.full_name || currentUser.email.split('@')[0]} mentioned you in a reply`,
            message: `On project: "${project.title}"`,
            type: 'discussion_comment_mention',
            related_project_id: project.id,
            related_entity_id: replyData.id, // Added related_entity_id
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email.split('@')[0],
          });
          notificationPromises.push(notificationPromise);
        }
      }
      
      // Notify parent comment owner if different from current user and not mentioned
      const parentComment = comments.find(c => c.id === parentCommentId);
      if (parentComment && parentComment.user_email !== currentUser.email && !extractedMentions.includes(parentComment.user_email)) {
        const parentOwnerNotificationPromise = Notification.create({
          user_email: parentComment.user_email,
          title: `New reply to your comment on ${project.title}`,
          message: `${currentUser.full_name || currentUser.email.split('@')[0]} replied: "${replyData.content.substring(0, 50)}..."`,
          type: 'discussion_comment_reply',
          related_project_id: project.id,
          related_entity_id: replyData.id, // Added related_entity_id
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email.split('@')[0],
        });
        notificationPromises.push(parentOwnerNotificationPromise);
      }

      // Notify project owner if different from commenter and not already mentioned/parent_comment_owner
      if (project.created_by !== currentUser.email && !extractedMentions.includes(project.created_by) && project.created_by !== (parentComment?.user_email || '')) {
        const ownerNotificationPromise = Notification.create({
          user_email: project.created_by,
          title: `New discussion reply on ${project.title}`,
          message: `${currentUser.full_name || currentUser.email.split('@')[0]} replied to a comment: "${replyData.content.substring(0, 50)}..."`,
          type: 'discussion_comment',
          related_project_id: project.id,
          related_entity_id: replyData.id, // Added related_entity_id
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email.split('@')[0],
        });
        notificationPromises.push(ownerNotificationPromise);
      }

      if (notificationPromises.length > 0) {
        await Promise.all(notificationPromises);
      }

    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
    setMentions([]);
    setMentionQuery('');
    setShowMentionSuggestions(false);
    setFilteredUsers([]);
  };

  const handleDelete = async (commentId) => {
    setDeletingCommentId(commentId); // Open the confirmation dialog
  };

  const handleConfirmDelete = async () => {
    if (!deletingCommentId) return;

    setIsSubmitting(true);
    try {
      await Comment.delete(deletingCommentId);
      toast.success("Comment deleted successfully!");
      setDeletingCommentId(null);
      loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      await Comment.update(commentId, { content: editContent.trim() });
      toast.success("Comment updated successfully!");
      setEditingComment(null);
      setEditContent("");
      loadComments();
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePin = async (comment) => {
    if (!isProjectOwner) {
      toast.error("Only the project owner can pin comments.");
      return;
    }
    setIsPinningCommentItem(true);
    try {
      await Comment.update(comment.id, { is_pinned: !comment.is_pinned });
      toast.success(`Comment ${comment.is_pinned ? "unpinned" : "pinned"} successfully!`);
      loadComments();
      if (onProjectUpdate) onProjectUpdate();
    } catch (error) {
      console.error("Error pinning comment:", error);
      toast.error("Failed to pin comment.");
    } finally {
      setIsPinningCommentItem(false);
    }
  };

  const renderComment = (comment, isReply = false) => {
    const isCommentOwner = currentUser && comment.user_email === currentUser.email;
    const commenterProfile = commentProfiles[comment.user_email] || allUsers.find(u => u.email === comment.user_email);
    const displayName = comment.user_name || commenterProfile?.full_name || commenterProfile?.username || comment.user_email?.split('@')[0] || 'Anonymous';
    const profileUrl = commenterProfile?.username
      ? createPageUrl(`UserProfile?username=${commenterProfile.username}`)
      : createPageUrl(`UserProfile?email=${comment.user_email}`);

    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;

    // Filter and sort replies for this specific comment
    const replies = comments
      .filter(c => c.parent_comment_id === comment.id)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    return (
      <div
        key={comment.id}
        className={`flex items-start space-x-2 sm:space-x-3 transition-colors duration-300 relative 
        ${isReply ? 'ml-3 sm:ml-4 pt-3 border-l-2 border-gray-200 pl-3' : ''}
        ${isEditing ? 'bg-purple-50 rounded-xl p-2 -mx-2 -my-1' : ''}
        ${isReplying ? 'bg-blue-50 rounded-xl p-2 -mx-2 -my-1' : ''}
        `}
        id={`comment-${comment.id}`}
      >
        <Link to={profileUrl} className="flex-shrink-0">
          <Avatar className="w-8 h-8 sm:w-9 sm:h-9 mt-1 border-2 border-white shadow-sm">
            <AvatarImage src={comment.user_avatar || commenterProfile?.profile_image} className="object-cover" />
            <AvatarFallback className={`text-xs sm:text-sm bg-gradient-to-br from-purple-400 to-purple-600 text-white font-medium`}>
              {displayName?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
              <Link to={profileUrl} className="font-semibold text-sm sm:text-base text-gray-900 truncate hover:text-purple-600 transition-colors">
                {displayName}
              </Link>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {comment.created_date ? formatDistanceToNow(new Date(comment.created_date), { addSuffix: true }) : ''}
              </span>
              {comment.is_pinned && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs flex-shrink-0 border-yellow-300">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
            </div>
            {(isCommentOwner || isProjectOwner) && (
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500 hover:text-gray-900">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isProjectOwner && (
                      <DropdownMenuItem
                        onClick={() => handlePin(comment)}
                        className="cursor-pointer"
                        disabled={isPinningCommentItem}
                      >
                        {isPinningCommentItem ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Pin className={`w-4 h-4 mr-2 ${comment.is_pinned ? 'text-purple-600' : ''}`} />
                        )}
                        <span>{comment.is_pinned ? 'Unpin Comment' : 'Pin Comment'}</span>
                      </DropdownMenuItem>
                    )}
                    {isCommentOwner && (
                      <>
                        <DropdownMenuItem onClick={() => {
                          setEditingComment(comment.id);
                          setEditContent(comment.content);
                        }} className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />
                          <span>Edit Comment</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          <span>Delete Comment</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full text-sm sm:text-base border-purple-200 focus:border-purple-400"
                disabled={isSubmitting}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => {setEditingComment(null); setEditContent("");}} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => handleEditComment(comment.id)} disabled={isSubmitting || !editContent.trim()} className="cu-button">
                  {isSubmitting ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Edit className="w-3 h-3 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm sm:text-base text-gray-700 leading-relaxed bg-white rounded-lg px-3 py-2 shadow-sm relative break-words whitespace-pre-wrap">
              <CommentContent content={comment.content} />
            </div>
          )}

          <div className="mt-2 flex items-center gap-3">
            {!isEditing && isCollaborator && ( // Don't show reply button while editing, only for collaborators
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyingTo(comment.id);
                  setReplyContent("");
                  setTimeout(() => replyInputRef.current?.focus(), 100);
                }}
                className="h-7 px-2 text-xs sm:text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50"
              >
                <CornerDownRight className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {isReplying && isCollaborator && ( // Only show reply form if replying to this comment and user is collaborator
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100"
            >
              <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src={currentUser?.profile_image} className="object-cover" />
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                      {currentUser?.full_name?.[0] || currentUser?.username?.[0] || 'U'}
                      </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2 relative">
                      <Textarea
                          ref={replyInputRef}
                          placeholder={`Replying to ${displayName}...`}
                          value={replyContent}
                          onChange={(e) => handleTextareaChangeWithMentions(e, true)} // Pass true for reply textarea
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                handleReply(comment.id);
                              }
                          }}
                          rows={3}
                          className="text-sm resize-none border-purple-200 focus:border-purple-400 bg-white"
                          data-reply-to-id={comment.id}
                          disabled={isSubmitting}
                      />
                      {/* Mention Suggestions Dropdown for reply */}
                      {showMentionSuggestions && filteredUsers.length > 0 && replyingTo === comment.id && ( // Only show if this is the active reply
                          <Card className="absolute z-50 w-full mt-1 bg-white border-2 border-purple-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                              {filteredUsers.map((user) => (
                              <div
                                  key={user.id}
                                  onClick={() => handleMentionSelect(user)}
                                  onMouseDown={(e) => e.preventDefault()}
                                  className="w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center space-x-2 transition-colors cursor-pointer border-b last:border-b-0"
                              >
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                  <AvatarImage src={user.profile_image} className="object-cover" />
                                  <AvatarFallback className="text-sm bg-purple-100 text-purple-600">
                                      {user.full_name?.[0] || user.email?.[0] || 'U'}
                                  </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                      {user.full_name || user.email}
                                  </p>
                                  {user.username && (
                                      <p className="text-xs text-gray-500">@{user.username}</p>
                                  )}
                                  </div>
                              </div>
                              ))}
                          </Card>
                      )}
                  </div>
              </div>
              <div className="flex justify-end gap-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelReply}
                      className="h-8"
                      disabled={isSubmitting}
                  >
                      Cancel
                  </Button>
                  <Button
                      size="sm"
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyContent.trim() || isSubmitting}
                      className="cu-button h-8"
                  >
                      {isSubmitting ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                          <Send className="w-3 h-3 mr-1" />
                      )}
                      Reply
                  </Button>
              </div>
            </motion.div>
          )}

          {replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {replies.map(reply => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {renderComment(reply, true)}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="cu-card">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-600" />
            Team Discussion ({comments.length})
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-gray-500 mt-2">
            Private workspace for {projectOwnerName || "the project owner"} and collaborators only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* New Comment Form */}
          {isCollaborator && (
            <div className="space-y-3 sm:space-y-4 p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 shadow-sm">
                <div className="flex items-start space-x-4">
                    <Link to={createPageUrl(currentUser?.username ? `UserProfile?username=${currentUser.username}` : `UserProfile?email=${currentUser.email}`)}>
                        <Avatar className="w-10 h-10 mt-1 cursor-pointer border-2 border-white shadow">
                            <AvatarImage src={currentUser?.profile_image} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm font-medium">
                                {currentUser?.full_name?.[0] || currentUser?.username?.[0] || 'U'}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-1 space-y-2 relative">
                        <Textarea
                            ref={textareaRef}
                            placeholder="Share updates, ask questions, or discuss ideas with your team..."
                            value={newComment}
                            onChange={(e) => handleTextareaChangeWithMentions(e, false)} // Pass false for main textarea
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handlePostComment();
                                }
                            }}
                            rows={4}
                            className="w-full resize-none text-sm sm:text-base border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                            disabled={isSubmitting}
                        />
                        
                        {/* Mention Suggestions Dropdown */}
                        {showMentionSuggestions && filteredUsers.length > 0 && !replyingTo && ( // Only show if main textarea is active
                            <Card className="absolute z-50 w-full mt-1 bg-white border-2 border-purple-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => handleMentionSelect(user)}
                                    onMouseDown={(e) => e.preventDefault()} // Prevents textarea from losing focus
                                    className="w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center space-x-2 transition-colors cursor-pointer border-b last:border-b-0"
                                >
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={user.profile_image} className="object-cover" />
                                    <AvatarFallback className="text-sm bg-purple-100 text-purple-600">
                                        {user.full_name?.[0] || user.email?.[0] || 'U'}
                                    </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user.full_name || user.email}
                                    </p>
                                    {user.username && (
                                        <p className="text-xs text-gray-500">@{user.username}</p>
                                    )}
                                    </div>
                                </div>
                                ))}
                            </Card>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ml-[4.5rem] -mt-1">
                    <p className="text-xs text-gray-500">
                        <strong>Tip:</strong> Type @ to mention a team member • Press Ctrl+Enter to post
                    </p>
                    <Button
                        onClick={handlePostComment}
                        disabled={!newComment.trim() || isSubmitting}
                        className="cu-button w-full sm:w-auto px-6"
                        size="sm"
                    >
                        {isSubmitting ? (
                            <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Posting...
                            </>
                        ) : (
                            <>
                            <Send className="w-3 h-3 mr-2" />
                            Post Comment
                            </>
                        )}
                    </Button>
                </div>
            </div>
          )}

          {!isCollaborator && hasReadAccess && (
            <Card className="cu-card border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-amber-800">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Join this project to participate in the discussion.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          <div className="space-y-3 sm:space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto text-purple-600 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Loading discussion...</p>
              </div>
            ) : topLevelComments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3" />
                <p className="text-sm sm:text-base text-gray-500 mb-2">No comments yet</p>
                <p className="text-xs sm:text-sm text-gray-400">
                  {isCollaborator 
                    ? "Start the conversation by posting the first comment!" 
                    : "Team members will discuss project updates here."}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {topLevelComments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {renderComment(comment)}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog open={!!deletingCommentId} onOpenChange={() => setDeletingCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your comment and any replies associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isSubmitting} className="cu-button bg-red-600 hover:bg-red-700">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!hasReadAccess && (
        <Card className="cu-card">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Discussion is Private</p>
            <p className="text-sm text-gray-500">
              Please log in to view the team's discussion.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}