import React, { useState, useMemo, useEffect } from "react";
import { Search, Info, ExternalLink, Sparkles, X, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function LibraryOfApps() {
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchApps = async () => {
      try {
        const allApps = await base44.entities.AppLibraryApp.filter(
          { is_featured: true },
          "display_order"
        );
        if (cancelled) return;
        setApps(allApps);
        // Set first category as active
        const categories = [...new Set(allApps.map((a) => a.category))];
        if (categories.length > 0) setActiveCategory(categories[0]);
      } catch (e) {
        console.error("Error fetching app library:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchApps();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    return [...new Set(apps.map((a) => a.category))];
  }, [apps]);

  const filteredApps = useMemo(() => {
    let result = apps;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeCategory && !searchQuery.trim()) {
      result = result.filter((a) => a.category === activeCategory);
    }
    return result.slice(0, 4);
  }, [apps, searchQuery, activeCategory]);

  const handleAppClick = (app) => {
    setSelectedApp(app);
  };

  const handleVisit = (app) => {
    if (app.website_url) {
      window.open(app.website_url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("No website available for this app.");
    }
  };

  const getFaviconUrl = (url) => {
    try {
      return `https://www.google.com/s2/favicons?sz=128&domain_url=${new URL(url).hostname}`;
    } catch {
      return null;
    }
  };

  return (
    <>
      <div className="rounded-xl overflow-hidden border-2 border-[#2E3A8C] shadow-md bg-white">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "#2E3A8C" }}
        >
          <h3 className="text-white font-bold text-base tracking-wide">
            Library of Apps
          </h3>
          <div className="w-6 h-6 bg-gray-400/80 rounded flex items-center justify-center" title="Discover apps to test, learn, and experiment with">
            <Info className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Body */}
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2E3A8C] border-t-transparent" />
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Apps coming soon!</p>
            </div>
          ) : (
            <>
              {/* Category sub-header (hidden when searching) */}
              {!searchQuery.trim() && categories.length > 0 && (
                <div className="flex items-center gap-1 mb-2 overflow-x-auto scrollbar-hide">
                  {categories.slice(0, 4).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                        activeCategory === cat
                          ? "text-white"
                          : "text-[#2E3A8C] bg-indigo-50 hover:bg-indigo-100"
                      }`}
                      style={
                        activeCategory === cat
                          ? { background: "#2E3A8C" }
                          : undefined
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* 2x2 Grid */}
              <div className="border border-[#2E3A8C] rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 grid-rows-2 divide-x divide-y divide-[#2E3A8C]/20">
                  {filteredApps.map((app) => {
                    const logo =
                      app.logo_url || getFaviconUrl(app.website_url);
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleAppClick(app)}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 hover:bg-indigo-50 transition-colors group"
                        title={app.name}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-200 group-hover:scale-110 transition-transform">
                          {logo ? (
                            <img
                              src={logo}
                              alt={app.name}
                              className="w-full h-full object-contain p-1"
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full items-center justify-center text-xl"
                            style={{ display: logo ? "none" : "flex" }}
                          >
                            {app.icon_emoji || "📦"}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-gray-700 text-center truncate w-full group-hover:text-[#2E3A8C]">
                          {app.name}
                        </span>
                        {app.is_sponsored && (
                          <span className="text-[8px] text-amber-500 font-semibold">
                            Sponsored
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Fill empty grid slots */}
                  {filteredApps.length < 4 &&
                    [...Array(4 - filteredApps.length)].map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex flex-col items-center justify-center p-3 opacity-40"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200" />
                        <span className="text-[10px] text-gray-400 mt-1.5">
                          —
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with search */}
        <div
          className="px-3 py-2.5"
          style={{ background: "#2E3A8C" }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2E3A8C]/50" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs bg-white text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* App Detail Dialog */}
      <AppDetailDialog
        app={selectedApp}
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        onVisit={handleVisit}
      />
    </>
  );
}

function AppDetailDialog({ app, isOpen, onClose, onVisit }) {
  if (!app) return null;

  const logo = app.logo_url || (() => {
    try {
      return `https://www.google.com/s2/favicons?sz=128&domain_url=${new URL(app.website_url).hostname}`;
    } catch {
      return null;
    }
  })();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-200 flex-shrink-0">
              {logo ? (
                <img
                  src={logo}
                  alt={app.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <span className="text-3xl">{app.icon_emoji || "📦"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold text-gray-900">
                {app.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50"
                >
                  {app.category}
                </Badge>
                {app.is_sponsored && (
                  <Badge className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200">
                    Sponsored
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-sm text-gray-600 leading-relaxed pt-2">
          {app.description || "No description available."}
        </DialogDescription>

        {app.tags && app.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {app.tags.map((tag, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] bg-gray-100 text-gray-600"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={() => onVisit(app)}
            className="flex-1 text-white"
            style={{ background: "#2E3A8C" }}
          >
            Visit Website
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}