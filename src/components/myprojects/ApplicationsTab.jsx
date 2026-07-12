import React, { useState, useCallback, useEffect } from "react";
import { Send, Inbox, Loader2, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import MyProjectApplicationsPanel from "@/components/myprojects/MyProjectApplicationsPanel";
import ProjectApplicationsManager from "@/components/ProjectApplicationsManager";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function ApplicationsTab({ currentUser }) {
  const [subTab, setSubTab] = useState("mine");
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [receivedAppsCount, setReceivedAppsCount] = useState(0);
  const [isLoadingReceived, setIsLoadingReceived] = useState(false);

  const fetchReceivedApplications = useCallback(async () => {
    if (!currentUser?.email) return;
    setIsLoadingReceived(true);
    try {
      const createdProjects = await base44.entities.Project.filter(
        { created_by: currentUser.email },
        "-created_date"
      );

      // Fetch pending applications for each owned project in parallel
      const appsByProject = await Promise.all(
        createdProjects.map(async (project) => {
          try {
            const apps = await base44.entities.ProjectApplication.filter({
              project_id: project.id,
              status: "pending",
            });
            return { project, count: apps.length };
          } catch (e) {
            return { project, count: 0 };
          }
        })
      );

      // Only keep projects that have pending applications
      const withApps = appsByProject.filter((item) => item.count > 0);
      setOwnedProjects(withApps.map((item) => item.project));
      setReceivedAppsCount(withApps.reduce((sum, item) => sum + item.count, 0));
    } catch (error) {
      console.error("Error fetching received applications:", error);
      toast.error("Could not load received applications.");
    } finally {
      setIsLoadingReceived(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      fetchReceivedApplications();
    }
  }, [currentUser, fetchReceivedApplications]);

  const handleProjectUpdate = () => {
    fetchReceivedApplications();
  };

  const SUB_TABS = [
    { key: "mine", label: "My Applications", icon: Send },
    { key: "received", label: "Received", icon: Inbox, count: receivedAppsCount },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {SUB_TABS.map((tab) => {
          const isActive = subTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                isActive
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === "received" && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {receivedAppsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {subTab === "mine" ? (
        <MyProjectApplicationsPanel currentUser={currentUser} />
      ) : isLoadingReceived ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading received applications...</p>
        </div>
      ) : ownedProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Inbox className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            No pending applications
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-6">
            When people apply to collaborate on your projects, their applications will appear here for you to review, along with their message and attachments.
          </p>
          <Link to={createPageUrl("MyProjects")}>
            <Button className="cu-button">
              <Lightbulb className="w-5 h-5 mr-2" />
              View My Projects
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {ownedProjects.map((project) => (
            <ProjectApplicationsManager
              key={project.id}
              project={project}
              onProjectUpdate={handleProjectUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}