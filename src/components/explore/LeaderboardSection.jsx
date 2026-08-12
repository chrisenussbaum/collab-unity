import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { UserGameStats } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import SectionShell, { SkeletonList, Empty } from "./SectionShell";
import OptimizedAvatar from "../OptimizedAvatar";

const RING = ["bg-yellow-100 text-yellow-700", "bg-gray-100 text-gray-600", "bg-orange-100 text-orange-700", "bg-gray-100 text-gray-600", "bg-gray-100 text-gray-600"];

export default function LeaderboardSection() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stats = await UserGameStats.filter({}, "-total_points", 5);
        const emails = (stats || []).map(s => s.user_email).filter(Boolean);
        let profiles = {};
        if (emails.length) {
          const res = await getPublicUserProfiles({ emails });
          (res?.data || []).forEach(p => { profiles[p.email] = p; });
        }
        setRows((stats || []).map((s, i) => ({ ...s, rank: i + 1, profile: profiles[s.user_email] })));
      } catch { setRows([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <SectionShell icon={Trophy} title="Leaderboard" seeAllTo={createPageUrl("Leaderboard")}>
      {loading ? <SkeletonList count={5} /> : rows.length === 0 ? <Empty label="No leaderboard data yet" /> : (
        <div className="space-y-2">
          {rows.map(r => (
            <Link key={r.id} to={createPageUrl(`UserProfile?username=${r.profile?.username}`)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${RING[r.rank - 1] || "bg-gray-100 text-gray-600"}`}>{r.rank}</div>
              <OptimizedAvatar src={r.profile?.profile_image} alt={r.profile?.full_name || r.user_email} fallback={(r.profile?.full_name || r.user_email || "U")[0]} size="xs" className="w-8 h-8" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{r.profile?.full_name || r.user_email?.split("@")[0]}</p>
                <p className="text-[11px] text-gray-500">Level {r.level || 1}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-purple-600">{(r.total_points || 0).toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">pts</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SectionShell>
  );
}