import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Gamepad2, Search, ExternalLink, Loader2, Flame } from "lucide-react";
import { motion } from "framer-motion";
import GameCard from "@/components/games/GameCard";
import { CATEGORIES, FALLBACK_GAMES } from "@/components/games/gameUtils";

export default function Games({ currentUser }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState(FALLBACK_GAMES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.entities.Game.list("display_order")
      .then((data) => {
        if (data && data.length > 0) setGames(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const featuredGames = games.filter((g) => g.is_featured);

  const filteredGames = games.filter((g) => {
    const matchesCategory = selectedCategory === "All" || g.category === selectedCategory;
    const matchesSearch = !searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden -mt-14 pt-28 sm:-mt-16 sm:pt-32 pb-12 border-b border-purple-100"
        style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #ddd6fe 100%)" }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #7c3aed, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #5b47db, transparent)", transform: "translate(-30%, 30%)" }} />
        <div className="cu-container text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl cu-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              <span style={{ color: "var(--cu-primary)" }}>Games</span>
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">Take a break from your project! Play free online games — no downloads required.</p>
          </motion.div>
        </div>
      </div>

      <div className="cu-container cu-page">
        {/* Featured Games */}
        {featuredGames.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">Featured Games</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {featuredGames.map((game, i) => (
                <motion.div key={`feat-${game.title}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex-shrink-0 w-64">
                  <GameCard game={game} variant="featured" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Search + Category */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Input placeholder="Search games..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-white" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button key={cat.label} onClick={() => setSelectedCategory(cat.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.label ? "cu-gradient text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700"}`}>
                <Icon className="w-3.5 h-3.5" />{cat.label}
              </button>
            );
          })}
        </div>

        {/* All Games Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No games found. Try a different search or category.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredGames.map((game, i) => (
              <motion.div key={game.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GameCard game={game} variant="grid" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}