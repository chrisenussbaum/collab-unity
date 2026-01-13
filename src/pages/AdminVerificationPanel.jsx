import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Advertisement, Notification, PlaygroundContent } from '@/entities/all';
import { base44 } from "@/api/base44Client";
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Building,
  Heart,
  GraduationCap,
  User as UserIcon,
  Megaphone,
  ExternalLink,
  Lightbulb,
  Bug,
  Trash2,
  Rss,
  Plus,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import ConfirmationDialog from '../components/ConfirmationDialog';

const AD_TYPE_CONFIG = {
  business: {
    icon: Building,
    label: "Business",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    iconColor: "text-purple-600"
  },
  nonprofit: {
    icon: Heart,
    label: "Nonprofit",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    iconColor: "text-rose-600"
  },
  education: {
    icon: GraduationCap,
    label: "Education",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    iconColor: "text-blue-600"
  },
  collaborator: {
    icon: UserIcon,
    label: "Collaborator",
    color: "bg-green-50 text-green-700 border-green-200",
    iconColor: "text-green-600"
  }
};

const AdReviewCard = ({ ad, onApprove, onReject, onViewDetails, isProcessing }) => {
  const typeConfig = AD_TYPE_CONFIG[ad.type];
  const TypeIcon = typeConfig?.icon || Megaphone;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="cu-card hover:shadow-xl transition-all duration-300 border border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig?.color.split(' ')[0] || 'bg-gray-100'}`}>
                <TypeIcon className={`w-6 h-6 ${typeConfig?.iconColor || 'text-gray-600'}`} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-base">
                  {ad.title}
                </h3>
                <p className="text-sm text-gray-600 truncate">{ad.advertiser_name}</p>
              </div>
            </div>
            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-medium text-xs whitespace-nowrap">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-3">
          {ad.image_url && (
            <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100">
              <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          )}

          <p className="text-sm text-gray-600 line-clamp-2">{ad.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-medium text-gray-500 text-xs mb-1">Type</p>
              <Badge className={`${typeConfig?.color} border text-xs`}>
                {typeConfig?.label}
              </Badge>
            </div>
            <div>
              <p className="font-medium text-gray-500 text-xs mb-1">CTA</p>
              <p className="text-gray-900 font-medium truncate">{ad.cta_text}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(ad)}
              className="flex-1 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              Details
            </Button>

            <Button
              size="sm"
              onClick={() => onApprove(ad)}
              disabled={isProcessing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onReject(ad)}
              disabled={isProcessing}
              className="flex-1 text-xs"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const BUG_STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  investigating: { label: "Investigating", color: "bg-blue-50 text-blue-700 border-blue-200" },
  resolved: { label: "Resolved", color: "bg-green-50 text-green-700 border-green-200" },
  wont_fix: { label: "Won't Fix", color: "bg-gray-50 text-gray-700 border-gray-200" }
};

const BUG_PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-blue-100 text-blue-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700" }
};

export default function AdminVerificationPanel() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingAds, setPendingAds] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [playgroundContent, setPlaygroundContent] = useState([]);
  const [activeTab, setActiveTab] = useState('ads'); // 'ads', 'bugs', or 'content'
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [selectedBug, setSelectedBug] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showDeleteBugDialog, setShowDeleteBugDialog] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [bugStatus, setBugStatus] = useState('');
  const [bugPriority, setBugPriority] = useState('');
  const [newContentUrl, setNewContentUrl] = useState('');
  const [newContentCategory, setNewContentCategory] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentDeleteDialog, setShowContentDeleteDialog] = useState(false);

  const loadPendingItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user.role !== 'admin') {
        toast.error("Access denied. Admin privileges required.");
        navigate(createPageUrl("Discover"));
        return;
      }

      const [allAds, allBugs, allContent] = await Promise.all([
        Advertisement.list(),
        base44.entities.Bug.list('-created_date'),
        base44.entities.PlaygroundContent.list('-created_date')
      ]);

      const pending = allAds.filter(ad => !ad.is_active);
      setPendingAds(pending);

      setBugs(allBugs || []);
      setPlaygroundContent(allContent || []);

    } catch (error) {
      console.error("Error loading pending items:", error);
      toast.error("Failed to load items for review.");
      navigate(createPageUrl("Discover"));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadPendingItems();
  }, [loadPendingItems]);

  const handleApproveAd = async (ad) => {
    setIsProcessing(true);
    try {
      // Check if targeting data is missing and generate if needed
      let targetingData = {
        target_categories: ad.target_categories || [],
        target_keywords: ad.target_keywords || [],
        priority_score: ad.priority_score || 5
      };

      const needsTargeting = !ad.target_categories?.length || !ad.target_keywords?.length || !ad.priority_score;

      if (needsTargeting) {
        toast.info("Generating missing targeting data...");
        
        try {
          const prompt = `Based on the following advertisement details, generate relevant targeting data:

Ad Title: ${ad.title}
Ad Description: ${ad.description}
Advertiser Type: ${ad.type}
Advertiser Name: ${ad.advertiser_name}

Please analyze this ad and provide:
1. target_categories: Array of 3-5 relevant categories (e.g., "technology", "design", "marketing", "business", "education", "healthcare", "finance", "e-commerce", "nonprofit", "entertainment", "sports", "science", "art", "music", "gaming", "food", "travel", "fashion", "real-estate", "automotive")
2. target_keywords: Array of 10-15 relevant keywords that describe the ad's focus areas, skills, industries, or topics
3. priority_score: A number from 1-10 indicating the relevance and value of this ad (1=lowest, 10=highest). Consider factors like: ad type (nonprofit/education should score higher), content quality, target audience value, and campaign goals.`;

          const response = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
              type: "object",
              properties: {
                target_categories: {
                  type: "array",
                  items: { type: "string" }
                },
                target_keywords: {
                  type: "array",
                  items: { type: "string" }
                },
                priority_score: {
                  type: "number",
                  minimum: 1,
                  maximum: 10
                }
              },
              required: ["target_categories", "target_keywords", "priority_score"]
            }
          });

          targetingData = {
            target_categories: response.target_categories || ["general"],
            target_keywords: response.target_keywords || [ad.type, "advertising"],
            priority_score: response.priority_score || 5
          };
        } catch (genError) {
          console.error("Error generating targeting on approval:", genError);
          toast.warning("Using default targeting values");
          targetingData = {
            target_categories: ["general"],
            target_keywords: [ad.type, "advertising"],
            priority_score: 5
          };
        }
      }

      await Advertisement.update(ad.id, {
        is_active: true,
        ...targetingData
      });

      if (ad.created_by) {
        await Notification.create({
          user_email: ad.created_by,
          title: "Advertisement Approved!",
          message: `Your advertisement "${ad.title}" has been approved and is now live on Collab Unity.`,
          type: "advertisement_approved",
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || "Admin"
        });
      }

      toast.success(`Advertisement "${ad.title}" has been approved and is now live.`);
      await loadPendingItems();
      setShowApprovalDialog(false);
      setSelectedAd(null);
    } catch (error) {
      console.error("Error approving ad:", error);
      toast.error("Failed to approve advertisement. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAd = async (ad) => {
    if (!rejectionNotes.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setIsProcessing(true);
    try {
      await Advertisement.delete(ad.id);

      if (ad.created_by) {
        await Notification.create({
          user_email: ad.created_by,
          title: "Advertisement Review Update",
          message: `Your advertisement "${ad.title}" was not approved. Reason: ${rejectionNotes}`,
          type: "advertisement_rejected",
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || "Admin",
          metadata: {
            rejection_reason: rejectionNotes,
            ad_title: ad.title
          }
        });
      }

      toast.success(`Advertisement "${ad.title}" has been rejected.`);
      await loadPendingItems();
      setShowRejectionDialog(false);
      setSelectedAd(null);
      setRejectionNotes('');
    } catch (error) {
      console.error("Error rejecting ad:", error);
      toast.error("Failed to reject advertisement. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateBug = async (bug, updates) => {
    setIsProcessing(true);
    try {
      await base44.entities.Bug.update(bug.id, updates);
      toast.success("Bug updated successfully!");
      await loadPendingItems();
      setShowDetailsModal(false);
      setSelectedBug(null);
      setAdminNotes('');
      setBugStatus('');
      setBugPriority('');
    } catch (error) {
      console.error("Error updating bug:", error);
      toast.error("Failed to update bug.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBug = async () => {
    if (!selectedBug) return;
    
    setIsProcessing(true);
    try {
      await base44.entities.Bug.delete(selectedBug.id);
      toast.success("Bug report deleted successfully!");
      await loadPendingItems();
      setShowDeleteBugDialog(false);
      setSelectedBug(null);
    } catch (error) {
      console.error("Error deleting bug:", error);
      toast.error("Failed to delete bug report.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddContent = async () => {
    if (!newContentUrl.trim() || !newContentCategory) {
      toast.error("Please enter a URL and select a category.");
      return;
    }

    setIsScrapingUrl(true);
    try {
      // Extract domain for favicon
      const urlObj = new URL(newContentUrl.trim());
      const domain = urlObj.hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      // Scrape the URL to get metadata
      const scrapedData = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract metadata from this content URL and return structured data. URL: ${newContentUrl}

Please provide:
- title: The title of the content
- description: A brief description or summary
- author: The author/creator if available
- duration: Duration for videos/podcasts (e.g., "45 min") if applicable

If this is an RSS feed URL, analyze the feed and extract the main metadata.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            author: { type: "string" },
            duration: { type: "string" }
          }
        }
      });

      // Create the content entry with favicon
      await base44.entities.PlaygroundContent.create({
        url: newContentUrl.trim(),
        category: newContentCategory,
        title: scrapedData.title || "Untitled Content",
        description: scrapedData.description || "",
        image_url: faviconUrl,
        author: scrapedData.author || "",
        duration: scrapedData.duration || "",
        content_type: newContentUrl.includes('rss') || newContentUrl.includes('feed') ? 'rss_feed' : 'article',
        is_approved: true,
        submitted_by: currentUser.email
      });

      toast.success("Content added successfully!");
      setNewContentUrl('');
      setNewContentCategory('');
      await loadPendingItems();
    } catch (error) {
      console.error("Error adding content:", error);
      toast.error("Failed to add content. Please try again.");
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedContent) return;
    
    setIsProcessing(true);
    try {
      await base44.entities.PlaygroundContent.delete(selectedContent.id);
      toast.success("Content deleted successfully!");
      await loadPendingItems();
      setShowContentDeleteDialog(false);
      setSelectedContent(null);
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 cu-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Loading review items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="cu-gradient rounded-2xl p-6 sm:p-8 text-white shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Admin Review Panel</h1>
                  <p className="text-purple-100 mt-1">Review ads, templates, and bug reports</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              <Button
                variant={activeTab === 'ads' ? 'default' : 'outline'}
                onClick={() => {
                  setActiveTab('ads');
                  setSelectedAd(null);
                  setSelectedBug(null);
                  setShowDetailsModal(false);
                  setShowApprovalDialog(false);
                  setShowRejectionDialog(false);
                  setRejectionNotes('');
                }}
                className={`flex-shrink-0 ${activeTab === 'ads' ? 'bg-white text-purple-600 hover:bg-white/90' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}
              >
                <Megaphone className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Ads</span>
                <span className="sm:ml-1">({pendingAds.length})</span>
              </Button>
              <Button
                variant={activeTab === 'bugs' ? 'default' : 'outline'}
                onClick={() => {
                  setActiveTab('bugs');
                  setSelectedAd(null);
                  setSelectedBug(null);
                  setShowDetailsModal(false);
                  setShowApprovalDialog(false);
                  setShowRejectionDialog(false);
                  setRejectionNotes('');
                }}
                className={`flex-shrink-0 ${activeTab === 'bugs' ? 'bg-white text-purple-600 hover:bg-white/90' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}
              >
                <Bug className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Bugs</span>
                <span className="sm:ml-1">({bugs.length})</span>
              </Button>
              <Button
                variant={activeTab === 'content' ? 'default' : 'outline'}
                onClick={() => {
                  setActiveTab('content');
                  setSelectedAd(null);
                  setSelectedBug(null);
                  setShowDetailsModal(false);
                  setShowApprovalDialog(false);
                  setShowRejectionDialog(false);
                  setRejectionNotes('');
                }}
                className={`flex-shrink-0 ${activeTab === 'content' ? 'bg-white text-purple-600 hover:bg-white/90' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}
              >
                <Rss className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Playground Content</span>
                <span className="sm:ml-1">({playgroundContent.length})</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Ads Tab */}
        {activeTab === 'ads' && (
          <>
            {pendingAds.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Card className="cu-card">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Megaphone className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Pending Advertisements
                    </h3>
                    <p className="text-gray-600">
                      All advertisements have been reviewed.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {pendingAds.map((ad, index) => (
                    <motion.div
                      key={ad.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (index * 0.05) }}
                    >
                      <AdReviewCard
                        ad={ad}
                        onApprove={(ad) => {
                          setSelectedAd(ad);
                          setShowApprovalDialog(true);
                        }}
                        onReject={(ad) => {
                          setSelectedAd(ad);
                          setShowRejectionDialog(true);
                        }}
                        onViewDetails={(ad) => {
                          setSelectedAd(ad);
                          setShowDetailsModal(true);
                        }}
                        isProcessing={isProcessing}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}



        {/* Playground Content Tab */}
        {activeTab === 'content' && (
          <>
            <Card className="cu-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rss className="w-5 h-5 text-purple-600" />
                  Add Playground Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Content URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newContentUrl}
                      onChange={(e) => setNewContentUrl(e.target.value)}
                      placeholder="https://example.com/podcast-rss or https://youtube.com/watch?v=..."
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Playground Section *
                  </label>
                  <select
                    value={newContentCategory}
                    onChange={(e) => setNewContentCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select section...</option>
                    <option value="digital_library">Digital Library</option>
                    <option value="video_courses">Video Courses</option>
                    <option value="podcasts">Podcasts</option>
                    <option value="tutorials">Tutorials</option>
                    <option value="games">Games</option>
                    <option value="shows_movies">Shows & Movies</option>
                    <option value="puzzles">Puzzles</option>
                    <option value="interactive_stories">Interactive Stories</option>
                  </select>
                </div>

                <Button
                  onClick={handleAddContent}
                  disabled={isScrapingUrl || !newContentUrl.trim() || !newContentCategory}
                  className="cu-button w-full"
                >
                  {isScrapingUrl ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scraping Content...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {playgroundContent.length === 0 ? (
              <Card className="cu-card">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Rss className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Playground Content Yet
                  </h3>
                  <p className="text-gray-600">
                    Add URLs above to populate the playground with content.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playgroundContent.map((content) => (
                  <Card key={content.id} className="cu-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
                            {content.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {content.category.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {content.content_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {content.image_url && (
                        <div className="w-full h-32 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center p-4">
                          <img 
                            src={content.image_url} 
                            alt={content.title}
                            className="w-16 h-16 object-contain"
                          />
                        </div>
                      )}
                      
                      {content.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {content.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {content.author && <span>By {content.author}</span>}
                        {content.duration && <span>• {content.duration}</span>}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <a
                          href={content.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </a>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedContent(content);
                            setShowContentDeleteDialog(true);
                          }}
                          className="text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Bugs Tab */}
        {activeTab === 'bugs' && (
          <>
            {bugs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Card className="cu-card">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bug className="w-10 h-10 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Bug Reports
                    </h3>
                    <p className="text-gray-600">
                      All caught up! No bugs have been reported.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                  {bugs.map((bug, index) => (
                    <motion.div
                      key={bug.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (index * 0.05) }}
                    >
                      <Card className="cu-card hover:shadow-xl transition-all duration-300 border border-gray-100">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base mb-2">
                                {bug.title}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={BUG_STATUS_CONFIG[bug.status]?.color}>
                                  {BUG_STATUS_CONFIG[bug.status]?.label}
                                </Badge>
                                <Badge className={BUG_PRIORITY_CONFIG[bug.priority]?.color}>
                                  {BUG_PRIORITY_CONFIG[bug.priority]?.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4 pt-3">
                          <div>
                            <p className="text-sm text-gray-600 line-clamp-3">{bug.description}</p>
                          </div>

                          <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
                            <p><strong>Reporter:</strong> {bug.reporter_name} ({bug.reporter_email})</p>
                            <p><strong>Reported:</strong> {formatDistanceToNow(new Date(bug.created_date))} ago</p>
                            {bug.page_url && (
                              <p className="truncate"><strong>Page:</strong> {bug.page_url}</p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBug(bug);
                                setAdminNotes(bug.admin_notes || '');
                                setBugStatus(bug.status);
                                setBugPriority(bug.priority);
                                setShowDetailsModal(true);
                              }}
                              className="flex-1 text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedBug(bug);
                                setShowDeleteBugDialog(true);
                              }}
                              className="text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* Approval Dialog - Ads */}
        {selectedAd && activeTab === 'ads' && (
          <ConfirmationDialog
            isOpen={showApprovalDialog}
            onOpenChange={setShowApprovalDialog}
            title="Approve Advertisement"
            description={`Are you sure you want to approve "${selectedAd.title}"? This advertisement will immediately go live on the platform.`}
            confirmText="Approve"
            cancelText="Cancel"
            onConfirm={() => handleApproveAd(selectedAd)}
            isDestructive={false}
            isLoading={isProcessing}
          />
        )}

        {/* Rejection Dialog - Ads */}
        {selectedAd && activeTab === 'ads' && (
          <ConfirmationDialog
            isOpen={showRejectionDialog}
            onOpenChange={setShowRejectionDialog}
            title="Reject Advertisement"
            description={
              <div className="space-y-4">
                <p>Please provide a reason for rejecting this advertisement. The advertiser will receive this feedback.</p>
                <Textarea
                  placeholder="Enter rejection reason (required)..."
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            }
            confirmText="Reject Advertisement"
            cancelText="Cancel"
            onConfirm={() => handleRejectAd(selectedAd)}
            isDestructive={true}
            isLoading={isProcessing}
          />
        )}



        {/* Bug Details Modal */}
        {selectedBug && activeTab === 'bugs' && (
          <ConfirmationDialog
            isOpen={showDetailsModal}
            onOpenChange={setShowDetailsModal}
            title={`Bug Report - ${selectedBug.title}`}
            description={
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <p className="font-medium text-gray-700 mb-1">Description</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedBug.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Status</p>
                    <select
                      value={bugStatus}
                      onChange={(e) => setBugStatus(e.target.value)}
                      className="w-full border rounded-md px-2 py-1 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="wont_fix">Won't Fix</option>
                    </select>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Priority</p>
                    <select
                      value={bugPriority}
                      onChange={(e) => setBugPriority(e.target.value)}
                      className="w-full border rounded-md px-2 py-1 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-1">Reporter</p>
                  <p className="text-sm text-gray-600">{selectedBug.reporter_name} ({selectedBug.reporter_email})</p>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-1">Reported</p>
                  <p className="text-sm text-gray-600">{formatDistanceToNow(new Date(selectedBug.created_date))} ago</p>
                </div>

                {selectedBug.page_url && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Page URL</p>
                    <a
                      href={selectedBug.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:underline break-all flex items-center gap-1"
                    >
                      {selectedBug.page_url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {selectedBug.browser_info && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Browser Info</p>
                    <p className="text-xs text-gray-600 font-mono break-all">{selectedBug.browser_info}</p>
                  </div>
                )}

                <div>
                  <p className="font-medium text-gray-700 mb-2">Admin Notes</p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this bug..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <Button
                  onClick={() => handleUpdateBug(selectedBug, {
                    status: bugStatus,
                    priority: bugPriority,
                    admin_notes: adminNotes
                  })}
                  disabled={isProcessing}
                  className="w-full cu-button"
                >
                  {isProcessing ? "Updating..." : "Update Bug"}
                </Button>
              </div>
            }
            confirmText="Close"
            onConfirm={() => setShowDetailsModal(false)}
            isDestructive={false}
          />
        )}

        {/* Delete Bug Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteBugDialog}
          onOpenChange={setShowDeleteBugDialog}
          title="Delete Bug Report"
          description="Are you sure you want to delete this bug report? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteBug}
          isDestructive={true}
          isLoading={isProcessing}
        />

        {/* Delete Content Dialog */}
        <ConfirmationDialog
          isOpen={showContentDeleteDialog}
          onOpenChange={setShowContentDeleteDialog}
          title="Delete Playground Content"
          description="Are you sure you want to delete this content? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteContent}
          isDestructive={true}
          isLoading={isProcessing}
        />

        {/* Details Modal - Ad */}
        {selectedAd && activeTab === 'ads' && (
          <ConfirmationDialog
            isOpen={showDetailsModal}
            onOpenChange={setShowDetailsModal}
            title={`Advertisement Details - ${selectedAd.title}`}
            description={
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedAd.image_url && (
                  <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100">
                    <img src={selectedAd.image_url} alt={selectedAd.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-500 mb-1">Advertiser</p>
                    <p className="text-gray-900">{selectedAd.advertiser_name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500 mb-1">Type</p>
                    <Badge className={AD_TYPE_CONFIG[selectedAd.type]?.color || 'bg-gray-100'}>
                      {AD_TYPE_CONFIG[selectedAd.type]?.label || selectedAd.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500 mb-1">CTA Text</p>
                    <p className="text-gray-900">{selectedAd.cta_text}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500 mb-1">CTA Link</p>
                    <a
                      href={selectedAd.cta_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline flex items-center gap-1 text-xs"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-gray-500 mb-1">Description</p>
                    <p className="text-gray-900">{selectedAd.description}</p>
                  </div>
                  {selectedAd.target_categories?.length > 0 && (
                    <div className="col-span-2">
                      <p className="font-medium text-gray-500 mb-1">Target Categories</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedAd.target_categories.map((cat, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedAd.target_keywords?.length > 0 && (
                    <div className="col-span-2">
                      <p className="font-medium text-gray-500 mb-1">Target Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedAd.target_keywords.map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-purple-50">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            }
            confirmText="Close"
            onConfirm={() => setShowDetailsModal(false)}
            isDestructive={false}
          />
        )}
      </div>
    </div>
  );
}