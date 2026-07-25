import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Target,
  CheckCircle2,
  SkipForward,
  X,
  Calendar,
  User,
  Flag,
  Clock,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  low: { label: "Low", color: "bg-blue-100 text-blue-700" },
};

export default function FocusModeCard({
  task,
  milestone,
  assignedUser,
  onExit,
  onStart,
  onComplete,
  onSkip,
}) {
  if (!task) {
    return (
      <Card className="cu-card border-purple-200">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            All caught up!
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            No tasks assigned to you right now. Great work!
          </p>
          <Button onClick={onExit} variant="outline">
            Back to task board
          </Button>
        </CardContent>
      </Card>
    );
  }

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const isOverdue =
    task.due_date &&
    task.status !== "done" &&
    new Date(task.due_date) < new Date();
  const daysLeft = task.due_date
    ? differenceInDays(parseISO(task.due_date), new Date())
    : null;

  return (
    <Card className="cu-card border-2 border-purple-300 shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-semibold text-purple-600">
              Focus Mode
            </span>
            <span className="text-xs text-gray-400">
              · This is your top priority right now
            </span>
          </div>
          <button
            onClick={onExit}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Exit focus mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${priority.color}`}
            >
              {priority.label}
            </span>
            {task.status === "in_progress" && (
              <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                <Clock className="w-3 h-3" /> In Progress
              </span>
            )}
            {isOverdue && (
              <span className="text-xs font-medium text-red-500">
                Overdue
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>

          {task.description && (
            <p className="text-sm text-gray-600">{task.description}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
            {task.due_date && (
              <span
                className={`flex items-center gap-1 ${
                  isOverdue ? "text-red-500 font-medium" : ""
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {isOverdue
                  ? `${Math.abs(daysLeft)}d overdue`
                  : daysLeft === 0
                  ? "Due today"
                  : `Due in ${daysLeft}d`}
                {" · "}
                {format(parseISO(task.due_date), "MMM d")}
              </span>
            )}
            {milestone && (
              <span className="flex items-center gap-1">
                <Flag className="w-3.5 h-3.5" />
                {milestone.title}
              </span>
            )}
            {assignedUser && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {assignedUser.full_name ||
                  assignedUser.email.split("@")[0]}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-6">
          {task.status !== "done" && (
            <>
              {task.status === "todo" && (
                <Button
                  onClick={onStart}
                  variant="outline"
                  className="flex-1"
                >
                  <Clock className="w-4 h-4 mr-1.5" />
                  Start working
                </Button>
              )}
              <Button onClick={onComplete} className="cu-button flex-1">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Mark as done
              </Button>
            </>
          )}
          <Button onClick={onSkip} variant="ghost" className="text-gray-500">
            <SkipForward className="w-4 h-4 mr-1.5" />
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}