import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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
import { Wrench, Github, CreditCard, Search, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_INTEGRATIONS = [
  {
    name: "GitHub",
    description: "Connect repos, issues, and pull requests to your project workspace.",
    icon: Github,
    status: "available",
  },
  {
    name: "Stripe",
    description: "Accept payments, subscriptions, and track funding for your project.",
    icon: CreditCard,
    status: "available",
  },
];

const COMING_SOON_INTEGRATIONS = [
  { name: "Slack", description: "Sync messages and notifications." },
  { name: "Figma", description: "Embed design files and collect feedback." },
  { name: "Notion", description: "Link docs and databases bidirectionally." },
  { name: "Google Drive", description: "Attach files directly from Drive." },
];

export default function AddToolDialog({ open, onOpenChange, project }) {
  const [requestText, setRequestText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    const trimmed = requestText.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await base44.entities.FeatureRequest.create({
        title: `Tool Request: ${trimmed}`,
        description: `User requested a new tool/integration for project "${project?.title || "Unknown"}". Requested tool: ${trimmed}`,
        category: "new_feature",
      });
      toast.success("Thanks! Your tool request has been logged.");
      setRequestText("");
      onOpenChange(false);
    } catch (e) {
      toast.error("Could not submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <DialogTitle>Add a Tool</DialogTitle>
              <DialogDescription>
                Connect integrations or request new ones for this project.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Available integrations */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Available Integrations
            </p>
            <div className="space-y-2">
              {AVAILABLE_INTEGRATIONS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.name}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-purple-300 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{tool.name}</p>
                      <p className="text-xs text-gray-500">{tool.description}</p>
                    </div>
                    <Button size="sm" variant="outline" disabled className="text-xs flex-shrink-0">
                      Connect
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coming soon */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Coming Soon
            </p>
            <div className="space-y-2">
              {COMING_SOON_INTEGRATIONS.map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">{tool.name}</p>
                    <p className="text-xs text-gray-400">{tool.description}</p>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    Soon
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Request new tool */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Don't see what you need?
            </p>
            <div className="flex gap-2">
              <Input
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="e.g. Jira, Linear, Trello..."
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !submitting) handleSubmitRequest();
                }}
              />
              <Button
                onClick={handleSubmitRequest}
                disabled={!requestText.trim() || submitting}
                size="sm"
                className="cu-button flex-shrink-0"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}