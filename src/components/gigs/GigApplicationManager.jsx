import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Clock,
  DollarSign,
  Trophy,
  Award,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const STATUS_STEPS = [
  { key: "pending", label: "Applied", icon: Clock },
  { key: "accepted", label: "Approved", icon: CheckCircle },
  { key: "in_progress", label: "Working", icon: User },
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

export default function GigApplicationManager({ project, currentUser }) {
  const [applications, setApplications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState(null);
  const [verifySkills, setVerifySkills] = useState({});
  const [submissionLinks, setSubmissionLinks] = useState({});

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apps, projectTasks] = await Promise.all([
        base44.entities.ProjectApplication.filter(
          { project_id: project.id },
          "-created_date"
        ),
        base44.entities.Task.filter({ project_id: project.id }),
      ]);
      setApplications(apps);
      setTasks(projectTasks);
    } catch (error) {
      console.error("Failed to load applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application) => {
    try {
      await base44.entities.ProjectApplication.update(application.id, {
        status: "accepted",
        responded_at: new Date().toISOString(),
      });

      const updatedCollaborators = [
        ...(project.collaborator_emails || []),
        application.applicant_email,
      ];
      await base44.entities.Project.update(project.id, {
        collaborator_emails: [...new Set(updatedCollaborators)],
        current_collaborators_count: (project.current_collaborators_count || 1) + 1,
        status: "in_progress",
      });

      await base44.entities.Task.create({
        project_id: project.id,
        title: `Gig: ${project.title}`,
        description: project.description,
        status: "in_progress",
        assigned_to: application.applicant_email,
        is_gig_task: true,
        skills_demonstrated: project.skills_needed || [],
      });

      await base44.integrations.Core.SendEmail({
        to: application.applicant_email,
        subject: `You're approved for: ${project.title}`,
        body: `Great news! Your application for "${project.title}" on Collab Unity has been approved. Head to the Gigs page → My Applications to start working.`,
      });

      toast.success("Application approved! Task created and applicant notified.");
      loadData();
    } catch (error) {
      toast.error("Failed to approve application.");
    }
  };

  const handleReject = async (application) => {
    try {
      await base44.entities.ProjectApplication.update(application.id, {
        status: "rejected",
        responded_at: new Date().toISOString(),
      });
      toast.success("Application rejected.");
      loadData();
    } catch (error) {
      toast.error("Failed to reject application.");
    }
  };

  const handleVerify = async (task, application) => {
    const skills = verifySkills[task.id] || (project.skills_needed || []).join(", ");
    const skillsArray = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await base44.entities.Task.update(task.id, {
        completion_verified_by: currentUser.email,
        verified_at: new Date().toISOString(),
        skills_demonstrated: skillsArray,
      });

      if (project.bounty_amount > 0) {
        await base44.integrations.Core.SendEmail({
          to: application.applicant_email,
          subject: `Your work on "${project.title}" is verified!`,
          body: `Your completed work on "${project.title}" has been verified. Skills demonstrated: ${skillsArray.join(", ")}.${project.bounty_amount > 0 ? ` Arrange payment of $${project.bounty_amount} ${project.bounty_currency || "USD"} with the project owner.` : ""}`,
        });
      }

      toast.success("Work verified! Credit added to the worker's profile.");
      loadData();
    } catch (error) {
      toast.error("Failed to verify work.");
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
        <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No applications yet.</p>
        <p className="text-gray-400 text-sm mt-1">
          Applicants will appear here once they apply.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const task = tasks.find(
          (t) => t.assigned_to === app.applicant_email && t.is_gig_task
        );
        const stepIndex = getStepIndex(app, task);
        const isExpanded = expandedApp === app.id;

        return (
          <div key={app.id} className="cu-card p-4">
            {/* Applicant Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {app.applicant_email}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Applied {new Date(app.created_date).toLocaleDateString()}
                </p>
              </div>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
                style={{
                  background:
                    app.status === "accepted"
                      ? "#DCFCE7"
                      : app.status === "rejected"
                      ? "#FEE2E2"
                      : "#FEF3C7",
                  color:
                    app.status === "accepted"
                      ? "#15803D"
                      : app.status === "rejected"
                      ? "#B91C1C"
                      : "#B45309",
                }}
              >
                {app.status}
              </span>
            </div>

            {/* Application Message */}
            {app.message && (
              <p className="text-sm text-gray-600 mt-2 italic">"{app.message}"</p>
            )}

            {/* Submission Link (if task is done but not verified) */}
            {task && task.status === "done" && !task.completion_verified_by && (
              <div className="mt-3 p-3 rounded-lg" style={{ background: "#F0FDF4" }}>
                <p className="text-xs font-semibold text-green-700 mb-1">
                  Work Submitted
                </p>
                {task.attachments?.length > 0 ? (
                  task.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <LinkIcon className="w-3 h-3" /> {att.name}
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">
                    Worker marked task as done.
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              {app.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    className="text-xs text-white"
                    style={{ background: "var(--cu-primary)" }}
                    onClick={() => handleApprove(app)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleReject(app)}
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </>
              )}

              {task && task.status === "done" && !task.completion_verified_by && (
                <Button
                  size="sm"
                  className="text-xs text-white"
                  style={{ background: "#15803D" }}
                  onClick={() => handleVerify(task, app)}
                >
                  <Award className="w-3 h-3 mr-1" /> Verify & Award Credit
                </Button>
              )}

              {task?.completion_verified_by && (
                <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            {/* Skills input for verification */}
            {task && task.status === "done" && !task.completion_verified_by && (
              <div className="mt-3">
                <Label className="text-xs">
                  Skills to verify (comma-separated)
                </Label>
                <Input
                  className="text-xs mt-1"
                  placeholder={
                    (project.skills_needed || []).join(", ") ||
                    "e.g., React, UI Design"
                  }
                  value={verifySkills[task.id] || ""}
                  onChange={(e) =>
                    setVerifySkills({
                      ...verifySkills,
                      [task.id]: e.target.value,
                    })
                  }
                />
              </div>
            )}

            {/* Progress Steps */}
            {app.status === "accepted" && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                {STATUS_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isDone = i <= stepIndex;
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{
                            background: isDone ? "var(--cu-primary)" : "#E5E7EB",
                            color: isDone ? "white" : "#9CA3AF",
                          }}
                        >
                          <StepIcon className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className="text-[10px] mt-1 font-medium"
                          style={{
                            color: isDone ? "#374151" : "#9CA3AF",
                          }}
                        >
                          {step.label}
                        </span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div
                          className="h-0.5 flex-1 mx-1"
                          style={{
                            background: i < stepIndex ? "var(--cu-primary)" : "#E5E7EB",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}