import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, ProjectApplaud, Notification, FeedPost, FeedPostApplaud } from "@/entities/all";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  MessageCircle, Share2, Users, CheckCircle, Clock, Camera, Search, MapPin,
  Link as LinkIcon, Tag, Building2, ChevronLeft, ChevronRight, Sparkles, Plus,
  Lightbulb, Bookmark, BookmarkCheck, ExternalLink, DollarSign, CreditCard, Wallet, HandHeart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import FeedComments from "../components/FeedComments";
import CreatePostDialog from "../components/CreatePostDialog";
import { getPublicUserProfiles } from '@/functions/getPublicUserProfiles';
import { toast } from "sonner";
import HorizontalScrollContainer from "../components/HorizontalScrollContainer";
import ProjectLinkPreviewDialog from "@/components/ProjectLinkPreviewDialog";
import FeedProjectHighlights from "../components/FeedProjectHighlights";
import ProjectActivityIndicator, { isProjectActive } from "../components/ProjectActivityIndicator";
import ProjectActivityFeed from "@/components/feed/ProjectActivityFeed";
import OptimizedImage from "@/components/OptimizedImage";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import ProjectCardSkeleton from "@/components/skeletons/ProjectCardSkeleton";
import FeedPostSkeleton from "@/components/skeletons/FeedPostSkeleton";
import FeedPostItem from "@/components/feed/FeedPostItem";

const formatEnumLabel = (str) => {
  if (!str) return '';
  return String(str).split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 3;
        continue;
      }
      throw error;
    }
  }
};

const ProjectPost = ({ project, owner, currentUser, projectApplauds = [], onProjectUpdate, onApplaudUpdate, collaboratorProfilesMap = {} }) => {
  const [contentView, setContentView] = React.useState('link');
  const [isApplauded, setIsApplauded] = useState(false);
  const [applaudCount, setApplaudCount] = useState(0);
  const commentsRef = useRef(null);
  const [showAllLinksDialog, setShowAllLinksDialog] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(project.followers_count || 0);
  const [selectedProjectLink, setSelectedProjectLink] = useState(null);
  const [showLinkPreview, setShowLinkPreview] = useState(false);
  const [showFundingDialog, setShowFundingDialog] = useState(false);

  const isOwnProject = currentUser && project.created_by === currentUser.email;

  const statusConfig = {
    seeking_collaborators: { color: "border-orange-500", icon: <Users className="w-3 h-3 mr-1 text-orange-500" />, label: "Seeking Collaborators" },
    in_progress: { color: "border-blue-500", icon: <Clock className="w-3 h-3 mr-1 text-blue-500" />, label: "In Progress" },
    completed: { color: "border-green-500", icon: <CheckCircle className="w-3 h-3 mr-1 text-green-500" />, label: "Project Completed" },
  };
  const config = statusConfig[project.status] || {};

  const hasLinks = project.project_urls?.length > 0;
  const hasHighlights = project.highlights && project.highlights.length > 0;
  const hasAnyContent = hasLinks || hasHighlights;
  const hasMultipleLinks = project.project_urls?.length > 1;

  useEffect(() => {
    const currentProjectApplauds = projectApplauds.filter(a => a.project_id === project.id);
    setApplaudCount(currentProjectApplauds.length);
    if (currentUser) {
      setIsApplauded(currentProjectApplauds.some(a => a.user_email === currentUser.email));
    } else {
      setIsApplauded(false);
    }
  }, [projectApplauds, project.id, currentUser]);

  useEffect(() => {
    if (hasLinks) setContentView('link');
    else if (hasHighlights) setContentView('highlights');
  }, [hasLinks, hasHighlights]);

  const collaboratorProfiles = React.useMemo(() => {
    if (!project.collaborator_emails || !collaboratorProfilesMap) return [];
    return project.collaborator_emails.slice(0, 3).map(email => collaboratorProfilesMap[email]).filter(Boolean);
  }, [project.collaborator_emails, collaboratorProfilesMap]);

  useEffect(() => {
    if (currentUser?.followed_projects) setIsFollowing(currentUser.followed_projects.includes(project.id));
    setFollowersCount(project.followers_count || 0);
  }, [currentUser, project.id, project.followers_count]);

  const handleFollow = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!currentUser || isOwnProject) return;
    try {
      if (isFollowing) {
        const updatedFollowed = (currentUser.followed_projects || []).filter(id => id !== project.id);
        await base44.auth.updateMe({ followed_projects: updatedFollowed });
        const newCount = Math.max(0, followersCount - 1);
        await Project.update(project.id, { followers_count: newCount });
        setIsFollowing(false); setFollowersCount(newCount);
        if (onProjectUpdate) onProjectUpdate();
      } else {
        const updatedFollowed = [...(currentUser.followed_projects || []), project.id];
        await base44.auth.updateMe({ followed_projects: updatedFollowed });
        const newCount = followersCount + 1;
        await Project.update(project.id, { followers_count: newCount });
        setIsFollowing(true); setFollowersCount(newCount);
        if (onProjectUpdate) onProjectUpdate();
      }
    } catch (error) { toast.error("Failed to update follow status."); }
  };

  const handleShare = (e) => {
    e.preventDefault(); e.stopPropagation();
    const projectUrl = `${window.location.origin}${createPageUrl(`ProjectDetail?id=${project.id}`)}`;
    navigator.clipboard.writeText(projectUrl).catch(() => toast.error("Failed to copy link."));
  };

  const handleFund = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (project.paypal_link || project.venmo_link || project.cashapp_link) setShowFundingDialog(true);
  };

  const handlePaymentRedirect = (platform) => {
    let url = null;
    if (platform === 'paypal' && project.paypal_link) url = `https://paypal.me/${project.paypal_link}`;
    else if (platform === 'venmo' && project.venmo_link) url = `https://venmo.com/${project.venmo_link}`;
    else if (platform === 'cashapp' && project.cashapp_link) url = `https://cash.app/$${project.cashapp_link}`;
    if (url) { window.open(url, '_blank', 'noopener,noreferrer'); setShowFundingDialog(false); }
  };

  const handleApplaud = async () => {
    if (!currentUser) return;
    const wasApplauded = isApplauded;
    const previousCount = applaudCount;
    setIsApplauded(!wasApplauded);
    setApplaudCount(prev => wasApplauded ? prev - 1 : prev + 1);
    try {
      if (wasApplauded) {
        const userApplaud = projectApplauds.find(a => a.project_id === project.id && a.user_email === currentUser.email);
        if (userApplaud) { await ProjectApplaud.delete(userApplaud.id); if (onApplaudUpdate) onApplaudUpdate(); }
      } else {
        await ProjectApplaud.create({ project_id: project.id, user_email: currentUser.email, user_name: currentUser.full_name || currentUser.email });
        if (project.created_by !== currentUser.email) {
          Notification.create({ user_email: project.created_by, title: "Someone applauded your project!", message: `${currentUser.full_name || currentUser.email} applauded your project "${project.title}".`, type: "feed_applaud", related_project_id: project.id, actor_email: currentUser.email, actor_name: currentUser.full_name || currentUser.email, metadata: { project_title: project.title } }).catch(console.error);
        }
        if (onApplaudUpdate) onApplaudUpdate();
      }
    } catch (error) {
      setIsApplauded(wasApplauded); setApplaudCount(previousCount);
      toast.error("Failed to update applaud.");
    }
  };

  const getDomain = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };
  const getFaviconUrl = (url) => { try { return `https://www.google.com/s2/favicons?sz=128&domain_url=${new URL(url).hostname}`; } catch { return null; } };

  return (
    <>
      <ProjectLinkPreviewDialog isOpen={showLinkPreview} onClose={() => setShowLinkPreview(false)} url={selectedProjectLink} projectTitle={project.title} />

      <Dialog open={showFundingDialog} onOpenChange={setShowFundingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2"><DollarSign className="w-5 h-5 text-green-600" /><span>Support This Project</span></DialogTitle>
            <DialogDescription className="pt-2">Choose a payment method to fund <span className="font-semibold">{project.title}</span>.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {project.paypal_link && (<Button onClick={() => handlePaymentRedirect('paypal')} className="w-full flex items-center justify-between p-4 h-auto bg-blue-600 hover:bg-blue-700 text-white"><div className="flex items-center space-x-3"><CreditCard className="w-5 h-5" /><div className="text-left"><div className="font-semibold">PayPal</div><div className="text-xs opacity-90">@{project.paypal_link}</div></div></div><ExternalLink className="w-4 h-4" /></Button>)}
            {project.venmo_link && (<Button onClick={() => handlePaymentRedirect('venmo')} className="w-full flex items-center justify-between p-4 h-auto bg-cyan-500 hover:bg-cyan-600 text-white"><div className="flex items-center space-x-3"><Wallet className="w-5 h-5" /><div className="text-left"><div className="font-semibold">Venmo</div><div className="text-xs opacity-90">@{project.venmo_link}</div></div></div><ExternalLink className="w-4 h-4" /></Button>)}
            {project.cashapp_link && (<Button onClick={() => handlePaymentRedirect('cashapp')} className="w-full flex items-center justify-between p-4 h-auto bg-green-600 hover:bg-green-700 text-white"><div className="flex items-center space-x-3"><DollarSign className="w-5 h-5" /><div className="text-left"><div className="font-semibold">Cash App</div><div className="text-xs opacity-90">${project.cashapp_link}</div></div></div><ExternalLink className="w-4 h-4" /></Button>)}
          </div>
          <DialogFooter className="flex-col sm:flex-col space-y-2"><p className="text-xs text-gray-500 text-center">You'll be redirected to a secure external payment platform</p><Button variant="outline" onClick={() => setShowFundingDialog(false)} className="w-full">Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAllLinksDialog} onOpenChange={setShowAllLinksDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center"><LinkIcon className="w-5 h-5 mr-2 text-purple-600" />All Project Links</DialogTitle><DialogDescription>Explore all {project.project_urls?.length} links for this project</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-4">
            {project.project_urls?.map((linkItem, index) => {
              const url = typeof linkItem === 'object' ? linkItem.url : linkItem;
              const title = typeof linkItem === 'object' ? linkItem.title : '';
              return (
                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block group">
                  <Card className="cu-card bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-2">
                        <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span></div>
                        <div className="flex-1 text-center bg-white rounded-md mx-4 py-1 truncate">{getDomain(url)}</div>
                      </div>
                      <div className="relative aspect-video bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                        <div className="text-center p-4"><img src={getFaviconUrl(url)} alt="" className="w-16 h-16 mx-auto mb-2 object-contain" onError={(e) => e.currentTarget.style.display='none'} />{title && <p className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{title}</p>}<p className="text-sm text-gray-500 mt-1">Click to visit</p></div>
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><LinkIcon className="w-8 h-8 text-black/50" /></div>
                      </div>
                    </div>
                  </Card>
                </a>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <motion.div id={`project-${project.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
        <Card className={`cu-card mb-6 overflow-hidden border-t-4 ${config.color} hover:shadow-lg transition-shadow duration-300`}>
          <CardHeader className="px-3 sm:px-4 md:px-6 pb-3">
            <div className="flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="flex-shrink-0">
                  {project.logo_url ? (
                    <OptimizedImage src={project.logo_url} alt={project.title} width={96} className="w-12 h-12 rounded-lg object-cover border-2 border-gray-100 shadow-sm" loading="lazy" fallback={<div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center border-2 border-gray-100 shadow-sm"><Lightbulb className="w-6 h-6 text-purple-600" /></div>} />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center border-2 border-gray-100 shadow-sm"><Lightbulb className="w-6 h-6 text-purple-600" /></div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="block">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors line-clamp-2">{project.title}</h3>
                      <ProjectActivityIndicator isActive={isProjectActive(project.collaborator_emails, collaboratorProfilesMap)} size="sm" />
                    </div>
                  </Link>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
                    <Link to={createPageUrl(owner.username ? `UserProfile?username=${owner.username}` : `UserProfile?email=${owner.email}`)} className="flex items-center space-x-1.5 group">
                      <OptimizedAvatar src={owner.profile_image} alt={owner.full_name || 'Owner'} fallback={owner.full_name?.[0] || 'U'} size="xs" className="w-5 h-5 border-2 border-white shadow-sm" />
                      <span className="text-xs sm:text-sm text-gray-600 group-hover:text-purple-600 transition-colors">{owner.full_name || 'Anonymous User'}</span>
                    </Link>
                    <span className="text-xs sm:text-sm text-gray-400">•</span>
                    <span className="text-xs sm:text-sm text-gray-500">{formatDistanceToNow(new Date(project.created_date))} ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {currentUser && !isOwnProject && (
                  <Button variant="ghost" size="icon" className={`h-9 w-9 ${isFollowing ? 'text-purple-600 hover:text-purple-700 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`} onClick={handleFollow} title={isFollowing ? "Unfollow project" : "Follow for updates"}>
                    {isFollowing ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleShare} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 h-9 w-9" title="Share project"><Share2 className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Badge variant="outline" className={`text-xs ${config.color} border-current shadow-sm`}>{config.icon}<span className="ml-1">{formatEnumLabel(project.status)}</span></Badge>
              <Badge className="text-xs bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">{project.project_type}</Badge>
              {project.classification && (<Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50">{formatEnumLabel(project.classification)}</Badge>)}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-purple-600">
                {collaboratorProfiles.length > 0 ? (
                  <div className="flex items-center -space-x-1.5">{collaboratorProfiles.map(collab => <OptimizedAvatar key={collab.email} src={collab.profile_image} alt={collab.full_name || 'Collaborator'} fallback={collab.full_name?.[0] || 'U'} size="xs" className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-white shadow-sm" />)}</div>
                ) : (<Users className="w-3 h-3 sm:w-4 sm:h-4" />)}
                <span className="font-medium ml-1">{(() => { const count = project.collaborator_emails?.length || 1; return count > 3 ? `3+ collaborators` : `${count} ${count === 1 ? 'collaborator' : 'collaborators'}`; })()}</span>
              </div>
              {followersCount > 0 && (<div className="flex items-center text-xs sm:text-sm text-gray-600"><Bookmark className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /><span className="font-medium">{followersCount} {followersCount === 1 ? 'follower' : 'followers'}</span></div>)}
            </div>
          </CardHeader>

          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 pt-2">
            <p className="text-gray-700 line-clamp-3 mb-4 cu-text-responsive-sm leading-relaxed">{project.description}</p>

            {hasAnyContent && (() => {
              const contentTypes = [];
              if (hasLinks) contentTypes.push({ key: 'link', label: 'Showcase', icon: LinkIcon, count: project.project_urls?.length });
              if (hasHighlights) contentTypes.push({ key: 'highlights', label: 'Highlights', icon: Camera, count: project.highlights?.length });
              if (contentTypes.length === 0) return null;
              const currentIndex = contentTypes.findIndex(ct => ct.key === contentView);
              const currentType = contentTypes[currentIndex] || contentTypes[0];
              const hasPrev = currentIndex > 0;
              const hasNext = currentIndex < contentTypes.length - 1;
              const CurrentIcon = currentType.icon;
              return (
                <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-lg p-2">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (hasPrev) setContentView(contentTypes[currentIndex - 1].key); }} disabled={!hasPrev} className={`p-2 ${!hasPrev ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}><ChevronLeft className="w-5 h-5" /></Button>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><CurrentIcon className="w-4 h-4" /><span>{currentType.label}</span>{currentType.count > 0 && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{currentType.count}</span>}</div>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (hasNext) setContentView(contentTypes[currentIndex + 1].key); }} disabled={!hasNext} className={`p-2 ${!hasNext ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}><ChevronRight className="w-5 h-5" /></Button>
                </div>
              );
            })()}

            {contentView === 'link' && hasLinks && (
              <div className="mb-4">
                {hasMultipleLinks ? (
                  <div className="space-y-3">
                    <HorizontalScrollContainer className="pb-2" showArrows={project.project_urls.length > 1}>
                      {project.project_urls.slice(0, 3).map((linkItem, index) => {
                        const url = typeof linkItem === 'object' ? linkItem.url : linkItem;
                        const title = typeof linkItem === 'object' ? linkItem.title : '';
                        return (
                          <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] block">
                            <Card className="cu-card bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden h-full border-2 border-gray-100 hover:border-green-300 group">
                              <div className="p-3">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                  <Badge className="bg-green-100 text-green-700 flex items-center gap-1"><LinkIcon className="w-3 h-3" />Showcase</Badge>
                                  <img src={getFaviconUrl(url)} alt="" className="w-4 h-4 object-contain" onError={(e) => e.currentTarget.style.display='none'} />
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-2">
                                  <div className="bg-gray-900 px-3 py-2 flex items-center justify-between"><div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="w-2 h-2 rounded-full bg-yellow-500"></span><span className="w-2 h-2 rounded-full bg-green-500"></span></div><span className="text-[10px] text-gray-400">{getDomain(url)}</span></div>
                                  <div className="aspect-video bg-white flex items-center justify-center p-4 group-hover:bg-gray-50 transition-colors">
                                    <div className="text-center"><img src={getFaviconUrl(url)} alt="" className="w-16 h-16 mx-auto mb-2 object-contain" onError={(e) => e.currentTarget.style.display='none'} />{title && <p className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{title}</p>}<p className="text-[10px] text-gray-500 mt-1">Click to visit</p></div>
                                  </div>
                                </div>
                                <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors">{title || getDomain(url)}</h4>
                              </div>
                            </Card>
                          </a>
                        );
                      })}
                    </HorizontalScrollContainer>
                    {project.project_urls.length > 3 && (<Button variant="outline" size="sm" onClick={() => setShowAllLinksDialog(true)} className="w-full"><LinkIcon className="w-4 h-4 mr-2" />View All {project.project_urls.length} Showcase Links</Button>)}
                  </div>
                ) : (() => {
                  const linkItem = project.project_urls[0];
                  const url = typeof linkItem === 'object' ? linkItem.url : linkItem;
                  const title = typeof linkItem === 'object' ? linkItem.title : '';
                  return (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className="flex-shrink-0 w-full max-w-md mx-auto">
                        <Card className="cu-card bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden border-2 border-gray-100 hover:border-green-300 group">
                          <div className="p-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <Badge className="bg-green-100 text-green-700 flex items-center gap-1"><LinkIcon className="w-3 h-3" />Published</Badge>
                              <img src={getFaviconUrl(url)} alt="" className="w-5 h-5 object-contain" onError={(e) => e.currentTarget.style.display='none'} />
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-3">
                              <div className="bg-gray-900 px-3 py-2 flex items-center justify-between"><div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="w-2 h-2 rounded-full bg-yellow-500"></span><span className="w-2 h-2 rounded-full bg-green-500"></span></div><span className="text-[10px] text-gray-400">{getDomain(url)}</span></div>
                              <div className="aspect-video bg-white flex items-center justify-center p-6 group-hover:bg-gray-50 transition-colors">
                                <div className="text-center"><img src={getFaviconUrl(url)} alt="" className="w-20 h-20 mx-auto mb-3 object-contain" onError={(e) => e.currentTarget.style.display='none'} />{title && <p className="text-base font-bold text-gray-900 mb-1 line-clamp-2 px-2">{title}</p>}<p className="text-xs text-gray-500 mt-1">Click to visit</p></div>
                              </div>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">{title || getDomain(url)}</h4>
                            <p className="text-xs text-gray-500">Click anywhere to visit this site</p>
                          </div>
                        </Card>
                      </div>
                    </a>
                  );
                })()}
              </div>
            )}

            {contentView === 'highlights' && hasHighlights && (
              <FeedProjectHighlights project={project} currentUser={currentUser} onProjectUpdate={onProjectUpdate} />
            )}

            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 cu-text-responsive-sm text-gray-600 mb-4">
              {project.location && (<div className="flex items-center"><MapPin className="cu-icon-sm mr-2 flex-shrink-0 text-purple-500" /><span className="truncate">{project.location}</span></div>)}
              {project.industry && (<div className="flex items-center"><Building2 className="cu-icon-sm mr-2 flex-shrink-0 text-indigo-500" /><span className="truncate">{formatEnumLabel(project.industry)}</span></div>)}
              {project.area_of_interest && (<div className="flex items-center"><Tag className="cu-icon-sm mr-2 flex-shrink-0 text-pink-500" /><span className="truncate">{formatEnumLabel(project.area_of_interest)}</span></div>)}
            </div>

            {project.skills_needed && project.skills_needed.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.skills_needed.slice(0, 5).map(skill => (<Badge key={skill} className="cu-text-responsive-xs bg-purple-50 text-purple-700 border border-purple-200">{skill}</Badge>))}
                {project.skills_needed.length > 5 && (<Badge variant="outline" className="cu-text-responsive-xs border-purple-200 text-purple-600">+{project.skills_needed.length - 5} more</Badge>)}
              </div>
            )}

            <ProjectActivityFeed project={project} />
          </CardContent>

          <CardFooter className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200">
            <div className="w-full">
              <div className="flex justify-around pb-4 border-b">
                <Button variant="ghost" size="sm" className={`flex items-center space-x-2 transition-colors cu-text-responsive-sm ${isApplauded ? 'text-purple-600 hover:text-purple-700' : 'text-gray-600 hover:text-purple-600'}`} onClick={handleApplaud}>
                  <HandHeart className="cu-icon-sm" /><span className="hidden sm:inline">Applaud</span>
                  {applaudCount > 0 && <span className="cu-text-responsive-xs bg-gray-200 px-2 py-1 rounded-full ml-1">{applaudCount}</span>}
                </Button>
                <div className="flex-1 flex justify-center">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600 cu-text-responsive-sm" onClick={() => commentsRef.current?.toggle()}>
                    <MessageCircle className="cu-icon-sm" /><span className="hidden sm:inline">Comment</span>
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors cu-text-responsive-sm" onClick={handleFund} disabled={!project.paypal_link && !project.venmo_link && !project.cashapp_link}>
                  <DollarSign className="cu-icon-sm" /><span className="hidden sm:inline">Fund</span>
                </Button>
              </div>
              <FeedComments ref={commentsRef} project={project} currentUser={currentUser} />
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </>
  );
};

const FeedList = ({ isLoading, displayedItems, isLoadingMore, currentUser, projectApplauds, feedPostApplauds, loadFeedData, handleApplaudUpdate, allCollaboratorProfiles, showCreatePostDialog, setShowCreatePostDialog }) => (
  <div className="min-h-[800px]">
    {isLoading ? (
      <>
        {[...Array(4)].map((_, i) => (
          <React.Fragment key={i}>{i % 2 === 0 ? <ProjectCardSkeleton /> : <FeedPostSkeleton />}</React.Fragment>
        ))}
      </>
    ) : displayedItems.length === 0 ? (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold">No posts found</h3>
        <p className="text-gray-600 mt-2">Be the first to create a post!</p>
        {currentUser && (
          <div className="flex gap-3 justify-center mt-4">
            <Button onClick={() => setShowCreatePostDialog(true)} className="cu-button">Post</Button>
            <Link to={createPageUrl("CreateProject")}><Button className="cu-button">Create Project</Button></Link>
          </div>
        )}
      </div>
    ) : (
      <>
        <AnimatePresence>
          {displayedItems.map((item) => (
            item.itemType === 'project' ? (
              <ProjectPost key={`project-${item.id}`} project={item} owner={item.owner} currentUser={currentUser} projectApplauds={projectApplauds} onProjectUpdate={loadFeedData} onApplaudUpdate={handleApplaudUpdate} collaboratorProfilesMap={allCollaboratorProfiles} />
            ) : (
              <FeedPostItem key={`feedpost-${item.id}`} post={item} owner={item.owner} currentUser={currentUser} feedPostApplauds={feedPostApplauds} onPostDeleted={loadFeedData} onApplaudUpdate={handleApplaudUpdate} />
            )
          ))}
        </AnimatePresence>
        {isLoadingMore && (
          <div className="text-center py-8">
            <div className="inline-flex items-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div><span className="text-gray-600">Loading more...</span></div>
          </div>
        )}
      </>
    )}
  </div>
);

export default function Feed({ currentUser, authIsLoading }) {
  const [projects, setProjects] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [projectApplauds, setProjectApplauds] = useState([]);
  const [feedPostApplauds, setFeedPostApplauds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allCollaboratorProfiles, setAllCollaboratorProfiles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedItemsCount, setDisplayedItemsCount] = useState(10);
  const [showFirstProjectPrompt, setShowFirstProjectPrompt] = useState(false);
  const [userProjectCount, setUserProjectCount] = useState(null);
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);

  const location = useLocation();
  const highlightedItemIdRef = useRef(null);
  const hasScrolledRef = useRef(false);
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 10;

  const { data: cachedFeedData, isLoading: isQueryLoading } = useQuery({
    queryKey: ['feed-projects', currentUser?.email],
    queryFn: async () => {
      const [visibleProjectsData, initialFeedPostsData] = await Promise.all([
        withRetry(() => Project.filter({ is_visible_on_feed: true }, "-created_date")),
        withRetry(() => FeedPost.filter({ is_visible: true }, "-created_date"))
      ]);

      const allOwnerEmails = [...new Set([...visibleProjectsData.map(p => p.created_by), ...initialFeedPostsData.map(fp => fp.created_by)])];
      const projectIds = visibleProjectsData.map(p => p.id);
      const feedPostIds = initialFeedPostsData.map(fp => fp.id);

      const [profilesResponse, fetchedProjectApplauds, fetchedFeedPostApplauds] = await Promise.all([
        allOwnerEmails.length > 0 ? withRetry(() => getPublicUserProfiles({ emails: allOwnerEmails }), 2, 2000) : Promise.resolve({ data: [] }),
        projectIds.length > 0 ? withRetry(() => ProjectApplaud.filter({ project_id: { $in: projectIds } })) : Promise.resolve([]),
        feedPostIds.length > 0 ? withRetry(() => FeedPostApplaud.filter({ feed_post_id: { $in: feedPostIds } })) : Promise.resolve([])
      ]);

      const profilesMap = (profilesResponse.data || []).reduce((acc, p) => { acc[p.email] = p; return acc; }, {});

      const fullyPopulatedProjects = visibleProjectsData.map(project => ({
        ...project, owner: profilesMap[project.created_by] || { email: project.created_by, full_name: project.created_by.split('@')[0], username: null, profile_image: null }
      }));
      const fullyPopulatedFeedPosts = initialFeedPostsData.map(post => ({
        ...post, owner: profilesMap[post.created_by] || { email: post.created_by, full_name: post.created_by.split('@')[0], username: null, profile_image: null }
      }));

      const allCollabEmails = new Set();
      visibleProjectsData.forEach(p => { if (p.collaborator_emails) p.collaborator_emails.forEach(e => allCollabEmails.add(e)); });

      let collabProfilesMap = {};
      if (allCollabEmails.size > 0) {
        try {
          const { data: collabProfiles } = await withRetry(() => getPublicUserProfiles({ emails: Array.from(allCollabEmails) }));
          (collabProfiles || []).forEach(p => { collabProfilesMap[p.email] = p; });
        } catch (error) { console.error("Error fetching collaborator profiles:", error); }
      }

      return { projects: fullyPopulatedProjects, feedPosts: fullyPopulatedFeedPosts, projectApplauds: fetchedProjectApplauds, feedPostApplauds: fetchedFeedPostApplauds, collaboratorProfiles: collabProfilesMap };
    },
    enabled: !authIsLoading,
    staleTime: 0, gcTime: 0, refetchOnWindowFocus: true, refetchOnMount: 'always',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (cachedFeedData && !isQueryLoading) {
      setProjects(cachedFeedData.projects);
      setFeedPosts(cachedFeedData.feedPosts);
      setProjectApplauds(cachedFeedData.projectApplauds);
      setFeedPostApplauds(cachedFeedData.feedPostApplauds);
      setAllCollaboratorProfiles(cachedFeedData.collaboratorProfiles);
      setDisplayedItemsCount(ITEMS_PER_PAGE);
    }
  }, [cachedFeedData, isQueryLoading]);

  const loadFeedData = useCallback(() => { queryClient.invalidateQueries(['feed-projects']); }, [queryClient]);

  useEffect(() => { setIsLoading(isQueryLoading); }, [isQueryLoading]);

  const allFeedItems = React.useMemo(() => {
    const combined = [
      ...projects.map(p => ({ ...p, itemType: 'project', sortDate: new Date(p.created_date) })),
      ...feedPosts.map(fp => ({ ...fp, itemType: 'feedPost', sortDate: new Date(fp.created_date) }))
    ];
    return combined.sort((a, b) => b.sortDate - a.sortDate);
  }, [projects, feedPosts]);

  const loadMoreItems = useCallback(() => {
    if (isLoadingMore) return;
    const totalAvailable = allFeedItems.length;
    if (displayedItemsCount >= totalAvailable) return;
    setIsLoadingMore(true);
    setTimeout(() => { setDisplayedItemsCount(prev => Math.min(prev + ITEMS_PER_PAGE, totalAvailable)); setIsLoadingMore(false); }, 300);
  }, [isLoadingMore, displayedItemsCount, allFeedItems.length]);

  useEffect(() => {
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPercentage = (window.pageYOffset + window.innerHeight) / document.documentElement.offsetHeight;
          if (scrollPercentage >= 0.8) loadMoreItems();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [loadMoreItems]);

  useEffect(() => {
    if (location.hash?.startsWith('#project-')) highlightedItemIdRef.current = location.hash.substring('#project-'.length);
    else if (location.hash?.startsWith('#feedpost-')) highlightedItemIdRef.current = location.hash.substring('#feedpost-'.length);
  }, [location.hash]);

  useEffect(() => {
    if (!isLoading && highlightedItemIdRef.current && !hasScrolledRef.current) {
      setTimeout(() => {
        const el = document.getElementById(`project-${highlightedItemIdRef.current}`) || document.getElementById(`feedpost-${highlightedItemIdRef.current}`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('highlight-post'); setTimeout(() => el.classList.remove('highlight-post'), 3000); hasScrolledRef.current = true; }
      }, 500);
    }
  }, [isLoading]);

  const handleApplaudUpdate = useCallback(async () => {
    const projectIds = projects.map(p => p.id);
    const postIds = feedPosts.map(fp => fp.id);
    if (projectIds.length > 0) { try { const r = await withRetry(() => ProjectApplaud.filter({ project_id: { $in: projectIds } })); if (r) setProjectApplauds(r); } catch (e) { console.error(e); } }
    if (postIds.length > 0) { try { const r = await withRetry(() => FeedPostApplaud.filter({ feed_post_id: { $in: postIds } })); if (r) setFeedPostApplauds(r); } catch (e) { console.error(e); } }
  }, [projects, feedPosts]);

  const displayedItems = React.useMemo(() => {
    let filtered = allFeedItems;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = allFeedItems.filter(item => {
        if (item.itemType === 'project') {
          return item.title?.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query) || item.location?.toLowerCase().includes(query) || item.industry?.toLowerCase().includes(query) || item.area_of_interest?.toLowerCase().includes(query) || item.skills_needed?.some(s => s.toLowerCase().includes(query));
        } else {
          return item.title?.toLowerCase().includes(query) || item.content?.toLowerCase().includes(query) || item.tags?.some(t => t.toLowerCase().includes(query));
        }
      });
    }
    return filtered.slice(0, displayedItemsCount);
  }, [allFeedItems, searchQuery, displayedItemsCount]);

  useEffect(() => {
    const checkUserProjects = async () => {
      if (!currentUser || authIsLoading || userProjectCount !== null) return;
      try {
        if (currentUser.has_completed_onboarding) {
          const userProjects = await withRetry(() => Project.filter({ created_by: currentUser.email }));
          setUserProjectCount(userProjects.length);
          const hasSeenPrompt = localStorage.getItem(`first_project_prompt_seen_${currentUser.email}`);
          if (userProjects.length === 0 && !hasSeenPrompt) setTimeout(() => setShowFirstProjectPrompt(true), 1000);
        }
      } catch (error) { console.error("Error checking user projects:", error); }
    };
    checkUserProjects();
  }, [currentUser, authIsLoading, userProjectCount]);

  if (authIsLoading) return <div className="text-center py-16"><p className="cu-text-responsive-sm">Loading...</p></div>;

  const feedListProps = { isLoading, displayedItems, isLoadingMore, currentUser, projectApplauds, feedPostApplauds, loadFeedData, handleApplaudUpdate, allCollaboratorProfiles, showCreatePostDialog, setShowCreatePostDialog };

  return (
    <>
      <CreatePostDialog isOpen={showCreatePostDialog} onClose={() => setShowCreatePostDialog(false)} currentUser={currentUser} onPostCreated={loadFeedData} />

      <Dialog open={showFirstProjectPrompt} onOpenChange={setShowFirstProjectPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--cu-primary)' }}><Sparkles className="w-5 h-5 text-white" /></div>
              <DialogTitle className="text-xl font-bold">Create Your First Project!</DialogTitle>
            </div>
            <DialogDescription className="pt-4 text-base">Welcome to Collab Unity! 🎉 Start your collaboration journey by creating your first project.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowFirstProjectPrompt(false); localStorage.setItem(`first_project_prompt_seen_${currentUser.email}`, 'true'); }} className="flex-1">Maybe Later</Button>
            <Button onClick={() => { setShowFirstProjectPrompt(false); localStorage.setItem(`first_project_prompt_seen_${currentUser.email}`, 'true'); navigate(createPageUrl("CreateProject")); }} className="flex-1 cu-button"><Plus className="w-4 h-4 mr-2" />Create Project</Button>
          </div>
          <p className="text-xs text-gray-500 text-center pt-2">You can always create a project later from the menu</p>
        </DialogContent>
      </Dialog>

      <div className="cu-container">
        <style>{`.highlight-post { box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.5); transition: box-shadow 0.5s ease-out; }`}</style>

        {/* Mobile layout */}
        <div className="block md:hidden">
          <div className="cu-content-grid pt-4">
            {currentUser && (
              <>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <Button onClick={() => setShowCreatePostDialog(true)} className="cu-button w-full cu-gradient"><Plus className="w-5 h-5 mr-2" />Post</Button>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
                  <Link to={createPageUrl("CreateProject")} className="block">
                    <div className="cu-gradient rounded-xl p-4 sm:p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0"><h3 className="font-bold text-base sm:text-lg mb-1">Got an idea?</h3><p className="text-purple-100 text-xs sm:text-sm">Create a project and find collaborators</p></div>
                        <div className="flex-shrink-0 ml-3"><div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"><Plus className="w-5 h-5 sm:w-6 sm:h-6" /></div></div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="relative">
                  <Input type="text" placeholder="Search posts and projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-white" />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </motion.div>
              </>
            )}
            <FeedList {...feedListProps} />
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block pt-6 max-w-2xl mx-auto">
          {currentUser && (
            <>
              <Button onClick={() => setShowCreatePostDialog(true)} className="cu-button w-full cu-gradient mb-4"><Plus className="w-5 h-5 mr-2" />Post</Button>
              <Link to={createPageUrl("CreateProject")} className="block mb-4">
                <div className="cu-gradient rounded-xl p-4 sm:p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0"><h3 className="font-bold text-base sm:text-lg mb-1">Got an idea?</h3><p className="text-purple-100 text-xs sm:text-sm">Create a project and find collaborators</p></div>
                    <div className="flex-shrink-0 ml-3"><div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"><Plus className="w-5 h-5 sm:w-6 sm:h-6" /></div></div>
                  </div>
                </div>
              </Link>
            </>
          )}
          <div className="relative mb-6">
            <Input type="text" placeholder="Search posts and projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-white" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <FeedList {...feedListProps} />
        </div>
      </div>
    </>
  );
}