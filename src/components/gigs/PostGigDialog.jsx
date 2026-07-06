import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, Trophy, Briefcase, ChevronRight, ChevronLeft, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const STEPS = [
  { num: 1, label: "Basics" },
  { num: 2, label: "Details" },
  { num: 3, label: "Skills" },
  { num: 4, label: "Review" },
];

export default function PostGigDialog({ open, onOpenChange, onPosted, currentUser }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [gigType, setGigType] = useState("paid");
  const [bountyAmount, setBountyAmount] = useState("");
  const [overview, setOverview] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [timeline, setTimeline] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [posting, setPosting] = useState(false);

  const reset = () => {
    setStep(1);
    setTitle("");
    setGigType("paid");
    setBountyAmount("");
    setOverview("");
    setDeliverables("");
    setTimeline("");
    setSkillsInput("");
  };

  const canProceed = () => {
    if (step === 1) return title.trim().length > 0 && (gigType !== "paid" || bountyAmount);
    if (step === 2) return overview.trim().length > 0 && deliverables.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setPosting(true);
    try {
      const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const isChallenge = gigType === "challenge";

      await base44.entities.Gig.create({
        title: title.trim(),
        description: overview.trim(),
        deliverables: deliverables.trim(),
        timeline: timeline.trim(),
        gig_type: gigType,
        bounty_amount: gigType === "paid" ? parseFloat(bountyAmount) || 0 : 0,
        bounty_currency: "USD",
        skills_needed: skills,
        status: "open",
        owner_email: currentUser.email,
        owner_name: currentUser.full_name,
        owner_avatar: currentUser.profile_image,
        classification: isChallenge ? "career_development" : "business",
        is_archived: false,
      });

      toast.success("Gig posted! It's now visible on the Gigs page.");
      reset();
      onOpenChange(false);
      onPosted?.();
    } catch (error) {
      toast.error("Failed to post gig. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 rounded-t-lg overflow-hidden">
          <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--cu-primary)" }} />
        </div>

        <DialogHeader className="pt-2">
          <DialogTitle>Post a Gig</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= s.num ? "text-purple-600" : "text-gray-400"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= s.num ? "text-white" : "text-gray-400"}`} style={{ background: step >= s.num ? "var(--cu-primary)" : "#E5E7EB" }}>
                    {step > s.num ? <Check className="w-3 h-3" /> : s.num}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200" />}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="gig-title">Gig Title *</Label>
              <Input id="gig-title" placeholder="e.g., Build a landing page for my startup" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            </div>
            <div>
              <Label>Gig Type *</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button type="button" onClick={() => setGigType("paid")} className={`p-3 rounded-lg border-2 text-left transition-colors ${gigType === "paid" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <DollarSign className="w-4 h-4 mb-1" style={{ color: "#15803D" }} />
                  <p className="text-sm font-semibold text-gray-900">Paid Gig</p>
                  <p className="text-[10px] text-gray-500">Offer payment for completed work</p>
                </button>
                <button type="button" onClick={() => setGigType("challenge")} className={`p-3 rounded-lg border-2 text-left transition-colors ${gigType === "challenge" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <Trophy className="w-4 h-4 mb-1" style={{ color: "#B45309" }} />
                  <p className="text-sm font-semibold text-gray-900">Career Challenge</p>
                  <p className="text-[10px] text-gray-500">Prove job-readiness with a real task</p>
                </button>
              </div>
            </div>
            {gigType === "paid" && (
              <div>
                <Label htmlFor="bounty-amount">Bounty Amount (USD) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <Input id="bounty-amount" type="number" placeholder="150" value={bountyAmount} onChange={(e) => setBountyAmount(e.target.value)} className="pl-7" />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="gig-overview">About the Gig *</Label>
              <Textarea id="gig-overview" placeholder="Describe the work, context, and what you're looking for..." value={overview} onChange={(e) => setOverview(e.target.value)} rows={4} autoFocus />
            </div>
            <div>
              <Label htmlFor="gig-deliverables">Deliverables *</Label>
              <Textarea id="gig-deliverables" placeholder={"What should the worker produce? e.g.,\n• Responsive landing page\n• Figma design file\n• Source code on GitHub"} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={3} />
            </div>
            <div>
              <Label htmlFor="gig-timeline">Timeline</Label>
              <Input id="gig-timeline" placeholder="e.g., 2 weeks, by July 30th" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="gig-skills">Skills Needed</Label>
              <Input id="gig-skills" placeholder="e.g., React, Tailwind CSS, Figma" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} autoFocus />
              <p className="text-xs text-gray-400 mt-1">Comma-separated. These will be verified on completion.</p>
            </div>
            {skillsInput && (
              <div className="flex flex-wrap gap-1.5">
                {skillsInput.split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                  <span key={skill} className="text-xs px-2 py-1 rounded-full" style={{ background: "#F3F0FF", color: "#5B47DB" }}>{skill}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                {gigType === "paid" ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#15803D" }}>
                    <DollarSign className="w-3 h-3 inline mr-0.5" />${bountyAmount || "0"}
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#B45309" }}>
                    <Trophy className="w-3 h-3 inline mr-0.5" />Career Challenge
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
              <p className="text-xs text-gray-600 mt-1">{overview}</p>
              {deliverables && <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Deliverables:</span> {deliverables}</p>}
              {timeline && <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Timeline:</span> {timeline}</p>}
              {skillsInput && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {skillsInput.split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                    <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#F3F0FF", color: "#5B47DB" }}>{skill}</span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center">Review your gig above. You can edit any step before posting.</p>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="mr-auto">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < STEPS.length ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="text-white" style={{ background: "var(--cu-primary)" }}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={posting} className="text-white" style={{ background: "var(--cu-primary)" }}>
              {posting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</> : <><Briefcase className="w-4 h-4 mr-2" /> Post Gig</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}