import React from "react";
import {
  Sparkles, Lightbulb, Flag, CheckSquare, FileStack, Wrench,
  BookOpen, Activity, Image as ImageIcon, BarChart3
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

export function buildFrameDefs(props) {
  const {
    project, currentUser, projectUsers,
    isOwner, isCollaborator, onProjectUpdate,
    refreshTasks, refreshMilestones, navigateToFrame,
    tasks, milestones, assets,
  } = props;

  const canEdit = isCollaborator || isOwner;
  const projectOwnerName = project?.created_by
    ? (projectUsers?.find(u => u.email === project.created_by)?.full_name
        || project.created_by.split("@")[0]
        || "The project owner")
    : "The project owner";

  return [
    {
      id: "assistant", title: "Project Assistant", icon: Sparkles, w: 540, h: 580, fill: true,
      render: () => (
        <AIChat
          project={project} tasks={tasks} milestones={milestones} assets={assets}
          currentUser={currentUser} canEdit={canEdit} projectUsers={projectUsers}
          onProjectUpdate={onProjectUpdate} onNavigateTo={navigateToFrame}
          onTasksChanged={refreshTasks} onMilestonesChanged={refreshMilestones}
          buildLinks={[]} activityLogs={[]} fitContainer
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