import React from "react";
import { Eye, EyeOff, Users, Briefcase, Pencil } from "lucide-react";

export default function CanvasLayers({
  defs, layout, selectedId, onSelect, onToggleHide,
  isOwner, pendingApplicationsCount = 0, onOpenApplications, onOpenInvite, onEditProject,
}) {
  // Front-most first (defs order is back-to-front; reverse for display)
  const ordered = [...defs].reverse();
  return (
    <div className="py-2 text-xs">
      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Pages</div>
      <div className="px-3 py-1.5 font-semibold text-gray-700 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm bg-[#18A0FB]" />
        Canvas
      </div>
      <div className="border-t border-gray-100 mt-1" />
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Layers</div>
      <div>
        {ordered.map((d) => {
          const f = layout[d.id];
          if (!f) return null;
          const Icon = d.icon;
          const active = selectedId === d.id;
          return (
            <div
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer ${
                active ? "bg-[#18A0FB]/10 text-[#18A0FB]" : "text-gray-600 hover:bg-gray-50"
              } ${f.hidden ? "opacity-40" : ""}`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate flex-1">{d.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleHide(d.id); }}
                className="p-0.5 rounded hover:bg-gray-200 text-gray-400"
                title={f.hidden ? "Show" : "Hide"}
              >
                {f.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 mt-2" />
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Manage</div>
      {isOwner && (
        <div
          onClick={onEditProject}
          className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-gray-600 hover:bg-gray-50"
        >
          <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate flex-1">Edit Project</span>
        </div>
      )}
      {isOwner && (
        <div
          onClick={onOpenApplications}
          className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-gray-600 hover:bg-gray-50"
        >
          <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate flex-1">Applications</span>
          {pendingApplicationsCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
              {pendingApplicationsCount}
            </span>
          )}
        </div>
      )}
      {/* Team & Invite is available to all collaborators (owners + members, who can leave) */}
      <div
        onClick={onOpenInvite}
        className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-gray-600 hover:bg-gray-50"
      >
        <Users className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate flex-1">Team &amp; Invite</span>
      </div>
    </div>
  );
}