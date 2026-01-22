import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, ShoppingCart, Search, Tag, Users, Clock, Calendar, MessageCircle, Lightbulb, Plus, Building2, Camera, Play } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { formatDistanceToNow } from "date-fns";
import ProjectBookingDialog from "@/components/marketplace/ProjectBookingDialog";
import SetPriceDialog from "@/components/marketplace/SetPriceDialog";
import ServiceListingCard from "@/components/ServiceListingCard";
import ClickableImage from "@/components/ClickableImage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Marketplace({ currentUser }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showSetPriceDialog, setShowSetPriceDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");

  // Use React Query for efficient data fetching with caching
  const { data: marketplaceData, isLoading, refetch } = useQuery({
    queryKey: ['marketplace-data', currentUser?.email, activeTab],
    queryFn: async () => {
      // Fetch marketplace listings (limit to 30)
      const allListings = await base44.entities.MarketplaceListing.filter({
        is_available: true
      }, "-created_date", 30);

      // Fetch the projects for these listings - PARALLEL fetch instead of loop
      const projectIds = allListings.map(l => l.project_id);
      const projectPromises = projectIds.map(projectId => 
        base44.entities.Project.filter({ id: projectId }).catch(err => {
          console.error("Error fetching project:", err);
          return [];
        })
      );
      
      const projectResults = await Promise.all(projectPromises);
      const allProjects = projectResults
        .filter(result => result.length > 0)
        .map(result => result[0]);

      // Fetch seller profiles
      const sellerEmails = [...new Set(allProjects.map(p => p.created_by))];
      let profilesMap = {};
      if (sellerEmails.length > 0) {
        const { data: profiles } = await getPublicUserProfiles({ emails: sellerEmails });
        (profiles || []).forEach(profile => {
          profilesMap[profile.email] = profile;
        });
      }

      // Fetch user's projects for "Sell" section
      let userProjects = [];
      if (currentUser) {
        userProjects = await base44.entities.Project.filter({
          created_by: currentUser.email
        }, "-created_date", 20);
      }

      // Fetch service listings (limit to 30)
      const allServiceListings = await base44.entities.ServiceListing.filter({}, "-created_date", 30);

      // Fetch service provider profiles
      const providerEmails = [...new Set(allServiceListings.map(l => l.provider_email))];
      let providersMap = {};
      if (providerEmails.length > 0) {
        const { data: providerProfiles } = await getPublicUserProfiles({ emails: providerEmails });
        (providerProfiles || []).forEach(profile => {
          providersMap[profile.email] = profile;
        });
      }

      return {
        listings: allProjects,
        marketplaceListings: allListings,
        sellers: profilesMap,
        myProjects: userProjects,
        serviceListings: allServiceListings,
        serviceProviders: providersMap
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const listings = marketplaceData?.listings || [];
  const marketplaceListings = marketplaceData?.marketplaceListings || [];
  const sellers = marketplaceData?.sellers || {};
  const myProjects = marketplaceData?.myProjects || [];
  const serviceListings = marketplaceData?.serviceListings || [];
  const serviceProviders = marketplaceData?.serviceProviders || {};

  const filteredListings = listings.filter(listing => {
    if (!searchQuery.trim()) return true;
    
    const seller = sellers[listing.created_by];
    return (
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.area_of_interest?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredServices = serviceListings.filter(listing => {
    if (!searchQuery.trim()) return true;
    
    const provider = serviceProviders[listing.provider_email];
    return (
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.skills_offered && listing.skills_offered.some(skill =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    );
  });

  const handleBookProject = (project, marketplaceListing, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast.error("Please sign in to book a project consultation");
      return;
    }
    
    setSelectedProject({ ...project, marketplaceListing });
    setShowBookingDialog(true);
  };

  const handleSetPrice = (project, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setSelectedProject(project);
    setShowSetPriceDialog(true);
  };

  const reloadMarketplace = () => {
    refetch();
  };

  const handleChatWithOwner = async (project, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast.error("Please sign in to start a conversation");
      return;
    }

    try {
      const ownerEmail = project.created_by;
      
      // Find or create conversation
      const [existingConv1, existingConv2] = await Promise.all([
        base44.entities.Conversation.filter({
          conversation_type: "direct",
          participant_1_email: currentUser.email,
          participant_2_email: ownerEmail
        }),
        base44.entities.Conversation.filter({
          conversation_type: "direct",
          participant_1_email: ownerEmail,
          participant_2_email: currentUser.email
        })
      ]);

      let conversation;
      if (existingConv1.length > 0) {
        conversation = existingConv1[0];
      } else if (existingConv2.length > 0) {
        conversation = existingConv2[0];
      } else {
        conversation = await base44.entities.Conversation.create({
          conversation_type: "direct",
          participant_1_email: currentUser.email,
          participant_2_email: ownerEmail,
          last_message: "",
          last_message_time: new Date().toISOString(),
          participant_1_unread_count: 0,
          participant_2_unread_count: 0
        });
      }

      navigate(createPageUrl(`Chat?conversation=${conversation.id}`));
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Project Booking Dialog */}
      {selectedProject && showBookingDialog && (
        <ProjectBookingDialog
          isOpen={showBookingDialog}
          onClose={() => {
            setShowBookingDialog(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          marketplaceListing={selectedProject.marketplaceListing}
          seller={sellers[selectedProject.created_by]}
          currentUser={currentUser}
        />
      )}

      {/* Set Price Dialog */}
      {selectedProject && showSetPriceDialog && (
        <SetPriceDialog
          isOpen={showSetPriceDialog}
          onClose={() => {
            setShowSetPriceDialog(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          existingListing={marketplaceListings.find(l => l.project_id === selectedProject.id)}
          onSuccess={reloadMarketplace}
        />
      )}

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 py-12 sm:py-16 md:py-20 -mt-14 pt-24 sm:-mt-16 sm:pt-28 md:-mt-20 md:pt-32">
        <div className="cu-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ShoppingCart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Project & Service <span className="text-green-600">Marketplace</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto px-4">
              Buy and sell projects and services from talented creators in the Collab Unity community
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="cu-container">
        <div className="cu-page">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="projects" className="text-sm sm:text-base">
                <Building2 className="w-4 h-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="services" className="text-sm sm:text-base">
                <DollarSign className="w-4 h-4 mr-2" />
                Services
              </TabsTrigger>
            </TabsList>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={activeTab === "projects" 
                    ? "Search projects by name, category, or seller..." 
                    : "Search services by title, skills, or provider..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-white shadow-sm"
                />
              </div>
            </div>

            <TabsContent value="projects">

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
                No items found
              </h3>
              <p className="text-gray-600">
                {searchQuery ? "Try a different search term" : "Check back later for exciting projects to purchase!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.slice(0, 12).map((listing, index) => {
                const seller = sellers[listing.created_by];
                const marketplaceListing = marketplaceListings.find(ml => ml.project_id === listing.id);
                const isOwner = currentUser && listing.created_by === currentUser.email;
                
                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={createPageUrl(`ProjectDetail?id=${listing.id}`)}>
                      <Card className="cu-card h-full flex flex-col hover:shadow-xl transition-all border-t-4 border-purple-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
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
                                    <span className="text-xs text-gray-600">
                                      {seller.full_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {marketplaceListing && (
                              <Badge className="bg-green-100 text-green-700 font-semibold">
                                ${marketplaceListing.price}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="flex-grow pb-3 space-y-3">
                         <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                           {listing.description}
                         </p>

                         <div className="flex flex-wrap gap-2">
                           {marketplaceListing && (
                             <Badge variant="outline" className="text-xs">
                               {marketplaceListing.price_type === "consultation" 
                                 ? `Consultation - ${marketplaceListing.consultation_duration_minutes} min`
                                 : "Fixed Price"}
                             </Badge>
                           )}

                           {listing.area_of_interest && (
                             <Badge className="text-xs bg-purple-100 text-purple-700">
                               <Tag className="w-3 h-3 mr-1" />
                               {listing.area_of_interest}
                             </Badge>
                           )}
                         </div>

                         {listing.skills_needed && listing.skills_needed.length > 0 && (
                           <div className="flex flex-wrap gap-2">
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

                         {listing.highlights && listing.highlights.length > 0 && (
                           <div className="pt-3 border-t">
                             <div className="flex items-center gap-2 mb-2">
                               <Camera className="w-4 h-4 text-purple-600" />
                               <span className="text-xs font-medium text-gray-700">Project Highlights</span>
                             </div>
                             <div className="grid grid-cols-3 gap-2">
                               {listing.highlights.slice(0, 3).map((highlight, idx) => {
                                 const mediaUrl = highlight.media_url || highlight.image_url;
                                 const mediaType = highlight.media_type || 'image';

                                 return (
                                   <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100" onClick={(e) => e.preventDefault()}>
                                     {mediaType === 'video' ? (
                                       <div className="relative w-full h-full">
                                         {highlight.thumbnail_url ? (
                                           <img 
                                             src={highlight.thumbnail_url} 
                                             alt={highlight.caption || 'Video thumbnail'}
                                             className="w-full h-full object-cover"
                                           />
                                         ) : (
                                           <video 
                                             src={mediaUrl}
                                             className="w-full h-full object-cover"
                                           />
                                         )}
                                         <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                           <Play className="w-6 h-6 text-white" />
                                         </div>
                                       </div>
                                     ) : (
                                       <ClickableImage
                                         src={mediaUrl} 
                                         alt={highlight.caption || 'Project highlight'}
                                         caption={highlight.caption}
                                         className="w-full h-full object-cover hover:scale-105 transition-transform"
                                       />
                                     )}
                                   </div>
                                 );
                               })}
                             </div>
                           </div>
                         )}
                        </CardContent>

                        <CardFooter className="bg-gray-50 border-t p-4">
                          <div className="w-full flex gap-2">
                            {currentUser && !isOwner && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="cu-button flex-1 text-xs"
                                  onClick={(e) => handleBookProject(listing, marketplaceListing, e)}
                                >
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Book
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex-1 text-xs"
                                  onClick={(e) => handleChatWithOwner(listing, e)}
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Chat
                                </Button>
                              </>
                            )}
                            {(!currentUser || isOwner) && (
                              <div className="flex items-center text-gray-600 text-xs justify-center w-full py-2">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(new Date(listing.created_date))} ago
                              </div>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
            </TabsContent>

            <TabsContent value="services">
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading services...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-16">
                  <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No services found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery ? "Try a different search term" : "Be the first to offer your services!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((listing, index) => (
                    <ServiceListingCard
                      key={listing.id}
                      listing={listing}
                      provider={serviceProviders[listing.provider_email]}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Sell Your Projects Section */}
          {currentUser && myProjects.length > 0 && !isLoading && activeTab === "projects" && (
            <Card className="cu-card mt-12 border-2 border-purple-300 bg-purple-50">
              <CardHeader>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                  Sell Your Projects
                </h3>
                <p className="text-sm text-gray-600">
                  List your projects on the marketplace and set consultation fees or fixed prices
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myProjects.map((project) => {
                    const listing = marketplaceListings.find(l => l.project_id === project.id);
                    const isListed = !!listing;

                    return (
                      <Card key={project.id} className={`border-2 ${isListed ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-2">
                            {project.logo_url && (
                              <img 
                                src={project.logo_url} 
                                alt={project.title}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm line-clamp-2">
                                {project.title}
                              </h4>
                              {isListed && (
                                <Badge className="mt-1 bg-green-100 text-green-700 text-xs">
                                  Listed - ${listing.price}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button
                            size="sm"
                            variant={isListed ? "outline" : "default"}
                            className={`w-full text-xs ${!isListed ? 'cu-button' : ''}`}
                            onClick={(e) => handleSetPrice(project, e)}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            {isListed ? "Update Price" : "Set Price"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}