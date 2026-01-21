import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, ShoppingCart, Search, Tag, Users, Clock, Eye, Lightbulb, 
  MessageCircle, ExternalLink, Camera, Play, Globe, Calendar, X
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import BookingDialog from "@/components/BookingDialog";
import MediaDisplay from "@/components/MediaDisplay";

export default function Marketplace({ currentUser }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sellers, setSellers] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  useEffect(() => {
    const loadMarketplace = async () => {
      setIsLoading(true);
      try {
        // Fetch projects that are for sale
        const forSaleProjects = await base44.entities.Project.filter({
          is_for_sale: true,
          is_visible_on_feed: true
        }, "-created_date");

        setListings(forSaleProjects);

        // Fetch seller profiles
        const sellerEmails = [...new Set(forSaleProjects.map(p => p.created_by))];
        if (sellerEmails.length > 0) {
          const { data: profiles } = await getPublicUserProfiles({ emails: sellerEmails });
          const profilesMap = {};
          (profiles || []).forEach(profile => {
            profilesMap[profile.email] = profile;
          });
          setSellers(profilesMap);
        }
      } catch (error) {
        console.error("Error loading marketplace:", error);
        toast.error("Failed to load marketplace items");
      } finally {
        setIsLoading(false);
      }
    };

    loadMarketplace();
  }, []);

  const handleStartChat = async (project) => {
    if (!currentUser) {
      toast.error("Please sign in to chat with sellers");
      return;
    }

    try {
      const existingConv1 = await base44.entities.Conversation.filter({
        conversation_type: "direct",
        participant_1_email: currentUser.email,
        participant_2_email: project.created_by
      });

      const existingConv2 = await base44.entities.Conversation.filter({
        conversation_type: "direct",
        participant_1_email: project.created_by,
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
          participant_2_email: project.created_by,
          last_message: "",
          last_message_time: new Date().toISOString(),
          participant_1_unread_count: 0,
          participant_2_unread_count: 0
        });
      }

      navigate(createPageUrl(`Chat?conversation=${conversation.id}`));
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start chat");
    }
  };

  const handleSubmitPurchase = async () => {
    if (!purchaseMessage.trim()) {
      toast.error("Please add a message about your purchase inquiry");
      return;
    }

    if (!currentUser) {
      toast.error("Please sign in to purchase projects");
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      await base44.entities.ProjectPurchase.create({
        project_id: selectedProject.id,
        seller_email: selectedProject.created_by,
        seller_name: sellers[selectedProject.created_by]?.full_name || selectedProject.created_by,
        buyer_email: currentUser.email,
        buyer_name: currentUser.full_name || currentUser.email,
        project_title: selectedProject.title,
        purchase_price: selectedProject.sale_price,
        buyer_message: purchaseMessage.trim(),
        status: "pending"
      });

      // Notify seller
      await base44.entities.Notification.create({
        user_email: selectedProject.created_by,
        title: `Purchase inquiry for "${selectedProject.title}"`,
        message: `${currentUser.full_name || currentUser.email} wants to purchase your project for $${selectedProject.sale_price}`,
        type: "general",
        related_project_id: selectedProject.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        metadata: {
          purchase_inquiry: true,
          price: selectedProject.sale_price
        }
      });

      toast.success("Purchase inquiry sent! The seller will respond soon.");
      setShowPurchaseDialog(false);
      setShowDetailsDialog(false);
      setPurchaseMessage("");
      setSelectedProject(null);
    } catch (error) {
      console.error("Error submitting purchase:", error);
      toast.error("Failed to submit purchase inquiry");
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (!searchQuery.trim()) return true;
    
    const seller = sellers[listing.created_by];
    return (
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.sale_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.area_of_interest?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const isOwner = (project) => {
    return currentUser && project.created_by === currentUser.email;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white py-16 sm:py-20 md:py-24 -mt-14 pt-28 sm:-mt-16 sm:pt-32 md:-mt-20 md:pt-36">
        <div className="cu-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 cu-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Project <span className="text-yellow-400">Marketplace</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-purple-100 mb-8 max-w-3xl mx-auto px-4">
              Discover and purchase unique projects from talented creators
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="cu-container">
        <div className="cu-page">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by project name, category, or seller..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading marketplace...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No projects for sale
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? "Try a different search term" : "Check back later for exciting projects to purchase!"}
              </p>
              {currentUser && (
                <Link to={createPageUrl("MyProjects")}>
                  <Button className="cu-button">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Sell Your Project
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing, index) => {
                const seller = sellers[listing.created_by];
                
                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="cu-card h-full flex flex-col hover:shadow-xl transition-all border-t-4 border-purple-500 cursor-pointer"
                      onClick={() => {
                        setSelectedProject(listing);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            {listing.logo_url && (
                              <img 
                                src={listing.logo_url} 
                                alt={listing.title}
                                className="w-12 h-12 rounded-lg object-cover border-2 border-gray-100 shadow-sm flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base text-gray-900 hover:text-purple-600 transition-colors line-clamp-2 mb-1">
                                {listing.title}
                              </h3>
                              {seller && (
                                <div className="flex items-center gap-2 mt-1">
                                  <OptimizedAvatar
                                    src={seller.profile_image}
                                    alt={seller.full_name}
                                    fallback={seller.full_name?.[0] || 'U'}
                                    size="xs"
                                    className="w-5 h-5"
                                  />
                                  <span className="text-xs text-gray-600 hover:text-purple-600">
                                    {seller.full_name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border border-green-300 font-semibold flex-shrink-0">
                            ${listing.sale_price}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-grow pb-3 space-y-3">
                        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                          {listing.sale_description || listing.description}
                        </p>

                        {listing.area_of_interest && (
                          <Badge className="text-xs bg-purple-100 text-purple-700">
                            <Tag className="w-3 h-3 mr-1" />
                            {listing.area_of_interest}
                          </Badge>
                        )}

                        {listing.skills_needed && listing.skills_needed.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {listing.skills_needed.slice(0, 3).map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {listing.skills_needed.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{listing.skills_needed.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="bg-gradient-to-r from-gray-50 to-purple-50/30 border-t border-purple-100/50 p-4">
                        <div className="w-full flex items-center justify-between">
                          <div className="flex items-center text-gray-600 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDistanceToNow(new Date(listing.created_date))} ago
                          </div>
                          <Button 
                            size="sm" 
                            className="cu-button text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(listing);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Project Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {selectedProject.logo_url && (
                      <img 
                        src={selectedProject.logo_url} 
                        alt={selectedProject.title}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-100 shadow-sm flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-2xl mb-2">{selectedProject.title}</DialogTitle>
                      {sellers[selectedProject.created_by] && (
                        <Link
                          to={createPageUrl(`UserProfile?username=${sellers[selectedProject.created_by].username}`)}
                          className="flex items-center gap-2 hover:opacity-80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <OptimizedAvatar
                            src={sellers[selectedProject.created_by].profile_image}
                            alt={sellers[selectedProject.created_by].full_name}
                            fallback={sellers[selectedProject.created_by].full_name?.[0] || 'U'}
                            size="xs"
                            className="w-6 h-6"
                          />
                          <span className="text-sm text-gray-600 hover:text-purple-600">
                            {sellers[selectedProject.created_by].full_name}
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border border-green-300 font-bold text-lg px-4 py-2">
                    ${selectedProject.sale_price}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">About This Project</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedProject.sale_description || selectedProject.description}
                  </p>
                </div>

                {/* Project Highlights */}
                {selectedProject.highlights && selectedProject.highlights.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Project Highlights</h4>
                    </div>
                    <MediaDisplay media={selectedProject.highlights} maxDisplay={6} />
                  </div>
                )}

                {/* Skills & Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedProject.area_of_interest && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Category</h5>
                      <Badge className="bg-purple-100 text-purple-700">
                        {selectedProject.area_of_interest}
                      </Badge>
                    </div>
                  )}

                  {selectedProject.industry && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Industry</h5>
                      <p className="text-gray-900">{selectedProject.industry}</p>
                    </div>
                  )}

                  {selectedProject.classification && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Type</h5>
                      <p className="text-gray-900 capitalize">{selectedProject.classification.replace(/_/g, ' ')}</p>
                    </div>
                  )}

                  {selectedProject.status && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Status</h5>
                      <p className="text-gray-900 capitalize">{selectedProject.status.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                </div>

                {selectedProject.skills_needed && selectedProject.skills_needed.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 mb-2">Skills Included</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.skills_needed.map(skill => (
                        <Badge key={skill} className="bg-purple-100 text-purple-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project Links */}
                {selectedProject.project_urls && selectedProject.project_urls.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Live Demo & Links</h4>
                    </div>
                    <div className="space-y-2">
                      {selectedProject.project_urls.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border hover:border-purple-300 hover:shadow-sm transition-all group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                              <Globe className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 truncate group-hover:text-purple-600">
                              {link.title || link.url}
                            </span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 flex-shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleStartChat(selectedProject)}
                    className="flex-1"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with Seller
                  </Button>

                  {!isOwner(selectedProject) && (
                    <Button
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowPurchaseDialog(true);
                      }}
                      className="flex-1 cu-button"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy Project
                    </Button>
                  )}

                  {isOwner(selectedProject) && (
                    <Link to={createPageUrl(`ProjectDetail?id=${selectedProject.id}`)} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Manage Listing
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Purchase "{selectedProject?.title}"</DialogTitle>
            <DialogDescription>
              Send a message to the seller to express your interest and discuss the purchase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Purchase Price</span>
                <span className="text-2xl font-bold text-green-600">
                  ${selectedProject?.sale_price}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                This inquiry will be sent to the seller. They will contact you to arrange payment and transfer.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Your Message *
              </label>
              <Textarea
                value={purchaseMessage}
                onChange={(e) => setPurchaseMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you're interested in this project..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPurchaseDialog(false);
                setPurchaseMessage("");
              }}
              disabled={isSubmittingPurchase}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPurchase}
              disabled={isSubmittingPurchase || !purchaseMessage.trim()}
              className="cu-button"
            >
              {isSubmittingPurchase ? "Sending..." : "Send Purchase Inquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      {selectedProject && (
        <BookingDialog
          isOpen={showBookingDialog}
          onClose={() => setShowBookingDialog(false)}
          service={{
            id: selectedProject.id,
            title: selectedProject.title,
            provider_email: selectedProject.created_by,
            session_duration_minutes: 60,
            weekly_availability: {},
            booking_enabled: false
          }}
          provider={sellers[selectedProject.created_by]}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}