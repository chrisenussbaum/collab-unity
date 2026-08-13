import React, { useRef } from "react";

/**
 * Resilient video player for demo posts.
 *
 * The file host drops the progressive-download stream partway through a
 * video, so playback stalls even though the duration metadata is correct.
 * Range requests (seeking) succeed reliably, so when the stream stalls we
 * nudge playback just past the buffered range to trigger a fresh range
 * request and auto-resume — a tiny jump the viewer barely notices, instead
 * of the video freezing or restarting from zero.
 */
export default function DemoVideo({ src, poster, className }) {
  const videoRef = useRef(null);
  const recoveringRef = useRef(false);

  const handleWaiting = () => {
    const v = videoRef.current;
    if (!v || recoveringRef.current || v.paused) return;
    recoveringRef.current = true;
    // Give the browser a moment to recover on its own before nudging.
    setTimeout(() => {
      recoveringRef.current = false;
      if (!v || v.paused) return;
      if (v.readyState >= 3) return; // already has future data
      const bufferedEnd = v.buffered.length
        ? v.buffered.end(v.buffered.length - 1)
        : v.currentTime;
      const target = bufferedEnd + 0.1;
      if (target < v.duration) {
        v.currentTime = target; // forces a fresh range request
        v.play().catch(() => {});
      }
    }, 800);
  };

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster || undefined}
      controls
      playsInline
      preload="auto"
      className={className}
      onWaiting={handleWaiting}
    />
  );
}