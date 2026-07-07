import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, HandHeart, Users, MoreVertical, Trash2, Ban, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ListingCard from "./ListingCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MyListingsPanel({ currentUser, onSelectListing, onRefreshKey }) {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    if (!currentUser?.email) return;
    setIsLoading(true);
    try {
      const results = await base44.entities.MarketplaceListing.filter(
        { posted_by_email: currentUser.email },
        "-created_date",
        50
      );
      setListings(results);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings, onRefreshKey]);

  const handleStatusChange = async (listingId, newStatus) => {
    try {
      await base44.entities.MarketplaceListing.update(listingId, { status: newStatus });
      setListings(listings.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
      toast.success(newStatus === "open" ? "Listing reopened" : newStatus === "closed" ? "Listing closed" : "Listing marked as filled");
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error("Failed to update listing");
    }
  };

  const handleDelete = async (listingId) => {
    try {
      await base44.entities.MarketplaceListing.delete(listingId);
      setListings(listings.filter(l => l.id !== listingId));
      toast.success("Listing deleted");
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading your listings...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Briefcase className="w-12 h-12 text-gray-300 mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">No listings yet</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Post a gig or list a service to start receiving applications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <div key={listing.id} className="relative">
          <ListingCard listing={listing} onClick={onSelectListing} />
          <div className="absolute top-3 right-3 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {listing.status !== "open" && (
                  <DropdownMenuItem onClick={() => handleStatusChange(listing.id, "open")}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Reopen
                  </DropdownMenuItem>
                )}
                {listing.status === "open" && (
                  <DropdownMenuItem onClick={() => handleStatusChange(listing.id, "filled")}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Filled
                  </DropdownMenuItem>
                )}
                {listing.status !== "closed" && (
                  <DropdownMenuItem onClick={() => handleStatusChange(listing.id, "closed")}>
                    <Ban className="w-4 h-4 mr-2" /> Close
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDelete(listing.id)} className="text-red-600 focus:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {listing.application_count > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-amber-100 border border-amber-200 text-amber-700 text-xs">
                <Users className="w-3 h-3 mr-1" /> {listing.application_count} application{listing.application_count !== 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}