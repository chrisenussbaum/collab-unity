import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, Advertisement, ProjectApplaud, Notification, FeedPost, FeedPostApplaud, Comment, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  MessageCircle,
  Share2,
  Users,
  CheckCircle,
  Clock,
  Camera,
  Search,
  MapPin,
  Link as LinkIcon,
  Tag,
  Building2,
  MoreVertical,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Plus,
  Video,
  Lightbulb,
  Trash2,
  AlertCircle,
  PartyPopper,
  TrendingUp,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Code,
  Maximize2,
  ExternalLink,
  DollarSign,
  CreditCard,
  Wallet,
  HandHeart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import MediaDisplay from "../components/MediaDisplay";
import AdvertisementCard from "../components/AdvertisementCard";
import FeedComments from "../components/FeedComments";
import CreatePostDialog from "../components/CreatePostDialog";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { getPublicUserProfiles } from '@/functions/getPublicUserProfiles';
import { injectAds } from '@/functions/injectAds';
import { toast } from "sonner";
import HorizontalScrollContainer from "../components/HorizontalScrollContainer";
import IDEPreviewDialog from "@/components/IDEPreviewDialog";
import ProjectLinkPreviewDialog from "@/components/ProjectLinkPreviewDialog";
import FeedProjectHighlights from "../components/FeedProjectHighlights";
import ProjectActivityIndicator, { isProjectActive } from "../components/ProjectActivityIndicator";

const formatEnumLabel = (str) => {
  if (!str) return '';
  const inputStr = String(str);
  return inputStr
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 && i < retries - 1) {
        console.warn(`Rate limit hit, retrying in ${(delay / 1000).toFixed(1)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 3;
        continue;
      }
      throw error;
    }
  }
};

const FeedPostItem = ({ post, owner, currentUser, feedPostApplauds, onPostDeleted, onApplaudUpdate }) => {
  const [isApplauded, setIsApplauded] = useState(false);
  const [applaudCount, setApplaudCount] = useState(0);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relatedProject, setRelatedProject] = useState(null);
  const commentsRef = useRef(null);

  const isOwner = currentUser && post.created_by === currentUser.email;

  // Status configuration for status updates
  const statusConfig = {
    on_track: { 
      label: "On Track", 
      icon: CheckCircle, 
      color: "bg-green-100 text-green-700 border-green-200" 
    },
    at_risk: { 
      label: "At Risk", 
      icon: AlertCircle, 
      color: "bg-yellow-100 text-yellow-700 border-yellow-200" 
    },
    delayed: { 
      label: "Delayed", 
      icon: Clock, 
      color: "bg-red-100 text-red-700 border-red-200" 
    },
    completed: { 
      label: "Completed", 
      icon: PartyPopper, 
      color: "bg-purple-100 text-purple-700 border-purple-200" 
    }
  };

  const postTypeConfig = {
    status_update: {
      icon: TrendingUp,
      label: "Project Status Update",
      color: "border-blue-500"
    },
    narrative: {
      icon: BookOpen,
      label: "Story & Insights",
      color: "border-purple-500"
    },
    collaboration_call: {
      icon: Users,
      label: "Call for Collaboration",
      color: "border-green-500"
    }
  };

  const currentPostType = postTypeConfig[post.post_type] || postTypeConfig.narrative;
  const PostTypeIcon = currentPostType.icon;

  useEffect(() => {
    const currentPostApplauds = feedPostApplauds.filter(a => a.feed_post_id === post.id);
    setApplaudCount(currentPostApplauds.length);
    
    if (currentUser) {
      const userApplauded = currentPostApplauds.some(applaud => applaud.user_email === currentUser.email);
      setIsApplauded(userApplauded);
    } else {
      setIsApplauded(false);
    }
  }, [feedPostApplauds, post.id, currentUser]);

  // Load related project if it exists
  useEffect(() => {
    const loadRelatedProject = async () => {
      if (post.related_project_id) {
        try {
          const project = await Project.get(post.related_project_id);
          setRelatedProject(project);
        } catch (error) {
          console.error("Error loading related project:", error);
        }
      }
    };
    loadRelatedProject();
  }, [post.related_project_id]);

  const handleApplaud = async () => {
    if (!currentUser) {
      return;
    }
    try {
      if (isApplauded) {
        const userApplaud = feedPostApplauds.find(applaud => 
          applaud.feed_post_id === post.id && applaud.user_email === currentUser.email
        );
        if (userApplaud) {
          await FeedPostApplaud.delete(userApplaud.id);
          setIsApplauded(false);
          setApplaudCount(prev => prev - 1);
          if (onApplaudUpdate) onApplaudUpdate();
        }
      } else {
        await FeedPostApplaud.create({
          feed_post_id: post.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email
        });
        setIsApplauded(true);
        setApplaudCount(prev => prev + 1);

        if (post.created_by !== currentUser.email) {
          await Notification.create({
            user_email: post.created_by,
            title: "Someone applauded your post!",
            message: `${currentUser.full_name || currentUser.email} applauded your post "${post.title || post.content.substring(0, 50) + '...' }".`,
            type: "feed_post_applaud",
            related_feed_post_id: post.id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            metadata: { post_title: post.title }
          });
        }
        if (onApplaudUpdate) onApplaudUpdate();
      }
    } catch (error) {
      console.error("Error handling feed post applaud:", error);
      toast.error("Failed to update applaud.");
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}${createPageUrl(`FeedPostDetail?id=${post.id}`)}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      // Silent success
    }).catch(err => {
      toast.error("Failed to copy link.");
      console.error('Failed to copy: ', err);
    });
  };

  const handleCommentClick = () => {
    if (commentsRef.current) {
      commentsRef.current.toggle();
    }
  };

  const handleDeletePost = async () => {
    if (!currentUser || !isOwner) return;

    setIsDeleting(true);
    try {
      const postApplauds = feedPostApplauds.filter(a => a.feed_post_id === post.id);
      for (const applaud of postApplauds) {
        await FeedPostApplaud.delete(applaud.id);
      }

      const postComments = await Comment.filter({ 
        project_id: post.id,
        context: "feed_post" 
      });
      for (const comment of postComments) {
        await Comment.delete(comment.id);
      }

      await FeedPost.delete(post.id);

      setShowDeleteConfirm(false);
      if (onPostDeleted) onPostDeleted();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone and will remove all comments and applauds associated with it."
        confirmText="Delete Post"
        isDestructive={true}
        onConfirm={handleDeletePost}
        isLoading={isDeleting}
      />

      <Card className={`cu-card mb-6 overflow-hidden border-t-4 ${currentPostType.color} hover:shadow-lg transition-shadow duration-300`}>
        <CardHeader className="px-3 sm:px-4 md:px-6 pb-3">
          <div className="flex items-start justify-between space-x-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <Link 
                to={createPageUrl(owner?.username ? `UserProfile?username=${owner.username}` : `UserProfile?email=${owner?.email}`)}
                className="flex-shrink-0"
              >
                <Avatar className="w-12 h-12 border-2 border-gray-100 shadow-sm">
                  <AvatarImage src={owner?.profile_image} className="object-cover" />
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                    {owner?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {React.createElement(PostTypeIcon, { className: "w-4 h-4 text-gray-500" })}
                  <span className="text-xs text-gray-500 font-medium">{currentPostType.label}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 mb-1">
                  {post.title || "Untitled Post"}
                </h3>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                  <Link
                    to={createPageUrl(owner?.username ? `UserProfile?username=${owner.username}` : `UserProfile?email=${owner?.email}`)}
                    className="flex items-center space-x-1.5 group"
                  >
                    <span className="text-xs sm:text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                      {owner?.full_name || 'Anonymous User'}
                    </span>
                  </Link>
                  <span className="text-xs sm:text-sm text-gray-400">•</span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.created_date))} ago
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 pt-2">
          {/* Status Update Display */}
          {post.post_type === "status_update" && (
            <div className="space-y-4">
              {post.status && (
                <div className="flex items-center gap-2">
                  {React.createElement(statusConfig[post.status]?.icon || CheckCircle, {
                    className: "w-5 h-5"
                  })}
                  <Badge className={`text-sm border ${statusConfig[post.status]?.color || statusConfig.on_track.color}`}>
                    {statusConfig[post.status]?.label || "On Track"}
                  </Badge>
                </div>
              )}
              
              <p className="text-gray-700 cu-text-responsive-sm leading-relaxed">
                {post.content}
              </p>

              {post.key_points && post.key_points.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Key Points:</h4>
                  <ul className="space-y-2">
                    {post.key_points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Project for Status Updates */}
              {relatedProject && (
                <Link to={createPageUrl(`ProjectDetail?id=${relatedProject.id}`)}>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      {relatedProject.logo_url ? (
                        <img 
                          src={relatedProject.logo_url} 
                          alt={relatedProject.title}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                          <Lightbulb className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-medium mb-1">Related Project</p>
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{relatedProject.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-1">{relatedProject.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Narrative Display */}
          {post.post_type === "narrative" && (
            <div className="space-y-4">
              <p className="text-gray-700 cu-text-responsive-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Related Project for Narratives */}
              {relatedProject && (
                <Link to={createPageUrl(`ProjectDetail?id=${relatedProject.id}`)}>
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      {relatedProject.logo_url ? (
                        <img 
                          src={relatedProject.logo_url} 
                          alt={relatedProject.title}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                          <Lightbulb className="w-6 h-6 text-purple-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-purple-600 font-medium mb-1">Related Project</p>
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{relatedProject.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-1">{relatedProject.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Collaboration Call Display */}
          {post.post_type === "collaboration_call" && (
            <div className="space-y-4">
              <p className="text-gray-700 cu-text-responsive-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Related Project */}
              {relatedProject && (
                <Link to={createPageUrl(`ProjectDetail?id=${relatedProject.id}`)}>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      {relatedProject.logo_url ? (
                        <img 
                          src={relatedProject.logo_url} 
                          alt={relatedProject.title}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center border-2 border-white shadow-sm">
                          <Lightbulb className="w-6 h-6 text-green-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-green-600 font-medium mb-1">Related Project</p>
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{relatedProject.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-1">{relatedProject.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Looking for:</span>
                  {post.tags.map(tag => (
                    <Badge key={tag} className="bg-green-100 text-green-700 border border-green-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags for narrative and status updates */}
          {(post.post_type === "narrative" || post.post_type === "status_update") && post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
              {post.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Media if available */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-4">
              <MediaDisplay
                src={post.media_urls[0]}
                mediaType={post.media_types?.[0] || 'image'}
                className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                allMedia={post.media_urls.map((url, i) => ({
                  media_url: url,
                  media_type: post.media_types?.[i] || 'image',
                  caption: post.media_captions?.[i]
                }))}
                currentIndex={0}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-gradient-to-r from-gray-50 to-blue-50/30 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-blue-100/50">
          <div className="w-full">
            <div className="flex justify-around pb-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center space-x-2 transition-colors cu-text-responsive-sm ${isApplauded ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-blue-600'}`}
                onClick={handleApplaud}
              >
                <HandHeart className="cu-icon-sm" />
                <span className="hidden sm:inline">Applaud</span>
                {applaudCount > 0 && (
                  <span className="cu-text-responsive-xs bg-gray-200 px-2 py-1 rounded-full ml-1">
                    {applaudCount}
                  </span>
                )}
              </Button>
              <div className="flex-1 flex justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors cu-text-responsive-sm"
                  onClick={handleCommentClick}
                >
                  <MessageCircle className="cu-icon-sm" />
                  <span className="hidden sm:inline">Comment</span>
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors cu-text-responsive-sm"
                onClick={handleShare}
              >
                <Share2 className="cu-icon-sm" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
            <FeedComments
              ref={commentsRef}
              project={post}
              currentUser={currentUser}
              context="feed_post"
            />
          </div>
        </CardFooter>
      </Card>
    </>
  );
};


const ProjectPost = ({ project, owner, currentUser, projectApplauds = [], projectIDEs = [], onProjectUpdate, onApplaudUpdate, collaboratorProfilesMap = {} }) => {
  const [contentView, setContentView] = React.useState('link');
  const [isApplauded, setIsApplauded] = useState(false);
  const [applaudCount, setApplaudCount] = useState(0);
  const commentsRef = useRef(null);
  const [showAllLinksDialog, setShowAllLinksDialog] = useState(false);

  // Initialize applaud state from projectApplauds prop
  useEffect(() => {
    const currentProjectApplauds = projectApplauds.filter(a => a.project_id === project.id);
    setApplaudCount(currentProjectApplauds.length);
    
    if (currentUser) {
      const userApplauded = currentProjectApplauds.some(applaud => applaud.user_email === currentUser.email);
      setIsApplauded(userApplauded);
    } else {
      setIsApplauded(false);
    }
  }, [projectApplauds, project.id, currentUser]);



  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(project.followers_count || 0);

  // IDE Preview States
  const [selectedIDE, setSelectedIDE] = useState(null);
  const [showIDEPreview, setShowIDEPreview] = useState(false);

  // Project Link Preview States
  const [selectedProjectLink, setSelectedProjectLink] = useState(null);
  const [showLinkPreview, setShowLinkPreview] = useState(false);

  // Funding Dialog State
  const [showFundingDialog, setShowFundingDialog] = useState(false);

  // Collaborator profiles state
  const [collaboratorProfiles, setCollaboratorProfiles] = useState([]);

  const isOwnProject = currentUser && project.created_by === currentUser.email;

  const statusConfig = {
    seeking_collaborators: {
      color: "border-orange-500",
      icon: <Users className="w-3 h-3 mr-1 text-orange-500" />,
      label: "Seeking Collaborators"
    },
    in_progress: {
      color: "border-blue-500",
      icon: <Clock className="w-3 h-3 mr-1 text-blue-500" />,
      label: "In Progress"
    },
    completed: {
      color: "border-green-500",
      icon: <CheckCircle className="w-3 h-3 mr-1 text-green-500" />,
      label: "Project Completed"
    }
  };

  const config = statusConfig[project.status] || {};

  const hasLinks = project.project_urls?.length > 0;
  const hasHighlights = project.highlights && project.highlights.length > 0;
  const hasIDEs = projectIDEs.length > 0;
  const hasAnyContent = hasLinks || hasHighlights || hasIDEs;
  const hasMultipleLinks = project.project_urls?.length > 1;

  useEffect(() => {
    if (hasLinks) {
      setContentView('link');
    } else if (hasIDEs) {
      setContentView('ides');
    } else if (hasHighlights) {
      setContentView('highlights');
    }
  }, [hasLinks, hasHighlights, hasIDEs]);

  // Fetch collaborator profiles
  useEffect(() => {
    const fetchCollaboratorProfiles = async () => {
      if (!project.collaborator_emails || project.collaborator_emails.length === 0) {
        setCollaboratorProfiles([]); // Ensure it's reset if no collaborators
        return;
      }

      try {
        // Get the first 3 collaborator emails
        const emailsToFetch = project.collaborator_emails.slice(0, 3);
        const { data: profiles } = await withRetry(() => 
          getPublicUserProfiles({ emails: emailsToFetch })
        );
        setCollaboratorProfiles(profiles || []);
      } catch (error) {
        console.error("Error fetching collaborator profiles:", error);
      }
    };

    fetchCollaboratorProfiles();
  }, [project.collaborator_emails]);

  // Initialize following state
  useEffect(() => {
    if (currentUser?.followed_projects) {
      setIsFollowing(currentUser.followed_projects.includes(project.id));
    }
    setFollowersCount(project.followers_count || 0);
  }, [currentUser, project.id, project.followers_count]);

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      return;
    }

    // Prevent users from following their own projects
    if (isOwnProject) {
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        const updatedFollowed = (currentUser.followed_projects || []).filter(id => id !== project.id);
        await base44.auth.updateMe({ followed_projects: updatedFollowed });
        
        // Update project followers count
        const newCount = Math.max(0, followersCount - 1);
        await Project.update(project.id, { followers_count: newCount });
        
        setIsFollowing(false);
        setFollowersCount(newCount);
        
        if (onProjectUpdate) onProjectUpdate();
        
        // ADDED: Refresh current user to ensure state is updated
        try {
          const updatedUser = await base44.auth.me();
          // Force a re-render by updating the window location state
          window.dispatchEvent(new CustomEvent('user-updated', { detail: updatedUser }));
        } catch (err) {
          console.error("Failed to refresh user after unfollow:", err);
        }
      } else {
        // Follow
        const updatedFollowed = [...(currentUser.followed_projects || []), project.id];
        await base44.auth.updateMe({ followed_projects: updatedFollowed });
        
        // Update project followers count
        const newCount = followersCount + 1;
        await Project.update(project.id, { followers_count: newCount });
        
        setIsFollowing(true);
        setFollowersCount(newCount);
        
        if (onProjectUpdate) onProjectUpdate();
        
        // ADDED: Refresh current user to ensure state is updated
        try {
          const updatedUser = await base44.auth.me();
          // Force a re-render by updating the window location state
          window.dispatchEvent(new CustomEvent('user-updated', { detail: updatedUser }));
        } catch (err) {
          console.error("Failed to refresh user after follow:", err);
        }
      }
    } catch (error) {
      console.error("Error handling follow:", error);
      toast.error("Failed to update follow status.");
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const projectUrl = `${window.location.origin}${createPageUrl(`ProjectDetail?id=${project.id}`)}`;
    navigator.clipboard.writeText(projectUrl).then(() => {
      // Silent success - user sees the action completed
    }).catch(err => {
      toast.error("Failed to copy link.");
      console.error('Failed to copy: ', err);
    });
  };

  const handleFund = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if any payment usernames are available
    const hasPaymentLink = project.paypal_link || project.venmo_link || project.cashapp_link;
    
    if (!hasPaymentLink) {
      return;
    }

    // Open the funding dialog instead of directly redirecting
    setShowFundingDialog(true);
  };

  const handlePaymentRedirect = (platform) => {
    let paymentUrl = null;
    
    if (platform === 'paypal' && project.paypal_link) {
      paymentUrl = `https://paypal.me/${project.paypal_link}`;
    } else if (platform === 'venmo' && project.venmo_link) {
      paymentUrl = `https://venmo.com/${project.venmo_link}`;
    } else if (platform === 'cashapp' && project.cashapp_link) {
      paymentUrl = `https://cash.app/$${project.cashapp_link}`;
    }

    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      setShowFundingDialog(false);
    }
  };

  const handleApplaud = async () => {
    if (!currentUser) {
      return;
    }

    try {
      if (isApplauded) {
        const userApplaud = projectApplauds.find(applaud => 
          applaud.project_id === project.id && applaud.user_email === currentUser.email
        );
        if (userApplaud) {
          await ProjectApplaud.delete(userApplaud.id);
          setIsApplauded(false);
          setApplaudCount(prev => prev - 1);
          
          if (onApplaudUpdate) {
            onApplaudUpdate();
          }
        }
      } else {
        await ProjectApplaud.create({
          project_id: project.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email
        });
        setIsApplauded(true);
        setApplaudCount(prev => prev + 1);

        if (project.created_by !== currentUser.email) {
          await Notification.create({
            user_email: project.created_by,
            title: "Someone applauded your project!",
            message: `${currentUser.full_name || currentUser.email} applauded your project "${project.title}".`,
            type: "feed_applaud",
            related_project_id: project.id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            metadata: { project_title: project.title }
          });
        }
        
        if (onApplaudUpdate) {
          onApplaudUpdate();
        }
      }
    } catch (error) {
      console.error("Error handling applaud:", error);
      toast.error("Failed to update applaud.");
    }
  };

  const handleCommentClick = () => {
    if (commentsRef.current) {
      commentsRef.current.toggle();
    }
  };



  const getDomain = (urlString) => {
    try {
      const urlObject = new URL(urlString);
      return urlObject.hostname.replace(/^www\./, '');
    } catch (e) {
      return urlString;
    }
  };

  const getFaviconUrl = (urlString) => {
    try {
      const urlObject = new URL(urlString);
      return `https://www.google.com/s2/favicons?sz=128&domain_url=${urlObject.hostname}`;
    } catch (e) {
      return null;
    }
  };

  // Handler for switching content view
  const handleContentViewChange = (view) => {
    setContentView(view);
  };

  const handleIDEClick = (ide) => {
    setSelectedIDE(ide);
    setShowIDEPreview(true);
  };

  const handleProjectLinkClick = (url, shouldPreview = false) => {
    if (shouldPreview) {
      setSelectedProjectLink(url);
      setShowLinkPreview(true);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* IDE Preview Dialog */}
      <IDEPreviewDialog
        isOpen={showIDEPreview}
        onClose={() => setShowIDEPreview(false)}
        codeProject={selectedIDE}
        projectTitle={project.title}
      />

      {/* Project Link Preview Dialog */}
      <ProjectLinkPreviewDialog
        isOpen={showLinkPreview}
        onClose={() => setShowLinkPreview(false)}
        url={selectedProjectLink}
        projectTitle={project.title}
      />

      {/* Funding Dialog */}
      <Dialog open={showFundingDialog} onOpenChange={setShowFundingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Support This Project</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              Choose a payment method to fund <span className="font-semibold">{project.title}</span>. Your contribution helps bring this project to life!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {project.paypal_link && (
              <Button
                onClick={() => handlePaymentRedirect('paypal')}
                className="w-full flex items-center justify-between p-4 h-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">PayPal</div>
                    <div className="text-xs opacity-90">@{project.paypal_link}</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}

            {project.venmo_link && (
              <Button
                onClick={() => handlePaymentRedirect('venmo')}
                className="w-full flex items-center justify-between p-4 h-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <div className="flex items-center space-x-3">
                  <Wallet className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Venmo</div>
                    <div className="text-xs opacity-90">@{project.venmo_link}</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}

            {project.cashapp_link && (
              <Button
                onClick={() => handlePaymentRedirect('cashapp')}
                className="w-full flex items-center justify-between p-4 h-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Cash App</div>
                    <div className="text-xs opacity-90">${project.cashapp_link}</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-col space-y-2">
            <p className="text-xs text-gray-500 text-center">
              You'll be redirected to a secure external payment platform
            </p>
            <Button 
              variant="outline" 
              onClick={() => setShowFundingDialog(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All Links Dialog */}
      <Dialog open={showAllLinksDialog} onOpenChange={setShowAllLinksDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <LinkIcon className="w-5 h-5 mr-2 text-purple-600" />
              All Project Links
            </DialogTitle>
            <DialogDescription>
              Explore all {project.project_urls?.length} links for this project
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {project.project_urls?.map((linkItem, index) => {
              const url = typeof linkItem === 'object' ? linkItem.url : linkItem;
              const title = typeof linkItem === 'object' ? linkItem.title : '';
              return (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <Card className="cu-card bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        </div>
                        <div className="flex-1 text-center bg-white rounded-md mx-4 py-1 truncate">
                          {getDomain(url)}
                        </div>
                        <img 
                          src={getFaviconUrl(url)} 
                          alt={`${getDomain(url)} icon`}
                          className="w-4 h-4"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.innerHTML = '<svg class="w-4 h-4 text-gray-400 group-hover:text-green-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>';
                            e.currentTarget.parentNode.appendChild(fallback.firstChild);
                          }}
                        />
                      </div>
                      <div className="relative aspect-video bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                        <div className="text-center p-4">
                          <img 
                            src={getFaviconUrl(url)} 
                            alt={`${getDomain(url)} icon`}
                            className="w-16 h-16 mx-auto mb-2 object-contain" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.innerHTML = '<div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mx-auto mb-2 flex items-center justify-center"><svg class="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></div>';
                              e.currentTarget.parentNode.appendChild(fallback.firstChild);
                            }} 
                          />
                          {title && (
                            <p className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{title}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">Click to visit</p>
                        </div>
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <LinkIcon className="w-8 h-8 text-black/50" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </a>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <motion.div
        id={`project-${project.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className={`cu-card mb-6 overflow-hidden border-t-4 ${config.color} hover:shadow-lg transition-shadow duration-300`}>
          <CardHeader className="px-3 sm:px-4 md:px-6 pb-3">
            <div className="flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="flex-shrink-0">
                  {project.logo_url ? (
                    <img 
                      src={project.logo_url} 
                      alt={project.title}
                      className="w-12 h-12 rounded-lg object-cover border-2 border-gray-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center border-2 border-gray-100 shadow-sm">
                      <Lightbulb className="w-6 h-6 text-purple-600" />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link 
                    to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                    className="block"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors line-clamp-2">
                        {project.title}
                      </h3>
                      <ProjectActivityIndicator 
                        isActive={isProjectActive(project.collaborator_emails, collaboratorProfilesMap)} 
                        size="sm"
                      />
                    </div>
                  </Link>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
                    <Link
                      to={createPageUrl(owner.username ? `UserProfile?username=${owner.username}` : `UserProfile?email=${owner.email}`)}
                      className="flex items-center space-x-1.5 group"
                    >
                      <Avatar className="w-5 h-5 border-2 border-white shadow-sm">
                        <AvatarImage src={owner.profile_image} className="object-cover" />
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                          {owner.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs sm:text-sm text-gray-600 group-hover:text-purple-600 transition-colors">
                        {owner.full_name || 'Anonymous User'}
                      </span>
                    </Link>
                    <span className="text-xs sm:text-sm text-gray-400">•</span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {formatDistanceToNow(new Date(project.created_date))} ago
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {currentUser && !isOwnProject && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 ${isFollowing ? 'text-purple-600 hover:text-purple-700 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                    onClick={handleFollow}
                    title={isFollowing ? "Unfollow project" : "Follow for updates"}
                  >
                    {isFollowing ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 h-9 w-9"
                  title="Share project"
                >
                  <Share2 className="w-4 h-4" />
                </Button>


              </div>
            </div>
             <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Badge variant="outline" className={`text-xs ${config.color} border-current shadow-sm`}>
                    {config.icon}
                    <span className="ml-1">{formatEnumLabel(project.status)}</span>
                  </Badge>
                  <Badge className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200 shadow-sm">
                    {project.project_type}
                  </Badge>
                  {project.classification && (
                    <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50">
                      {formatEnumLabel(project.classification)}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-purple-600">
                    {collaboratorProfiles.length > 0 ? (
                      <div className="flex items-center -space-x-1.5">
                        {collaboratorProfiles.map((collab) => (
                          <Avatar key={collab.email} className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-white shadow-sm">
                            <AvatarImage src={collab.profile_image} className="object-cover" />
                            <AvatarFallback className="bg-purple-100 text-purple-600 text-[10px]">
                              {collab.full_name?.[0] || collab.email?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    ) : (
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    <span className="font-medium ml-1">
                      {(() => {
                        const count = project.collaborator_emails?.length || 1;
                        return count > 3 
                          ? `3+ collaborators`
                          : `${count} ${count === 1 ? 'collaborator' : 'collaborators'}`;
                      })()}
                    </span>
                  </div>
                   {followersCount > 0 && (
                     <div className="flex items-center text-xs sm:text-sm text-gray-600">
                       <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                       <span className="font-medium">{followersCount} {followersCount === 1 ? 'follower' : 'followers'}</span>
                     </div>
                   )}
              </div>
          </CardHeader>

          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 pt-2">
            <p className="text-gray-700 line-clamp-3 mb-4 cu-text-responsive-sm leading-relaxed">{project.description}</p>

            {/* Content Navigation with Arrows - Showcase, IDEs, Highlights */}
            {hasAnyContent && (
              (() => {
                // Build ordered list of available content types
                const contentTypes = [];
                if (hasLinks) contentTypes.push({ key: 'link', label: 'Showcase', icon: LinkIcon, count: project.project_urls?.length });
                if (hasIDEs) contentTypes.push({ key: 'ides', label: 'IDEs', icon: Code, count: projectIDEs.length });
                if (hasHighlights) contentTypes.push({ key: 'highlights', label: 'Highlights', icon: Camera, count: project.highlights?.length });
                
                if (contentTypes.length === 0) return null;
                
                const currentIndex = contentTypes.findIndex(ct => ct.key === contentView);
                const currentType = contentTypes[currentIndex] || contentTypes[0];
                const hasPrev = currentIndex > 0;
                const hasNext = currentIndex < contentTypes.length - 1;
                
                const goToPrev = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (hasPrev) handleContentViewChange(contentTypes[currentIndex - 1].key);
                };
                
                const goToNext = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (hasNext) handleContentViewChange(contentTypes[currentIndex + 1].key);
                };
                
                const CurrentIcon = currentType.icon;
                
                return (
                  <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-lg p-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={goToPrev}
                      disabled={!hasPrev}
                      className={`p-2 ${!hasPrev ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CurrentIcon className="w-4 h-4" />
                      <span>{currentType.label}</span>
                      {currentType.count > 0 && (
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{currentType.count}</span>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={goToNext}
                      disabled={!hasNext}
                      className={`p-2 ${!hasNext ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                );
              })()
            )}

            {/* Project Links - Horizontal Scroll - Direct Links */}
            {(contentView === 'link' && hasLinks) && (
              <div className="mb-4">
                {hasMultipleLinks ? (
                  <div className="space-y-3">
                    <HorizontalScrollContainer
                      className="pb-2"
                      showArrows={project.project_urls.length > 1}
                    >
                      {project.project_urls.slice(0, 3).map((linkItem, index) => {
                        const url = typeof linkItem === 'object' ? linkItem.url : linkItem;
                        const title = typeof linkItem === 'object' ? linkItem.title : '';
                        return (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] block"
                          >
                            <Card className="cu-card bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden h-full border-2 border-gray-100 hover:border-green-300 group">
                              <div className="p-3">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                  <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3" />
                                    Showcase
                                  </Badge>
                                  <img 
                                    src={getFaviconUrl(url)} 
                                    alt={`${getDomain(url)} icon`}
                                    className="w-4 h-4 group-hover:scale-110 transition-transform object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = document.createElement('div');
                                      fallback.innerHTML = '<svg class="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>';
                                      e.currentTarget.parentNode.appendChild(fallback.firstChild);
                                    }}
                                  />
                                </div>
                                
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-2">
                                  <div className="bg-gray-900 px-3 py-2 flex items-center justify-between">
                                    <div className="flex items-center space-x-1">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">{getDomain(url)}</span>
                                  </div>
                                  <div className="aspect-video bg-white flex items-center justify-center p-4 group-hover:bg-gray-50 transition-colors">
                                    <div className="text-center">
                                      <img 
                                        src={getFaviconUrl(url)} 
                                        alt={`${getDomain(url)} icon`}
                                        className="w-16 h-16 mx-auto mb-2 object-contain group-hover:scale-110 transition-transform"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const fallback = document.createElement('div');
                                          fallback.innerHTML = '<div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform"><svg class="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></div>';
                                          e.currentTarget.parentNode.appendChild(fallback.firstChild);
                                        }}
                                      />
                                      {title && (
                                        <p className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{title}</p>
                                      )}
                                      <p className="text-[10px] text-gray-500 mt-1">Click to visit</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors">
                                  {title || getDomain(url)}
                                </h4>
                              </div>
                            </Card>
                          </a>
                        );
                      })}
                    </HorizontalScrollContainer>
                    
                    {project.project_urls.length > 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllLinksDialog(true)}
                        className="w-full"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        View All {project.project_urls.length} Showcase Links
                      </Button>
                    )}
                  </div>
                ) : (
                  (() => {
                    const linkItem = project.project_urls[0];
                    const url = typeof linkItem === 'object' ? linkItem.url : linkItem;
                    const title = typeof linkItem === 'object' ? linkItem.title : '';
                    return (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="flex-shrink-0 w-full max-w-md mx-auto">
                          <Card className="cu-card bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden border-2 border-gray-100 hover:border-green-300 group">
                            <div className="p-4">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                                  <LinkIcon className="w-3 h-3" />
                                  Published
                                </Badge>
                                <img 
                                  src={getFaviconUrl(url)} 
                                  alt={`${getDomain(url)} icon`}
                                  className="w-5 h-5 group-hover:scale-110 transition-transform object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = document.createElement('div');
                                    fallback.innerHTML = '<svg class="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>';
                                    e.currentTarget.parentNode.appendChild(fallback.firstChild);
                                  }}
                                />
                              </div>
                              
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-3">
                                <div className="bg-gray-900 px-3 py-2 flex items-center justify-between">
                                  <div className="flex items-center space-x-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  </div>
                                  <span className="text-[10px] text-gray-400">{getDomain(url)}</span>
                                </div>
                                <div className="aspect-video bg-white flex items-center justify-center p-6 group-hover:bg-gray-50 transition-colors">
                                  <div className="text-center">
                                    <img 
                                      src={getFaviconUrl(url)} 
                                      alt={`${getDomain(url)} icon`}
                                      className="w-20 h-20 mx-auto mb-3 object-contain group-hover:scale-110 transition-transform"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.innerHTML = '<div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform"><svg class="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></div>';
                                        e.currentTarget.parentNode.appendChild(fallback.firstChild);
                                      }}
                                    />
                                    {title && (
                                      <p className="text-base font-bold text-gray-900 mb-1 line-clamp-2 px-2">{title}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Click to visit</p>
                                  </div>
                                </div>
                              </div>
                              
                              <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                                {title || getDomain(url)}
                              </h4>
                              <p className="text-xs text-gray-500">Click anywhere to visit this site</p>
                            </div>
                          </Card>
                        </div>
                      </a>
                    );
                  })()
                )}
              </div>
            )}

            {/* Project Highlights - Horizontal Scroll - WITH UPLOADER AVATARS */}
            {(contentView === 'highlights' && hasHighlights) && (
              <FeedProjectHighlights
                project={project}
                currentUser={currentUser}
                onProjectUpdate={onProjectUpdate}
              />
            )}

            {/* Project IDEs - Interactive Previews */}
            {(contentView === 'ides' && hasIDEs) && (
              <div className="mb-4">
                <HorizontalScrollContainer 
                  className="pb-2"
                  showArrows={projectIDEs.length > 1}
                >
                  {projectIDEs.map((ide, index) => (
                    <div
                      key={ide.id}
                      className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] cursor-pointer"
                      onClick={() => handleIDEClick(ide)}
                    >
                      <Card className="cu-card bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden h-full border-2 border-purple-100 hover:border-purple-300">
                        <div className="p-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                              <Code className="w-3 h-3" />
                              Code Playground
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIDEClick(ide);
                              }}
                            >
                              <Maximize2 className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-2">
                            <div className="bg-gray-900 px-3 py-2 flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              </div>
                              <span className="text-[10px] text-gray-400">Preview</span>
                            </div>
                            <div className="aspect-video bg-white flex items-center justify-center p-4">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                  <Code className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-xs font-semibold text-gray-800">Interactive Preview</p>
                                <p className="text-[10px] text-gray-500 mt-1">Click to explore</p>
                              </div>
                            </div>
                          </div>
                          
                          <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                            {ide.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Updated {new Date(ide.updated_date).toLocaleDateString()}
                          </p>
                        </div>
                      </Card>
                    </div>
                  ))}
                </HorizontalScrollContainer>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 cu-text-responsive-sm text-gray-600 mb-4">
              {project.location && (
                <div className="flex items-center">
                  <MapPin className="cu-icon-sm mr-2 flex-shrink-0 text-purple-500" />
                  <span className="truncate">{project.location}</span>
                </div>
              )}
              {project.industry && (
                <div className="flex items-center">
                  <Building2 className="cu-icon-sm mr-2 flex-shrink-0 text-indigo-500" />
                  <span className="truncate">{formatEnumLabel(project.industry)}</span>
                </div>
              )}
              {project.area_of_interest && (
                <div className="flex items-center">
                  <Tag className="cu-icon-sm mr-2 flex-shrink-0 text-pink-500" />
                  <span className="truncate">{formatEnumLabel(project.area_of_interest)}</span>
                </div>
              )}
            </div>

            {project.skills_needed && project.skills_needed.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.skills_needed.slice(0, 5).map(skill => (
                  <Badge key={skill} className="cu-text-responsive-xs bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200">
                    {skill}
                  </Badge>
                ))}
                {project.skills_needed.length > 5 && (
                  <Badge variant="outline" className="cu-text-responsive-xs border-purple-200 text-purple-600">
                    +{project.skills_needed.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-gradient-to-r from-gray-50 to-purple-50/30 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-purple-100/50">
            <div className="w-full">
              <div className="flex justify-around pb-4 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-2 transition-colors cu-text-responsive-sm ${isApplauded ? 'text-purple-600 hover:text-purple-700' : 'text-gray-600 hover:text-purple-600'}`}
                  onClick={handleApplaud}
                >
                  <HandHeart className="cu-icon-sm" />
                  <span className="hidden sm:inline">Applaud</span>
                  {applaudCount > 0 && (
                    <span className="cu-text-responsive-xs bg-gray-200 px-2 py-1 rounded-full ml-1">
                      {applaudCount}
                    </span>
                  )}
                </Button>

                <div className="flex-1 flex justify-center">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600 cu-text-responsive-sm" onClick={handleCommentClick}>
                    <MessageCircle className="cu-icon-sm" />
                    <span className="hidden sm:inline">Comment</span>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors cu-text-responsive-sm"
                  onClick={handleFund}
                  disabled={!project.paypal_link && !project.venmo_link && !project.cashapp_link}
                >
                  <DollarSign className="cu-icon-sm" />
                  <span className="hidden sm:inline">Fund</span>
                </Button>
              </div>

              <FeedComments
                ref={commentsRef}
                project={project}
                currentUser={currentUser}
              />
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </>
  );
};

export default function Feed({ currentUser, authIsLoading }) {
  const [projects, setProjects] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [projectApplauds, setProjectApplauds] = useState([]);
  const [feedPostApplauds, setFeedPostApplauds] = useState([]);
  const [projectIDEsMap, setProjectIDEsMap] = useState({}); // Map of project_id -> IDEs array
  const [advertisements, setAdvertisements] = useState({
    desktop: { left: [], right: [] },
    mobile: { inline: [] },
    tablet: { inline: [] },
    all: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [inlineAds, setInlineAds] = useState([]);
  const [allCollaboratorProfiles, setAllCollaboratorProfiles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use ref for synchronous tracking of loaded item IDs to prevent race conditions
  const loadedItemIdsRef = useRef(new Set());
  const consecutiveEmptyLoadsRef = useRef(0);
  const MAX_EMPTY_LOAD_ATTEMPTS = 5; // Increased to be more lenient with duplicate detection
  
  const location = useLocation();
  const highlightedItemIdRef = useRef(null);
  const hasScrolledRef = useRef(false);

  const [showFirstProjectPrompt, setShowFirstProjectPrompt] = useState(false);
  const [userProjectCount, setUserProjectCount] = useState(null);
  const navigate = useNavigate();

  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);

  const POSTS_PER_PAGE = 10;

  // Load ads in background without blocking feed
  const loadAdsForPage = useCallback(async (page, items) => {
    try {
      const getDeviceType = () => {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1280) return 'tablet';
        return 'desktop';
      };

      const deviceType = getDeviceType();

      const adsResponse = await injectAds({
        user_email: currentUser?.email || null,
        organic_posts: items.slice(0, 20), // Pass a sample of combined items
        device_type: deviceType,
        insertion_interval: 3,
        current_page: page,
        posts_per_page: POSTS_PER_PAGE
      });

      const { data: adsData } = adsResponse;
      if (adsData) {
        let newInlineAds = [];
        if (deviceType === 'mobile') {
          newInlineAds = adsData.mobile?.inline || [];
        } else if (deviceType === 'tablet') {
          newInlineAds = adsData.tablet?.inline || [];
        }

        if (page === 1) {
          setAdvertisements(adsData);
          setInlineAds(newInlineAds);
        } else {
          setInlineAds(prev => [...prev, ...newInlineAds]);
        }
      }

    } catch (error) {
      console.error("Error loading ads for page", page, ":", error);
      // Don't throw - just log the error so ads don't block feed
    }
  }, [currentUser]);

  const loadApplauds = useCallback(async (projectIds) => {
    if (!projectIds || projectIds.length === 0) {
      return [];
    }
    
    try {
      const allApplauds = await withRetry(() =>
        ProjectApplaud.filter({ project_id: { $in: projectIds } })
      );
      return allApplauds || [];
    } catch (error) {
      console.error("Error loading applauds:", error);
      return [];
    }
  }, []); 

  // BATCH LOAD IDEs for multiple projects
  const loadIDEsForProjects = useCallback(async (projectIds) => {
    if (!projectIds || projectIds.length === 0) {
      return {};
    }
    
    try {
      const allIDEs = await withRetry(() =>
        base44.entities.ProjectIDE.filter({
          project_id: { $in: projectIds },
          is_active: true,
          ide_type: 'code_playground'
        }, '-created_date')
      );
      
      // Group IDEs by project_id
      const idesMap = {};
      (allIDEs || []).forEach(ide => {
        if (!idesMap[ide.project_id]) {
          idesMap[ide.project_id] = [];
        }
        idesMap[ide.project_id].push(ide);
      });
      
      return idesMap;
    } catch (error) {
      console.error("Error loading project IDEs:", error);
      return {};
    }
  }, []);

  const loadFeedPosts = useCallback(async (page = 1, fetchLimit = POSTS_PER_PAGE, currentOffset = 0) => {
    try {
      const offset = (page - 1) * POSTS_PER_PAGE + currentOffset; // Adjusted offset for FeedPost
      const posts = await withRetry(() =>
        FeedPost.filter({ is_visible: true }, "-created_date", fetchLimit, offset)
      );
      
      return posts || [];
    } catch (error) {
      console.error("Error loading feed posts:", error);
      return [];
    }
  }, []);

  const loadFeedPostApplauds = useCallback(async (postIds) => {
    if (!postIds || postIds.length === 0) {
      return [];
    }
    
    try {
      const allApplauds = await withRetry(() =>
        FeedPostApplaud.filter({ feed_post_id: { $in: postIds } })
      );
      return allApplauds || [];
    } catch (error) {
      console.error("Error loading feed post applauds:", error);
      return [];
    }
  }, []);

  // OPTIMIZED: Load feed data with parallel requests and immediate rendering
  const loadFeedData = useCallback(async () => {
    if (authIsLoading) return;

    setIsLoading(true);
    setCurrentPage(1);
    setHasMorePosts(true);
    consecutiveEmptyLoadsRef.current = 0;
    
    // Clear existing data
    setProjects([]);
    setFeedPosts([]);
    loadedItemIdsRef.current = new Set();
    setProjectApplauds([]);
    setFeedPostApplauds([]);
    setProjectIDEsMap({});

    try {
      // Fetch both projects and feed posts
      const [visibleProjectsData, initialFeedPostsData] = await Promise.all([
        withRetry(() =>
          Project.filter({ is_visible_on_feed: true }, "-created_date", POSTS_PER_PAGE * 2, 0) // Fetch more than needed
        ),
        loadFeedPosts(1, POSTS_PER_PAGE * 2, 0) // Fetch more than needed
      ]);
      
      const combinedInitialItems = [
        ...visibleProjectsData.map(p => ({ ...p, itemType: 'project', sortDate: new Date(p.created_date) })),
        ...initialFeedPostsData.map(fp => ({ ...fp, itemType: 'feedPost', sortDate: new Date(fp.created_date) }))
      ].sort((a, b) => b.sortDate - a.sortDate);

      const itemsForInitialDisplay = combinedInitialItems.slice(0, POSTS_PER_PAGE);

      if (itemsForInitialDisplay.length === 0) {
        setIsLoading(false);
        setHasMorePosts(false);
        return;
      }

      // Track loaded item IDs immediately in ref
      itemsForInitialDisplay.forEach(p => loadedItemIdsRef.current.add(p.id));

      // Separate projects and feed posts
      const initialProjects = itemsForInitialDisplay.filter(item => item.itemType === 'project');
      const initialFeedPosts = itemsForInitialDisplay.filter(item => item.itemType === 'feedPost');

      // Get unique owner emails
      const allOwnerEmails = [...new Set(itemsForInitialDisplay.map(p => p.created_by))];
      
      const profilesPromise = allOwnerEmails.length > 0 
        ? withRetry(() => getPublicUserProfiles({ emails: allOwnerEmails }), 2, 2000)
        : Promise.resolve({ data: [] });

      const projectIds = initialProjects.map(p => p.id);
      const feedPostIds = initialFeedPosts.map(fp => fp.id);
      
      const applaudsPromise = loadApplauds(projectIds);
      const feedPostApplaudsPromise = loadFeedPostApplauds(feedPostIds);
      const idesPromise = loadIDEsForProjects(projectIds); // BATCH LOAD IDEs

      // Populate with basic owner data for immediate rendering
      const populatedInitialProjects = initialProjects.map(project => ({
        ...project,
        owner: {
          email: project.created_by,
          full_name: project.created_by.split('@')[0],
          username: null,
          profile_image: null,
        }
      }));
      const populatedInitialFeedPosts = initialFeedPosts.map(post => ({
        ...post,
        owner: {
          email: post.created_by,
          full_name: post.created_by.split('@')[0],
          username: null,
          profile_image: null,
        }
      }));


      // Show content immediately
      setProjects(populatedInitialProjects);
      setFeedPosts(populatedInitialFeedPosts);
      setHasMorePosts(combinedInitialItems.length > POSTS_PER_PAGE); // If we fetched more than POSTS_PER_PAGE initially, assume more exist
      setIsLoading(false);

      // Load ads in background - don't await this
      loadAdsForPage(1, itemsForInitialDisplay).catch(err => {
        console.error("Background ad loading failed:", err);
      });

      // Update with full profile data and IDEs when available
      const [profilesResponse, fetchedProjectApplauds, fetchedFeedPostApplauds, fetchedIDEsMap] = await Promise.all([
        profilesPromise, 
        applaudsPromise, 
        feedPostApplaudsPromise,
        idesPromise
      ]);
      
      const ownerProfiles = profilesResponse.data || [];
      const profilesMap = ownerProfiles.reduce((acc, profile) => {
        acc[profile.email] = profile;
        return acc;
      }, {});

      // Update projects and feed posts with full profile data
      const fullyPopulatedProjects = populatedInitialProjects.map(project => {
        const owner = profilesMap[project.created_by] || {
          email: project.created_by,
          full_name: project.created_by.split('@')[0],
          username: null,
          profile_image: null,
        };
        return { ...project, owner };
      });
      const fullyPopulatedFeedPosts = populatedInitialFeedPosts.map(post => {
        const owner = profilesMap[post.created_by] || {
          email: post.created_by,
          full_name: post.created_by.split('@')[0],
          username: null,
          profile_image: null,
        };
        return { ...post, owner };
      });

      setProjects(fullyPopulatedProjects);
      setFeedPosts(fullyPopulatedFeedPosts);
      setProjectApplauds(fetchedProjectApplauds);
      setFeedPostApplauds(fetchedFeedPostApplauds);
      setProjectIDEsMap(fetchedIDEsMap); // SET IDEs MAP

      // Fetch collaborator profiles for activity indicators
      const allCollaboratorEmails = new Set();
      initialProjects.forEach(p => {
        if (p.collaborator_emails) {
          p.collaborator_emails.forEach(email => allCollaboratorEmails.add(email));
        }
      });
      
      if (allCollaboratorEmails.size > 0) {
        try {
          const { data: collabProfiles } = await withRetry(() => 
            getPublicUserProfiles({ emails: Array.from(allCollaboratorEmails) })
          );
          const collabProfilesMap = {};
          (collabProfiles || []).forEach(profile => {
            collabProfilesMap[profile.email] = profile;
          });
          setAllCollaboratorProfiles(collabProfilesMap);
        } catch (error) {
          console.error("Error fetching collaborator profiles for activity:", error);
        }
      }

    } catch (error) {
      console.error("Error loading initial feed data:", error);
      if (error.response?.status === 429) {
        toast.error("Loading data too quickly. Please wait a moment and refresh.");
      } else {
        toast.error("Failed to load feed. Please try again.");
      }
      setIsLoading(false);
      setHasMorePosts(false);
    }
  }, [authIsLoading, loadAdsForPage, loadApplauds, loadFeedPosts, loadFeedPostApplauds, loadIDEsForProjects]);

  useEffect(() => {
    loadFeedData();
  }, [loadFeedData]);

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMorePosts) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const offset = (currentPage) * POSTS_PER_PAGE; // Global offset for API calls
      
      console.log(`Loading more items - Page ${nextPage}, Global Offset ${offset}, Already loaded: ${loadedItemIdsRef.current.size} items`);

      const fetchAmount = POSTS_PER_PAGE * 3; // Overfetch to ensure enough unique items
      
      const [moreProjectsData, moreFeedPostsData] = await Promise.all([
        Project.filter({ is_visible_on_feed: true }, "-created_date", fetchAmount, offset),
        FeedPost.filter({ is_visible: true }, "-created_date", fetchAmount, offset)
      ]);

      console.log(`Fetched ${moreProjectsData.length} projects and ${moreFeedPostsData.length} feed posts from database (requested ${fetchAmount} each)`);

      const combinedFetchedItems = [
        ...moreProjectsData.map(p => ({ ...p, itemType: 'project', sortDate: new Date(p.created_date) })),
        ...moreFeedPostsData.map(fp => ({ ...fp, itemType: 'feedPost', sortDate: new Date(fp.created_date) }))
      ].sort((a, b) => b.sortDate - a.sortDate);

      // Filter out duplicates using the ref
      const uniqueNewItems = combinedFetchedItems.filter(item => {
        const isUnique = !loadedItemIdsRef.current.has(item.id);
        if (!isUnique) {
          console.log(`Filtering out duplicate item: ${item.id} - ${item.title || item.content}`);
        }
        return isUnique;
      });
      
      console.log(`After filtering: ${uniqueNewItems.length} unique items`);

      if (uniqueNewItems.length === 0) {
        // Check if database returned nothing at all - means we're at the end
        if (moreProjectsData.length === 0 && moreFeedPostsData.length === 0) {
          console.log('Database returned no results, reached the end');
          setHasMorePosts(false);
          setIsLoadingMore(false);
          consecutiveEmptyLoadsRef.current = 0;
          return;
        }
        
        // Otherwise, all items were duplicates - try loading from further offset
        consecutiveEmptyLoadsRef.current++;
        console.log(`All fetched items were duplicates (attempt ${consecutiveEmptyLoadsRef.current}/${MAX_EMPTY_LOAD_ATTEMPTS})`);
        
        if (consecutiveEmptyLoadsRef.current >= MAX_EMPTY_LOAD_ATTEMPTS) {
          console.log('Max empty load attempts reached, no more unique posts');
          setHasMorePosts(false);
          setIsLoadingMore(false);
          consecutiveEmptyLoadsRef.current = 0;
          return;
        }
        
        // Use functional update to ensure correct page number
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
        // Retry immediately instead of setTimeout
        requestAnimationFrame(() => loadMorePosts());
        return;
      }

      // Reset consecutive empty loads counter since we found unique items
      consecutiveEmptyLoadsRef.current = 0;

      // Take only the number we need for this page
      const itemsToAdd = uniqueNewItems.slice(0, POSTS_PER_PAGE);
      console.log(`Adding ${itemsToAdd.length} items to feed`);

      // Immediately add these IDs to the ref to prevent duplicates in concurrent calls
      itemsToAdd.forEach(item => loadedItemIdsRef.current.add(item.id));

      const newProjectItems = itemsToAdd.filter(item => item.itemType === 'project');
      const newFeedPostItems = itemsToAdd.filter(item => item.itemType === 'feedPost');

      const allNewOwnerEmails = [...new Set(itemsToAdd.map(item => item.created_by))];
      
      const newProjectIds = newProjectItems.map(p => p.id);
      const newFeedPostIds = newFeedPostItems.map(fp => fp.id);

      // PARALLEL LOAD: profiles, applauds, and IDEs
      const [profilesResponse, fetchedNewProjectApplauds, fetchedNewFeedPostApplauds, fetchedNewIDEsMap] = await Promise.all([
        withRetry(() => getPublicUserProfiles({ emails: allNewOwnerEmails }), 2, 2000),
        newProjectIds.length > 0 ? withRetry(() => ProjectApplaud.filter({ project_id: { $in: newProjectIds } })) : Promise.resolve([]),
        newFeedPostIds.length > 0 ? withRetry(() => FeedPostApplaud.filter({ feed_post_id: { $in: newFeedPostIds } })) : Promise.resolve([]),
        loadIDEsForProjects(newProjectIds) // BATCH LOAD IDEs for new projects
      ]);

      const newProfilesMap = (profilesResponse.data || []).reduce((acc, profile) => {
        acc[profile.email] = profile;
        return acc;
      }, {});

      const populatedNewProjectItems = newProjectItems.map(project => {
        const owner = newProfilesMap[project.created_by] || {
          email: project.created_by,
          full_name: project.created_by.split('@')[0],
          profile_image: null,
          location: null
        };
        return { ...project, owner };
      });
      const populatedNewFeedPostItems = newFeedPostItems.map(post => {
        const owner = newProfilesMap[post.created_by] || {
          email: post.created_by,
          full_name: post.created_by.split('@')[0],
          profile_image: null,
          location: null
        };
        return { ...post, owner };
      });

      // Update state
      setProjects(prev => [...prev, ...populatedNewProjectItems]);
      setFeedPosts(prev => [...prev, ...populatedNewFeedPostItems]);
      setProjectIDEsMap(prev => ({ ...prev, ...fetchedNewIDEsMap })); // MERGE IDEs MAP

      // Fetch collaborator profiles for new projects
      const newCollaboratorEmails = new Set();
      newProjectItems.forEach(p => {
        if (p.collaborator_emails) {
          p.collaborator_emails.forEach(email => newCollaboratorEmails.add(email));
        }
      });
      
      if (newCollaboratorEmails.size > 0) {
        try {
          const { data: newCollabProfiles } = await withRetry(() => 
            getPublicUserProfiles({ emails: Array.from(newCollaboratorEmails) })
          );
          const newCollabProfilesMap = {};
          (newCollabProfiles || []).forEach(profile => {
            newCollabProfilesMap[profile.email] = profile;
          });
          setAllCollaboratorProfiles(prev => ({ ...prev, ...newCollabProfilesMap }));
        } catch (error) {
          console.error("Error fetching new collaborator profiles for activity:", error);
        }
      }
        
      // Load ads in background - don't await or block on this
      loadAdsForPage(nextPage, itemsToAdd).catch(err => {
        console.error("Background ad loading failed:", err);
      });
      
      setProjectApplauds(prev => [...prev, ...(fetchedNewProjectApplauds || [])]);
      setFeedPostApplauds(prev => [...prev, ...(fetchedNewFeedPostApplauds || [])]);
      
      setCurrentPage(nextPage);
      
      console.log(`Successfully loaded ${itemsToAdd.length} new items. Total loaded: ${loadedItemIdsRef.current.size}`);

    } catch (error) {
      console.error("Error loading more posts:", error);
      toast.error("Failed to load more posts. Please try again.");
      setHasMorePosts(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, isLoadingMore, hasMorePosts, loadAdsForPage, loadFeedPosts, loadApplauds, loadFeedPostApplauds, loadIDEsForProjects]);

  useEffect(() => {
    const handleScroll = () => {
      // Only trigger if not loading more, there are more posts
      if (isLoadingMore || !hasMorePosts) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.offsetHeight;

      // Trigger load more when user scrolls near the bottom (e.g., 300px from the end)
      if (scrollTop + windowHeight >= documentHeight - 300) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMorePosts, isLoadingMore, hasMorePosts]);

  useEffect(() => {
    if (location.hash && location.hash.startsWith('#project-')) {
      highlightedItemIdRef.current = location.hash.substring('#project-'.length);
    } else if (location.hash && location.hash.startsWith('#feedpost-')) {
      highlightedItemIdRef.current = location.hash.substring('#feedpost-'.length);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!isLoading && highlightedItemIdRef.current && !hasScrolledRef.current) {
      setTimeout(() => {
        // Look for either project or feedpost ID
        const projectElement = document.getElementById(`project-${highlightedItemIdRef.current}`);
        const feedPostElement = document.getElementById(`feedpost-${highlightedItemIdRef.current}`);
        const element = projectElement || feedPostElement;

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-post');
          setTimeout(() => {
            element.classList.remove('highlight-post');
          }, 3000);
          hasScrolledRef.current = true;
        }
      }, 500);
    }
  }, [isLoading]);

  // Combine and sort all feed items by creation date
  const allFeedItems = React.useMemo(() => {
    const combined = [
      ...projects.map(p => ({ ...p, itemType: 'project', sortDate: new Date(p.created_date) })),
      ...feedPosts.map(fp => ({ ...fp, itemType: 'feedPost', sortDate: new Date(fp.created_date) }))
    ];
    
    return combined.sort((a, b) => b.sortDate - a.sortDate);
  }, [projects, feedPosts]);

  const handleApplaudUpdate = useCallback(async () => {
    const allProjectIdsInFeed = projects.map(p => p.id);
    const allFeedPostIdsInFeed = feedPosts.map(fp => fp.id);

    if (allProjectIdsInFeed.length > 0) {
      try {
        const updatedProjectApplauds = await withRetry(() =>
          ProjectApplaud.filter({ project_id: { $in: allProjectIdsInFeed } })
        );
        if (updatedProjectApplauds) {
          setProjectApplauds(updatedProjectApplauds);
        }
      } catch (error) {
        console.error("Error updating project applauds:", error);
      }
    }
    
    if (allFeedPostIdsInFeed.length > 0) {
      try {
        const updatedFeedPostApplauds = await withRetry(() =>
          FeedPostApplaud.filter({ feed_post_id: { $in: allFeedPostIdsInFeed } })
        );
        if (updatedFeedPostApplauds) {
          setFeedPostApplauds(updatedFeedPostApplauds);
        }
      } catch (error) {
        console.error("Error updating feed post applauds:", error);
      }
    }
  }, [projects, feedPosts]);
  
  // Filter items based on search query
  const displayedItems = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return allFeedItems;
    }
    
    const query = searchQuery.toLowerCase();
    return allFeedItems.filter(item => {
      if (item.itemType === 'project') {
        return item.title?.toLowerCase().includes(query) ||
               item.description?.toLowerCase().includes(query) ||
               item.location?.toLowerCase().includes(query) ||
               item.industry?.toLowerCase().includes(query) ||
               item.area_of_interest?.toLowerCase().includes(query) ||
               item.skills_needed?.some(skill => skill.toLowerCase().includes(query));
      } else if (item.itemType === 'feedPost') {
        return item.title?.toLowerCase().includes(query) ||
               item.content?.toLowerCase().includes(query) ||
               item.tags?.some(tag => tag.toLowerCase().includes(query));
      }
      return false;
    });
  }, [allFeedItems, searchQuery]);

  useEffect(() => {
    const checkUserProjects = async () => {
      if (!currentUser || authIsLoading || userProjectCount !== null) return;

      try {
        if (currentUser.has_completed_onboarding) {
          const userProjects = await withRetry(() => 
            Project.filter({ created_by: currentUser.email })
          );
          
          setUserProjectCount(userProjects.length);
          
          const hasSeenPrompt = localStorage.getItem(`first_project_prompt_seen_${currentUser.email}`);
          if (userProjects.length === 0 && !hasSeenPrompt) {
            setTimeout(() => {
              setShowFirstProjectPrompt(true);
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Error checking user projects:", error);
      }
    };

    checkUserProjects();
  }, [currentUser, authIsLoading, userProjectCount]);

  const handleCreateFirstProject = () => {
    setShowFirstProjectPrompt(false);
    localStorage.setItem(`first_project_prompt_seen_${currentUser.email}`, 'true');
    navigate(createPageUrl("CreateProject"));
  };

  const handleDismissPrompt = () => {
    setShowFirstProjectPrompt(false);
    localStorage.setItem(`first_project_prompt_seen_${currentUser.email}`, 'true');
  };
  
  const leftAds = advertisements?.desktop?.left || [];
  const rightAds = advertisements?.desktop?.right || [];

  const createInfiniteScrollFeedWithAds = (posts, ads) => {
    if (ads.length === 0) return posts.map(post => ({ type: 'post', content: post }));
    
    const feedItems = [];
    let adIndex = 0;
    const adInterval = 3;
    
    posts.forEach((post, index) => {
      feedItems.push({ type: 'post', content: post });
      
      if ((index + 1) % adInterval === 0 && adIndex < ads.length && index < posts.length - 1) {
        feedItems.push({ type: 'ad', content: ads[adIndex] });
        adIndex++;
      }
    });
    
    return feedItems;
  };

  if (authIsLoading) {
    return (
        <div className="text-center py-16">
            <p className="cu-text-responsive-sm">Loading...</p>
        </div>
    )
  }

  return (
    <>
      <CreatePostDialog
        isOpen={showCreatePostDialog}
        onClose={() => setShowCreatePostDialog(false)}
        currentUser={currentUser}
        onPostCreated={loadFeedData}
      />

      <Dialog open={showFirstProjectPrompt} onOpenChange={setShowFirstProjectPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <DialogTitle className="text-xl font-bold">Create Your First Project!</DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismissPrompt}
                className="h-6 w-6 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="pt-4 text-base">
              Welcome to Collab Unity! 🎉 Start your collaboration journey by creating your first project. 
              Share your ideas, find talented collaborators, and bring your vision to life.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDismissPrompt}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleCreateFirstProject}
              className="flex-1 cu-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center pt-2">
            You can always create a project later from the menu
          </p>
        </DialogContent>
      </Dialog>

      <div className="cu-container">
        <style>{`
          .highlight-post {
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.5);
            transition: box-shadow 0.5s ease-out;
          }
        `}</style>
        
        <div className="block md:hidden">
          <div className="cu-content-grid pt-4">
            {currentUser && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search feed..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                  <Button
                    onClick={() => setShowCreatePostDialog(true)}
                    className="cu-button w-full cu-gradient"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Post
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  <Link to={createPageUrl("CreateProject")} className="block">
                    <div className="cu-gradient rounded-xl p-4 sm:p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base sm:text-lg mb-1">Got an idea?</h3>
                          <p className="text-purple-100 text-xs sm:text-sm">Create a project and find collaborators</p>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Plus className="w-5 h-5 sm:w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </>
            )}

            <div className="cu-content-grid min-h-[800px]">
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="cu-text-responsive-sm text-gray-600">Loading feed...</p>
                </div>
              ) : displayedItems.length === 0 && !hasMorePosts ? (
                <div className="text-center py-16">
                  <h3 className="cu-text-responsive-lg font-semibold">No posts found</h3>
                  <p className="text-gray-600 mt-2 cu-text-responsive-sm">
                    Be the first to create a post!
                  </p>
                  {currentUser && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                      <Button 
                        onClick={() => setShowCreatePostDialog(true)}
                        className="cu-button"
                      >
                        Post
                      </Button>
                      <Link to={createPageUrl("CreateProject")}>
                        <Button className="cu-button cu-button-mobile-full">Create Project</Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {createInfiniteScrollFeedWithAds(displayedItems, inlineAds).map((item, index) => (
                      item.type === 'post' ? (
                        item.content.itemType === 'project' ? (
                          <ProjectPost
                            key={`project-${item.content.id}`}
                            project={item.content}
                            owner={item.content.owner}
                            currentUser={currentUser}
                            projectApplauds={projectApplauds}
                            projectIDEs={projectIDEsMap[item.content.id] || []}
                            onProjectUpdate={loadFeedData}
                            onApplaudUpdate={handleApplaudUpdate}
                            collaboratorProfilesMap={allCollaboratorProfiles}
                          />
                        ) : (
                          <FeedPostItem
                            key={`feedpost-${item.content.id}`}
                            post={item.content}
                            owner={item.content.owner}
                            currentUser={currentUser}
                            feedPostApplauds={feedPostApplauds}
                            onPostDeleted={loadFeedData}
                            onApplaudUpdate={handleApplaudUpdate}
                          />
                        )
                      ) : (
                        <div key={`ad-${item.content.id}-${index}`} className="w-full">
                          <AdvertisementCard ad={item.content} />
                        </div>
                      )
                    ))}
                  </AnimatePresence>
                  
                  {isLoadingMore && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                        <span className="cu-text-responsive-sm text-gray-600">Loading more posts...</span>
                      </div>
                    </div>
                  )}
                  
                  {!hasMorePosts && displayedItems.length > 0 && ( // Ensure there are posts before showing end message
                    <div className="text-center py-8">
                      <p className="cu-text-responsive-sm text-gray-500">You've reached the end of the feed!</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hidden md:hidden xl:grid xl:grid-cols-12 xl:gap-8">
          <aside className="xl:col-span-3">
            <div className="sticky top-20 cu-content-grid h-fit">
              {leftAds.map(ad => <AdvertisementCard key={ad.id} ad={ad} />)}
            </div>
          </aside>

          <main className="xl:col-span-6 cu-content-grid">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
            </motion.div>

            {currentUser && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search feed..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                  <Button
                    onClick={() => setShowCreatePostDialog(true)}
                    className="cu-button w-full cu-gradient"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Post
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  <Link to={createPageUrl("CreateProject")} className="block">
                    <div className="cu-gradient rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl mb-1.5">Got an idea?</h3>
                          <p className="text-purple-100 text-sm">Create a project and find talented collaborators to bring it to life</p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors group-hover:scale-110 transform duration-200">
                            <Plus className="w-7 h-7" strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="cu-content-grid min-h-[800px]"
            >
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="cu-text-responsive-sm text-gray-600">Loading feed...</p>
                </div>
              ) : displayedItems.length === 0 && !hasMorePosts ? (
                <div className="text-center py-16">
                  <h3 className="cu-text-responsive-lg font-semibold">No posts found</h3>
                  <p className="text-gray-600 mt-2 cu-text-responsive-sm">
                    Be the first to create a post!
                  </p>
                  {currentUser && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                      <Button 
                        onClick={() => setShowCreatePostDialog(true)}
                        className="cu-button"
                      >
                        Post
                      </Button>
                      <Link to={createPageUrl("CreateProject")}>
                        <Button className="cu-button">Create Project</Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {createInfiniteScrollFeedWithAds(displayedItems, inlineAds).map((item, index) => (
                      item.type === 'post' ? (
                        item.content.itemType === 'project' ? (
                          <ProjectPost
                            key={`project-${item.content.id}`}
                            project={item.content}
                            owner={item.content.owner}
                            currentUser={currentUser}
                            projectApplauds={projectApplauds}
                            projectIDEs={projectIDEsMap[item.content.id] || []}
                            onProjectUpdate={loadFeedData}
                            onApplaudUpdate={handleApplaudUpdate}
                            collaboratorProfilesMap={allCollaboratorProfiles}
                          />
                        ) : (
                          <FeedPostItem
                            key={`feedpost-${item.content.id}`}
                            post={item.content}
                            owner={item.content.owner}
                            currentUser={currentUser}
                            feedPostApplauds={feedPostApplauds}
                            onPostDeleted={loadFeedData}
                            onApplaudUpdate={handleApplaudUpdate}
                          />
                        )
                      ) : (
                        <div key={`ad-${item.content.id}-${index}`} className="w-full">
                          <AdvertisementCard ad={item.content} />
                        </div>
                      )
                    ))}
                  </AnimatePresence>
                  
                  {isLoadingMore && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                        <span className="cu-text-responsive-sm text-gray-600">Loading more posts...</span>
                      </div>
                    </div>
                  )}
                  
                  {!hasMorePosts && displayedItems.length > 0 && ( 
                    <div className="text-center py-8">
                      <p className="cu-text-responsive-sm text-gray-500">You've reached the end of the feed!</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </main>

          <aside className="xl:col-span-3">
            <div className="sticky top-20 cu-content-grid h-fit">
              {rightAds.map(ad => <AdvertisementCard key={ad.id} ad={ad} />)}
            </div>
          </aside>
        </div>

        <div className="hidden md:block xl:hidden">
          <div className="cu-content-grid pt-6">
            {currentUser && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search feed..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                  <Button
                    onClick={() => setShowCreatePostDialog(true)}
                    className="cu-button w-full cu-gradient"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Post
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  <Link to={createPageUrl("CreateProject")} className="block">
                    <div className="cu-gradient rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl mb-1.5">Got an idea?</h3>
                          <p className="text-purple-100 text-sm">Create a project and collaborate with others to bring it to life</p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Plus className="w-7 h-7" strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </>
            )}

            <div className="cu-content-grid min-h-[800px]">
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="cu-text-responsive-sm text-gray-600">Loading feed...</p>
                </div>
              ) : displayedItems.length === 0 && !hasMorePosts ? (
                <div className="text-center py-16">
                  <h3 className="cu-text-responsive-lg font-semibold">No posts found</h3>
                  <p className="text-gray-600 mt-2 cu-text-responsive-sm">
                    Be the first to create a post!
                  </p>
                  {currentUser && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                      <Button 
                        onClick={() => setShowCreatePostDialog(true)}
                        className="cu-button"
                      >
                        Post
                      </Button>
                      <Link to={createPageUrl("CreateProject")}>
                        <Button className="cu-button">Create Project</Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {createInfiniteScrollFeedWithAds(displayedItems, inlineAds).map((item, index) => (
                      item.type === 'post' ? (
                        item.content.itemType === 'project' ? (
                          <ProjectPost
                            key={`project-${item.content.id}`}
                            project={item.content}
                            owner={item.content.owner}
                            currentUser={currentUser}
                            projectApplauds={projectApplauds}
                            projectIDEs={projectIDEsMap[item.content.id] || []}
                            onProjectUpdate={loadFeedData}
                            onApplaudUpdate={handleApplaudUpdate}
                            collaboratorProfilesMap={allCollaboratorProfiles}
                          />
                        ) : (
                          <FeedPostItem
                            key={`feedpost-${item.content.id}`}
                            post={item.content}
                            owner={item.content.owner}
                            currentUser={currentUser}
                            feedPostApplauds={feedPostApplauds}
                            onPostDeleted={loadFeedData}
                            onApplaudUpdate={handleApplaudUpdate}
                          />
                        )
                      ) : (
                        <div key={`ad-${item.content.id}-${index}`} className="w-full">
                          <AdvertisementCard ad={item.content} />
                        </div>
                      )
                    ))}
                  </AnimatePresence>
                  
                  {isLoadingMore && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                        <span className="cu-text-responsive-sm text-gray-600">Loading more posts...</span>
                      </div>
                    </div>
                  )}
                  
                  {!hasMorePosts && displayedItems.length > 0 && ( 
                    <div className="text-center py-8">
                      <p className="cu-text-responsive-sm text-gray-500">You've reached the end of the feed!</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}