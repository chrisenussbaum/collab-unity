import React, { useState, useRef, useEffect } from "react";
import { Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoicePlayButton({ voiceIntroUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleClick = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(voiceIntroUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); } };
  }, []);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`text-sm gap-2 ${isPlaying ? 'border-purple-500 text-purple-600 bg-purple-50' : ''}`}
    >
      {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      {isPlaying ? 'Stop' : 'Voice Intro'}
    </Button>
  );
}