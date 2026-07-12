import { useState } from 'react';
import { Project, ProjectApplication, Notification } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const withRetry = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

export function useApplicationActions({ onComplete } = {}) {
  const [isProcessing, setIsProcessing] = useState(null);
  const [interviewCtx, setInterviewCtx] = useState(null);

  const handleAccept = async (application, project, applicantProfile) => {
    setIsProcessing(application.id);
    try {
      await withRetry(() => ProjectApplication.update(application.id, { status: 'accepted' }));

      const updatedCollaborators = [...new Set([...(project.collaborator_emails || []), application.applicant_email])];
      await withRetry(() => Project.update(project.id, {
        collaborator_emails: updatedCollaborators,
        current_collaborators_count: updatedCollaborators.length
      }));

      try {
        await base44.functions.invoke('awardPoints', {
          action: 'project_collaboration',
          user_email: application.applicant_email
        });
      } catch (e) {
        console.error("Error awarding points for collaboration:", e);
      }

      await withRetry(() => Notification.create({
        user_email: application.applicant_email,
        title: `Application accepted for "${project.title}"`,
        message: `Your application to join "${project.title}" has been accepted! Welcome to the team!`,
        type: "project_application",
        related_project_id: project.id,
        related_entity_id: application.id,
        actor_email: project.created_by,
        actor_name: project.created_by,
      }));

      const existingCollaborators = project.collaborator_emails || [];
      const newApplicantName = applicantProfile?.full_name || application.applicant_email.split('@')[0];
      for (const collaboratorEmail of existingCollaborators) {
        if (collaboratorEmail !== project.created_by && collaboratorEmail !== application.applicant_email) {
          await withRetry(() => Notification.create({
            user_email: collaboratorEmail,
            title: "New team member added",
            message: `${newApplicantName} has joined "${project.title}".`,
            type: "project_member_added",
            related_project_id: project.id,
            related_entity_id: application.id,
            actor_email: application.applicant_email,
            actor_name: newApplicantName,
          }));
        }
      }

      toast.success("Application accepted");
      if (onComplete) await onComplete();
    } catch (error) {
      console.error("Error accepting application:", error);
      toast.error("Failed to accept application.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (application, project) => {
    setIsProcessing(application.id);
    try {
      await withRetry(() => ProjectApplication.update(application.id, { status: 'rejected' }));

      await withRetry(() => Notification.create({
        user_email: application.applicant_email,
        title: `Application update for "${project.title}"`,
        message: `Your application to join "${project.title}" was not accepted at this time.`,
        type: 'project_application',
        related_project_id: project.id,
        related_entity_id: application.id,
        actor_email: project.created_by,
        actor_name: project.created_by,
      }));

      toast.success("Application declined");
      if (onComplete) await onComplete();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to decline application.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleInterview = async (calendlyLink) => {
    if (!interviewCtx) return;
    const { application, project } = interviewCtx;
    setIsProcessing(application.id);
    try {
      await withRetry(() => Project.update(project.id, { calendly_link: calendlyLink }));
      await withRetry(() => ProjectApplication.update(application.id, { status: 'interviewing' }));

      await withRetry(() => Notification.create({
        user_email: application.applicant_email,
        title: `Interview invitation for "${project.title}"`,
        message: `You've been invited to interview for "${project.title}"! Book a time slot that works for you.`,
        type: "project_application",
        related_project_id: project.id,
        related_entity_id: application.id,
        actor_email: project.created_by,
        actor_name: project.created_by,
      }));

      toast.success("Application moved to Interviewing");
      setInterviewCtx(null);
      if (onComplete) await onComplete();
    } catch (error) {
      console.error("Error moving application to interviewing:", error);
      toast.error("Failed to move application to Interviewing.");
    } finally {
      setIsProcessing(null);
    }
  };

  return {
    isProcessing,
    interviewCtx,
    setInterviewCtx,
    handleAccept,
    handleReject,
    handleInterview,
  };
}