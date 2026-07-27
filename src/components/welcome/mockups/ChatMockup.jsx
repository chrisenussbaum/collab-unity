import React from "react";
import { Video, Paperclip, Smile, Send } from "lucide-react";

export default function ChatMockup() {
  const conversations = [
    { name: "Sarah Carter", last: "Sounds great! Let me push the changes", time: "2h ago", active: true, color: "#5B47DB" },
    { name: "James Smith", last: "Can we hop on a call tomorrow?", time: "5h ago", active: false, color: "#F97316" },
    { name: "Design Team", last: "Emily: Final mockups are ready!", time: "1d ago", active: false, color: "#22C559" },
    { name: "Alex Johnson", last: "I'll review the PR tonight", time: "3d ago", active: false, color: "#3B82F6" },
  ];
  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ minHeight: 280 }}>
      {/* Conversation list */}
      <div className="w-44 border-r border-gray-200 bg-gray-50/50">
        <div className="p-3 border-b border-gray-200">
          <div className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-400">Search conversations...</div>
        </div>
        <div className="py-1">
          {conversations.map((c, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer ${c.active ? "bg-purple-50" : ""}`}>
              <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: `${c.color}30` }} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${c.active ? "text-gray-900" : "text-gray-700"}`}>{c.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{c.last}</p>
              </div>
              <span className="text-[9px] text-gray-400">{c.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600" />
          <div>
            <p className="text-xs font-semibold text-gray-900">Sarah Carter</p>
            <p className="text-[10px] text-gray-400">Online</p>
          </div>
          <Video className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-700 text-xs rounded-2xl rounded-bl-sm px-3 py-2 max-w-[70%]">
              Hey! I just finished the API integration. Ready for code review when you have a chance.
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-[#7C6AE8] text-white text-xs rounded-2xl rounded-br-sm px-3 py-2 max-w-[70%]">
              Just merged it! Everything looks clean. Let's tackle the auth flow next.
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-700 text-xs rounded-2xl rounded-bl-sm px-3 py-2 max-w-[70%]">
              Sounds great! Let me push the changes and create a milestone for it.
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 px-3 py-2 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 flex-1">Type a message...</span>
          <Smile className="w-4 h-4 text-gray-400" />
          <div className="w-7 h-7 bg-[#7C6AE8] rounded-lg flex items-center justify-center">
            <Send className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}