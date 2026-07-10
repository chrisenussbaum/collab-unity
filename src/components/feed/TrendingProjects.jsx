import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Info, Loader2, Flame } from "lucide-react";
import { createPageUrl } from "@/utils";
import { getTrendingProjects } from "@/functions/getTrendingProjects";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ACCENT_COLORS = [
  { bg: "#F59E0B", light: "#FEF3C7" }, // gold
  { bg: "#1E1B4B", light: "#E0E7FF" }, // indigo-dark
  { bg: "#3B82F6", light: "#DBEAFE" }, // blue
];

export default function TrendingProjects() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchTrending = async () => {
      try {
        const { data } = await getTrendingProjects();
        if (cancelled) return;
        setProjects(data?.trendingProjects || []);
      } catch (e) {
        console.error("Error fetching trending projects:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchTrending();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-purple-200 overflow-hidden shadow-sm">
        <div className="cu-gradient px-4 py-3 flex items-center justify-center">
          <span className="text-white font-bold text-sm">Trending Projects</span>
        </div>
        <div className="bg-white p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (projects.length === 0) return null;

  const topProjects = projects.slice(0, 3);

  return (
    <div className="rounded-xl border border-purple-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="cu-gradient px-4 py-3 flex items-center justify-center relative">
        <Flame className="w-4 h-4 text-white/90 mr-1.5" />
        <span className="text-white font-bold text-sm tracking-wide">Trending Projects</span>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors">
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px] text-xs">
              Work on projects, complete tasks, and engage with the community to get featured here!
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Body — project cards */}
      <div className="bg-white divide-y divide-gray-100">
        {topProjects.map((project, idx) => {
          const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
          const projectUrl = createPageUrl(`ProjectDetail?id=${project.id}`);
          return (
            <Link
              key={project.id}
              to={projectUrl}
              className="block group hover:bg-gray-50 transition-colors"
            >
              {/* Accent bar with link text */}
              <div
                className="px-3 py-1.5 flex items-center justify-end"
                style={{ backgroundColor: accent.bg }}
              >
                <span className="text-white text-[11px] font-medium">
                  View {project.title} →
                </span>
              </div>

              {/* Logo + description */}
              <div className="flex items-start gap-3 p-3">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border"
                  style={{ backgroundColor: accent.light, borderColor: accent.light }}
                >
                  {project.logo_url ? (
                    <OptimizedAvatar
                      src={project.logo_url}
                      alt={project.title}
                      fallback={project.title?.[0]?.toUpperCase() || "P"}
                      size="sm"
                      className="w-full h-full rounded-lg"
                    />
                  ) : (
                    <span className="text-lg font-bold" style={{ color: accent.bg }}>
                      {project.title?.[0]?.toUpperCase() || "P"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 flex-1 min-w-0 pt-1">
                  {project.description || "No description available."}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}