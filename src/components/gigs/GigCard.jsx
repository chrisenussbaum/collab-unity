import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { DollarSign, Trophy, Clock, Users, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GigApplyDialog from "@/components/gigs/GigApplyDialog";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function GigCard({ gig, currentUser }) {
  const [showApply, setShowApply] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const isPaidGig = gig.bounty_amount > 0;
  const isChallenge = gig.is_career_challenge;
  const isOwner = currentUser && gig.collaborator_emails?.includes(currentUser.email);

  useEffect(() => {
    if (currentUser && !isOwner) {
      base44.entities.ProjectApplication.filter({
        project_id: gig.id,
        applicant_email: currentUser.email,
      }).then((apps) => setHasApplied(apps.length > 0)).catch(() => {});
    }
  }, [currentUser, gig.id, isOwner]);

  // Parse structured description
  const descLines = (gig.description || "").split("\n");
  const overview = descLines[0] || "";
  const deliverablesMatch = (gig.description || "").match(/Deliverables:\s*([\s\S]*?)(?:\n\n Timeline:|$)/);
  const deliverables = deliverablesMatch ? deliverablesMatch[1].trim() : "";
  const timelineMatch = (gig.description || "").match(/Timeline:\s*(.+)/);
  const timeline = timelineMatch ? timelineMatch[1].trim() : "";

  const deliverableItems = deliverables.split("\n").map((l) => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean).slice(0, 3);

  return (
    <>
      <div className="cu-card p-4 flex flex-col h-full">
        {/* Badges Row */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {isPaidGig && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#15803D" }}>
              <DollarSign className="w-3 h-3" />${gig.bounty_amount} {gig.bounty_currency || "USD"}
            </span>
          )}
          {isChallenge && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#B45309" }}>
              <Trophy className="w-3 h-3" />Challenge
            </span>
          )}
          {gig.status === "seeking_collaborators" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#F3F0FF", color: "#5B47DB" }}>
              <Users className="w-3 h-3" />Accepting
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-1 hover:text-purple-600 cursor-pointer" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          <Link to={createPageUrl(`ProjectDetail?id=${gig.id}`)}>{gig.title}</Link>
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-2" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {overview}
        </p>

        {/* Deliverables Preview */}
        {deliverableItems.length > 0 && (
          <div className="mb-2">
            <ul className="space-y-0.5">
              {deliverableItems.map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "#15803D" }} />
                  <span style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timeline */}
        {timeline && (
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeline}
          </p>
        )}

        {/* Skills */}
        {gig.skills_needed?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {gig.skills_needed.slice(0, 4).map((skill) => (
              <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#F3F0FF", color: "#5B47DB" }}>
                {skill}
              </span>
            ))}
            {gig.skills_needed.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 text-gray-400">+{gig.skills_needed.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <span className="text-xs text-gray-400">{timeAgo(gig.created_date)}</span>
          <div className="flex gap-1.5">
            {isOwner ? (
              <Link to={createPageUrl(`ProjectDetail?id=${gig.id}`)}>
                <Button variant="outline" size="sm" className="text-xs">
                  Manage <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </Link>
            ) : hasApplied ? (
              <Button variant="outline" size="sm" className="text-xs text-green-600 border-green-200" disabled>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Applied
              </Button>
            ) : currentUser && gig.status === "seeking_collaborators" ? (
              <Button size="sm" className="text-xs text-white" style={{ background: "var(--cu-primary)" }} onClick={() => setShowApply(true)}>
                Apply <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            ) : (
              <Link to={createPageUrl(`ProjectDetail?id=${gig.id}`)}>
                <Button variant="ghost" size="sm" className="text-xs">Details</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Apply Dialog (multi-step) */}
      {currentUser && (
        <GigApplyDialog gig={gig} open={showApply} onOpenChange={setShowApply} currentUser={currentUser} />
      )}
    </>
  );
}