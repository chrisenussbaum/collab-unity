import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import OptimizedAvatar from "../OptimizedAvatar";

// Color palette for different collaborators
const PRESENCE_COLORS = [
  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6', '#F97316',
];

// Figma-style overlapping avatar stack of project collaborators (owner + accepted
// collaborators) with a live "online" indicator, PLUS live cursor rendering of
// remote collaborators moving around the canvas. This is the single presence
// authority for the canvas workspace — it owns the presence record, heartbeat,
// cursor tracking, and polling.
export default function CanvasPresenceStack({ project, currentUser, projectUsers, projectOwnerProfile }) {
  const [activeEmails, setActiveEmails] = useState(() => new Set());
  const [activePresences, setActivePresences] = useState([]);
  const presenceIdRef = useRef(null);
  const isMounted = useRef(true);
  const lastCursorUpdate = useRef(0);

  const userColor = useMemo(() => {
    if (!currentUser?.email) return PRESENCE_COLORS[0];
    return PRESENCE_COLORS[currentUser.email.charCodeAt(0) % PRESENCE_COLORS.length];
  }, [currentUser?.email]);

  const members = useMemo(() => {
    const map = new Map();
    const add = (u) => {
      if (!u || !u.email) return;
      map.set(u.email, { email: u.email, full_name: u.full_name, profile_image: u.profile_image });
    };
    (projectUsers || []).forEach(add);
    if (projectOwnerProfile) add(projectOwnerProfile);
    if (currentUser?.email && !map.has(currentUser.email)) add(currentUser);
    return Array.from(map.values());
  }, [projectUsers, projectOwnerProfile, currentUser]);

  // Maintain this user's presence + heartbeat, and poll for who's online.
  useEffect(() => {
    if (!project?.id || !currentUser?.email) return;
    let hb, poll;
    const init = async () => {
      try {
        const existing = await base44.entities.ProjectPresence.filter({ project_id: project.id, user_email: currentUser.email });
        if (existing && existing.length > 0) {
          presenceIdRef.current = existing[0].id;
          await base44.entities.ProjectPresence.update(presenceIdRef.current, {
            user_name: currentUser.full_name || currentUser.email,
            user_avatar: currentUser.profile_image,
            color: userColor,
            last_active: new Date().toISOString(),
          });
        } else {
          const p = await base44.entities.ProjectPresence.create({
            project_id: project.id,
            user_email: currentUser.email,
            user_name: currentUser.full_name || currentUser.email,
            user_avatar: currentUser.profile_image,
            color: userColor,
            cursor_x: 50,
            cursor_y: 50,
            last_active: new Date().toISOString(),
          });
          presenceIdRef.current = p.id;
        }
      } catch {}
    };
    init();

    hb = setInterval(() => {
      if (presenceIdRef.current) {
        base44.entities.ProjectPresence.update(presenceIdRef.current, { last_active: new Date().toISOString() }).catch(() => {});
      }
    }, 30000);

    const fetchActive = async () => {
      try {
        const all = await base44.entities.ProjectPresence.filter({ project_id: project.id });
        const now = new Date();
        const set = new Set();
        const active = [];
        (all || []).forEach((p) => {
          if (!p.last_active) return;
          if ((now - new Date(p.last_active)) / 1000 < 60) {
            set.add(p.user_email);
            if (p.user_email !== currentUser.email) active.push(p);
          }
        });
        if (isMounted.current) {
          setActiveEmails(set);
          setActivePresences(active);
        }
      } catch {}
    };
    fetchActive();
    poll = setInterval(fetchActive, 15000);

    return () => {
      isMounted.current = false;
      clearInterval(hb);
      clearInterval(poll);
      if (presenceIdRef.current) {
        base44.entities.ProjectPresence.delete(presenceIdRef.current).catch(() => {});
      }
    };
  }, [project?.id, currentUser?.email, userColor]);

  // Track local cursor position (throttled) so remote collaborators can see it move.
  useEffect(() => {
    if (!project?.id || !currentUser?.email) return;
    const onMove = (e) => {
      if (!presenceIdRef.current) return;
      const now = Date.now();
      if (now - lastCursorUpdate.current < 500) return;
      lastCursorUpdate.current = now;
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      base44.entities.ProjectPresence.update(presenceIdRef.current, {
        cursor_x: x,
        cursor_y: y,
        last_active: new Date().toISOString(),
      }).catch(() => {});
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [project?.id, currentUser?.email]);

  const isOnline = (email) => activeEmails.has(email);
  const visible = members.slice(0, 5);
  const extra = members.length - visible.length;

  if (members.length === 0) return null;

  const renderCursor = (user) => {
    const x = user.cursor_x ?? 50;
    const y = user.cursor_y ?? 50;
    const color = user.color || '#8B5CF6';
    return (
      <div
        key={user.id}
        className="fixed pointer-events-none z-[200] transition-all duration-200"
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        >
          <path
            d="M5.65376 12.3673L8.30727 19.9878C8.81949 21.4987 10.8324 21.5487 11.4116 20.0641L15.6864 9.01767C16.2292 7.61318 15.0784 6.12747 13.5924 6.34546L4.41115 7.61698C2.79053 7.85593 2.34694 9.98841 3.62786 10.778L5.65376 12.3673Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
        <div
          className="absolute top-5 left-5 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
          style={{ backgroundColor: color, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        >
          {user.user_name}
        </div>
      </div>
    );
  };

  return (
    <>
      {activePresences.map(renderCursor)}
      <div className="hidden xs:flex items-center -space-x-2">
        {visible.map((m) => (
          <div
            key={m.email}
            className="relative rounded-full ring-2 ring-white"
            title={`${m.full_name || m.email}${isOnline(m.email) ? " · online" : ""}`}
          >
            <OptimizedAvatar
              src={m.profile_image}
              alt={m.full_name || m.email}
              fallback={(m.full_name || m.email)[0] || "U"}
              size="xs"
              className="w-7 h-7"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                isOnline(m.email) ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          </div>
        ))}
        {extra > 0 && (
          <div className="relative w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium flex items-center justify-center ring-2 ring-white">
            +{extra}
          </div>
        )}
      </div>
    </>
  );
}