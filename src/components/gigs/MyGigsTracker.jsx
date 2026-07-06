import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Clock,
  CheckCircle,
  Award,
  Link as LinkIcon,
  Loader2,
  Upload,
  DollarSign,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const STATUS_STEPS = [
  { key: "applied", label: "Applied", icon: Clock },
  { key: "approved", label: "Approved", icon: CheckCircle },
  { key: "working", label: "Working", icon: Upload },
  { key: "submitted", label: "Submitted", icon: LinkIcon },
  { key: "verified", label: "Verified", icon: Award },
];

function getStepIndex(application, task) {
  if (task?.completion_verified_by) return 4;
  if (task?.status === "done") return 3;
  if (task && task.status === "in_progress") return 2;
  if (application.status === "accepted") return 1;
  return 0;
}

export default function MyGigsTracker({ currentUser }) {
  const [applications, setApplications] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitDialog, setSubmitDialog] = useState(null);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const apps = await base44.entities.GigApplication.filter(
        { applicant_email: currentUser.email },
        "-created_date"
      );

      const gigIds = [...new Set(apps.map((a) => a.gig_id))];
      const gigPromises = gigIds.map((id) => base44.entities.Gig.get(id));
      const gigResults = await Promise.all(gigPromises);

      const taskPromises = gigIds.map((gid) =>
        base44.entities.Task.filter({
          gig_id: gid,
          assigned_to: currentUser.email,
          is_gig_task: true,
        })
      );
      const taskResults = await Promise.all(taskPromises);
      const allTasks = taskResults.flat();

      setApplications(apps);
      setGigs(gigResults);
      setTasks(allTasks);
    } catch (error) {
      console.error("Failed to load gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!linkUrl.trim()) {
      toast.error("Please provide a link to your work.");
      return;
    }
    setSubmitting(true);
    try {
      const task = tasks.find(
        (t) => t.assigned_to === currentUser.email && t.gig_id === submitDialog.gig_id
      );
      if (!task) {
        toast.error("Task not found.");
        return;
      }

      const newAttachment = {
        type: "link",
        name: linkName || "Work Submission",
        url: linkUrl,
        uploaded_by: currentUser.email,
        uploaded_at: new Date().toISOString(),
      };

      await base44.entities.Task.update(task.id, {
        status: "done",
        progress: 100,
        attachments: [...(task.attachments || []), newAttachment],
      });

      toast.success("Work submitted! The gig owner will verify it.");
      setLinkName("");
      setLinkUrl("");
      setSubmitDialog(null);
      loadData();
    } catch (error) {
      toast.error("Failed to submit work.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">You haven't applied to any gigs yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => {
        const gig = gigs.find((g) => g.id === app.gig_id);
        const task = tasks.find(
          (t) => t.gig_id === app.gig_id && t.assigned_to === currentUser.email
        );
        if (!gig) return null;
        const stepIndex = getStepIndex(app, task);
        const isPaid = gig.bounty_amount > 0;
        const isChallenge = gig.gig_type === "challenge";

        return (
          <div key={app.id} className="cu-card p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-semibold text-gray-900 text-sm flex-1 min-w-0">{gig.title}</h3>
              <div className="flex gap-1 flex-shrink-0">
                {isPaid && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#DCFCE7", color: "#15803D" }}>
                    <DollarSign className="w-3 h-3" />${gig.bounty_amount}
                  </span>
                )}
                {isChallenge && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#FEF3C7", color: "#B45309" }}>
                    <Trophy className="w-3 h-3" />Challenge
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="mb-3">
              {app.status === "pending" && (
                <span className="text-xs text-amber-600 font-medium">Waiting for approval</span>
              )}
              {app.status === "rejected" && (
                <span className="text-xs text-red-600 font-medium">Application not accepted</span>
              )}
              {app.status === "accepted" && !task?.completion_verified_by && (
                <span className="text-xs text-purple-600 font-medium">
                  {task?.status === "done" ? "Awaiting verification" : "Approved — start working!"}
                </span>
              )}
              {task?.completion_verified_by && (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <Award className="w-3 h-3" /> Verified — credit earned!
                </span>
              )}
            </div>

            {/* Progress Steps */}
            {app.status === "accepted" && (
              <div className="flex items-center justify-between mb-4">
                {STATUS_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isDone = i <= stepIndex;
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isDone ? "var(--cu-primary)" : "#E5E7EB", color: isDone ? "white" : "#9CA3AF" }}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] mt-1 font-medium" style={{ color: isDone ? "#374151" : "#9CA3AF" }}>{step.label}</span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className="h-0.5 flex-1 mx-1" style={{ background: i < stepIndex ? "var(--cu-primary)" : "#E5E7EB" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Verified Skills */}
            {task?.completion_verified_by && task?.skills_demonstrated?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.skills_demonstrated.map((skill) => (
                  <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#F0FDF4", color: "#15803D" }}>
                    <Award className="w-2.5 h-2.5" /> {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Submit Work Button */}
            {app.status === "accepted" && task && task.status !== "done" && !task.completion_verified_by && (
              <Button className="text-white text-xs w-full" style={{ background: "var(--cu-primary)" }} onClick={() => setSubmitDialog({ gig_id: app.gig_id, title: gig.title })}>
                <Upload className="w-3 h-3 mr-2" /> Submit Your Work
              </Button>
            )}

            {/* Submission link shown */}
            {task?.status === "done" && !task.completion_verified_by && task.attachments?.length > 0 && (
              <div className="mt-2">
                {task.attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> {att.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Submit Work Dialog */}
      <Dialog open={!!submitDialog} onOpenChange={(open) => !open && setSubmitDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Your Work</DialogTitle>
            <DialogDescription>
              {submitDialog?.title} — Share a link to your completed deliverable (GitHub, Figma, live demo, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Link Name</Label>
              <Input placeholder="e.g., GitHub Repo, Live Demo" value={linkName} onChange={(e) => setLinkName(e.target.value)} />
            </div>
            <div>
              <Label>URL</Label>
              <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialog(null)}>Cancel</Button>
            <Button className="text-white" style={{ background: "var(--cu-primary)" }} onClick={handleSubmitWork} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}