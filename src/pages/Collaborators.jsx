import React, { useState, useEffect } from "react";
import { Users, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import CollaboratorCard from "@/components/explore/CollaboratorCard";

export default function Collaborators({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getPublicUserProfilesForDiscovery");
        const data = Array.isArray(res) ? res : (res?.data || []);
        setUsers(Array.isArray(data) ? data : []);
      } catch { setUsers([]); }
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter(u => {
    if (u.email === currentUser?.email || u.id === currentUser?.id) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.skills?.some(s => s.toLowerCase().includes(q)) ||
      u.bio?.toLowerCase().includes(q)
    );
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
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Collaborators</h1>
          <p className="text-gray-600 max-w-xl mx-auto">Discover talented creators and professionals ready to team up on meaningful projects.</p>
        </div>
      </div>

      <div className="cu-container cu-page">
        <div className="relative max-w-md mb-6">
          <Input placeholder="Search by name or skill..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 bg-white" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading collaborators…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No collaborators found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(u => <CollaboratorCard key={u.id} user={u} />)}
          </div>
        )}
      </div>
    </div>
  );
}