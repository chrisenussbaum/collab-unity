import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Loader2, Briefcase, HandHeart, MapPin, Users, ExternalLink, Check, Clock, XCircle, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";

export default function ListingDetailDialog({ listing, currentUser, onClose, onListingUpdated }) {
  const [applyMessage, setApplyMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applications, setApplications] = useState([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const navigate = useNavigate();

  const isPoster = currentUser?.email === listing?.posted_by_email;
  const isGig = listing?.listing_type === "gig";

  useEffect(() => {
    if (!listing) return;

    // If poster, load applications
    if (isPoster) {
      loadApplications();
    } else if (currentUser) {
      // Check if already applied
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

      // Increment application count
      await base44.entities.MarketplaceListing.update(listing.id, {
        application_count: (listing.application_count || 0) + 1,
      });

      // Send notification to poster
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

      // If accepted, notify applicant
      const app = applications.find((a) => a.id === appId);
      if (app && newStatus === "accepted") {
        await base44.entities.Notification.create({
          user_email: app.applicant_email,
          title: `Application accepted for "${listing.title}"`,
          message: `${currentUser.full_name} accepted your application.`,
          type: "collaboration_request",
          related_entity_id: listing.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name,
        });
      }

      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      toast.success(newStatus === "accepted" ? "Application accepted" : "Application rejected");
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

  if (!listing) return null;

  const profileUrl = listing.posted_by_username
    ? createPageUrl(`UserProfile?username=${listing.posted_by_username}`)
    : null;

  const compLabels = { paid: "Paid", unpaid: "Unpaid", negotiable: "Negotiable" };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center gap-2">
            <Badge className={isGig ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-indigo-100 text-indigo-700 border-indigo-200"}>
              {isGig ? <Briefcase className="w-3 h-3 mr-1" /> : <HandHeart className="w-3 h-3 mr-1" />}
              {isGig ? "Gig" : "Service"}
            </Badge>
            <Badge variant="outline" className="text-xs">{listing.category}</Badge>
            {listing.status !== "open" && (
              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 capitalize">{listing.status}</Badge>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Title + description */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{listing.title}</h2>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="text-xs">
                {compLabels[listing.compensation_type] || "Negotiable"}
              </Badge>
              {listing.compensation_amount && (
                <span className="text-sm font-medium text-gray-700">{listing.compensation_amount}</span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {listing.is_remote ? "Remote" : listing.location || "Location TBD"}
              </span>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* Skills */}
          {listing.skills_needed?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {isGig ? "Skills Needed" : "Skills Offered"}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {listing.skills_needed.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* External link */}
          {listing.external_url && (
            <a
              href={listing.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View external link
            </a>
          )}

          {/* Poster info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <OptimizedAvatar
              src={listing.posted_by_avatar}
              alt={listing.posted_by_name}
              fallback={listing.posted_by_name?.[0] || "U"}
              size="sm"
              className="w-10 h-10"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Posted by</p>
              {profileUrl ? (
                <Link to={profileUrl} className="font-semibold text-gray-900 hover:text-purple-600">
                  {listing.posted_by_name}
                </Link>
              ) : (
                <p className="font-semibold text-gray-900">{listing.posted_by_name}</p>
              )}
            </div>
            {!isPoster && currentUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartChat(listing.posted_by_email)}
                className="border-purple-200 text-purple-600"
              >
                <MessageCircle className="w-4 h-4 mr-1.5" /> Message
              </Button>
            )}
          </div>

          {/* Apply form OR Applications list */}
          {isPoster ? (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Applications ({applications.length})
              </h4>
              {isLoadingApps ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No applications yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <OptimizedAvatar
                          src={app.applicant_avatar}
                          alt={app.applicant_name}
                          fallback={app.applicant_name?.[0] || "U"}
                          size="xs"
                          className="w-8 h-8"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm text-gray-900">{app.applicant_name}</p>
                            {app.status === "pending" && (
                              <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
                                <Clock className="w-3 h-3 mr-1" /> Pending
                              </Badge>
                            )}
                            {app.status === "accepted" && (
                              <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                                <Check className="w-3 h-3 mr-1" /> Accepted
                              </Badge>
                            )}
                            {app.status === "rejected" && (
                              <Badge variant="outline" className="text-xs bg-gray-100 border-gray-200 text-gray-600">
                                <XCircle className="w-3 h-3 mr-1" /> Rejected
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{app.message}</p>
                          {app.status === "accepted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartChat(app.applicant_email)}
                              className="mt-2 border-purple-200 text-purple-600 text-xs h-7"
                            >
                              <MessageCircle className="w-3 h-3 mr-1" /> Message
                            </Button>
                          )}
                          {app.status === "pending" && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateAppStatus(app.id, "accepted")}
                                className="bg-green-600 hover:bg-green-700 text-xs h-7"
                              >
                                <Check className="w-3 h-3 mr-1" /> Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateAppStatus(app.id, "rejected")}
                                className="text-xs h-7 border-gray-300 text-gray-600"
                              >
                                <XCircle className="w-3 h-3 mr-1" /> Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !currentUser ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-3">Sign in to apply for this {isGig ? "gig" : "service"}.</p>
              <Button onClick={() => base44.auth.redirectToLogin()} className="bg-purple-600 hover:bg-purple-700">
                Sign In
              </Button>
            </div>
          ) : hasApplied ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">You've applied to this {isGig ? "gig" : "service"}!</p>
              <p className="text-xs text-green-600 mt-1">The poster will review your application and respond.</p>
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  Apply with a message *
                </label>
                <Textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder={`Introduce yourself and explain why you're a great fit for this ${isGig ? "gig" : "service"}...`}
                  rows={4}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isApplying}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                  </>
                ) : (
                  `Apply ${isGig ? "for Gig" : "for Service"}`
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}