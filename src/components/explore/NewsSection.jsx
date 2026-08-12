import React, { useState, useEffect } from "react";
import { Newspaper } from "lucide-react";
import { NewsSource } from "@/entities/all";
import { createPageUrl } from "@/utils";
import SectionShell, { SkeletonList, Empty } from "./SectionShell";

export default function NewsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setItems(await NewsSource.list() || []); }
      catch { setItems([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <SectionShell icon={Newspaper} title="News & Entertainment" seeAllTo={createPageUrl("NewsEntertainment")}>
      {loading ? <SkeletonList count={4} /> : items.length === 0 ? <Empty label="No news sources yet" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.slice(0, 6).map(n => (
            <a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ background: n.color || "#5B47DB" }}>{(n.name || "N")[0]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{n.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{n.category}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </SectionShell>
  );
}