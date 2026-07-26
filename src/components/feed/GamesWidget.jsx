import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, ChevronRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { FALLBACK_GAMES, getGameImage, getFavicon, CATEGORY_GRADIENTS } from "@/components/games/gameUtils";

export default function GamesWidget() {
  const [games, setGames] = useState(FALLBACK_GAMES.slice(0, 4));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.entities.Game.filter({ is_featured: true }, "display_order", 4)
      .then((data) => { if (data && data.length > 0) setGames(data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg cu-gradient flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Games</h3>
            <p className="text-[10px] text-gray-500">Play free online games</p>
          </div>
        </div>
        <Link to="/Games" className="text-[10px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-0.5">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {games.slice(0, 4).map((game) => (
            <GameMiniCard key={game.title} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameMiniCard({ game }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageUrl = getGameImage(game, 300, 200);
  const favicon = getFavicon(game.url);
  const gradient = CATEGORY_GRADIENTS[game.category] || "from-purple-500 to-indigo-600";

  return (
    <a href={game.url} target="_blank" rel="noopener noreferrer" className="block group">
      <div className={`relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br ${gradient}`}>
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img src={favicon} alt="" className="w-6 h-6 rounded object-contain opacity-40" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <img
              src={imageUrl}
              alt={game.title}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img src={favicon} alt="" className="w-8 h-8 rounded object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        )}
        <div className="absolute bottom-1 left-1 w-5 h-5 rounded bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
          <img src={favicon} alt="" className="w-3 h-3 rounded object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </div>
      <p className="font-semibold text-[11px] text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-1 mt-1.5">{game.title}</p>
      <p className="text-[9px] text-gray-500 line-clamp-1">{game.category}</p>
    </a>
  );
}