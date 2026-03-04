import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function OptimizedAvatar(inputProps) {
  var src = inputProps.src || null;
  var alt = inputProps.alt || '';
  var fallback = inputProps.fallback || '';
  var className = inputProps.className || '';
  var size = inputProps.size || 'default';

  var sizeMap = { xs: 32, sm: 48, default: 96, lg: 128, xl: 256 };
  var px = sizeMap[size] || 96;

  var optimizedSrc = null;
  if (src) {
    if (src.indexOf('.supabase.co/storage/v1/object/public/') !== -1) {
      var transformUrl = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      optimizedSrc = transformUrl + '?width=' + px + '&height=' + px + '&quality=90&format=webp';
    } else {
      optimizedSrc = src;
    }
  }

  return (
    <Avatar className={className}>
      {optimizedSrc ? <AvatarImage src={optimizedSrc} alt={alt} className="object-cover" /> : null}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

export default OptimizedAvatar;