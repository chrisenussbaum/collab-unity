import React, { useState, useEffect, useCallback } from "react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Loader2, SlidersHorizontal, X } from "lucide-react";
import CollaboratorCard from "@/components/marketplace/CollaboratorCard";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";
import { marketplaceSearch } from "@/functions/marketplaceSearch";

export default function Marketplace({ currentUser }) {
  const [profiles, setProfiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [hasActiveProjects, setHasActiveProjects] = useState(false);

  const fetchProfiles = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const result = await marketplaceSearch({
        search,
        skills: selectedSkills,
        minRating,
        hasActiveProjects,
        excludeEmail: currentUser?.email || '',
        page: pageNum,
        limit: 24,
      });
      const data = result.data || result;
      if (append) {
        setProfiles((prev) => [...prev, ...(data.profiles || [])]);
      } else {
        setProfiles(data.profiles || []);
      }
      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
      setAvailableSkills(data.available_skills || []);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching marketplace profiles:", error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [search, selectedSkills, minRating, hasActiveProjects, currentUser]);

  // Debounced fetch on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfiles(1, false);
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchProfiles]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProfiles(page + 1, true);
    }
  };

  const handleClearAll = () => {
    setSelectedSkills([]);
    setMinRating(0);
    setHasActiveProjects(false);
    setSearch("");
  };

  const hasActiveFilters = selectedSkills.length > 0 || minRating > 0 || hasActiveProjects || search;

  return (
    <div className="cu-container cu-page">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Collaborator Marketplace</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-500">
          Find skilled professionals for your next project — browse by skills, ratings, and active projects.
        </p>
      </div>

      {/* Search bar (always visible) */}
      <div className="relative mb-4 sm:mb-6">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, skill, or bio..."
          className="pl-10 sm:pl-12 h-11 sm:h-12 text-base bg-white border-gray-200 rounded-xl shadow-sm"
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

      <div className="flex gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-20">
            <MarketplaceFilters
              search={search}
              setSearch={setSearch}
              selectedSkills={selectedSkills}
              setSelectedSkills={setSelectedSkills}
              minRating={minRating}
              setMinRating={setMinRating}
              hasActiveProjects={hasActiveProjects}
              setHasActiveProjects={setHasActiveProjects}
              availableSkills={availableSkills}
              onClearAll={handleClearAll}
              totalCount={total}
            />
          </div>
        </aside>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden fixed bottom-[83px] right-4 z-40">
          <Button
            onClick={() => setShowMobileFilters(true)}
            className="rounded-full shadow-lg h-12 w-12 p-0 bg-purple-600 hover:bg-purple-700"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {(selectedSkills.length > 0 ? 1 : 0) +
                  (minRating > 0 ? 1 : 0) +
                  (hasActiveProjects ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        {/* Mobile Filter Drawer */}
        {showMobileFilters && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-black/50" onClick={() => setShowMobileFilters(false)}>
            <div
              className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-50 overflow-y-auto p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-1">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <MarketplaceFilters
                search={search}
                setSearch={setSearch}
                selectedSkills={selectedSkills}
                setSelectedSkills={setSelectedSkills}
                minRating={minRating}
                setMinRating={setMinRating}
                hasActiveProjects={hasActiveProjects}
                setHasActiveProjects={setHasActiveProjects}
                availableSkills={availableSkills}
                onClearAll={handleClearAll}
                totalCount={total}
              />
              <Button
                onClick={() => setShowMobileFilters(false)}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Show {total} results
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Finding collaborators...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-12 h-12 text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">No collaborators found</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-sm">
                {hasActiveFilters
                  ? "Try adjusting your filters to see more results."
                  : "Be the first to appear in the marketplace by completing your profile."}
              </p>
              {hasActiveFilters && (
                <Button onClick={handleClearAll} variant="outline" className="border-purple-200 text-purple-600">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {profiles.map((user, idx) => (
                  <CollaboratorCard
                    key={user.id || user.email}
                    user={user}
                    currentUser={currentUser}
                    index={idx}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-6 sm:mt-8">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="border-purple-200 text-purple-600 hover:bg-purple-50 px-8"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}