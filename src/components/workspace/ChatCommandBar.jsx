import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Flag, BookOpen, Wrench, X, Check, Zap } from "lucide-react";
import { toast } from "sonner";

const COMMANDS = [
  { id: "task",      label: "Create Task",       icon: CheckSquare, color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { id: "milestone", label: "Add Milestone",     icon: Flag,        color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  { id: "note",      label: "Save Note",          icon: BookOpen,    color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
  { id: "tool",      label: "Add Tool",           icon: Wrench,      color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
];

// Pull a plausible title from the first meaningful line of an AI message
function extractTitle(content) {
  if (!content) return "";
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const clean = line.replace(/^[#*\->•\d.]+\s*/, "").replace(/\*\*/g, "").trim();
    if (clean.length > 4 && clean.length < 120) return clean.slice(0, 80);
  }
  return "";
}

// Try to detect a due date hint like "Due Date: [Insert a due date]"
function extractDueDate(content) {
  const match = content?.match(/due\s*date[:\s]+([^\n\[\]]+)/i);
  if (!match) return "";
  const raw = match[1].trim();
  // Ignore placeholder text
  if (/insert|assign|tbd|tbf|\[/i.test(raw)) return "";
  // Try parsing as a real date
  const d = new Date(raw);
  if (!isNaN(d)) return d.toISOString().split("T")[0];
  return "";
}

// Try to detect assignee hint
function extractAssignee(content) {
  const match = content?.match(/assignee[:\s]+([^\n\[\]]+)/i);
  if (!match) return "";
  const raw = match[1].trim();
  if (/assign|tbd|team|members|\[/i.test(raw)) return "";
  return raw.slice(0, 60);
}

export default function ChatCommandBar({ project, currentUser, messageContent, projectUsers = [], onSaved }) {
  const [activeCommand, setActiveCommand] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedCommands, setSavedCommands] = useState(new Set());

  const collaboratorOptions = useMemo(() => {
    const users = projectUsers || [];
    return users.map(u => ({ email: u.email, name: u.full_name || u.email }));
  }, [projectUsers]);

  const openCommand = (id) => {
    if (savedCommands.has(id)) return;
    const title = extractTitle(messageContent);
    const due_date = extractDueDate(messageContent);
    const assignee_hint = extractAssignee(messageContent);

    if (id === "task") setFormData({ title, description: "", priority: "medium", due_date, assigned_to: assignee_hint });
    else if (id === "milestone") setFormData({ title, description: "", due_date });
    else if (id === "note") setFormData({ title, content: messageContent?.slice(0, 2000) || "" });
    else if (id === "tool") setFormData({ name: "", url: "" });

    setActiveCommand(activeCommand === id ? null : id);
  };

  const handleSave = async () => {
    if (!project?.id || !currentUser) return;
    setSaving(true);
    try {
      if (activeCommand === "task") {
        if (!formData.title?.trim()) { toast.error("Task title required"); setSaving(false); return; }
        await base44.entities.Task.create({
          project_id: project.id,
          title: formData.title.trim(),
          description: formData.description?.trim() || "",
          status: "todo",
          priority: formData.priority || "medium",
          due_date: formData.due_date || undefined,
          assigned_to: formData.assigned_to?.trim() || undefined,
        });
        toast.success("Task created!");
      } else if (activeCommand === "milestone") {
        if (!formData.title?.trim()) { toast.error("Milestone title required"); setSaving(false); return; }
        await base44.entities.ProjectMilestone.create({
          project_id: project.id,
          title: formData.title.trim(),
          description: formData.description?.trim() || "",
          status: "not_started",
          due_date: formData.due_date || undefined,
        });
        toast.success("Milestone created!");
      } else if (activeCommand === "note") {
        if (!formData.title?.trim()) { toast.error("Note title required"); setSaving(false); return; }
        await base44.entities.Thought.create({
          project_id: project.id,
          title: formData.title.trim(),
          content: formData.content?.trim() || messageContent || "",
          last_edited_by: currentUser.email,
        });
        toast.success("Note saved!");
      } else if (activeCommand === "tool") {
        if (!formData.name?.trim() || !formData.url?.trim()) { toast.error("Tool name and URL required"); setSaving(false); return; }
        try { new URL(formData.url); } catch { toast.error("Please enter a valid URL"); setSaving(false); return; }
        const current = project.project_tools || [];
        const updated = [...current, { name: formData.name.trim(), url: formData.url.trim(), icon: "🔧" }];
        await base44.entities.Project.update(project.id, { project_tools: updated });
        toast.success("Tool added!");
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
              {saved ? "Done!" : cmd.label}
              {active && !saved && (
                <X className="w-3 h-3 ml-0.5" onClick={(e) => { e.stopPropagation(); setActiveCommand(null); }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Inline execute form */}
      {activeCommand && !savedCommands.has(activeCommand) && (
        <div className="mt-2 p-3 bg-white border border-purple-200 rounded-xl shadow-sm space-y-2 text-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-semibold text-purple-700">
              {activeCommand === "task" ? "Create Task" :
               activeCommand === "milestone" ? "Add Milestone" :
               activeCommand === "note" ? "Save Note" : "Add Tool"}
            </span>
            <span className="text-xs text-gray-400 ml-1">— review & execute</span>
          </div>

          {/* Task form */}
          {activeCommand === "task" && (
            <>
              <Input
                value={formData.title || ""}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Task title..."
                className="text-sm"
              />
              <Textarea
                value={formData.description || ""}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)..."
                rows={2}
                className="text-sm resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                  <Select value={formData.priority || "medium"} onValueChange={v => setFormData(p => ({ ...p, priority: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={formData.due_date || ""}
                    onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Assign To</label>
                {collaboratorOptions.length > 0 ? (
                  <Select value={formData.assigned_to || ""} onValueChange={v => setFormData(p => ({ ...p, assigned_to: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select collaborator..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Unassigned</SelectItem>
                      {collaboratorOptions.map(u => (
                        <SelectItem key={u.email} value={u.email}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.assigned_to || ""}
                    onChange={e => setFormData(p => ({ ...p, assigned_to: e.target.value }))}
                    placeholder="Email or name..."
                    className="h-8 text-xs"
                  />
                )}
              </div>
            </>
          )}

          {/* Milestone form */}
          {activeCommand === "milestone" && (
            <>
              <Input
                value={formData.title || ""}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Milestone title..."
                className="text-sm"
              />
              <Textarea
                value={formData.description || ""}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)..."
                rows={2}
                className="text-sm resize-none"
              />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date || ""}
                  onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </>
          )}

          {/* Note form */}
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

          {/* Tool form */}
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
            <Button
              size="sm"
              className="cu-button text-xs h-7 px-3 gap-1"
              onClick={handleSave}
              disabled={saving}
            >
              <Zap className="w-3 h-3" />
              {saving ? "Executing..." : "Execute"}
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