import React, { useState } from "react";
import ImageModal from "./ImageModal";

export default function ClickableImage({ 
  src, 
  alt = "Image", 
  caption, 
  className = "", 
  style = {},
  loading = "lazy", // Support lazy loading
  ...props 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      {hasError ? (
        <div 
          className={`flex items-center justify-center bg-gray-200 ${className}`}
          style={style}
        >
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`cursor-pointer hover:opacity-90 transition-opacity ${className}`}
          style={style}
          onClick={handleImageClick}
          onError={() => setHasError(true)}
          loading={loading}
          {...props}
        />
      )}
      
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={src}
        caption={caption}
        altText={alt}
      />
    </>
  );
}