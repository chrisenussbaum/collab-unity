import React from "react";
import { Sparkles, Brain, CheckSquare, Flag, Folder, Activity } from "lucide-react";

export default function WorkspaceMockup() {
  const pills = [
    { label: "Brainstorm", color: "#FACC15" },
    { label: "Make a Plan", color: "#3B82F6" },
    { label: "Write Brief", color: "#EF4444" },
    { label: "Review", color: "#EF4444" },
    { label: "Create Task", color: "#3B82F6" },
    { label: "Add Milestone", color: "#F97316" },
    { label: "Save Note", color: "#22C559" },
  ];
  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ minHeight: 280 }}>
      {/* Sidebar */}
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-4">
        <div className="w-8 h-8 rounded-lg bg-purple-50 border-2 border-[#5B47DB] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#5B47DB]" />
        </div>
        <div className="relative w-8 h-8 flex items-center justify-center">
          <CheckSquare className="w-4 h-4 text-gray-400" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#5B47DB] text-white text-[8px] rounded-full flex items-center justify-center font-bold">5</span>
        </div>
        <Flag className="w-4 h-4 text-gray-400" />
        <Folder className="w-4 h-4 text-gray-400" />
        <Activity className="w-4 h-4 text-gray-400" />
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-[#5B47DB]">In Progress</span>
          <span className="text-xs text-gray-400">67% complete</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#5B47DB] rounded-full" style={{ width: "67%" }} />
          </div>
        </div>
        <div className="flex gap-2 mb-3 text-[10px] text-gray-500">
          <span>1 to do</span><span>·</span><span>5 active</span><span>·</span><span>12 done</span>
        </div>

        {/* Chat messages */}
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex justify-end">
            <div className="bg-[#7C6AE8] text-white text-xs rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%]">
              I have 2 overdue tasks. Help me triage — which should I prioritize?
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%]">
              <Brain className="w-3 h-3 inline mr-1 text-[#5B47DB]" />
              It is critical that we address the API integration first — it's blocking the checkout flow...
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {pills.map((p, i) => (
              <span key={i} className="text-[9px] font-medium border rounded-full px-2 py-0.5" style={{ borderColor: `${p.color}40`, color: p.color }}>
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="mt-3 border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-400 flex-1">Ask anything, type / for commands...</span>
          <div className="w-7 h-7 bg-[#7C6AE8] rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l20-9L2 3v7l14 2-14 2v7z" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}