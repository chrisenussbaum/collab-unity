import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MediaModal({ 
  isOpen, 
  onClose, 
  mediaUrl, 
  mediaType = "image", 
  caption, 
  altText = "Media",
  thumbnailUrl,
  allMedia = [],
  initialIndex = 0
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const currentMedia = allMedia.length > 0 ? allMedia[currentIndex] : {
    media_url: mediaUrl,
    media_type: mediaType,
    caption: caption,
    thumbnail_url: thumbnailUrl
  };

  const hasMultiple = allMedia.length > 1;
  const currentMediaType = currentMedia.media_type || 'image';
  const currentMediaUrl = currentMedia.media_url || currentMedia.image_url;
  const currentCaption = currentMedia.caption;

  // Validate current media URL
  const isValidUrl = currentMediaUrl && 
                     typeof currentMediaUrl === 'string' && 
                     (currentMediaUrl.startsWith('http://') || currentMediaUrl.startsWith('https://'));

  // Reset states when media changes
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(false);
    setHasError(false);
    
    // If URL is invalid, set error immediately
    if (!isValidUrl) {
      setHasError(true);
    }
  }, [currentMediaUrl, isOpen, isValidUrl]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleMediaError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleMediaLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-hidden bg-transparent border-2 border-purple-300">
        <div className="relative w-full h-full flex items-center justify-center min-h-[300px]">
          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>

          {/* Navigation Arrows */}
          {hasMultiple && (
            <>
              <Button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                variant="ghost"
                size="icon"
                className="absolute left-2 sm:left-4 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-30 shadow-lg"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentIndex === allMedia.length - 1}
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-30 shadow-lg"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </Button>
            </>
          )}

          {/* Counter */}
          {hasMultiple && (
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50 bg-purple-600 text-white px-3 py-1 rounded-full text-sm shadow-lg">
              {currentIndex + 1} / {allMedia.length}
            </div>
          )}

          {/* Loading Spinner - Only show briefly */}
          <AnimatePresence>
            {isLoading && !hasError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-40"
              >
                <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-white animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center px-4 text-white">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mb-4" />
              <p className="text-sm sm:text-base mb-4 text-center">
                {isValidUrl ? "Failed to load media" : "Invalid media URL"}
              </p>
            </div>
          ) : (
            /* Media Content */
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
              {currentMediaType === 'video' ? (
                <video
                  key={`video-${currentMediaUrl}-${currentIndex}`}
                  src={currentMediaUrl}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  poster={currentMedia.thumbnail_url}
                  className="max-w-full max-h-[80vh] w-auto h-auto"
                  onLoadedData={handleMediaLoad}
                  onError={handleMediaError}
                  onCanPlay={handleMediaLoad}
                >
                  <source src={currentMediaUrl} type="video/mp4" />
                  <source src={currentMediaUrl} type="video/quicktime" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  key={`image-${currentMediaUrl}-${currentIndex}`}
                  src={currentMediaUrl}
                  alt={currentCaption || altText}
                  className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                />
              )}
            </div>
          )}

          {/* Caption */}
          {currentCaption && !isLoading && !hasError && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
              <p className="text-white text-sm sm:text-base text-center">{currentCaption}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}