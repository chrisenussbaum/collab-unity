import React, { useState, useEffect } from "react";
import { BookOpen, Video, Headphones, FileText, Users, ExternalLink } from "lucide-react";
import { LearningResource } from "@/entities/all";
import { createPageUrl } from "@/utils";
import SectionShell, { SkeletonGrid, Empty } from "./SectionShell";

const FORMAT_ICONS = { Video, Article: FileText, "Audio Book": Headphones, Workshop: Users, Course: BookOpen };
const screenshot = (url) => `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

export default function LearningHubSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setItems(await LearningResource.list("-created_date", 6) || []); }
      catch { setItems([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <SectionShell icon={BookOpen} title="Learning Hub" seeAllTo={createPageUrl("LearningHub")}>
      {loading ? <SkeletonGrid count={3} /> : items.length === 0 ? <Empty label="No learning resources yet" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map(r => {
            const FIcon = FORMAT_ICONS[r.format] || BookOpen;
            return (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="group block rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-md hover:border-purple-300 transition-all">
                <div className="relative h-24 sm:h-28 bg-gray-100 overflow-hidden">
                  <img src={screenshot(r.url)} alt={`${r.title} preview`} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" onError={e => { e.target.style.display = 'none'; }} />
                </div>
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FIcon className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span className="text-[10px] text-gray-500 font-medium truncate">{r.format}</span>
                    {r.free && <span className="ml-auto text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Free</span>}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-purple-700 leading-snug">{r.title}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}