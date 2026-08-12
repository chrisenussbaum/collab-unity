import React from "react";
import {
  Sparkles, Lightbulb, Flag, CheckSquare, FileStack, Wrench,
  BookOpen, Activity, Image as ImageIcon, Link2, BarChart3, Heart, DollarSign
} from "lucide-react";
import TaskBoard from "../workspace/TaskBoard";
import MilestonesTab from "../workspace/MilestonesTab";
import AssetsTab from "../workspace/AssetsTab";
import ActivityTab from "../workspace/ActivityTab";
import ThoughtsTab from "../workspace/ThoughtsTab";
import IdeationHub from "../workspace/ideation/IdeationHub";
import ToolsHub from "../workspace/ToolsHub";
import { AIChat } from "../workspace/BuildTab";
import ProjectHighlights from "../project/ProjectHighlights";
import ProjectAnalyticsDashboard from "../project/ProjectAnalyticsDashboard";
import ProjectFundingCard from "../ProjectFundingCard";
import SocialsPanel from "../SocialsPanel";
import MicrolinkPreview from "../MicrolinkPreview";

export function buildFrameDefs(props) {
  const {
    project, currentUser, projectUsers, projectOwnerProfile,
    isOwner, isCollaborator, onProjectUpdate, onUpdateSocialLinks,
    refreshTasks, refreshMilestones, navigateToFrame,
    tasks, milestones, assets,
  } = props;

  const canEdit = isCollaborator || isOwner;
  const projectOwnerName = project?.created_by
    ? (projectUsers?.find(u => u.email === project.created_by)?.full_name
        || project.created_by.split("@")[0]
        || "The project owner")
    : "The project owner";

  const showcase = (
    <div className="p-3 space-y-3">
      {project?.project_urls?.length ? (
        project.project_urls.map((l, i) => {
          const url = typeof l === "object" ? l.url : l;
          const title = typeof l === "object" ? l.title : "";
          return <MicrolinkPreview key={i} url={url} title={title || ""} className="w-full" />;
        })
      ) : (
        <p className="text-sm text-gray-400">No showcase links yet. Add them via Edit Project.</p>
      )}
    </div>
  );

  return [
    {
      id: "assistant", title: "AI Assistant", icon: Sparkles, w: 540, h: 580,
      render: () => (
        <AIChat
          project={project} tasks={tasks} milestones={milestones} assets={assets}
          currentUser={currentUser} canEdit={canEdit} projectUsers={projectUsers}
          onProjectUpdate={onProjectUpdate} onNavigateTo={navigateToFrame}
          onTasksChanged={refreshTasks} onMilestonesChanged={refreshMilestones}
          buildLinks={[]} activityLogs={[]}
        />
      ),
    },
    {
      id: "tasks", title: "Tasks", icon: CheckSquare, w: 560, h: 520,
      render: () => (
        <TaskBoard
          project={project} currentUser={currentUser} collaborators={projectUsers}
          isCollaborator={isCollaborator} isProjectOwner={isOwner} projectOwnerName={projectOwnerName}
        />
      ),
    },
    {
      id: "milestones", title: "Milestones", icon: Flag, w: 480, h: 440,
      render: () => (
        <MilestonesTab
          project={project} currentUser={currentUser}
          isCollaborator={isCollaborator} isProjectOwner={isOwner}
          projectUsers={projectUsers} tasks={tasks} onTasksCreated={refreshTasks}
        />
      ),
    },
    {
      id: "highlights", title: "Highlights", icon: ImageIcon, w: 460, h: 420,
      render: () => (
        <ProjectHighlights
          project={project} currentUser={currentUser}
          isCollaborator={canEdit} onProjectUpdate={onProjectUpdate}
        />
      ),
    },
    {
      id: "analytics", title: "Analytics", icon: BarChart3, w: 460, h: 420,
      render: () => (
        <ProjectAnalyticsDashboard
          project={project} currentUser={currentUser} isCollaborator={canEdit}
        />
      ),
    },
    {
      id: "links", title: "Showcase Links", icon: Link2, w: 420, h: 360,
      render: () => showcase,
    },
    {
      id: "funding", title: "Funding", icon: DollarSign, w: 360, h: 320,
      render: () => (
        <ProjectFundingCard
          project={project} projectOwner={projectOwnerProfile}
          canEdit={isOwner} onUpdate={onProjectUpdate}
        />
      ),
    },
    {
      id: "social", title: "Social Media", icon: Heart, w: 360, h: 320,
      render: () => (
        <SocialsPanel
          socialLinks={project?.social_links || {}}
          onUpdate={onUpdateSocialLinks}
          canEdit={isOwner}
          title="Social Media"
          emptyMessage="Add social media links to promote this project"
        />
      ),
    },
    {
      id: "ideation", title: "Planning & Ideation", icon: Lightbulb, w: 480, h: 460,
      render: () => (
        <IdeationHub
          project={project} currentUser={currentUser}
          isCollaborator={isCollaborator} isProjectOwner={isOwner} projectOwnerName={projectOwnerName}
        />
      ),
    },
    {
      id: "assets", title: "Assets", icon: FileStack, w: 520, h: 420,
      render: () => (
        <AssetsTab
          project={project} currentUser={currentUser}
          isCollaborator={isCollaborator} isProjectOwner={isOwner} projectOwnerName={projectOwnerName}
        />
      ),
    },
    {
      id: "tools", title: "Project Tools", icon: Wrench, w: 420, h: 360,
      render: () => (
        <ToolsHub
          project={project} onProjectUpdate={onProjectUpdate}
          isCollaborator={isCollaborator} isProjectOwner={isOwner} projectOwnerName={projectOwnerName}
        />
      ),
    },
    {
      id: "notes", title: "Thoughts & Notes", icon: BookOpen, w: 420, h: 380,
      render: () => (
        <ThoughtsTab
          project={project} currentUser={currentUser}
          isCollaborator={isCollaborator} isProjectOwner={isOwner} projectOwnerName={projectOwnerName}
        />
      ),
    },
    {
      id: "activity", title: "Activity", icon: Activity, w: 420, h: 400,
      render: () => (
        <ActivityTab
          project={project} currentUser={currentUser}
          isCollaborator={isCollaborator} isProjectOwner={isOwner} projectOwnerName={projectOwnerName}
        />
      ),
    },
  ];
}