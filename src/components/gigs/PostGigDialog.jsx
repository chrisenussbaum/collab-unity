import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PostGigDialog({ open, onOpenChange, onPosted, currentUser }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [bountyAmount, setBountyAmount] = useState("");
  const [isChallenge, setIsChallenge] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [posting, setPosting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in the title and description.");
      return;
    }

    setPosting(true);
    try {
      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const projectData = {
        title: title.trim(),
        description: description.trim(),
        project_type: "Collaborative",
        classification: isChallenge ? "career_development" : "business",
        status: "seeking_collaborators",
        is_visible_on_feed: true,
        is_career_challenge: isChallenge,
        skills_needed: skills,
        collaborator_emails: [currentUser.email],
        current_collaborators_count: 1,
      };

      if (isPaid && bountyAmount) {
        projectData.bounty_amount = parseFloat(bountyAmount);
        projectData.bounty_currency = "USD";
      }

      await base44.entities.Project.create(projectData);

      toast.success("Gig posted! It's now visible on the Gigs page and Feed.");

      setTitle("");
      setDescription("");
      setIsPaid(false);
      setBountyAmount("");
      setIsChallenge(false);
      setSkillsInput("");

      onOpenChange(false);
      onPosted?.();
    } catch (error) {
      toast.error("Failed to post gig. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a Gig</DialogTitle>
          <DialogDescription>
            Offer paid work or create a career challenge for the community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="gig-title">Title</Label>
            <Input
              id="gig-title"
              placeholder="e.g., Build a landing page for my startup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="gig-desc">Description</Label>
            <Textarea
              id="gig-desc"
              placeholder="Describe the work, deliverables, and timeline..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="gig-skills">Skills Needed (comma-separated)</Label>
            <Input
              id="gig-skills"
              placeholder="e.g., React, Tailwind CSS, Figma"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
            />
          </div>

          {/* Paid Gig Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div>
              <Label className="cursor-pointer">Paid Gig</Label>
              <p className="text-xs text-gray-500">Offer payment for completed work</p>
            </div>
            <Switch checked={isPaid} onCheckedChange={setIsPaid} />
          </div>

          {isPaid && (
            <div>
              <Label htmlFor="bounty-amount">Bounty Amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="bounty-amount"
                  type="number"
                  placeholder="150"
                  value={bountyAmount}
                  onChange={(e) => setBountyAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
          )}

          {/* Career Challenge Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div>
              <Label className="cursor-pointer">Career Challenge</Label>
              <p className="text-xs text-gray-500">A structured task that proves job-readiness</p>
            </div>
            <Switch checked={isChallenge} onCheckedChange={setIsChallenge} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={posting}
            className="text-white"
            style={{ background: "var(--cu-primary)" }}
          >
            {posting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...
              </>
            ) : (
              "Post Gig"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}