import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Trash2,
  Loader2,
  RefreshCw,
  CheckSquare,
  User as UserIcon,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

const PRIORITY_COLORS = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function MilestoneTaskGeneratorDialog({
  open,
  onOpenChange,
  milestone,
  project,
  collaborators,
  existingTasks,
  onSaved,
}) {
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const collaboratorOptions = React.useMemo(
    () => (collaborators || []).filter((c) => c?.email),
    [collaborators]
  );

  const generateTasks = useCallback(async () => {
    if (!milestone) return;
    setIsGenerating(true);
    setGeneratedTasks([]);
    try {
      const collaboratorList =
        collaboratorOptions.length > 0
          ? collaboratorOptions
              .map((u) => `- ${u.full_name || u.email} (${u.email})`)
              .join("\n")
          : "No collaborators yet";
      const existingTaskList =
        (existingTasks || []).length > 0
          ? existingTasks
              .map(
                (t) =>
                  `- ${t.title}${
                    t.milestone_id === milestone.id ? " (this milestone)" : ""
                  }`
              )
              .join("\n")
          : "None";
      const today = new Date().toISOString().split("T")[0];

      const prompt = `Break down this project milestone into 3-6 concrete, actionable tasks.

PROJECT: ${project?.title || "Untitled"}
${project?.description ? `Description: ${project.description}` : ""}

MILESTONE: ${milestone.title}
${milestone.description ? `Description: ${milestone.description}` : ""}
${milestone.target_date ? `Target date: ${milestone.target_date.split("T")[0]}` : ""}

COLLABORATORS:
${collaboratorList}

EXISTING TASKS (avoid duplicating these):
${existingTaskList}

Today's date: ${today}

Generate tasks that:
- Are concrete and actionable (3-6 word titles, details go in description)
- Have realistic priorities (urgent/high for critical path, medium/low for nice-to-have)
- Are assigned to the most appropriate collaborator by their exact email (or empty string if unclear)
- Have due dates that make sense relative to the milestone target date${
        milestone.target_date
          ? ` (on or before ${milestone.target_date.split("T")[0]})`
          : ""
      } and today (${today})
- Together cover the full scope of work needed to complete this milestone`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                  },
                  assigned_to: {
                    type: "string",
                    description: "collaborator email or empty string",
                  },
                  due_date: {
                    type: "string",
                    description: "YYYY-MM-DD or empty string",
                  },
                },
                required: ["title", "description", "priority"],
              },
            },
          },
          required: ["tasks"],
        },
      });

      const tasks = (response?.tasks || [])
        .map((t) => ({
          title: (t.title || "").trim(),
          description: (t.description || "").trim(),
          priority: PRIORITIES.includes(t.priority) ? t.priority : "medium",
          assigned_to: t.assigned_to || "",
          due_date: t.due_date || "",
        }))
        .filter((t) => t.title);

      setGeneratedTasks(tasks);
      if (tasks.length === 0) {
        toast.error("Couldn't generate tasks. Please try again.");
      }
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast.error("Failed to generate tasks. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [milestone, project, collaboratorOptions, existingTasks]);

  // Reset & generate when dialog opens
  useEffect(() => {
    if (open && milestone) {
      generateTasks();
    }
    if (!open) {
      setGeneratedTasks([]);
    }
  }, [open, milestone?.id]);

  const handleRemoveTask = (index) => {
    setGeneratedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTask = (index, field, value) => {
    setGeneratedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const handleSave = async () => {
    if (generatedTasks.length === 0) return;
    setIsSaving(true);
    try {
      const tasksToCreate = generatedTasks.map((t) => ({
        project_id: project.id,
        milestone_id: milestone.id,
        title: t.title,
        description: t.description || "",
        priority: t.priority,
        status: "todo",
        assigned_to: t.assigned_to || undefined,
        due_date: t.due_date || undefined,
      }));
      await base44.entities.Task.bulkCreate(tasksToCreate);
      toast.success(
        `Created ${tasksToCreate.length} task${
          tasksToCreate.length !== 1 ? "s" : ""
        } for "${milestone.title}"!`
      );
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving tasks:", error);
      toast.error("Failed to save tasks.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!milestone) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Break "{milestone.title}" into tasks
          </DialogTitle>
          <DialogDescription>
            AI-drafted tasks based on the milestone and your team. Review, edit, or
            remove before saving.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-1 py-2 space-y-3">
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-sm text-gray-500">
                Drafting tasks for this milestone…
              </p>
            </div>
          )}

          {!isGenerating && generatedTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-gray-500">
                No tasks generated. Try again?
              </p>
              <Button variant="outline" size="sm" onClick={generateTasks}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Regenerate
              </Button>
            </div>
          )}

          {!isGenerating &&
            generatedTasks.map((task, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 space-y-2.5 bg-white hover:border-purple-200 transition-colors"
              >
                {/* Title row */}
                <div className="flex items-start gap-2">
                  <Input
                    value={task.title}
                    onChange={(e) =>
                      handleUpdateTask(index, "title", e.target.value)
                    }
                    className="font-medium text-sm flex-1"
                    placeholder="Task title"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500 flex-shrink-0"
                    onClick={() => handleRemoveTask(index)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Description */}
                <Textarea
                  value={task.description}
                  onChange={(e) =>
                    handleUpdateTask(index, "description", e.target.value)
                  }
                  rows={2}
                  className="text-xs text-gray-600 resize-none"
                  placeholder="Task description"
                />

                {/* Priority + Assignee + Due date */}
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={task.priority}
                    onValueChange={(v) =>
                      handleUpdateTask(index, "priority", v)
                    }
                  >
                    <SelectTrigger className="h-8 w-auto text-xs gap-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          PRIORITY_COLORS[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p} className="text-xs">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border mr-1 ${PRIORITY_COLORS[p]}`}
                          >
                            {p}
                          </span>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                    <UserIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <Select
                      value={task.assigned_to || "unassigned"}
                      onValueChange={(v) =>
                        handleUpdateTask(
                          index,
                          "assigned_to",
                          v === "unassigned" ? "" : v
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned" className="text-xs">
                          Unassigned
                        </SelectItem>
                        {collaboratorOptions.map((c) => (
                          <SelectItem
                            key={c.email}
                            value={c.email}
                            className="text-xs"
                          >
                            {c.full_name || c.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <Input
                      type="date"
                      value={task.due_date}
                      onChange={(e) =>
                        handleUpdateTask(index, "due_date", e.target.value)
                      }
                      className="h-8 text-xs w-[130px]"
                    />
                  </div>
                </div>
              </div>
            ))}

          {!isGenerating && generatedTasks.length > 0 && (
            <button
              onClick={generateTasks}
              className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium py-1"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate tasks
            </button>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckSquare className="w-3.5 h-3.5" />
            {generatedTasks.length} task
            {generatedTasks.length !== 1 ? "s" : ""} ready to save
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || generatedTasks.length === 0}
              className="cu-button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                  Save {generatedTasks.length} Task
                  {generatedTasks.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}