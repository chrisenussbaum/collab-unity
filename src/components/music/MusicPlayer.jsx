import React, { useState, useEffect, useRef } from "react";
import { Music, Play, Pause, SkipForward, SkipBack, X, ChevronDown, ChevronUp, Volume2, Volume1, VolumeX, Search, Loader2 } from "lucide-react";
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

export default function MusicPlayer({ isVisible, onClose, zIndex }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [queue, setQueue] = useState(PLAYLIST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [volume, setVolume] = useState(60);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const availableGenres = [...new Set(PLAYLIST.map((t) => t.genre))].sort();
  const [playerReady, setPlayerReady] = useState(false);
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 20, y: 100 };
    return {
      x: Math.max(16, window.innerWidth - 336),
      y: Math.max(80, window.innerHeight - 260),
    };
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef(null);
  const playerHostRef = useRef(null);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const queueRef = useRef(PLAYLIST);
  queueRef.current = queue;
  const failedIdsRef = useRef(new Set());
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;
  const prevVolumeRef = useRef(60);
  const pendingSearchIndexRef = useRef(null);

  const currentTrack = queue[currentIndex] || PLAYLIST[0];

  // Re-sync queue when PLAYLIST reference or selected genre changes
  useEffect(() => {
    const filtered = selectedGenre
      ? PLAYLIST.filter((t) => t.genre === selectedGenre)
      : PLAYLIST;
    setQueue(filtered);
    if (pendingSearchIndexRef.current !== null) {
      setCurrentIndex(pendingSearchIndexRef.current);
      pendingSearchIndexRef.current = null;
    } else {
      setCurrentIndex(0);
    }
    failedIdsRef.current.clear();
  }, [PLAYLIST, selectedGenre]);

  useEffect(() => {
    loadYouTubeAPI();
  }, []);

  // Debounced search — same mechanism as GlobalSearchBar (300ms debounce)
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      const q = searchQuery.trim().toLowerCase();
      if (q.length < 1) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      const results = PLAYLIST.filter((track) => {
        const titleMatch = track.title.toLowerCase().includes(q);
        const genreMatch = track.genre.toLowerCase().includes(q);
        return titleMatch || genreMatch;
      }).slice(0, 20);
      setSearchResults(results);
      setShowSearchResults(true);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSelect = (track) => {
    const idx = PLAYLIST.findIndex((t) => t.videoId === track.videoId);
    if (idx >= 0) {
      setSelectedGenre(null);
      pendingSearchIndexRef.current = idx;
      setQueue(PLAYLIST);
      setCurrentIndex(idx);
    }
    setSearchQuery("");
    setShowSearchResults(false);
  };

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

  const toggleMute = () => {
    if (volume > 0) {
      prevVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(prevVolumeRef.current || 60);
    }
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

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

  return (
    <div
      ref={containerRef}
      className="fixed z-[70] shadow-2xl rounded-xl overflow-hidden select-none border border-purple-200"
      style={{ left: position.x, top: position.y, width: isMinimized ? 180 : 320, ...(zIndex ? { zIndex } : {}) }}
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
          {/* Genre filter */}
          <div className="px-3 pt-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide border-b border-gray-100">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedGenre === null
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600"
              }`}
            >
              All
            </button>
            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedGenre === genre
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          {/* Search */}
          <div ref={searchRef} className="px-3 pt-2 pb-1 relative border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search songs or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 1 && setShowSearchResults(true)}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-gray-100 border border-transparent focus:border-purple-300 focus:bg-white focus:outline-none transition-colors"
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 animate-spin" />
              )}
              {searchQuery && !isSearching && (
                <button
                  onClick={() => { setSearchQuery(""); setShowSearchResults(false); }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {showSearchResults && searchQuery.trim().length >= 1 && (
              <div className="absolute left-3 right-3 top-full mt-1 max-h-60 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Search className="w-6 h-6 mx-auto mb-1.5 text-gray-300" />
                    <p className="text-xs font-medium">No songs found</p>
                    <p className="text-[10px] mt-0.5">Try a different search</p>
                  </div>
                ) : (
                  searchResults.map((track, i) => (
                    <button
                      key={`${track.videoId}-${i}`}
                      onClick={() => handleSearchSelect(track)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${track.videoId}/default.jpg`}
                        alt={track.title}
                        className="w-9 h-9 rounded object-cover bg-purple-100 flex-shrink-0"
                        onError={(e) => { e.target.style.opacity = "0"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{track.title}</p>
                        <p className="text-[10px] text-gray-500 truncate">{track.genre}</p>
                      </div>
                      <Play className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
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
                <button
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-purple-600 flex-shrink-0 transition-colors"
                  title={volume === 0 ? "Unmute" : "Mute"}
                >
                  <VolumeIcon className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v > 0) prevVolumeRef.current = v;
                    setVolume(v);
                  }}
                  className="cu-volume-slider flex-1 cursor-pointer"
                  style={{ "--vol": `${volume}%` }}
                />
              </div>
            </div>
        </div>
      )}
    </div>
  );
}