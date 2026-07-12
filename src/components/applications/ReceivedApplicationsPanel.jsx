import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { getPublicUserProfiles } from '@/functions/getPublicUserProfiles';
import { useApplicationActions } from '@/hooks/useApplicationActions';
import ApplicationDetailCard from '@/components/applications/ApplicationDetailCard';
import InterviewDialog from '@/components/InterviewDialog';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, Lightbulb } from 'lucide-react';

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

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "interviewing", label: "Interviewing" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Declined" },
];

export default function ReceivedApplicationsPanel({ currentUser }) {
  const [applications, setApplications] = useState([]);
  const [projectsMap, setProjectsMap] = useState({});
  const [applicantProfiles, setApplicantProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchReceived = useCallback(async () => {
    if (!currentUser?.email) return;
    setIsLoading(true);
    try {
      const ownedProjects = await withRetry(() =>
        base44.entities.Project.filter({ created_by: currentUser.email }, "-created_date", 100)
      );
      const projectMap = {};
      (ownedProjects || []).forEach(p => { projectMap[p.id] = p; });
      setProjectsMap(projectMap);

      const projectIds = (ownedProjects || []).map(p => p.id);
      if (projectIds.length === 0) {
        setApplications([]);
        return;
      }

      const allApps = await withRetry(() =>
        base44.entities.ProjectApplication.filter(
          { project_id: { $in: projectIds } },
          "-created_date",
          200
        )
      );
      setApplications(allApps || []);

      const emails = [...new Set((allApps || []).map(a => a.applicant_email).filter(Boolean))];
      if (emails.length > 0) {
        try {
          const { data: profiles } = await getPublicUserProfiles({ emails });
          const profilesMap = {};
          (profiles || []).forEach(p => { profilesMap[p.email] = p; });
          setApplicantProfiles(profilesMap);
        } catch (e) {
          console.error("Error fetching profiles:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching received applications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchReceived();
  }, [fetchReceived]);

  const {
    isProcessing,
    interviewCtx,
    setInterviewCtx,
    handleAccept,
    handleReject,
    handleInterview,
  } = useApplicationActions({ onComplete: fetchReceived });

  const filteredApps = applications.filter(app => filter === "all" || app.status === filter);
  const countByStatus = (status) => applications.filter(a => a.status === status).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading received applications...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Inbox className="w-12 h-12 text-purple-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No applications received</h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-6">
          When someone applies to join your projects, their applications will appear here for you to review with full details and attachments.
        </p>
        <Link to={createPageUrl("Feed")}>
          <Button className="cu-button">
            <Lightbulb className="w-5 h-5 mr-2" />
            Browse Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Inbox className="w-5 h-5 text-purple-600" />
          Received Applications
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Review applications from users who want to join your projects. Expand each to see their message, attachments, and profile details.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {FILTER_TABS.map((tab) => {
          const count = tab.key === "all" ? applications.length : countByStatus(tab.key);
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                isActive
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications list */}
      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 capitalize">
            No {filter !== "all" ? filter : ""} applications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <ApplicationDetailCard
              key={app.id}
              application={app}
              project={projectsMap[app.project_id]}
              applicantProfile={applicantProfiles[app.applicant_email]}
              isProcessing={isProcessing}
              onAccept={handleAccept}
              onReject={handleReject}
              onStartInterview={(application, project) => setInterviewCtx({ application, project })}
              showProjectContext
            />
          ))}
        </div>
      )}

      {/* Interview dialog */}
      {interviewCtx && (
        <InterviewDialog
          open={!!interviewCtx}
          onOpenChange={(open) => !open && setInterviewCtx(null)}
          application={interviewCtx.application}
          project={interviewCtx.project}
          onConfirm={handleInterview}
        />
      )}
    </div>
  );
}