import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProjectApplication } from '@/entities/all';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { getPublicUserProfiles } from '@/functions/getPublicUserProfiles';
import InterviewDialog from '@/components/InterviewDialog';
import { useApplicationActions } from '@/hooks/useApplicationActions';
import ApplicationDetailCard from '@/components/applications/ApplicationDetailCard';

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

export default function ProjectApplicationsManager({ project, onProjectUpdate }) {
  const [searchParams] = useSearchParams();
  const expandAppId = searchParams.get('application');

  const [applications, setApplications] = useState([]);
  const [applicantProfiles, setApplicantProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);

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

  const {
    isProcessing,
    interviewCtx,
    setInterviewCtx,
    handleAccept,
    handleReject,
    handleInterview,
  } = useApplicationActions({
    onComplete: () => {
      if (onProjectUpdate) onProjectUpdate();
      fetchApplications();
    }
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading applications...</div>;
  }

  if (applications.length === 0) {
    return null;
  }

  return (
    <Card className="cu-card mb-6">
      <CardHeader>
        <CardTitle>Pending Applications ({applications.length})</CardTitle>
        <CardDescription>
          Review and respond to users who want to join your project. Click "View details" to see their message, attachments, and profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {applications.map(app => (
          <ApplicationDetailCard
            key={app.id}
            application={app}
            project={project}
            applicantProfile={applicantProfiles[app.applicant_email]}
            isProcessing={isProcessing}
            onAccept={handleAccept}
            onReject={handleReject}
            onStartInterview={(application, proj) => setInterviewCtx({ application, project: proj })}
            defaultExpanded={expandAppId === app.id}
          />
        ))}
      </CardContent>
      {interviewCtx && (
        <InterviewDialog
          open={!!interviewCtx}
          onOpenChange={(open) => !open && setInterviewCtx(null)}
          application={interviewCtx.application}
          project={interviewCtx.project}
          onConfirm={handleInterview}
        />
      )}
    </Card>
  );
}