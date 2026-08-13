import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Eye, X, Building, Briefcase, Heart, GraduationCap, Users as UsersIcon, Rocket } from "lucide-react";

const categoryIcons = {
  educational: GraduationCap,
  career_development: Briefcase,
  hobby: Heart,
  business: Building,
  nonprofit: UsersIcon,
  startup: Rocket,
};

const statusColors = {
  seeking_collaborators: "text-orange-600 bg-orange-100",
  in_progress: "text-blue-600 bg-blue-100",
  completed: "text-green-600 bg-green-100",
};

// Floating, un-blurred project advertisement card shown over the read-only
// canvas so non-collaborators can see the project's public details and apply.
export default function ReadOnlyProjectBanner({ project, projectUsers, projectOwnerProfile, canApply, onApply }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const CategoryIcon = categoryIcons[project?.classification] || Building;
  const statusClass = statusColors[project?.status] || "text-gray-600 bg-gray-100";

  return (
    <div className="absolute top-3 left-3 z-30 w-[300px] max-w-[calc(100vw-24px)] bg-white/95 backdrop-blur rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
          <Eye className="w-3 h-3" /> Preview Mode
        </span>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-0.5" title="Dismiss">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-3">
        <div className="flex items-start gap-2.5 mb-2">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
            {project?.logo_url ? (
              <img src={project.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <CategoryIcon className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-sm leading-tight break-words">{project?.title}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge className={`${statusClass} text-[10px] px-1.5 py-0`}>{project?.status?.replace(/_/g, " ")}</Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{project?.classification?.replace(/_/g, " ")}</Badge>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-2">{project?.description}</p>
        {project?.skills_needed?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {project.skills_needed.slice(0, 5).map((s, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
            ))}
          </div>
        )}
        {projectUsers?.length > 0 && (
          <div className="flex items-center mb-3">
            <div className="flex -space-x-2">
              {projectUsers.slice(0, 6).map((u) => (
                <Avatar key={u.email} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={u.profile_image} />
                  <AvatarFallback className="text-[9px] bg-purple-100 text-purple-600">{u.full_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="pl-3 text-[10px] text-gray-500">{projectUsers.length} member{projectUsers.length !== 1 ? "s" : ""}</span>
          </div>
        )}
        {canApply && (
          <Button onClick={onApply} className="w-full bg-[#18A0FB] hover:bg-[#0E8FE0] text-white text-xs h-8 rounded-md">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Apply to Join
          </Button>
        )}
        <p className="text-[10px] text-gray-400 text-center mt-2">Join to access the full workspace</p>
      </div>
    </div>
  );
}