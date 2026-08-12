import React, { useState, useEffect } from "react";
import { LayoutGrid } from "lucide-react";
import { AppLibraryApp } from "@/entities/all";
import { createPageUrl } from "@/utils";
import SectionShell, { SkeletonGrid, Empty } from "./SectionShell";

export default function AppsSection() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let data = await AppLibraryApp.filter({ is_featured: true }, "-display_order", 6);
        if (!data || data.length === 0) data = await AppLibraryApp.list("-display_order", 6);
        setApps(data || []);
      } catch { setApps([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <SectionShell icon={LayoutGrid} title="Library of Apps" seeAllTo={createPageUrl("Feed")}>
      {loading ? <SkeletonGrid /> : apps.length === 0 ? <Empty label="No apps yet" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {apps.map(a => (
            <a key={a.id} href={a.website_url} target="_blank" rel="noreferrer" className="flex flex-col items-center text-center p-3 rounded-xl border border-gray-200 hover:bg-gray-50">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {a.logo_url ? <img src={a.logo_url} alt={a.name} className="w-full h-full object-cover" /> : <span className="text-xl">{a.icon_emoji || "📦"}</span>}
              </div>
              <p className="mt-1.5 text-xs font-medium text-gray-800 truncate w-full">{a.name}</p>
              <p className="text-[10px] text-gray-500 truncate w-full">{a.category}</p>
            </a>
          ))}
        </div>
      )}
    </SectionShell>
  );
}