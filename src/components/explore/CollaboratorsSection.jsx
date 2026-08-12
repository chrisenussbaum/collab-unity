import React, { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import SectionShell, { SkeletonGrid, Empty } from "./SectionShell";
import CollaboratorCard from "./CollaboratorCard";

export default function CollaboratorsSection({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getPublicUserProfilesForDiscovery");
        const data = Array.isArray(res) ? res : (res?.data || []);
        const filtered = (Array.isArray(data) ? data : []).filter(u => u.email !== currentUser?.email && u.id !== currentUser?.id);
        setUsers(filtered.slice(0, 6));
      } catch { setUsers([]); }
      setLoading(false);
    })();
  }, [currentUser?.email, currentUser?.id]);

  return (
    <SectionShell icon={Users} title="Collaborators" seeAllTo={createPageUrl("Collaborators")}>
      {loading ? <SkeletonGrid count={6} /> : users.length === 0 ? <Empty label="No collaborators to show" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {users.map(u => <CollaboratorCard key={u.id} user={u} />)}
        </div>
      )}
    </SectionShell>
  );
}