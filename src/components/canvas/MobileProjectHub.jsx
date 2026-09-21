import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Monitor, MessageCircle } from "lucide-react";
import MobileProjectDetails from "./MobileProjectDetails";
import TaskBoard from "@/components/workspace/TaskBoard";
import MilestonesTab from "@/components/workspace/MilestonesTab";
import AssetsTab from "@/components/workspace/AssetsTab";
import ProjectChatPanel from "./ProjectChatPanel";

const STATUS_LABELS = {
  seeking_collaborators: "Seeking Collaborators",
  in_progress: "In Progress",
  completed: "Completed",
};

// Mobile replacement for the desktop canvas: a popup encouraging desktop use,
// plus full mobile access to project details, tasks, milestones, assets and chat.
// Members get every tab; visitors get the details view with the apply button.
export default function MobileProjectHub({
  project,
  currentUser,
  projectUsers,
  isOwner,
  isCollaborator,
  canApply,
  onApply,
}) {
  const isMember = isOwner || isCollaborator;
  const [tab, setTab] = useState("details");
  const [showChat, setShowChat] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [noticeOpen, setNoticeOpen] = useState(() => {
    try {
      return !localStorage.getItem(`cu_mobile_hub_notice_${project?.id}`);
    } catch {
      return true;
    }
  });

  const projectOwnerName = project?.created_by
    ? projectUsers?.find((u) => u.email === project.created_by)?.full_name ||
      project.created_by.split("@")[0]
    : "The project owner";

  useEffect(() => {
    if (!project?.id) return;
    base44.entities.Task.filter({ project_id: project.id })
      .then((t) => setTasks(Array.isArray(t) ? t : []))
      .catch(() => {});
  }, [project?.id]);

  const refreshTasks = () => {
    if (!project?.id) return;
    base44.entities.Task.filter({ project_id: project.id })
      .then((t) => setTasks(Array.isArray(t) ? t : []))
      .catch(() => {});
  };

  const dismissNotice = () => {
    try {
      localStorage.setItem(`cu_mobile_hub_notice_${project?.id}`, "1");
    } catch {}
    setNoticeOpen(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
      {/* Desktop recommendation popup — shown once per project */}
      <Dialog open={noticeOpen} onOpenChange={(open) => { if (!open) dismissNotice(); }}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl cu-gradient flex items-center justify-center shadow-lg mb-3">
            <Monitor className="w-7 h-7 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle>Launch on desktop for the optimal experience</DialogTitle>
            <DialogDescription className="pt-2">
              The interactive project canvas is built for larger screens. You can
              still browse project details and use key features right here on
              mobile.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={dismissNotice} className="cu-button w-full mt-2">
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      {/* Project header */}
      <div className="mb-4 flex items-center gap-3">
        {project.logo_url ? (
          <img
            src={project.logo_url}
            alt={project.title}
            className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm flex-shrink-0"
          />
        ) : (
          <span className="w-10 h-10 rounded-full cu-gradient text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
            {(project.title || "P").slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 leading-tight truncate">
            {project.title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-purple-600 text-white">
              {STATUS_LABELS[project.status] || project.status}
            </Badge>
            <span className="text-xs text-gray-500">
              by {projectOwnerName}
            </span>
          </div>
        </div>
      </div>

      {isMember ? (
        <>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <MobileProjectDetails
                project={project}
                projectUsers={projectUsers}
                canApply={canApply}
                onApply={onApply}
              />
            </TabsContent>

            <TabsContent value="tasks">
              <TaskBoard
                project={project}
                currentUser={currentUser}
                collaborators={projectUsers}
                isCollaborator={isCollaborator}
                isProjectOwner={isOwner}
                projectOwnerName={projectOwnerName}
              />
            </TabsContent>

            <TabsContent value="milestones">
              <MilestonesTab
                project={project}
                currentUser={currentUser}
                isCollaborator={isCollaborator}
                isProjectOwner={isOwner}
                projectUsers={projectUsers}
                tasks={tasks}
                onTasksCreated={refreshTasks}
              />
            </TabsContent>

            <TabsContent value="assets">
              <AssetsTab
                project={project}
                currentUser={currentUser}
                isCollaborator={isCollaborator}
                isProjectOwner={isOwner}
                projectOwnerName={projectOwnerName}
              />
            </TabsContent>
          </Tabs>

          <Button onClick={() => setShowChat(true)} className="cu-button w-full mt-4">
            <MessageCircle className="w-4 h-4 mr-2" />
            Project Chat
          </Button>

          <ProjectChatPanel
            open={showChat}
            onClose={() => setShowChat(false)}
            project={project}
            currentUser={currentUser}
            projectUsers={projectUsers}
          />
        </>
      ) : (
        <MobileProjectDetails
          project={project}
          projectUsers={projectUsers}
          canApply={canApply}
          onApply={onApply}
        />
      )}
    </div>
  );
}