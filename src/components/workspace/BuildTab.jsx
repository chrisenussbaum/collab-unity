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
  BookMarked, Package, Database, Zap, CheckCircle2, Circle, Paperclip, Upload
} from "lucide-react";
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

const QUICK_PROMPTS = [
  { label: "What should I build next?", icon: Lightbulb },
  { label: "Suggest tools for this project", icon: Wrench },
  { label: "Break this into milestones", icon: Flag },
  { label: "Write a project brief", icon: FileText },
];

// ─── Build system prompt ───────────────────────────────────────────────────

function buildSystemPrompt(project, tasks, milestones, assets) {
  const taskLines = tasks?.slice(0, 15).map(t => {
    const parts = [`- [${t.status}] ${t.title}`];
    if (t.priority && t.priority !== "medium") parts[0] += ` (${t.priority} priority)`;
    if (t.assigned_to) parts[0] += ` — assigned to ${t.assigned_to.split("@")[0]}`;
    if (t.due_date) parts[0] += ` — due ${t.due_date}`;
    if (t.description) parts[0] += `\n  Description: ${t.description}`;
    return parts[0];
  });

  const milestoneLines = milestones?.slice(0, 8).map(m => {
    let line = `- ${m.title || m.name} [${m.status || "not_started"}]`;
    if (m.target_date) line += ` — target ${m.target_date}`;
    if (m.description) line += `\n  ${m.description}`;
    return line;
  });

  const assetLines = assets?.slice(0, 20).map(a => {
    let line = `- "${a.asset_name}" (${a.resource_type || "file"}, v${a.version_number || 1}`;
    if (a.category) line += `, category: ${a.category}`;
    if (a.tags?.length) line += `, tags: ${a.tags.join(", ")}`;
    line += ")";
    if (a.version_notes) line += `\n  Notes: ${a.version_notes}`;
    if (a.file_url) line += `\n  URL: ${a.file_url}`;
    return line;
  });

  const parts = [
    `You are an expert project collaborator and advisor embedded inside Collab Unity, a platform where people build projects together.`,
    `You are helping with the following project:`,
    `Project: "${project?.title || "Untitled"}"`,
    project?.description ? `Description: ${project.description}` : null,
    project?.classification ? `Classification: ${project.classification}` : null,
    project?.industry ? `Industry: ${project.industry}` : null,
    project?.skills_needed?.length ? `Skills needed: ${project.skills_needed.join(", ")}` : null,
    project?.tools_needed?.length ? `Tools needed: ${project.tools_needed.join(", ")}` : null,
    project?.status ? `Status: ${project.status}` : null,
    taskLines?.length ? `\nTasks (${tasks.length} total):\n${taskLines.join("\n")}` : null,
    milestoneLines?.length ? `\nMilestones (${milestones.length} total):\n${milestoneLines.join("\n")}` : null,
    assetLines?.length ? `\nProject Assets (${assets.length} total):\n${assetLines.join("\n")}` : null,
    `\nWhen users ask about specific tasks, milestones, or assets, reference them by name. You can suggest which asset versions are relevant, flag overdue tasks, and connect project files to the work being done. Be specific, actionable, and use markdown formatting for clarity.`,
  ];
  return parts.filter(Boolean).join("\n");
}

// ─── AI Chat component ─────────────────────────────────────────────────────

function AIChat({ project, tasks, milestones, assets, currentUser, canEdit }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey! I'm your AI assistant for **${project?.title || "this project"}**. I can help you plan tasks, brainstorm ideas, suggest tools, write briefs, debug blockers, and more. You can also **drag & drop files** here to save them to Assets.\n\nType **/** to see available slash commands. What do you want to work on?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // Build a task via /task command
  const handleSlashTask = async (taskTitle) => {
    if (!project?.id || !currentUser || !canEdit) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ You need edit access to create tasks." }]);
      return;
    }
    const title = taskTitle.trim() || "New Task";
    await base44.entities.Task.create({ project_id: project.id, title, status: "todo", priority: "medium" });
    toast.success(`Task "${title}" created!`);
    setMessages(prev => [...prev, { role: "assistant", content: `✅ Task **"${title}"** has been added to your project board.` }]);
  };

  // Build a milestone via /milestone command
  const handleSlashMilestone = async (milestoneName) => {
    if (!project?.id || !currentUser || !canEdit) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ You need edit access to create milestones." }]);
      return;
    }
    const name = milestoneName.trim() || "New Milestone";
    await base44.entities.ProjectMilestone.create({ project_id: project.id, title: name, status: "not_started" });
    toast.success(`Milestone "${name}" created!`);
    setMessages(prev => [...prev, { role: "assistant", content: `🏁 Milestone **"${name}"** has been added to your project milestones.` }]);
  };

  // Save a note via /note command
  const handleSlashNote = async (noteContent) => {
    if (!project?.id || !currentUser || !canEdit) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ You need edit access to save notes." }]);
      return;
    }
    const content = noteContent.trim() || "Quick note";
    await base44.entities.Thought.create({ project_id: project.id, title: content.slice(0, 60), content });
    toast.success("Note saved!");
    setMessages(prev => [...prev, { role: "assistant", content: `📝 Note saved to **Thoughts & Notes**: "${content.slice(0, 80)}${content.length > 80 ? "…" : ""}"` }]);
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

    // ── Handle slash commands ──
    if (userText.startsWith("/")) {
      const [cmd, ...rest] = userText.split(/\s+/);
      const arg = rest.join(" ");
      setInput("");
      setSlashOpen(false);

      if (cmd === "/task") {
        setMessages(prev => [...prev, { role: "user", content: userText }]);
        if (!arg) {
          setMessages(prev => [...prev, { role: "assistant", content: "What should the task be called? Reply with the task title." }]);
          return;
        }
        setMessages(prev => [...prev, { role: "user", content: userText }]);
        await handleSlashTask(arg);
        return;
      }
      if (cmd === "/milestone") {
        setMessages(prev => [...prev, { role: "user", content: userText }]);
        if (!arg) {
          setMessages(prev => [...prev, { role: "assistant", content: "What should the milestone be called? Reply with the milestone name." }]);
          return;
        }
        await handleSlashMilestone(arg);
        return;
      }
      if (cmd === "/note") {
        setMessages(prev => [...prev, { role: "user", content: userText }]);
        if (!arg) {
          setMessages(prev => [...prev, { role: "assistant", content: "What would you like to note? Reply with the note content." }]);
          return;
        }
        await handleSlashNote(arg);
        return;
      }
      if (cmd === "/help") {
        setMessages(prev => [...prev, { role: "user", content: userText }]);
        const helpText = SLASH_COMMANDS.map(c => `**${c.command}** — ${c.description}`).join("\n");
        setMessages(prev => [...prev, { role: "assistant", content: `Here are all available slash commands:\n\n${helpText}` }]);
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
        setMessages(prev => [...prev, { role: "user", content: userText }]);
        setIsLoading(true);
        try {
          const systemPrompt = buildSystemPrompt(project, tasks, milestones, assets);
          const result = await base44.integrations.Core.InvokeLLM({ prompt: `${systemPrompt}\n\n${prompt}` });
          setMessages(prev => [...prev, { role: "assistant", content: result }]);
        } catch {
          setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an issue. Please try again.", isError: true }]);
        } finally {
          setIsLoading(false);
        }
        return;
      }
    }

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(project, tasks, milestones, assets);
      const conversationHistory = newMessages.slice(-10).map(m =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      ).join("\n\n");
      const prompt = `${systemPrompt}\n\n--- CONVERSATION ---\n${conversationHistory}\n\nAssistant:`;
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages(prev => [...prev, { role: "assistant", content: result }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I ran into an issue. Please try again.",
        isError: true,
      }]);
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
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: `Chat cleared! I still have full context of **${project?.title || "this project"}**. What do you want to work on?`,
    }]);
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
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === "user" ? "bg-purple-600" : "bg-gradient-to-br from-purple-500 to-indigo-600"
            }`}>
              {msg.role === "user"
                ? <User className="w-3.5 h-3.5 text-white" />
                : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className="max-w-[80%] flex flex-col">
              <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-tr-sm"
                  : msg.isError
                    ? "bg-red-50 border border-red-200 text-red-700 rounded-tl-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900">
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
                  onSaved={() => {}}
                />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
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

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-3 py-2 bg-white border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2 font-medium">Quick actions</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((qp) => {
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

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

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

        <div className="flex gap-2 items-end">
          {canEdit && (
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach file to Assets"
              className="text-gray-400 hover:text-purple-600 transition-colors flex-shrink-0 pb-1.5"
              disabled={!!uploadingFile}
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={canEdit ? "Ask anything, type / for commands, or drop a file... (⌘↵ to send)" : "Ask anything about your project... (⌘↵ to send)"}
            rows={1}
            className="resize-none text-sm min-h-[38px] max-h-[120px] flex-1"
            style={{ overflowY: input.split("\n").length > 2 ? "auto" : "hidden" }}
            disabled={isLoading}
          />
          <div className="flex flex-col gap-1.5">
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="cu-button h-9 w-9 p-0 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
            {messages.length > 2 && (
              <button onClick={clearChat} className="text-gray-300 hover:text-gray-500 transition-colors" title="Clear chat">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {canEdit && (
          <p className="text-xs text-gray-400 mt-1.5">
            <Paperclip className="w-3 h-3 inline mr-0.5" /> Drag & drop a file anywhere in the chat to save it to Assets
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
            <Sparkles className="w-4 h-4 text-white" />
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
            <AIChat project={project} tasks={tasks} milestones={milestones} assets={assets} currentUser={currentUser} canEdit={canEdit} />
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