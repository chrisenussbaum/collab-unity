import React, { useState, useEffect, useRef } from "react";
import MediaModal from "./MediaModal";
import { AlertCircle } from "lucide-react";

export default function MediaDisplay({ 
  src, 
  mediaType = "image",
  alt = "Media", 
  caption,
  thumbnailUrl,
  className = "", 
  style = {},
  allMedia = [],
  currentIndex = 0,
  loading = "lazy",
  ...props 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [localThumbnail, setLocalThumbnail] = useState(null);
  const videoRef = useRef(null);

  // Validate media URL
  const isValidUrl = src && typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'));

  const handleMediaClick = () => {
    if (!hasError && isValidUrl) {
      setIsModalOpen(true);
    }
  };

  const handleImageError = () => {
    setHasError(true);
  };

  const handleThumbnailError = () => {
    setThumbnailError(true);
  };

  // For videos without thumbnails, try to capture first frame on mobile
  useEffect(() => {
    if (mediaType === 'video' && !thumbnailUrl && videoRef.current && isValidUrl) {
      const video = videoRef.current;
      
      const captureFrame = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setLocalThumbnail(dataUrl);
        } catch (err) {
          console.warn('Could not capture video frame:', err);
        }
      };

      video.addEventListener('loadeddata', captureFrame);
      video.addEventListener('seeked', captureFrame);
      
      return () => {
        video.removeEventListener('loadeddata', captureFrame);
        video.removeEventListener('seeked', captureFrame);
      };
    }
  }, [mediaType, thumbnailUrl, isValidUrl]);

  // If invalid URL, show error immediately
  if (!isValidUrl) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-200 rounded-lg ${className}`}
        style={style}
      >
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-gray-500 text-xs text-center px-2">Invalid media URL</span>
      </div>
    );
  }

  if (mediaType === 'video') {
    // Determine which thumbnail source to use
    const hasThumbnail = thumbnailUrl && typeof thumbnailUrl === 'string' && 
                         thumbnailUrl.startsWith('http') && !thumbnailError;
    const effectiveThumbnail = hasThumbnail ? thumbnailUrl : localThumbnail;

    return (
      <>
        <div 
          className={`cursor-pointer hover:opacity-90 transition-opacity relative bg-gray-100 rounded-lg overflow-hidden ${className}`}
          style={style}
          onClick={handleMediaClick}
          {...props}
        >
          {effectiveThumbnail ? (
            // Show thumbnail image (from server or locally generated)
            <img
              src={effectiveThumbnail}
              alt={alt}
              className="w-full h-full object-cover"
              onError={handleThumbnailError}
              loading={loading}
            />
          ) : (
            // Show video element with hidden controls to capture first frame
            <video
              ref={videoRef}
              src={src}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
              onError={handleImageError}
              style={{ pointerEvents: 'none' }}
              crossOrigin="anonymous"
            />
          )}
          
          {hasError && !effectiveThumbnail && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200">
              <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-500 text-xs text-center px-2">Failed to load video</span>
            </div>
          )}

          {/* Play button overlay */}
          {!hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          )}

          {/* VIDEO badge */}
          <div className="absolute top-2 right-2 bg-black/70 text-white rounded px-2 py-1 text-xs font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
            VIDEO
          </div>
        </div>
        
        <MediaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mediaUrl={src}
          mediaType={mediaType}
          caption={caption}
          altText={alt}
          thumbnailUrl={effectiveThumbnail}
          allMedia={allMedia}
          initialIndex={currentIndex}
        />
      </>
    );
  }

  // Image display - simple and direct
  return (
    <>
      <div 
        className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}
        style={style}
        {...props}
      >
        {hasError ? (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gray-200">
            <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-gray-500 text-xs text-center px-2">Failed to load image</span>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            className="cursor-pointer hover:opacity-90 transition-opacity w-full h-full object-cover"
            onClick={handleMediaClick}
            onError={handleImageError}
            loading={loading}
          />
        )}
      </div>
      
      <MediaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mediaUrl={src}
        mediaType={mediaType}
        caption={caption}
        altText={alt}
        allMedia={allMedia}
        currentIndex={currentIndex}
      />
    </>
  );
}