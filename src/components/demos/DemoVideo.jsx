import React, { useRef } from "react";

/**
 * Resilient video player for demo posts.
 *
 * Some uploaded videos report an incorrect (too-short) duration in their
 * container metadata. The browser then fires `ended` prematurely and shows a
 * replay button — clicking it restarts from 0, while seeking to a later
 * point forces a fresh range request and resumes. `preload="auto"` makes the
 * browser fetch the full file up front so the true duration is known, and the
 * `ended`/`stalled` guards keep playback going when there is clearly more
 * seekable content available.
 */
export default function DemoVideo({ src, poster, className }) {
  const videoRef = useRef(null);

  const handleEnded = () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      const seekableEnd =
        v.seekable && v.seekable.length
          ? v.seekable.end(v.seekable.length - 1)
          : 0;
      // If the seekable range extends well past the reported end, the duration
      // metadata is wrong — keep playing instead of stopping.
      if (seekableEnd - v.currentTime > 1) {
        v.currentTime = v.currentTime + 0.01;
        v.play().catch(() => {});
      }
    } catch {
      /* ignore */
    }
  };

  const handleStalled = () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (v.readyState < 3) {
        // Nudge a fresh range request for the current position.
        const t = v.currentTime;
        v.currentTime = t + 0.01;
        if (t + 0.01 >= (v.duration || 0)) v.currentTime = t;
      }
    } catch {
      /* ignore */
    }
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
      onEnded={handleEnded}
      onStalled={handleStalled}
    />
  );
}