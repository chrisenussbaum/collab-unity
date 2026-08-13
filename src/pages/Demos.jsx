import React, { useState, useEffect, useCallback } from "react";
import { Demo, DemoApplaud } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Video, Plus, Loader2 } from "lucide-react";
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

  return (
    <div className="min-h-screen">
      <div className="cu-container cu-page">
        <div className="flex items-center justify-between mb-4">
          <h1 className="responsive-title font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-purple-600" /> Demos
          </h1>
          {currentUser && (
            <Button onClick={() => setShowCreate(true)} className="cu-button">
              <Plus className="w-4 h-4 mr-1" /> Post a Demo
            </Button>
          )}
        </div>

        <div className="max-w-lg mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            </div>
          ) : demos.length === 0 ? (
            <div className="text-center py-20">
              <Video className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold">No demos yet</h3>
              <p className="text-gray-600 mt-1">
                Be the first to demo your project progress!
              </p>
              {currentUser && (
                <Button onClick={() => setShowCreate(true)} className="cu-button mt-4">
                  <Plus className="w-4 h-4 mr-1" /> Post a Demo
                </Button>
              )}
            </div>
          ) : (
            demos.map((d) => (
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

      <CreateDemoDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        currentUser={currentUser}
        onDemoCreated={loadDemos}
      />
    </div>
  );
}