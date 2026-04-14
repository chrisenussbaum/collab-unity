import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Flag, Users, Clock, TrendingUp, Activity, Link, Target, AlertCircle, Star } from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

// ---- Milestone Progress Widget ----
export const MilestoneWidget = ({ milestones = [] }) => {
  const completed = milestones.filter(m => m.status === 'completed').length;
  const total = milestones.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const upcoming = milestones.filter(m => m.status !== 'completed').slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{completed}<span className="text-lg text-gray-400">/{total}</span></p>
          <p className="text-xs text-gray-500">Milestones completed</p>
        </div>
        <div className="p-3 rounded-full bg-purple-100">
          <Flag className="w-6 h-6 text-purple-600" />
        </div>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs font-medium text-purple-600">{progress.toFixed(0)}% complete</p>
      {upcoming.length > 0 && (
        <div className="pt-2 border-t space-y-1">
          <p className="text-xs text-gray-500 font-medium">Up next:</p>
          {upcoming.map(m => (
            <div key={m.id} className="flex items-center gap-2 text-xs text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
              <span className="truncate">{m.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---- Task Progress Widget ----
export const TaskWidget = ({ tasks = [] }) => {
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const total = tasks.length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{done}<span className="text-lg text-gray-400">/{total}</span></p>
          <p className="text-xs text-gray-500">Tasks completed</p>
        </div>
        <div className="p-3 rounded-full bg-blue-100">
          <CheckCircle className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex gap-3 text-xs">
        <span className="text-green-600 font-medium">✓ {done} done</span>
        <span className="text-blue-600 font-medium">⟳ {inProgress} active</span>
        <span className="text-gray-500">○ {todo} todo</span>
      </div>
    </div>
  );
};

// ---- Team Widget ----
export const TeamWidget = ({ project, projectUsers = [] }) => {
  const collaborators = project?.collaborator_emails || [];
  const members = projectUsers.filter(u => collaborators.includes(u.email));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{collaborators.length}</p>
          <p className="text-xs text-gray-500">Team members</p>
        </div>
        <div className="p-3 rounded-full bg-green-100">
          <Users className="w-6 h-6 text-green-600" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {members.slice(0, 6).map(user => (
          <div key={user.email} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-2 py-1">
            {user.profile_image ? (
              <img src={user.profile_image} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-purple-200 flex items-center justify-center text-[8px] font-bold text-purple-700">
                {user.full_name?.[0] || '?'}
              </div>
            )}
            <span className="text-xs text-gray-700 truncate max-w-[80px]">{user.full_name?.split(' ')[0] || user.email.split('@')[0]}</span>
          </div>
        ))}
        {collaborators.length > 6 && (
          <div className="flex items-center justify-center bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-500">
            +{collaborators.length - 6} more
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Overall Progress Widget ----
export const ProgressWidget = ({ milestones = [], tasks = [], project }) => {
  const milestoneProgress = milestones.length > 0
    ? (milestones.filter(m => m.status === 'completed').length / milestones.length) * 100 : 0;
  const taskProgress = tasks.length > 0
    ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0;
  const overall = ((milestoneProgress + taskProgress) / 2).toFixed(0);

  const statusColors = {
    seeking_collaborators: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  };
  const statusLabels = {
    seeking_collaborators: '🔍 Seeking Collaborators',
    in_progress: '🚀 In Progress',
    completed: '✅ Completed',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Overall Completion</p>
        <span className="text-xl font-bold text-purple-600">{overall}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-500"
          style={{ width: `${overall}%` }}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Milestones</span>
          <span className="font-medium">{milestoneProgress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${milestoneProgress}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Tasks</span>
          <span className="font-medium">{taskProgress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${taskProgress}%` }} />
        </div>
      </div>
      {project?.status && (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </div>
      )}
    </div>
  );
};

// ---- Recent Activity Widget ----
export const ActivityWidget = ({ logs = [] }) => {
  const recent = logs.slice(0, 5);
  return (
    <div className="space-y-2">
      {recent.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
      ) : recent.map((log, i) => (
        <div key={log.id || i} className="flex items-start gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Activity className="w-3 h-3 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-800 leading-snug">{log.action_description}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {log.user_name?.split('@')[0] || 'Someone'} · {log.created_date ? formatDistanceToNow(parseISO(log.created_date), { addSuffix: true }) : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---- Quick Links Widget ----
export const QuickLinksWidget = ({ project }) => {
  const links = project?.project_urls || [];
  return (
    <div className="space-y-2">
      {links.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No project links added yet</p>
      ) : links.map((link, i) => {
        let domain = '';
        try { domain = new URL(link.url).hostname; } catch {}
        return (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
              alt=""
              className="w-5 h-5 flex-shrink-0"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <span className="text-sm text-gray-700 group-hover:text-purple-600 truncate flex-1">
              {link.title || domain}
            </span>
            <Link className="w-3 h-3 text-gray-300 group-hover:text-purple-400 flex-shrink-0" />
          </a>
        );
      })}
    </div>
  );
};

// ---- Key Metrics Widget ----
export const MetricsWidget = ({ milestones = [], tasks = [], project, logs = [] }) => {
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    return new Date(t.due_date) < new Date();
  }).length;
  const thisWeekActivity = logs.filter(l => {
    if (!l.created_date) return false;
    const diff = (new Date() - new Date(l.created_date)) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const metrics = [
    { label: 'Urgent Tasks', value: urgentTasks, color: urgentTasks > 0 ? 'text-red-600' : 'text-gray-400', bg: urgentTasks > 0 ? 'bg-red-50' : 'bg-gray-50' },
    { label: 'Overdue', value: overdueTasks, color: overdueTasks > 0 ? 'text-orange-600' : 'text-gray-400', bg: overdueTasks > 0 ? 'bg-orange-50' : 'bg-gray-50' },
    { label: 'Activity (7d)', value: thisWeekActivity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Tasks', value: tasks.length, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map(m => (
        <div key={m.label} className={`${m.bg} rounded-lg p-3 text-center`}>
          <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
        </div>
      ))}
    </div>
  );
};

// ---- Quick Actions Widget ----
export const QuickActionsWidget = ({ onTabChange }) => {
  const actions = [
    { label: 'View Milestones', tab: 'milestones', icon: Flag, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
    { label: 'Manage Tasks', tab: 'tasks', icon: CheckCircle, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
    { label: 'Plan & Brainstorm', tab: 'planning', icon: Target, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
    { label: 'View Activity', tab: 'activity', icon: Activity, color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
    { label: 'Assets & Files', tab: 'assets', icon: Star, color: 'text-pink-600 bg-pink-50 hover:bg-pink-100' },
    { label: 'Build Workspace', tab: 'build', icon: AlertCircle, color: 'text-gray-600 bg-gray-50 hover:bg-gray-100' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map(a => {
        const Icon = a.icon;
        return (
          <button
            key={a.tab}
            onClick={() => onTabChange?.(a.tab)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${a.color}`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-left leading-tight">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
};