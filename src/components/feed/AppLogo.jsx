import React, { useState, useEffect } from "react";

/**
 * Renders an app logo with a robust fallback chain:
 * Clearbit logo → Google favicon → gradient initial letter.
 * Fixes broken images in detail dialogs and feed cards.
 */
export default function AppLogo({ app, size = "md", className = "" }) {
  const [errorStage, setErrorStage] = useState(0);

  useEffect(() => {
    setErrorStage(0);
  }, [app?.id, app?.logo_url, app?.favicon_url]);

  const sizeClasses = {
    sm: { box: "w-10 h-10 rounded-lg", img: "p-1", font: "text-sm" },
    md: { box: "w-12 h-12 rounded-xl", img: "p-1.5", font: "text-base" },
    lg: { box: "w-16 h-16 rounded-xl", img: "p-2", font: "text-xl" },
  };
  const s = sizeClasses[size] || sizeClasses.md;

  const showLogo = app?.logo_url && errorStage === 0;
  const showFavicon = app?.favicon_url && errorStage <= 1 && !showLogo;

  return (
    <div
      className={`${s.box} overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-200 flex-shrink-0 ${className}`}
    >
      {showLogo ? (
        <img
          src={app.logo_url}
          alt={app.name}
          className={`w-full h-full object-contain ${s.img}`}
          loading="lazy"
          onError={() => setErrorStage(1)}
        />
      ) : showFavicon ? (
        <img
          src={app.favicon_url}
          alt={app.name}
          className={`w-full h-full object-contain ${s.img}`}
          loading="lazy"
          onError={() => setErrorStage(2)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center cu-gradient">
          <span className={`text-white font-bold ${s.font}`}>
            {app?.name?.charAt(0)?.toUpperCase() || "A"}
          </span>
        </div>
      )}
    </div>
  );
}