import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Users, Search } from "lucide-react";

/**
 * Dropdown shown when user types "#" in the chat input.
 * onSelect(project) — inserts the project mention token.
 */
export default function ProjectMentionPopover({ query, currentUser, onSelect, onClose }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        // Search projects the user owns or collaborates on, plus public projects
        const [owned, collab] = await Promise.all([
          base44.entities.Project.filter({ created_by: currentUser.email }, "-updated_date", 20),
          base44.entities.Project.filter({}, "-updated_date", 50),
        ]);
        if (cancelled) return;

        // Merge + dedupe
        const merged = [...owned];
        collab.forEach(p => {
          if (!merged.find(x => x.id === p.id)) merged.push(p);
        });

        // Filter by query
        const q = query.toLowerCase();
        const filtered = merged.filter(p =>
          !q || p.title?.toLowerCase().includes(q)
        );

        setProjects(filtered.slice(0, 8));
      } catch (e) {
        console.error("Error loading projects for mention:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [query, currentUser]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
    >
      <div className="px-3 py-2 border-b bg-purple-50 flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-purple-500" />
        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
          {query ? `Projects matching "${query}"` : "All Projects"}
        </span>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-400">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No projects found
        </div>
      ) : (
        <ul className="max-h-60 overflow-y-auto">
          {projects.map(project => (
            <li key={project.id}>
              <button
                onMouseDown={(e) => { e.preventDefault(); onSelect(project); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 transition-colors text-left"
              >
                <Avatar className="w-8 h-8 rounded-lg flex-shrink-0">
                  <AvatarImage src={project.logo_url} />
                  <AvatarFallback className="bg-purple-100 text-purple-600 rounded-lg text-xs font-bold">
                    {project.title?.[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{project.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                      variant="secondary"
                      className="text-[10px] py-0 px-1.5 leading-4 bg-purple-100 text-purple-700 border-0"
                    >
                      {project.project_type}
                    </Badge>
                    {project.status && (
                      <span className="text-[10px] text-gray-400">{project.status.replace(/_/g, " ")}</span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}