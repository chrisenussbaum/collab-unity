import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Flag, BookOpen, Wrench, X, Check, Zap, ChevronDown, ChevronUp, Plus, Trash2, Lightbulb, Map, FileText } from "lucide-react";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse an AI message to extract structured action items, tasks, milestones, tools.
 * Returns { tasks: string[], milestones: string[], tools: {name,url}[], noteTitle: string }
 */
function parseAIMessage(content) {
  if (!content) return { tasks: [], milestones: [], tools: [], noteTitle: "" };

  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

  const tasks = [];
  const milestones = [];
  const tools = [];

  // Known tool names to detect
  const knownTools = [
    "figma", "notion", "trello", "asana", "jira", "github", "gitlab", "slack",
    "discord", "linear", "clickup", "miro", "canva", "framer", "vercel",
    "netlify", "heroku", "aws", "gcp", "google cloud", "firebase", "supabase",
    "airtable", "loom", "zoom", "google meet", "google forms", "surveymonkey",
    "typeform", "webflow", "wordpress", "shopify", "stripe", "zapier", "make",
    "postman", "vs code", "cursor", "replit", "codepen", "tailwind", "next.js",
    "react", "vue", "angular", "python", "nodejs", "deno", "docker", "kubernetes"
  ];

  // Milestone signal words
  const milestoneSignals = [
    "phase", "launch", "release", "milestone", "sprint", "deadline",
    "v1", "v2", "beta", "mvp", "go-live", "deploy", "ship", "rollout"
  ];

  // Task signal words
  const taskSignals = [
    "implement", "create", "add", "build", "set up", "configure", "design",
    "develop", "write", "test", "review", "update", "fix", "research",
    "conduct", "analyze", "document", "integrate", "optimize", "refactor"
  ];

  for (const line of lines) {
    // Strip markdown formatting
    const clean = line
      .replace(/^[-*>•\d]+[.)]\s*/, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^#+\s*/, "")
      .trim();

    if (!clean || clean.length < 5 || clean.length > 150) continue;

    // Skip headings/section titles (short, no verb)
    const isHeading = /^\d+\.\s/.test(line) && clean.split(" ").length <= 5;

    const lower = clean.toLowerCase();

    // Detect tool mentions
    const mentionedTool = knownTools.find(t => lower.includes(t));

    // Is this line a numbered item or bullet?
    const isBullet = /^[-*•\d]+[.)]\s/.test(line);

    if (mentionedTool && isBullet) {
      // Extract tool name and potential URL
      const urlMatch = clean.match(/https?:\/\/[^\s)]+/);
      tools.push({
        name: clean.slice(0, 60),
        detectedTool: mentionedTool,
        url: urlMatch?.[0] || ""
      });
    }

    if (isBullet && !isHeading) {
      const isMilestone = milestoneSignals.some(s => lower.includes(s));
      const isTask = taskSignals.some(s => lower.startsWith(s) || lower.includes(` ${s} `));

      if (isMilestone) {
        milestones.push(clean.slice(0, 100));
      } else if (isTask || isBullet) {
        tasks.push(clean.slice(0, 100));
      }
    }
  }

  // Deduplicate and cap
  const uniqueTasks = [...new Set(tasks)].slice(0, 8);
  const uniqueMilestones = [...new Set(milestones)].slice(0, 5);
  const uniqueTools = tools
    .filter((t, i, arr) => arr.findIndex(x => x.detectedTool === t.detectedTool) === i)
    .slice(0, 5);

  // Note title: first meaningful line
  let noteTitle = "";
  for (const line of lines) {
    const clean = line.replace(/^[#*\->•\d.]+\s*/, "").replace(/\*\*/g, "").trim();
    if (clean.length > 8 && clean.length < 100) { noteTitle = clean.slice(0, 80); break; }
  }

  return { tasks: uniqueTasks, milestones: uniqueMilestones, tools: uniqueTools, noteTitle };
}

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
];

// AI action chips — these send a prompt to the AI
const AI_ACTIONS = [
  { id: "brainstorm", label: "Brainstorm",  icon: Lightbulb, prompt: "Brainstorm creative ideas for this project. Be specific and actionable.",        color: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" },
  { id: "plan",       label: "Make a Plan", icon: Map,       prompt: "Create a step-by-step action plan for this project.",                             color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  { id: "brief",      label: "Write Brief", icon: FileText,  prompt: "Write a concise project brief summarizing goals, audience, deliverables, and timeline.", color: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatCommandBar({ project, currentUser, messageContent, projectUsers = [], onSaved, onProjectUpdate, onAIAction }) {
  const [activeCommand, setActiveCommand] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedCommands, setSavedCommands] = useState(new Set());

  // Parsed data from AI message
  const parsed = useMemo(() => parseAIMessage(messageContent), [messageContent]);

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
    if (activeCommand === id) { setActiveCommand(null); return; }

    if (id === "task") {
      const items = parsed.tasks.length > 0
        ? parsed.tasks.map(t => ({ title: t, description: "", priority: "medium", due_date: "", assigned_to: "" }))
        : [{ title: "", description: "", priority: "medium", due_date: "", assigned_to: "" }];
      setTaskItems(items);
    }
    if (id === "milestone") {
      const items = parsed.milestones.length > 0
        ? parsed.milestones.map(m => ({ title: m, description: "", due_date: "" }))
        : [{ title: "", description: "", due_date: "" }];
      setMilestoneItems(items);
    }
    if (id === "note") {
      setNoteForm({ title: parsed.noteTitle, content: messageContent?.slice(0, 3000) || "" });
    }
    if (id === "tool") {
      const items = parsed.tools.length > 0
        ? parsed.tools.map(t => ({ name: t.detectedTool.charAt(0).toUpperCase() + t.detectedTool.slice(1), url: t.url || TOOL_URLS[t.detectedTool] || "" }))
        : [{ name: "", url: "" }];
      setToolItems(items);
    }

    setActiveCommand(id);
  };

  // ── Update helpers ──
  const updateTask = (i, field, val) => setTaskItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const removeTask = (i) => setTaskItems(prev => prev.filter((_, idx) => idx !== i));
  const addTask = () => setTaskItems(prev => [...prev, { title: "", description: "", priority: "medium", due_date: "", assigned_to: "" }]);

  const updateMilestone = (i, field, val) => setMilestoneItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const removeMilestone = (i) => setMilestoneItems(prev => prev.filter((_, idx) => idx !== i));
  const addMilestone = () => setMilestoneItems(prev => [...prev, { title: "", description: "", due_date: "" }]);

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
          due_date: m.due_date || undefined,
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

      else if (activeCommand === "tool") {
        const valid = toolItems.filter(t => t.name?.trim() && t.url?.trim());
        if (!valid.length) { toast.error("Add at least one tool with name and URL"); setSaving(false); return; }
        // Validate URLs
        for (const t of valid) {
          try { new URL(t.url); } catch { toast.error(`Invalid URL for "${t.name}"`); setSaving(false); return; }
        }
        const current = project.project_tools || [];
        const newTools = valid.map(t => {
          const icon = getToolIcon(t.name);
          return { name: t.name.trim(), url: t.url.trim(), icon };
        });
        const updated = [...current, ...newTools];
        await base44.entities.Project.update(project.id, { project_tools: updated });
        toast.success(`${valid.length} tool${valid.length > 1 ? "s" : ""} added to Project Tools!`);
        if (onProjectUpdate) onProjectUpdate();
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
        {/* AI action chips */}
        {onAIAction && AI_ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => onAIAction(action.prompt)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${action.color}`}
          >
            <action.icon className="w-3 h-3" />
            {action.label}
          </button>
        ))}
        {COMMANDS.map(cmd => {
          const Icon = cmd.icon;
          const saved = savedCommands.has(cmd.id);
          const active = activeCommand === cmd.id;
          // Show a count badge if parsed data available
          const count = cmd.id === "task" ? parsed.tasks.length : cmd.id === "milestone" ? parsed.milestones.length : cmd.id === "tool" ? parsed.tools.length : 0;
          return (
            <button
              key={cmd.id}
              onClick={() => openCommand(cmd.id)}
              disabled={saved}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                saved
                  ? "bg-gray-50 text-gray-400 border-gray-200 cursor-default"
                  : active
                    ? cmd.color + " ring-1 ring-offset-0 ring-current"
                    : cmd.color
              }`}
            >
              {saved ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              {saved ? "Done!" : cmd.label}
              {count > 0 && !saved && (
                <span className="ml-0.5 px-1 bg-white/60 rounded-full text-[10px] font-bold">{count}</span>
              )}
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
                    <Input
                      type="date"
                      value={item.due_date}
                      onChange={e => updateMilestone(i, "due_date", e.target.value)}
                      placeholder="Due date"
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

          {/* ─── TOOL form ─── */}
          {activeCommand === "tool" && (
            <div className="space-y-2">
              {toolItems.map((item, i) => (
                <div key={i} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                  <div className="flex gap-1.5 items-center">
                    <Wrench className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <Input
                      value={item.name}
                      onChange={e => updateTool(i, "name", e.target.value)}
                      placeholder="Tool name..."
                      className="text-xs h-7 flex-1"
                    />
                    {toolItems.length > 1 && (
                      <button onClick={() => removeTool(i)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="ml-5">
                    <Input
                      value={item.url}
                      onChange={e => updateTool(i, "url", e.target.value)}
                      placeholder="URL (https://...)..."
                      className="text-xs h-7"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addTool}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                <Plus className="w-3 h-3" /> Add another tool
              </button>
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
    </div>
  );
}