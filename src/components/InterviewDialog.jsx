import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Loader2 } from "lucide-react";

export default function InterviewDialog({ open, onOpenChange, application, project, onConfirm }) {
  const [calendlyLink, setCalendlyLink] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setCalendlyLink(project?.calendly_link || "");
    }
  }, [open, project]);

  const handleConfirm = async () => {
    if (!calendlyLink.trim()) return;
    setIsProcessing(true);
    try {
      await onConfirm(calendlyLink.trim());
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Move to Interviewing
          </DialogTitle>
          <DialogDescription>
            Share your Calendly scheduling link so{" "}
            {application?.applicant_email?.split("@")[0] || "the applicant"} can
            book a time slot with you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="calendly-link">Calendly Scheduling Link</Label>
            <Input
              id="calendly-link"
              placeholder="https://calendly.com/your-username/30min"
              value={calendlyLink}
              onChange={(e) => setCalendlyLink(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Paste your Calendly event URL. The applicant will see a "Book a
              Time" button once moved to Interviewing.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!calendlyLink.trim() || isProcessing}
            style={{ background: "var(--cu-primary)" }}
            className="text-white hover:opacity-90"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            Move to Interviewing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}