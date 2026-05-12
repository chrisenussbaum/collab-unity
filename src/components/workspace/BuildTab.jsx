import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Send, Sparkles, Bot, User, RefreshCw,
  Lightbulb, Wrench, Flag, FileText, CheckSquare, FileStack,
  Activity, BookOpen, Layers, Link2, Plus, Trash2, ExternalLink,
  PenTool, Eye, Search, ArrowRight, X, AlertTriangle,
  Map, Rocket, Code2, Palette, Video, Music, Globe, GraduationCap,
  Gamepad2, FlaskConical, Target, Users, BarChart3, Film, Mic,
  BookMarked, Package, Database, Zap, CheckCircle2, Circle, Paperclip, Upload,
  ImagePlus, FileSearch
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AssetVersion } from "@/entities/all";
import ReactMarkdown from "react-markdown";
import ChatCommandBar from "./ChatCommandBar";
import { toast } from "sonner";
import { differenceInDays, format, isPast, isValid, parseISO } from "date-fns";

// ─── Exported utility (used by DashboardWidgets) ───────────────────────────

export function getLaunchCountdown(buildMilestones) {
  if (!buildMilestones?.length) return null;
  const withDates = buildMilestones
    .filter(m => m.due_date && !m.completed)
    .map(m => ({ ...m, dateObj: parseISO(m.due_date) }))
    .filter(m => isValid(m.dateObj))
    .sort((a, b) => a.dateObj - b.dateObj);
  const launchMilestone = buildMilestones.find(m => m.is_launch) || withDates[withDates.length - 1];
  if (!launchMilestone?.due_date) return null;
  const date = parseISO(launchMilestone.due_date);
  if (!isValid(date)) return null;
  const days = differenceInDays(date, new Date());
  return { days, date, label: launchMilestone.name, overdue: days < 0 };
}

import TaskBoard from "./TaskBoard";
import MilestonesTab from "./MilestonesTab";
import AssetsTab from "./AssetsTab";
import ActivityTab from "./ActivityTab";
import ThoughtsTab from "./ThoughtsTab";
import IdeationHub from "./ideation/IdeationHub";
import ToolsHub from "./ToolsHub";
import WorkspaceSummaryBar from "./WorkspaceSummaryBar";
// ─── Slash commands definition ─────────────────────────────────────────────

const SLASH_COMMANDS = [
  { command: "/task",        icon: CheckSquare, label: "Create Task",       description: "Quickly add a new task to this project",        color: "text-blue-600",   bg: "bg-blue-50" },
  { command: "/milestone",   icon: Flag,        label: "Add Milestone",     description: "Create a new milestone or goal",                color: "text-orange-600", bg: "bg-orange-50" },
  { command: "/note",        icon: BookOpen,    label: "Save Note",         description: "Add a thought or note to this project",         color: "text-green-600",  bg: "bg-green-50" },
  { command: "/idea",        icon: Lightbulb,   label: "Brainstorm Ideas",  description: "Ask the assistant to generate ideas",           color: "text-yellow-600", bg: "bg-yellow-50" },
  { command: "/brief",       icon: FileText,    label: "Write Brief",       description: "Generate a project brief or summary",           color: "text-purple-600", bg: "bg-purple-50" },
  { command: "/blockers",    icon: AlertTriangle,label: "Identify Blockers", description: "Ask the assistant to surface current blockers", color: "text-red-600",    bg: "bg-red-50" },
  { command: "/plan",        icon: Map,         label: "Create a Plan",     description: "Generate a step-by-step action plan",           color: "text-indigo-600", bg: "bg-indigo-50" },
  { command: "/standup",     icon: Users,       label: "Standup Summary",   description: "Generate a team standup update",                color: "text-teal-600",   bg: "bg-teal-50" },
  { command: "/help",        icon: Sparkles,    label: "Show Commands",     description: "List all available slash commands",             color: "text-gray-600",   bg: "bg-gray-50" },
];

// ─── Quick prompts ─────────────────────────────────────────────────────────

function getQuickPrompts(tasks, milestones) {
  const hasTasks = tasks?.length > 0;
  const hasMilestones = milestones?.length > 0;
  const hasUnassigned = tasks?.some(t => !t.assigned_to && t.status !== "done");
  const hasOverdue = tasks?.some(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== "done");

  const prompts = [];
  if (!hasTasks && !hasMilestones) prompts.push({ label: "Build a project plan for me", icon: Map });
  if (!hasTasks) prompts.push({ label: "Create a task breakdown", icon: CheckSquare });
  if (hasOverdue) prompts.push({ label: "Review overdue tasks", icon: AlertTriangle });
  if (hasUnassigned) prompts.push({ label: "Assign tasks to collaborators", icon: Users });
  if (!hasMilestones) prompts.push({ label: "Break this into milestones", icon: Flag });
  if (hasTasks) prompts.push({ label: "What should I focus on next?", icon: Target });
  prompts.push({ label: "Suggest tools for this project", icon: Wrench });
  prompts.push({ label: "Identify blockers", icon: AlertTriangle });
  prompts.push({ label: "Write a project brief", icon: FileText });
  return prompts.slice(0, 4);
}

// ─── Build system prompt ───────────────────────────────────────────────────

function buildSystemPrompt(project, tasks, milestones, assets, projectUsers) {
  const todoTasks = tasks?.filter(t => t.status === "todo") || [];
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || [];
  const doneTasks = tasks?.filter(t => t.status === "done") || [];
  const overdueTasks = tasks?.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== "done") || [];
  const unassignedTasks = tasks?.filter(t => !t.assigned_to && t.status !== "done") || [];
  const completedMilestones = milestones?.filter(m => m.status === "completed") || [];
  const pendingMilestones = milestones?.filter(m => m.status !== "completed") || [];

  const taskProgress = tasks?.length
    ? `${doneTasks.length}/${tasks.length} done (${Math.round((doneTasks.length / tasks.length) * 100)}%)`
    : "no tasks yet";

  const taskLines = tasks?.slice(0, 20).map(t => {
    let line = `- [${t.status}] ${t.title}`;
    if (t.priority && t.priority !== "medium") line += ` (${t.priority})`;
    if (t.assigned_to) line += ` → ${t.assigned_to.split("@")[0]}`;
    if (t.due_date) line += ` | due ${t.due_date}`;
    return line;
  });

  const milestoneLines = milestones?.slice(0, 10).map(m => {
    let line = `- [${m.status || "not_started"}] ${m.title || m.name}`;
    if (m.target_date) line += ` | target ${m.target_date}`;
    if (m.description) line += ` — ${m.description.slice(0, 80)}`;
    return line;
  });

  const collaboratorLines = projectUsers?.map(u =>
    `- ${u.full_name || u.email} (${u.email})`
  );

  const parts = [
    `You are an intelligent, proactive project assistant embedded inside Collab Unity.`,
    `You deeply understand this project and act as a smart team member helping drive progress.`,
    `\n== PROJECT CONTEXT ==`,
    `Title: "${project?.title || "Untitled"}"`,
    project?.description ? `Description: ${project.description}` : null,
    project?.classification ? `Classification: ${project.classification}` : null,
    project?.industry ? `Industry: ${project.industry}` : null,
    project?.status ? `Project status: ${project.status}` : null,
    project?.skills_needed?.length ? `Skills: ${project.skills_needed.join(", ")}` : null,
    project?.tools_needed?.length ? `Tools needed: ${project.tools_needed.join(", ")}` : null,
    project?.project_tools?.length ? `Tools in use: ${project.project_tools.map(t => t.name).join(", ")}` : null,
    `\n== TASK PROGRESS ==`,
    `Overall: ${taskProgress}`,
    todoTasks.length ? `Todo (${todoTasks.length}): ${todoTasks.slice(0,5).map(t=>t.title).join(", ")}${todoTasks.length>5?" ...":""}` : null,
    inProgressTasks.length ? `In Progress (${inProgressTasks.length}): ${inProgressTasks.slice(0,5).map(t=>t.title).join(", ")}` : null,
    overdueTasks.length ? `⚠️ OVERDUE (${overdueTasks.length}): ${overdueTasks.map(t=>t.title).join(", ")}` : null,
    unassignedTasks.length ? `Unassigned (${unassignedTasks.length}): ${unassignedTasks.slice(0,5).map(t=>t.title).join(", ")}` : null,
    taskLines?.length ? `\nAll Tasks:\n${taskLines.join("\n")}` : null,
    milestoneLines?.length ? `\n== MILESTONES ==\n${milestoneLines.join("\n")}` : `\n== MILESTONES ==\nNone yet`,
    collaboratorLines?.length ? `\n== COLLABORATORS ==\n${collaboratorLines.join("\n")}` : null,
    assets?.length ? `\n== ASSETS == (${assets.length} files/links)` : null,
    `\n== YOUR BEHAVIOR ==`,
    `You are conversational, smart, and proactive. Based on the project state:`,
    `- If there are NO tasks yet → proactively suggest creating a task breakdown or milestone plan`,
    `- If tasks are unassigned → suggest assigning them to collaborators by name`,
    `- If tasks are overdue → flag this and suggest action`,
    `- If milestones are missing → suggest creating them to structure the work`,
    `- If project tools are missing → suggest relevant tools based on project type`,
    `- If progress is low → motivate and suggest the next most impactful action`,
    `- If progress is high → celebrate and suggest what comes next`,
    `\nYou can EXECUTE ACTIONS directly — when a user asks you to create tasks, assign work, add milestones, save notes, etc., DO IT by including an "actions" array in your JSON response.`,
    `\n== RESPONSE FORMAT ==`,
    `You MUST respond with valid JSON (no markdown code blocks, just raw JSON):`,
    `{`,
    `  "message": "Your conversational response here (use markdown for formatting)",`,
    `  "actions": [`,
    `    {"type": "create_task", "title": "Task title", "description": "...", "priority": "medium|high|low|urgent", "assigned_to": "email@example.com or null", "due_date": "YYYY-MM-DD or null"},`,
    `    {"type": "create_milestone", "title": "Milestone name", "description": "...", "target_date": "YYYY-MM-DD or null"},`,
    `    {"type": "save_note", "title": "Note title", "content": "Note content"},`,
    `    {"type": "suggest_tool", "name": "Tool name", "url": "https://...", "icon": "emoji"}`,
    `  ]`,
    `}`,
    `- "actions" can be an empty array [] if no direct actions are needed`,
    `- Only include actions the user actually asked for, or that are obviously needed`,
    `- For assigned_to, use the exact email from the collaborators list above`,
    `- Keep "message" conversational and reference actual project details`,
  ];
  return parts.filter(Boolean).join("\n");
}

// ─── AI Chat component ─────────────────────────────────────────────────────

const WELCOME_MESSAGE = (title, taskCount, milestoneCount) => ({
  role: "assistant",
  content: taskCount === 0 && milestoneCount === 0
    ? `Hey! I'm your project assistant for **${title || "this project"}**. This project doesn't have any tasks or milestones yet — want me to help you build out a plan? Just say "create a plan" or tell me what you're working on, and I'll get things set up.\n\nType **/** for quick commands.`
    : `Hey! I'm your assistant for **${title || "this project"}**. I can see you have **${taskCount} task${taskCount !== 1 ? "s" : ""}** and **${milestoneCount} milestone${milestoneCount !== 1 ? "s" : ""}**. How can I help drive progress today?\n\nType **/** for quick commands.`,
  isWelcome: true,
});

// Context-aware suggested next actions after the AI finishes a task
function getContextualFollowUps(tasks, milestones, lastAssistantMessage) {
  const hasTasks = tasks?.length > 0;
  const hasMilestones = milestones?.length > 0;
  const hasUnassigned = tasks?.some(t => !t.assigned_to && t.status !== "done");
  const hasOverdue = tasks?.some(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== "done");
  const msg = lastAssistantMessage?.toLowerCase() || "";

  const suggestions = [];

  // Detect what was just done and suggest logical next step
  if (msg.includes("task") && msg.includes("created")) {
    if (!hasMilestones) suggestions.push({ label: "Now break this into milestones", icon: Flag });
    if (hasUnassigned) suggestions.push({ label: "Assign these tasks to collaborators", icon: Users });
    suggestions.push({ label: "What should I work on first?", icon: Target });
  } else if (msg.includes("milestone") && msg.includes("created")) {
    if (!hasTasks) suggestions.push({ label: "Create tasks for the first milestone", icon: CheckSquare });
    suggestions.push({ label: "Set target dates for milestones", icon: Map });
  } else if (msg.includes("plan") || msg.includes("step-by-step")) {
    suggestions.push({ label: "Create tasks from this plan", icon: CheckSquare });
    suggestions.push({ label: "Add milestones for each phase", icon: Flag });
  } else if (msg.includes("brief") || msg.includes("summary")) {
    suggestions.push({ label: "Build a task breakdown", icon: CheckSquare });
    suggestions.push({ label: "Identify potential blockers", icon: AlertTriangle });
  } else if (msg.includes("brainstorm") || msg.includes("idea")) {
    suggestions.push({ label: "Turn these ideas into tasks", icon: CheckSquare });
    suggestions.push({ label: "Create a plan from these ideas", icon: Map });
  }

  // Always-relevant fallbacks
  if (hasOverdue && suggestions.length < 2) suggestions.push({ label: "Review overdue tasks", icon: AlertTriangle });
  if (!hasMilestones && suggestions.length < 2) suggestions.push({ label: "Add milestones to this project", icon: Flag });
  if (suggestions.length < 2) suggestions.push({ label: "What should I focus on next?", icon: Target });
  if (suggestions.length < 3) suggestions.push({ label: "Write a project brief", icon: FileText });

  return suggestions.slice(0, 3);
}

// Execute a single AI action against the backend
async function executeAction(action, project, currentUser, onProjectUpdate) {
  if (!project?.id || !currentUser) return null;

  if (action.type === "create_task") {
    const created = await base44.entities.Task.create({
      project_id: project.id,
      title: action.title,
      description: action.description || "",
      priority: action.priority || "medium",
      status: "todo",
      assigned_to: action.assigned_to || undefined,
      due_date: action.due_date || undefined,
    });
    if (onProjectUpdate) onProjectUpdate();
    return `✅ Task created: **${action.title}**${action.assigned_to ? ` → assigned to ${action.assigned_to.split("@")[0]}` : ""}`;
  }

  if (action.type === "create_milestone") {
    await base44.entities.ProjectMilestone.create({
      project_id: project.id,
      title: action.title,
      description: action.description || "",
      status: "not_started",
      target_date: action.target_date || undefined,
    });
    if (onProjectUpdate) onProjectUpdate();
    return `🏁 Milestone created: **${action.title}**`;
  }

  if (action.type === "save_note") {
    await base44.entities.Thought.create({
      project_id: project.id,
      title: action.title || action.content?.slice(0, 60) || "Note",
      content: action.content || "",
    });
    return `📝 Note saved: **${action.title || "Note"}**`;
  }

  if (action.type === "suggest_tool") {
    return `🔧 Tool suggestion: **${action.name}**${action.url ? ` — [${action.url}](${action.url})` : ""}`;
  }

  return null;
}

function AIChat({ project, tasks, milestones, assets, currentUser, canEdit, projectUsers, onProjectUpdate }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE(project?.title, tasks?.length || 0, milestones?.length || 0)]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [analyzingFiles, setAnalyzingFiles] = useState(false);
  // Tracks when we're awaiting a follow-up argument for a slash command
  const [pendingCommand, setPendingCommand] = useState(null); // e.g. "task" | "milestone" | "note"
  // Whether AI is in "conversational flow" and should show continue/stop buttons
  const [awaitingContinue, setAwaitingContinue] = useState(false);
  const [pendingFollowUp, setPendingFollowUp] = useState(null); // next suggested prompt
  const [shouldAutoAnalyze, setShouldAutoAnalyze] = useState(false);
  const hasAutoAnalyzedRef = useRef(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const analyzeFileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  // Load persisted chat history, then auto-analyze if no history exists
  useEffect(() => {
    if (!project?.id) return;
    base44.entities.ProjectChatMessage.filter({ project_id: project.id }, "created_date", 100)
      .then(records => {
        if (records?.length > 0) {
          const loaded = records.map(r => ({
            id: r.id,
            role: r.role,
            content: r.content,
            isError: r.is_error,
            sender_name: r.sender_name,
            sender_email: r.sender_email,
          }));
          setMessages([WELCOME_MESSAGE(project?.title, tasks?.length || 0, milestones?.length || 0), ...loaded]);
          setHistoryLoaded(true);
        } else {
          // No history — trigger auto-analysis after a brief delay
          setHistoryLoaded(true);
          if (!hasAutoAnalyzedRef.current) {
            hasAutoAnalyzedRef.current = true;
            // Use a ref-safe approach — set a flag and let an effect handle it
            setShouldAutoAnalyze(true);
          }
        }
      })
      .catch(() => setHistoryLoaded(true));
  }, [project?.id]);

  // Helper to persist a message
  const persistMessage = useCallback(async (msg) => {
    if (!project?.id) return;
    await base44.entities.ProjectChatMessage.create({
      project_id: project.id,
      role: msg.role,
      content: msg.content,
      sender_email: msg.role === "user" ? currentUser?.email : undefined,
      sender_name: msg.role === "user" ? currentUser?.full_name : undefined,
      is_error: msg.isError || false,
    });
  }, [project?.id, currentUser]);

  // Auto-analysis: called once when project first opens with no chat history
  const triggerAutoAnalysis = useCallback(async () => {
    if (!project?.id) return;
    setIsLoading(true);
    try {
      const systemPrompt = buildSystemPrompt(project, tasks, milestones, assets, projectUsers);
      const analysisRequest = `Analyze the current state of this project. Summarize what exists (tasks, milestones, assets, collaborators), identify the most important next steps, and end with ONE specific question asking what the user wants to work on first. Be concise and conversational. Respond with valid JSON only.`;
      const raw = await base44.integrations.Core.InvokeLLM({ prompt: `${systemPrompt}\n\n${analysisRequest}` });
      let parsed = null;
      try {
        const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { message: raw, actions: [] };
      }
      const msg = { role: "assistant", content: parsed?.message || raw };
      setMessages(prev => [...prev, msg]);
      await persistMessage(msg);
      // Prime the follow-up flow
      setAwaitingContinue(true);
      setPendingFollowUp("continue");
    } catch {
      // Silently fail — welcome message is still shown
    } finally {
      setIsLoading(false);
    }
  }, [project, tasks, milestones, assets, projectUsers, persistMessage]);

  // Trigger auto-analysis once history confirms no messages
  useEffect(() => {
    if (shouldAutoAnalyze) {
      setShouldAutoAnalyze(false);
      setTimeout(() => triggerAutoAnalysis(), 800);
    }
  }, [shouldAutoAnalyze, triggerAutoAnalysis]);

  const userSentRef = useRef(false);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const uploadFileToAssets = async (file) => {
    if (!canEdit || !project?.id || !currentUser) return;
    setUploadingFile(file.name);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const existingVersions = (assets || []).filter(a => a.asset_name === file.name);
      const versionNumber = existingVersions.length > 0
        ? Math.max(...existingVersions.map(a => a.version_number || 1)) + 1
        : 1;
      await AssetVersion.create({
        project_id: project.id,
        asset_name: file.name,
        file_url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        version_number: versionNumber,
        version_notes: "Uploaded via AI chat",
        uploaded_by: currentUser.email,
        is_current: true,
        category: "Uncategorized",
        tags: [],
        resource_type: "file",
      });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `✅ **${file.name}** has been saved to your project Assets (v${versionNumber}). You can find it in the Assets section below.`,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `❌ Failed to upload **${file.name}**. Please try again.`,
        isError: true,
      }]);
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDragEnter = (e) => {
    if (!canEdit) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    if (!canEdit) return;
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFileToAssets(file);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFileToAssets(file);
      e.target.value = "";
    }
  };

  const addAndPersist = useCallback(async (msg) => {
    setMessages(prev => [...prev, msg]);
    await persistMessage(msg);
    setTimeout(scrollToBottom, 50);
  }, [persistMessage, scrollToBottom]);

  // Build a task via /task command
  const handleSlashTask = async (taskTitle) => {
    if (!project?.id || !currentUser || !canEdit) {
      await addAndPersist({ role: "assistant", content: "⚠️ You need edit access to create tasks." });
      return;
    }
    const title = taskTitle.trim() || "New Task";
    await base44.entities.Task.create({ project_id: project.id, title, status: "todo", priority: "medium" });
    toast.success(`Task "${title}" created!`);
    await addAndPersist({ role: "assistant", content: `✅ Task **"${title}"** has been added to your project board.` });
  };

  // Build a milestone via /milestone command
  const handleSlashMilestone = async (milestoneName) => {
    if (!project?.id || !currentUser || !canEdit) {
      await addAndPersist({ role: "assistant", content: "⚠️ You need edit access to create milestones." });
      return;
    }
    const name = milestoneName.trim() || "New Milestone";
    await base44.entities.ProjectMilestone.create({ project_id: project.id, title: name, status: "not_started" });
    toast.success(`Milestone "${name}" created!`);
    await addAndPersist({ role: "assistant", content: `🏁 Milestone **"${name}"** has been added to your project milestones.` });
  };

  // Save a note via /note command
  const handleSlashNote = async (noteContent) => {
    if (!project?.id || !currentUser || !canEdit) {
      await addAndPersist({ role: "assistant", content: "⚠️ You need edit access to save notes." });
      return;
    }
    const content = noteContent.trim() || "Quick note";
    await base44.entities.Thought.create({ project_id: project.id, title: content.slice(0, 60), content });
    toast.success("Note saved!");
    await addAndPersist({ role: "assistant", content: `📝 Note saved to **Thoughts & Notes**: "${content.slice(0, 80)}${content.length > 80 ? "…" : ""}"` });
  };

  const applySlashCommand = (cmd) => {
    setSlashOpen(false);
    setSlashFilter("");
    if (cmd.command === "/help") {
      const helpText = SLASH_COMMANDS.map(c => `**${c.command}** — ${c.description}`).join("\n");
      setMessages(prev => [...prev, { role: "assistant", content: `Here are all available slash commands:\n\n${helpText}` }]);
      setInput("");
      return;
    }
    // Replace current input with the command + space so user can type the argument
    setInput(cmd.command + " ");
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    // ── Handle pending command follow-up (e.g. after "/task" with no arg) ──
    if (pendingCommand) {
      const cmd = pendingCommand;
      setPendingCommand(null);
      setInput("");
      const userMsg = { role: "user", content: userText, sender_email: currentUser?.email, sender_name: currentUser?.full_name };
      setMessages(prev => [...prev, userMsg]);
      await persistMessage(userMsg);
      if (cmd === "task") {
        await handleSlashTask(userText);
        if (onProjectUpdate) onProjectUpdate();
      } else if (cmd === "milestone") {
        await handleSlashMilestone(userText);
        if (onProjectUpdate) onProjectUpdate();
      } else if (cmd === "note") {
        await handleSlashNote(userText);
      }
      return;
    }

    // ── Handle slash commands ──
    if (userText.startsWith("/")) {
      const [cmd, ...rest] = userText.split(/\s+/);
      const arg = rest.join(" ");
      setInput("");
      setSlashOpen(false);

      const userMsg = { role: "user", content: userText, sender_email: currentUser?.email, sender_name: currentUser?.full_name };

      if (cmd === "/task") {
        setMessages(prev => [...prev, userMsg]);
        await persistMessage(userMsg);
        if (!arg) {
          setPendingCommand("task");
          await addAndPersist({ role: "assistant", content: "What should the task be called? Reply with the task title." });
          return;
        }
        await handleSlashTask(arg);
        if (onProjectUpdate) onProjectUpdate();
        return;
      }
      if (cmd === "/milestone") {
        setMessages(prev => [...prev, userMsg]);
        await persistMessage(userMsg);
        if (!arg) {
          setPendingCommand("milestone");
          await addAndPersist({ role: "assistant", content: "What should the milestone be called? Reply with the milestone name." });
          return;
        }
        await handleSlashMilestone(arg);
        if (onProjectUpdate) onProjectUpdate();
        return;
      }
      if (cmd === "/note") {
        setMessages(prev => [...prev, userMsg]);
        await persistMessage(userMsg);
        if (!arg) {
          setPendingCommand("note");
          await addAndPersist({ role: "assistant", content: "What would you like to note? Reply with the note content." });
          return;
        }
        await handleSlashNote(arg);
        return;
      }
      if (cmd === "/help") {
        setMessages(prev => [...prev, userMsg]);
        await persistMessage(userMsg);
        const helpText = SLASH_COMMANDS.map(c => `**${c.command}** — ${c.description}`).join("\n");
        await addAndPersist({ role: "assistant", content: `Here are all available slash commands:\n\n${helpText}` });
        return;
      }
      // For AI-powered commands (/idea, /brief, /blockers, /plan, /standup), expand to a prompt
      const aiCommandPrompts = {
        "/idea":     `Generate creative ideas for the project "${project?.title}". Be specific and actionable.`,
        "/brief":    `Write a concise project brief for "${project?.title}" based on the project details.`,
        "/blockers": `Based on the current tasks and project state, identify potential blockers or risks for "${project?.title}".`,
        "/plan":     `Create a step-by-step action plan for "${project?.title}"${arg ? ` focused on: ${arg}` : ""}.`,
        "/standup":  `Generate a team standup summary for "${project?.title}" based on current tasks and milestones.`,
      };
      if (aiCommandPrompts[cmd]) {
        const prompt = aiCommandPrompts[cmd] + (arg && !aiCommandPrompts[cmd].includes(arg) ? ` Context: ${arg}` : "");
        setMessages(prev => [...prev, userMsg]);
        await persistMessage(userMsg);
        setIsLoading(true);
        try {
          const systemPrompt = buildSystemPrompt(project, tasks, milestones, assets, projectUsers);
          const raw = await base44.integrations.Core.InvokeLLM({ prompt: `${systemPrompt}\n\n${prompt}\n\nRespond with valid JSON only:` });
          let parsed = null;
          try {
            const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
            parsed = JSON.parse(cleaned);
          } catch {
            parsed = { message: raw, actions: [] };
          }
          const message = parsed?.message || raw;
          const actions = Array.isArray(parsed?.actions) ? parsed.actions : [];
          const actionResults = [];
          if (canEdit && actions.length > 0) {
            for (const action of actions) {
              const result = await executeAction(action, project, currentUser, onProjectUpdate);
              if (result) actionResults.push(result);
            }
          }
          let finalContent = message;
          if (actionResults.length > 0) {
            finalContent += `\n\n---\n**Actions taken:**\n${actionResults.join("\n")}`;
          }
          await addAndPersist({ role: "assistant", content: finalContent });
          if (actionResults.length > 0 || actions.length > 0) {
            const followUps = getContextualFollowUps(tasks, milestones, finalContent);
            setPendingFollowUp(followUps[0]?.label || "What else would you like to do?");
            setAwaitingContinue(true);
          }
        } catch {
          await addAndPersist({ role: "assistant", content: "Sorry, I ran into an issue. Please try again.", isError: true });
        } finally {
          setIsLoading(false);
        }
        return;
      }
    }

    const userMsg = { role: "user", content: userText, sender_email: currentUser?.email, sender_name: currentUser?.full_name };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    await persistMessage(userMsg);
    setTimeout(scrollToBottom, 50);

    try {
      const systemPrompt = buildSystemPrompt(project, tasks, milestones, assets, projectUsers);
      const conversationHistory = newMessages.slice(-20).map(m =>
        `${m.role === "user" ? (m.sender_name || "User") : "Assistant"}: ${m.content}`
      ).join("\n\n");
      const prompt = `${systemPrompt}\n\n--- CONVERSATION HISTORY ---\n${conversationHistory}\n\nRespond with valid JSON only (no markdown code blocks):`;

      const raw = await base44.integrations.Core.InvokeLLM({ prompt });

      // Parse JSON response
      let parsed = null;
      try {
        // Strip markdown code fences if present
        const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        // If not valid JSON, treat the whole thing as a plain message
        parsed = { message: raw, actions: [] };
      }

      const message = parsed?.message || raw;
      const actions = Array.isArray(parsed?.actions) ? parsed.actions : [];

      // Execute actions if user can edit
      const actionResults = [];
      if (canEdit && actions.length > 0) {
        for (const action of actions) {
          const result = await executeAction(action, project, currentUser, onProjectUpdate);
          if (result) actionResults.push(result);
        }
      }

      // Build final assistant message
      let finalContent = message;
      if (actionResults.length > 0) {
        finalContent += `\n\n---\n**Actions taken:**\n${actionResults.join("\n")}`;
      }

      await addAndPersist({ role: "assistant", content: finalContent });
      // After executing actions, prompt to continue
      if (actionResults.length > 0 || actions.length > 0) {
        const followUps = getContextualFollowUps(tasks, milestones, finalContent);
        setPendingFollowUp(followUps[0]?.label || "What else would you like to do?");
        setAwaitingContinue(true);
      }
    } catch (e) {
      await addAndPersist({ role: "assistant", content: "Sorry, I ran into an issue. Please try again.", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (val.startsWith("/") && !val.includes(" ")) {
      setSlashFilter(val.slice(1).toLowerCase());
      setSlashOpen(true);
      setSlashIndex(0);
    } else {
      setSlashOpen(false);
      setSlashFilter("");
    }
  };

  const filteredCommands = SLASH_COMMANDS.filter(c =>
    slashFilter === "" || c.command.slice(1).startsWith(slashFilter)
  );

  const handleKeyDown = (e) => {
    if (slashOpen) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIndex(i => Math.min(i + 1, filteredCommands.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSlashIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); if (filteredCommands[slashIndex]) applySlashCommand(filteredCommands[slashIndex]); return; }
      if (e.key === "Escape")    { setSlashOpen(false); return; }
    }
    // Plain Enter = send; Shift+Enter = newline
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      sendMessage();
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    try {
      const existing = await base44.entities.ProjectChatMessage.filter({ project_id: project.id });
      await Promise.all(existing.map(r => base44.entities.ProjectChatMessage.delete(r.id)));
    } catch {}
    setMessages([WELCOME_MESSAGE(project?.title, tasks?.length || 0, milestones?.length || 0)]);
    setShowClearConfirm(false);
  };

  // ── File analysis (images, docs, video) ──
  const handleAnalyzeFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";
    setAnalyzingFiles(true);
    const userText = input.trim() || "Please analyze these files and provide detailed feedback and suggestions to help move this project forward.";
    const userMsg = { role: "user", content: `📎 ${files.map(f => f.name).join(", ")} — ${userText}`, sender_email: currentUser?.email, sender_name: currentUser?.full_name };
    setMessages(prev => [...prev, userMsg]);
    await persistMessage(userMsg);
    setInput("");

    try {
      // Upload all files and collect URLs
      const uploadedUrls = await Promise.all(files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      }));

      const systemPrompt = buildSystemPrompt(project, tasks, milestones, assets, projectUsers);
      const analysisPrompt = `${systemPrompt}

The user has shared ${files.length} file(s) for analysis: ${files.map(f => f.name).join(", ")}.

User's request: "${userText}"

Please analyze the provided file(s) thoroughly. For images, compare visual designs, layouts, branding, and UX. For documents, review content, structure, and clarity. For videos, describe what you can observe. 

Provide:
1. **Detailed observations** about what you see in the file(s)
2. **Specific actionable suggestions** to improve or move the project forward
3. **Relevant tasks** the team should consider (format as bullet points starting with action verbs)
4. **Any tools or resources** that could help

Be specific, reference the actual content you observe, and tie your feedback to the project goals.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: uploadedUrls,
        model: "claude_sonnet_4_6"
      });
      await addAndPersist({ role: "assistant", content: result });
    } catch (err) {
      await addAndPersist({ role: "assistant", content: `❌ Failed to analyze the file(s). Please try again. (${err.message})`, isError: true });
    } finally {
      setAnalyzingFiles(false);
    }
  };

  return (
    <div
      className={`flex flex-col relative transition-colors ${isDragOver ? "bg-purple-50" : ""}`}
      style={{ height: "520px" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-purple-50/95 border-2 border-dashed border-purple-400 rounded-b-xl pointer-events-none">
          <div className="text-center">
            <Upload className="w-10 h-10 mx-auto text-purple-500 mb-2" />
            <p className="text-purple-700 font-semibold">Drop to save to Assets</p>
            <p className="text-purple-500 text-sm">File will be added to your project assets</p>
          </div>
        </div>
      )}

      {/* Upload in progress banner */}
      {uploadingFile && (
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 border-b border-purple-200 text-purple-700 text-xs font-medium">
          <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Uploading <span className="font-semibold truncate max-w-[200px]">{uploadingFile}</span> to Assets...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {!historyLoaded && (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-xs">
            <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            Loading chat history...
          </div>
        )}
        {messages.map((msg, i) => {
          const senderProfile = msg.role === "user"
            ? (projectUsers?.find(u => u.email === (msg.sender_email || currentUser?.email)) || null)
            : null;
          const avatarSrc = senderProfile?.profile_image || (msg.role === "user" ? currentUser?.profile_image : null);
          const avatarFallback = senderProfile?.full_name?.[0] || currentUser?.full_name?.[0] || "U";
          return (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden ${
              msg.role === "user" ? "bg-purple-600" : "bg-gradient-to-br from-purple-500 to-indigo-600"
            }`}>
              {msg.role === "user" ? (
                avatarSrc
                  ? <img src={avatarSrc} alt={avatarFallback} className="w-full h-full object-cover" />
                  : <span className="text-white text-[10px] font-bold">{avatarFallback}</span>
              ) : (
                <Lightbulb className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            <div className="max-w-[80%] flex flex-col">
              {msg.role === "user" && msg.sender_name && msg.sender_email !== currentUser?.email && (
                <p className="text-[10px] text-gray-400 text-right mb-0.5 pr-1">{msg.sender_name}</p>
              )}
              <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-tr-sm"
                  : msg.isError
                    ? "bg-red-50 border border-red-200 text-red-700 rounded-tl-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900 [&_a]:break-all [&_strong]:break-words break-words">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {/* Action commands — only for non-first, non-error assistant messages when canEdit */}
              {canEdit && msg.role === "assistant" && i > 0 && !msg.isError && (
                <ChatCommandBar
                  project={project}
                  currentUser={currentUser}
                  messageContent={msg.content}
                  projectUsers={projectUsers}
                  onProjectUpdate={onProjectUpdate}
                  onSaved={() => {}}
                  onAIAction={(prompt) => { setAwaitingContinue(false); sendMessage(prompt); }}
                />
              )}
            </div>
          </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Continue / Stop flow — shown after AI executes actions */}
      {awaitingContinue && !isLoading && (
        <div className="px-3 py-2.5 bg-purple-50 border-t border-purple-100">
          <p className="text-xs text-purple-600 font-medium mb-2">
            {pendingFollowUp === "continue"
              ? "Would you like me to continue helping with this project?"
              : `Want to continue? I suggest: **${pendingFollowUp}**`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setAwaitingContinue(false);
                sendMessage(pendingFollowUp === "continue"
                  ? "Yes, what should we work on next?"
                  : pendingFollowUp);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-medium transition-colors"
            >
              ✓ Yes, continue
            </button>
            <button
              onClick={() => {
                setAwaitingContinue(false);
                setPendingFollowUp(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 rounded-full text-xs font-medium transition-colors"
            >
              ✕ No, stop for now
            </button>
            {/* Show contextual alternatives */}
            {getContextualFollowUps(tasks, milestones, messages[messages.length - 1]?.content).slice(0, 2).map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => { setAwaitingContinue(false); sendMessage(s.label); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-medium transition-colors"
                >
                  <Icon className="w-3 h-3" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Prompts — shown on fresh chat or after stop */}
      {messages.length <= 1 && !awaitingContinue && (
        <div className="px-3 py-2 bg-white border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2 font-medium">Quick actions</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ...getQuickPrompts(tasks, milestones),
              { label: "Brainstorm ideas", icon: Lightbulb },
              { label: "Write a project brief", icon: FileText },
              { label: "Create a full plan", icon: Map },
            ].slice(0, 6).map((qp) => {
              const Icon = qp.icon;
              return (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.label)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-full text-xs font-medium transition-colors"
                >
                  <Icon className="w-3 h-3" />
                  {qp.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation dialog for clear chat */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages in this project chat for all collaborators. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearChat} className="bg-red-600 hover:bg-red-700 text-white">
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attached files for analysis preview */}
      {analyzingFiles && (
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border-b border-indigo-200 text-indigo-700 text-xs font-medium">
          <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Analyzing files with AI — this may take a moment...
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
        <input
          ref={analyzeFileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mov"
          onChange={handleAnalyzeFileSelect}
        />

        {/* Slash command popup */}
        {slashOpen && filteredCommands.length > 0 && (
          <div className="mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Slash Commands</span>
            </div>
            {filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.command}
                  onClick={() => applySlashCommand(cmd)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    idx === slashIndex ? "bg-purple-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cmd.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${cmd.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-gray-800">{cmd.command}</span>
                      <span className="text-xs font-medium text-gray-600">{cmd.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{cmd.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pending command indicator */}
        {pendingCommand && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700 font-medium">
            <Zap className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Next message will <strong>create a {pendingCommand}</strong> — type the {pendingCommand === "task" ? "task title" : pendingCommand === "milestone" ? "milestone name" : "note content"} and press Enter
            </span>
            <button onClick={() => setPendingCommand(null)} className="ml-auto text-purple-400 hover:text-purple-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          {canEdit && (
            <div className="flex flex-col gap-1 pb-0.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach file to Assets"
                className="text-gray-400 hover:text-purple-600 transition-colors"
                disabled={!!uploadingFile}
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={() => analyzeFileInputRef.current?.click()}
                title="Analyze image, doc, or video with AI"
                className="text-gray-400 hover:text-indigo-600 transition-colors"
                disabled={isLoading || analyzingFiles}
              >
                <FileSearch className="w-4 h-4" />
              </button>
            </div>
          )}
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              pendingCommand
                ? `Type the ${pendingCommand === "task" ? "task title" : pendingCommand === "milestone" ? "milestone name" : "note content"} and press Enter...`
                : canEdit ? "Ask anything, type / for commands, or attach a file to analyze... (↵ send, ⇧↵ newline)" : "Ask anything about your project... (↵ to send)"
            }
            rows={1}
            className="resize-none text-sm min-h-[38px] max-h-[120px] flex-1"
            style={{ overflowY: input.split("\n").length > 2 ? "auto" : "hidden" }}
            disabled={isLoading || analyzingFiles}
          />
          <div className="flex flex-col gap-1.5">
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || analyzingFiles}
              size="sm"
              className="cu-button h-9 w-9 p-0 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
            {messages.length > 2 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-gray-300 hover:text-red-400 transition-colors"
                title="Clear chat history"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {canEdit && (
          <p className="text-xs text-gray-400 mt-1.5">
            <Paperclip className="w-3 h-3 inline mr-0.5" /> Drop files to save to Assets &nbsp;·&nbsp;
            <FileSearch className="w-3 h-3 inline mr-0.5" /> Click the scan icon to analyze images/docs/videos with AI
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main BuildTab ─────────────────────────────────────────────────────────

const SIDEBAR_SECTIONS = [
  { id: "chat",      icon: Sparkles,    label: "Assistant",         shortLabel: "Chat" },
  { id: "tasks",     icon: CheckSquare, label: "Tasks",             shortLabel: "Tasks" },
  { id: "milestones",icon: Flag,        label: "Milestones",        shortLabel: "Miles." },
  { id: "assets",    icon: FileStack,   label: "Assets",            shortLabel: "Assets" },
  { id: "ideation",  icon: Lightbulb,   label: "Planning & Ideation", shortLabel: "Ideation" },
  { id: "notes",     icon: BookOpen,    label: "Thoughts & Notes",  shortLabel: "Notes" },
  { id: "tools",     icon: Wrench,      label: "Project Tools",     shortLabel: "Tools" },
  { id: "links",     icon: Link2,       label: "Build Links",       shortLabel: "Links" },
  { id: "activity",  icon: Activity,    label: "Activity",          shortLabel: "Activity" },
];

export default function BuildTab({
  project, currentUser, isCollaborator, isProjectOwner,
  projectOwnerName, projectUsers, onProjectUpdate,
  tasks = [], setTasks, milestones = [], setMilestones, assets = []
}) {
  const canEdit = isCollaborator || isProjectOwner;
  const [activeSection, setActiveSection] = useState("chat");
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    if (!project?.id) return;
    base44.entities.ActivityLog.filter({ project_id: project.id }, "-created_date", 10)
      .then(setActivityLogs).catch(() => {});
  }, [project?.id]);

  // Team build links (persisted via ProjectIDE entity)
  const [savedLinks, setSavedLinks] = useState([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showAddLink, setShowAddLink] = useState(false);
  const [ideRecord, setIdeRecord] = useState(null);
  const storageKey = `cu_buildlinks_${project?.id}`;

  // Load saved links
  useEffect(() => {
    if (!project?.id) return;
    const load = async () => {
      try {
        const records = await base44.entities.ProjectIDE.filter({
          project_id: project.id,
          ide_type: "document",
          title: "__build_links__"
        });
        if (records?.length > 0) {
          const rec = records[0];
          setIdeRecord(rec);
          if (rec.content) {
            const parsed = JSON.parse(rec.content);
            if (parsed.savedLinks) setSavedLinks(parsed.savedLinks);
          }
        }
      } catch {
        try {
          const local = localStorage.getItem(storageKey);
          if (local) setSavedLinks(JSON.parse(local));
        } catch {}
      }
    };
    load();
  }, [project?.id]);

  const persistLinks = useCallback(async (links) => {
    if (!project?.id || !canEdit) return;
    const content = JSON.stringify({ savedLinks: links });
    try { localStorage.setItem(storageKey, JSON.stringify(links)); } catch {}
    try {
      if (ideRecord) {
        await base44.entities.ProjectIDE.update(ideRecord.id, { content });
      } else {
        const rec = await base44.entities.ProjectIDE.create({
          project_id: project.id,
          ide_type: "document",
          title: "__build_links__",
          content,
        });
        setIdeRecord(rec);
      }
    } catch {}
  }, [project?.id, ideRecord, canEdit]);

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    try {
      new URL(linkUrl);
      const updated = [...savedLinks, { url: linkUrl, label: linkLabel || linkUrl }];
      setSavedLinks(updated);
      persistLinks(updated);
      setLinkUrl(""); setLinkLabel(""); setShowAddLink(false);
    } catch { toast.error("Please enter a valid URL (include https://)"); }
  };

  const handleRemoveLink = (i) => {
    const updated = savedLinks.filter((_, idx) => idx !== i);
    setSavedLinks(updated);
    persistLinks(updated);
  };

  const todoCount = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;

  const sectionBadges = {
    tasks: inProgressCount > 0 ? inProgressCount : (todoCount > 0 ? todoCount : tasks.length || null),
    milestones: milestones.length || null,
    links: savedLinks.length || null,
  };

  const activeLabel = SIDEBAR_SECTIONS.find(s => s.id === activeSection)?.label || "";

  return (
    <div className="border border-purple-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Project Assistant</p>
            <p className="text-xs text-white/70 leading-tight">Your project workspace for "{project?.title || "this project"}"</p>
          </div>
        </div>
        <Badge className="bg-white/20 text-white border-0 text-xs hidden sm:flex">
          {tasks.length} tasks · {milestones.length} milestones · {assets.length} assets
        </Badge>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className="flex min-h-0">
        {/* Sidebar */}
        <div className="flex flex-col items-center gap-1 py-3 px-1.5 bg-gray-50 border-r border-gray-200 w-12 flex-shrink-0">
          {SIDEBAR_SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            const badge = sectionBadges[section.id];
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                title={section.label}
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                  active
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-400 hover:bg-purple-50 hover:text-purple-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {badge != null && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content pane */}
        <div className="flex-1 min-w-0 overflow-auto">
          {/* Summary bar — always visible at top */}
          <WorkspaceSummaryBar
            project={project}
            tasks={tasks}
            milestones={milestones}
            activityLogs={activityLogs}
            onSectionClick={setActiveSection}
          />

          {/* Section header strip */}
          {activeSection !== "chat" && (
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-white">
              <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center flex-shrink-0">
                {(() => { const Icon = SIDEBAR_SECTIONS.find(s => s.id === activeSection)?.icon; return Icon ? <Icon className="w-3.5 h-3.5 text-purple-600" /> : null; })()}
              </div>
              <p className="text-sm font-semibold text-gray-800">{activeLabel}</p>
            </div>
          )}

          {/* Chat */}
          {activeSection === "chat" && (
            <AIChat project={project} tasks={tasks} milestones={milestones} assets={assets} currentUser={currentUser} canEdit={canEdit} projectUsers={projectUsers} onProjectUpdate={onProjectUpdate} />
          )}

          {/* Tasks */}
          {activeSection === "tasks" && (
            <div className="p-4">
              <TaskBoard
                project={project}
                currentUser={currentUser}
                collaborators={projectUsers}
                isCollaborator={isCollaborator}
                isProjectOwner={isProjectOwner}
                projectOwnerName={projectOwnerName}
              />
            </div>
          )}

          {/* Milestones */}
          {activeSection === "milestones" && (
            <div className="p-4">
              <MilestonesTab
                project={project}
                currentUser={currentUser}
                isCollaborator={isCollaborator}
                isProjectOwner={isProjectOwner}
              />
            </div>
          )}

          {/* Assets */}
          {activeSection === "assets" && (
            <div className="p-4">
              <AssetsTab
                project={project}
                currentUser={currentUser}
                isCollaborator={isCollaborator}
                isProjectOwner={isProjectOwner}
                projectOwnerName={projectOwnerName}
              />
            </div>
          )}

          {/* Planning & Ideation */}
          {activeSection === "ideation" && (
            <div className="p-4">
              <IdeationHub
                project={project}
                currentUser={currentUser}
                isCollaborator={isCollaborator}
                isProjectOwner={isProjectOwner}
                projectOwnerName={projectOwnerName}
              />
            </div>
          )}

          {/* Thoughts & Notes */}
          {activeSection === "notes" && (
            <div className="p-4">
              <ThoughtsTab
                project={project}
                currentUser={currentUser}
                isCollaborator={isCollaborator}
                isProjectOwner={isProjectOwner}
                projectOwnerName={projectOwnerName}
              />
            </div>
          )}

          {/* Tools */}
          {activeSection === "tools" && (
            <div className="p-4">
              <ToolsHub
                project={project}
                onProjectUpdate={onProjectUpdate}
                isCollaborator={isCollaborator}
                isProjectOwner={isProjectOwner}
                projectOwnerName={projectOwnerName}
              />
            </div>
          )}

          {/* Build Links */}
          {activeSection === "links" && (
            <div className="p-4">
              {canEdit && (
                <div className="mb-3">
                  {showAddLink ? (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
                      <Input placeholder="Label (e.g. GitHub Repo, Figma File)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="text-sm" />
                      <div className="flex gap-2">
                        <Input type="url" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddLink()} className="text-sm" />
                        <Button onClick={handleAddLink} size="sm" className="cu-button flex-shrink-0">Add</Button>
                        <Button onClick={() => setShowAddLink(false)} size="sm" variant="ghost" className="flex-shrink-0">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setShowAddLink(true)} className="text-xs gap-1">
                      <Plus className="w-3 h-3" /> Add Link
                    </Button>
                  )}
                </div>
              )}
              {savedLinks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No build links yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedLinks.map((link, i) => (
                    <div key={i} className="flex items-center space-x-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg group">
                      <img src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} alt="" className="w-4 h-4 flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 hover:text-purple-700">
                        <p className="font-medium text-sm text-gray-900 truncate">{link.label}</p>
                        <p className="text-xs text-gray-400 truncate">{link.url}</p>
                      </a>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-purple-500"><ExternalLink className="w-3.5 h-3.5" /></a>
                      {canEdit && (
                        <button onClick={() => handleRemoveLink(i)} className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity */}
          {activeSection === "activity" && (
            <div className="p-4">
              <ActivityTab
                project={project}
                currentUser={currentUser}
                isCollaborator={isCollaborator}
                isProjectOwner={isProjectOwner}
                projectOwnerName={projectOwnerName}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}