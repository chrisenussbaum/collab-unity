import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Inbox, Briefcase, HandHeart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ApplicantCard from "./ApplicantCard";

export default function ApplicationsPanel({ currentUser, onSelectListing }) {
  const [listings, setListings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | pending | accepted | rejected
  const [listingFilter, setListingFilter] = useState("all"); // all | listingId
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if (!currentUser?.email) return;
    setIsLoading(true);
    try {
      const userListings = await base44.entities.MarketplaceListing.filter(
        { posted_by_email: currentUser.email },
        "-created_date",
        50
      );
      setListings(userListings);

      if (userListings.length > 0) {
        const listingIds = userListings.map(l => l.id);
        const allApps = [];
        for (const listingId of listingIds) {
          const apps = await base44.entities.MarketplaceApplication.filter(
            { listing_id: listingId },
            "-created_date",
            50
          );
          allApps.push(...apps);
        }
        allApps.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setApplications(allApps);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const app = applications.find(a => a.id === appId);
      await base44.entities.MarketplaceApplication.update(appId, { status: newStatus });

      if (app) {
        if (newStatus === "accepted") {
          await base44.entities.Notification.create({
            user_email: app.applicant_email,
            title: `Application accepted for "${app.listing_title}"`,
            message: `${currentUser.full_name} accepted your application.`,
            type: "collaboration_request",
            related_entity_id: app.listing_id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name,
          });
        } else if (newStatus === "rejected") {
          await base44.entities.Notification.create({
            user_email: app.applicant_email,
            title: `Application update for "${app.listing_title}"`,
            message: `${currentUser.full_name} declined your application.`,
            type: "general",
            related_entity_id: app.listing_id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name,
          });
        }
      }

      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      toast.success(newStatus === "accepted" ? "Application accepted" : "Application declined");
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application status");
    }
  };

  const handleStartChat = async (otherEmail) => {
    try {
      const existing1 = await base44.entities.Conversation.filter({
        participant_1_email: currentUser.email,
        participant_2_email: otherEmail,
      });
      const existing2 = await base44.entities.Conversation.filter({
        participant_1_email: otherEmail,
        participant_2_email: currentUser.email,
      });
      let conversation;
      if (existing1.length > 0) {
        conversation = existing1[0];
      } else if (existing2.length > 0) {
        conversation = existing2[0];
      } else {
        conversation = await base44.entities.Conversation.create({
          participant_1_email: currentUser.email,
          participant_2_email: otherEmail,
          last_message: "",
          last_message_time: new Date().toISOString(),
          participant_1_unread_count: 0,
          participant_2_unread_count: 0,
        });
      }
      navigate(`${createPageUrl("Chat")}?conversation=${conversation.id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start conversation");
    }
  };

  const pendingCount = applications.filter(a => a.status === "pending").length;
  const acceptedCount = applications.filter(a => a.status === "accepted").length;
  const rejectedCount = applications.filter(a => a.status === "rejected").length;

  const filteredApps = applications.filter(app => {
    const matchesStatus = filter === "all" || app.status === filter;
    const matchesListing = listingFilter === "all" || app.listing_id === listingFilter;
    return matchesStatus && matchesListing;
  });

  const listingMap = Object.fromEntries(listings.map(l => [l.id, l]));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading applications...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Inbox className="w-12 h-12 text-gray-300 mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">No listings yet</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Post a gig or service first — applications from interested users will appear here for you to review.
        </p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Users className="w-7 h-7 text-gray-300" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">No applications yet</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          When someone applies to one of your gigs or services, their application will show up here.
        </p>
      </div>
    );
  }

  const filterTabs = [
    { key: "all", label: "All", count: applications.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "accepted", label: "Accepted", count: acceptedCount },
    { key: "rejected", label: "Declined", count: rejectedCount },
  ];

  return (
    <div>
      {/* Header summary */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Applications Received
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Review and manage all applications across your marketplace listings.
        </p>
      </div>

      {/* Listing filter dropdown */}
      {listings.length > 1 && (
        <div className="mb-4">
          <div className="relative inline-block w-full sm:w-auto">
            <select
              value={listingFilter}
              onChange={(e) => setListingFilter(e.target.value)}
              className="w-full sm:w-[280px] h-10 bg-white border border-gray-200 rounded-lg pl-3 pr-8 text-sm font-medium text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Listings</option>
              {listings.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-200 overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
              filter === tab.key
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === tab.key
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Applications list */}
      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            No {filter !== "all" ? filter : ""} applications{listingFilter !== "all" ? " for this listing" : ""}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const listing = listingMap[app.listing_id];
            const isGig = (listing?.listing_type || app.listing_type) === "gig";
            return (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
                {/* Listing context bar */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                  <Badge className={`text-xs ${isGig ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
                    {isGig ? <Briefcase className="w-3 h-3 mr-1" /> : <HandHeart className="w-3 h-3 mr-1" />}
                    {isGig ? "Gig" : "Service"}
                  </Badge>
                  <button
                    onClick={() => listing && onSelectListing?.(listing)}
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 truncate"
                  >
                    {app.listing_title || listing?.title}
                  </button>
                </div>
                <ApplicantCard
                  app={app}
                  onAccept={(id) => handleUpdateStatus(id, "accepted")}
                  onDecline={(id) => handleUpdateStatus(id, "rejected")}
                  onMessage={(email) => handleStartChat(email)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}