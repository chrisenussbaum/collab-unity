import React, { useState, useEffect } from "react";
import { CheckSquare, Flag, Paperclip, Wrench, Lightbulb, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const TYPE_CONFIG = {
  tasks:      { icon: CheckSquare, color: "text-blue-500",   bg: "bg-blue-50",   label: "Task",      tab: "tasks"      },
  milestones: { icon: Flag,        color: "text-amber-500",  bg: "bg-amber-50",  label: "Milestone", tab: "milestones" },
  thoughts:   { icon: Lightbulb,   color: "text-yellow-500", bg: "bg-yellow-50", label: "Note",      tab: "thoughts"   },
  assets:     { icon: Paperclip,   color: "text-green-500",  bg: "bg-green-50",  label: "Asset",     tab: "assets"     },
  tools:      { icon: Wrench,      color: "text-purple-500", bg: "bg-purple-50", label: "Tool",      tab: "tools"      },
};

/**
 * Renders a compact reference card for a project item.
 * Validates the viewing user is a collaborator before allowing navigation.
 * Navigates to the specific workspace tab for the item type.
 * Token format: ^^type:projectId:itemId:projectTitle|itemTitle
 */
export default function ProjectItemReferenceCard({ token, currentUser }) {
  const navigate = useNavigate();
  const [accessStatus, setAccessStatus] = useState("checking"); // "checking" | "allowed" | "denied"

  // Parse token — done before hooks so values are available
  let type = "", projectId = "", itemId = "", projectTitle = "", itemTitle = "";
  try {
    const inner = token.slice(2);
    const firstColon = inner.indexOf(":");
    const secondColon = inner.indexOf(":", firstColon + 1);
    const thirdColon = inner.indexOf(":", secondColon + 1);
    type = inner.slice(0, firstColon);
    projectId = inner.slice(firstColon + 1, secondColon);
    itemId = inner.slice(secondColon + 1, thirdColon);
    const rest = inner.slice(thirdColon + 1);
    const pipeIdx = rest.indexOf("|");
    projectTitle = rest.slice(0, pipeIdx);
    itemTitle = rest.slice(pipeIdx + 1);
  } catch { /* leave defaults */ }

  // Verify current user has access to this project
  useEffect(() => {
    if (!currentUser || !projectId) {
      setAccessStatus("denied");
      return;
    }
    base44.entities.Project.filter({ id: projectId }, "", 1)
      .then(results => {
        const project = results?.[0];
        if (!project) { setAccessStatus("denied"); return; }
        const memberEmails = new Set([
          project.created_by,
          ...(project.collaborator_emails || [])
        ]);
        setAccessStatus(memberEmails.has(currentUser.email) ? "allowed" : "denied");
      })
      .catch(() => setAccessStatus("denied"));
  }, [projectId, currentUser?.email]);

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.tasks;
  const Icon = config.icon;

  if (!type || !projectId) return null;

  const handleClick = () => {
    if (accessStatus !== "allowed") return;
    // Navigate to the project workspace with the correct tab
    navigate(createPageUrl("ProjectDetail") + `?id=${projectId}&tab=${config.tab}`);
  };

  // Denied / not a collaborator
  if (accessStatus === "denied") {
    return (
      <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-[280px] opacity-60">
        <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Lock className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{config.label} · {projectTitle}</p>
          <p className="text-sm font-semibold text-gray-500 truncate leading-tight">{itemTitle}</p>
        </div>
        <Lock className="w-3 h-3 text-gray-300 flex-shrink-0" />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`mt-2 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 max-w-[280px] transition-all ${
        accessStatus === "allowed"
          ? "cursor-pointer hover:border-purple-300 hover:shadow-sm"
          : "opacity-50 cursor-not-allowed"
      }`}
    >
      <div className={`w-7 h-7 rounded-md ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{config.label} · {projectTitle}</p>
        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{itemTitle}</p>
      </div>
      {accessStatus === "checking" ? (
        <div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-purple-500 animate-spin flex-shrink-0" />
      ) : (
        <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )}
    </div>
  );
}