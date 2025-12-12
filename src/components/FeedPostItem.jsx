import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import {
  HandHeart,
  MessageCircle,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  PartyPopper,
  TrendingUp,
  BookOpen,
  Users as UsersIcon,
  ExternalLink,
  Video,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { FeedPost, FeedPostApplaud, Notification, Project } from "@/entities/all";
import { toast } from "sonner";
import FeedComments from "./FeedComments";
import HorizontalScrollContainer from "./HorizontalScrollContainer";

const STATUS_ICONS = {
  on_track: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  at_risk: { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  delayed: { icon: Clock, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  completed: { icon: PartyPopper, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" }
};

const POST_TYPE_ICONS = {
  status_update: { icon: TrendingUp, color: "text-blue-600" },
  narrative: { icon: BookOpen, color: "text-purple-600" },
  collaboration_call: { icon: UsersIcon, color: "text-green-600" }
};

export default function FeedPostItem({ post, owner, currentUser, feedPostApplauds = [], onUpdate }) {
  const [isApplauded, setIsApplauded] = useState(false);
  const [applaudCount, setApplaudCount] = useState(0);
  const [relatedProject, setRelatedProject] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const commentsRef = useRef(null);

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
      toast.info("Sign in to applaud this post!");
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
          toast.success("Applaud removed!");
          if (onUpdate) onUpdate();
        }
      } else {
        await FeedPostApplaud.create({
          feed_post_id: post.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email
        });
        setIsApplauded(true);
        setApplaudCount(prev => prev + 1);
        toast.success("Post applauded!");

        if (post.created_by !== currentUser.email) {
          await Notification.create({
            user_email: post.created_by,
            title: "Someone applauded your post!",
            message: `${currentUser.full_name || currentUser.email} applauded your post.`,
            type: "feed_applaud",
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            metadata: { post_title: post.title || "post" }
          });
        }
        
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error handling applaud:", error);
      toast.error("Failed to update applaud.");
    }
  };

  const handleShare = () => {
    // For feed posts, we don't have a detail page, so just copy a generic message
    const shareText = `Check out this post on Collab Unity: ${post.title || post.content.substring(0, 100)}...`;
    navigator.clipboard.writeText(shareText).then(() => {
      toast.success("Post content copied to clipboard!");
    }).catch(err => {
      toast.error("Failed to copy.");
      console.error('Failed to copy: ', err);
    });
  };

  const handleEditPost = () => {
    setEditContent(post.content);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Content cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      await FeedPost.update(post.id, { content: editContent.trim() });
      toast.success("Post updated successfully!");
      setShowEditDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await FeedPost.update(post.id, { is_visible: false });
      toast.success("Post deleted successfully!");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post.");
    }
  };

  const handleCommentClick = () => {
    if (commentsRef.current) {
      commentsRef.current.toggle();
    }
  };

  const isOwner = currentUser && post.created_by === currentUser.email;
  const PostTypeIcon = POST_TYPE_ICONS[post.post_type]?.icon;
  const postTypeColor = POST_TYPE_ICONS[post.post_type]?.color;

  const renderStatusUpdate = () => {
    const statusConfig = STATUS_ICONS[post.status];
    const StatusIcon = statusConfig?.icon;

    return (
      <div className="space-y-4">
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${statusConfig.bg} ${statusConfig.border} border-l-4`}>
          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
          <span className={`font-semibold ${statusConfig.color} capitalize`}>
            {post.status.replace('_', ' ')}
          </span>
        </div>

        <p className="text-gray-700 leading-relaxed">{post.content}</p>
      </div>
    );
  };

  const renderNarrative = () => (
    <div className="space-y-4">
      {post.title && (
        <h3 className="text-xl font-bold text-gray-900 leading-tight">{post.title}</h3>
      )}
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs border-purple-200 text-purple-700">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  const renderCollaborationCall = () => (
    <div className="space-y-4">
      {post.title && (
        <h3 className="text-xl font-bold text-gray-900 leading-tight">{post.title}</h3>
      )}
      
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
        <p className="text-green-900 font-medium mb-2">🤝 Looking for collaboration</p>
        <p className="text-gray-700 leading-relaxed">{post.content}</p>
      </div>
      
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag, index) => (
            <Badge key={index} className="bg-green-100 text-green-700 border border-green-200">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Update your post content</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="cu-button">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="cu-card mb-6 overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="px-3 sm:px-4 md:px-6 pb-3">
            <div className="flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <Link to={createPageUrl(owner.username ? `UserProfile?username=${owner.username}` : `UserProfile?email=${owner.email}`)}>
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white shadow-sm cursor-pointer">
                    <AvatarImage src={owner.profile_image} className="object-cover" />
                    <AvatarFallback className="bg-purple-100 text-purple-600 text-sm font-medium">
                      {owner.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={createPageUrl(owner.username ? `UserProfile?username=${owner.username}` : `UserProfile?email=${owner.email}`)}
                    className="font-semibold text-sm sm:text-base text-gray-900 hover:text-purple-600 transition-colors"
                  >
                    {owner.full_name || 'Anonymous User'}
                  </Link>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                    {PostTypeIcon && (
                      <div className="flex items-center">
                        <PostTypeIcon className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${postTypeColor}`} />
                        <span className="text-xs text-gray-500 capitalize">
                          {post.post_type.replace('_', ' ')}
                        </span>
                      </div>
                    )}
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
                    <>
                      <DropdownMenuItem onClick={handleEditPost}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeletePost} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
            {post.post_type === 'status_update' && renderStatusUpdate()}
            {post.post_type === 'narrative' && renderNarrative()}
            {post.post_type === 'collaboration_call' && renderCollaborationCall()}

            {/* Media Attachments for Status Updates */}
            {post.post_type === 'status_update' && post.media_attachments && post.media_attachments.length > 0 && (
              <div className="mt-4">
                {post.media_attachments.length === 1 ? (
                  <div className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100">
                    {post.media_attachments[0].media_type === 'image' ? (
                      <img
                        src={post.media_attachments[0].media_url}
                        alt={post.media_attachments[0].caption || 'Media'}
                        className="w-full h-64 sm:h-96 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="relative w-full h-64 sm:h-96">
                        {post.media_attachments[0].thumbnail_url ? (
                          <img
                            src={post.media_attachments[0].thumbnail_url}
                            alt={post.media_attachments[0].caption || 'Video'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <Video className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-gray-800 border-b-[10px] border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <HorizontalScrollContainer showArrows={post.media_attachments.length > 1}>
                    {post.media_attachments.map((media, index) => (
                      <div key={index} className="flex-shrink-0 w-[280px] sm:w-[320px] relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100">
                        {media.media_type === 'image' ? (
                          <img
                            src={media.media_url}
                            alt={media.caption || `Media ${index + 1}`}
                            className="w-full h-48 sm:h-64 object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="relative w-full h-48 sm:h-64">
                            {media.thumbnail_url ? (
                              <img
                                src={media.thumbnail_url}
                                alt={media.caption || `Video ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                <Video className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <div className="w-0 h-0 border-t-[9px] border-t-transparent border-l-[14px] border-l-gray-800 border-b-[9px] border-b-transparent ml-1"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </HorizontalScrollContainer>
                )}
              </div>
            )}

            {/* Related Project Link */}
            {relatedProject && (
              <Link 
                to={createPageUrl(`ProjectDetail?id=${relatedProject.id}`)}
                className="block mt-4"
              >
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 hover:bg-purple-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {relatedProject.logo_url ? (
                        <img 
                          src={relatedProject.logo_url} 
                          alt={relatedProject.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-purple-200 flex items-center justify-center">
                          <span className="text-purple-600 font-bold text-sm">
                            {relatedProject.title[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{relatedProject.title}</p>
                        <p className="text-xs text-gray-600">Related Project</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
              </Link>
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
                  <HandHeart className="cu-icon-sm" fill={isApplauded ? 'currentColor' : 'none'} />
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
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors cu-text-responsive-sm"
                  onClick={handleShare}
                >
                  <Share2 className="cu-icon-sm" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </div>

              <FeedComments
                ref={commentsRef}
                project={{ id: post.id, title: post.title || "post", created_by: post.created_by }}
                currentUser={currentUser}
              />
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </>
  );
}