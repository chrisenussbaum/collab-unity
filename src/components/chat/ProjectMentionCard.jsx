import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ExternalLink, Lightbulb, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUS_COLORS = {
  seeking_collaborators: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

/**
 * Renders an interactive project card embedded inside a message bubble
 * when a ##projectId token is detected.
 */
export default function ProjectMentionCard({ projectId, isOwn }) {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!projectId) return;
    base44.entities.Project.filter({ id: projectId }, "", 1)
      .then(results => setProject(results?.[0] || null))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="mt-2 rounded-xl border border-purple-200 bg-white p-3 min-w-[240px] animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const statusLabel = project.status?.replace(/_/g, " ");

  return (
    <div
      className={`mt-2 rounded-xl overflow-hidden min-w-[240px] max-w-[300px] cursor-pointer transition-all hover:shadow-md ${
        isOwn
          ? 'border border-purple-400 bg-purple-700 hover:bg-purple-600'
          : 'border border-purple-200 bg-white hover:border-purple-400'
      }`}
      onClick={() => navigate(createPageUrl(`ProjectDetail`) + `?id=${project.id}`)}
    >
      {/* Header stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-purple-300 to-indigo-400" />

      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <Avatar className="w-9 h-9 rounded-lg flex-shrink-0">
            <AvatarImage src={project.logo_url} />
            <AvatarFallback className="bg-purple-100 text-purple-600 rounded-lg text-sm font-bold">
              {project.title?.[0] || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate leading-tight ${isOwn ? 'text-white' : 'text-gray-900'}`}>{project.title}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {project.project_type && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-purple-100 text-purple-700 border-0">
                  {project.project_type}
                </Badge>
              )}
              {project.status && (
                <span className={`text-[10px] font-medium px-1.5 py-0 rounded-full ${STATUS_COLORS[project.status] || "bg-gray-100 text-gray-600"}`}>
                  {statusLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {project.description && (
          <p className={`text-xs mt-2 leading-relaxed line-clamp-2 ${isOwn ? 'text-purple-200' : 'text-gray-500'}`}>{project.description}</p>
        )}

        <div className={`flex items-center justify-between mt-2.5 pt-2.5 border-t ${isOwn ? 'border-purple-500' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-1 ${isOwn ? 'text-purple-300' : 'text-gray-400'}`}>
            <Users className="w-3 h-3" />
            <span className="text-[10px]">{project.current_collaborators_count || 1} collaborator{project.current_collaborators_count !== 1 ? "s" : ""}</span>
          </div>
          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${isOwn ? 'text-amber-300' : 'text-purple-600'}`}>
            View project <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}