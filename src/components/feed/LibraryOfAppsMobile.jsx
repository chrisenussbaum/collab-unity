import React, { useState, useMemo, useEffect } from "react";
import { Search, Info, ExternalLink, X, Loader2, Sparkles, Grid3x3 } from "lucide-react";
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
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import AppLogo from "@/components/feed/AppLogo";
import { getAuthoritativeCategory } from "@/components/feed/knownAppCategories";

const CACHE_KEY = (email) => `cu_app_library_v3_${email}`;
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getFaviconUrl(url) {
  try {
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${new URL(url).hostname}`;
  } catch {
    return null;
  }
}

function getLogoUrl(url) {
  try {
    return `https://logo.clearbit.com/${new URL(url).hostname.replace(/^www\./, "")}`;
  } catch {
    return null;
  }
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

export default function LibraryOfAppsMobile({ currentUser }) {
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentUser?.email) {
        setIsLoading(false);
        return;
      }
      const cached = getCachedApps(currentUser.email);
      if (cached && cached.length > 0) {
        if (cancelled) return;
        setApps(cached);
        const cats = [...new Set(cached.map((a) => a.category))];
        if (cats.length > 0) setActiveCategory(cats[0]);
        setIsLoading(false);
        return;
      }
      try {
        const skills = currentUser?.skills || [];
        const interests = currentUser?.interests || [];
        const tools = currentUser?.tools_technologies || [];
        const profileParts = [];
        if (skills.length) profileParts.push(`Skills: ${skills.join(", ")}`);
        if (interests.length) profileParts.push(`Interests: ${interests.join(", ")}`);
        if (tools.length) profileParts.push(`Current tools: ${tools.join(", ")}`);
        const profileClause = profileParts.length
          ? `The user's profile: ${profileParts.join("; ")}.`
          : "Recommend a broad mix of popular apps.";

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an app discovery curator for Collab Unity. ${profileClause} Return 24 real, well-known software apps or tools this user should test, learn about, or use. For each: name, category (one of: "Communication Tools", "Design Tools", "Development", "Productivity", "Project Management", "AI Tools", "Marketing", "Analytics", "File Storage", "No-Code", "Video Editing", "Social Media"), description (1-2 sentences), and website_url (official URL). Ensure each category has at least 2 apps. Spread apps evenly across all categories. CRITICAL: Assign each app to its single most accurate primary category based on what the app is primarily known for. For example: Discord, Slack, and Zoom are "Communication Tools"; Figma and Canva are "Design Tools"; GitHub and Docker are "Development"; Google Analytics and Amplitude are "Analytics". Do NOT duplicate an app under multiple categories.`,
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
        if (cancelled) return;
        const fresh = (result?.apps || []).map((app, i) => ({
          ...app,
          category: getAuthoritativeCategory(app),
          id: `app-${i}`,
          logo_url: getLogoUrl(app.website_url),
          favicon_url: getFaviconUrl(app.website_url),
        }));
        setApps(fresh);
        try {
          localStorage.setItem(
            CACHE_KEY(currentUser.email),
            JSON.stringify({ timestamp: Date.now(), apps: fresh })
          );
        } catch {}
        const cats = [...new Set(fresh.map((a) => a.category))];
        if (cats.length > 0) setActiveCategory(cats[0]);
      } catch (e) {
        console.error("Error fetching tailored apps (mobile):", e);
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

  const displayApps = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
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
    return result;
  }, [apps, searchQuery, activeCategory]);

  const handleVisit = (app) => {
    if (app.website_url) {
      window.open(app.website_url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("No website available.");
    }
  };

  if (!isLoading && apps.length === 0) return null;

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 p-4 shadow-sm">
        {/* Compact header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg cu-gradient flex items-center justify-center flex-shrink-0">
              <Grid3x3 className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">Library of Apps</h2>
              <p className="text-[10px] text-gray-500 leading-tight">Tools tailored to you</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              title="Search apps"
            >
              <Search className="w-4 h-4" />
            </button>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                  Discover apps tailored to your skills and interests — test, learn, and experiment with new tools!
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Expandable search */}
        {showSearch && (
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-7 py-1.5 rounded-full text-xs bg-gray-50 border border-gray-200 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category pills */}
        {!searchQuery.trim() && categories.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "text-white bg-purple-600"
                    : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Horizontal scrolling app cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
        ) : displayApps.length === 0 ? (
          <div className="text-center py-5">
            <Sparkles className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
            <p className="text-[11px] text-gray-400">No apps found</p>
          </div>
        ) : (
          <HorizontalScrollContainer className="pb-1" showArrows={false}>
            {displayApps.map((app) => (
              <MobileAppCard
                key={app.id}
                app={app}
                onClick={() => setSelectedApp(app)}
              />
            ))}
          </HorizontalScrollContainer>
        )}
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

function MobileAppCard({ app, onClick }) {
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const showLogo = app.logo_url && !logoError && !imgError;
  const showFavicon = app.favicon_url && !imgError && (logoError || !app.logo_url);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-purple-50 transition-colors group flex-shrink-0 w-[72px]"
      title={app.name}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform shadow-sm">
        {showLogo ? (
          <img
            src={app.logo_url}
            alt={app.name}
            className="w-full h-full object-contain p-1.5"
            loading="lazy"
            onError={() => setLogoError(true)}
          />
        ) : showFavicon ? (
          <img
            src={app.favicon_url}
            alt={app.name}
            className="w-full h-full object-contain p-2"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center cu-gradient">
            <span className="text-white font-bold text-sm">
              {app.name?.charAt(0)?.toUpperCase() || "A"}
            </span>
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium text-gray-700 text-center truncate w-full group-hover:text-purple-600">
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
                  className="text-[10px] border-purple-200 text-purple-700 bg-purple-50"
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
            className="flex-1 text-white cu-gradient"
          >
            Visit Website
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}