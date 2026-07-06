import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, Clock, XCircle, MessageCircle, ChevronDown, ChevronUp
} from "lucide-react";
import OptimizedAvatar from "@/components/OptimizedAvatar";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

const STATUS_BADGES = {
  pending: { icon: Clock, className: "bg-amber-50 border-amber-200 text-amber-700", label: "Pending" },
  accepted: { icon: Check, className: "bg-green-50 border-green-200 text-green-700", label: "Accepted" },
  rejected: { icon: XCircle, className: "bg-gray-100 border-gray-200 text-gray-500", label: "Declined" },
};

export default function ApplicantCard({ app, onAccept, onDecline, onMessage }) {
  const [expanded, setExpanded] = useState(false);
  const statusMeta = STATUS_BADGES[app.status] || STATUS_BADGES.pending;
  const StatusIcon = statusMeta.icon;
  const isPending = app.status === "pending";
  const isLongMessage = app.message && app.message.length > 150;
  const showMessage = expanded || !isLongMessage
    ? app.message
    : app.message.slice(0, 150) + "...";

  const profileUrl = app.applicant_username
    ? createPageUrl(`UserProfile?username=${app.applicant_username}`)
    : null;

  return (
    <div className="border border-gray-200 rounded-xl p-3.5 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        <OptimizedAvatar
          src={app.applicant_avatar}
          alt={app.applicant_name}
          fallback={app.applicant_name?.[0] || "U"}
          size="xs"
          className="w-10 h-10 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          {/* Name + status row */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            {profileUrl ? (
              <Link
                to={profileUrl}
                className="font-semibold text-sm text-gray-900 hover:text-purple-600 truncate"
              >
                {app.applicant_name}
              </Link>
            ) : (
              <p className="font-semibold text-sm text-gray-900 truncate">{app.applicant_name}</p>
            )}
            <Badge variant="outline" className={`text-xs flex-shrink-0 ${statusMeta.className}`}>
              <StatusIcon className="w-3 h-3 mr-1" /> {statusMeta.label}
            </Badge>
          </div>

          <p className="text-xs text-gray-400 mb-2">{timeAgo(app.created_date)}</p>

          {/* Application message */}
          <div className="bg-gray-50 rounded-lg p-2.5 mb-2">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{showMessage}</p>
            {isLongMessage && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1.5 flex items-center gap-0.5"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Show more <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>

          {/* Action buttons */}
          {isPending && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAccept(app.id)}
                className="bg-green-600 hover:bg-green-700 text-xs h-8 rounded-full px-4"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecline(app.id)}
                className="text-xs h-8 rounded-full px-4 border-gray-300 text-gray-600"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
              </Button>
            </div>
          )}
          {app.status === "accepted" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMessage(app.applicant_email)}
              className="text-xs h-8 rounded-full px-4 border-purple-200 text-purple-600"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1" /> Message
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}