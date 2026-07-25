import React, { useState } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  UserPlus,
  Flag,
  Sparkles,
  Loader2,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function BlockersPanel({
  tasks = [],
  milestones = [],
  collaborators = [],
  onTaskUpdated,
  onSectionClick,
}) {
  const [expanded, setExpanded] = useState(true);
  const [activeAction, setActiveAction] = useState(null); // { type, taskId }
  const [isUpdating, setIsUpdating] = useState(false);

  const overdueTasks = tasks.filter(
    (t) =>
      t.due_date &&
      t.status !== "done" &&
      new Date(t.due_date) < new Date()
  );
  const unassignedTasks = tasks.filter(
    (t) => !t.assigned_to && t.status !== "done"
  );
  const emptyMilestones = milestones.filter(
    (m) =>
      m.status !== "completed" &&
      !tasks.some((t) => t.milestone_id === m.id)
  );

  const total =
    overdueTasks.length + unassignedTasks.length + emptyMilestones.length;
  if (total === 0) return null;

  const collaboratorOptions = collaborators.filter((c) => c?.email);

  const handleAssign = async (taskId, email) => {
    setIsUpdating(true);
    try {
      await base44.entities.Task.update(taskId, { assigned_to: email });
      const name =
        collaboratorOptions.find((c) => c.email === email)?.full_name ||
        email.split("@")[0];
      toast.success(`Assigned to ${name}`);
      setActiveAction(null);
      onTaskUpdated?.();
    } catch {
      toast.error("Failed to assign task.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReschedule = async (taskId, newDate) => {
    if (!newDate) return;
    setIsUpdating(true);
    try {
      await base44.entities.Task.update(taskId, { due_date: newDate });
      toast.success("Due date updated!");
      setActiveAction(null);
      onTaskUpdated?.();
    } catch {
      toast.error("Failed to update due date.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNudge = async (task) => {
    if (!task.assigned_to) {
      toast.error("This task has no assignee to nudge.");
      return;
    }
    setIsUpdating(true);
    try {
      const assigneeName =
        collaborators.find((c) => c.email === task.assigned_to)?.full_name ||
        task.assigned_to.split("@")[0];
      await base44.functions.invoke("sendNotification", {
        recipient_email: task.assigned_to,
        title: "Friendly nudge",
        message: `Just checking in on "${task.title}" — it's past due. Can you share an update or a new ETA?`,
        type: "project_task_overdue",
        related_project_id: task.project_id,
        related_entity_id: task.id,
        actor_email: "system@collabunity.io",
        actor_name: "Collab Unity",
        metadata: { task_title: task.title, nudge_type: "manual" },
      });
      toast.success(`Nudged ${assigneeName}`);
    } catch {
      toast.error("Failed to send nudge.");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderRescheduleAction = (task) => {
    const isActive =
      activeAction?.taskId === task.id && activeAction.type === "reschedule";
    if (isActive) {
      return (
        <Input
          type="date"
          autoFocus
          className="h-7 w-[130px] text-xs flex-shrink-0"
          defaultValue={
            task.due_date ? format(parseISO(task.due_date), "yyyy-MM-dd") : ""
          }
          disabled={isUpdating}
          onChange={(e) =>
            e.target.value && handleReschedule(task.id, e.target.value)
          }
        />
      );
    }
    return (
      <button
        onClick={() =>
          setActiveAction({ type: "reschedule", taskId: task.id })
        }
        className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-700 font-medium px-1.5 py-0.5 rounded hover:bg-purple-50 flex-shrink-0"
      >
        <CalendarIcon className="w-3 h-3" />
        Reschedule
      </button>
    );
  };

  const renderAssignAction = (task) => {
    const isActive =
      activeAction?.taskId === task.id && activeAction.type === "assign";
    if (isActive) {
      return (
        <Select
          onValueChange={(v) => handleAssign(task.id, v)}
          disabled={isUpdating}
        >
          <SelectTrigger className="h-7 w-[140px] text-xs flex-shrink-0">
            <SelectValue placeholder="Assign to…" />
          </SelectTrigger>
          <SelectContent>
            {collaboratorOptions.length === 0 ? (
              <SelectItem value="_none" disabled className="text-xs">
                No collaborators
              </SelectItem>
            ) : (
              collaboratorOptions.map((c) => (
                <SelectItem
                  key={c.email}
                  value={c.email}
                  className="text-xs"
                >
                  {c.full_name || c.email}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      );
    }
    return (
      <button
        onClick={() => setActiveAction({ type: "assign", taskId: task.id })}
        className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-700 font-medium px-1.5 py-0.5 rounded hover:bg-purple-50 flex-shrink-0"
      >
        <UserPlus className="w-3 h-3" />
        Assign
      </button>
    );
  };

  return (
    <div className="border-b border-orange-100 bg-orange-50/40">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-orange-50/60 transition-colors"
      >
        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-700">
          Needs Attention
        </span>
        <span className="text-xs text-orange-600 font-medium">
          {total} item{total !== 1 ? "s" : ""}
        </span>
        <span className="ml-auto">
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-1.5 max-h-[280px] overflow-y-auto">
          {/* Overdue tasks */}
          {overdueTasks.map((task) => {
            const daysLate = Math.abs(
              differenceInDays(parseISO(task.due_date), new Date())
            );
            return (
              <div
                key={task.id}
                className="flex items-center gap-2 py-1.5 border-b border-orange-100/50 last:border-0"
              >
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold text-red-600 border-red-200 bg-red-50 px-1 py-0 flex-shrink-0"
                >
                  OVERDUE
                </Badge>
                <p className="text-xs text-gray-700 truncate flex-1 min-w-0">
                  {task.title}
                </p>
                <span className="text-[10px] text-red-500 font-medium flex-shrink-0">
                  {daysLate}d late
                </span>
                {task.assigned_to && (
                  <button
                    onClick={() => handleNudge(task)}
                    disabled={isUpdating}
                    className="flex items-center gap-1 text-[10px] text-orange-600 hover:text-orange-700 font-medium px-1.5 py-0.5 rounded hover:bg-orange-50 flex-shrink-0 disabled:opacity-50"
                    title="Send a friendly reminder to the assignee"
                  >
                    <Bell className="w-3 h-3" />
                    Nudge
                  </button>
                )}
                {renderRescheduleAction(task)}
              </div>
            );
          })}

          {/* Unassigned tasks */}
          {unassignedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 py-1.5 border-b border-orange-100/50 last:border-0"
            >
              <Badge
                variant="outline"
                className="text-[9px] font-bold text-orange-600 border-orange-200 bg-orange-50 px-1 py-0 flex-shrink-0"
              >
                UNASSIGNED
              </Badge>
              <p className="text-xs text-gray-700 truncate flex-1 min-w-0">
                {task.title}
              </p>
              {renderAssignAction(task)}
            </div>
          ))}

          {/* Milestones with no tasks */}
          {emptyMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center gap-2 py-1.5 border-b border-orange-100/50 last:border-0"
            >
              <Badge
                variant="outline"
                className="text-[9px] font-bold text-amber-600 border-amber-200 bg-amber-50 px-1 py-0 flex-shrink-0"
              >
                NO TASKS
              </Badge>
              <Flag className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-gray-700 truncate flex-1 min-w-0">
                {milestone.title}
              </p>
              <button
                onClick={() => onSectionClick?.("milestones")}
                className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-700 font-medium px-1.5 py-0.5 rounded hover:bg-purple-50 flex-shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                Add tasks
              </button>
            </div>
          ))}

          {isUpdating && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating…
            </div>
          )}
        </div>
      )}
    </div>
  );
}