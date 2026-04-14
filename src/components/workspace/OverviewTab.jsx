import React from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import CustomizableDashboard from './dashboard/CustomizableDashboard';

const OverviewTab = ({ project, currentUser, isCollaborator, isProjectOwner, projectOwnerName, projectUsers, onProjectUpdate, onTabChange }) => {
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', project?.id],
    queryFn: () => base44.entities.ProjectMilestone.filter({ project_id: project.id }),
    enabled: !!project?.id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', project?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: project.id }),
    enabled: !!project?.id,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['activity_logs', project?.id],
    queryFn: () => base44.entities.ActivityLog.filter({ project_id: project.id }, '-created_date', 20),
    enabled: !!project?.id,
  });

  const { data: buildRecords = [] } = useQuery({
    queryKey: ['build_workspace', project?.id],
    queryFn: () => base44.entities.ProjectIDE.filter({ project_id: project.id, ide_type: 'document', title: '__build_workspace__' }),
    enabled: !!project?.id,
  });

  const buildWorkspaceData = buildRecords?.[0]?.content || null;

  if (!project) return <p className="text-gray-400 text-sm">Loading project overview...</p>;

  return (
    <CustomizableDashboard
      project={project}
      currentUser={currentUser}
      projectUsers={projectUsers || []}
      milestones={milestones}
      tasks={tasks}
      logs={logs}
      onTabChange={onTabChange}
      buildWorkspaceData={buildWorkspaceData}
    />
  );
};

export default OverviewTab;