import React, { useState, useEffect, useMemo } from "react";
import { LayoutGrid, Search, ExternalLink } from "lucide-react";
import { AppLibraryApp } from "@/entities/all";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const getFavicon = (url) => `https://www.google.com/s2/favicons?domain=${url}&sz=64`;

function AppIcon({ app }) {
  const [logoError, setLogoError] = useState(false);
  const [favError, setFavError] = useState(false);
  if (app.logo_url && !logoError) {
    return <img src={app.logo_url} alt={app.name} className="w-16 h-16 rounded-2xl object-contain bg-gray-50 border border-gray-200 p-2" onError={() => setLogoError(true)} />;
  }
  if (app.website_url && !favError) {
    return <img src={getFavicon(app.website_url)} alt={app.name} className="w-16 h-16 rounded-2xl object-contain bg-gray-50 border border-gray-200 p-3" onError={() => setFavError(true)} />;
  }
  return <div className="w-16 h-16 rounded-2xl cu-gradient text-white flex items-center justify-center text-2xl font-bold">{app.icon_emoji || app.name?.[0]?.toUpperCase() || "📦"}</div>;
}

export default function LibraryOfApps({ currentUser }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  useEffect(() => {
    (async () => {
      try { setApps(await AppLibraryApp.list("-display_order", 100) || []); }
      catch { setApps([]); }
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(apps.map(a => a.category).filter(Boolean)))], [apps]);

  const filtered = apps.filter(a => {
    const matchesCat = activeCat === "All" || a.category === activeCat;
    const matchesQuery = !query ||
      a.name?.toLowerCase().includes(query.toLowerCase()) ||
      a.description?.toLowerCase().includes(query.toLowerCase()) ||
      a.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen">
      <div
        className="relative overflow-hidden -mt-14 pt-28 sm:-mt-16 sm:pt-32 pb-12 border-b border-purple-100"
        style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #ddd6fe 100%)" }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #7c3aed, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="cu-container text-center relative z-10">
          <div className="w-14 h-14 rounded-2xl cu-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
            <LayoutGrid className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Library of Apps</h1>
          <p className="text-gray-600 max-w-xl mx-auto">Discover apps and tools to power your projects — explore use cases and find the right fit.</p>
        </div>
      </div>

      <div className="cu-container cu-page">
        <div className="relative max-w-md mb-5">
          <Input placeholder="Search apps, use cases, tags..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 bg-white" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCat === cat ? "cu-gradient text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading apps…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No apps found.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3 hover:shadow-md hover:border-purple-300 transition-all">
                <div className="flex items-center gap-3">
                  <AppIcon app={a} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">{a.name}</h3>
                    {a.category && <Badge className="mt-1 text-xs bg-purple-50 text-purple-700 border border-purple-200">{a.category}</Badge>}
                  </div>
                </div>
                {a.description && <p className="text-xs text-gray-600 line-clamp-4">{a.description}</p>}
                {a.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {a.tags.slice(0, 6).map(t => <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                )}
                {a.website_url && (
                  <a href={a.website_url} target="_blank" rel="noreferrer" className="mt-auto text-xs font-medium text-purple-600 hover:text-purple-700 inline-flex items-center gap-1">
                    Visit website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}