import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

// Color palette for different collaborators
const PRESENCE_COLORS = [
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export default function CollaboratorPresence({ projectId, currentUser }) {
  const [activeUsers, setActiveUsers] = useState([]);
  const [userColor, setUserColor] = useState(null);
  const presenceIdRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const fetchIntervalRef = useRef(null);
  const lastCursorUpdate = useRef(0);
  const isMountedRef = useRef(true);

  // Assign color to current user
  useEffect(() => {
    if (currentUser) {
      const colorIndex = currentUser.email.charCodeAt(0) % PRESENCE_COLORS.length;
      setUserColor(PRESENCE_COLORS[colorIndex]);
    }
  }, [currentUser]);

  // Track cursor position
  const updateCursorPosition = useCallback((e) => {
    if (!projectId || !currentUser || !userColor) return;

    const now = Date.now();
    // Throttle updates to once every 500ms
    if (now - lastCursorUpdate.current < 500) return;
    lastCursorUpdate.current = now;

    const x = (e.clientX / window.innerWidth) * 100;
    const y = ((e.clientY + window.scrollY) / document.documentElement.scrollHeight) * 100;

    // Update presence in database (will be picked up by polling)
    if (presenceIdRef.current) {
      base44.entities.ProjectPresence.update(presenceIdRef.current, {
        cursor_x: x,
        cursor_y: y,
        last_active: new Date().toISOString()
      }).catch(err => console.warn('Failed to update cursor:', err));
    }
  }, [projectId, currentUser, userColor]);

  // Create or update presence record
  const initializePresence = useCallback(async () => {
    if (!projectId || !currentUser || !userColor) return;

    try {
      // Check if presence already exists
      const existingPresence = await base44.entities.ProjectPresence.filter({
        project_id: projectId,
        user_email: currentUser.email
      });

      if (existingPresence && existingPresence.length > 0) {
        presenceIdRef.current = existingPresence[0].id;
        // Update existing presence
        await base44.entities.ProjectPresence.update(presenceIdRef.current, {
          user_name: currentUser.full_name || currentUser.email,
          user_avatar: currentUser.profile_image,
          last_active: new Date().toISOString(),
          color: userColor
        });
      } else {
        // Create new presence
        const newPresence = await base44.entities.ProjectPresence.create({
          project_id: projectId,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
          user_avatar: currentUser.profile_image,
          cursor_x: 50,
          cursor_y: 50,
          viewing_section: 'overview',
          last_active: new Date().toISOString(),
          color: userColor
        });
        presenceIdRef.current = newPresence.id;
      }
    } catch (error) {
      console.error('Failed to initialize presence:', error);
    }
  }, [projectId, currentUser, userColor]);

  // Heartbeat to keep presence alive
  const sendHeartbeat = useCallback(async () => {
    if (!presenceIdRef.current || !isMountedRef.current) return;

    try {
      await base44.entities.ProjectPresence.update(presenceIdRef.current, {
        last_active: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to send heartbeat:', error);
    }
  }, []);

  // Fetch active users
  const fetchActiveUsers = useCallback(async () => {
    if (!projectId || !currentUser || !isMountedRef.current) return;

    try {
      // Get all presence records for this project
      const allPresence = await base44.entities.ProjectPresence.filter({
        project_id: projectId
      });

      // Filter out stale presences (older than 10 seconds) and current user
      const now = new Date();
      const activePresences = allPresence.filter(p => {
        if (p.user_email === currentUser.email) return false;
        const lastActive = new Date(p.last_active);
        const secondsSinceActive = (now - lastActive) / 1000;
        return secondsSinceActive < 10;
      });

      if (isMountedRef.current) {
        setActiveUsers(activePresences);
      }
    } catch (error) {
      console.warn('Failed to fetch active users:', error);
    }
  }, [projectId, currentUser]);

  // Initialize presence on mount
  useEffect(() => {
    if (currentUser && projectId && userColor) {
      initializePresence();
    }
  }, [currentUser, projectId, userColor, initializePresence]);

  // Set up cursor tracking
  useEffect(() => {
    if (!currentUser || !projectId) return;

    window.addEventListener('mousemove', updateCursorPosition);
    return () => window.removeEventListener('mousemove', updateCursorPosition);
  }, [updateCursorPosition, currentUser, projectId]);

  // Set up heartbeat
  useEffect(() => {
    if (!currentUser || !projectId) return;

    updateIntervalRef.current = setInterval(sendHeartbeat, 5000); // Every 5 seconds

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [sendHeartbeat, currentUser, projectId]);

  // Set up polling for other users
  useEffect(() => {
    if (!currentUser || !projectId) return;

    fetchActiveUsers(); // Initial fetch
    fetchIntervalRef.current = setInterval(fetchActiveUsers, 2000); // Poll every 2 seconds

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [fetchActiveUsers, currentUser, projectId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Delete presence record on unmount
      if (presenceIdRef.current) {
        base44.entities.ProjectPresence.delete(presenceIdRef.current)
          .catch(err => console.warn('Failed to cleanup presence:', err));
      }
    };
  }, []);

  // Render cursor for each active user
  const renderCursor = (user) => {
    const x = user.cursor_x || 50;
    const y = user.cursor_y || 50;

    return (
      <div
        key={user.id}
        className="fixed pointer-events-none z-50 transition-all duration-200"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Cursor pointer */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        >
          <path
            d="M5.65376 12.3673L8.30727 19.9878C8.81949 21.4987 10.8324 21.5487 11.4116 20.0641L15.6864 9.01767C16.2292 7.61318 15.0784 6.12747 13.5924 6.34546L4.41115 7.61698C2.79053 7.85593 2.34694 9.98841 3.62786 10.778L5.65376 12.3673Z"
            fill={user.color || '#8B5CF6'}
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
        
        {/* User name label */}
        <div
          className="absolute top-6 left-6 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
          style={{
            backgroundColor: user.color || '#8B5CF6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          {user.user_name}
        </div>
      </div>
    );
  };

  // Don't render anything if no active users
  if (activeUsers.length === 0) return null;

  return (
    <>
      {/* Render all active user cursors */}
      {activeUsers.map(renderCursor)}

      {/* Active users indicator in top right */}
      <div className="fixed top-20 right-4 z-40 bg-white rounded-lg shadow-lg border p-3 max-w-xs">
        <div className="flex items-center space-x-2 mb-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            {activeUsers.length} {activeUsers.length === 1 ? 'Collaborator' : 'Collaborators'} Online
          </span>
        </div>
        
        <div className="space-y-1.5">
          {activeUsers.slice(0, 5).map(user => (
            <div key={user.id} className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: user.color || '#8B5CF6' }}
              />
              <Avatar className="w-6 h-6">
                <AvatarImage src={user.user_avatar} />
                <AvatarFallback className="text-xs">
                  {user.user_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-700 truncate">
                {user.user_name}
              </span>
            </div>
          ))}
          
          {activeUsers.length > 5 && (
            <p className="text-xs text-gray-500 mt-1">
              +{activeUsers.length - 5} more
            </p>
          )}
        </div>
      </div>
    </>
  );
}