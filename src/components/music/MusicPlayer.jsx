import React, { useState, useEffect, useRef } from "react";
import { Music, Play, Pause, SkipForward, SkipBack, X, ChevronDown, ChevronUp, Volume2 } from "lucide-react";
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
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(60);
  const [playerReady, setPlayerReady] = useState(false);
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 20, y: 100 };
    return {
      x: Math.max(16, window.innerWidth - 316),
      y: Math.max(80, window.innerHeight - 260),
    };
  });

  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const currentTrack = PLAYLIST[currentTrackIndex];

  useEffect(() => {
    loadYouTubeAPI();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let checkInterval;
    const initPlayer = () => {
      const playerDiv = document.getElementById("cu-yt-player");
      if (apiReady && window.YT && window.YT.Player && playerDiv) {
        playerRef.current = new window.YT.Player("cu-yt-player", {
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
              if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
              else if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
              else if (e.data === window.YT.PlayerState.ENDED) {
                setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
              }
            },
            onError: () => {
              setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
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
      setPlayerReady(false);
      setIsPlaying(false);
    };
  }, [isVisible]);

  useEffect(() => {
    if (playerRef.current && playerReady) {
      try {
        playerRef.current.loadVideoById(PLAYLIST[currentTrackIndex].videoId);
      } catch (e) {}
    }
  }, [currentTrackIndex, playerReady]);

  useEffect(() => {
    if (playerRef.current && playerReady) {
      try {
        playerRef.current.setVolume(volume);
      } catch (e) {}
    }
  }, [volume, playerReady]);

  const playNext = () => setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  const playPrev = () =>
    setCurrentTrackIndex((prev) => (prev === 0 ? PLAYLIST.length - 1 : prev - 1));

  const togglePlay = () => {
    if (!playerRef.current || !playerReady) return;
    try {
      if (isPlaying) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
    } catch (e) {}
  };

  const handlePointerDown = (e) => {
    if (e.target.closest("button") || e.target.closest('input[type="range"]')) return;
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
      style={{ left: position.x, top: position.y, width: isMinimized ? 180 : 300 }}
    >
      {/* Hidden YouTube player */}
      <div
        className="absolute pointer-events-none"
        style={{ width: 1, height: 1, overflow: "hidden", bottom: 0, right: 0, opacity: 0 }}
      >
        <div id="cu-yt-player"></div>
      </div>

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
        <div className="bg-white p-3">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={`https://img.youtube.com/vi/${currentTrack.videoId}/default.jpg`}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-lg object-cover bg-purple-100 flex-shrink-0"
              onError={(e) => {
                e.target.style.opacity = "0";
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{currentTrack.title}</p>
              <p className="text-xs text-gray-500 truncate">{currentTrack.genre}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-3">
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
  );
}