import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function OptimizedAvatar(props) {
  const src = props.src;
  const alt = props.alt;
  const fallback = props.fallback;
  const className = props.className || '';
  const size = props.size || 'default';
  const rest = Object.assign({}, props);
  delete rest.src;
  delete rest.alt;
  delete rest.fallback;
  delete rest.className;
  delete rest.size;

  const isSupabaseImage = src && src.includes('.supabase.co/storage/v1/object/public/');

  function getOptimizedUrl(originalUrl) {
    if (!isSupabaseImage || !originalUrl) return originalUrl;
    var sizeMap = { xs: 32, sm: 48, default: 96, lg: 128, xl: 256 };
    var px = sizeMap[size] || 96;
    var transformUrl = originalUrl.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );
    var params = new URLSearchParams();
    params.append('width', px);
    params.append('height', px);
    params.append('quality', '90');
    params.append('format', 'webp');
    return transformUrl + '?' + params.toString();
  }

  var optimizedSrc = src ? getOptimizedUrl(src) : null;

  return (
    <Avatar className={className} {...rest}>
      {optimizedSrc && (
        <AvatarImage src={optimizedSrc} alt={alt} className="object-cover" />
      )}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}