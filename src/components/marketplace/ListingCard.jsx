import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Briefcase, HandHeart, MapPin, DollarSign, Gift, CircleDollarSign, Sparkles } from "lucide-react";
import OptimizedAvatar from "@/components/OptimizedAvatar";

const COMPENSATION_STYLES = {
  paid: { icon: DollarSign, label: "Paid" },
  unpaid: { icon: Gift, label: "Unpaid" },
  negotiable: { icon: CircleDollarSign, label: "Negotiable" },
};

// Category-based gradient thumbnails (since listings don't have images)
const CATEGORY_THUMBNAILS = {
  "Design": { gradient: "from-pink-500 to-rose-500", icon: Sparkles },
  "Development": { gradient: "from-blue-500 to-indigo-500", icon: Briefcase },
  "Marketing": { gradient: "from-orange-500 to-amber-500", icon: Briefcase },
  "Writing & Content": { gradient: "from-emerald-500 to-teal-500", icon: Briefcase },
  "Video & Photo": { gradient: "from-purple-500 to-fuchsia-500", icon: Briefcase },
  "Music & Audio": { gradient: "from-violet-500 to-purple-500", icon: Briefcase },
  "Business": { gradient: "from-slate-600 to-gray-700", icon: Briefcase },
  "Career Development": { gradient: "from-cyan-500 to-blue-500", icon: Briefcase },
  "Resume Review": { gradient: "from-green-500 to-emerald-500", icon: Briefcase },
  "Coaching & Mentoring": { gradient: "from-indigo-500 to-violet-500", icon: Briefcase },
  "Other": { gradient: "from-gray-500 to-slate-600", icon: Briefcase },
};

export default function ListingCard({ listing, onClick, index = 0 }) {
  const isGig = listing.listing_type === "gig";
  const comp = COMPENSATION_STYLES[listing.compensation_type] || COMPENSATION_STYLES.negotiable;

  const profileUrl = listing.posted_by_username
    ? createPageUrl(`UserProfile?username=${listing.posted_by_username}`)
    : null;

  const thumb = CATEGORY_THUMBNAILS[listing.category] || CATEGORY_THUMBNAILS["Other"];
  const ThumbIcon = thumb.icon;

  // Display price: use compensation_amount if available, otherwise use the comp type label
  // Prepend $ if the amount is numeric and doesn't already start with a currency symbol
  const rawAmount = listing.compensation_amount;
  let priceDisplay;
  if (rawAmount) {
    priceDisplay = /^\d/.test(rawAmount) ? `$${rawAmount}` : rawAmount;
  } else {
    priceDisplay = comp.label;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
      className="h-full"
    >
      <div
        onClick={() => onClick?.(listing)}
        className="h-full bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-300 cursor-pointer overflow-hidden p-3 sm:p-4 flex flex-col"
      >
        {/* Header: thumbnail + type badge + title */}
        <div className="flex items-start gap-2.5 mb-2.5">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${thumb.gradient} flex items-center justify-center flex-shrink-0`}>
            <ThumbIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mb-1 ${isGig ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`}>
              {isGig ? "Gig" : "Service"}
            </span>
            <h3 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2">
              {listing.title}
            </h3>
          </div>
        </div>

        {/* Price */}
        <p className="text-base font-bold text-green-600 mb-2">{priceDisplay}</p>

        {/* Skill tags */}
        {listing.skills_needed?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5 flex-grow">
            {listing.skills_needed.slice(0, 4).map((skill, idx) => (
              <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                {skill}
              </span>
            ))}
            {listing.skills_needed.length > 4 && (
              <span className="text-[10px] text-gray-400 px-1 py-0.5">
                +{listing.skills_needed.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-2.5">
          <MapPin className="w-3 h-3" />
          {listing.is_remote ? "Remote" : (listing.location || "Location TBD")}
        </div>

        {/* Footer: poster + Apply button */}
        <div className="flex items-center gap-2 pt-2.5 border-t border-gray-100">
          <OptimizedAvatar
            src={listing.posted_by_avatar}
            alt={listing.posted_by_name}
            fallback={listing.posted_by_name?.[0] || "U"}
            size="xs"
            className="w-6 h-6 flex-shrink-0"
          />
          {profileUrl ? (
            <Link
              to={profileUrl}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium text-gray-600 hover:text-purple-600 transition-colors truncate"
            >
              {listing.posted_by_name}
            </Link>
          ) : (
            <span className="text-xs font-medium text-gray-600 truncate">{listing.posted_by_name}</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(listing);
            }}
            className="ml-auto flex items-center gap-1 text-[11px] font-medium text-white bg-[#5B47DB] hover:bg-[#4A37C0] px-2.5 py-1 rounded-full transition-colors flex-shrink-0"
          >
            <Briefcase className="w-3 h-3" />
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
}