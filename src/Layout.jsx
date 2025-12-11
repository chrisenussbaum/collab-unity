import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/all";
import { Toaster } from "@/components/ui/sonner"
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OptimizedAvatar from "./components/OptimizedAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Bell, Plus, LogOut, Eye, Edit, LayoutGrid, ShieldCheck, User as UserIcon, Lightbulb, Settings, Compass, Search, MessageCircle, Loader2, Heart, Bug } from "lucide-react";
import NotificationBell from "./components/NotificationBell";
import GlobalSearchBar from "./components/GlobalSearchBar";

// Force logout timestamp - update this to force all users to re-authenticate
const FORCE_LOGOUT_AFTER = new Date('2025-01-17T16:00:00Z').getTime();

// Inactivity timeout: 12 hours in milliseconds
const INACTIVITY_TIMEOUT = 12 * 60 * 60 * 1000;

// Set branding immediately when module loads (before React renders)
(() => {
  // Update title immediately
  document.title = "Collab Unity";
  
  // Update favicon immediately
  const faviconUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";
  
  // Remove all existing favicons
  const existingFavicons = document.querySelectorAll("link[rel*='icon']");
  existingFavicons.forEach(favicon => favicon.remove());
  
  // Add new favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/jpeg';
  link.href = faviconUrl;
  document.head.appendChild(link);
  
  // Add apple-touch-icon
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = faviconUrl;
  document.head.appendChild(appleLink);
  
  // Add shortcut icon for better browser support
  const shortcutLink = document.createElement('link');
  shortcutLink.rel = 'shortcut icon';
  shortcutLink.type = 'image/jpeg';
  link.href = faviconUrl;
  document.head.appendChild(shortcutLink);
  
  // Update meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', 'Where Ideas Happen - Connect with talented professionals, collaborate on meaningful projects, and bring your vision to life.');
})();

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const publicRoutes = [
    createPageUrl("Welcome"),
    createPageUrl("About"),
    createPageUrl("Contact"),
    createPageUrl("TermsOfService"),
    createPageUrl("PrivacyPolicy"),
    createPageUrl("Demos"),
    createPageUrl("AboutUs"),
    createPageUrl("FeatureRequest"),
    createPageUrl("Testimonials")
  ];

  // Check for login callback - don't redirect during auth flow
  const isLoginCallback = location.pathname.includes('/login') || 
                          location.pathname.includes('/callback') ||
                          location.pathname.includes('/auth') ||
                          location.search.includes('code=') ||
                          location.search.includes('token=');

  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route)) || isLoginCallback;

  // Ensure branding persists on every render (belt and suspenders approach)
  useEffect(() => {
    // Keep title updated
    if (document.title !== "Collab Unity") {
      document.title = "Collab Unity";
    }
    
    // Verify favicon exists
    const faviconUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";
    const existingCollabUnityFavicon = document.querySelector(`link[rel*='icon'][href="${faviconUrl}"]`);
    
    if (!existingCollabUnityFavicon) {
      // Remove any existing favicons that are not the Collab Unity one
      const existingFavicons = document.querySelectorAll("link[rel*='icon']");
      existingFavicons.forEach(favicon => {
        if (favicon.href !== faviconUrl) { // Remove if it's not our desired favicon
          favicon.remove();
        }
      });
      
      // Re-add Collab Unity favicon if it was somehow removed or not there
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/jpeg';
      link.href = faviconUrl;
      document.head.appendChild(link);

      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = faviconUrl;
      document.head.appendChild(appleLink);
      
      const shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      shortcutLink.type = 'image/jpeg';
      shortcutLink.href = faviconUrl;
      document.head.appendChild(shortcutLink);
    }
  }); // No dependencies means this runs on every render

  // Track user activity and auto-logout after inactivity
  useEffect(() => {
    if (!currentUser) return; // Only track activity for authenticated users

    let backendUpdateTimeout;
    
    const updateActivity = () => {
      try {
        localStorage.setItem('cu_last_activity', Date.now().toString());
        
        // Debounce backend update - only fire after 3 seconds of no activity
        if (backendUpdateTimeout) {
          clearTimeout(backendUpdateTimeout);
        }
        
        backendUpdateTimeout = setTimeout(async () => {
          try {
            await base44.functions.invoke('updateUserActivity');
          } catch (error) {
            console.warn('Failed to update user activity on backend:', error);
          }
        }, 3000);
      } catch (e) {
        console.warn("Error updating activity:", e);
      }
    };

    // Update activity on various user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check inactivity every minute
    const inactivityCheck = setInterval(() => {
      try {
        const lastActivity = localStorage.getItem('cu_last_activity');
        if (lastActivity) {
          const timeSinceActivity = Date.now() - parseInt(lastActivity);
          if (timeSinceActivity > INACTIVITY_TIMEOUT) {
            console.log("User inactive for too long, logging out...");
            handleLogout();
          }
        }
      } catch (e) {
        console.warn("Error checking inactivity:", e);
      }
    }, 60000); // Check every minute

    // Initialize activity timestamp
    updateActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(inactivityCheck);
      if (backendUpdateTimeout) {
        clearTimeout(backendUpdateTimeout);
      }
    };
  }, [currentUser]); // Re-run if currentUser changes (e.g., logs in/out)

  useEffect(() => {
    // Check if user needs to be force-logged out
    try {
      const lastVisit = localStorage.getItem('cu_last_visit');
      if (lastVisit && parseInt(lastVisit) < FORCE_LOGOUT_AFTER) {
        // User's last visit was before the force logout timestamp
        localStorage.clear();
        sessionStorage.clear();
        // Will be handled by auth check below, which will treat user as unauthenticated
        console.log("Force-logging out user due to old session timestamp.");
      }

      // Check for inactivity logout on initial load
      const lastActivity = localStorage.getItem('cu_last_activity');
      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        if (timeSinceActivity > INACTIVITY_TIMEOUT) {
          // User has been inactive for more than 12 hours
          console.log("User was inactive for too long, clearing session on load.");
          localStorage.clear();
          sessionStorage.clear();
        }
      }
    } catch (e) {
      console.warn("Error accessing localStorage:", e);
    }
    
    // Prevent multiple redirects during the same session
    if (hasNavigated) {
      return;
    }

    const loadUserAndHandleRedirects = async () => {
      setIsLoading(true);
      
      // Don't interfere with login/auth callbacks - let them complete
      if (isLoginCallback) {
        console.log("Login callback detected, waiting for auth to complete...");
        setAuthChecked(true);
        setIsLoading(false);
        return;
      }
      
      try {
        // First check if user is authenticated before making the API call
        const isAuthenticated = await base44.auth.isAuthenticated();
        
        if (!isAuthenticated) {
          console.log("User not authenticated (checked via isAuthenticated)");
          setCurrentUser(null);
          setAuthChecked(true);
          
          // Only redirect to Welcome if user is trying to access a protected route
          // AND is not already on a public route
          if (!isPublicRoute && !location.pathname.startsWith(createPageUrl("Welcome"))) {
            setHasNavigated(true);
            navigate(createPageUrl("Welcome"), { replace: true });
          }
          return;
        }
        
        const user = await User.me();

        // Update last visit timestamp
        try {
          localStorage.setItem('cu_last_visit', Date.now().toString());
          localStorage.setItem('cu_last_activity', Date.now().toString()); // Also update last activity
        } catch (e) {
          console.warn("Error setting localStorage:", e);
        }
        
        setCurrentUser(user);
        setAuthChecked(true);

        // Only redirect to onboarding if user hasn't completed it AND is not already on onboarding page
        // Also redirect if profile_image is missing, even if onboarding flag is true
        if ((!user.has_completed_onboarding || !user.profile_image) && location.pathname !== createPageUrl("Onboarding")) {
          setHasNavigated(true);
          navigate(createPageUrl("Onboarding"), { replace: true });
          return;
        }

        // If user is authenticated and on Welcome page, redirect them to Feed
        if (location.pathname === createPageUrl("Welcome") || location.pathname === "/") {
          setHasNavigated(true);
          navigate(createPageUrl("Feed"), { replace: true });
          return;
        }

      } catch (error) {
        console.log("User not authenticated:", error);
        setCurrentUser(null);
        setAuthChecked(true);
        
        // Only redirect to Welcome if user is trying to access a protected route
        // AND is not already on a public route AND not already on Welcome page
        const currentPath = location.pathname;
        const welcomePath = createPageUrl("Welcome");
        const isOnPublicPage = isPublicRoute || currentPath === welcomePath || currentPath.startsWith(welcomePath);
        
        if (!isOnPublicPage) {
          setHasNavigated(true);
          navigate(welcomePath, { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndHandleRedirects();
  }, []); // Only run once on mount, not on every location change

  // Separate effect to handle location changes without causing redirects
  useEffect(() => {
    if (authChecked && !isLoading) {
      // Reset navigation flag when user successfully navigates to a new page
      setHasNavigated(false);
    }
  }, [location.pathname, authChecked, isLoading]);

  const handleLogout = async () => {
    // Set logging out state immediately
    setIsLoggingOut(true);
    setCurrentUser(null);
    
    // Clear storage immediately
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }
    
    // Perform logout and redirect
    const welcomeUrl = `${window.location.origin}${createPageUrl("Welcome")}`;
    
    try {
      await User.logout(welcomeUrl);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Force redirect regardless of logout success
      window.location.href = welcomeUrl;
    }
  };

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 sm:w-16 h-12 sm:h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-6 sm:w-8 h-6 sm:h-8 text-white animate-pulse" />
        </div>
      </div>
    );
  }

  // If on Welcome page, render without the main layout (no currentUser needed)
  if (location.pathname === createPageUrl("Welcome")) {
    return (
      <>
        <Toaster 
          position="top-right" 
          richColors 
          toastOptions={{
            style: {
              opacity: 0.95,
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }
          }}
        />
        {children}
      </>
    );
  }

  // If on Onboarding page, render without header/nav but WITH currentUser prop
  if (location.pathname === createPageUrl("Onboarding")) {
    return (
      <>
        <Toaster 
          position="top-right" 
          richColors 
          toastOptions={{
            style: {
              opacity: 0.95,
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }
          }}
        />
        {React.cloneElement(children, { currentUser, authIsLoading: isLoading })}
      </>
    );
  }

  // Public pages that should render without the main layout (About, Contact, Terms, Privacy, Demos)
  const publicPagesWithoutLayout = [
    createPageUrl("About"),
    createPageUrl("Contact"),
    createPageUrl("TermsOfService"),
    createPageUrl("PrivacyPolicy"),
    createPageUrl("Demos"),
    createPageUrl("AboutUs"),
    createPageUrl("FeatureRequest"),
    createPageUrl("Testimonials")
  ];

  if (publicPagesWithoutLayout.some(route => location.pathname.startsWith(route))) {
    return (
      <>
        <Toaster 
          position="top-right" 
          richColors 
          toastOptions={{
            style: {
              opacity: 0.95,
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }
          }}
        />
        {children}
      </>
    );
  }

  const navigationItems = [
      { name: "Discover", path: createPageUrl("Discover"), icon: Compass },
    { name: "Feed", path: createPageUrl("Feed"), icon: LayoutGrid },
      ...(currentUser ? [
      { name: "My Projects", path: createPageUrl("MyProjects"), icon: Lightbulb },
      { name: "Chat", path: createPageUrl("Chat"), icon: MessageCircle },
    ] : []),
  ];

  const mobileNavItems = [
      { name: "Discover", path: createPageUrl("Discover"), icon: Compass },
    { name: "Feed", path: createPageUrl("Feed"), icon: LayoutGrid },
      ...(currentUser ? [
      { name: "Create", path: createPageUrl("CreateProject"), icon: Plus, isCreateButton: true },
      { name: "My Projects", path: createPageUrl("MyProjects"), icon: Lightbulb },
      { name: "Chat", path: createPageUrl("Chat"), icon: MessageCircle },
    ] : []),
  ];

  // Show loading overlay when logging out
  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Signing out...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Toaster 
        position="top-right" 
        richColors 
        toastOptions={{
          style: {
            opacity: 0.95,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }
        }}
      />
      <style>{`
        :root {
          --cu-primary: #4338CA;
          --cu-primary-dark: #3730A3;
          --cu-primary-light: #6366F1;
          
          --cu-padding-sm: 0.75rem;
          --cu-padding-md: 1rem;
          --cu-padding-lg: 1.5rem;
          --cu-padding-xl: 2rem;
          
          --cu-margin-sm: 1rem;
          --cu-margin-md: 1.5rem;
          --cu-margin-lg: 2rem;
          
          --cu-text-xs: 0.75rem;
          --cu-text-sm: 0.875rem;
          --cu-text-base: 1rem;
          --cu-text-lg: 1.125rem;
          --cu-text-xl: 1.25rem;
        }
        
        /* Hide Base44 branding badge */
        #base44-badge,
        .base44-badge,
        [class*="base44-badge"],
        [id*="base44-badge"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Hide any potential Base44 powered-by footer */
        footer[class*="base44"],
        footer[id*="base44"],
        div[class*="powered-by"],
        div[id*="powered-by"],
        a[href*="base44.app"]:not([href*="api"]) {
          display: none !important;
          visibility: hidden !important;
        }
        
        /* Word break utilities for long URLs and text */
        .break-words {
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        
        .overflow-wrap-anywhere {
          overflow-wrap: anywhere;
        }
        
        .cu-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding-left: var(--cu-padding-sm);
          padding-right: var(--cu-padding-sm);
        }
        
        @media (min-width: 640px) {
          .cu-container {
            padding-left: var(--cu-padding-md);
            padding-right: var(--cu-padding-md);
          }
        }
        
        @media (min-width: 768px) {
          .cu-container {
            padding-left: var(--cu-padding-lg);
            padding-right: var(--cu-padding-lg);
          }
        }
        
        @media (min-width: 1024px) {
          .cu-container {
            padding-left: var(--cu-padding-xl);
            padding-right: var(--cu-padding-xl);
          }
        }
        
        .cu-page {
          padding-top: var(--cu-margin-sm);
          padding-bottom: var(--cu-margin-sm);
        }
        
        @media (min-width: 640px) {
          .cu-page {
            padding-top: var(--cu-margin-md);
            padding-bottom: var(--cu-margin-md);
          }
        }
        
        @media (min-width: 768px) {
          .cu-page {
            padding-top: var(--cu-margin-lg);
            padding-bottom: var(--cu-margin-lg);
          }
        }
        
        .cu-content-grid {
          display: flex;
          flex-direction: column;
          gap: var(--cu-margin-sm);
        }
        
        @media (min-width: 640px) {
          .cu-content-grid {
            gap: var(--cu-margin-md);
          }
        }
        
        @media (min-width: 768px) {
          .cu-content-grid {
            gap: var(--cu-margin-lg);
          }
        }
        
        .cu-gradient {
          background: linear-gradient(135deg, var(--cu-primary) 0%, var(--cu-primary-light) 100%);
        }
        
        .cu-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease-in-out;
        }
        
        @media (min-width: 481px) {
          .cu-card {
            border-radius: 12px;
          }
        }
        
        .cu-card:hover {
          box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }
        
        @media (min-width: 769px) {
          .cu-card:hover {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
        }
        
        .cu-button {
          background: var(--cu-primary);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 500;
          font-size: var(--cu-text-sm);
          transition: all 0.2s ease-in-out;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }
        
        @media (min-width: 481px) {
          .cu-button {
            border-radius: 8px;
            padding: 10px 20px;
            font-size: var(--cu-text-base);
          }
        }
        
        @media (min-width: 769px) {
          .cu-button {
            padding: 12px 24px;
            font-size: var(--cu-text-base);
          }
        }
        
        .cu-button:hover {
          background: var(--cu-primary-dark);
          transform: translateY(-1px);
        }
        
        .cu-button-sm {
          padding: 6px 12px;
          font-size: var(--cu-text-xs);
        }
        
        @media (min-width: 481px) {
          .cu-button-sm {
            padding: 8px 16px;
            font-size: var(--cu-text-sm);
          }
        }
        
        .cu-button-lg {
          padding: 12px 24px;
          font-size: var(--cu-text-base);
        }
        
        @media (min-width: 481px) {
          .cu-button-lg {
            padding: 14px 28px;
            font-size: var(--cu-text-lg);
          }
        }
        
        .cu-button-mobile-full {
          width: 100%;
        }
        
        @media (min-width: 640px) {
          .cu-button-mobile-full {
            width: auto;
          }
        }
        
        .cu-text-responsive-xs {
          font-size: var(--cu-text-xs);
        }
        
        @media (min-width: 640px) {
          .cu-text-responsive-xs {
            font-size: var(--cu-text-sm);
          }
        }
        
        .cu-text-responsive-sm {
          font-size: var(--cu-text-sm);
        }
        
        @media (min-width: 640px) {
          .cu-text-responsive-sm {
            font-size: var(--cu-text-base);
          }
        }
        
        .cu-text-responsive-base {
          font-size: var(--cu-text-base);
        }
        
        @media (min-width: 640px) {
          .cu-text-responsive-base {
            font-size: var(--cu-text-lg);
          }
        }
        
        .cu-text-responsive-lg {
          font-size: 1.125rem;
        }
        
        @media (min-width: 640px) {
          .cu-text-responsive-lg {
            font-size: 1.25rem;
          }
        }
        
        @media (min-width: 768px) {
          .cu-text-responsive-lg {
            font-size: 1.5rem;
          }
        }

        .cu-text-responsive-xl { 
          font-size: 1.25rem;
        }
        @media (min-width: 640px) {
          .cu-text-responsive-xl {
            font-size: 1.5rem;
          }
        }
        @media (min-width: 768px) {
          .cu-text-responsive-xl {
            font-size: 1.75rem;
          }
        }
        @media (min-width: 1024px) {
          .cu-text-responsive-xl {
            font-size: 2rem;
          }
        }
        
        .cu-icon-sm {
          width: 1rem;
          height: 1rem;
        }
        
        @media (min-width: 640px) {
          .cu-icon-sm {
            width: 1.25rem;
            height: 1.25rem;
          }
        }
        
        .cu-icon-base {
          width: 1.25rem;
          height: 1.25rem;
        }
        
        @media (min-width: 640px) {
          .cu-icon-base {
            width: 1.5rem;
            height: 1.5rem;
          }
        }
        
        .cu-grid-responsive-1-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--cu-margin-sm);
        }
        
        @media (min-width: 640px) {
          .cu-grid-responsive-1-2 {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--cu-margin-md);
          }
        }
        
        .cu-grid-responsive-1-2-3 {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--cu-margin-sm);
        }
        
        @media (min-width: 640px) {
          .cu-grid-responsive-1-2-3 {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--cu-margin-md);
          }
        }
        
        @media (min-width: 768px) {
          .cu-grid-responsive-1-2-3 {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--cu-margin-lg);
          }
        }
        
        @media (min-width: 1024px) {
          .cu-grid-responsive-1-2-3 {
            grid-template-columns: repeat(3, 1fr);
            gap: var(--cu-margin-lg);
          }
        }
        
        .cu-space-responsive-y {
          margin-top: var(--cu-margin-sm);
          margin-bottom: var(--cu-margin-sm);
        }
        
        @media (min-width: 640px) {
          .cu-space-responsive-y {
            margin-top: var(--cu-margin-md);
            margin-bottom: var(--cu-margin-md);
          }
        }
        
        @media (min-width: 768px) {
          .cu-space-responsive-y {
            margin-top: var(--cu-margin-lg);
            margin-bottom: var(--cu-margin-lg);
          }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .highlight-post {
          animation: highlight-animation 3s ease-out;
          border-radius: 8px;
        }
        
        @media (min-width: 481px) {
          .highlight-post {
            border-radius: 12px;
          }
        }

        @keyframes highlight-animation {
          0% { background-color: rgba(167, 139, 250, 0); }
          25% { background-color: rgba(167, 139, 250, 0.2); }
          100% { background-color: rgba(167, 139, 250, 0); }
        }

        [data-radix-popper-content-wrapper] {
          z-index: 60 !important;
        }
        
        .dialog-overlay {
          z-index: 60 !important;
        }
        
        .dialog-content {
          z-index: 61 !important;
        }

        .responsive-title {
          font-size: 1.5rem;
          line-height: 1.4;
        }
        
        @media (min-width: 481px) {
          .responsive-title {
            font-size: 1.75rem;
            line-height: 1.3;
          }
        }
        
        @media (min-width: 769px) {
          .responsive-title {
            font-size: 2rem;
            line-height: 1.2;
          }
        }
        
        @media (min-width: 1025px) {
          .responsive-title {
            font-size: 2.25rem;
            line-height: 1.1;
          }
        }

        .cu-form-group {
          margin-bottom: var(--cu-margin-sm);
        }
        
        @media (min-width: 640px) {
          .cu-form-group {
            margin-bottom: var(--cu-margin-md);
          }
        }
        
        .cu-input {
          width: 100%;
          padding: 0.75rem;
          font-size: var(--cu-text-sm);
          border-radius: 6px;
        }
        
        @media (min-width: 640px) {
          .cu-input {
            font-size: var(--cu-text-base);
            padding: 0.875rem;
            border-radius: 8px;
          }
        }
        
        .cu-badge {
          padding: 0.25rem 0.5rem;
          font-size: var(--cu-text-xs);
          border-radius: 4px;
        }
        
        @media (min-width: 640px) {
          .cu-badge {
            padding: 0.375rem 0.75rem;
            font-size: var(--cu-text-sm);
            border-radius: 6px;
          }
        }
        
        /* Extra small breakpoint for very small phones */
        @media (min-width: 375px) {
          .hidden.xs\\:inline {
            display: inline;
          }
        }
        
        /* iPad/Tablet safe area support */
        .safe-area-inset-top {
          padding-top: env(safe-area-inset-top, 0px);
        }
        
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        
        /* Ensure touch targets are large enough on tablets */
        @media (min-width: 768px) and (max-width: 1023px) {
          .cu-icon-sm {
            width: 1.375rem;
            height: 1.375rem;
          }
          
          .cu-text-responsive-xs {
            font-size: 0.8125rem;
          }
        }
        
        /* Fix for iPad viewport height issues */
        @supports (-webkit-touch-callout: none) {
          .min-h-screen {
            min-height: -webkit-fill-available;
          }
        }
      `}</style>

      {/* Mobile/Tablet Header (visible on screens < 1024px) */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 safe-area-inset-top">
        <div className="flex items-center justify-between px-3 md:px-6 h-14 md:h-16 gap-3">
          <Link 
            to={createPageUrl("Feed")}
            className="flex-shrink-0"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
              alt="Collab Unity"
              className="w-7 h-7 rounded-lg object-contain"
            />
          </Link>

          <GlobalSearchBar 
            className="flex-1" 
            placeholder="Search..."
          />

          <div className="flex items-center space-x-2 flex-shrink-0">
            {currentUser && <NotificationBell />}
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <OptimizedAvatar
                      src={currentUser?.profile_image}
                      alt={currentUser?.full_name || 'User'}
                      fallback={currentUser?.full_name?.[0] || 'U'}
                      size="xs"
                      className="w-7 h-7 cursor-pointer"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl(`UserProfile?username=${currentUser.username}`)} className="flex items-center cursor-pointer">
                      <Eye className="cu-icon-sm mr-2" /> View Profile
                    </Link>
                  </DropdownMenuItem>
                  {currentUser?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("AdminVerificationPanel")} className="flex items-center cursor-pointer">
                          <ShieldCheck className="cu-icon-sm mr-2" /> Ad Review Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("SupportCU")} className="flex items-center cursor-pointer">
                      <Heart className="cu-icon-sm mr-2" /> Support CU
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("ReportBug")} className="flex items-center cursor-pointer">
                      <Bug className="cu-icon-sm mr-2" /> Report Bug
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700">
                    <LogOut className="cu-icon-sm mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>

      {/* Desktop Navigation (visible on screens >= 1024px) */}
      <nav className="hidden lg:block fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="cu-container">
          <div className="flex justify-between items-center h-16 gap-6">
            <Link 
              to={createPageUrl("Feed")}
              className="flex-shrink-0"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
                alt="Collab Unity"
                className="w-8 h-8 rounded-lg object-contain"
              />
            </Link>

            <GlobalSearchBar 
              className="flex-1 max-w-xs" 
              placeholder="Search..."
            />

            <div className="flex items-center justify-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors cu-text-responsive-sm ${
                      isActive 
                        ? 'text-purple-600' 
                        : 'text-gray-600 hover:text-purple-600'
                    }`}
                  >
                    <Icon className="cu-icon-sm" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            
            <div className="flex items-center space-x-4 flex-shrink-0">
              {currentUser ? (
                <>
                  <Link to={createPageUrl("CreateProject")}>
                    <Button className="cu-button cu-text-responsive-sm">
                      <Plus className="cu-icon-sm mr-2" />
                      Create Project
                    </Button>
                  </Link>

                  <NotificationBell />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <OptimizedAvatar
                          src={currentUser?.profile_image}
                          alt={currentUser?.full_name || 'User'}
                          fallback={currentUser?.full_name?.[0] || currentUser?.email?.[0] || 'U'}
                          size="sm"
                          className="w-9 h-9 cursor-pointer"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl(`UserProfile?username=${currentUser.username}`)} className="flex items-center cursor-pointer">
                          <Eye className="cu-icon-sm mr-2" /> View Profile
                        </Link>
                      </DropdownMenuItem>
                      {currentUser?.role === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl("AdminVerificationPanel")} className="flex items-center cursor-pointer">
                              <ShieldCheck className="cu-icon-sm mr-2" /> Ad Review Panel
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("SupportCU")} className="flex items-center cursor-pointer">
                          <Heart className="cu-icon-sm mr-2" /> Support CU
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("ReportBug")} className="flex items-center cursor-pointer">
                          <Bug className="cu-icon-sm mr-2" /> Report Bug
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700">
                        <LogOut className="cu-icon-sm mr-2" /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  onClick={() => User.login()} 
                  className="cu-button cu-text-responsive-sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-14 md:pt-16 pb-20 md:pb-24 lg:pt-16 lg:pb-8">
        {React.cloneElement(children, { currentUser, authIsLoading: isLoading })}
      </main>

      {/* Mobile/Tablet Bottom Navigation (visible on screens < 1024px) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50 safe-area-inset-bottom">
        <div className="relative">
          <div className={`grid h-16 md:h-20 ${currentUser ? 'grid-cols-5' : 'grid-cols-3'}`}>
            {mobileNavItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              // Special styling for Create button (middle button)
              if (item.isCreateButton) {
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex flex-col items-center justify-center relative"
                  >
                    <div className="absolute -top-6 w-14 h-14 cu-gradient rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110">
                      <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="cu-text-responsive-xs mt-5 font-medium text-purple-600">
                      {item.name}
                    </span>
                  </Link>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col items-center justify-center transition-colors ${
                    isActive ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'
                  }`}
                >
                  <Icon className="cu-icon-sm" />
                  <span className="cu-text-responsive-xs mt-1 font-medium">
                    {item.name === "My Projects" ? "Projects" : item.name}
                  </span>
                </Link>
              );
            })}
            
            {!currentUser && (
              <button
                onClick={() => User.login()}
                className="flex flex-col items-center justify-center transition-colors text-gray-500 hover:text-purple-600"
              >
                <UserIcon className="cu-icon-sm" />
                <span className="cu-text-responsive-xs mt-1 font-medium">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}