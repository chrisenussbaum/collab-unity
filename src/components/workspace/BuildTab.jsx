import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Send, Sparkles, Bot, User, RefreshCw, ChevronDown, ChevronUp,
  Lightbulb, Wrench, Flag, FileText, CheckSquare, FileStack,
  Activity, BookOpen, Layers, Link2, Plus, Trash2, ExternalLink,
  PenTool, Eye, Search, ArrowRight, X, AlertTriangle, Hammer,
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
      content: `Hey! I'm your AI assistant for **${project?.title || "this project"}**. I can help you plan tasks, brainstorm ideas, suggest tools, write briefs, debug blockers, and more. You can also **drag & drop files** here to save them to Assets. What do you want to work on?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
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

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

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

  const handleKeyDown = (e) => {
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
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={canEdit ? "Ask anything or drop a file to save it to Assets... (⌘↵ to send)" : "Ask anything about your project... (⌘↵ to send)"}
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

// ─── Collapsible section wrapper ───────────────────────────────────────────

function Section({ icon: Icon, title, description, defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              {badge != null && (
                <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">{badge}</Badge>
              )}
            </div>
            {description && <p className="text-xs text-gray-400">{description}</p>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main BuildTab ─────────────────────────────────────────────────────────

export default function BuildTab({
  project, currentUser, isCollaborator, isProjectOwner,
  projectOwnerName, projectUsers, onProjectUpdate,
  tasks = [], setTasks, milestones = [], setMilestones, assets = []
}) {
  const canEdit = isCollaborator || isProjectOwner;

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

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Hammer className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Build Workspace</h2>
          <p className="text-sm text-gray-500">
            {project?.title ? `Your AI-powered workspace for "${project.title}"` : "Everything you need to build your project — in one place."}
          </p>
        </div>
      </div>

      {/* ── AI Chat (always open, primary feature) ── */}
      <div className="border border-purple-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">AI Project Assistant</p>
              <p className="text-xs text-white/70 leading-tight">Ask anything about your project</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0 text-xs">
            {tasks.length} tasks · {milestones.length} milestones · {assets.length} assets
          </Badge>
        </div>
        <AIChat project={project} tasks={tasks} milestones={milestones} assets={assets} currentUser={currentUser} canEdit={canEdit} />
      </div>

      {/* ── Team Build Links ── */}
      <Section
        icon={Link2}
        title="Team Build Links"
        description="Repos, staging environments, design files, docs"
        badge={savedLinks.length || null}
      >
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
          <p className="text-sm text-gray-400 text-center py-4">No build links yet.</p>
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
      </Section>

      {/* ── Tasks ── */}
      <Section
        icon={CheckSquare}
        title="Tasks"
        description="Action items and daily work"
        badge={inProgressCount > 0 ? `${inProgressCount} in progress` : (todoCount > 0 ? `${todoCount} to do` : tasks.length)}
        defaultOpen={true}
      >
        <TaskBoard
          project={project}
          currentUser={currentUser}
          collaborators={projectUsers}
          isCollaborator={isCollaborator}
          isProjectOwner={isProjectOwner}
          projectOwnerName={projectOwnerName}
        />
      </Section>

      {/* ── Milestones ── */}
      <Section
        icon={Flag}
        title="Milestones"
        description="Major goals and key achievements"
        badge={milestones.length || null}
      >
        <MilestonesTab
          project={project}
          currentUser={currentUser}
          isCollaborator={isCollaborator}
          isProjectOwner={isProjectOwner}
        />
      </Section>

      {/* ── Assets ── */}
      <Section
        icon={FileStack}
        title="Assets"
        description="Project files, uploads, and links"
      >
        <AssetsTab
          project={project}
          currentUser={currentUser}
          isCollaborator={isCollaborator}
          isProjectOwner={isProjectOwner}
          projectOwnerName={projectOwnerName}
        />
      </Section>

      {/* ── Planning & Ideation ── */}
      <Section
        icon={Lightbulb}
        title="Planning & Ideation"
        description="Brainstorm, whiteboard, and plan project steps"
      >
        <IdeationHub
          project={project}
          currentUser={currentUser}
          isCollaborator={isCollaborator}
          isProjectOwner={isProjectOwner}
          projectOwnerName={projectOwnerName}
        />
      </Section>

      {/* ── Thoughts ── */}
      <Section
        icon={BookOpen}
        title="Thoughts & Notes"
        description="Reflections, insights, and shared notes"
      >
        <ThoughtsTab
          project={project}
          currentUser={currentUser}
          isCollaborator={isCollaborator}
          isProjectOwner={isProjectOwner}
          projectOwnerName={projectOwnerName}
        />
      </Section>

      {/* ── Tools ── */}
      <Section
        icon={Wrench}
        title="Project Tools"
        description="Tools and integrations for this project"
      >
        <ToolsHub
          project={project}
          onProjectUpdate={onProjectUpdate}
          isCollaborator={isCollaborator}
          isProjectOwner={isProjectOwner}
          projectOwnerName={projectOwnerName}
        />
      </Section>

      {/* ── Activity ── */}
      <Section
        icon={Activity}
        title="Activity"
        description="Project activity timeline and history"
      >
        <ActivityTab
          project={project}
          currentUser={currentUser}
          isCollaborator={isCollaborator}
          isProjectOwner={isProjectOwner}
          projectOwnerName={projectOwnerName}
        />
      </Section>
    </div>
  );
}