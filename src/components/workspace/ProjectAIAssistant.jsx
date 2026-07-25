import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import QuickActionsBar, { getDynamicQuickPrompts } from "./QuickActionsBar";
import ProjectActionModal from "./ProjectActionModal";
import RichLinkPreview from "./RichLinkPreview";
import ToolSuggestionCards from "./ToolSuggestionCards";
import { toast } from "sonner";

const GREETING = (title) =>
  `Hey! I'm your AI project assistant for **${title || "this project"}**. I can research tools, videos, and articles from the web, pull context from your tasks and milestones, and help you plan, build, and track progress. What do you want to work on?`;

// Resolve which entity action a pill id maps to
const PILL_TO_ACTION = {
  overdue: "review",
  task: "task",
  milestone: "milestone",
  note: "note",
  tool: "tool",
};

// Build a compact context string from the project's current state + the app library
function buildContext(project, tasks, milestones, appLibrary) {
  const taskSummary = (tasks || [])
    .slice(0, 15)
    .map((t) => `- ${t.title || "Untitled"} [${t.status || "todo"}]${t.due_date ? ` due ${String(t.due_date).slice(0, 10)}` : ""}`)
    .join("\n");
  const milestoneSummary = (milestones || [])
    .slice(0, 8)
    .map((m) => `- ${m.title || "Untitled"} [${m.status || "pending"}]`)
    .join("\n");
  const librarySummary = (appLibrary || [])
    .slice(0, 30)
    .map((a) => `${a.name} (${a.category || "tool"}) — ${a.website_url}${a.logo_url ? ` | logo: ${a.logo_url}` : ""}`)
    .join("\n");

  return `You are the AI Project Assistant for a Collab Unity project. You help the user make real progress toward their goal.

## Project
Title: ${project?.title || "Untitled"}
Description: ${project?.description || "N/A"}
Classification: ${project?.classification || "N/A"}
Industry: ${project?.industry || "N/A"}
Area of interest: ${project?.area_of_interest || "N/A"}
Status: ${project?.status || "N/A"}

## Current Tasks
${taskSummary || "No tasks yet."}

## Milestones
${milestoneSummary || "No milestones yet."}

## App Library (curated tools available on the platform)
${librarySummary || "No curated tools available."}`;
}

const SYSTEM_INSTRUCTIONS = `## How to respond
- Respond in markdown. Be specific and actionable; refer to the actual project, tasks, and milestones by name.
- When the user asks for resources (articles, videos, tutorials, docs), include them as markdown links in "response". Use the REAL page or video title as the link text (never a bare URL or a generic label). Put each link on its own line, grouped under ## headings (## Web articles, ## Video resources, ## Documentation links). The chat renders each link as a visual preview card.
- When tools are relevant to the request, populate "suggested_tools". Prefer tools from the App Library above when they fit; otherwise suggest well-known real tools with their official website URLs. Each tool needs a name and url; include a logo image URL in "icon" when available (empty string otherwise).
- Keep "response" concise unless the user explicitly asks for detail.
- Return a JSON object: { "response": "<markdown>", "suggested_tools": [{ "name": "...", "url": "...", "icon": "..." }] }. Use an empty array for suggested_tools when no tools are relevant.`;

export default function ProjectAIAssistant({
  project,
  tasks = [],
  milestones = [],
  collaborators = [],
  defaultOpen = false,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [actionModalType, setActionModalType] = useState(null);

  const appLibraryRef = useRef([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const dynamicPrompts = getDynamicQuickPrompts(project, tasks, milestones);

  const overdueCount = useMemo(() => {
    const now = new Date();
    return (tasks || []).filter(
      (t) => t.status !== "done" && t.due_date && new Date(t.due_date) < now
    ).length;
  }, [tasks]);

  // Fetch the App Library once for tool suggestions
  useEffect(() => {
    if (!isOpen || appLibraryRef.current.length > 0) return;
    base44.entities.AppLibraryApp.list("-is_featured", 40)
      .then((apps) => {
        appLibraryRef.current = apps || [];
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    const userMsg = { role: "user", content: userText };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsLoading(true);

    try {
      const conversation = history
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      const prompt = `${buildContext(project, tasks, milestones, appLibraryRef.current)}

${SYSTEM_INSTRUCTIONS}

## Conversation
${conversation}

Respond now.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            suggested_tools: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  url: { type: "string" },
                  icon: { type: "string" },
                },
                required: ["name", "url"],
              },
            },
          },
          required: ["response"],
        },
      });

      const responseText =
        typeof result === "string" ? result : result?.response || "";
      const tools =
        typeof result === "object" && Array.isArray(result.suggested_tools)
          ? result.suggested_tools
          : [];

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseText, tools },
      ]);
    } catch (err) {
      console.error("Assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I ran into an issue. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAction = (pillId) => {
    const actionType = PILL_TO_ACTION[pillId] || pillId;
    setActionModalType(actionType);
  };

  const runReview = async () => {
    const prompt =
      overdueCount > 0
        ? `Review the ${overdueCount} overdue task(s) in this project. For each overdue task: (1) assign a priority level (High/Medium/Low) with justification, (2) recommend a specific action, and (3) suggest a realistic timeline. End with "Next Steps" — the 2 highest-impact actions to recover momentum.`
        : `Run a general project health review. Summarize current status, flag risks, and suggest the top 3 next steps to keep momentum.`;
    await sendMessage(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Add a suggested tool to the project's project_tools array
  const handleAddTool = useCallback(async (tool) => {
    if (!project?.id) return;
    try {
      const existing = Array.isArray(project.project_tools) ? project.project_tools : [];
      if (existing.some((t) => t.url === tool.url)) {
        toast(`${tool.name} is already in your project tools`);
        return;
      }
      const updated = [...existing, { name: tool.name, url: tool.url, icon: tool.icon }];
      await base44.entities.Project.update(project.id, { project_tools: updated });
      toast.success(`${tool.name} added to your project`);
    } catch (error) {
      console.error("Error adding tool:", error);
      toast.error("Failed to add tool");
    }
  }, [project]);

  // Markdown renderer: render every external link as a rich preview card
  const chatMarkdownComponents = useMemo(
    () => ({
      a: ({ href, children }) => {
        const raw = Array.isArray(children) ? children.join("") : children;
        const text = typeof raw === "string" ? raw.trim() : "";
        const title = text && !text.startsWith("http") ? text : href;
        if (href) {
          return (
            <span className="block my-2 not-prose">
              <RichLinkPreview url={href} title={title} />
            </span>
          );
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline break-all">
            {children}
          </a>
        );
      },
    }),
    []
  );

  const hasMessages = messages.length > 0;
  const messageCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="border border-purple-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Header — always visible, toggles the panel */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight">AI Project Assistant</p>
            <p className="text-xs text-white/70 leading-tight">Research, plan, and build — your project knowledge source</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messageCount > 0 && (
            <Badge className="bg-white/20 text-white text-xs border-0 px-2">
              {messageCount} messages
            </Badge>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Chat Body */}
      {isOpen && (
        <div className="flex flex-col" style={{ height: "480px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {/* Local greeting before the first message */}
            {!hasMessages && !isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-white border border-gray-200 text-gray-800 shadow-sm">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{GREETING(project?.title)}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === "user"
                      ? "bg-purple-600"
                      : "bg-gradient-to-br from-purple-500 to-indigo-600"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-tr-sm"
                      : msg.isError
                        ? "bg-red-50 border border-red-200 text-red-700 rounded-tl-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900">
                        <ReactMarkdown components={chatMarkdownComponents}>
                          {msg.content || ""}
                        </ReactMarkdown>
                      </div>
                      {msg.tools && msg.tools.length > 0 && (
                        <div className="not-prose mt-3">
                          <ToolSuggestionCards tools={msg.tools} onAddTool={handleAddTool} />
                        </div>
                      )}
                    </>
                  ) : (
                    <p>{msg.content}</p>
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

          {/* Quick Actions Bar (dynamic pills + Cmd+K) */}
          <QuickActionsBar
            prompts={dynamicPrompts}
            onSendPrompt={sendMessage}
            onOpenAction={handleOpenAction}
            isLoading={isLoading}
          />

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything… research tools, videos, articles, or plan next steps. ⌘↵ to send"
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
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="text-gray-300 hover:text-gray-500 transition-colors"
                    title="Clear chat"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generic Project Action Modal (Create Task, Add Milestone, Save Note, Add Tool, Review) */}
      <ProjectActionModal
        open={!!actionModalType}
        onOpenChange={(open) => !open && setActionModalType(null)}
        actionType={actionModalType}
        project={project}
        collaborators={collaborators}
        overdueCount={overdueCount}
        onRunReview={runReview}
      />
    </div>
  );
}