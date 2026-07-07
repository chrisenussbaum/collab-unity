import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, HandHeart, MapPin, Users, DollarSign, Gift, CircleDollarSign } from "lucide-react";
import OptimizedAvatar from "@/components/OptimizedAvatar";

const COMPENSATION_STYLES = {
  paid: { icon: DollarSign, className: "bg-green-50 border-green-200 text-green-700", label: "Paid" },
  unpaid: { icon: Gift, className: "bg-gray-50 border-gray-200 text-gray-600", label: "Unpaid" },
  negotiable: { icon: CircleDollarSign, className: "bg-amber-50 border-amber-200 text-amber-700", label: "Negotiable" },
};

export default function ListingCard({ listing, onClick, index = 0 }) {
  const isGig = listing.listing_type === "gig";
  const typeIcon = isGig ? Briefcase : HandHeart;
  const TypeIcon = typeIcon;
  const comp = COMPENSATION_STYLES[listing.compensation_type] || COMPENSATION_STYLES.negotiable;
  const CompIcon = comp.icon;

  const profileUrl = listing.posted_by_username
    ? createPageUrl(`UserProfile?username=${listing.posted_by_username}`)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
      className="h-full"
    >
      <Card
        onClick={() => onClick?.(listing)}
        className="cu-card h-full flex flex-col bg-white border border-gray-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 cursor-pointer overflow-hidden"
      >
        <CardContent className="p-4 sm:p-5 flex flex-col flex-grow">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge className={`text-xs font-semibold ${isGig ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-indigo-100 text-indigo-700 border-indigo-200"}`}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {isGig ? "Gig" : "Service"}
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-600">
              {listing.category}
            </Badge>
            <Badge variant="outline" className={`text-xs ${comp.className}`}>
              <CompIcon className="w-3 h-3 mr-1" />
              {comp.label}
            </Badge>
          </div>

          {/* Title + description */}
          <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1 line-clamp-2">
            {listing.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3 mb-3 flex-grow">
            {listing.description}
          </p>

          {/* Skills */}
          {listing.skills_needed?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {listing.skills_needed.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                  {skill}
                </Badge>
              ))}
              {listing.skills_needed.length > 3 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{listing.skills_needed.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            {listing.is_remote ? (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Remote
              </span>
            ) : (
              listing.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {listing.location}
                </span>
              )
            )}
            {listing.compensation_amount && (
              <span className="font-medium text-gray-700">{listing.compensation_amount}</span>
            )}
            {listing.application_count > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {listing.application_count}
              </span>
            )}
          </div>

          {/* Poster */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <OptimizedAvatar
              src={listing.posted_by_avatar}
              alt={listing.posted_by_name}
              fallback={listing.posted_by_name?.[0] || "U"}
              size="xs"
              className="w-7 h-7"
            />
            {profileUrl ? (
              <Link
                to={profileUrl}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
              >
                {listing.posted_by_name}
              </Link>
            ) : (
              <span className="text-sm font-medium text-gray-700">{listing.posted_by_name}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}