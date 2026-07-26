import React, { useState, useEffect, useRef } from "react";
import { Music, Play, Pause, SkipForward, SkipBack, X, ChevronDown, ChevronUp, Volume2, Search, Loader2, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { PLAYLIST } from "./playlist";

let apiLoaded = false;
let apiReady = false;

function loadYouTubeAPI() {
  if (apiReady || (window.YT && window.YT.Player)) {
    apiReady = true;
    return;
  }
  if (apiLoaded) return;
  apiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    apiReady = true;
    if (prev) prev();
  };
}

export default function MusicPlayer({ isVisible, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [queue, setQueue] = useState(PLAYLIST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(60);
  const [playerReady, setPlayerReady] = useState(false);
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 20, y: 100 };
    return {
      x: Math.max(16, window.innerWidth - 336),
      y: Math.max(80, window.innerHeight - 260),
    };
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef(null);
  const playerHostRef = useRef(null);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const queueRef = useRef(PLAYLIST);
  queueRef.current = queue;
  const failedIdsRef = useRef(new Set());
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  const currentTrack = queue[currentIndex] || PLAYLIST[0];
  const isRadioMode = queue === PLAYLIST;

  // Re-sync queue when PLAYLIST reference changes (HMR or module update)
  useEffect(() => {
    setQueue(PLAYLIST);
    setCurrentIndex(0);
    failedIdsRef.current.clear();
  }, [PLAYLIST]);

  useEffect(() => {
    loadYouTubeAPI();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let checkInterval;
    let playerDiv;
    const initPlayer = () => {
      const host = playerHostRef.current;
      if (apiReady && window.YT && window.YT.Player && host) {
        // Create player div programmatically so React never reconciles/destroys it
        playerDiv = document.createElement("div");
        playerDiv.id = "cu-yt-player";
        host.appendChild(playerDiv);
        playerRef.current = new window.YT.Player(playerDiv, {
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: (e) => {
              setPlayerReady(true);
              e.target.setVolume(volume);
            },
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.PLAYING) {
                failedIdsRef.current.clear();
                setIsPlaying(true);
              } else if (e.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (e.data === window.YT.PlayerState.ENDED) {
                failedIdsRef.current.clear();
                setCurrentIndex((prev) => (prev + 1) % queueRef.current.length);
              }
            },
            onError: () => {
              const failedId = queueRef.current[currentIndexRef.current]?.videoId;
              if (failedId) failedIdsRef.current.add(failedId);
              setCurrentIndex((prev) => {
                const len = queueRef.current.length;
                for (let i = 1; i <= len; i++) {
                  const nextIdx = (prev + i) % len;
                  const nextId = queueRef.current[nextIdx]?.videoId;
                  if (nextId && !failedIdsRef.current.has(nextId)) return nextIdx;
                }
                return prev;
              });
            },
          },
        });
      } else {
        checkInterval = setTimeout(initPlayer, 200);
      }
    };
    initPlayer();

    return () => {
      if (checkInterval) clearTimeout(checkInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
      if (playerDiv && playerDiv.parentNode) {
        playerDiv.parentNode.removeChild(playerDiv);
      }
      setPlayerReady(false);
      setIsPlaying(false);
    };
  }, [isVisible]);

  useEffect(() => {
    if (playerRef.current && playerReady && queue[currentIndex]) {
      setCurrentTime(0);
      setDuration(0);
      try {
        playerRef.current.loadVideoById(queue[currentIndex].videoId);
      } catch (e) {}
    }
  }, [currentIndex, playerReady, queue]);

  useEffect(() => {
    if (playerRef.current && playerReady) {
      try {
        playerRef.current.setVolume(volume);
      } catch (e) {}
    }
  }, [volume, playerReady]);

  // Poll player for current time / duration
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    const interval = setInterval(() => {
      try {
        const t = playerRef.current.getCurrentTime();
        const d = playerRef.current.getDuration();
        if (typeof t === "number") setCurrentTime(t);
        if (typeof d === "number" && d > 0) setDuration(d);
      } catch (e) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [playerReady]);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const seek = (e) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * duration;
    try {
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    } catch (e) {}
  };

  const playNext = () => {
    failedIdsRef.current.clear();
    setCurrentIndex((prev) => (prev + 1) % queue.length);
  };
  const playPrev = () => {
    failedIdsRef.current.clear();
    setCurrentIndex((prev) => (prev === 0 ? queue.length - 1 : prev - 1));
  };

  const togglePlay = () => {
    if (!playerRef.current || !playerReady) return;
    try {
      if (isPlaying) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
    } catch (e) {}
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Search the web for YouTube music videos matching: "${searchQuery}". Find actual YouTube videos and extract their 11-character video IDs from the URLs. Return up to 15 results. Each result must include the videoId, title, and channelTitle. Only include real videos you found — do not fabricate video IDs.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  videoId: { type: "string" },
                  title: { type: "string" },
                  channelTitle: { type: "string" },
                },
              },
            },
          },
        },
      });
      const results = (res?.results || [])
        .filter((r) => r.videoId && r.videoId.length >= 8)
        .map((r) => ({
          ...r,
          thumbnail: `https://img.youtube.com/vi/${r.videoId}/default.jpg`,
        }));
      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const playSearchResult = (index) => {
    failedIdsRef.current.clear();
    setQueue(searchResults);
    setCurrentIndex(index);
    setShowSearch(false);
  };

  const backToRadio = () => {
    failedIdsRef.current.clear();
    setQueue(PLAYLIST);
    setCurrentIndex(0);
    setSearchResults([]);
    setSearchQuery("");
    setShowSearch(false);
  };

  const handlePointerDown = (e) => {
    if (e.target.closest("button") || e.target.closest('input[type="range"]') || e.target.closest('input[type="text"]')) return;
    draggingRef.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    e.preventDefault();
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!draggingRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        setPosition({
          x: Math.max(0, Math.min(maxX, e.clientX - dragOffsetRef.current.x)),
          y: Math.max(0, Math.min(maxY, e.clientY - dragOffsetRef.current.y)),
        });
      }
    };
    const handlePointerUp = () => {
      draggingRef.current = false;
    };
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  if (!isVisible) return null;

  const showResultsPanel = showSearch && (searchResults.length > 0 || isSearching || (searchQuery && !isSearching));

  return (
    <div
      ref={containerRef}
      className="fixed z-[70] shadow-2xl rounded-xl overflow-hidden select-none border border-purple-200"
      style={{ left: position.x, top: position.y, width: isMinimized ? 180 : 320 }}
    >
      {/* Hidden YouTube player host — the actual player div is created
          programmatically so React re-renders don't destroy the iframe */}
      <div
        ref={playerHostRef}
        className="absolute pointer-events-none"
        style={{ width: 200, height: 200, overflow: "hidden", left: -9999, top: 0 }}
      />

      {/* Header */}
      <div
        className="cu-gradient px-3 py-2 flex items-center justify-between cursor-move touch-none"
        onPointerDown={handlePointerDown}
      >
        <div className="flex items-center gap-2 text-white">
          <Music className="w-4 h-4" />
          <span className="font-semibold text-sm">CU Radio</span>
        </div>
        <div className="flex items-center gap-0.5">
          {!isRadioMode && (
            <button
              onClick={backToRadio}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              title="Back to Radio"
            >
              <Radio className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors ${showSearch ? "bg-white/20 text-white" : ""}`}
            title="Search YouTube"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <div className="bg-white">
          {/* Search bar */}
          {showSearch && (
            <div className="p-3 border-b border-gray-100">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search YouTube for songs..."
                  className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="cu-gradient text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}

          {/* Search results */}
          {showSearch && isSearching && (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            </div>
          )}
          {showSearch && !isSearching && searchResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              {searchResults.map((result, index) => (
                <button
                  key={result.videoId}
                  onClick={() => playSearchResult(index)}
                  className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-purple-50 transition-colors text-left"
                >
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-10 h-10 rounded object-cover flex-shrink-0 bg-gray-100"
                    onError={(e) => { e.target.style.opacity = "0"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{result.title}</p>
                    <p className="text-xs text-gray-500 truncate">{result.channelTitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showSearch && !isSearching && searchResults.length === 0 && searchQuery && (
            <div className="p-4 text-center text-xs text-gray-400">
              No results found. Try a different search.
            </div>
          )}

          {/* Current track + controls (hidden when search results are shown) */}
          {!showResultsPanel && (
            <div className="p-3">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={`https://img.youtube.com/vi/${currentTrack.videoId}/default.jpg`}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover bg-purple-100 flex-shrink-0"
                  onError={(e) => { e.target.style.opacity = "0"; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{currentTrack.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentTrack.genre || currentTrack.channelTitle || "YouTube Music"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-2">
                <button onClick={playPrev} className="text-gray-600 hover:text-purple-600 p-1 transition-colors">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-lg cu-gradient flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button onClick={playNext} className="text-gray-600 hover:text-purple-600 p-1 transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div
                  className="h-1.5 bg-gray-200 rounded-full cursor-pointer relative"
                  onClick={seek}
                >
                  <div
                    className="h-1.5 bg-purple-600 rounded-full transition-all"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-1 accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}