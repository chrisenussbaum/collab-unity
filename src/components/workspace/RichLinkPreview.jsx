import React, { useState } from "react";
import { ExternalLink, PlayCircle, FileText, Video, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Rich link preview card — renders a saved resource link as a media card.
 * Mirrors the News & Entertainment style: microlink screenshots for
 * articles/docs, YouTube thumbnails with play overlay for videos.
 */
export default function RichLinkPreview({ url, title, variant = "card" }) {
  const [screenshotFailed, setScreenshotFailed] = useState(false);

  const getDomain = (urlString) => {
    try {
      return new URL(urlString).hostname.replace(/^www\./, "");
    } catch {
      return urlString;
    }
  };

  const getFavicon = (urlString) => {
    try {
      const hostname = new URL(urlString).hostname;
      return `https://www.google.com/s2/favicons?sz=128&domain_url=${hostname}`;
    } catch {
      return null;
    }
  };

  const extractYouTubeId = (urlString) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = urlString.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const isYouTubeWatch = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)/.test(url);
  const youtubeId = isYouTubeWatch ? extractYouTubeId(url) : null;
  const domain = getDomain(url);
  const favicon = getFavicon(url);

  const isVideo = !!youtubeId || isYouTubeWatch;
  const TypeIcon = isVideo ? Video : (domain.includes("docs") || domain.includes("developer") || domain.includes("api") ? FileText : Link2);
  const typeLabel = isVideo ? "Video" : "Article";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block group ${variant === "compact" ? "max-w-xs" : ""}`}
    >
      <div className="flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:border-purple-300 transition-all hover:shadow-md bg-white">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
          {isVideo && youtubeId ? (
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
              alt={title || "Video preview"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : !screenshotFailed ? (
            <img
              src={`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`}
              alt={title || "Preview"}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              onError={() => setScreenshotFailed(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 group-hover:bg-gray-50 transition-colors">
              <div className="text-center">
                {favicon && (
                  <img
                    src={favicon}
                    alt=""
                    className="w-12 h-12 mx-auto mb-2 object-contain"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}
                <p className="text-xs text-gray-400">Preview unavailable</p>
              </div>
            </div>
          )}

          {/* Play overlay for videos */}
          {isVideo && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
          )}

          <div className="absolute top-2 right-2">
            <Badge className={`text-xs ${isVideo ? "bg-red-600 text-white" : "bg-purple-600 text-white"} backdrop-blur-sm`}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {typeLabel}
            </Badge>
          </div>
        </div>

        {/* Meta */}
        <div className="p-3 flex items-center gap-2.5">
          {favicon && (
            <img
              src={favicon}
              alt=""
              className="w-6 h-6 rounded object-contain flex-shrink-0"
              onError={(e) => (e.target.style.display = "none")}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-700 transition-colors leading-snug">
              {title || domain}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-gray-500 truncate">{domain}</span>
              <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-purple-400 flex-shrink-0 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}