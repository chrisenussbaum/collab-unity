import React, { useState, useEffect } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { LearningResource } from "@/entities/all";
import { createPageUrl } from "@/utils";
import SectionShell, { SkeletonList, Empty } from "./SectionShell";

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
      {loading ? <SkeletonList count={4} /> : items.length === 0 ? <Empty label="No learning resources yet" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(r => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                <p className="text-[11px] text-gray-500 truncate">{[r.category, r.format, r.difficulty].filter(Boolean).join(" · ")}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </SectionShell>
  );
}