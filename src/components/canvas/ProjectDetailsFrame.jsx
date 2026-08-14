import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Pencil, Sparkles, Eye, EyeOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

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

export default function ProjectDetailsFrame({ project, canEdit = false, ownerProfile, onUpdate }) {
  const isPublic = project?.is_visible_on_feed !== false;
  const [saving, setSaving] = useState(false);

  const handleToggleVisibility = async (checked) => {
    if (!canEdit || !project?.id || saving) return;
    setSaving(true);
    try {
      await base44.entities.Project.update(project.id, { is_visible_on_feed: checked });
      toast.success(checked ? "Project is now public." : "Project is now private.");
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error("Failed to update project visibility.");
    } finally {
      setSaving(false);
    }
  };

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

      {canEdit && (
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            {isPublic ? (
              <Eye className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800">{isPublic ? "Public" : "Private"}</div>
              <div className="text-[11px] text-gray-400 truncate">
                {isPublic ? "Visible to everyone on the feed" : "Only collaborators can view this project"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {saving && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
            <Switch
              checked={isPublic}
              onCheckedChange={handleToggleVisibility}
              disabled={saving}
              aria-label="Toggle project visibility"
            />
          </div>
        </div>
      )}

      <div className="text-[11px] text-gray-400">
        Owner:{" "}
        {ownerProfile?.username ? (
          <Link to={createPageUrl(`UserProfile?username=${ownerProfile.username}`)} className="text-[#18A0FB] hover:underline">
            @{ownerProfile.username}
          </Link>
        ) : (
          <span>{project?.created_by ? project.created_by.split("@")[0] : "—"}</span>
        )}
      </div>
    </div>
  );
}