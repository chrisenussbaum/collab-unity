import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProjectApplication, Notification, User } from '@/entities/all';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getPublicUserProfiles } from '@/functions/getPublicUserProfiles';
import { Check, X, Inbox, Paperclip, FileText, ChevronDown, ChevronUp, ExternalLink, User as UserIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Utility function to handle rate limits with exponential backoff
const withRetry = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`Rate limit hit, retrying in ${delay.toFixed(0)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

export default function ProjectApplicationsManager({ project, onProjectUpdate }) {
  const [applications, setApplications] = useState([]);
  const [applicantProfiles, setApplicantProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);

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
      await withRetry(() => ProjectApplication.update(applicationId, { status: 'accepted' }));

      const updatedCollaborators = [...new Set([...(project.collaborator_emails || []), application.applicant_email])];
      const newCollaboratorsCount = updatedCollaborators.length;
      
      await withRetry(() => Project.update(project.id, {
        collaborator_emails: updatedCollaborators,
        current_collaborators_count: newCollaboratorsCount
      }));

      try {
        await base44.functions.invoke('awardPoints', {
          action: 'project_collaboration',
          user_email: application.applicant_email
        });
      } catch (error) {
        console.error("Error awarding points for collaboration:", error);
      }

      await withRetry(() => Notification.create({
        user_email: application.applicant_email,
        title: `Application accepted for "${project.title}"`,
        message: `Your application to join "${project.title}" has been accepted! Welcome to the team!`,
        type: "project_application",
        related_project_id: project.id,
        related_entity_id: applicationId,
        actor_email: project.created_by,
        actor_name: project.created_by,
      }));

      const existingCollaborators = project.collaborator_emails || [];
      const newApplicantProfile = applicantProfiles[application.applicant_email];
      const newApplicantName = newApplicantProfile?.full_name || application.applicant_email.split('@')[0];

      for (const collaboratorEmail of existingCollaborators) {
        if (collaboratorEmail !== project.created_by && collaboratorEmail !== application.applicant_email) {
          await withRetry(() => Notification.create({
            user_email: collaboratorEmail,
            title: "New team member added",
            message: `${newApplicantName} has joined "${project.title}".`,
            type: "project_member_added",
            related_project_id: project.id,
            related_entity_id: applicationId,
            actor_email: application.applicant_email,
            actor_name: newApplicantName,
          }));
        }
      }

      if (onProjectUpdate) onProjectUpdate();
      fetchApplications();
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
      await withRetry(() => ProjectApplication.update(applicationId, { status: 'rejected' }));
      
      await withRetry(() => Notification.create({
        user_email: application.applicant_email,
        title: `Application update for "${project.title}"`,
        message: `Your application to join "${project.title}" was not accepted at this time.`,
        type: 'project_application',
        related_project_id: project.id,
        related_entity_id: applicationId,
        actor_email: project.created_by,
        actor_name: project.created_by,
      }));

      fetchApplications();
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
    return null;
  }

  return (
    <Card className="cu-card mb-6">
      <CardHeader>
        <CardTitle>Pending Applications ({applications.length})</CardTitle>
        <CardDescription>Review applicant details, attachments, and respond to users who want to join your project.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {applications.map(app => {
          const profile = applicantProfiles[app.applicant_email] || {};
          const isExpanded = expandedApp === app.id;
          const hasAttachments = app.attachments && app.attachments.length > 0;
          const hasDetails = profile.bio || (profile.skills && profile.skills.length > 0) || app.description;

          return (
            <div key={app.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Top row: avatar + name + message preview + accept/decline */}
              <div className="flex items-start gap-3 p-3 bg-gray-50">
                <Avatar className="flex-shrink-0">
                  <AvatarImage src={profile.profile_image} />
                  <AvatarFallback>{(profile.full_name || '?').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{profile.full_name || app.applicant_email}</p>
                    {profile.username && (
                      <span className="text-xs text-gray-400">@{profile.username}</span>
                    )}
                    {hasAttachments && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        <Paperclip className="w-3 h-3" /> {app.attachments.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2 italic">"{app.message}"</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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

              {/* Expandable details section */}
              {(hasAttachments || hasDetails) && (
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-purple-600 hover:bg-purple-50/50 transition-colors"
                  >
                    {isExpanded ? (
                      <><ChevronUp className="w-3.5 h-3.5" /> Hide details</>
                    ) : (
                      <><ChevronDown className="w-3.5 h-3.5" /> View full details{hasAttachments ? ` & attachments` : ''}</>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3">
                      {/* Applicant profile link */}
                      {profile.username && (
                        <Link
                          to={createPageUrl(`UserProfile?username=${profile.username}`)}
                          className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          <UserIcon className="w-3.5 h-3.5" /> View full profile
                        </Link>
                      )}

                      {/* Bio */}
                      {profile.bio && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5 font-medium">About</p>
                          <p className="text-sm text-gray-700">{profile.bio}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {profile.skills && profile.skills.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 font-medium">Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.skills.map((skill, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional description from application */}
                      {app.description && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5 font-medium">Additional context</p>
                          <p className="text-sm text-gray-700">{app.description}</p>
                        </div>
                      )}

                      {/* Attachments */}
                      {hasAttachments && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1 font-medium">
                            <Paperclip className="w-3 h-3" /> Attachments ({app.attachments.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {app.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-200 hover:bg-purple-50/50 transition-colors"
                              >
                                {att.file_type === 'image' ? (
                                  <img src={att.file_url} alt={att.file_name} className="w-8 h-8 rounded object-cover" />
                                ) : (
                                  <FileText className="w-4 h-4 text-gray-500" />
                                )}
                                <span className="text-xs text-gray-600 truncate max-w-[140px]">{att.file_name || att.file_type}</span>
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}