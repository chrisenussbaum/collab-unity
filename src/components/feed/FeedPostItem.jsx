import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FeedPost, FeedPostApplaud, Comment, Project, Notification } from "@/entities/all";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  MessageCircle, CheckCircle, Clock, AlertCircle, Users, TrendingUp, BookOpen,
  ChevronLeft, ChevronRight, Video, Lightbulb, Trash2, PartyPopper, HandHeart,
  MoreVertical, X, ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import FeedComments from "@/components/FeedComments";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import MediaDisplay from "@/components/MediaDisplay";

const statusConfig = {
  on_track: { label: "On Track", icon: CheckCircle, color: "bg-green-100 text-green-700 border-green-200" },
  at_risk: { label: "At Risk", icon: AlertCircle, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  delayed: { label: "Delayed", icon: Clock, color: "bg-red-100 text-red-700 border-red-200" },
  completed: { label: "Completed", icon: PartyPopper, color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const postTypeConfig = {
  status_update: { icon: TrendingUp, label: "Project Update", color: "border-blue-500" },
  narrative: { icon: BookOpen, label: "Story & Insights", color: "border-purple-500" },
  collaboration_call: { icon: Users, label: "Looking for Collaborators", color: "border-green-500" },
};

export default function FeedPostItem({ post, owner, currentUser, feedPostApplauds, onPostDeleted, onApplaudUpdate }) {
  const [isApplauded, setIsApplauded] = useState(false);
  const [applaudCount, setApplaudCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relatedProject, setRelatedProject] = useState(null);
  const commentsRef = useRef(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const isOwner = currentUser && post.created_by === currentUser.email;
  const currentPostType = postTypeConfig[post.post_type] || postTypeConfig.narrative;
  const PostTypeIcon = currentPostType.icon;

  useEffect(() => {
    const currentPostApplauds = feedPostApplauds.filter(a => a.feed_post_id === post.id);
    setApplaudCount(currentPostApplauds.length);
    if (currentUser) {
      setIsApplauded(currentPostApplauds.some(a => a.user_email === currentUser.email));
    } else {
      setIsApplauded(false);
    }
  }, [feedPostApplauds, post.id, currentUser]);

  useEffect(() => {
    if (post.related_project_id) {
      Project.get(post.related_project_id).then(setRelatedProject).catch(console.error);
    }
  }, [post.related_project_id]);

  const handleApplaud = async () => {
    if (!currentUser) return;
    const wasApplauded = isApplauded;
    const previousCount = applaudCount;
    setIsApplauded(!wasApplauded);
    setApplaudCount(prev => wasApplauded ? prev - 1 : prev + 1);
    try {
      if (wasApplauded) {
        const userApplaud = feedPostApplauds.find(a => a.feed_post_id === post.id && a.user_email === currentUser.email);
        if (userApplaud) { await FeedPostApplaud.delete(userApplaud.id); if (onApplaudUpdate) onApplaudUpdate(); }
      } else {
        await FeedPostApplaud.create({ feed_post_id: post.id, user_email: currentUser.email, user_name: currentUser.full_name || currentUser.email });
        if (post.created_by !== currentUser.email) {
          Notification.create({ user_email: post.created_by, title: "Someone applauded your post!", message: `${currentUser.full_name || currentUser.email} applauded your post.`, type: "feed_post_applaud", actor_email: currentUser.email, actor_name: currentUser.full_name || currentUser.email }).catch(console.error);
        }
        if (onApplaudUpdate) onApplaudUpdate();
      }
    } catch (error) {
      setIsApplauded(wasApplauded);
      setApplaudCount(previousCount);
      toast.error("Failed to update applaud.");
    }
  };

  const handleDeletePost = async () => {
    if (!currentUser || !isOwner) return;
    setIsDeleting(true);
    try {
      const postApplauds = feedPostApplauds.filter(a => a.feed_post_id === post.id);
      for (const a of postApplauds) await FeedPostApplaud.delete(a.id);
      const postComments = await Comment.filter({ project_id: post.id, context: "feed_post" });
      for (const c of postComments) await Comment.delete(c.id);
      await FeedPost.delete(post.id);
      setShowDeleteConfirm(false);
      if (onPostDeleted) onPostDeleted();
    } catch (error) {
      toast.error("Failed to delete post.");
    } finally {
      setIsDeleting(false);
    }
  };

  const RelatedProjectCard = ({ color }) => relatedProject ? (
    <Link to={createPageUrl(`ProjectDetail?id=${relatedProject.id}`)}>
      <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 hover:shadow-md transition-shadow`}>
        <div className="flex items-center gap-3">
          {relatedProject.logo_url ? (
            <img src={relatedProject.logo_url} alt={relatedProject.title} className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center`}><Lightbulb className={`w-6 h-6 text-${color}-600`} /></div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-xs text-${color}-600 font-medium mb-1`}>Related Project</p>
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{relatedProject.title}</h4>
            <p className="text-xs text-gray-600 line-clamp-1">{relatedProject.description}</p>
          </div>
          <ArrowRight className={`w-5 h-5 text-${color}-600 flex-shrink-0`} />
        </div>
      </div>
    </Link>
  ) : null;

  return (
    <>
      <ConfirmationDialog isOpen={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} title="Delete Post" description="Are you sure you want to delete this post? This cannot be undone." confirmText="Delete Post" isDestructive onConfirm={handleDeletePost} isLoading={isDeleting} />

      <Dialog open={showMediaModal} onOpenChange={setShowMediaModal}>
        <DialogContent className="max-w-[98vw] sm:max-w-[95vw] max-h-[95vh] w-auto h-auto p-1 sm:p-2 overflow-hidden bg-transparent border-none">
          <div className="relative w-full h-full flex items-center justify-center min-h-[300px]">
            <Button onClick={() => setShowMediaModal(false)} variant="ghost" size="icon" className="absolute top-2 right-2 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg"><X className="w-5 h-5" /></Button>
            {post.media_attachments && post.media_attachments.length > 1 && (
              <>
                <Button onClick={() => setSelectedMediaIndex(prev => Math.max(0, prev - 1))} disabled={selectedMediaIndex === 0} variant="ghost" size="icon" className="absolute left-2 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-30 shadow-lg"><ChevronLeft className="w-6 h-6" /></Button>
                <Button onClick={() => setSelectedMediaIndex(prev => Math.min(post.media_attachments.length - 1, prev + 1))} disabled={selectedMediaIndex === post.media_attachments.length - 1} variant="ghost" size="icon" className="absolute right-2 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-30 shadow-lg"><ChevronRight className="w-6 h-6" /></Button>
              </>
            )}
            {post.media_attachments && post.media_attachments.length > 1 && (
              <div className="absolute top-2 left-2 z-50 bg-purple-600 text-white px-3 py-1 rounded-full text-sm shadow-lg">{selectedMediaIndex + 1} / {post.media_attachments.length}</div>
            )}
            <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
              {post.media_attachments?.[selectedMediaIndex]?.media_type === 'image' ? (
                <img src={post.media_attachments[selectedMediaIndex].media_url} alt={post.media_attachments[selectedMediaIndex].caption || 'Media'} className="w-full sm:w-auto max-w-full max-h-[85vh] h-auto object-contain" />
              ) : (
                <video src={post.media_attachments?.[selectedMediaIndex]?.media_url} controls autoPlay playsInline className="w-full sm:w-auto max-w-full max-h-[85vh] h-auto" />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className={`cu-card mb-6 overflow-hidden border-t-4 ${currentPostType.color} hover:shadow-lg transition-shadow duration-300`}>
        <CardHeader className="px-3 sm:px-4 md:px-6 pb-3">
          <div className="flex items-start justify-between space-x-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <Link to={createPageUrl(owner?.username ? `UserProfile?username=${owner.username}` : `UserProfile?email=${owner?.email}`)} className="flex-shrink-0">
                <OptimizedAvatar src={owner?.profile_image} alt={owner?.full_name || 'User'} fallback={owner?.full_name?.[0] || 'U'} size="default" className="w-12 h-12 border-2 border-gray-100 shadow-sm" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {React.createElement(PostTypeIcon, { className: "w-4 h-4 text-gray-500" })}
                  <span className="text-xs text-gray-500 font-medium">{currentPostType.label}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 mb-1">{post.title || "Untitled Post"}</h3>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                  <Link to={createPageUrl(owner?.username ? `UserProfile?username=${owner.username}` : `UserProfile?email=${owner?.email}`)} className="text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {owner?.full_name || 'Anonymous User'}
                  </Link>
                  <span className="text-xs sm:text-sm text-gray-400">•</span>
                  <span className="text-xs sm:text-sm text-gray-500">{formatDistanceToNow(new Date(post.created_date))} ago</span>
                </div>
              </div>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="flex-shrink-0"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-red-600 focus:text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete Post</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 pt-2">
          {post.post_type === "status_update" && (
            <div className="space-y-4">
              {post.status && (
                <div className="flex items-center gap-2">
                  {React.createElement(statusConfig[post.status]?.icon || CheckCircle, { className: "w-5 h-5" })}
                  <Badge className={`text-sm border ${statusConfig[post.status]?.color || statusConfig.on_track.color}`}>{statusConfig[post.status]?.label || "On Track"}</Badge>
                </div>
              )}
              <p className="text-gray-700 cu-text-responsive-sm leading-relaxed">{post.content}</p>
              {post.media_attachments && post.media_attachments.length > 0 && (
                <div className="mt-4">
                  {post.media_attachments.length === 1 ? (
                    <div className="relative group cursor-pointer rounded-lg overflow-hidden" onClick={() => { setSelectedMediaIndex(0); setShowMediaModal(true); }}>
                      {post.media_attachments[0].media_type === 'image' ? (
                        <img src={post.media_attachments[0].media_url} alt={post.media_attachments[0].caption || 'Media'} className="w-full h-64 sm:h-96 object-cover hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="relative w-full h-64 sm:h-96 bg-gray-900">
                          {post.media_attachments[0].thumbnail_url ? <img src={post.media_attachments[0].thumbnail_url} alt="Video" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Video className="w-12 h-12 text-gray-400" /></div>}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center"><div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-gray-800 border-b-[8px] border-b-transparent ml-1"></div></div></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <HorizontalScrollContainer showArrows={post.media_attachments.length > 1}>
                      {post.media_attachments.map((media, index) => (
                        <div key={index} className="flex-shrink-0 w-[280px] sm:w-[320px] relative group cursor-pointer rounded-lg overflow-hidden" onClick={() => { setSelectedMediaIndex(index); setShowMediaModal(true); }}>
                          {media.media_type === 'image' ? <img src={media.media_url} alt={media.caption || `Media ${index + 1}`} className="w-full h-48 sm:h-64 object-cover hover:scale-105 transition-transform duration-300" /> : (
                            <div className="relative w-full h-48 sm:h-64 bg-gray-900">
                              {media.thumbnail_url ? <img src={media.thumbnail_url} alt={`Video ${index + 1}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Video className="w-12 h-12 text-gray-400" /></div>}
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center"><div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-gray-800 border-b-[8px] border-b-transparent ml-1"></div></div></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </HorizontalScrollContainer>
                  )}
                </div>
              )}
              <RelatedProjectCard color="blue" />
            </div>
          )}

          {post.post_type === "narrative" && (
            <div className="space-y-4">
              <p className="text-gray-700 cu-text-responsive-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              <RelatedProjectCard color="purple" />
            </div>
          )}

          {post.post_type === "collaboration_call" && (
            <div className="space-y-4">
              <p className="text-gray-700 cu-text-responsive-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              <RelatedProjectCard color="green" />
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Looking for:</span>
                  {post.tags.map(tag => <Badge key={tag} className="bg-green-100 text-green-700 border border-green-200">{tag}</Badge>)}
                </div>
              )}
            </div>
          )}

          {(post.post_type === "narrative" || post.post_type === "status_update") && post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
              {post.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>)}
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200">
          <div className="w-full">
            <div className="flex justify-around pb-4 border-b">
              <Button variant="ghost" size="sm" className={`flex items-center space-x-2 transition-colors cu-text-responsive-sm ${isApplauded ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-blue-600'}`} onClick={handleApplaud}>
                <HandHeart className={`cu-icon-sm ${isApplauded ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Applaud</span>
                {applaudCount > 0 && <span className="text-xs font-semibold">{applaudCount}</span>}
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors cu-text-responsive-sm" onClick={() => commentsRef.current?.toggle()}>
                <MessageCircle className="cu-icon-sm" />
                <span className="hidden sm:inline">Comment</span>
              </Button>
            </div>
            <FeedComments ref={commentsRef} project={post} currentUser={currentUser} context="feed_post" />
          </div>
        </CardFooter>
      </Card>
    </>
  );
}