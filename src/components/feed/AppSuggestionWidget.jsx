import React, { useState, useMemo, useEffect } from "react";
import { Grid3x3, ExternalLink, Loader2, Info } from "lucide-react";
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
import {
  fetchTailoredApps,
  getCachedApps,
  setCachedApps,
} from "@/components/feed/appLibraryService";

/**
 * Compact horizontal-scrolling app suggestion strip designed to be
 * interleaved into the mobile Feed (like ContentDiscoveryWidget /
 * CollaboratorDiscoveryWidget).  Reads from the same cache as the
 * sidebar Library of Apps so data is shared.
 */
export default function AppSuggestionWidget({ currentUser, instanceIndex = 0 }) {
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentUser?.email) {
        setIsLoading(false);
        return;
      }

      // Try shared cache first
      const cached = getCachedApps(currentUser.email);
      if (cached && cached.length > 0) {
        if (cancelled) return;
        setApps(cached);
        setIsLoading(false);
        return;
      }

      // Fetch fresh — same shared service as LibraryOfApps / LibraryOfAppsMobile
      try {
        const fresh = await fetchTailoredApps(currentUser);
        if (cancelled) return;
        setApps(fresh);
        setCachedApps(currentUser.email, fresh);
      } catch (e) {
        console.error("Error fetching apps for suggestion widget:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // Group apps by category; each widget instance shows a different category
  const { displayApps, categoryName } = useMemo(() => {
    if (apps.length === 0) return { displayApps: [], categoryName: "" };
    // Deduplicate by lowercased name so an app can't appear in multiple categories
    const seen = new Set();
    const unique = [];
    apps.forEach((app) => {
      const key = (app.name || "").trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(app);
      }
    });
    const byCategory = {};
    unique.forEach((app) => {
      const cat = app.category || "Other";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(app);
    });
    const categories = Object.keys(byCategory).sort();
    if (categories.length === 0) return { displayApps: [], categoryName: "" };
    // Pick category based on instanceIndex, cycling through
    const selectedCategory = categories[instanceIndex % categories.length];
    const pool = byCategory[selectedCategory];
    // If category has fewer than 7, top up from other categories
    let picked = [...pool];
    if (picked.length < 7) {
      const others = unique.filter((a) => a.category !== selectedCategory);
      picked = [...picked, ...others].slice(0, 7);
    } else {
      picked = picked.slice(0, 7);
    }
    return { displayApps: picked, categoryName: selectedCategory };
  }, [apps, instanceIndex]);

  const handleVisit = (app) => {
    if (app.website_url) {
      window.open(app.website_url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("No website available.");
    }
  };

  if (!isLoading && displayApps.length === 0) return null;

  return (
    <>
      <div className="mb-6 bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        {/* Accent header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md cu-gradient flex items-center justify-center flex-shrink-0">
              <Grid3x3 className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-purple-700">
              Apps for You{categoryName ? ` · ${categoryName}` : ""}
            </span>
          </div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-purple-600">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                Tools tailored to your skills — tap to learn more!
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Horizontal scrolling apps */}
        {isLoading ? (
          <div className="flex items-center justify-center py-5">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
        ) : (
          <HorizontalScrollContainer className="py-3 px-3" showArrows={true}>
            {displayApps.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px] group"
              >
                <AppLogo
                  app={app}
                  size="md"
                  className="group-hover:scale-105 transition-transform shadow-sm"
                />
                <span className="text-[10px] font-medium text-gray-700 text-center truncate w-full group-hover:text-purple-600">
                  {app.name}
                </span>
              </button>
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