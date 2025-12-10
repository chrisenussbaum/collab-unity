import React, { useState } from 'react';

/**
 * OptimizedImage - A component that serves optimized images with WebP support and responsive srcset
 * 
 * Features:
 * - Automatic WebP format with fallback
 * - Responsive srcset for different screen sizes
 * - Lazy loading support
 * - Error handling with fallback
 */

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '',
  width,
  height,
  sizes,
  loading = 'lazy',
  fallback,
  onError,
  onClick,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);

  // Check if the image is from Supabase storage
  const isSupabaseImage = src?.includes('.supabase.co/storage/v1/object/public/');
  
  // Generate optimized URLs for different sizes if it's a Supabase image
  const getOptimizedUrl = (originalUrl, targetWidth) => {
    if (!isSupabaseImage || !originalUrl) return originalUrl;
    
    try {
      // Supabase image transformation API
      // Replace 'object/public' with 'render/image/public' and add transformation params
      const transformUrl = originalUrl.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
      );
      
      const params = new URLSearchParams();
      if (targetWidth) params.append('width', targetWidth);
      params.append('quality', '85'); // Good balance of quality and size
      params.append('format', 'webp'); // Modern format
      
      return `${transformUrl}?${params.toString()}`;
    } catch (e) {
      return originalUrl;
    }
  };

  // Generate srcset for responsive images
  const generateSrcSet = (originalUrl) => {
    if (!isSupabaseImage || !originalUrl) return null;
    
    const widths = [320, 640, 960, 1280, 1920];
    return widths
      .map(w => `${getOptimizedUrl(originalUrl, w)} ${w}w`)
      .join(', ');
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  // If there's an error, show fallback
  if (hasError && fallback) {
    return fallback;
  }

  // If not a Supabase image or error occurred, use original src
  if (!isSupabaseImage || hasError) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        onError={handleError}
        onClick={onClick}
        {...props}
      />
    );
  }

  // Optimized Supabase image with WebP and srcset
  const optimizedSrc = width ? getOptimizedUrl(src, width) : getOptimizedUrl(src, 1280);
  const srcSet = generateSrcSet(src);

  return (
    <picture>
      {/* WebP source with srcset for modern browsers */}
      {srcSet && (
        <source
          type="image/webp"
          srcSet={srcSet}
          sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        />
      )}
      
      {/* Fallback img tag */}
      <img
        src={optimizedSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        onError={handleError}
        onClick={onClick}
        {...props}
      />
    </picture>
  );
};

export default OptimizedImage;