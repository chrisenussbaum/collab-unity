import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Demo, DemoApplaud } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Video, Plus, Loader2, Search, Lightbulb } from "lucide-react";
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
        <div className="max-w-lg mx-auto space-y-3">
          {currentUser && (
            <Button
              onClick={() => setShowCreate(true)}
              className="w-full h-12 text-base font-semibold rounded-xl"
              style={{ background: "var(--cu-primary)" }}
            >
              <Plus className="w-5 h-5 mr-1.5" /> Post
            </Button>
          )}

          <Link
            to={createPageUrl("CreateProject")}
            className="block rounded-2xl p-5 text-white shadow-sm transition-transform hover:scale-[1.01]"
            style={{ background: "var(--cu-primary)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold leading-tight flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" /> Got an idea?
                </h2>
                <p className="text-sm text-white/90 mt-0.5">
                  Create a project and find collaborators
                </p>
              </div>
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts and projects..."
              className="w-full h-11 pl-9 pr-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-purple-400"
            />
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
                  onApplaudUpdate={loadDemos}
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