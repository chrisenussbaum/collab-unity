import React from "react";
import {
  Sparkles, CheckSquare, Flag, FileStack, Image as ImageIcon, StickyNote
} from "lucide-react";
import TaskBoard from "../workspace/TaskBoard";
import MilestonesTab from "../workspace/MilestonesTab";
import AssetsTab from "../workspace/AssetsTab";
import { AIChat } from "../workspace/BuildTab";
import ProjectHighlights from "../project/ProjectHighlights";
import SharedScratchpad from "../workspace/SharedScratchpad";

// The canvas holds only the day-to-day work product: plan, build, capture.
// Project management surfaces (details, funding, social, showcase, team)
// live off-canvas in the consolidated Project Settings dialog.
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
      id: "tasks", title: "Tasks", icon: CheckSquare, w: 560, h: 520,
      render: () => (
        <TaskBoard
          project={project} currentUser={currentUser} collaborators={projectUsers}
          isCollaborator={isCollaborator} isProjectOwner={isOwner} projectOwnerName={projectOwnerName}
        />
      ),
    },
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
      id: "assets", title: "Assets", icon: FileStack, w: 520, h: 420,
      render: () => (
        <AssetsTab
          project={project} currentUser={currentUser}
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
      id: "notes", title: "Notes", icon: StickyNote, w: 440, h: 420, fill: true,
      render: () => (
        <SharedScratchpad
          project={project} currentUser={currentUser} isCollaborator={canEdit}
        />
      ),
    },
  ];
}