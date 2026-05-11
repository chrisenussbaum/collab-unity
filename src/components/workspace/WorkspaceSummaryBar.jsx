import React, { useState } from "react";
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import {
  CheckSquare, Flag, Activity, ChevronDown, ChevronUp,
  Circle, AlertTriangle, CheckCircle2, Clock, TrendingUp
} from "lucide-react";

const STATUS_CONFIG = {
  seeking_collaborators: { label: "Seeking Collaborators", color: "text-blue-600",   bg: "bg-blue-50",   dot: "bg-blue-500" },
  in_progress:           { label: "In Progress",           color: "text-purple-600", bg: "bg-purple-50", dot: "bg-purple-500" },
  completed:             { label: "Completed",              color: "text-green-600",  bg: "bg-green-50",  dot: "bg-green-500" },
};

export default function WorkspaceSummaryBar({ project, tasks = [], milestones = [], activityLogs = [], onSectionClick }) {
  const [collapsed, setCollapsed] = useState(false);

  // ── Task stats
  const doneTasks       = tasks.filter(t => t.status === "done").length;
  const inProgTasks     = tasks.filter(t => t.status === "in_progress").length;
  const todoTasks       = tasks.filter(t => t.status === "todo").length;
  const overdueTasks    = tasks.filter(t => t.due_date && t.status !== "done" && new Date(t.due_date) < new Date()).length;
  const completionPct   = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  // ── Upcoming milestones (next 3, not completed, with a due date)
  const upcomingMilestones = milestones
    .filter(m => !m.completed && m.due_date)
    .map(m => ({ ...m, dateObj: parseISO(m.due_date) }))
    .filter(m => isValid(m.dateObj))
    .sort((a, b) => a.dateObj - b.dateObj)
    .slice(0, 3);

  // ── Recent activity (last 3)
  const recentActivity = [...activityLogs]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 3);

  const statusCfg = STATUS_CONFIG[project?.status] || STATUS_CONFIG.in_progress;

  if (collapsed) {
    return (
      <div className="border-b border-gray-100 bg-white">
        <button
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${statusCfg.dot} flex-shrink-0`} />
            <span className="text-xs font-semibold text-gray-700">Project Summary</span>
            <span className="text-xs text-gray-400">{completionPct}% complete · {inProgTasks} in progress · {upcomingMilestones.length} upcoming milestones</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 bg-white">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>
        <button onClick={() => setCollapsed(true)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100 border-t border-gray-100">

        {/* ── Task progress ── */}
        <button
          onClick={() => onSectionClick?.("tasks")}
          className="flex flex-col gap-1.5 px-3 py-2.5 hover:bg-purple-50/50 transition-colors text-left group"
        >
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-700">Tasks</span>
            {overdueTasks > 0 && (
              <span className="ml-auto flex items-center gap-0.5 text-red-500 text-[10px] font-semibold">
                <AlertTriangle className="w-2.5 h-2.5" />{overdueTasks} overdue
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-0.5"><Circle className="w-2 h-2 text-gray-300" />{todoTasks} to do</span>
            <span className="flex items-center gap-0.5"><Clock className="w-2 h-2 text-blue-400" />{inProgTasks} active</span>
            <span className="flex items-center gap-0.5"><CheckCircle2 className="w-2 h-2 text-green-500" />{doneTasks} done</span>
          </div>
        </button>

        {/* ── Upcoming milestones ── */}
        <button
          onClick={() => onSectionClick?.("milestones")}
          className="flex flex-col gap-1 px-3 py-2.5 hover:bg-orange-50/50 transition-colors text-left group"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <Flag className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-700">Milestones</span>
          </div>
          {upcomingMilestones.length === 0 ? (
            <p className="text-[10px] text-gray-400">No upcoming milestones</p>
          ) : (
            upcomingMilestones.map((m, i) => {
              const days = differenceInDays(m.dateObj, new Date());
              const overdue = days < 0;
              return (
                <div key={m.id || i} className="flex items-center justify-between gap-1 min-w-0">
                  <p className="text-[10px] text-gray-600 truncate leading-tight">{m.title || m.name}</p>
                  <span className={`text-[10px] font-medium flex-shrink-0 ${overdue ? "text-red-500" : days <= 7 ? "text-orange-500" : "text-gray-400"}`}>
                    {overdue ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d`}
                  </span>
                </div>
              );
            })
          )}
        </button>

        {/* ── Recent activity ── */}
        <button
          onClick={() => onSectionClick?.("activity")}
          className="flex flex-col gap-1 px-3 py-2.5 hover:bg-green-50/50 transition-colors text-left group"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <Activity className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-700">Activity</span>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-[10px] text-gray-400">No recent activity</p>
          ) : (
            recentActivity.map((log, i) => (
              <div key={log.id || i} className="flex items-start gap-1 min-w-0">
                <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                <p className="text-[10px] text-gray-600 leading-tight line-clamp-1">{log.action_description}</p>
              </div>
            ))
          )}
        </button>
      </div>
    </div>
  );
}