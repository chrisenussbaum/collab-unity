import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

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
  { title: "Tetris", url: "https://tetris.com", category: "Arcade", description: "Classic block game" },
];

const getFavicon = (url) => {
  try { return `https://www.google.com/s2/favicons?sz=128&domain_url=${new URL(url).origin}`; } catch { return null; }
};

export default function GamesWidget() {
  const [games, setGames] = useState(FALLBACK_GAMES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.entities.Game.filter({ is_featured: true }, "display_order", 4)
      .then((data) => {
        if (data && data.length > 0) setGames(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg cu-gradient flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-sm text-gray-900">Games</h3>
        </div>
        <Link to="/Games" className="text-[10px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-0.5">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <p className="text-[10px] text-gray-500 mb-3">Play free online games</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-1.5">
          {games.slice(0, 4).map((game) => (
            <a key={game.title} href={game.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-purple-50 transition-colors group">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${CATEGORY_GRADIENTS[game.category] || "from-purple-500 to-indigo-600"} flex items-center justify-center flex-shrink-0`}>
                <img src={game.thumbnail_url || getFavicon(game.url)} alt="" className="w-5 h-5 rounded object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-gray-900 group-hover:text-purple-700 transition-colors truncate">{game.title}</p>
                <p className="text-[10px] text-gray-500 truncate">{game.category}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-purple-600 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}