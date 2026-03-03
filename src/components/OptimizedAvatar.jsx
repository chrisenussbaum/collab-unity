import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const OptimizedAvatar = ({ src, alt, fallback, className, size, ...props }) => {
  const resolvedClassName = className || '';
  const resolvedSize = size || 'default';
  const isSupabaseImage = src?.includes('.supabase.co/storage/v1/object/public/');

  const getOptimizedAvatarUrl = (originalUrl) => {
    if (!isSupabaseImage || !originalUrl) return originalUrl;
    try {
      const avatarSize = { xs: 32, sm: 48, default: 96, lg: 128, xl: 256 }[resolvedSize] || 96;
      const transformUrl = originalUrl.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
      );
      const params = new URLSearchParams();
      params.append('width', avatarSize);
      params.append('height', avatarSize);
      params.append('quality', '90');
      params.append('format', 'webp');
      params.append('t', Date.now());
      return `${transformUrl}?${params.toString()}`;
    } catch (e) {
      return originalUrl;
    }
  };

  const optimizedSrc = src ? getOptimizedAvatarUrl(src) : null;

  return (
    <Avatar className={resolvedClassName} {...props}>
      {optimizedSrc && <AvatarImage src={optimizedSrc} alt={alt} className="object-cover" />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};

export default OptimizedAvatar;