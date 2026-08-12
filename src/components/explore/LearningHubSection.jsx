import React, { useState, useEffect } from "react";
import { BookOpen, Video, Headphones, FileText, Users } from "lucide-react";
import { LearningResource } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { RESOURCES } from "@/pages/LearningHub";
import SectionShell, { SkeletonGrid, Empty } from "./SectionShell";
import ResourceThumb from "./ResourceThumb";

const FORMAT_ICONS = { Video, Article: FileText, "Audio Book": Headphones, Workshop: Users, Course: BookOpen };

export default function LearningHubSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await LearningResource.list("-created_date", 6);
        setItems(data && data.length ? data : RESOURCES.slice(0, 6));
      } catch {
        setItems(RESOURCES.slice(0, 6));
      }
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
              <a key={r.id || r.url} href={r.url} target="_blank" rel="noreferrer" className="group block rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-md hover:border-purple-300 transition-all">
                <ResourceThumb
                  url={r.url}
                  title={r.title}
                  fallbackIcon={<FIcon className="w-8 h-8 text-purple-300" />}
                  className="h-24 sm:h-28 group-hover:scale-105 transition-transform duration-300"
                />
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