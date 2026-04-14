import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CheckSquare, Flag, Paperclip, Wrench, Lightbulb, Search, ChevronRight, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CATEGORIES = [
  { key: "tasks",      label: "Tasks",      icon: CheckSquare, color: "text-blue-500" },
  { key: "milestones", label: "Milestones", icon: Flag,        color: "text-amber-500" },
  { key: "thoughts",   label: "Notes",      icon: Lightbulb,   color: "text-yellow-500" },
  { key: "assets",     label: "Assets",     icon: Paperclip,   color: "text-green-500" },
  { key: "tools",      label: "Tools",      icon: Wrench,      color: "text-purple-500" },
];

/**
 * Shows a popover when the user types "^" in chat.
 * Only shows projects that ALL conversation participants are collaborators on.
 * Flow: pick project → pick category → pick item
 */
export default function ProjectItemPopover({ query, currentUser, conversationParticipants = [], onSelect, onClose }) {
  const [step, setStep] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState(query || "");
  const ref = useRef(null);

  // Load projects shared by ALL conversation participants
  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);

    // Get all participants including current user
    const allParticipants = Array.from(new Set([currentUser.email, ...conversationParticipants]));

    Promise.all([
      base44.entities.Project.filter({ created_by: currentUser.email }),
      base44.entities.Project.filter({})
        .then(all => all.filter(p => p.collaborator_emails?.includes(currentUser.email)))
    ]).then(([owned, collab]) => {
      const merged = [...owned];
      collab.forEach(p => { if (!merged.find(m => m.id === p.id)) merged.push(p); });

      // Only keep projects where EVERY participant is a collaborator or creator
      const shared = merged.filter(p => {
        const memberEmails = new Set([
          p.created_by,
          ...(p.collaborator_emails || [])
        ]);
        return allParticipants.every(email => memberEmails.has(email));
      });

      setProjects(shared);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [currentUser, conversationParticipants.join(",")]);

  useEffect(() => { setSearch(query || ""); }, [query]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const loadItems = async (project, category) => {
    setIsLoading(true);
    setItems([]);
    try {
      let results = [];
      if (category.key === "tasks") {
        const data = await base44.entities.Task.filter({ project_id: project.id });
        results = data.map(t => ({ id: t.id, title: t.title, subtitle: t.status?.replace(/_/g, " ") }));
      } else if (category.key === "milestones") {
        const data = await base44.entities.ProjectMilestone.filter({ project_id: project.id });
        results = data.map(m => ({ id: m.id, title: m.title, subtitle: m.status?.replace(/_/g, " ") }));
      } else if (category.key === "thoughts") {
        const data = await base44.entities.Thought.filter({ project_id: project.id });
        results = data.map(t => ({ id: t.id, title: t.title, subtitle: t.category || "" }));
      } else if (category.key === "assets") {
        const data = await base44.entities.AssetVersion.filter({ project_id: project.id, is_current: true });
        results = data.map(a => ({ id: a.id, title: a.asset_name, subtitle: a.file_name || "" }));
      } else if (category.key === "tools") {
        const proj = await base44.entities.Project.filter({ id: project.id }, "", 1);
        results = (proj[0]?.project_tools || []).map((t, i) => ({ id: `tool-${i}`, title: t.name, subtitle: t.url || "" }));
      }
      setItems(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setStep("category");
    setSearch("");
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setStep("items");
    loadItems(selectedProject, cat);
    setSearch("");
  };

  const handleItemSelect = (item) => {
    onSelect({
      type: selectedCategory.key,
      projectId: selectedProject.id,
      projectTitle: selectedProject.title,
      itemId: item.id,
      itemTitle: item.title,
      label: selectedCategory.label,
    });
  };

  const filteredProjects = projects.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredItems = items.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
    >
      {/* Header breadcrumb */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
        <span className="font-semibold text-purple-600">^</span>
        {selectedProject && <><ChevronRight className="w-3 h-3" /><span className="truncate max-w-[80px]">{selectedProject.title}</span></>}
        {selectedCategory && <><ChevronRight className="w-3 h-3" /><span>{selectedCategory.label}</span></>}
        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 text-base leading-none">×</button>
      </div>

      {/* Search */}
      {step !== "category" && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Search className="w-3 h-3 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={step === "projects" ? "Search shared projects…" : "Search items…"}
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>
        </div>
      )}

      <div className="max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-400">Loading…</div>
        ) : step === "projects" ? (
          filteredProjects.length === 0 ? (
            <div className="p-4 text-center">
              <Lock className="w-5 h-5 mx-auto text-gray-300 mb-1" />
              <p className="text-sm text-gray-400">No shared projects found</p>
              <p className="text-xs text-gray-300 mt-1">All participants must be collaborators</p>
            </div>
          ) : filteredProjects.map(p => (
            <button
              key={p.id}
              onClick={() => handleProjectSelect(p)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-purple-50 transition-colors text-left"
            >
              <Avatar className="w-7 h-7 rounded-md flex-shrink-0">
                <AvatarImage src={p.logo_url} />
                <AvatarFallback className="bg-purple-100 text-purple-600 rounded-md text-xs font-bold">
                  {p.title?.[0] || "P"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-800 truncate">{p.title}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0" />
            </button>
          ))
        ) : step === "category" ? (
          CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategorySelect(cat)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-purple-50 transition-colors text-left"
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${cat.color}`} />
                <span className="text-sm font-medium text-gray-800">{cat.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0" />
              </button>
            );
          })
        ) : (
          filteredItems.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">No {selectedCategory?.label.toLowerCase()} found</div>
          ) : filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleItemSelect(item)}
              className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                {item.subtitle && <p className="text-xs text-gray-400 truncate capitalize">{item.subtitle}</p>}
              </div>
            </button>
          ))
        )}
      </div>

      {step !== "projects" && (
        <button
          onClick={() => { setStep(step === "items" ? "category" : "projects"); setSearch(""); }}
          className="w-full px-3 py-2 text-xs text-gray-400 hover:text-purple-600 border-t border-gray-100 text-left"
        >
          ← Back
        </button>
      )}
    </div>
  );
}