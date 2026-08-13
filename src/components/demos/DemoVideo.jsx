import React, { useState } from "react";
import { Play } from "lucide-react";

/**
 * Demo video player that mirrors how project highlight videos behave:
 * a poster/thumbnail is shown with a play overlay, and the real streaming
 * <video> is only mounted on click (exactly like MediaModal). Keeping a full
 * <video> off the page until the user requests it means only one video
 * streams at a time — the file host drops progressive-download connections
 * when many demo videos stream concurrently, which is what caused the
 * mid-playback stalls.
 */
export default function DemoVideo({ src, poster, className }) {
  const [active, setActive] = useState(false);

  if (!active) {
    return (
      <div
        className={`relative bg-black cursor-pointer ${className}`}
        onClick={() => setActive(true)}
      >
        {poster ? (
          <img
            src={poster}
            alt="demo video"
            className="w-full h-full object-contain bg-black"
            loading="lazy"
          />
        ) : (
          // No thumbnail: fetch metadata only to render a first frame,
          // without starting a full progressive download.
          <video
            src={src}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-black"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <video
      key={`video-${src}`}
      src={src}
      poster={poster || undefined}
      controls
      autoPlay
      playsInline
      preload="auto"
      className={className}
    >
      <source src={src} type="video/mp4" />
      <source src={src} type="video/quicktime" />
      Your browser does not support the video tag.
    </video>
  );
}