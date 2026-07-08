import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, HandHeart, MapPin, Users, DollarSign, Gift, CircleDollarSign, Heart, Star, Clock } from "lucide-react";
import OptimizedAvatar from "@/components/OptimizedAvatar";

const COMPENSATION_STYLES = {
  paid: { icon: DollarSign, className: "text-green-600", label: "Paid" },
  unpaid: { icon: Gift, className: "text-gray-500", label: "Unpaid" },
  negotiable: { icon: CircleDollarSign, className: "text-amber-600", label: "Negotiable" },
};

export default function ListingCard({ listing, onClick, index = 0 }) {
  const isGig = listing.listing_type === "gig";
  const TypeIcon = isGig ? Briefcase : HandHeart;
  const comp = COMPENSATION_STYLES[listing.compensation_type] || COMPENSATION_STYLES.negotiable;
  const CompIcon = comp.icon;

  const profileUrl = listing.posted_by_username
    ? createPageUrl(`UserProfile?username=${listing.posted_by_username}`)
    : null;

  const heroMedia = listing.media_attachments?.[0];
  const heroImage = heroMedia?.media_url || listing.logo_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
      className="h-full"
    >
      <Card
        onClick={() => onClick?.(listing)}
        className="cu-card h-full flex flex-col bg-white border border-gray-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 cursor-pointer overflow-hidden group"
      >
        {/* Media thumbnail - Fiverr style */}
        <div className="relative w-full h-36 sm:h-40 bg-gradient-to-br from-purple-100 to-indigo-100 overflow-hidden">
          {heroImage ? (
            heroMedia?.media_type === "video" ? (
              <video
                src={heroImage}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                muted
              />
            ) : (
              <img
                src={heroImage}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="w-10 h-10 text-purple-300" />
            </div>
          )}
          {/* Type badge overlay */}
          <div className="absolute top-2 left-2">
            <Badge className={`text-[10px] font-semibold border-0 ${isGig ? "bg-purple-600 text-white" : "bg-indigo-600 text-white"}`}>
              <TypeIcon className="w-2.5 h-2.5 mr-1" />
              {isGig ? "Gig" : "Service"}
            </Badge>
          </div>
          {/* Wishlist heart */}
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart className="w-3.5 h-3.5 text-gray-600 hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Card body */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          {/* Poster info */}
          <div className="flex items-center gap-2 mb-2">
            <OptimizedAvatar
              src={listing.posted_by_avatar}
              alt={listing.posted_by_name}
              fallback={listing.posted_by_name?.[0] || "U"}
              size="xs"
              className="w-6 h-6"
            />
            {profileUrl ? (
              <Link
                to={profileUrl}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-medium text-gray-700 hover:text-purple-600 transition-colors truncate"
              >
                {listing.posted_by_name}
              </Link>
            ) : (
              <span className="text-xs font-medium text-gray-700 truncate">{listing.posted_by_name}</span>
            )}
            {listing.application_count > 5 && (
              <Badge variant="outline" className="text-[9px] bg-amber-50 border-amber-200 text-amber-700 ml-auto">
                <Star className="w-2.5 h-2.5 mr-0.5" />
                Top Rated
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 leading-snug">
            {listing.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-grow">
            {listing.description}
          </p>

          {/* Skills */}
          {listing.skills_needed?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {listing.skills_needed.slice(0, 2).map((skill, idx) => (
                <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {skill}
                </span>
              ))}
              {listing.skills_needed.length > 2 && (
                <span className="text-[10px] text-gray-400">+{listing.skills_needed.length - 2}</span>
              )}
            </div>
          )}

          {/* Footer: compensation + location */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {listing.compensation_amount ? (
                <span className="text-sm font-bold text-gray-900">
                  {listing.compensation_type === "paid" && !listing.compensation_amount.includes("$") ? "$" : ""}
                  {listing.compensation_amount}
                </span>
              ) : (
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${comp.className}`}>
                  <CompIcon className="w-3 h-3" />
                  {comp.label}
                </span>
              )}
              {listing.application_count > 0 && (
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <Users className="w-2.5 h-2.5" />
                  {listing.application_count}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              {listing.is_remote ? (
                <>
                  <MapPin className="w-2.5 h-2.5" /> Remote
                </>
              ) : listing.location ? (
                <>
                  <MapPin className="w-2.5 h-2.5" /> {listing.location}
                </>
              ) : null}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}