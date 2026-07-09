import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  MessageCircle, Briefcase, HandHeart, MapPin, DollarSign, Gift, CircleDollarSign,
  ExternalLink, Users, Send, Loader2, CheckCircle, Paperclip, FileText, X,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import FeedComments from "@/components/FeedComments";

const COMPENSATION_STYLES = {
  paid: { icon: DollarSign, className: "text-green-600", label: "Paid" },
  unpaid: { icon: Gift, className: "text-gray-500", label: "Unpaid" },
  negotiable: { icon: CircleDollarSign, className: "text-amber-600", label: "Negotiable" },
};

export default function MarketplaceListingFeedCard({ listing, currentUser, owner }) {
  const [showComments, setShowComments] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const commentsRef = useRef(null);

  const isGig = listing.listing_type === "gig";
  const TypeIcon = isGig ? Briefcase : HandHeart;
  const comp = COMPENSATION_STYLES[listing.compensation_type] || COMPENSATION_STYLES.negotiable;
  const CompIcon = comp.icon;

  const isOwner = currentUser && listing.posted_by_email === currentUser.email;
  const profileUrl = listing.posted_by_username
    ? createPageUrl(`UserProfile?username=${listing.posted_by_username}`)
    : null;

  useEffect(() => {
    if (!currentUser || isOwner) return;
    base44.entities.MarketplaceApplication.filter({
      listing_id: listing.id,
      applicant_email: currentUser.email,
      status: "pending",
    }).then((apps) => {
      setHasApplied(apps && apps.length > 0);
    }).catch(() => {});
  }, [currentUser, listing.id, isOwner]);

  const handleAttachmentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        let fileType = "file";
        if (file.type.startsWith("image/")) fileType = "image";
        else if (file.type.startsWith("video/")) fileType = "video";
        else if (file.type === "application/pdf") fileType = "pdf";
        uploaded.push({ file_url, file_type: fileType, file_name: file.name });
      }
      setAttachments([...attachments, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (error) {
      toast.error("Failed to upload file(s)");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (idx) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleApply = async () => {
    if (!currentUser || !applyMessage.trim()) return;
    setIsApplying(true);
    try {
      await base44.entities.MarketplaceApplication.create({
        listing_id: listing.id,
        listing_title: listing.title,
        listing_type: listing.listing_type,
        applicant_email: currentUser.email,
        applicant_name: currentUser.full_name || currentUser.email,
        applicant_avatar: currentUser.profile_image || "",
        applicant_username: currentUser.username || "",
        message: applyMessage.trim(),
        status: "pending",
        poster_email: listing.posted_by_email,
        attachments: attachments,
      });

      await base44.entities.MarketplaceListing.update(listing.id, {
        application_count: (listing.application_count || 0) + 1,
      });

      if (listing.posted_by_email !== currentUser.email) {
        await base44.entities.Notification.create({
          user_email: listing.posted_by_email,
          title: `New application for "${listing.title}"`,
          message: `${currentUser.full_name || currentUser.email} applied to your ${isGig ? "gig" : "service"}.`,
          type: "project_application",
          related_entity_id: listing.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email,
          metadata: { listing_title: listing.title, listing_type: listing.listing_type },
        }).catch(() => {});
      }

      setHasApplied(true);
      setShowApplyDialog(false);
      setApplyMessage("");
      setAttachments([]);
      toast.success(`Application sent to ${listing.posted_by_name}!`);
    } catch (error) {
      console.error("Error applying:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && commentsRef.current) {
      setTimeout(() => commentsRef.current?.toggle(), 100);
    }
  };

  const heroImage = listing.logo_url;

  return (
    <>
      <motion.div
        id={`listing-${listing.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className={`cu-card mb-6 overflow-hidden border-t-4 ${isGig ? "border-purple-500" : "border-indigo-500"} hover:shadow-lg transition-shadow duration-300`}>
          <CardHeader className="px-3 sm:px-4 md:px-6 pb-3">
            <div className="flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                {/* Logo / Brand Image */}
                {heroImage && (
                  <div className="flex-shrink-0">
                    <img
                      src={heroImage}
                      alt={listing.title}
                      className="w-12 h-12 rounded-lg object-cover border-2 border-gray-100 shadow-sm"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${isGig ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`}>
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {isGig ? "Gig" : "Service"}
                    </Badge>
                    {listing.category && (
                      <Badge variant="outline" className="text-xs text-gray-600">{listing.category}</Badge>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-1.5 line-clamp-2">
                    {listing.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
                    {profileUrl ? (
                      <Link to={profileUrl} className="flex items-center space-x-1.5 group">
                        <OptimizedAvatar
                          src={listing.posted_by_avatar}
                          alt={listing.posted_by_name}
                          fallback={listing.posted_by_name?.[0] || "U"}
                          size="xs"
                          className="w-5 h-5 border-2 border-white shadow-sm"
                        />
                        <span className="text-xs sm:text-sm text-gray-600 group-hover:text-purple-600 transition-colors">
                          {listing.posted_by_name}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-xs sm:text-sm text-gray-600">{listing.posted_by_name}</span>
                    )}
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {formatDistanceToNow(new Date(listing.created_date))} ago
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-3 sm:px-4 md:px-6 pt-0 pb-3">
            {/* Media gallery (shown separately from the brand logo) */}
            {listing.media_attachments?.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                {listing.media_attachments.map((media, idx) => (
                  <div key={idx} className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    {media.media_type === "video" ? (
                      <video src={media.media_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={media.media_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
              {listing.description}
            </p>

            {/* Skills */}
            {listing.skills_needed?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {listing.skills_needed.slice(0, 5).map((skill, idx) => (
                  <span key={idx} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span className={`flex items-center gap-1 font-semibold ${comp.className}`}>
                <CompIcon className="w-3.5 h-3.5" />
                {listing.compensation_amount || comp.label}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {listing.is_remote ? "Remote" : listing.location || "Location TBD"}
              </span>
              {listing.application_count > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {listing.application_count} applied
                </span>
              )}
              {listing.external_url && (
                <a
                  href={listing.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Link
                </a>
              )}
            </div>
          </CardContent>

          <CardFooter className="px-3 sm:px-4 md:px-6 pt-0 pb-3 flex flex-col items-stretch">
            {/* Action buttons */}
            <div className="flex items-center justify-between w-full border-t border-gray-100 pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 hover:bg-transparent"
                onClick={toggleComments}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Comment</span>
              </Button>
              {!isOwner && currentUser && (
                <Button
                  size="sm"
                  disabled={hasApplied}
                  onClick={() => setShowApplyDialog(true)}
                  className={`flex items-center space-x-2 ${
                    hasApplied
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : isGig
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {hasApplied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Applied</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Apply</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Comments section */}
            {showComments && (
              <div className="w-full mt-3">
                <FeedComments
                  ref={commentsRef}
                  project={listing}
                  currentUser={currentUser}
                  context="feed_post"
                />
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={(open) => { setShowApplyDialog(open); if (!open) { setApplyMessage(""); setAttachments([]); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TypeIcon className={`w-5 h-5 ${isGig ? "text-purple-600" : "text-indigo-600"}`} />
              Apply for this {isGig ? "gig" : "service"}
            </DialogTitle>
            <DialogDescription>
              Write a brief message to {listing.posted_by_name} explaining why you're a great fit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <form onSubmit={(e) => { e.preventDefault(); handleApply(); }} className="space-y-3">
              <Textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder={`Introduce yourself and explain why you're a great fit for this ${isGig ? "gig" : "service"}...`}
                rows={4}
                required
                className="resize-none"
              />
              {/* Attachments */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Attach documents, photos, or videos to showcase your expertise</p>
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="relative group">
                        {att.file_type === "image" ? (
                          <img src={att.file_url} alt={att.file_name} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                        ) : att.file_type === "video" ? (
                          <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-500" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg border border-gray-200 bg-red-50 flex flex-col items-center justify-center p-1">
                            <FileText className="w-4 h-4 text-red-500" />
                            <span className="text-[8px] text-red-600 truncate w-full text-center mt-0.5">{att.file_type === "pdf" ? "PDF" : "FILE"}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="text-[8px] text-gray-400 truncate w-16 mt-0.5 text-center">{att.file_name}</p>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full h-9 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                  ) : (
                    <>
                      <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500">Add files (PDF, images, videos)</span>
                    </>
                  )}
                  <input type="file" accept="image/*,video/*,.pdf" multiple className="hidden" onChange={handleAttachmentUpload} disabled={isUploading} />
                </label>
              </div>
              <Button
                type="submit"
                disabled={isApplying || !applyMessage.trim()}
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
        </DialogContent>
      </Dialog>
    </>
  );
}