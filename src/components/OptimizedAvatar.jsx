import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * OptimizedAvatar - An optimized version of Avatar with WebP support
 * 
 * Wraps the shadcn Avatar component but with optimized image loading
 */

const OptimizedAvatar = ({ 
  src, 
  alt, 
  fallback,
  className = '',
  size = 'default', // 'sm', 'default', 'lg'
  ...props 
}) => {
  // Check if the image is from Supabase storage
  const isSupabaseImage = src?.includes('.supabase.co/storage/v1/object/public/');
  
  // Generate optimized avatar URL with cache busting
  const getOptimizedAvatarUrl = (originalUrl) => {
    if (!isSupabaseImage || !originalUrl) return originalUrl;
    
    try {
      // Determine avatar size based on prop
      const avatarSize = {
        'xs': 32,
        'sm': 48,
        'default': 96,
        'lg': 128,
        'xl': 256
      }[size] || 96;
      
      // Supabase image transformation for avatars
      const transformUrl = originalUrl.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
      );
      
      const params = new URLSearchParams();
      params.append('width', avatarSize);
      params.append('height', avatarSize);
      params.append('quality', '90'); // Higher quality for profile images
      params.append('format', 'webp');
      
      return `${transformUrl}?${params.toString()}`;
    } catch (e) {
      return originalUrl;
    }
  };

  const optimizedSrc = src ? getOptimizedAvatarUrl(src) : null;

  return (
    <Avatar className={className} {...props}>
      {optimizedSrc && (
        <AvatarImage src={optimizedSrc} alt={alt} className="object-cover" />
      )}
      <AvatarFallback>
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default OptimizedAvatar;