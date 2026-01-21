import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, ShoppingCart, Search, Tag, Users, Clock, Eye, Lightbulb, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { formatDistanceToNow } from "date-fns";

export default function Marketplace({ currentUser }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sellers, setSellers] = useState({});

  useEffect(() => {
    const loadMarketplace = async () => {
      setIsLoading(true);
      try {
        // For now, we'll fetch projects that users want to sell
        // Later this will be replaced with a dedicated MarketplaceListing entity
        const allProjects = await base44.entities.Project.filter({
          is_visible_on_feed: true
        }, "-created_date");

        setListings(allProjects);

        // Fetch seller profiles
        const sellerEmails = [...new Set(allProjects.map(p => p.created_by))];
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
              Buy and sell projects from talented creators in the Collab Unity community
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
                placeholder="Search marketplace by project name, category, or seller..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Coming Soon Notice */}
          <Card className="cu-card mb-8 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-20 h-20 cu-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Marketplace Coming Soon!
              </h2>
              <p className="text-gray-700 mb-4 max-w-2xl mx-auto">
                Soon you'll be able to buy and sell projects with integrated Stripe payments. 
                Users will set prices, handle transactions, manage payouts, and track order history all in one place.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-purple-600" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center">
                  <ShoppingCart className="w-4 h-4 mr-2 text-purple-600" />
                  <span>Order Tracking</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-600" />
                  <span>Seller Payouts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview: Projects Grid */}
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
                          <div className="flex items-start space-x-3">
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
                        </CardHeader>

                        <CardContent className="flex-grow pb-3">
                          <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed mb-3">
                            {listing.description}
                          </p>

                          {listing.area_of_interest && (
                            <Badge className="text-xs bg-purple-100 text-purple-700 mb-2">
                              <Tag className="w-3 h-3 mr-1" />
                              {listing.area_of_interest}
                            </Badge>
                          )}

                          {listing.skills_needed && listing.skills_needed.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
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

                        <CardFooter className="bg-gray-50 border-t p-4">
                          <div className="w-full flex items-center justify-between">
                            <div className="flex items-center text-gray-600 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDistanceToNow(new Date(listing.created_date))} ago
                            </div>
                            <Button size="sm" className="cu-button text-xs" onClick={(e) => e.preventDefault()}>
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* CTA for sellers */}
          {!isLoading && (
            <Card className="cu-card mt-12 border-2 border-dashed border-purple-300 bg-purple-50/30">
              <CardContent className="p-8 text-center">
                <Lightbulb className="w-12 h-12 mx-auto text-purple-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Want to sell your project?
                </h3>
                <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                  The marketplace feature is coming soon. You'll be able to list your projects for sale, set prices, and receive payments directly.
                </p>
                <Link to={createPageUrl("CreateProject")}>
                  <Button className="cu-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Create a Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}