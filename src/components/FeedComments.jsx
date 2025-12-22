import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Send,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pin,
  PinOff,
  CornerDownRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Comment, User, Notification } from "@/entities/all";
import { toast } from "sonner";
import ConfirmationDialog from "./ConfirmationDialog";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { getAllPublicUserProfiles } from "@/functions/getAllPublicUserProfiles";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

// Add global cache for all users (shared across all FeedComments instances)
const allUsersCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
  isLoading: false,
  loadPromise: null
};

// Retry utility with exponential backoff
const withRetry = async (apiCall, maxRetries = 3, baseDelay = 3000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(3, attempt) + Math.random() * 2000;
        console.warn(`Rate limit hit, retrying in ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

const createPageUrl = (path) => `/${path}`;

const renderWithMentions = (content, profiles) => {
    if (!content) return '';
    // Updated regex to only match single word usernames (no spaces)
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    return parts.map((part, index) => {
        if (index % 2 === 1) {
            const name = part;
            // Find profile by username (primary) or full_name
            const profile = Object.values(profiles).find(p =>
                p.username?.toLowerCase() === name.toLowerCase() ||
                p.full_name?.toLowerCase() === name.toLowerCase()
            );
            if (profile) {
                const mentionProfileUrl = profile.username
                    ? createPageUrl(`UserProfile?username=${profile.username}`)
                    : createPageUrl(`UserProfile?email=${profile.email}`);
                return (
                    <Link key={index} to={mentionProfileUrl} className="text-purple-600 font-bold hover:underline">
                        @{name}
                    </Link>
                );
            }
            // If no profile found, still render with @ symbol
            return <span key={index} className="text-purple-600 font-bold">@{name}</span>;
        }
        return <span key={index}>{part}</span>;
    });
};

const FeedComments = forwardRef(({ project, currentUser, context = "feed" }, ref) => {
  const [comments, setComments] = useState([]);
  const [commentProfiles, setCommentProfiles] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayedCommentsCount, setDisplayedCommentsCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, commentId: null });
  const [pinnedCommentId, setPinnedCommentId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState(new Set());

  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const textareaRef = useRef(null);
  const replyTextareaRef = useRef(null);

  // NEW STATES FOR MENTION FUNCTIONALITY
  const [cursorPosition, setCursorPosition] = useState(0); // For main comment textarea
  const [replyCursorPosition, setReplyCursorPosition] = useState(0); // For reply textarea
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(-1); // For keyboard navigation in suggestions
  const [mentionQuery, setMentionQuery] = useState(""); // The current query string after '@'
  const [mentionedEmails, setMentionedEmails] = useState([]); // Emails of users explicitly mentioned for notifications

  useImperativeHandle(ref, () => ({
    toggle: () => {
      handleToggleComments();
    }
  }));

  // Load all users with caching and retry logic
  useEffect(() => {
    const loadAllUsers = async () => {
      // Check if cache is still valid
      if (allUsersCache.data && allUsersCache.timestamp &&
          (Date.now() - allUsersCache.timestamp < allUsersCache.CACHE_DURATION)) {
        setAllUsers(allUsersCache.data);
        return;
      }

      // If already loading, wait for that promise
      if (allUsersCache.isLoading && allUsersCache.loadPromise) {
        try {
          const profiles = await allUsersCache.loadPromise;
          setAllUsers(profiles || []);
        } catch (error) {
          console.error("Error waiting for user load:", error);
          setAllUsers([]);
        }
        return;
      }

      // Start loading
      setIsLoadingUsers(true);
      allUsersCache.isLoading = true;

      // Create a promise that others can wait on
      allUsersCache.loadPromise = (async () => {
        try {
          // Add initial delay to avoid immediate rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));

          const { data: profiles } = await withRetry(
            () => getAllPublicUserProfiles(),
            3,
            5000 // Start with 5 second delay
          );

          // Update cache
          allUsersCache.data = profiles || [];
          allUsersCache.timestamp = Date.now();

          return allUsersCache.data;
        } catch (error) {
          console.error("Error loading all users for mentions:", error);
          // On failure, use empty array and cache it briefly to avoid repeated failures
          allUsersCache.data = [];
          allUsersCache.timestamp = Date.now(); // Cache failure for a short duration
          return [];
        } finally {
          allUsersCache.isLoading = false;
          allUsersCache.loadPromise = null;
          setIsLoadingUsers(false);
        }
      })();

      try {
        const profiles = await allUsersCache.loadPromise;
        setAllUsers(profiles);
      } catch (error) {
        setAllUsers([]); // Should already be handled by the promise catch, but good practice
      }
    };

    // Only load users when comments are expanded (lazy loading)
    if (isExpanded && allUsers.length === 0 && !isLoadingUsers) {
      loadAllUsers();
    }
  }, [isExpanded, allUsers.length, isLoadingUsers]); // Dependencies for useEffect

  const loadComments = useCallback(async () => {
    if (!project?.id) return;

    setIsLoading(true);
    try {
      const commentsContext = context === "feed_post" ? "feed_post" : context;
      const projectComments = await Comment.filter({ 
        project_id: project.id, 
        context: commentsContext 
      }, "-created_date");
      const validComments = Array.isArray(projectComments) ? projectComments : [];

      const userEmails = new Set(validComments.flatMap(c => [c.user_email, ...(c.mentions || [])]));

      let profilesMap = {};
      if (userEmails.size > 0) {
        const { data: profiles } = await getPublicUserProfiles({ emails: [...userEmails] });
        profilesMap = (profiles || []).reduce((acc, profile) => {
          acc[profile.email] = profile;
          return acc;
        }, {});
        setCommentProfiles(profilesMap);
      }

      const augmentedComments = validComments.map(comment => {
        const profile = profilesMap[comment.user_email];
        return {
          ...comment,
          user_name: profile?.full_name || comment.user_name || comment.user_email,
          user_avatar: profile?.profile_image || comment.user_avatar,
          // Add username to comment object if available, for consistent profile linking later
          username: profile?.username || null,
        };
      });

      // Organize into threads
      const topLevelComments = augmentedComments.filter(c => !c.parent_comment_id);
      const replies = augmentedComments.filter(c => c.parent_comment_id);

      // Attach replies to their parent comments
      const threaded = topLevelComments.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parent_comment_id === comment.id)
          .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      }));

      // Handle pinned comments
      let currentPinnedComment = null;
      const otherComments = [];
      threaded.forEach(comment => {
        if (comment.is_pinned) {
          currentPinnedComment = comment;
        } else {
          otherComments.push(comment);
        }
      });

      otherComments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      let finalComments = otherComments;
      if (currentPinnedComment) {
        finalComments = [currentPinnedComment, ...otherComments];
        setPinnedCommentId(currentPinnedComment.id);
      } else {
        setPinnedCommentId(null);
      }

      setComments(finalComments);
      setDisplayedCommentsCount(Math.min(3, finalComments.length));

    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Failed to load comments.");
    } finally {
      setIsLoading(false);
    }
  }, [project?.id, context]);

  useEffect(() => {
    if (isExpanded) {
      loadComments();
    }
  }, [isExpanded, loadComments]);

  const handleToggleComments = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMentionSearch = useCallback((query) => {
    if (!query || query.length < 1) {
      setMentionSuggestions([]);
      setShowMentions(false);
      setSelectedMentionIndex(-1);
      return;
    }

    const filteredUsers = allUsers.filter(user => {
      if (!user.full_name && !user.username && !user.email) return false;
      const fullName = user.full_name?.toLowerCase() || '';
      const username = user.username?.toLowerCase() || '';
      const emailPart = user.email?.split('@')[0]?.toLowerCase() || '';
      const searchQuery = query.toLowerCase();
      return (
        fullName.includes(searchQuery) ||
        fullName.split(' ').some(namePart => namePart.startsWith(searchQuery)) ||
        (username && username.includes(searchQuery)) ||
        (emailPart && emailPart.includes(searchQuery))
      );
    });

    setMentionSuggestions(filteredUsers.slice(0, 5));
    setShowMentions(filteredUsers.length > 0);
    setSelectedMentionIndex(-1); // Reset selection when query changes
  }, [allUsers]);

  const handleTextareaChange = (e, isReply = false) => {
    const text = e.target.value;
    const currentCursorPos = e.target.selectionStart;

    if (isReply) {
      setReplyContent(text);
      setReplyCursorPosition(currentCursorPos);
    } else {
      setNewComment(text);
      setCursorPosition(currentCursorPos);
    }

    const textToCursor = text.substring(0, currentCursorPos);
    // Regex to capture the mention query, allowing spaces for full names
    const mentionMatch = textToCursor.match(/@([a-zA-Z0-9_\u00C0-\u017F\s]*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query); // Store the current query
      handleMentionSearch(query);
    } else {
      setShowMentions(false);
      setMentionSuggestions([]);
      setMentionQuery("");
      setSelectedMentionIndex(-1); // Reset selection
    }
  };

  // Replaces handleMentionSelect
  const insertMention = useCallback((user, isReply = false) => {
      const currentText = isReply ? replyContent : newComment;
      const currentCursorPos = isReply ? replyCursorPosition : cursorPosition;
      const textarea = isReply ? replyTextareaRef.current : textareaRef.current;

      const textBeforeCursor = currentText.substring(0, currentCursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      if (lastAtIndex === -1) return; // Should not happen if suggestions are showing

      const textBeforeAt = textBeforeCursor.substring(0, lastAtIndex);
      const textAfterCursor = currentText.substring(currentCursorPos);

      // Prefer username if available, otherwise full_name, fallback to email prefix
      const usernameToInsert = user.username || user.full_name?.split(' ')[0] || user.email?.split('@')[0];
      const mentionText = `@${usernameToInsert}`;
      const newText = `${textBeforeAt}${mentionText} ${textAfterCursor}`; // Add a space after mention

      const newPos = (textBeforeAt + mentionText + ' ').length;

      if (isReply) {
          setReplyContent(newText);
          setReplyCursorPosition(newPos);
      } else {
          setNewComment(newText);
          setCursorPosition(newPos);
      }

      setShowMentions(false);
      setMentionSuggestions([]);
      setMentionQuery("");
      setSelectedMentionIndex(-1);

      setMentionedEmails(prev => {
          if (!prev.includes(user.email)) {
              return [...prev, user.email];
          }
          return prev;
      });

      // Restore focus and set cursor position
      setTimeout(() => {
          if (textarea) {
              textarea.focus();
              textarea.setSelectionRange(newPos, newPos);
          }
      }, 0);
  }, [newComment, replyContent, cursorPosition, replyCursorPosition, mentionQuery, mentionedEmails]);

  const handleTextareaKeyDown = useCallback((e, isReply = false) => {
    if (!showMentions || mentionSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev + 1) % mentionSuggestions.length);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
    } else if (e.key === 'Enter') {
        e.preventDefault(); // Prevent new line
        if (selectedMentionIndex !== -1) {
            insertMention(mentionSuggestions[selectedMentionIndex], isReply);
        } else if (mentionSuggestions.length > 0) { // If no selection but suggestions exist, pick first
            insertMention(mentionSuggestions[0], isReply);
        }
    } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        setSelectedMentionIndex(-1);
    }
  }, [showMentions, mentionSuggestions, selectedMentionIndex, insertMention]);


  const handlePostComment = async (parentCommentId = null) => {
    const content = parentCommentId ? replyContent : newComment;

    if (!currentUser || !content.trim()) {
      toast.error("Please sign in and enter a comment.");
      return;
    }

    setIsPosting(true);

    const mentionedUserEmailsForNotification = [];
    // Use the simpler regex to match the username format we actually insert
    const mentionPattern = /@(\w+)/g; 
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      const mentionedName = match[1].trim();
      const mentionedUser = allUsers.find(user => {
        if (!user.full_name && !user.username) return false;
        // Prioritize username for lookup as that's what we insert
        return user.username?.toLowerCase() === mentionedName.toLowerCase() ||
               user.full_name?.toLowerCase().startsWith(mentionedName.toLowerCase()); // Check full_name starting with mentionedName
      });

      if (mentionedUser && !mentionedUserEmailsForNotification.includes(mentionedUser.email)) {
        mentionedUserEmailsForNotification.push(mentionedUser.email);
      }
    }

    try {
      const commentsContext = context === "feed_post" ? "feed_post" : context;
      const commentData = {
        project_id: project.id,
        user_email: currentUser.email,
        content: content.trim(),
        context: commentsContext,
        mentions: mentionedUserEmailsForNotification, // Use the emails extracted for notifications
        parent_comment_id: parentCommentId || undefined
      };

      const createdComment = await Comment.create(commentData);

      // Create notifications for mentioned users
      if (mentionedUserEmailsForNotification.length > 0) {
        for (const mentionedEmail of mentionedUserEmailsForNotification) {
          // Don't notify if user mentions themselves
          if (mentionedEmail !== currentUser.email) {
            await Notification.create({
              user_email: mentionedEmail,
              title: "You were mentioned in a comment",
              message: `${currentUser.full_name || currentUser.email} mentioned you in a comment on "${project.title}": "${content.trim().substring(0, 100)}${content.trim().length > 100 ? '...' : ''}"`,
              type: "feed_comment_mention",
              related_project_id: project.id,
              actor_email: currentUser.email,
              actor_name: currentUser.full_name || currentUser.email,
              metadata: {
                project_title: project.title,
                comment_id: createdComment.id,
                comment_content: content.trim()
              }
            });
          }
        }
      }

      // Create notification for project owner if someone commented (and not a mention notification)
      if (project.created_by !== currentUser.email && !mentionedUserEmailsForNotification.includes(project.created_by)) {
        await Notification.create({
          user_email: project.created_by,
          title: "New comment on your project",
          message: `${currentUser.full_name || currentUser.email} commented on "${project.title}": "${content.trim().substring(0, 100)}${content.trim().length > 100 ? '...' : ''}"`,
          type: "feed_comment",
          related_project_id: project.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email,
          metadata: {
            project_title: project.title,
            comment_id: createdComment.id
          }
        });
      }

      // If it's a reply, notify the parent comment author (unless they're the current user or already mentioned)
      if (parentCommentId) {
        const parentComment = comments.find(c => c.id === parentCommentId) || 
                             comments.flatMap(c => c.replies || []).find(r => r.id === parentCommentId);
        
        if (parentComment && 
            parentComment.user_email !== currentUser.email && 
            !mentionedUserEmailsForNotification.includes(parentComment.user_email)) {
          await Notification.create({
            user_email: parentComment.user_email,
            title: "New reply to your comment",
            message: `${currentUser.full_name || currentUser.email} replied to your comment on "${project.title}": "${content.trim().substring(0, 100)}${content.trim().length > 100 ? '...' : ''}"`,
            type: "feed_comment",
            related_project_id: project.id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            metadata: {
              project_title: project.title,
              comment_id: createdComment.id,
              parent_comment_id: parentCommentId
            }
          });
        }
      }

      if (parentCommentId) {
        setReplyContent("");
        setReplyingTo(null);
      } else {
        setNewComment("");
      }

      setMentionedEmails([]); // Clear mentioned emails after successful post
      // Removed: toast.success(parentCommentId ? "Reply posted successfully!" : "Comment posted successfully!");
      loadComments();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment.");
    } finally {
      setIsPosting(false);
      setShowMentions(false);
      setMentionSuggestions([]);
      setMentionQuery("");
      setSelectedMentionIndex(-1);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingContent.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    try {
      await Comment.update(commentId, { content: editingContent.trim() });
      setEditingComment(null);
      setEditingContent("");
      // Removed: toast.success("Comment updated successfully!");
      loadComments();
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment.");
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteConfirm.commentId) return;
    try {
      await Comment.delete(deleteConfirm.commentId);
      // Removed: toast.success("Comment deleted successfully!");
      loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment.");
    } finally {
      setDeleteConfirm({ isOpen: false, commentId: null });
    }
  };

  const handlePinComment = async (commentId) => {
    try {
      if (pinnedCommentId && pinnedCommentId !== commentId) {
        await Comment.update(pinnedCommentId, { is_pinned: false, pinned_date: null });
      }
      await Comment.update(commentId, { is_pinned: true, pinned_date: new Date().toISOString() });
      // Removed: toast.success("Comment pinned successfully!");
      loadComments();
    } catch (error) {
      console.error("Error pinning comment:", error);
      toast.error("Failed to pin comment.");
    }
  };

  const handleUnpinComment = async (commentId) => {
    try {
      await Comment.update(commentId, { is_pinned: false, pinned_date: null });
      // Removed: toast.success("Comment unpinned successfully!");
      loadComments();
    } catch (error) {
      console.error("Error unpinning comment:", error);
      toast.error("Failed to unpin comment.");
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const canEditOrDelete = (comment) => {
    return currentUser && (
      currentUser.email === comment.user_email ||
      currentUser.email === project.created_by
    );
  };

  const canPinUnpin = (comment) => {
    return currentUser && currentUser.email === project.created_by;
  };

  const loadMoreComments = () => {
    setDisplayedCommentsCount(prevCount => Math.min(prevCount + 5, comments.length));
  };

  const showLessComments = () => {
    setDisplayedCommentsCount(3);
  };

  const displayedComments = comments.slice(0, displayedCommentsCount);

  // Helper to render mention suggestions
  const renderMentionSuggestions = (isReply = false) => {
    if (!showMentions || mentionSuggestions.length === 0) return null;

    return (
        <Card className="absolute z-50 w-full max-h-48 overflow-y-auto shadow-xl border-2 border-purple-200 bg-white">
            {mentionSuggestions.map((user, index) => (
                <div
                    key={user.id || user.email} // Use user.id for stable keys
                    className={`flex items-center p-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                        index === selectedMentionIndex ? 'bg-purple-50' : ''
                    }`}
                    onMouseDown={(e) => e.preventDefault()} // Keep focus on textarea
                    onClick={() => insertMention(user, isReply)}
                >
                    <Avatar className="w-8 h-8 mr-3">
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-sm">
                            {user.full_name?.[0] || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <span className="text-sm font-medium text-gray-900">{user.full_name || 'Unknown User'}</span>
                        <div className="text-xs text-gray-500">@{user.username || user.email?.split('@')[0]}</div>
                    </div>
                </div>
            ))}
        </Card>
    );
  };


  const renderComment = (comment, isReply = false) => {
    const commenterProfile = commentProfiles[comment.user_email];
    const displayName = comment.user_name || commenterProfile?.full_name || comment.user_email?.split('@')[0] || 'Anonymous';
    const profileUrl = commenterProfile?.username
      ? createPageUrl(`UserProfile?username=${commenterProfile.username}`)
      : createPageUrl(`UserProfile?email=${comment.user_email}`);

    const isCommentOwner = currentUser && currentUser.email === comment.user_email;
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;

    const replies = comment.replies || [];

    return (
      <div 
        key={comment.id} 
        className={`flex items-start space-x-2 sm:space-x-3 transition-colors duration-300 relative 
        ${isReply ? 'ml-3 sm:ml-4 pt-3 border-l-2 border-gray-200 pl-3' : ''}
        ${isEditing ? 'bg-purple-50 rounded-xl p-2 -mx-2 -my-1' : ''}
        ${isReplying ? 'bg-blue-50 rounded-xl p-2 -mx-2 -my-1' : ''}
        `}
      >
        <div className="flex items-start space-x-3 group flex-1">
          <Link to={profileUrl} className="flex-shrink-0">
            <Avatar className="w-8 h-8 sm:w-9 sm:h-9 mt-1 border-2 border-white shadow-sm">
              <AvatarImage src={comment.user_avatar || commenterProfile?.profile_image} className="object-cover" />
              <AvatarFallback className="text-xs sm:text-sm bg-gradient-to-br from-purple-400 to-purple-600 text-white font-medium">
                {displayName[0]?.toUpperCase()}
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
                  {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                </span>
                {comment.is_pinned && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs flex-shrink-0 border-yellow-300">
                    <Pin className="w-3 h-3 mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>
              <div className="relative">
                {canEditOrDelete(comment) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500 hover:text-gray-900">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isCommentOwner && (
                        <DropdownMenuItem onClick={() => { setEditingComment(comment.id); setEditingContent(comment.content); }} className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />
                          <span>Edit Comment</span>
                        </DropdownMenuItem>
                      )}
                      {canPinUnpin(comment) && !isReply && (
                        <DropdownMenuItem
                          onClick={() => comment.is_pinned ? handleUnpinComment(comment.id) : handlePinComment(comment.id)}
                          className="cursor-pointer"
                        >
                          <Pin className={`w-4 h-4 mr-2 ${comment.is_pinned ? 'text-purple-600' : ''}`} />
                          <span>{comment.is_pinned ? 'Unpin Comment' : 'Pin Comment'}</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => setDeleteConfirm({ isOpen: true, commentId: comment.id })} 
                        className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span>Delete Comment</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            {isEditing ? (
                <div className="space-y-2 p-3 bg-white rounded-lg border border-purple-200">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={2}
                    className="resize-none text-sm border-purple-200 focus:border-purple-400"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingComment(null)} className="h-8">
                      Cancel
                    </Button>
                    <Button size="sm" className="cu-button h-8" onClick={() => handleUpdateComment(comment.id)}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                    {renderWithMentions(comment.content, commentProfiles)}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-2">
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              )}
              {replyCount > 0 && !isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-medium"
                  onClick={() => toggleReplies(comment.id)}
                >
                  {repliesExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </Button>
              )}
            </div>

            {isReplying && currentUser && (
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
                      ref={replyTextareaRef}
                      placeholder={`Replying to ${displayName}...`}
                      value={replyContent}
                      onChange={(e) => handleTextareaChange(e, true)}
                      onKeyDown={(e) => handleTextareaKeyDown(e, true)}
                      rows={3}
                      className="text-sm resize-none border-purple-200 focus:border-purple-400 bg-white"
                    />

                    {renderMentionSuggestions(true)}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setReplyingTo(null); setReplyContent(""); }}
                    className="h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePostComment(comment.id)}
                    disabled={!replyContent.trim() || isPosting}
                    className="cu-button h-8"
                  >
                    <Send className="w-3 h-3 mr-1" />
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
      </div>
    );
  };

  return (
    <>
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, commentId: null })}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        onConfirm={handleDeleteComment}
      />

      <div className="border-t pt-4">
        <Button
          variant="ghost"
          onClick={handleToggleComments}
          className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 p-0 h-auto mb-2 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isExpanded ? 'Hide Comments' : `${comments.length > 0 ? `View ${comments.length}` : 'Add'} Comment${comments.length !== 1 ? 's' : ''}`}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-6"
            >
              {currentUser ? (
                <div className="flex items-start space-x-4 p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 shadow-sm">
                  <Link to={createPageUrl(currentUser?.username ? `UserProfile?username=${currentUser.username}` : `UserProfile?email=${currentUser.email}`)}>
                    <Avatar className="w-10 h-10 mt-1 cursor-pointer border-2 border-white shadow">
                      <AvatarImage src={currentUser?.profile_image} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm font-medium">
                        {currentUser?.full_name?.[0] || currentUser?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 space-y-3 relative">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChange={(e) => handleTextareaChange(e, false)}
                      onKeyDown={(e) => handleTextareaKeyDown(e, false)} // Add keydown handler for main comment
                      rows={3}
                      className="resize-none text-sm border-purple-200 focus:border-purple-400 focus:ring-purple-400 bg-white shadow-sm"
                    />

                    {/* Render mention suggestions for main comment */}
                    {renderMentionSuggestions(false)}

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handlePostComment()}
                        disabled={isPosting || !newComment.trim()}
                        size="sm"
                        className="cu-button px-6 shadow"
                      >
                        <Send className="w-3 h-3 mr-2" />
                        {isPosting ? "Posting..." : "Post Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl text-center border border-purple-100">
                  <p className="text-sm text-gray-600 mb-3">Sign in to join the conversation</p>
                  <Button onClick={() => User.login()} size="sm" className="cu-button shadow">
                    Sign In
                  </Button>
                </div>
              )}

              {isLoading ? (
                <p className="text-sm text-gray-500 text-center py-6">Loading comments...</p>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {displayedComments.map((comment) => (
                      <motion.div
                        key={comment.id} // Key should be on motion.div for AnimatePresence
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {renderComment(comment, false)}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {comments.length > 3 && (
                <div className="text-center pt-4 border-t">
                  {displayedCommentsCount < comments.length ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMoreComments}
                      className="text-sm border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                    >
                      Load More ({comments.length - displayedCommentsCount} remaining)
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={showLessComments}
                      className="text-sm border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                    >
                      Show Less
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

export default FeedComments;