import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Monitor, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

// Matches the app's desktop breakpoint (desktop nav shows at >= 1024px)
const MOBILE_QUERY = "(max-width: 1023px)";

export function useIsMobileViewport() {
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

// Hard-blocks its children on mobile/touch-sized screens: the project canvas
// is optimized for desktop, so mobile users see a friendly explanation instead.
export default function MobileCanvasGate({ children, projectTitle }) {
  const isMobile = useIsMobileViewport();
  if (!isMobile) return children;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl cu-gradient flex items-center justify-center mb-4 shadow-lg">
          <Monitor className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          The project canvas is desktop-optimized
        </h2>
        {projectTitle && (
          <p className="text-sm font-medium text-gray-700 mb-2">"{projectTitle}"</p>
        )}
        <p className="text-sm text-gray-600 mb-6">
          For the best experience, open Collab Unity on a desktop or laptop to
          view and work on this project. Everything else — Feed, Demos, Chat,
          and Projects — works great right here on mobile.
        </p>
        <Button asChild className="cu-button">
          <Link to={createPageUrl("Feed")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Link>
        </Button>
      </div>
    </div>
  );
}