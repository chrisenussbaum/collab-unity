import React from "react";
import { Users, MapPin } from "lucide-react";

export default function ProjectsMockup() {
  const projects = [
    { title: "Community Garden App", status: "In Progress", type: "Personal", tags: ["React Native", "Firebase", "Maps"], location: "San Francisco, CA", color: "#5B47DB", progress: 67 },
    { title: "Volunteer Tracker", status: "Seeking Collaborators", type: "Collaborative", tags: ["Vue.js", "Node", "UX Design"], location: "Remote", color: "#F97316", progress: 33 },
    { title: "Indie Music Hub", status: "In Progress", type: "Collaborative", tags: ["Next.js", "Stripe", "WebAudio"], location: "Manhattan, NY", color: "#22C559", progress: 80 },
    { title: "Open Data Dashboard", status: "Seeking Collaborators", type: "Personal", tags: ["Python", "D3.js", "Data Viz"], location: "Remote", color: "#3B82F6", progress: 25 },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-lg font-bold text-gray-900">My Projects</p>
        <div className="flex gap-2">
          <span className="text-xs text-gray-600 border border-gray-300 rounded-full px-2.5 py-1">Public (12)</span>
          <span className="text-xs text-gray-600 border border-gray-300 rounded-full px-2.5 py-1">Private (2)</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {projects.map((p, i) => (
          <div key={i} className="bg-white rounded-xl border-2 p-3" style={{ borderColor: `${p.color}40` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${p.color}15`, color: p.color }}>{p.status}</span>
              <span className="text-[10px] text-gray-500">{p.type}</span>
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">{p.title}</p>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2">
              <MapPin className="w-3 h-3" /> {p.location}
              <span className="mx-1">·</span>
              <Users className="w-3 h-3" /> 2 collaborators
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {p.tags.map((t, j) => (
                <span key={j} className="text-[9px] text-gray-600 bg-gray-100 rounded-full px-1.5 py-0.5">{t}</span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.color }} />
              </div>
              <span className="text-[10px] text-gray-500">Milestones 1/3</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}