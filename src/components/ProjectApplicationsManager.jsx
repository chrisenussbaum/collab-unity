import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProjectApplication, Notification, User } from '@/entities/all';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getPublicUserProfiles } from '@/functions/getPublicUserProfiles';
import { Check, X, Inbox } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Utility function to handle rate limits with exponential backoff
const withRetry = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      // Check if error has a response object and status property (typical for Axios errors)
      // and if it's a 429 status code, and we haven't exhausted retries.
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`Rate limit hit, retrying in ${delay.toFixed(0)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      // If it's not a 429, or max retries reached, re-throw the error
      throw error;
    }
  }
};

export default function ProjectApplicationsManager({ project, onProjectUpdate }) {
  const [applications, setApplications] = useState([]);
  const [applicantProfiles, setApplicantProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null); // Tracks ID of processing application

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const pendingApps = await withRetry(() => ProjectApplication.filter({
        project_id: project.id,
        status: 'pending'
      }));
      setApplications(pendingApps || []);

      if (pendingApps && pendingApps.length > 0) {
        const applicantEmails = pendingApps.map(app => app.applicant_email);
        const { data: profiles } = await withRetry(() => getPublicUserProfiles({ emails: applicantEmails }));
        const profilesMap = (profiles || []).reduce((acc, profile) => {
          acc[profile.email] = profile;
          return acc;
        }, {});
        setApplicantProfiles(profilesMap);
      }
    } catch (error) {
      console.error("Failed to fetch project applications:", error);
      toast.error("Could not load applications.");
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAcceptApplication = async (applicationId) => {
    setIsProcessing(applicationId);
    const application = applications.find(app => app.id === applicationId);
    if (!application) {
      setIsProcessing(null);
      return;
    }

    try {
      // 1. Update ProjectApplication status
      await withRetry(() => ProjectApplication.update(applicationId, { status: 'accepted' }));

      // 2. Add applicant to project collaborators
      // Using Set to ensure unique collaborators.
      const updatedCollaborators = [...new Set([...(project.collaborator_emails || []), application.applicant_email])];
      const newCollaboratorsCount = updatedCollaborators.length;
      
      await withRetry(() => Project.update(project.id, {
        collaborator_emails: updatedCollaborators,
        current_collaborators_count: newCollaboratorsCount
      }));

      // 2.5. Award points for joining collaboration
      try {
        await base44.functions.invoke('awardPoints', {
          action: 'project_collaboration',
          user_email: application.applicant_email
        });
      } catch (error) {
        console.error("Error awarding points for collaboration:", error);
      }

      // 3. Notify the applicant that they were accepted
      await withRetry(() => Notification.create({
        user_email: application.applicant_email,
        title: `Application accepted for "${project.title}"`,
        message: `Your application to join "${project.title}" has been accepted! Welcome to the team!`,
        type: "project_application",
        related_project_id: project.id,
        related_entity_id: applicationId,
        actor_email: project.created_by, // Project creator is the actor
        actor_name: project.created_by, // Project creator's email/name for simplicity
      }));

      // 4. Notify existing collaborators about the new member
      const existingCollaborators = project.collaborator_emails || [];
      const newApplicantProfile = applicantProfiles[application.applicant_email];
      const newApplicantName = newApplicantProfile?.full_name || application.applicant_email.split('@')[0];

      for (const collaboratorEmail of existingCollaborators) {
        // Don't notify the project owner (they're the one accepting)
        // Also don't notify the newly accepted collaborator again if they were already in the list
        if (collaboratorEmail !== project.created_by && collaboratorEmail !== application.applicant_email) {
          await withRetry(() => Notification.create({
            user_email: collaboratorEmail,
            title: "New team member added",
            message: `${newApplicantName} has joined "${project.title}".`,
            type: "project_member_added",
            related_project_id: project.id,
            related_entity_id: applicationId,
            actor_email: application.applicant_email, // New member is the "actor" of joining
            actor_name: newApplicantName,
          }));
        }
      }

      // No success toast as per requirements.

      if (onProjectUpdate) onProjectUpdate(); // Trigger parent component to refetch all project data
      fetchApplications(); // Refetch applications list
    } catch (error) {
      console.error(`Error accepting application:`, error);
      toast.error("Failed to accept application.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    setIsProcessing(applicationId);
    const application = applications.find(app => app.id === applicationId);
    if (!application) {
      setIsProcessing(null);
      return;
    }

    try {
      // 1. Update ProjectApplication status
      await withRetry(() => ProjectApplication.update(applicationId, { status: 'rejected' }));
      
      // 2. Notify the applicant that they were rejected
      await withRetry(() => Notification.create({
        user_email: application.applicant_email,
        title: `Application update for "${project.title}"`,
        message: `Your application to join "${project.title}" was not accepted at this time.`,
        type: 'project_application',
        related_project_id: project.id,
        related_entity_id: applicationId,
        actor_email: project.created_by, // Project creator is the actor
        actor_name: project.created_by, // Project creator's email/name for simplicity
      }));

      // No success toast as per requirements.

      fetchApplications(); // Refetch applications list
    } catch (error) {
      console.error(`Error rejecting application:`, error);
      toast.error("Failed to reject application.");
    } finally {
      setIsProcessing(null);
    }
  };
  
  if (isLoading) {
      return <div className="text-center p-4">Loading applications...</div>
  }

  if (applications.length === 0) {
    return null; // Don't render the card if there are no pending applications
  }

  return (
    <Card className="cu-card mb-6">
      <CardHeader>
        <CardTitle>Pending Applications ({applications.length})</CardTitle>
        <CardDescription>Review and respond to users who want to join your project.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {applications.map(app => {
          const profile = applicantProfiles[app.applicant_email] || {};
          return (
            <div key={app.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
              <Avatar>
                <AvatarImage src={profile.profile_image} />
                <AvatarFallback>{(profile.full_name || '?').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{profile.full_name || app.applicant_email}</p>
                <p className="text-sm text-gray-600 mt-1 italic">"{app.message}"</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                    onClick={() => handleRejectApplication(app.id)}
                    disabled={isProcessing === app.id}
                >
                  <X className="h-4 w-4"/>
                </Button>
                <Button 
                    size="icon" 
                    variant="outline"
                    className="h-8 w-8 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                    onClick={() => handleAcceptApplication(app.id)}
                    disabled={isProcessing === app.id}
                >
                  <Check className="h-4 w-4"/>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}