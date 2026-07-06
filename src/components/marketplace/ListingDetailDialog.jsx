import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  X, Loader2, Briefcase, HandHeart, MapPin, Users, ExternalLink,
  Check, Clock, XCircle, MessageCircle, DollarSign, Gift, CircleDollarSign,
  Calendar, Share2, ChevronDown, ChevronUp
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import ApplicantCard from "./ApplicantCard";

const COMPENSATION_META = {
  paid: { icon: DollarSign, label: "Paid" },
  unpaid: { icon: Gift, label: "Unpaid" },
  negotiable: { icon: CircleDollarSign, label: "Negotiable" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 7) return `${Math.floor(days / 7)}w ago`;
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

export default function ListingDetailDialog({ listing, currentUser, onClose, onListingUpdated }) {
  const [applyMessage, setApplyMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applications, setApplications] = useState([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [showAllDescription, setShowAllDescription] = useState(false);
  const [appFilter, setAppFilter] = useState("all"); // all | pending | interviewing | accepted | rejected
  const navigate = useNavigate();

  const isPoster = currentUser?.email === listing?.posted_by_email;
  const isGig = listing?.listing_type === "gig";

  useEffect(() => {
    if (!listing) return;
    if (isPoster) {
      loadApplications();
    } else if (currentUser) {
      checkExistingApplication();
    }
  }, [listing, currentUser, isPoster]);

  const loadApplications = async () => {
    setIsLoadingApps(true);
    try {
      const apps = await base44.entities.MarketplaceApplication.filter(
        { listing_id: listing.id },
        "-created_date",
        50
      );
      setApplications(apps);
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const existing = await base44.entities.MarketplaceApplication.filter({
        listing_id: listing.id,
        applicant_email: currentUser.email,
      });
      if (existing.length > 0) {
        setHasApplied(true);
        setApplyMessage(existing[0].message || "");
      }
    } catch (error) {
      console.error("Error checking application:", error);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyMessage.trim()) {
      toast.error("Please write a message");
      return;
    }
    setIsApplying(true);
    try {
      await base44.entities.MarketplaceApplication.create({
        listing_id: listing.id,
        listing_title: listing.title,
        listing_type: listing.listing_type,
        applicant_email: currentUser.email,
        applicant_name: currentUser.full_name,
        applicant_avatar: currentUser.profile_image || "",
        applicant_username: currentUser.username || "",
        message: applyMessage.trim(),
        status: "pending",
        poster_email: listing.posted_by_email,
      });
      await base44.entities.MarketplaceListing.update(listing.id, {
        application_count: (listing.application_count || 0) + 1,
      });
      await base44.entities.Notification.create({
        user_email: listing.posted_by_email,
        title: `New application for "${listing.title}"`,
        message: `${currentUser.full_name} applied to your ${isGig ? "gig" : "service"}.`,
        type: "collaboration_request",
        related_entity_id: listing.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
      });
      setHasApplied(true);
      toast.success("Application sent!");
      onListingUpdated?.();
    } catch (error) {
      console.error("Error applying:", error);
      toast.error("Failed to apply. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleUpdateAppStatus = async (appId, newStatus) => {
    try {
      await base44.entities.MarketplaceApplication.update(appId, { status: newStatus });
      const app = applications.find((a) => a.id === appId);
      if (app && newStatus === "interviewing") {
        await base44.entities.Notification.create({
          user_email: app.applicant_email,
          title: `Interview started for "${listing.title}"`,
          message: `${currentUser.full_name} moved your application to the interviewing stage.`,
          type: "collaboration_request",
          related_entity_id: listing.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name,
        });
      } else if (app && newStatus === "accepted") {
        await base44.entities.Notification.create({
          user_email: app.applicant_email,
          title: `Application accepted for "${listing.title}"`,
          message: `${currentUser.full_name} accepted your application.`,
          type: "collaboration_request",
          related_entity_id: listing.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name,
        });
      } else if (app && newStatus === "rejected") {
        await base44.entities.Notification.create({
          user_email: app.applicant_email,
          title: `Application update for "${listing.title}"`,
          message: `${currentUser.full_name} declined your application.`,
          type: "general",
          related_entity_id: listing.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name,
        });
      }
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      toast.success(
        newStatus === "accepted" ? "Application accepted"
          : newStatus === "interviewing" ? "Moved to interviewing"
          : "Application declined"
      );
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

  const handleShare = () => {
    const url = `${window.location.origin}${createPageUrl("Marketplace")}?listing=${listing.id}`;
    if (navigator.share) {
      navigator.share({ title: listing.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  if (!listing) return null;

  const profileUrl = listing.posted_by_username
    ? createPageUrl(`UserProfile?username=${listing.posted_by_username}`)
    : null;

  const compMeta = COMPENSATION_META[listing.compensation_type] || COMPENSATION_META.negotiable;
  const CompIcon = compMeta.icon;

  const isLongDescription = listing.description && listing.description.length > 300;
  const displayDescription = isLongDescription && !showAllDescription
    ? listing.description.slice(0, 300) + "..."
    : listing.description;

  // Application filter counts
  const pendingCount = applications.filter(a => a.status === "pending").length;
  const interviewingCount = applications.filter(a => a.status === "interviewing").length;
  const acceptedCount = applications.filter(a => a.status === "accepted").length;
  const rejectedCount = applications.filter(a => a.status === "rejected").length;
  const filteredApps = appFilter === "all"
    ? applications
    : applications.filter(a => a.status === appFilter);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[100vh] sm:max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Badge className={`text-xs font-semibold ${isGig ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
              {isGig ? <Briefcase className="w-3 h-3 mr-1" /> : <HandHeart className="w-3 h-3 mr-1" />}
              {isGig ? "Gig" : "Service"}
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-600">
              {listing.category}
            </Badge>
            {listing.status !== "open" && (
              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500 capitalize">
                {listing.status}
              </Badge>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header section */}
        <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
            {listing.title}
          </h1>

          {/* Metadata row */}
          <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
              <CompIcon className="w-3.5 h-3.5" />
              {compMeta.label}
            </span>
            {listing.compensation_amount && (
              <span className="text-sm font-semibold text-gray-900">
                {listing.compensation_amount}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              {listing.is_remote ? "Remote" : (listing.location || "Location TBD")}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              {timeAgo(listing.created_date)}
            </span>
          </div>

          {/* Action buttons row */}
          {!isPoster && currentUser && (
            <div className="flex items-center gap-2 mb-1">
              {!hasApplied && (
                <Button
                  onClick={() => document.getElementById('apply-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6"
                >
                  Apply {isGig ? "for Gig" : "for Service"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleShare}
                className="rounded-full border-gray-300 text-gray-700"
              >
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStartChat(listing.posted_by_email)}
                className="rounded-full border-gray-300 text-gray-700"
              >
                <MessageCircle className="w-4 h-4 mr-1.5" /> Message
              </Button>
            </div>
          )}
        </div>

        {/* About section */}
        <div className="px-5 sm:px-7 py-4 border-t border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-2">
            About the {isGig ? "gig" : "service"}
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {displayDescription}
          </p>
          {isLongDescription && (
            <button
              onClick={() => setShowAllDescription(!showAllDescription)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-1.5"
            >
              {showAllDescription ? "Show less" : "... more"}
            </button>
          )}
        </div>

        {/* Skills section */}
        {listing.skills_needed?.length > 0 && (
          <div className="px-5 sm:px-7 py-4 border-t border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-2.5">
              {isGig ? "Skills needed" : "Skills offered"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {listing.skills_needed.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* External link */}
        {listing.external_url && (
          <div className="px-5 sm:px-7 py-4 border-t border-gray-100">
            <a
              href={listing.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View external link
            </a>
          </div>
        )}

        {/* Poster info card */}
        <div className="px-5 sm:px-7 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl">
            <OptimizedAvatar
              src={listing.posted_by_avatar}
              alt={listing.posted_by_name}
              fallback={listing.posted_by_name?.[0] || "U"}
              size="sm"
              className="w-11 h-11"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Posted by</p>
              {profileUrl ? (
                <Link to={profileUrl} className="font-semibold text-gray-900 hover:text-purple-600 text-sm">
                  {listing.posted_by_name}
                </Link>
              ) : (
                <p className="font-semibold text-gray-900 text-sm">{listing.posted_by_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Applications section (poster view) OR Apply form (applicant view) */}
        {isPoster ? (
          <div className="px-5 sm:px-7 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                Applications
                <span className="text-gray-400 font-normal">({applications.length})</span>
              </h2>
            </div>

            {/* Filter tabs */}
            {applications.length > 0 && (
              <div className="flex items-center gap-1 mb-4 border-b border-gray-100">
                {[
                  { key: "all", label: "All", count: applications.length },
                  { key: "pending", label: "Pending", count: pendingCount },
                  { key: "interviewing", label: "Interviewing", count: interviewingCount },
                  { key: "accepted", label: "Accepted", count: acceptedCount },
                  { key: "rejected", label: "Declined", count: rejectedCount },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setAppFilter(tab.key)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      appFilter === tab.key
                        ? "border-purple-600 text-purple-700"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {isLoadingApps ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No applications yet</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  When someone applies for this {isGig ? "gig" : "service"}, their application will appear here for you to review.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app) => (
                  <ApplicantCard
                    key={app.id}
                    app={app}
                    onAccept={(id) => handleUpdateAppStatus(id, "accepted")}
                    onDecline={(id) => handleUpdateAppStatus(id, "rejected")}
                    onAdvance={(id) => handleUpdateAppStatus(id, "interviewing")}
                    onMessage={(email) => handleStartChat(email)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : !currentUser ? (
          <div id="apply-section" className="px-5 sm:px-7 py-6 border-t border-gray-100">
            <div className="text-center py-6 px-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-3">Sign in to apply for this {isGig ? "gig" : "service"}.</p>
              <Button onClick={() => base44.auth.redirectToLogin()} className="bg-purple-600 hover:bg-purple-700 rounded-full px-6">
                Sign In to Apply
              </Button>
            </div>
          </div>
        ) : hasApplied ? (
          <div id="apply-section" className="px-5 sm:px-7 py-6 border-t border-gray-100">
            <div className="p-5 bg-green-50 border border-green-200 rounded-xl text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-green-900 mb-1">Application submitted</p>
              <p className="text-xs text-green-700">
                {listing.posted_by_name} will review your application and respond.
              </p>
            </div>
          </div>
        ) : (
          <div id="apply-section" className="px-5 sm:px-7 py-5 border-t border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-1">Apply for this {isGig ? "gig" : "service"}</h2>
            <p className="text-xs text-gray-500 mb-3">
              Write a brief message to {listing.posted_by_name} explaining why you're a great fit.
            </p>
            <form onSubmit={handleApply} className="space-y-3">
              <Textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder={`Introduce yourself and explain why you're a great fit for this ${isGig ? "gig" : "service"}...`}
                rows={4}
                required
                className="resize-none"
              />
              <Button
                type="submit"
                disabled={isApplying}
                className="w-full bg-purple-600 hover:bg-purple-700 rounded-full"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                  </>
                ) : (
                  <>Submit Application</>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}