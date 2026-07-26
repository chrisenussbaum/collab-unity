import { Globe, Puzzle, Dices, Trophy, Target, Type, Brain, Zap, Swords } from "lucide-react";

export const CATEGORY_GRADIENTS = {
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

export const CATEGORIES = [
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

export const FALLBACK_GAMES = [
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

export const getFavicon = (url) => {
  try { return `https://www.google.com/s2/favicons?sz=128&domain_url=${new URL(url).origin}`; } catch { return null; }
};

export const getGameImage = (game, width = 400, height = 300) => {
  if (game.thumbnail_url) return game.thumbnail_url;
  try {
    return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(game.url)}?w=${width}&h=${height}`;
  } catch {
    return getFavicon(game.url);
  }
};