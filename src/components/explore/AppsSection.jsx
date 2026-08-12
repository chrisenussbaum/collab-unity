import React, { useState, useEffect } from "react";
import { LayoutGrid } from "lucide-react";
import { AppLibraryApp } from "@/entities/all";
import { createPageUrl } from "@/utils";
import SectionShell, { SkeletonGrid, Empty } from "./SectionShell";

const getFavicon = (url) => `https://www.google.com/s2/favicons?domain=${url}&sz=64`;

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
      {loading ? <SkeletonGrid count={6} /> : apps.length === 0 ? <Empty label="No apps yet" /> : (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {apps.map(a => (
            <a key={a.id} href={a.website_url} target="_blank" rel="noreferrer" className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-200 group-hover:scale-110 transition-transform">
                <AppIcon app={a} />
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-gray-700 truncate w-full group-hover:text-purple-700">{a.name}</p>
            </a>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function AppIcon({ app }) {
  const [logoError, setLogoError] = useState(false);
  const [favError, setFavError] = useState(false);
  if (app.logo_url && !logoError) {
    return <img src={app.logo_url} alt={app.name} className="w-full h-full object-contain p-1" onError={() => setLogoError(true)} />;
  }
  if (app.website_url && !favError) {
    return <img src={getFavicon(app.website_url)} alt={app.name} className="w-full h-full object-contain p-1.5" onError={() => setFavError(true)} />;
  }
  return <span className="text-xl">{app.icon_emoji || (app.name?.[0]?.toUpperCase() || "📦")}</span>;
}