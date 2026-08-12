import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import OptimizedAvatar from "../OptimizedAvatar";

// Figma-style overlapping avatar stack of project collaborators (owner + accepted
// collaborators), with a live "online" indicator backed by ProjectPresence.
export default function CanvasPresenceStack({ project, currentUser, projectUsers, projectOwnerProfile }) {
  const [activeEmails, setActiveEmails] = useState(() => new Set());
  const presenceIdRef = useRef(null);
  const isMounted = useRef(true);

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
            last_active: new Date().toISOString(),
          });
        } else {
          const p = await base44.entities.ProjectPresence.create({
            project_id: project.id,
            user_email: currentUser.email,
            user_name: currentUser.full_name || currentUser.email,
            user_avatar: currentUser.profile_image,
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
        (all || []).forEach((p) => {
          if (!p.last_active) return;
          if ((now - new Date(p.last_active)) / 1000 < 60) set.add(p.user_email);
        });
        if (isMounted.current) setActiveEmails(set);
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
  }, [project?.id, currentUser?.email]);

  const isOnline = (email) => activeEmails.has(email);
  const visible = members.slice(0, 5);
  const extra = members.length - visible.length;

  if (members.length === 0) return null;

  return (
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
  );
}