import React, { useState, useMemo, useEffect } from "react";
import { Search, Info, ExternalLink, Sparkles, X, Loader2 } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import AppLogo from "@/components/feed/AppLogo";
import { getAuthoritativeCategory } from "@/components/feed/knownAppCategories";

const CACHE_KEY = (email) => `cu_app_library_v3_${email}`;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getFaviconUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${hostname}`;
  } catch {
    return null;
  }
}

function getLogoUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return `https://logo.clearbit.com/${hostname}`;
  } catch {
    return null;
  }
}

async function fetchTailoredApps(currentUser) {
  const skills = currentUser?.skills || [];
  const interests = currentUser?.interests || [];
  const tools = currentUser?.tools_technologies || [];
  const industry = currentUser?.industry || "";

  const profileParts = [];
  if (skills.length) profileParts.push(`Skills: ${skills.join(", ")}`);
  if (interests.length) profileParts.push(`Interests: ${interests.join(", ")}`);
  if (tools.length) profileParts.push(`Current tools: ${tools.join(", ")}`);
  if (industry) profileParts.push(`Industry: ${industry}`);

  const profileClause = profileParts.length
    ? `The user's profile: ${profileParts.join("; ")}. Recommend apps that are highly relevant to this user's skills, interests, and field. Include some apps they likely already use and some they should discover.`
    : "Recommend a broad mix of popular productivity, design, development, and communication apps.";

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an app discovery curator for Collab Unity, a collaboration platform. ${profileClause}

Return 24 real, well-known software apps, tools, or platforms that this user should test, learn about, or use. For each app provide:
- name: the app's name
- category: one of these exact categories: "Communication Tools", "Design Tools", "Development", "Productivity", "Project Management", "AI Tools", "Marketing", "Analytics", "File Storage", "No-Code", "Video Editing", "Social Media"
- description: a compelling 1-2 sentence description of what the app does and why the user should try it
- website_url: the official website URL (e.g. https://slack.com)

Make sure each category has at least 2 apps. Vary the selection so it's not just the most obvious choices — include some up-and-coming or lesser-known tools alongside mainstream ones. Spread apps evenly across all categories. CRITICAL: Assign each app to its single most accurate primary category based on what the app is primarily known for. For example: Discord, Slack, and Zoom are "Communication Tools"; Figma and Canva are "Design Tools"; GitHub and Docker are "Development"; Google Analytics and Amplitude are "Analytics". Do NOT duplicate an app under multiple categories.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        apps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: { type: "string" },
              description: { type: "string" },
              website_url: { type: "string" },
            },
          },
        },
      },
    },
  });

  return (result?.apps || []).map((app, i) => ({
    ...app,
    category: getAuthoritativeCategory(app),
    id: `app-${i}`,
    logo_url: getLogoUrl(app.website_url),
    favicon_url: getFaviconUrl(app.website_url),
  }));
}

function getCachedApps(email) {
  try {
    const raw = localStorage.getItem(CACHE_KEY(email));
    if (!raw) return null;
    const { timestamp, apps } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return apps;
  } catch {
    return null;
  }
}

function setCachedApps(email, apps) {
  try {
    localStorage.setItem(
      CACHE_KEY(email),
      JSON.stringify({ timestamp: Date.now(), apps })
    );
  } catch {}
}

export default function LibraryOfApps({ currentUser }) {
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentUser?.email) {
        setIsLoading(false);
        return;
      }

      // Try cache first
      const cached = getCachedApps(currentUser.email);
      if (cached && cached.length > 0) {
        if (cancelled) return;
        setApps(cached);
        const cats = [...new Set(cached.map((a) => a.category))];
        if (cats.length > 0) setActiveCategory(cats[0]);
        setIsLoading(false);
        return;
      }

      // Fetch fresh from LLM
      try {
        const fresh = await fetchTailoredApps(currentUser);
        if (cancelled) return;
        setApps(fresh);
        setCachedApps(currentUser.email, fresh);
        const cats = [...new Set(fresh.map((a) => a.category))];
        if (cats.length > 0) setActiveCategory(cats[0]);
      } catch (e) {
        console.error("Error fetching tailored apps:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const categories = useMemo(
    () => [...new Set(apps.map((a) => a.category))],
    [apps]
  );

  const filteredApps = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      // Prioritize apps whose name starts with the query, then fall back to includes
      const startsWith = apps.filter((a) => a.name?.toLowerCase().startsWith(q));
      const contains = apps.filter(
        (a) =>
          !a.name?.toLowerCase().startsWith(q) &&
          (a.name?.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q) ||
            a.category?.toLowerCase().includes(q))
      );
      return [...startsWith, ...contains];
    }
    let result = apps;
    if (activeCategory) {
      result = result.filter((a) => a.category === activeCategory);
    }
    return result.slice(0, 4);
  }, [apps, searchQuery, activeCategory]);

  // Responsive grid: 1 app = full width, 2 apps = 2 cols, 3-4 apps = 2x2
  const gridClass = useMemo(() => {
    const count = filteredApps.length;
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    return "grid-cols-2";
  }, [filteredApps.length]);

  const handleVisit = (app) => {
    if (app.website_url) {
      window.open(app.website_url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("No website available for this app.");
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
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-6 h-6 rounded flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors">
                  <Info className="w-3.5 h-3.5 text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                Discover apps tailored to your skills and interests — test, learn, and experiment with new tools!
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Body */}
        <div className="p-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#2E3A8C] animate-spin mb-2" />
              <p className="text-[11px] text-gray-400">Finding apps for you...</p>
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Apps coming soon!</p>
            </div>
          ) : (
            <>
              {/* Category pills (hidden when searching) */}
              {!searchQuery.trim() && categories.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                        activeCategory === cat
                          ? "text-white"
                          : "text-gray-600 bg-[#F0F2F5] hover:bg-gray-200"
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

              {/* Responsive grid */}
              <div className={`border border-gray-300 rounded-lg overflow-hidden ${searchQuery.trim() && filteredApps.length > 4 ? 'max-h-[240px] overflow-y-auto' : ''}`}>
                <div
                  className={`grid ${gridClass} divide-x divide-y divide-gray-200`}
                >
                  {filteredApps.map((app) => (
                    <AppGridCell
                      key={app.id}
                      app={app}
                      onClick={() => setSelectedApp(app)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with search */}
        <div className="px-3 py-2.5" style={{ background: "#2E3A8C" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2E3A8C]/50" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-full text-xs bg-white text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/40"
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

function AppGridCell({ app, onClick }) {
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const showLogo = app.logo_url && !logoError && !imgError;
  const showFavicon = app.favicon_url && !imgError && (logoError || !app.logo_url);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 p-3 hover:bg-indigo-50 transition-colors group min-h-[80px]"
      title={app.name}
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-200 group-hover:scale-110 transition-transform">
        {showLogo ? (
          <img
            src={app.logo_url}
            alt={app.name}
            className="w-full h-full object-contain p-1"
            loading="lazy"
            onError={() => setLogoError(true)}
          />
        ) : showFavicon ? (
          <img
            src={app.favicon_url}
            alt={app.name}
            className="w-full h-full object-contain p-1.5"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#2E3A8C]">
            <span className="text-white font-bold text-sm">
              {app.name?.charAt(0)?.toUpperCase() || "A"}
            </span>
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium text-gray-700 text-center truncate w-full group-hover:text-[#2E3A8C]">
        {app.name}
      </span>
    </button>
  );
}

function AppDetailDialog({ app, isOpen, onClose, onVisit }) {
  if (!app) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <AppLogo app={app} size="lg" />
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
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-sm text-gray-600 leading-relaxed pt-2">
          {app.description || "No description available."}
        </DialogDescription>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
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