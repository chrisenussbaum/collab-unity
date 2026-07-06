import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ChevronRight, ChevronLeft, Check, Link as LinkIcon, Plus, X, Upload, DollarSign, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const STEPS = [
  { num: 1, label: "Your Info" },
  { num: 2, label: "Pitch" },
  { num: 3, label: "Review" },
];

export default function GigApplyDialog({ gig, open, onOpenChange, currentUser }) {
  const [step, setStep] = useState(1);
  const [pitch, setPitch] = useState("");
  const [links, setLinks] = useState([{ name: "", url: "" }]);
  const [applying, setApplying] = useState(false);

  const isPaidGig = gig?.bounty_amount > 0;
  const isChallenge = gig?.gig_type === "challenge";

  const reset = () => {
    setStep(1);
    setPitch("");
    setLinks([{ name: "", url: "" }]);
  };

  const addLink = () => setLinks([...links, { name: "", url: "" }]);
  const removeLink = (index) => setLinks(links.filter((_, i) => i !== index));
  const updateLink = (index, field, value) => {
    const updated = [...links];
    updated[index][field] = value;
    setLinks(updated);
  };

  const validLinks = links.filter((l) => l.url.trim().length > 0);

  const canProceed = () => {
    if (step === 2) return pitch.trim().length > 0;
    return true;
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const existing = await base44.entities.GigApplication.filter({
        gig_id: gig.id,
        applicant_email: currentUser.email,
      });
      if (existing.length > 0) {
        toast.error("You've already applied to this gig.");
        reset();
        onOpenChange(false);
        return;
      }

      await base44.entities.GigApplication.create({
        gig_id: gig.id,
        applicant_email: currentUser.email,
        applicant_name: currentUser.full_name,
        applicant_avatar: currentUser.profile_image,
        message: pitch.trim(),
        portfolio_links: validLinks,
        status: "pending",
      });

      toast.success("Application sent! Track it in My Applications.");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to apply. Please try again.");
    } finally {
      setApplying(false);
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
          <DialogTitle>Apply: {gig?.title}</DialogTitle>
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
          <div className="space-y-3">
            <p className="text-xs text-gray-400">Review your profile info — this will be shared with the gig owner.</p>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
              <Avatar className="w-12 h-12">
                <AvatarImage src={currentUser?.profile_image} />
                <AvatarFallback>{currentUser?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{currentUser?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.headline || currentUser?.email}</p>
                {currentUser?.location && <p className="text-xs text-gray-400 truncate">{currentUser.location}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {isPaidGig && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "#DCFCE7", color: "#15803D" }}>
                  <DollarSign className="w-3 h-3" />${gig.bounty_amount} {gig.bounty_currency || "USD"}
                </span>
              )}
              {isChallenge && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "#FEF3C7", color: "#B45309" }}>
                  <Trophy className="w-3 h-3" />Career Challenge
                </span>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pitch">Why are you a great fit? *</Label>
              <Textarea id="pitch" placeholder="I'm interested because..." value={pitch} onChange={(e) => setPitch(e.target.value)} rows={4} autoFocus />
              <p className="text-xs text-gray-400 mt-1">{pitch.length}/500 characters</p>
            </div>
            <div>
              <Label>Portfolio Links (optional)</Label>
              <div className="space-y-2 mt-1">
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input placeholder="Link name (e.g., GitHub)" value={link.name} onChange={(e) => updateLink(index, "name", e.target.value)} className="flex-1" />
                    <Input placeholder="https://..." value={link.url} onChange={(e) => updateLink(index, "url", e.target.value)} className="flex-1" />
                    {links.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeLink(index)} className="flex-shrink-0">
                        <X className="w-4 h-4 text-gray-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addLink} className="mt-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add another link
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={currentUser?.profile_image} />
                  <AvatarFallback>{currentUser?.full_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{currentUser?.full_name}</p>
                  <p className="text-xs text-gray-500">{currentUser?.headline || currentUser?.email}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Your Pitch</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{pitch}</p>
              </div>
              {validLinks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Portfolio Links</p>
                  {validLinks.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                      <LinkIcon className="w-3 h-3" /> {l.name || l.url}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center">Submitting this application won't change your Collab Unity profile.</p>
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
            <Button onClick={handleApply} disabled={applying} className="text-white" style={{ background: "var(--cu-primary)" }}>
              {applying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><Upload className="w-4 h-4 mr-2" /> Submit Application</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}