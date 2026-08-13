import React from "react";

/**
 * Demo video player using the same playback mechanism as the project
 * highlight videos (MediaModal): a per-URL key + explicit <source> elements
 * with MIME type hints and preload="auto". That pattern plays the full file
 * without the mid-stream stalls seen with a bare <video src> on this host.
 */
export default function DemoVideo({ src, poster, className }) {
  return (
    <video
      key={`video-${src}`}
      src={src}
      poster={poster || undefined}
      controls
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