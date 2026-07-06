import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { DollarSign, Trophy, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function GigCard({ gig, currentUser }) {
  const [showApply, setShowApply] = useState(false);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);

  const isPaidGig = gig.bounty_amount > 0;
  const isChallenge = gig.is_career_challenge;

  const handleApply = async () => {
    if (!currentUser) return;
    setApplying(true);
    try {
      const existing = await base44.entities.ProjectApplication.filter({
        project_id: gig.id,
        applicant_email: currentUser.email,
      });
      if (existing.length > 0) {
        toast.error("You've already applied to this gig.");
        setShowApply(false);
        return;
      }

      await base44.entities.ProjectApplication.create({
        project_id: gig.id,
        applicant_email: currentUser.email,
        message: message || "I'm interested in this opportunity.",
        status: "pending",
      });

      toast.success("Application sent! The project owner will be notified.");
      setMessage("");
      setShowApply(false);
    } catch (error) {
      toast.error("Failed to apply. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <div className="cu-card p-4 flex flex-col h-full">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {isPaidGig && (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: "#DCFCE7", color: "#15803D" }}
            >
              <DollarSign className="w-3 h-3" />
              ${gig.bounty_amount} {gig.bounty_currency || "USD"}
            </span>
          )}
          {isChallenge && (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: "#FEF3C7", color: "#B45309" }}
            >
              <Trophy className="w-3 h-3" />
              Career Challenge
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-1" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {gig.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-3 flex-1" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {gig.description}
        </p>

        {/* Skills */}
        {gig.skills_needed?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {gig.skills_needed.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: "#F3F0FF", color: "#5B47DB" }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {gig.status === "seeking_collaborators" ? (
              <>
                <Clock className="w-3 h-3" /> Accepting
              </>
            ) : gig.status === "in_progress" ? (
              <>
                <Users className="w-3 h-3" /> In Progress
              </>
            ) : (
              "Completed"
            )}
          </span>
          <div className="flex gap-1.5">
            <Link to={createPageUrl(`ProjectDetail?id=${gig.id}`)}>
              <Button variant="ghost" size="sm" className="text-xs">
                Details
              </Button>
            </Link>
            {currentUser && gig.status === "seeking_collaborators" && (
              <Button
                size="sm"
                className="text-xs text-white"
                style={{ background: "var(--cu-primary)" }}
                onClick={() => setShowApply(true)}
              >
                Apply
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply: {gig.title}</DialogTitle>
            <DialogDescription>
              {isPaidGig && `Bounty: $${gig.bounty_amount} ${gig.bounty_currency || "USD"}. `}
              Tell the project owner why you're a great fit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="I'm interested because..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApply(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={applying}
              className="text-white"
              style={{ background: "var(--cu-primary)" }}
            >
              {applying ? "Sending..." : "Send Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}