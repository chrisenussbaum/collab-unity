import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, Flag, BookOpen, Wrench, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const COMMANDS = [
  { id: "task",      label: "Save as Task",       icon: CheckSquare, color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { id: "milestone", label: "Save as Milestone",  icon: Flag,        color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  { id: "note",      label: "Save as Note",        icon: BookOpen,    color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
  { id: "tool",      label: "Add a Tool",          icon: Wrench,      color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
];

export default function ChatCommandBar({ project, currentUser, messageContent, onSaved }) {
  const [activeCommand, setActiveCommand] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedCommands, setSavedCommands] = useState(new Set());

  const openCommand = (id) => {
    if (savedCommands.has(id)) return;
    // Pre-fill from message content (first line as title)
    const firstLine = messageContent?.split("\n").find(l => l.trim())?.replace(/^[#*\->\s]+/, "").trim() || "";
    const title = firstLine.slice(0, 80);

    if (id === "task") setFormData({ title, description: "" });
    else if (id === "milestone") setFormData({ title, description: "" });
    else if (id === "note") setFormData({ title, content: messageContent?.slice(0, 2000) || "" });
    else if (id === "tool") setFormData({ name: "", url: "" });

    setActiveCommand(activeCommand === id ? null : id);
  };

  const handleSave = async () => {
    if (!project?.id || !currentUser) return;
    setSaving(true);
    try {
      if (activeCommand === "task") {
        if (!formData.title?.trim()) { toast.error("Task title required"); return; }
        await base44.entities.Task.create({
          project_id: project.id,
          title: formData.title.trim(),
          description: formData.description?.trim() || "",
          status: "todo",
          priority: "medium",
        });
        toast.success("Task created!");
      } else if (activeCommand === "milestone") {
        if (!formData.title?.trim()) { toast.error("Milestone title required"); return; }
        await base44.entities.ProjectMilestone.create({
          project_id: project.id,
          title: formData.title.trim(),
          description: formData.description?.trim() || "",
          status: "not_started",
        });
        toast.success("Milestone created!");
      } else if (activeCommand === "note") {
        if (!formData.title?.trim()) { toast.error("Note title required"); return; }
        await base44.entities.Thought.create({
          project_id: project.id,
          title: formData.title.trim(),
          content: formData.content?.trim() || messageContent || "",
          last_edited_by: currentUser.email,
        });
        toast.success("Note saved to Thoughts!");
      } else if (activeCommand === "tool") {
        if (!formData.name?.trim() || !formData.url?.trim()) { toast.error("Tool name and URL required"); return; }
        try { new URL(formData.url); } catch { toast.error("Please enter a valid URL"); return; }
        // Tools are stored on the Project entity as project_tools array
        const current = project.project_tools || [];
        const updated = [...current, { name: formData.name.trim(), url: formData.url.trim(), icon: "🔧" }];
        await base44.entities.Project.update(project.id, { project_tools: updated });
        toast.success("Tool added to project!");
        if (onSaved) onSaved("tool", updated);
      }

      setSavedCommands(prev => new Set([...prev, activeCommand]));
      setActiveCommand(null);
      if (onSaved && activeCommand !== "tool") onSaved(activeCommand);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2">
      {/* Command chips */}
      <div className="flex flex-wrap gap-1.5">
        {COMMANDS.map(cmd => {
          const Icon = cmd.icon;
          const saved = savedCommands.has(cmd.id);
          const active = activeCommand === cmd.id;
          return (
            <button
              key={cmd.id}
              onClick={() => openCommand(cmd.id)}
              disabled={saved}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-all ${
                saved
                  ? "bg-gray-50 text-gray-400 border-gray-200 cursor-default"
                  : active
                    ? cmd.color + " ring-1 ring-offset-1 ring-current"
                    : cmd.color
              }`}
            >
              {saved ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              {saved ? "Saved!" : cmd.label}
              {active && !saved && <X className="w-3 h-3 ml-0.5" onClick={(e) => { e.stopPropagation(); setActiveCommand(null); }} />}
            </button>
          );
        })}
      </div>

      {/* Inline form */}
      {activeCommand && !savedCommands.has(activeCommand) && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-sm">
          {(activeCommand === "task" || activeCommand === "milestone") && (
            <>
              <Input
                value={formData.title || ""}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder={activeCommand === "task" ? "Task title..." : "Milestone title..."}
                className="text-sm"
              />
              <Textarea
                value={formData.description || ""}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)..."
                rows={2}
                className="text-sm resize-none"
              />
            </>
          )}
          {activeCommand === "note" && (
            <>
              <Input
                value={formData.title || ""}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Note title..."
                className="text-sm"
              />
              <Textarea
                value={formData.content || ""}
                onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                placeholder="Note content..."
                rows={4}
                className="text-sm resize-none"
              />
            </>
          )}
          {activeCommand === "tool" && (
            <>
              <Input
                value={formData.name || ""}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Tool name (e.g. Figma, Notion)..."
                className="text-sm"
              />
              <Input
                value={formData.url || ""}
                onChange={e => setFormData(p => ({ ...p, url: e.target.value }))}
                placeholder="URL (https://...)..."
                className="text-sm"
              />
            </>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="cu-button text-xs h-7 px-3" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-7 px-3" onClick={() => setActiveCommand(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}