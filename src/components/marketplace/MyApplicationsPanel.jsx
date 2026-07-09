import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, HandHeart, Clock, Video, Check, XCircle, Paperclip, FileText, ExternalLink, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";

const STATUS_META = {
  pending: { icon: Clock, className: "bg-amber-50 border-amber-200 text-amber-700", label: "Pending" },
  interviewing: { icon: Video, className: "bg-blue-50 border-blue-200 text-blue-700", label: "Interviewing" },
  accepted: { icon: Check, className: "bg-green-50 border-green-200 text-green-700", label: "Hired" },
  rejected: { icon: XCircle, className: "bg-gray-100 border-gray-200 text-gray-500", label: "Declined" },
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "interviewing", label: "Interviewing" },
  { key: "accepted", label: "Hired" },
  { key: "rejected", label: "Declined" },
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

export default function MyApplicationsPanel({ currentUser }) {
  const [applications, setApplications] = useState([]);
  const [listingsMap, setListingsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedApp, setExpandedApp] = useState(null);

  const fetchData = useCallback(async () => {
    if (!currentUser?.email) return;
    setIsLoading(true);
    try {
      const myApps = await base44.entities.MarketplaceApplication.filter(
        { applicant_email: currentUser.email },
        "-created_date",
        50
      );
      setApplications(myApps);

      // Fetch associated listings for context
      const listingIds = [...new Set(myApps.map(a => a.listing_id).filter(Boolean))];
      const map = {};
      for (const id of listingIds) {
        try {
          const listing = await base44.entities.MarketplaceListing.get(id);
          map[id] = listing;
        } catch (e) {
          // listing may have been deleted
        }
      }
      setListingsMap(map);
    } catch (error) {
      console.error("Error fetching my applications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWithdraw = async (appId) => {
    try {
      await base44.entities.MarketplaceApplication.update(appId, { status: "rejected" });
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: "rejected" } : a));
      toast.success("Application withdrawn");
    } catch (error) {
      console.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
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
      window.location.href = `${createPageUrl("Chat")}?conversation=${conversation.id}`;
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start conversation");
    }
  };

  const filteredApps = applications.filter(app => filter === "all" || app.status === filter);

  const countByStatus = (status) => applications.filter(a => a.status === status).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading your applications...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Briefcase className="w-7 h-7 text-gray-300" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">No applications yet</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Browse gigs and services in the Marketplace and apply — your submitted applications will be tracked here with status updates and your attached files.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-600" />
          Applications I've Submitted
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Track the status of gigs and services you've applied for, including your message and attached files.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {FILTER_TABS.map((tab) => {
          const count = tab.key === "all" ? applications.length : countByStatus(tab.key);
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                isActive
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications list */}
      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 capitalize">
            No {filter !== "all" ? filter : ""} applications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const listing = listingsMap[app.listing_id];
            const isGig = (listing?.listing_type || app.listing_type) === "gig";
            const statusMeta = STATUS_META[app.status] || STATUS_META.pending;
            const StatusIcon = statusMeta.icon;
            const isExpanded = expandedApp === app.id;
            const isLongMessage = app.message && app.message.length > 200;
            const showMessage = isExpanded || !isLongMessage
              ? app.message
              : app.message.slice(0, 200) + "...";
            const isPending = app.status === "pending";
            const isInterviewing = app.status === "interviewing";
            const isAccepted = app.status === "accepted";
            const posterEmail = listing?.posted_by_email || app.poster_email;

            return (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
                {/* Listing context bar */}
                <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge className={`text-xs flex-shrink-0 ${isGig ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
                      {isGig ? <Briefcase className="w-3 h-3 mr-1" /> : <HandHeart className="w-3 h-3 mr-1" />}
                      {isGig ? "Gig" : "Service"}
                    </Badge>
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {app.listing_title || listing?.title}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs flex-shrink-0 ${statusMeta.className}`}>
                    <StatusIcon className="w-3 h-3 mr-1" /> {statusMeta.label}
                  </Badge>
                </div>

                <div className="flex items-start gap-3">
                  {/* Poster avatar */}
                  <OptimizedAvatar
                    src={listing?.posted_by_avatar}
                    alt={listing?.posted_by_name}
                    fallback={listing?.posted_by_name?.[0] || "U"}
                    size="xs"
                    className="w-9 h-9 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    {/* Poster info + applied date */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {listing?.posted_by_name || "Listing Poster"}
                      </p>
                      <p className="text-xs text-gray-400 flex-shrink-0">Applied {timeAgo(app.created_date)}</p>
                    </div>

                    {/* Category + compensation */}
                    {(listing?.category || listing?.compensation_type) && (
                      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                        {listing?.category && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                            {listing.category}
                          </span>
                        )}
                        {listing?.compensation_type && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full capitalize">
                            {listing.compensation_type}
                            {listing.compensation_amount ? ` · ${listing.compensation_amount}` : ""}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Application message */}
                    {app.message && (
                      <div className="bg-gray-50 rounded-lg p-2.5 mb-2">
                        <p className="text-xs text-gray-400 mb-1 font-medium">Your message:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{showMessage}</p>
                        {isLongMessage && (
                          <button
                            onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1.5"
                          >
                            {isExpanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Attachments */}
                    {app.attachments?.length > 0 && (
                      <div className="mt-2.5">
                        <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> Your attachments ({app.attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {app.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-200 hover:bg-purple-50/50 transition-colors"
                            >
                              {att.file_type === "image" ? (
                                <img src={att.file_url} alt={att.file_name} className="w-6 h-6 rounded object-cover" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-gray-500" />
                              )}
                              <span className="text-[10px] text-gray-600 truncate max-w-[120px]">{att.file_name || att.file_type}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {listing && (
                        <Link to={createPageUrl("Marketplace")}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 rounded-full px-4 border-gray-300 text-gray-600"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Listing
                          </Button>
                        </Link>
                      )}
                      {(isInterviewing || isAccepted) && posterEmail && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartChat(posterEmail)}
                          className="text-xs h-8 rounded-full px-4 border-purple-200 text-purple-600"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" /> Message Poster
                        </Button>
                      )}
                      {isPending && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWithdraw(app.id)}
                          className="text-xs h-8 rounded-full px-4 border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-200"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}