import React from "react";

function getYoutubeThumb(url) {
  const m = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}
function getFavicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`; } catch { return null; }
}
const mshots = (url) => `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=400&h=300`;

export default function ResourceThumb({ url, title, fallbackIcon, className = "" }) {
  const yt = getYoutubeThumb(url);
  const fav = getFavicon(url);

  if (yt) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100 ${className}`}>
        <img src={yt} alt={title} className="w-full h-full object-cover" onError={e => { e.target.style.opacity = 0; }} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        {fav ? (
          <img src={fav} alt="" className="w-10 h-10 rounded-lg object-contain opacity-70" onError={e => { e.target.style.display = 'none'; }} />
        ) : fallbackIcon}
      </div>
      <img
        src={mshots(url)}
        alt={`${title} preview`}
        className="relative w-full h-full object-cover object-top"
        onError={e => { e.target.style.display = 'none'; }}
      />
    </div>
  );
}