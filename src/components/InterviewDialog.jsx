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
import { Loader2 } from "lucide-react";

// Extracts the username from any stored Calendly link format
// e.g. "https://calendly.com/johndoe/30min" -> "johndoe/30min"
function extractCalendlyUsername(fullLink) {
  if (!fullLink) return "";
  const match = fullLink.match(/calendly\.com\/(.+)/);
  return match ? match[1] : "";
}

export default function InterviewDialog({ open, onOpenChange, application, project, onConfirm }) {
  const [calendlyUsername, setCalendlyUsername] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setCalendlyUsername(extractCalendlyUsername(project?.calendly_link));
    }
  }, [open, project]);

  const handleConfirm = async () => {
    if (!calendlyUsername.trim()) return;
    setIsProcessing(true);
    try {
      await onConfirm(`https://calendly.com/${calendlyUsername.trim()}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img
              src="https://assets.calendly.com/assets/external/favicon-32x32.png"
              alt="Calendly"
              className="w-5 h-5"
            />
            Move to Interviewing
          </DialogTitle>
          <DialogDescription>
            Share your Calendly username so{" "}
            {application?.applicant_email?.split("@")[0] || "the applicant"} can
            book a time slot with you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="calendly-username">Calendly Username</Label>
            <div className="flex items-center mt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-500 whitespace-nowrap">
                <img
                  src="https://assets.calendly.com/assets/external/favicon-16x16.png"
                  alt=""
                  className="w-3.5 h-3.5"
                />
                calendly.com/
              </span>
              <Input
                id="calendly-username"
                placeholder="your-username/30min"
                value={calendlyUsername}
                onChange={(e) => setCalendlyUsername(e.target.value)}
                className="rounded-l-none"
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Enter your Calendly event path (e.g. <code>username/30min</code>).
              The applicant will see a "Book a Time" button once moved to Interviewing.
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
            disabled={!calendlyUsername.trim() || isProcessing}
            style={{ background: "var(--cu-primary)" }}
            className="text-white hover:opacity-90"
          >
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Move to Interviewing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}