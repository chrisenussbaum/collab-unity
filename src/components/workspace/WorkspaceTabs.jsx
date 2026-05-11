import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import BuildTab from './BuildTab';

const WorkspaceTabs = ({ project, currentUser, projectUsers, onProjectUpdate, isCollaborator, isProjectOwner }) => {
  const [tasks, setTasks] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [assets, setAssets] = React.useState([]);

  const projectOwnerName = project?.created_by ?
    (projectUsers?.find(u => u.email === project.created_by)?.full_name ||
     project.created_by.split('@')[0] ||
     "The project owner") : "The project owner";

  useEffect(() => {
    if (!project?.id) return;
    base44.entities.Task.filter({ project_id: project.id }).then(setTasks).catch(() => {});
    base44.entities.ProjectMilestone.filter({ project_id: project.id }).then(setMilestones).catch(() => {});
    base44.entities.AssetVersion.filter({ project_id: project.id }).then(setAssets).catch(() => {});
  }, [project?.id]);

  return (
    <div className="w-full">
      <BuildTab
        project={project}
        currentUser={currentUser}
        isCollaborator={isCollaborator}
        isProjectOwner={isProjectOwner}
        projectOwnerName={projectOwnerName}
        projectUsers={projectUsers}
        onProjectUpdate={onProjectUpdate}
        tasks={tasks}
        setTasks={setTasks}
        milestones={milestones}
        setMilestones={setMilestones}
        assets={assets}
      />
    </div>
  );
};

export default WorkspaceTabs;