import React from "react";

export default function ConversationSkeleton() {
  return (
    <div className="w-full p-4 flex items-start space-x-3 animate-pulse">
      {/* Avatar skeleton */}
      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
      
      <div className="flex-1 min-w-0 py-1">
        {/* Name skeleton */}
        <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
        {/* Message preview skeleton */}
        <div className="h-3 bg-gray-200 rounded w-48 mb-1" />
        {/* Time skeleton */}
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}