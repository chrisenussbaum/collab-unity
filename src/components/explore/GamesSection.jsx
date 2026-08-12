import React, { useState, useEffect } from "react";
import { Gamepad2 } from "lucide-react";
import { Game } from "@/entities/all";
import { createPageUrl } from "@/utils";
import SectionShell, { SkeletonGrid, Empty } from "./SectionShell";

export default function GamesSection() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let data = await Game.filter({ is_featured: true }, "-display_order", 6);
        if (!data || data.length === 0) data = await Game.list("-display_order", 6);
        setGames(data || []);
      } catch { setGames([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <SectionShell icon={Gamepad2} title="Games" seeAllTo={createPageUrl("Games")}>
      {loading ? <SkeletonGrid /> : games.length === 0 ? <Empty label="No games yet" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {games.map(g => (
            <a key={g.id} href={g.url} target="_blank" rel="noreferrer" className="group block">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                {g.thumbnail_url
                  ? <img src={g.thumbnail_url} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>}
              </div>
              <p className="mt-1.5 text-xs font-medium text-gray-800 truncate">{g.title}</p>
              <p className="text-[10px] text-gray-500 truncate">{g.category}</p>
            </a>
          ))}
        </div>
      )}
    </SectionShell>
  );
}