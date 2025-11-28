import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ASPECT_RATIOS = {
  '16:9': 16/9,
  '4:3': 4/3,
  '3:2': 3/2,
  '1:1': 1/1
};

const getClosestAspectRatio = (width, height) => {
  const imageRatio = width / height;
  let closestRatio = '1:1';
  let minDifference = Math.abs(imageRatio - ASPECT_RATIOS['1:1']);

  Object.entries(ASPECT_RATIOS).forEach(([ratio, value]) => {
    const difference = Math.abs(imageRatio - value);
    if (difference < minDifference) {
      minDifference = difference;
      closestRatio = ratio;
    }
  });

  return closestRatio;
};

const calculateOptimalDimensions = (aspectRatio, maxWidth, maxHeight) => {
  const ratio = ASPECT_RATIOS[aspectRatio];
  
  let width = maxWidth;
  let height = width / ratio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
};

export default function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  caption, 
  altText = "Image"
}) {
  const [imageDimensions, setImageDimensions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [optimalDimensions, setOptimalDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (imageUrl && isOpen) {
      setIsLoading(true);
      const img = new Image();
      
      img.onload = () => {
        const detectedRatio = getClosestAspectRatio(img.naturalWidth, img.naturalHeight);
        setAspectRatio(detectedRatio);
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        
        // Calculate optimal dimensions for 50% of screen
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const maxWidth = screenWidth * 0.5;
        const maxHeight = screenHeight * 0.5;
        
        const optimal = calculateOptimalDimensions(detectedRatio, maxWidth, maxHeight);
        setOptimalDimensions(optimal);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setIsLoading(false);
      };
      
      img.src = imageUrl;
    }
  }, [imageUrl, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent 
            className="p-0 border-0 bg-transparent shadow-none max-w-none w-auto h-auto outline-none"
            onInteractOutside={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative rounded-lg overflow-hidden shadow-2xl"
              style={{ 
                width: optimalDimensions.width, 
                height: optimalDimensions.height + (caption ? 60 : 0)
              }}
            >
              {/* Clean Close Button - Fixed styling */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 border border-white/30 hover:scale-110"
              >
                <X className="w-5 h-5 text-white drop-shadow-lg" />
              </button>

              {/* Image Container */}
              <div 
                className="relative overflow-hidden"
                style={{ 
                  width: optimalDimensions.width, 
                  height: optimalDimensions.height 
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-full bg-gray-900">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt={altText}
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Caption */}
              {caption && (
                <div className="bg-white px-4 py-3 border-t">
                  <p className="text-sm text-gray-700 text-center">{caption}</p>
                </div>
              )}
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}