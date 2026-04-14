import React from "react";
import { CheckSquare, Flag, FileText, Paperclip, Wrench, Lightbulb, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TYPE_CONFIG = {
  tasks:      { icon: CheckSquare, color: "text-blue-500",   bg: "bg-blue-50",   label: "Task"      },
  milestones: { icon: Flag,        color: "text-amber-500",  bg: "bg-amber-50",  label: "Milestone" },
  thoughts:   { icon: Lightbulb,   color: "text-yellow-500", bg: "bg-yellow-50", label: "Note"      },
  assets:     { icon: Paperclip,   color: "text-green-500",  bg: "bg-green-50",  label: "Asset"     },
  tools:      { icon: Wrench,      color: "text-purple-500", bg: "bg-purple-50", label: "Tool"      },
};

/**
 * Renders a compact reference card for a project item (task, milestone, note, asset, tool)
 * embedded inside a message bubble.
 * Token format: ^^type:projectId:itemId:projectTitle|itemTitle
 */
export default function ProjectItemReferenceCard({ token }) {
  const navigate = useNavigate();

  // Parse token: ^^type:projectId:itemId:projectTitle|itemTitle
  let type, projectId, itemId, projectTitle, itemTitle;
  try {
    const inner = token.slice(2); // strip ^^
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
  } catch {
    return null;
  }

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.tasks;
  const Icon = config.icon;

  const handleClick = () => {
    navigate(createPageUrl("ProjectDetail") + `?id=${projectId}`);
  };

  return (
    <div
      onClick={handleClick}
      className="mt-2 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 max-w-[280px] cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all"
    >
      <div className={`w-7 h-7 rounded-md ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{config.label} · {projectTitle}</p>
        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{itemTitle}</p>
      </div>
      <ExternalLink className="w-3 h-3 text-gray-300 flex-shrink-0" />
    </div>
  );
}