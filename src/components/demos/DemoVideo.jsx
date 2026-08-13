import React, { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Resilient video player for demo posts.
 *
 * The file host periodically drops the progressive-download stream partway
 * through a video, so playback stalls even though the duration metadata is
 * correct (clicking play restarts from 0; seeking forces a fresh range request
 * that works for a while, then stalls again). Fetching the whole file into a
 * local blob once and playing from memory eliminates the stalls entirely.
 */
export default function DemoVideo({ src, poster, className }) {
  const videoRef = useRef(null);
  const [blobSrc, setBlobSrc] = useState(null);
  const [buffering, setBuffering] = useState(false);

  const ensureBlob = async () => {
    if (blobSrc) return blobSrc;
    setBuffering(true);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setBlobSrc(url);
      return url;
    } catch {
      return null; // fall back to streaming src
    } finally {
      setBuffering(false);
    }
  };

  // Once the full-file blob is ready, start playing it.
  useEffect(() => {
    if (blobSrc && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [blobSrc]);

  // Revoke the object URL when it changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (blobSrc) URL.revokeObjectURL(blobSrc);
    };
  }, [blobSrc]);

  const handlePlay = async () => {
    if (blobSrc) return; // already playing from local memory
    const v = videoRef.current;
    if (v) v.pause();
    await ensureBlob(); // effect above resumes playback once ready
  };

  return (
    <div className="relative bg-black">
      <video
        ref={videoRef}
        src={blobSrc || src}
        poster={poster || undefined}
        controls
        playsInline
        preload="metadata"
        className={className}
        onPlay={handlePlay}
      />
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
    </div>
  );
}