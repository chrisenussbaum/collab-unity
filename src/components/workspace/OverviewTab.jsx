import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Flag, Users, Clock, LayoutGrid, AlertCircle, TrendingUp } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const OverviewTab = ({ project, currentUser, isCollaborator, isProjectOwner, projectOwnerName, projectUsers, onProjectUpdate }) => {
  const [milestoneStats, setMilestoneStats] = useState({ completed: 0, total: 0, progress: 0 });
  const [taskStats, setTaskStats] = useState({ completed: 0, total: 0, progress: 0 });

  // Fetch milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      return await base44.entities.ProjectMilestone.filter({ project_id: project.id });
    },
    enabled: !!project?.id,
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      return await base44.entities.Task.filter({ project_id: project.id });
    },
    enabled: !!project?.id,
  });

  // Calculate stats
  useEffect(() => {
    if (milestones.length > 0) {
      const completed = milestones.filter(m => m.status === 'completed').length;
      const total = milestones.length;
      setMilestoneStats({ completed, total, progress: total > 0 ? (completed / total) * 100 : 0 });
    }
  }, [milestones]);

  useEffect(() => {
    if (tasks.length > 0) {
      const completed = tasks.filter(t => t.status === 'done').length;
      const total = tasks.length;
      setTaskStats({ completed, total, progress: total > 0 ? (completed / total) * 100 : 0 });
    }
  }, [tasks]);

  if (!project) {
    return <p>Loading project overview...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="cu-card">
        <CardHeader>
          <CardTitle className="flex items-center cu-text-responsive-lg font-bold">
            <LayoutGrid className="w-6 h-6 mr-2 text-purple-600" />
            Project Overview
          </CardTitle>
          <CardDescription>A snapshot of your project's current status and key metrics</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50">
            <div className="p-2 rounded-full bg-purple-100">
              <Flag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Milestones</p>
              <p className="text-2xl font-bold text-gray-900">{milestoneStats.completed}/{milestoneStats.total}</p>
              <p className="text-xs text-purple-600 font-medium">{milestoneStats.progress.toFixed(0)}% Complete</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
            <div className="p-2 rounded-full bg-blue-100">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.completed}/{taskStats.total}</p>
              <p className="text-xs text-blue-600 font-medium">{taskStats.progress.toFixed(0)}% Complete</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
            <div className="p-2 rounded-full bg-green-100">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Collaborators</p>
              <p className="text-2xl font-bold text-gray-900">{project.collaborator_emails?.length || 0}</p>
              <p className="text-xs text-green-600 font-medium">Active Team</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <div className="p-2 rounded-full bg-gray-100">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Last Activity</p>
              <p className="text-lg font-bold text-gray-900">{project.updated_date ? formatDistanceToNow(parseISO(project.updated_date), { addSuffix: true }) : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="cu-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Completion</span>
                <span className="text-sm font-bold text-purple-600">
                  {((milestoneStats.progress + taskStats.progress) / 2).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((milestoneStats.progress + taskStats.progress) / 2).toFixed(0)}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                <strong>Status:</strong>{' '}
                <Badge variant="outline" className="ml-2">
                  {project.status === 'seeking_collaborators' && '🔍 Seeking Collaborators'}
                  {project.status === 'in_progress' && '🚀 In Progress'}
                  {project.status === 'completed' && '✅ Completed'}
                </Badge>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cu-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-700 space-y-2">
              <p>• Navigate to <strong>Milestones</strong> to define key project goals</p>
              <p>• Use <strong>Tasks</strong> to break down work into actionable items</p>
              <p>• Visit <strong>Planning</strong> to brainstorm and organize ideas</p>
              <p>• Check <strong>Discussion</strong> for team communication</p>
              <p>• Upload resources in <strong>Assets</strong> for easy access</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;