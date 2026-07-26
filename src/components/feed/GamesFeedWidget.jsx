import React, { useState, useEffect } from "react";
import { Gamepad2, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import GameCard from "@/components/games/GameCard";
import { FALLBACK_GAMES } from "@/components/games/gameUtils";

export default function GamesFeedWidget({ instanceIndex = 0 }) {
  const [games, setGames] = useState(FALLBACK_GAMES.slice(0, 3));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.entities.Game.list("display_order", 10)
      .then((data) => {
        if (data && data.length > 0) {
          const start = (instanceIndex * 2) % data.length;
          const rotated = [...data.slice(start), ...data.slice(0, start)];
          setGames(rotated.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [instanceIndex]);

  return (
    <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg cu-gradient flex items-center justify-center">
            <Gamepad2 className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="font-bold text-sm text-gray-900">Take a Break — Play a Game!</h3>
        </div>
        <Link to="/Games" className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center">
          Browse all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {games.map((game) => (
            <GameCard key={game.title} game={game} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}