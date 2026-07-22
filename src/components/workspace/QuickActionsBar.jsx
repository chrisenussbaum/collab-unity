import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Lightbulb,
  Map,
  FileText,
  AlertCircle,
  PlusSquare,
  Flag,
  BookOpen,
  Wrench,
  Check,
  Loader2,
  Search,
} from "lucide-react";

// Master list of all pill actions with their styling (literal Tailwind classes)
// isAction pills open the ProjectActionModal; prompt pills send a message to the agent.
const PILL_ACTIONS = [
  {
    id: "brainstorm",
    label: "Brainstorm",
    icon: Lightbulb,
    prompt: "Let's brainstorm some fresh ideas and angles for this project.",
    classes: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100",
  },
  {
    id: "plan",
    label: "Make a Plan",
    icon: Map,
    prompt: "Help me make a clear, step-by-step plan for this project.",
    classes: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  },
  {
    id: "brief",
    label: "Write Brief",
    icon: FileText,
    prompt: "Write a concise project brief for this project.",
    classes: "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100",
  },
  {
    id: "overdue",
    label: "Review Overdue",
    icon: AlertCircle,
    prompt: "Review the overdue tasks and suggest how to handle them.",
    classes: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
    isAction: true,
    isDynamic: true,
  },
  {
    id: "task",
    label: "Create Task",
    icon: PlusSquare,
    prompt: "",
    classes: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    isAction: true,
  },
  {
    id: "milestone",
    label: "Add Milestone",
    icon: Flag,
    prompt: "",
    classes: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
    isAction: true,
  },
  {
    id: "note",
    label: "Save Note",
    icon: BookOpen,
    prompt: "",
    classes: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
    isAction: true,
  },
  {
    id: "tool",
    label: "Add Tool",
    icon: Wrench,
    prompt: "",
    classes: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
    isAction: true,
  },
];

/**
 * Build the dynamic set of quick prompts based on project state.
 * - "Review Overdue" only appears when there are overdue tasks (with count).
 * - "Write Brief" becomes "Summarize New Document" when recent doc activity exists.
 */
export function getDynamicQuickPrompts(project, tasks = [], milestones = []) {
  const now = new Date();

  const overdueTasks = (tasks || []).filter(
    (t) => t.status !== "done" && t.due_date && new Date(t.due_date) < now
  );

  const hasRecentDocs = (project?.highlights || []).some((h) => {
    if (!h.uploaded_at) return false;
    const uploaded = new Date(h.uploaded_at);
    const daysSince = (now - uploaded) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });

  let prompts = PILL_ACTIONS.map((p) => ({ ...p }));

  // Overdue pill — only show when there are overdue tasks
  const overdueIdx = prompts.findIndex((p) => p.id === "overdue");
  if (overdueTasks.length > 0) {
    prompts[overdueIdx] = {
      ...prompts[overdueIdx],
      label: `Review ${overdueTasks.length} Overdue`,
      prompt: `Review the ${overdueTasks.length} overdue task(s) in this project and suggest how to prioritize and handle them.`,
    };
  } else {
    prompts = prompts.filter((p) => p.id !== "overdue");
  }

  // Brief pill — swap to "Summarize New Document" when recent uploads exist
  const briefIdx = prompts.findIndex((p) => p.id === "brief");
  if (hasRecentDocs && briefIdx >= 0) {
    prompts[briefIdx] = {
      ...prompts[briefIdx],
      label: "Summarize New Document",
      prompt:
        "Summarize the recently uploaded document(s) for this project and highlight the key takeaways.",
    };
  }

  return prompts;
}

export default function QuickActionsBar({
  prompts,
  onSendPrompt,
  onOpenAction,
  isLoading,
}) {
  const [activePill, setActivePill] = useState(null); // { id, status: 'loading' | 'success' }
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // Global Cmd+K / Ctrl+K listener to open the command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus search input when command palette opens
  useEffect(() => {
    if (commandOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else if (!commandOpen) {
      setSearchQuery("");
    }
  }, [commandOpen]);

  const handlePillClick = async (pill) => {
    if (pill.isAction) {
      onOpenAction(pill.id);
      return;
    }
    if (isLoading) return;
    setActivePill({ id: pill.id, status: "loading" });
    const success = await onSendPrompt(pill.prompt);
    if (success) {
      setActivePill({ id: pill.id, status: "success" });
      setTimeout(() => setActivePill(null), 1500);
    } else {
      setActivePill(null);
    }
  };

  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;
    const q = searchQuery.toLowerCase();
    return prompts.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.prompt || "").toLowerCase().includes(q)
    );
  }, [prompts, searchQuery]);

  const renderPillContent = (pill) => {
    const Icon = pill.icon;
    const isActive = activePill?.id === pill.id;

    if (isActive && activePill.status === "loading") {
      return (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Working…</span>
        </>
      );
    }
    if (isActive && activePill.status === "success") {
      return (
        <>
          <Check className="w-3 h-3" />
          <span>Done!</span>
        </>
      );
    }
    return (
      <>
        <Icon className="w-3 h-3" />
        <span>{pill.label}</span>
      </>
    );
  };

  return (
    <>
      <div className="px-3 py-2 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400 font-medium">Quick actions</p>
          <button
            onClick={() => setCommandOpen(true)}
            className="text-[10px] text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-1"
          >
            <Search className="w-2.5 h-2.5" />
            <span>⌘K</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {prompts.map((pill) => {
            const isActive = activePill?.id === pill.id;
            const isSuccess = isActive && activePill.status === "success";
            return (
              <button
                key={pill.id}
                onClick={() => handlePillClick(pill)}
                disabled={isLoading && !isActive && !pill.isAction}
                className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-xs font-medium transition-all ${pill.classes} ${
                  isActive && activePill.status === "loading" ? "opacity-90" : ""
                } ${isSuccess ? "ring-2 ring-green-300" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {renderPillContent(pill)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Command Palette */}
      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="text-sm">Quick Actions</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actions…"
                className="pl-8 text-sm h-9"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto px-2 pb-3">
            {filteredPrompts.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">
                No matching actions
              </p>
            ) : (
              filteredPrompts.map((pill) => {
                const Icon = pill.icon;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      setCommandOpen(false);
                      handlePillClick(pill);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-purple-50 transition-colors text-left"
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {pill.label}
                      </p>
                      {pill.prompt && (
                        <p className="text-[11px] text-gray-400 truncate">
                          {pill.prompt}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}