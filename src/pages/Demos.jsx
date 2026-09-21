import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Demo, DemoApplaud } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Plus, Loader2, Search } from "lucide-react";
import { getCachedUserProfiles } from "@/lib/userProfileCache";
import DemoItem from "@/components/demos/DemoItem";
import CreateDemoDialog from "@/components/CreateDemoDialog";

const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.response?.status === 429 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 3;
        continue;
      }
      throw e;
    }
  }
};

export default function Demos({ currentUser, authIsLoading }) {
  const [demos, setDemos] = useState([]);
  const [owners, setOwners] = useState({});
  const [applauds, setApplauds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const loadDemos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await withRetry(() => Demo.filter({ is_visible: true }, "-created_date"));
      const list = Array.isArray(data) ? data : [];
      setDemos(list);

      const emails = [...new Set(list.map((d) => d.created_by).filter(Boolean))];
      const profiles = emails.length
        ? await getCachedUserProfiles(emails).catch(() => ({}))
        : {};

      const ownersMap = {};
      list.forEach((d) => {
        ownersMap[d.id] =
          profiles[d.created_by] || {
            email: d.created_by,
            full_name: d.created_by?.split("@")[0],
            username: null,
            profile_image: null,
          };
      });
      setOwners(ownersMap);

      const ids = list.map((d) => d.id);
      const a = ids.length
        ? await withRetry(() => DemoApplaud.filter({ demo_id: { $in: ids } })).catch(() => [])
        : [];
      setApplauds(a);
    } catch (e) {
      console.error("Error loading demos:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch only applaud records after an applaud toggle — mirrors the Feed
  // pattern so the list never blanks/reloads (local optimistic UI already
  // updated the heart + count instantly inside DemoItem).
  const handleApplaudUpdate = useCallback(async () => {
    const ids = demos.map((d) => d.id);
    if (ids.length === 0) return;
    try {
      const a = await withRetry(() => DemoApplaud.filter({ demo_id: { $in: ids } }));
      setApplauds(a || []);
    } catch (e) {
      console.error("Error refreshing applauds:", e);
    }
  }, [demos]);

  useEffect(() => {
    if (!authIsLoading) loadDemos();
  }, [authIsLoading, loadDemos]);

  const q = search.trim().toLowerCase();
  const filteredDemos = q
    ? demos.filter((d) => {
        const inCaption = (d.caption || "").toLowerCase().includes(q);
        const o = owners[d.id];
        const inOwner =
          o &&
          ((o.full_name || "").toLowerCase().includes(q) ||
            (o.username || "").toLowerCase().includes(q));
        return inCaption || inOwner;
      })
    : demos;

  return (
    <div className="min-h-screen">
      <div className="cu-container cu-page">
        <div className="max-w-2xl mx-auto">
          {currentUser && (
            <Button
              onClick={() => setShowCreate(true)}
              className="cu-button w-full cu-gradient mb-4"
            >
              <Plus className="w-5 h-5 mr-2" />Post
            </Button>
          )}

          <Link to={createPageUrl("CreateProject")} className="block mb-4">
            <div className="cu-gradient rounded-xl p-4 sm:p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg mb-1">Got an idea?</h3>
                  <p className="text-purple-100 text-xs sm:text-sm">Create a project and find collaborators</p>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <div className="relative mb-3">
            <Input
              type="text"
              placeholder="Search posts and projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          <div className="pt-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
              </div>
            ) : filteredDemos.length === 0 ? (
              <div className="text-center py-16">
                <Video className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold">
                  {search ? "No matches" : "No demos yet"}
                </h3>
                <p className="text-gray-600 mt-1">
                  {search
                    ? "Try a different search."
                    : "Be the first to demo your project progress!"}
                </p>
              </div>
            ) : (
              filteredDemos.map((d) => (
                <DemoItem
                  key={d.id}
                  demo={d}
                  owner={owners[d.id]}
                  currentUser={currentUser}
                  demoApplauds={applauds}
                  onDemoDeleted={loadDemos}
                  onApplaudUpdate={handleApplaudUpdate}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <CreateDemoDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        currentUser={currentUser}
        onDemoCreated={loadDemos}
      />
    </div>
  );
}