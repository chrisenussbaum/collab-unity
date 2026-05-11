import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Bot, User, RefreshCw, ChevronDown, ChevronUp, Lightbulb, Wrench, Flag, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

const QUICK_PROMPTS = [
  { label: "What should I build next?", icon: Lightbulb },
  { label: "Suggest tools for this project", icon: Wrench },
  { label: "Break this into milestones", icon: Flag },
  { label: "Write a project brief", icon: FileText },
];

function buildSystemPrompt(project, tasks, milestones) {
  const parts = [
    `You are an expert project collaborator and advisor embedded inside Collab Unity, a platform where people build projects together.`,
    `You are helping with the following project:`,
    `Project: "${project?.title || "Untitled"}"`,
    project?.description ? `Description: ${project.description}` : null,
    project?.classification ? `Classification: ${project.classification}` : null,
    project?.industry ? `Industry: ${project.industry}` : null,
    project?.skills_needed?.length ? `Skills: ${project.skills_needed.join(", ")}` : null,
    project?.tools_needed?.length ? `Tools: ${project.tools_needed.join(", ")}` : null,
    project?.status ? `Status: ${project.status}` : null,
    tasks?.length ? `\nCurrent Tasks (${tasks.length}):\n${tasks.slice(0, 10).map(t => `- [${t.status}] ${t.title}`).join("\n")}` : null,
    milestones?.length ? `\nMilestones:\n${milestones.slice(0, 5).map(m => `- ${m.title || m.name} (${m.status || "pending"})`).join("\n")}` : null,
    `\nYou have full context of this project. Be specific, actionable, and refer to the actual project name and details in your responses. Keep answers concise unless asked to elaborate. Use markdown formatting for clarity.`,
  ];
  return parts.filter(Boolean).join("\n");
}

export default function ProjectAIAssistant({ project, tasks = [], milestones = [], defaultOpen = false }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey! I'm your AI project assistant for **${project?.title || "this project"}**. I can help you plan, brainstorm, break down tasks, suggest tools, write briefs, debug blockers, and more. What do you want to work on?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(project, tasks, milestones);

      // Build conversation history for context (last 10 messages)
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
    <div className="border border-purple-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Header — always visible, toggles the panel */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight">AI Project Assistant</p>
            <p className="text-xs text-white/70 leading-tight">Ask anything about your project</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <Badge className="bg-white/20 text-white text-xs border-0 px-2">
              {messages.length - 1} messages
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
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === "user"
                    ? "bg-purple-600"
                    : "bg-gradient-to-br from-purple-500 to-indigo-600"
                }`}>
                  {msg.role === "user"
                    ? <User className="w-3.5 h-3.5 text-white" />
                    : <Bot className="w-3.5 h-3.5 text-white" />
                  }
                </div>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
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
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything... ⌘↵ to send"
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
          </div>
        </div>
      )}
    </div>
  );
}