import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Flag, BookOpen, Wrench, X, Check, Zap, ChevronDown, ChevronUp, Plus, Trash2, Lightbulb, Map, FileText, Link2 } from "lucide-react";
import { toast } from "sonner";
import ToolPickerDialog from "./ToolPickerDialog";
import ResourceLinkDialog from "./ResourceLinkDialog";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Tool icon lookup (mirrors ToolsHub)
function getToolIcon(toolName) {
  const name = (toolName || "").toLowerCase();
  const map = {
    figma: "🎨", slack: "💬", trello: "📋", jira: "🔷", notion: "📝",
    github: "🐙", gitlab: "🦊", "vs code": "💻", miro: "🖼️", discord: "🎮",
    asana: "✅", zoom: "📹", canva: "🖌️", airtable: "📊", linear: "⚡",
    clickup: "✓", dropbox: "📦", vercel: "▲", netlify: "🌐", firebase: "🔥",
    supabase: "⚡", stripe: "💳", loom: "📹", calendly: "📅", typeform: "📝",
    webflow: "🌊", shopify: "🛍️", aws: "☁️", google: "🔍", monday: "📆",
  };
  for (const [key, icon] of Object.entries(map)) {
    if (name.includes(key)) return icon;
  }
  return "🔧";
}

// Tool URL lookup
const TOOL_URLS = {
  figma: "https://figma.com", notion: "https://notion.so", trello: "https://trello.com",
  asana: "https://asana.com", jira: "https://atlassian.com/software/jira",
  github: "https://github.com", gitlab: "https://gitlab.com", slack: "https://slack.com",
  discord: "https://discord.com", linear: "https://linear.app", clickup: "https://clickup.com",
  miro: "https://miro.com", canva: "https://canva.com", framer: "https://framer.com",
  vercel: "https://vercel.com", netlify: "https://netlify.com", firebase: "https://firebase.google.com",
  supabase: "https://supabase.com", airtable: "https://airtable.com", loom: "https://loom.com",
  zoom: "https://zoom.us", typeform: "https://typeform.com", webflow: "https://webflow.com",
  stripe: "https://stripe.com", zapier: "https://zapier.com", postman: "https://postman.com",
};

const COMMANDS = [
  { id: "task",       label: "Create Task",    icon: CheckSquare, color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { id: "milestone",  label: "Add Milestone",  icon: Flag,        color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  { id: "note",       label: "Save Note",      icon: BookOpen,    color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
  { id: "tool",       label: "Add Tool",       icon: Wrench,      color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
  { id: "resource",   label: "Add Resource",   icon: Link2,       color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
];

// Generate context-aware AI action prompts based on project state
function getAIActions(project, tasks, milestones) {
  const title = project?.title || "this project";
  const todoCount = tasks?.filter(t => t.status === "todo").length || 0;
  const overdueCount = tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length || 0;
  const unassignedCount = tasks?.filter(t => !t.assigned_to && t.status !== "done").length || 0;
  const milestoneCount = milestones?.length || 0;
  const hasTasks = (tasks?.length || 0) > 0;
  const hasMilestones = milestoneCount > 0;

  // Build context-specific prompts
  const brainstormPrompt = hasTasks
    ? `Brainstorm new ideas and features for "${title}". We already have ${tasks.length} tasks. What creative angles or approaches haven't we considered yet? Be specific.`
    : `Brainstorm the key ideas, features, and goals for "${title}". What should we focus on building first? Give me 5-7 concrete, actionable ideas.`;

  const planPrompt = hasMilestones
    ? `Create a detailed step-by-step action plan for "${title}". We have ${milestoneCount} milestone${milestoneCount !== 1 ? "s" : ""} set${hasTasks ? ` and ${tasks.length} tasks` : " but no tasks yet"}. Break this down into clear next actions.`
    : `Create a complete project plan for "${title}" — define the main phases/milestones, break each into tasks, and give us a realistic timeline. Be specific and actionable.`;

  const briefPrompt = `Write a comprehensive project brief for "${title}" that includes: project overview, goals & objectives, target audience, key deliverables, success metrics, and timeline. Base it on the actual project details.`;

  // Context-specific extra actions
  const extraActions = [];
  if (overdueCount > 0) {
    extraActions.push({
      id: "overdue", label: `Review ${overdueCount} Overdue`, icon: CheckSquare,
      prompt: `I have ${overdueCount} overdue task${overdueCount > 1 ? "s" : ""} in "${title}". Help me triage them — which should I prioritize and which can be rescheduled or removed?`,
      color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
    });
  }
  if (unassignedCount > 0 && todoCount > 0) {
    extraActions.push({
      id: "assign", label: `Assign ${unassignedCount} Tasks`, icon: CheckSquare,
      prompt: `I have ${unassignedCount} unassigned task${unassignedCount > 1 ? "s" : ""} in "${title}". Help me figure out how to assign them effectively based on the project needs.`,
      color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
    });
  }
  if (!hasMilestones && hasTasks) {
    extraActions.push({
      id: "milestones", label: "Add Milestones", icon: Flag,
      prompt: `"${title}" has ${tasks.length} tasks but no milestones. Help me define 3-5 meaningful milestones that group these tasks into phases or goals.`,
      color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
    });
  }

  return [
    { id: "brainstorm", label: "Brainstorm",  icon: Lightbulb, prompt: brainstormPrompt, color: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" },
    { id: "plan",       label: "Make a Plan", icon: Map,       prompt: planPrompt,       color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
    { id: "brief",      label: "Write Brief", icon: FileText,  prompt: briefPrompt,      color: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100" },
    ...extraActions.slice(0, 2),
  ];
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatCommandBar({ project, currentUser, messageContent, projectUsers = [], tasks = [], milestones = [], onSaved, onProjectUpdate, onAIAction }) {
  const [activeCommand, setActiveCommand] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedCommands, setSavedCommands] = useState(new Set());
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);

  // For task form — list of task items user can edit/remove
  const [taskItems, setTaskItems] = useState([]);
  // For milestone form
  const [milestoneItems, setMilestoneItems] = useState([]);
  // For note form
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  // For tool form — list of tool items
  const [toolItems, setToolItems] = useState([]);

  const collaboratorOptions = useMemo(() => (projectUsers || []).map(u => ({ email: u.email, name: u.full_name || u.email })), [projectUsers]);

  const openCommand = (id) => {
    if (savedCommands.has(id)) return;
    if (id === "tool") { setToolDialogOpen(true); return; }
    if (id === "resource") { setResourceDialogOpen(true); return; }
    if (activeCommand === id) { setActiveCommand(null); return; }

    if (id === "task") {
      setTaskItems([{ title: "", description: "", priority: "medium", due_date: "", assigned_to: "" }]);
    }
    if (id === "milestone") {
      setMilestoneItems([{ title: "", description: "", target_date: "" }]);
    }
    if (id === "note") {
      setNoteForm({ title: "", content: messageContent?.slice(0, 3000) || "" });
    }

    setActiveCommand(id);
  };

  // ── Update helpers ──
  const updateTask = (i, field, val) => setTaskItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const removeTask = (i) => setTaskItems(prev => prev.filter((_, idx) => idx !== i));
  const addTask = () => setTaskItems(prev => [...prev, { title: "", description: "", priority: "medium", due_date: "", assigned_to: "" }]);

  const updateMilestone = (i, field, val) => setMilestoneItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const removeMilestone = (i) => setMilestoneItems(prev => prev.filter((_, idx) => idx !== i));
  const addMilestone = () => setMilestoneItems(prev => [...prev, { title: "", description: "", target_date: "" }]);

  const updateTool = (i, field, val) => setToolItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const removeTool = (i) => setToolItems(prev => prev.filter((_, idx) => idx !== i));
  const addTool = () => setToolItems(prev => [...prev, { name: "", url: "" }]);

  // ── Execute ──
  const handleSave = async () => {
    if (!project?.id || !currentUser) return;
    setSaving(true);
    try {
      if (activeCommand === "task") {
        const valid = taskItems.filter(t => t.title?.trim());
        if (!valid.length) { toast.error("Add at least one task title"); setSaving(false); return; }
        await Promise.all(valid.map(t => base44.entities.Task.create({
          project_id: project.id,
          title: t.title.trim(),
          description: t.description?.trim() || "",
          status: "todo",
          priority: t.priority || "medium",
          due_date: t.due_date || undefined,
          assigned_to: t.assigned_to?.trim() || undefined,
        })));
        toast.success(`${valid.length} task${valid.length > 1 ? "s" : ""} created!`);
        if (onProjectUpdate) onProjectUpdate();
      }

      else if (activeCommand === "milestone") {
        const valid = milestoneItems.filter(m => m.title?.trim());
        if (!valid.length) { toast.error("Add at least one milestone title"); setSaving(false); return; }
        await Promise.all(valid.map(m => base44.entities.ProjectMilestone.create({
          project_id: project.id,
          title: m.title.trim(),
          description: m.description?.trim() || "",
          status: "not_started",
          target_date: m.target_date || undefined,
        })));
        toast.success(`${valid.length} milestone${valid.length > 1 ? "s" : ""} created!`);
        if (onProjectUpdate) onProjectUpdate();
      }

      else if (activeCommand === "note") {
        if (!noteForm.title?.trim()) { toast.error("Note title required"); setSaving(false); return; }
        await base44.entities.Thought.create({
          project_id: project.id,
          title: noteForm.title.trim(),
          content: noteForm.content?.trim() || messageContent || "",
          last_edited_by: currentUser.email,
        });
        toast.success("Note saved!");
        if (onProjectUpdate) onProjectUpdate();
      }

      setSavedCommands(prev => new Set([...prev, activeCommand]));
      setActiveCommand(null);
      if (onSaved && activeCommand !== "tool") onSaved(activeCommand);
    } finally {
      setSaving(false);
    }
  };

  // Add tools via the ToolPickerDialog
  const handleAddTools = async (tools) => {
    if (!project?.id) return;
    setSaving(true);
    try {
      const current = Array.isArray(project.project_tools) ? project.project_tools : [];
      const existingUrls = new Set(current.map(t => t.url));
      const newTools = tools.filter(t => !existingUrls.has(t.url));
      if (newTools.length === 0) {
        toast("Those tools are already in your project");
        return;
      }
      const updated = [...current, ...newTools];
      await base44.entities.Project.update(project.id, { project_tools: updated });
      toast.success(`${newTools.length} tool${newTools.length > 1 ? "s" : ""} added to Project Tools!`);
      if (onProjectUpdate) onProjectUpdate();
      if (onSaved) onSaved("tool", updated);
    } catch (e) {
      toast.error("Failed to add tools");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 overflow-hidden">
      {/* Command chips — horizontal scroll on mobile/tablet */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
        {/* AI action chips — context-aware */}
        {onAIAction && getAIActions(project, tasks, milestones).map(action => (
          <button
            key={action.id}
            onClick={() => onAIAction(action.prompt)}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${action.color}`}
          >
            <action.icon className="w-3 h-3" />
            {action.label}
          </button>
        ))}
        {COMMANDS.map(cmd => {
          const Icon = cmd.icon;
          const saved = savedCommands.has(cmd.id);
          const active = activeCommand === cmd.id;
          return (
            <button
              key={cmd.id}
              onClick={() => openCommand(cmd.id)}
              disabled={saved}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                saved
                  ? "bg-gray-50 text-gray-400 border-gray-200 cursor-default"
                  : active
                    ? cmd.color + " ring-1 ring-offset-0 ring-current"
                    : cmd.color
              }`}
            >
              {saved ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              {saved ? "Done!" : cmd.label}
              {active && !saved && (
                <X className="w-3 h-3 ml-0.5 opacity-60" onClick={(e) => { e.stopPropagation(); setActiveCommand(null); }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Execute form ── */}
      {activeCommand && !savedCommands.has(activeCommand) && (
        <div className="mt-2 p-3 bg-white border border-purple-200 rounded-xl shadow-sm text-sm space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-purple-700">
                {activeCommand === "task" ? "Create Tasks" :
                 activeCommand === "milestone" ? "Add Milestones" :
                 activeCommand === "note" ? "Save Note" : "Add Tools"}
              </span>
              <span className="text-xs text-gray-400">— review & execute</span>
            </div>
            <button onClick={() => setActiveCommand(null)} className="text-gray-300 hover:text-gray-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ─── TASK form ─── */}
          {activeCommand === "task" && (
            <div className="space-y-2">
              {taskItems.map((item, i) => (
                <div key={i} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                  <div className="flex gap-1.5 items-start">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-400 mt-2 flex-shrink-0" />
                    <Input
                      value={item.title}
                      onChange={e => updateTask(i, "title", e.target.value)}
                      placeholder="Task title..."
                      className="text-xs h-7 flex-1"
                    />
                    {taskItems.length > 1 && (
                      <button onClick={() => removeTask(i)} className="text-gray-300 hover:text-red-400 mt-1.5 flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="ml-5">
                    <Textarea
                      value={item.description}
                      onChange={e => updateTask(i, "description", e.target.value)}
                      placeholder="Description (optional)..."
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 ml-5">
                    <Select value={item.priority} onValueChange={v => updateTask(i, "priority", v)}>
                      <SelectTrigger className="h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={item.due_date}
                      onChange={e => updateTask(i, "due_date", e.target.value)}
                      className="h-6 text-xs"
                    />
                  </div>
                  {collaboratorOptions.length > 0 && (
                    <div className="ml-5">
                      <Select value={item.assigned_to} onValueChange={v => updateTask(i, "assigned_to", v)}>
                        <SelectTrigger className="h-6 text-xs">
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Unassigned</SelectItem>
                          {collaboratorOptions.map(u => (
                            <SelectItem key={u.email} value={u.email}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={addTask}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-3 h-3" /> Add another task
              </button>
            </div>
          )}

          {/* ─── MILESTONE form ─── */}
          {activeCommand === "milestone" && (
            <div className="space-y-2">
              {milestoneItems.map((item, i) => (
                <div key={i} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                  <div className="flex gap-1.5 items-start">
                    <Flag className="w-3.5 h-3.5 text-orange-400 mt-2 flex-shrink-0" />
                    <Input
                      value={item.title}
                      onChange={e => updateMilestone(i, "title", e.target.value)}
                      placeholder="Milestone title..."
                      className="text-xs h-7 flex-1"
                    />
                    {milestoneItems.length > 1 && (
                      <button onClick={() => removeMilestone(i)} className="text-gray-300 hover:text-red-400 mt-1.5 flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="ml-5">
                    <Textarea
                      value={item.description}
                      onChange={e => updateMilestone(i, "description", e.target.value)}
                      placeholder="Description (optional)..."
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>
                  <div className="ml-5">
                    <Input
                      type="date"
                      value={item.target_date}
                      onChange={e => updateMilestone(i, "target_date", e.target.value)}
                      placeholder="Target date"
                      className="h-6 text-xs"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addMilestone}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus className="w-3 h-3" /> Add another milestone
              </button>
            </div>
          )}

          {/* ─── NOTE form ─── */}
          {activeCommand === "note" && (
            <div className="space-y-2">
              <Input
                value={noteForm.title}
                onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Note title..."
                className="text-xs h-7"
              />
              <Textarea
                value={noteForm.content}
                onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Note content..."
                rows={4}
                className="text-xs resize-none"
              />
            </div>
          )}

          {/* Execute / Cancel */}
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
            <Button size="sm" variant="ghost" className="text-xs h-7 px-3 text-gray-500" onClick={() => setActiveCommand(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Smart pop-up dialogs */}
      <ToolPickerDialog
        open={toolDialogOpen}
        onOpenChange={setToolDialogOpen}
        existingTools={project?.project_tools || []}
        onAddTools={handleAddTools}
        saving={saving}
      />
      <ResourceLinkDialog
        open={resourceDialogOpen}
        onOpenChange={setResourceDialogOpen}
        project={project}
        currentUser={currentUser}
        onSaved={onProjectUpdate}
      />
    </div>
  );
}