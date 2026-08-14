import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const MusicPlayerContext = createContext(null);

const PROJECT_PATH = createPageUrl("ProjectDetail");

export function isProjectPath(pathname) {
  return pathname.startsWith(PROJECT_PATH);
}

/**
 * Single source of truth for the CU Radio music player.
 *
 * Music opened from within a project canvas is "project-scoped": it auto-closes
 * when the user leaves the project route. Music opened from the main app nav is
 * "global" and persists across navigation until the user closes it.
 */
export function MusicPlayerProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [context, setContext] = useState("global"); // 'global' | 'project'
  const location = useLocation();
  const visibleRef = useRef(false);

  useEffect(() => { visibleRef.current = visible; }, [visible]);

  const open = useCallback((ctx = "global") => {
    setContext(ctx);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const toggle = useCallback((ctx = "global") => {
    if (visibleRef.current) {
      setVisible(false);
    } else {
      setContext(ctx);
      setVisible(true);
    }
  }, []);

  // Auto-close project-scoped music once the user leaves a project route.
  useEffect(() => {
    if (!isProjectPath(location.pathname) && context === "project" && visibleRef.current) {
      setVisible(false);
    }
  }, [location.pathname, context]);

  const value = {
    visible,
    context,
    isProject: isProjectPath(location.pathname),
    open,
    close,
    toggle,
  };

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    // Safe fallback so a consumer rendered outside the provider doesn't crash.
    return { visible: false, context: "global", isProject: false, open: () => {}, close: () => {}, toggle: () => {} };
  }
  return ctx;
}