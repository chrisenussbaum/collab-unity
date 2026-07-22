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
  AlertCircle,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import QuickActionsBar, { getDynamicQuickPrompts } from "./QuickActionsBar";
import ProjectActionModal from "./ProjectActionModal";

const GREETING = (title) =>
  `Hey! I'm your AI project assistant for **${title || "this project"}**. I can research tools, videos, and articles from the web, pull context from your tasks and milestones, and help you plan, build, and track progress. What do you want to work on?`;

// Render inline tool-call indicators (web search, entity reads/writes)
function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall.name || "tool";
  const status = toolCall.status || "completed";
  const isFailed = ["failed", "error"].includes(status);
  const proj = toolCall.display_projection || {};
  const label = proj.active_label || proj.label || name;

  // When hide_details && details_redacted, only show the state label
  if (proj.hide_details && proj.details_redacted) {
    return (
      <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-gray-400">
        {status === "completed" || status === "success" ? (
          <Check className="w-3 h-3 text-green-500" />
        ) : isFailed ? (
          <AlertCircle className="w-3 h-3 text-red-400" />
        ) : (
          <Loader2 className="w-3 h-3 animate-spin" />
        )}
        <span>{isFailed ? (proj.error_label || "Failed") : label}</span>
      </div>
    );
  }

  let parsedResults = toolCall.results;
  if (typeof parsedResults === "string") {
    try {
      parsedResults = JSON.parse(parsedResults);
    } catch {
      // keep raw string
    }
  }

  return (
    <div className="mt-1.5 text-[11px]">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {status === "completed" || status === "success" ? (
          <Check className="w-3 h-3 text-green-500" />
        ) : isFailed ? (
          <AlertCircle className="w-3 h-3 text-red-400" />
        ) : (
          <Loader2 className="w-3 h-3 animate-spin" />
        )}
        <span>{name}</span>
        <span className="text-gray-300">·</span>
        <span className={isFailed ? "text-red-400" : "text-gray-400"}>
          {isFailed ? "failed" : status}
        </span>
      </button>
      {expanded && (
        <div className="mt-1 ml-4 space-y-1 text-gray-500">
          {toolCall.arguments_string && (
            <div>
              <p className="font-medium text-gray-400">Parameters:</p>
              <pre className="whitespace-pre-wrap break-words bg-gray-50 rounded p-1.5 text-[10px]">
                {toolCall.arguments_string}
              </pre>
            </div>
          )}
          {parsedResults != null && (
            <div>
              <p className="font-medium text-gray-400">Result:</p>
              <pre className="whitespace-pre-wrap break-words bg-gray-50 rounded p-1.5 text-[10px]">
                {typeof parsedResults === "string"
                  ? parsedResults
                  : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Resolve which entity action a pill id maps to
const PILL_TO_ACTION = {
  overdue: "review",
  task: "task",
  milestone: "milestone",
  note: "note",
  tool: "tool",
};

export default function ProjectAIAssistant({
  project,
  tasks = [],
  milestones = [],
  collaborators = [],
  defaultOpen = false,
}) {
  const [messages, setMessages] = useState([]); // agent messages (empty until conversation starts)
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [actionModalType, setActionModalType] = useState(null);

  const conversationRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Compute dynamic quick prompts from project state
  const dynamicPrompts = getDynamicQuickPrompts(project, tasks, milestones);

  // Overdue count for the review modal
  const overdueCount = useMemo(() => {
    const now = new Date();
    return (tasks || []).filter(
      (t) => t.status !== "done" && t.due_date && new Date(t.due_date) < now
    ).length;
  }, [tasks]);

  // Create an agent conversation (once, when panel first opens)
  const ensureConversation = useCallback(async () => {
    if (conversationRef.current) return conversationRef.current;
    if (!project?.id) return null;

    // Clean up any previous subscription before starting a new one
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const conv = await base44.agents.createConversation({
      agent_name: "ProjectAssistant",
      metadata: {
        project_id: project.id,
        name: project.title || "Project",
      },
    });
    conversationRef.current = conv;

    // Subscribe to streaming updates
    unsubscribeRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      // Hide the loader once the assistant begins responding
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        setIsLoading(false);
      }
    });

    // Orient the agent with project context so it can use its entity tools
    const contextMsg = `Project context: "${project.title || "Untitled"}" (ID: ${project.id}). ${project.description || ""}. Use your entity tools (Task, ProjectMilestone, Thought, Project) with this project_id to read current state when relevant. Greet me briefly and ask what I'd like to work on.`;
    setIsLoading(true);
    await base44.agents.addMessage(conv, { role: "user", content: contextMsg });

    return conv;
  }, [project?.id, project?.title, project?.description]);

  useEffect(() => {
    if (isOpen && project?.id) {
      ensureConversation().catch(() => {
        // If conversation creation fails, we still show the greeting placeholder
      });
    }
  }, [isOpen, project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Unsubscribe on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    let conv;
    try {
      conv = await ensureConversation();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect to the assistant. Please try again.",
          isError: true,
        },
      ]);
      return false;
    }
    if (!conv) return false;

    setInput("");
    setIsLoading(true);

    // Prepend a compact context tag so the agent always knows the project
    const contextTag = `[Context: Project "${project?.title || "Untitled"}" (ID: ${project?.id})]`;
    const fullMessage = `${contextTag} ${userText}`;

    try {
      await base44.agents.addMessage(conv, { role: "user", content: fullMessage });
      return true;
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I ran into an issue sending your message. Please try again.",
          isError: true,
        },
      ]);
      setIsLoading(false);
      return false;
    }
  };

  const handleOpenAction = (pillId) => {
    const actionType = PILL_TO_ACTION[pillId] || pillId;
    setActionModalType(actionType);
  };

  // Run an AI review of overdue tasks via the agent
  const runReview = async () => {
    const prompt =
      overdueCount > 0
        ? `Review the ${overdueCount} overdue task(s) in this project. For each overdue task: (1) assign a priority level (High/Medium/Low) with justification, (2) recommend a specific action, and (3) suggest a realistic timeline. End with "Next Steps" — the 2 highest-impact actions to recover momentum. Use your Task entity tool to fetch the overdue tasks first.`
        : `Run a general project health review. Fetch the project's Tasks and Milestones using your entity tools, then summarize current status, flag risks, and suggest the top 3 next steps to keep momentum.`;
    await sendMessage(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    // Reset to a fresh conversation (unsubscribe from the old one first)
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setMessages([]);
    conversationRef.current = null;
    if (isOpen && project?.id) {
      ensureConversation().catch(() => {});
    }
  };

  const hasAgentMessages = messages.length > 0;
  const messageCount = messages.filter((m) => m.role === "user" && !m.content.startsWith("Project context:")).length;

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
            {/* Local greeting before the agent responds */}
            {!hasAgentMessages && !isLoading && (
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

            {messages.map((msg, i) => {
              // Hide the internal orientation message from the UI
              if (msg.role === "user" && msg.content.startsWith("Project context:")) {
                return null;
              }
              return (
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
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900">
                        <ReactMarkdown>{msg.content || ""}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    {msg.tool_calls?.map((tc, idx) => (
                      <ToolCallDisplay key={idx} toolCall={tc} />
                    ))}
                  </div>
                </div>
              );
            })}

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
                {messages.length > 1 && (
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