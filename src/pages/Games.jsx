import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Gamepad2, Search, ExternalLink, Loader2, Globe, ChevronRight, Flame, Sparkles, Trophy, Brain, Swords, Target, Puzzle, Type, Dices, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

const FALLBACK_GAMES = [
  { title: "Chess.com", url: "https://chess.com", category: "Strategy", description: "Play chess online against millions of players", is_featured: true, player_count: "150M players" },
  { title: "Lichess", url: "https://lichess.org", category: "Strategy", description: "Free, open-source chess for everyone", is_featured: true, player_count: "50M players" },
  { title: "2048", url: "https://play2048.co", category: "Puzzle", description: "Slide tiles, merge numbers, reach 2048", is_featured: true, player_count: "10M players" },
  { title: "Wordle", url: "https://www.nytimes.com/games/wordle/index.html", category: "Word", description: "Guess the daily five-letter word", is_featured: true, player_count: "100M players" },
  { title: "Tetris", url: "https://tetris.com", category: "Arcade", description: "The all-time classic block-stacking game", is_featured: true, player_count: "500M players" },
  { title: "GeoGuessr", url: "https://www.geoguessr.com", category: "Quiz", description: "Explore the world and guess your location", is_featured: true, player_count: "50M players" },
  { title: "Sudoku", url: "https://sudoku.com", category: "Puzzle", description: "Classic number-placement puzzle" },
  { title: "Mahjong", url: "https://www.mahjongtime.com/play-mahjong", category: "Puzzle", description: "Timeless tile-matching classic" },
  { title: "Solitaire", url: "https://solitr.com", category: "Card", description: "The classic patience card game" },
  { title: "Minesweeper", url: "https://minesweeperonline.com", category: "Puzzle", description: "Flag the mines, clear the board" },
  { title: "Connect 4", url: "https://papergames.io/en/connect4", category: "Board", description: "Get four in a row to win" },
  { title: "Checkers", url: "https://papergames.io/en/checkers", category: "Board", description: "Jump and capture in this classic" },
  { title: "UNO", url: "https://unofreak.com", category: "Card", description: "Match colors and numbers online" },
  { title: "8 Ball Pool", url: "https://www.8ballpool.com", category: "Sport", description: "Sink your balls and the 8-ball" },
  { title: "Snake", url: "https://snake.googlemaps.com", category: "Arcade", description: "Google Maps Snake game" },
  { title: "Daily Sudoku", url: "https://sudoku.com/daily", category: "Puzzle", description: "A fresh sudoku puzzle every day" },
  { title: "Bingo Blitz", url: "https://www.bingoblitz.com", category: "Casino", description: "Online bingo with a twist" },
  { title: "TypeRacer", url: "https://play.typeracer.com", category: "Word", description: "Race others by typing fast" },
  { title: "Trivia Plaza", url: "https://www.triviaplaza.com", category: "Quiz", description: "Test your knowledge on any topic" },
  { title: "Cribbage", url: "https://cribbage.jdsoftware.com", category: "Card", description: "Classic pegging card game" },
];

const CATEGORIES = [
  { label: "All", icon: Globe },
  { label: "Puzzle", icon: Puzzle },
  { label: "Card", icon: Dices },
  { label: "Board", icon: Trophy },
  { label: "Arcade", icon: Target },
  { label: "Word", icon: Type },
  { label: "Quiz", icon: Brain },
  { label: "Sport", icon: Zap },
  { label: "Strategy", icon: Swords },
];

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

const getFavicon = (url) => {
  try { return `https://www.google.com/s2/favicons?sz=128&domain_url=${new URL(url).origin}`; } catch { return null; }
};

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
  const allGames = games;

  const filteredGames = allGames.filter((g) => {
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
                  <a href={game.url} target="_blank" rel="noopener noreferrer" className="block group">
                    <Card className="cu-card overflow-hidden hover:shadow-lg transition-all">
                      <div className={`relative h-32 bg-gradient-to-br ${CATEGORY_GRADIENTS[game.category] || "from-purple-500 to-indigo-600"} flex items-center justify-center`}>
                        <img src={game.thumbnail_url || getFavicon(game.url)} alt={game.title} className="w-16 h-16 rounded-xl object-contain shadow-lg group-hover:scale-110 transition-transform" onError={(e) => { e.target.style.display = 'none'; }} />
                        <ExternalLink className="w-4 h-4 text-white/80 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardContent className="pt-3 pb-3">
                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-purple-700 transition-colors line-clamp-1">{game.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{game.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] bg-gray-50">{game.category}</Badge>
                          {game.player_count && <span className="text-[10px] text-gray-400">{game.player_count}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </a>
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
                <a href={game.url} target="_blank" rel="noopener noreferrer" className="block group">
                  <Card className="cu-card overflow-hidden hover:shadow-md transition-all">
                    <div className={`relative aspect-square bg-gradient-to-br ${CATEGORY_GRADIENTS[game.category] || "from-purple-500 to-indigo-600"} flex items-center justify-center`}>
                      <img src={game.thumbnail_url || getFavicon(game.url)} alt={game.title} className="w-14 h-14 rounded-xl object-contain shadow-lg group-hover:scale-110 transition-transform" onError={(e) => { e.target.style.display = 'none'; }} />
                      <ExternalLink className="w-3.5 h-3.5 text-white/80 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardContent className="pt-2.5 pb-2.5">
                      <h3 className="font-semibold text-gray-900 text-xs line-clamp-1 group-hover:text-purple-700 transition-colors">{game.title}</h3>
                      <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{game.description}</p>
                      <Badge variant="outline" className="text-[9px] bg-gray-50 mt-1.5">{game.category}</Badge>
                    </CardContent>
                  </Card>
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}