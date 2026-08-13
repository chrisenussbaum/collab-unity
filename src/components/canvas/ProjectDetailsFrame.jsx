import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Pencil, Sparkles } from "lucide-react";

const STATUS_LABELS = {
  seeking_collaborators: "Seeking Collaborators",
  in_progress: "In Progress",
  completed: "Completed",
};
const CLASS_LABELS = {
  educational: "Educational",
  career_development: "Career Development",
  hobby: "Hobby",
  business: "Business",
  nonprofit: "Nonprofit",
  startup: "Startup",
};

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 flex-1 break-words">{value}</span>
    </div>
  );
}

export default function ProjectDetailsFrame({ project, canEdit = false }) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-3">
        {project?.logo_url ? (
          <img src={project.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-[#18A0FB]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#18A0FB]" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-800 truncate">{project?.title}</h3>
          {project?.status && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18A0FB]/10 text-[#18A0FB]">
              {STATUS_LABELS[project.status] || project.status}
            </span>
          )}
        </div>
        {canEdit && (
          <Link
            to={createPageUrl(`EditProject?id=${project?.id}`)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#18A0FB] hover:bg-[#0E8FE0] text-white text-xs flex-shrink-0"
          >
            <Pencil className="w-3 h-3" /> Edit
          </Link>
        )}
      </div>

      {project?.description && <p className="text-sm text-gray-600">{project.description}</p>}

      <div>
        <Row label="Type" value={project?.project_type} />
        <Row label="Class" value={CLASS_LABELS[project?.classification] || project?.classification} />
        <Row label="Industry" value={project?.industry} />
        <Row label="Area" value={project?.area_of_interest} />
        <Row label="Location" value={project?.location} />
      </div>

      {project?.skills_needed?.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Skills</div>
          <div className="flex flex-wrap gap-1">
            {project.skills_needed.map((s, i) => (
              <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">{s}</span>
            ))}
          </div>
        </div>
      )}

      {project?.tools_needed?.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Tools</div>
          <div className="flex flex-wrap gap-1">
            {project.tools_needed.map((t, i) => (
              <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{t}</span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-400">Owner: {project?.created_by}</p>
    </div>
  );
}