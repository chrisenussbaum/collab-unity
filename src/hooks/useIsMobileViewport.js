import React, { useEffect, useState } from "react";

// Matches the app's desktop breakpoint (desktop nav shows at >= 1024px)
const MOBILE_QUERY = "(max-width: 1023px)";

// True while the viewport is phone/tablet-sized. Updates live on resize.
export default function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}