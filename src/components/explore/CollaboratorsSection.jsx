import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import SectionShell, { SkeletonGrid, Empty } from "./SectionShell";
import OptimizedAvatar from "../OptimizedAvatar";

export default function CollaboratorsSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getPublicUserProfilesForDiscovery");
        const data = Array.isArray(res) ? res : (res?.data || []);
        setUsers(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch { setUsers([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <SectionShell icon={Users} title="Collaborators" seeAllTo={createPageUrl("Feed")}>
      {loading ? <SkeletonGrid /> : users.length === 0 ? <Empty label="No collaborators to show" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {users.map(u => (
            <Link key={u.id} to={createPageUrl(`UserProfile?username=${u.username}`)} className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-gray-50">
              <OptimizedAvatar src={u.profile_image} alt={u.full_name} fallback={(u.full_name || "U")[0]} size="sm" className="w-12 h-12" />
              <p className="mt-1.5 text-xs font-medium text-gray-800 truncate w-full">{u.full_name}</p>
              <p className="text-[10px] text-gray-500 truncate w-full">{(u.skills && u.skills[0]) || "Creator"}</p>
            </Link>
          ))}
        </div>
      )}
    </SectionShell>
  );
}