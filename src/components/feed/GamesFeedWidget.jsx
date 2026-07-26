import React, { useState, useEffect } from "react";
import { Gamepad2, ExternalLink, Loader2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const CATEGORY_GRADIENTS = {
  Puzzle: "from-blue-500 to-indigo-600",
  Card: "from-red-500 to-pink-600",
  Board: "from-amber-500 to-orange-600",
  Arcade: "from-green-500 to-teal-600",
  Word: "from-purple-500 to-violet-600",
  Quiz: "from-cyan-500 to-blue-600",
  Sport: "from-orange-500 to-red-600",
  Strategy: "from-slate-600 to-gray-800",
  Casino: "from-yellow-500 to-amber-600",
  Other: "from-gray-500 to-slate-600",
};

const FALLBACK_GAMES = [
  { title: "Chess.com", url: "https://chess.com", category: "Strategy", description: "Play chess online" },
  { title: "2048", url: "https://play2048.co", category: "Puzzle", description: "Merge tiles to 2048" },
  { title: "Wordle", url: "https://www.nytimes.com/games/wordle/index.html", category: "Word", description: "Daily word puzzle" },
];

const getFavicon = (url) => {
  try { return `https://www.google.com/s2/favicons?sz=128&domain_url=${new URL(url).origin}`; } catch { return null; }
};

export default function GamesFeedWidget({ instanceIndex = 0 }) {
  const [games, setGames] = useState(FALLBACK_GAMES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.entities.Game.list("display_order", 10)
      .then((data) => {
        if (data && data.length > 0) {
          // Rotate which games are shown based on instanceIndex
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
            <a key={game.title} href={game.url} target="_blank" rel="noopener noreferrer"
              className="block group">
              <div className={`relative aspect-square rounded-lg bg-gradient-to-br ${CATEGORY_GRADIENTS[game.category] || "from-purple-500 to-indigo-600"} flex items-center justify-center mb-1.5 overflow-hidden`}>
                <img src={game.thumbnail_url || getFavicon(game.url)} alt="" className="w-8 h-8 rounded object-contain group-hover:scale-110 transition-transform" onError={(e) => { e.target.style.display = 'none'; }} />
                <ExternalLink className="w-3 h-3 text-white/70 absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="font-semibold text-[11px] text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-1">{game.title}</p>
              <p className="text-[9px] text-gray-500 line-clamp-1">{game.description}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}