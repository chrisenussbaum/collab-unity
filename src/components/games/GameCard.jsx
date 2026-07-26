import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { CATEGORY_GRADIENTS, getGameImage, getFavicon } from "./gameUtils";

export default function GameCard({ game, variant = "grid" }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageUrl = getGameImage(game);
  const favicon = getFavicon(game.url);
  const gradient = CATEGORY_GRADIENTS[game.category] || "from-purple-500 to-indigo-600";

  const isFeatured = variant === "featured";
  const imageClass = isFeatured ? "h-32" : "aspect-video";
  const titleClass = isFeatured ? "text-sm" : "text-xs";
  const descClass = isFeatured ? "text-xs" : "text-[10px]";
  const badgeClass = isFeatured ? "text-[10px]" : "text-[9px]";
  const paddingClass = isFeatured ? "pt-3 pb-3 px-3" : "pt-2 pb-2 px-2.5";

  return (
    <a href={game.url} target="_blank" rel="noopener noreferrer" className="block group">
      <div className="overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-md transition-all border border-gray-100">
        <div className={`relative ${imageClass} bg-gradient-to-br ${gradient} overflow-hidden`}>
          {!imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src={favicon} alt="" className="w-10 h-10 rounded-lg object-contain opacity-40" onError={(e) => { e.target.style.display = 'none'; }} />
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
              <img src={favicon} alt="" className="w-12 h-12 rounded-xl object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
          )}

          {/* Small logo in top-left corner */}
          <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <img src={favicon} alt="" className="w-4 h-4 rounded object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>

          <ExternalLink className="w-3.5 h-3.5 text-white absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>

        <div className={paddingClass}>
          <h3 className={`font-bold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-1 ${titleClass}`}>
            {game.title}
          </h3>
          <p className={`text-gray-500 line-clamp-1 mt-0.5 ${descClass}`}>
            {game.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium ${badgeClass}`}>
              {game.category}
            </span>
            {game.player_count && (
              <span className={`text-gray-400 ${badgeClass}`}>
                {game.player_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}