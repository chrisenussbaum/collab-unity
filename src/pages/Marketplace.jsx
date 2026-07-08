import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Home } from "lucide-react";
import { Briefcase, HandHeart, Loader2, Plus, Search, X, LayoutList, Inbox, SlidersHorizontal, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ListingCard from "@/components/marketplace/ListingCard";
import CreateListingDialog from "@/components/marketplace/CreateListingDialog";
import ListingDetailDialog from "@/components/marketplace/ListingDetailDialog";
import MyListingsPanel from "@/components/marketplace/MyListingsPanel";
import ApplicationsPanel from "@/components/marketplace/ApplicationsPanel";
import CategoryShowcase from "@/components/marketplace/CategoryShowcase";
import PopularServices from "@/components/marketplace/PopularServices";

const CATEGORIES = [
  "Design", "Development", "Marketing", "Writing & Content",
  "Video & Photo", "Music & Audio", "Business",
  "Career Development", "Resume Review", "Coaching & Mentoring", "Other"
];

export default function Marketplace({ currentUser }) {
  const [activeTab, setActiveTab] = useState("gigs");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [compensationFilter, setCompensationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchListings = useCallback(async () => {
    const listingType = activeTab === "gigs" ? "gig" : "service";
    setIsLoading(true);
    try {
      const results = await base44.entities.MarketplaceListing.filter(
        { listing_type: listingType, status: "open" },
        "-created_date",
        50
      );
      setListings(results);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "my_listings" && activeTab !== "applications") {
      fetchListings();
    }
  }, [fetchListings, activeTab, refreshKey]);

  const filteredListings = listings.filter((listing) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      listing.title?.toLowerCase().includes(q) ||
      listing.description?.toLowerCase().includes(q) ||
      listing.skills_needed?.some(s => s.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === "all" || listing.category === selectedCategory;
    const matchesComp = compensationFilter === "all" || listing.compensation_type === compensationFilter;
    return matchesSearch && matchesCategory && matchesComp;
  }).sort((a, b) => {
    if (sortBy === "popular") return (b.application_count || 0) - (a.application_count || 0);
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setCompensationFilter("all");
  };

  const hasActiveFilters = search || selectedCategory !== "all" || compensationFilter !== "all";

  const handleListingCreated = () => {
    setShowCreateDialog(false);
    if (activeTab === "my_listings") {
      setRefreshKey(k => k + 1);
    } else {
      fetchListings();
    }
  };

  const handleListingUpdated = () => {
    if (activeTab === "my_listings") {
      setRefreshKey(k => k + 1);
    } else {
      fetchListings();
    }
  };

  const tabs = [
    { id: "gigs", label: "Gigs", icon: Briefcase },
    { id: "services", label: "Services", icon: HandHeart },
    { id: "my_listings", label: "My Listings", icon: LayoutList },
    { id: "applications", label: "Applications", icon: Inbox },
  ];

  const defaultListingType = activeTab === "services" ? "service" : "gig";

  const showBrowseContent = activeTab === "gigs" || activeTab === "services";

  return (
    <div className="cu-container cu-page">
      {/* Hero header */}
      <div className="mb-5 sm:mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Marketplace</h1>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg">
              Find gigs, offer services, get resume reviews, and build your career — all in one place.
            </p>
          </div>
          {currentUser && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === "services" ? "List a Service" : "Post a Gig"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); handleClearFilters(); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                isActive
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "my_listings" ? (
        <MyListingsPanel
          currentUser={currentUser}
          onSelectListing={setSelectedListing}
          onRefreshKey={refreshKey}
        />
      ) : activeTab === "applications" ? (
        <ApplicationsPanel
          currentUser={currentUser}
          onSelectListing={setSelectedListing}
        />
      ) : (
        <>
          {/* Category showcase + Popular services (only when no active filters) */}
          {!hasActiveFilters && (
            <>
              <CategoryShowcase
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
              {activeTab === "services" && (
                <PopularServices onSelectService={(s) => setSelectedCategory(s.category)} />
              )}
            </>
          )}

          {/* Breadcrumb */}
          {selectedCategory !== "all" && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
              <Home className="w-3 h-3" />
              <span>Marketplace</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-700 font-medium">{selectedCategory}</span>
              <button
                onClick={() => setSelectedCategory("all")}
                className="ml-1 text-purple-600 hover:text-purple-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Search + Filters bar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="pl-10 h-11 text-base bg-white border-gray-200 rounded-xl shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-[160px] h-11 bg-white border border-gray-200 rounded-xl shadow-sm pl-3 pr-8 text-sm font-medium text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative hidden sm:block">
                <select
                  value={compensationFilter}
                  onChange={(e) => setCompensationFilter(e.target.value)}
                  className="w-[130px] h-11 bg-white border border-gray-200 rounded-xl shadow-sm pl-3 pr-8 text-sm font-medium text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Pay Types</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="negotiable">Negotiable</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Results count + sort */}
          {!isLoading && filteredListings.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">
                {filteredListings.length} result{filteredListings.length !== 1 ? "s" : ""}
                {hasActiveFilters && (
                  <button onClick={handleClearFilters} className="ml-2 text-purple-600 hover:text-purple-700 font-medium">
                    Clear filters
                  </button>
                )}
              </span>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-medium text-gray-600 bg-transparent border-0 cursor-pointer focus:outline-none"
                >
                  <option value="newest">Newest first</option>
                  <option value="popular">Most popular</option>
                </select>
              </div>
            </div>
          )}

          {/* Listings grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading {activeTab}...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">
                {hasActiveFilters ? "No matches found" : `No ${activeTab} yet`}
              </h3>
              <p className="text-sm text-gray-500 mb-4 max-w-sm">
                {hasActiveFilters
                  ? "Try adjusting your filters or search terms."
                  : `Be the first to post a ${activeTab === "gigs" ? "gig" : "service"} on the marketplace.`}
              </p>
              {hasActiveFilters ? (
                <Button onClick={handleClearFilters} variant="outline" className="border-purple-200 text-purple-600">
                  Clear filters
                </Button>
              ) : currentUser ? (
                <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Post {activeTab === "gigs" ? "a Gig" : "a Service"}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredListings.map((listing, idx) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  currentUser={currentUser}
                  onClick={setSelectedListing}
                  index={idx}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Listing Dialog */}
      {showCreateDialog && currentUser && (
        <CreateListingDialog
          currentUser={currentUser}
          defaultType={defaultListingType}
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleListingCreated}
        />
      )}

      {/* Listing Detail Dialog */}
      {selectedListing && (
        <ListingDetailDialog
          listing={selectedListing}
          currentUser={currentUser}
          onClose={() => setSelectedListing(null)}
          onListingUpdated={handleListingUpdated}
        />
      )}
    </div>
  );
}