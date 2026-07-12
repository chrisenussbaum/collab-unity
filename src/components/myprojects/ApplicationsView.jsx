import React, { useState } from 'react';
import { Send, Inbox } from 'lucide-react';
import MyProjectApplicationsPanel from '@/components/myprojects/MyProjectApplicationsPanel';
import ReceivedApplicationsPanel from '@/components/applications/ReceivedApplicationsPanel';

export default function ApplicationsView({ currentUser }) {
  const [subTab, setSubTab] = useState("sent");

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-200">
        <button
          onClick={() => setSubTab("sent")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
            subTab === "sent"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Send className="w-4 h-4" />
          My Applications
        </button>
        <button
          onClick={() => setSubTab("received")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
            subTab === "received"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Inbox className="w-4 h-4" />
          Received
        </button>
      </div>

      {subTab === "sent" ? (
        <MyProjectApplicationsPanel currentUser={currentUser} />
      ) : (
        <ReceivedApplicationsPanel currentUser={currentUser} />
      )}
    </div>
  );
}