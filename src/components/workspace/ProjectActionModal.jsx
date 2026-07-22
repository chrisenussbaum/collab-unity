import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusSquare,
  Flag,
  BookOpen,
  Wrench,
  AlertCircle,
  Loader2,
  Send,
  Github,
  CreditCard,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const ACTION_META = {
  task: { title: "Create Task", icon: PlusSquare, color: "bg-blue-100 text-blue-600" },
  milestone: { title: "Add Milestone", icon: Flag, color: "bg-orange-100 text-orange-600" },
  note: { title: "Save Note", icon: BookOpen, color: "bg-green-100 text-green-600" },
  tool: { title: "Add a Tool", icon: Wrench, color: "bg-purple-100 text-purple-600" },
  review: { title: "Review Overdue", icon: AlertCircle, color: "bg-red-100 text-red-600" },
};

const AVAILABLE_INTEGRATIONS = [
  { name: "GitHub", description: "Connect repos, issues, and pull requests.", icon: Github },
  { name: "Stripe", description: "Accept payments and track funding.", icon: CreditCard },
];

const COMING_SOON_INTEGRATIONS = [
  { name: "Slack", description: "Sync messages and notifications." },
  { name: "Figma", description: "Embed design files and collect feedback." },
  { name: "Notion", description: "Link docs and databases bidirectionally." },
  { name: "Google Drive", description: "Attach files directly from Drive." },
];

const EMPTY_FORMS = {
  task: { title: "", description: "", priority: "medium", due_date: "", assigned_to: "" },
  milestone: { title: "", description: "", target_date: "" },
  note: { title: "", content: "", category: "" },
};

export default function ProjectActionModal({
  open,
  onOpenChange,
  actionType,
  project,
  collaborators = [],
  overdueCount = 0,
  onRunReview,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [forms, setForms] = useState(EMPTY_FORMS);
  const [toolRequest, setToolRequest] = useState("");

  // Reset forms whenever the modal opens or action changes
  useEffect(() => {
    if (open) {
      setForms(EMPTY_FORMS);
      setToolRequest("");
      setSubmitting(false);
    }
  }, [open, actionType]);

  const meta = actionType ? ACTION_META[actionType] : null;
  if (!meta) return null;
  const Icon = meta.icon;

  const updateForm = (action, field, value) => {
    setForms((prev) => ({ ...prev, [action]: { ...prev[action], [field]: value } }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (actionType === "task") {
        const f = forms.task;
        if (!f.title.trim()) {
          toast.error("Task title is required.");
          setSubmitting(false);
          return;
        }
        await base44.entities.Task.create({
          project_id: project.id,
          title: f.title.trim(),
          description: f.description.trim(),
          priority: f.priority,
          due_date: f.due_date || undefined,
          assigned_to: f.assigned_to || undefined,
          status: "todo",
        });
        toast.success("Task created!");
      } else if (actionType === "milestone") {
        const f = forms.milestone;
        if (!f.title.trim()) {
          toast.error("Milestone title is required.");
          setSubmitting(false);
          return;
        }
        await base44.entities.ProjectMilestone.create({
          project_id: project.id,
          title: f.title.trim(),
          description: f.description.trim(),
          target_date: f.target_date ? new Date(f.target_date).toISOString() : undefined,
          status: "not_started",
        });
        toast.success("Milestone added!");
      } else if (actionType === "note") {
        const f = forms.note;
        if (!f.title.trim() || !f.content.trim()) {
          toast.error("Title and content are required.");
          setSubmitting(false);
          return;
        }
        await base44.entities.Thought.create({
          project_id: project.id,
          title: f.title.trim(),
          content: f.content.trim(),
          category: f.category.trim() || undefined,
        });
        toast.success("Note saved!");
      } else if (actionType === "tool") {
        const trimmed = toolRequest.trim();
        if (!trimmed) {
          toast.error("Enter a tool name to request.");
          setSubmitting(false);
          return;
        }
        await base44.entities.FeatureRequest.create({
          title: `Tool Request: ${trimmed}`,
          description: `User requested a new tool/integration for project "${project?.title || "Unknown"}". Requested tool: ${trimmed}`,
          category: "new_feature",
        });
        toast.success("Tool request logged!");
      } else if (actionType === "review") {
        onOpenChange(false);
        onRunReview?.();
        return;
      }
      onOpenChange(false);
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderForm = () => {
    if (actionType === "task") {
      const f = forms.task;
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-gray-600">Task title *</Label>
            <Input
              value={f.title}
              onChange={(e) => updateForm("task", "title", e.target.value)}
              placeholder="e.g. Design landing page hero"
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600">Description</Label>
            <Textarea
              value={f.description}
              onChange={(e) => updateForm("task", "description", e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="mt-1 text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-gray-600">Priority</Label>
              <Select value={f.priority} onValueChange={(v) => updateForm("task", "priority", v)}>
                <SelectTrigger className="mt-1 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600">Due date</Label>
              <Input
                type="date"
                value={f.due_date}
                onChange={(e) => updateForm("task", "due_date", e.target.value)}
                className="mt-1 text-sm h-9"
              />
            </div>
          </div>
          {collaborators.length > 0 && (
            <div>
              <Label className="text-xs font-medium text-gray-600">Assign to</Label>
              <Select value={f.assigned_to} onValueChange={(v) => updateForm("task", "assigned_to", v)}>
                <SelectTrigger className="mt-1 text-sm h-9">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((c) => (
                    <SelectItem key={c.email} value={c.email}>
                      {c.name || c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      );
    }

    if (actionType === "milestone") {
      const f = forms.milestone;
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-gray-600">Milestone title *</Label>
            <Input
              value={f.title}
              onChange={(e) => updateForm("milestone", "title", e.target.value)}
              placeholder="e.g. MVP launch"
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600">Description</Label>
            <Textarea
              value={f.description}
              onChange={(e) => updateForm("milestone", "description", e.target.value)}
              placeholder="What does this milestone represent?"
              rows={2}
              className="mt-1 text-sm resize-none"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600">Target date</Label>
            <Input
              type="date"
              value={f.target_date}
              onChange={(e) => updateForm("milestone", "target_date", e.target.value)}
              className="mt-1 text-sm h-9"
            />
          </div>
        </div>
      );
    }

    if (actionType === "note") {
      const f = forms.note;
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-gray-600">Note title *</Label>
            <Input
              value={f.title}
              onChange={(e) => updateForm("note", "title", e.target.value)}
              placeholder="e.g. Key insight from user interview"
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600">Content *</Label>
            <Textarea
              value={f.content}
              onChange={(e) => updateForm("note", "content", e.target.value)}
              placeholder="Write your note in markdown..."
              rows={5}
              className="mt-1 text-sm resize-none"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600">Category</Label>
            <Input
              value={f.category}
              onChange={(e) => updateForm("note", "category", e.target.value)}
              placeholder="e.g. Research, Ideas, Decisions"
              className="mt-1 text-sm"
            />
          </div>
        </div>
      );
    }

    if (actionType === "tool") {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Available Integrations
            </p>
            <div className="space-y-2">
              {AVAILABLE_INTEGRATIONS.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <div
                    key={tool.name}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 bg-white"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <ToolIcon className="w-4 h-4 text-gray-700" />
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
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Coming Soon
            </p>
            <div className="space-y-2">
              {COMING_SOON_INTEGRATIONS.map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">{tool.name}</p>
                    <p className="text-xs text-gray-400">{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Don't see what you need?
            </Label>
            <Input
              value={toolRequest}
              onChange={(e) => setToolRequest(e.target.value)}
              placeholder="e.g. Jira, Linear, Trello..."
              className="text-sm"
            />
          </div>
        </div>
      );
    }

    if (actionType === "review") {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {overdueCount > 0
                  ? `${overdueCount} overdue task${overdueCount > 1 ? "s" : ""} found`
                  : "No overdue tasks"}
              </p>
              <p className="text-xs text-red-600">
                {overdueCount > 0
                  ? "Run an AI review to triage, prioritize, and get a recovery plan."
                  : "Your project is on track. You can still run a general review."}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            The assistant will analyze your overdue tasks, assign priorities, and suggest next steps
            with a recovery timeline.
          </p>
        </div>
      );
    }

    return null;
  };

  const submitLabel = actionType === "review" ? "Run AI Review" : actionType === "tool" ? "Submit Request" : "Create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base">{meta.title}</DialogTitle>
              <DialogDescription className="text-xs">
                {actionType === "review"
                  ? "Generate a prioritized recovery plan"
                  : actionType === "tool"
                    ? "Connect or request integrations"
                    : `Add directly to ${project?.title || "this project"}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {renderForm()}

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          {actionType === "review" ? (
            <Button size="sm" className="cu-button" onClick={handleSubmit} disabled={submitting}>
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              {submitLabel}
            </Button>
          ) : (
            <Button size="sm" className="cu-button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1" />
                  {submitLabel}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}