import React, { useState, useEffect } from "react";
import { Gamepad2 } from "lucide-react";
import { Game } from "@/entities/all";
import { createPageUrl } from "@/utils";
import GameCard from "@/components/games/GameCard";
import SectionShell, { SkeletonGrid, Empty } from "./SectionShell";

export default function GamesSection() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let data = await Game.filter({ is_featured: true }, "-display_order", 4);
        if (!data || data.length === 0) data = await Game.list("-display_order", 4);
        setGames(data || []);
      } catch { setGames([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <SectionShell icon={Gamepad2} title="Games" seeAllTo={createPageUrl("Games")}>
      {loading ? <SkeletonGrid count={4} /> : games.length === 0 ? <Empty label="No games yet" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {games.map(g => <GameCard key={g.id} game={g} variant="grid" />)}
        </div>
      )}
    </SectionShell>
  );
}