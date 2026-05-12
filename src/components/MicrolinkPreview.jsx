import React from "react";
import { ExternalLink } from "lucide-react";

/**
 * Reusable Microlink preview component for displaying rich link previews
 * Used across LearningHub, NewsEntertainment, and Feed project showcases
 */
export default function MicrolinkPreview({ 
  url, 
  title, 
  className = "w-[280px] sm:w-[320px]",
  showBrowser = true,
  aspectRatio = "aspect-video"
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} block group`}
    >
      <div className="h-full flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:border-purple-300 transition-all hover:shadow-md bg-white">
        {showBrowser && (
          <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 border-b border-gray-200">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <div className="flex-1 text-center bg-white rounded px-2 py-0.5 mx-3 truncate text-[10px] sm:text-xs">
              {new URL(url).hostname.replace(/^www\./, '')}
            </div>
          </div>
        )}
        <div className={`relative ${aspectRatio} bg-gray-100 overflow-hidden flex-1`}>
          <img
            src={`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`}
            alt={title || 'Preview'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display = 'none'; }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        {title && (
          <div className="p-3 bg-white">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-700 transition-colors mb-1">
              {title}
            </p>
            <p className="text-xs text-gray-500">Click to visit</p>
          </div>
        )}
      </div>
    </a>
  );
}