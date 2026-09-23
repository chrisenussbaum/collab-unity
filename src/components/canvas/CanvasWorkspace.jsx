import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Share2, ChevronLeft, ZoomIn, ZoomOut, Maximize, Minimize2, Layers, MessageCircle, UserPlus } from "lucide-react";
import { buildFrameDefs } from "./canvasFrameRegistry";
import CanvasFrame from "./CanvasFrame";
import ProjectChatPanel from "./ProjectChatPanel";
import CanvasLayers from "./CanvasLayers";
import ReadOnlyProjectBanner from "./ReadOnlyProjectBanner";
import CanvasToolbar from "./CanvasToolbar";
import CanvasPresenceStack from "./CanvasPresenceStack";
import ProjectSettingsDialog from "./ProjectSettingsDialog";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Calm default: Tasks + Assistant side by side, Assets below Tasks.
// Every other frame starts hidden, one click away in the Workspaces panel.
const DEFAULT_OPEN = [
  { id: "tasks", x: 0, y: 0 },
  { id: "assistant", x: 640, y: 0 },
  { id: "assets", x: 0, y: 620 },
];

function defaultLayout(defs) {
  const layout = {};
  let hiddenX = 1300;
  defs.forEach((d, i) => {
    const p = DEFAULT_OPEN.find((o) => o.id === d.id);
    layout[d.id] = {
      x: p ? p.x : hiddenX,
      y: p ? p.y : 0,
      w: d.w,
      h: d.id === "assistant" ? 800 : d.h,
      collapsed: false,
      hidden: !p,
      z: i,
    };
    if (!p) hiddenX += d.w + 48;
  });
  return layout;
}

export default function CanvasWorkspace({
  project, currentUser, projectUsers, projectOwnerProfile,
  isOwner, isCollaborator, onProjectUpdate, onUpdateSocialLinks, onShare, onBack, initialApplicationId,
  readOnly = false, canApply = false, onApply,
}) {
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [assets, setAssets] = useState([]);
  const [layout, setLayout] = useState(null);
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [selectedId, setSelectedId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [fullscreenId, setFullscreenId] = useState(null);
  const [layersOpen, setLayersOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : true));
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);

  useEffect(() => {
    if (!fullscreenId) return;
    const onKey = (e) => { if (e.key === "Escape") setFullscreenId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreenId]);

  const viewportRef = useRef(null);
  const saveTimer = useRef(null);
  const stateRef = useRef({ zoom, pan });
  const fullscreenRef = useRef(null);
  const projectIdRef = useRef(null);
  const didInit = useRef(false);
  const autoFitDone = useRef(false);
  const cancelFlingRef = useRef(null);

  useEffect(() => { stateRef.current = { zoom, pan }; }, [zoom, pan]);
  useEffect(() => { fullscreenRef.current = fullscreenId; }, [fullscreenId]);

  const refreshTasks = useCallback(async () => {
    if (!project?.id) return;
    try { const r = await base44.entities.Task.filter({ project_id: project.id }); setTasks(Array.isArray(r) ? r : []); } catch {}
  }, [project?.id]);
  const refreshMilestones = useCallback(async () => {
    if (!project?.id) return;
    try { const r = await base44.entities.ProjectMilestone.filter({ project_id: project.id }); setMilestones(Array.isArray(r) ? r : []); } catch {}
  }, [project?.id]);
  const refreshAssets = useCallback(async () => {
    if (!project?.id) return;
    try { const r = await base44.entities.AssetVersion.filter({ project_id: project.id }); setAssets(Array.isArray(r) ? r : []); } catch {}
  }, [project?.id]);

  useEffect(() => {
    refreshTasks(); refreshMilestones(); refreshAssets();
  }, [project?.id, refreshTasks, refreshMilestones, refreshAssets]);

  // Refresh the canvas-wide asset list whenever an asset is created elsewhere
  // (e.g. the AI chat saving a link or uploaded file) so frames and the chat's
  // project context stay in sync.
  useEffect(() => {
    if (!project?.id) return;
    const handler = (e) => {
      if (!e.detail?.projectId || e.detail.projectId === project.id) refreshAssets();
    };
    window.addEventListener("assetsUpdated", handler);
    return () => window.removeEventListener("assetsUpdated", handler);
  }, [project?.id, refreshAssets]);

  // Owner-only: pending applications count for the Workspaces sidebar badge
  useEffect(() => {
    if (!project?.id || !isOwner) { setPendingApplicationsCount(0); return; }
    let cancelled = false;
    const fetchPending = async () => {
      try {
        const apps = await base44.entities.ProjectApplication.filter({ project_id: project.id, status: "pending" });
        if (!cancelled) setPendingApplicationsCount(Array.isArray(apps) ? apps.length : 0);
      } catch (e) { /* ignore */ }
    };
    fetchPending();
    return () => { cancelled = true; };
  }, [project?.id, isOwner, showSettings]);

  // Deep-link from an application notification: auto-open Project Settings
  useEffect(() => {
    if (initialApplicationId && isOwner) setShowSettings(true);
  }, [initialApplicationId, isOwner]);

  const navigateToFrame = useCallback((target) => {
    const map = { tasks: "tasks", milestones: "milestones", assets: "assets", notes: "notes", highlights: "highlights", assistant: "assistant" };
    setSelectedId(map[target] || target);
  }, []);

  const defs = useMemo(() => buildFrameDefs({
    project, currentUser, projectUsers, projectOwnerProfile,
    isOwner, isCollaborator, onProjectUpdate, onUpdateSocialLinks,
    refreshTasks, refreshMilestones, navigateToFrame,
    tasks, milestones, assets,
  }), [project, currentUser, projectUsers, projectOwnerProfile, isOwner, isCollaborator, onProjectUpdate, onUpdateSocialLinks, refreshTasks, refreshMilestones, navigateToFrame, tasks, milestones, assets]);

  // Initialize layout once per project
  useEffect(() => {
    if (projectIdRef.current !== project?.id) {
      projectIdRef.current = project?.id;
      didInit.current = false;
      autoFitDone.current = false;
    }
    if (didInit.current || !defs.length) return;
    didInit.current = true;
    const saved = project?.canvas_layout;
    // A saved layout from the old 11-frame canvas is stale — reset to the calm
    // default rather than carrying over frames that no longer exist.
    const savedIds = saved && typeof saved === "object" ? Object.keys(saved) : [];
    const hasStaleIds = savedIds.some((id) => !defs.some((d) => d.id === id));
    if (savedIds.length > 0 && !hasStaleIds) {
      const merged = {};
      // Place any frames new since the layout was last saved to the right of
      // existing content so they don't overlap on first load.
      let maxRight = 0;
      defs.forEach((d) => {
        if (saved[d.id]) maxRight = Math.max(maxRight, (saved[d.id].x || 0) + (saved[d.id].w || d.w));
      });
      defs.forEach((d) => {
        const dl = defaultLayout([d])[d.id];
        if (saved[d.id]) {
          merged[d.id] = { ...dl, ...saved[d.id] };
        } else {
          merged[d.id] = { ...dl, x: maxRight + 40, y: 0 };
          maxRight += (d.w || dl.w) + 40;
        }
      });
      setLayout(merged);
    } else {
      setLayout(defaultLayout(defs));
    }
  }, [defs, project?.id, project?.canvas_layout]);

  const saveLayout = useCallback((newLayout) => {
    if (!project?.id || readOnly) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await base44.entities.Project.update(project.id, { canvas_layout: newLayout }); } catch (e) { console.warn("Failed to save canvas layout", e); }
    }, 800);
  }, [project?.id]);

  const updateFrame = useCallback((id, patch) => {
    setLayout((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      saveLayout(next);
      return next;
    });
  }, [saveLayout]);

  // Wheel: ctrl/cmd (trackpad pinch) = zoom toward cursor, two-finger scroll = pan.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e) => {
      // While a frame is in full-screen mode, let its content scroll natively.
      if (fullscreenRef.current) return;
      // Let trackpad / mouse wheel scroll inside frames natively when the frame
      // content can actually scroll. When the hovered frame (e.g. the assistant
      // while it's loading and its chat can't scroll) has nothing to scroll,
      // pan the canvas instead so the user isn't stuck.
      const overFrame = e.target && typeof e.target.closest === 'function' && e.target.closest('[data-canvas-scroll="true"]');
      if (overFrame && !e.ctrlKey && !e.metaKey) {
        const vert = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        let node = e.target;
        let canScroll = false;
        while (node && node !== el) {
          const style = window.getComputedStyle(node);
          const ov = vert ? style.overflowY : style.overflowX;
          if (ov === 'auto' || ov === 'scroll') {
            const overflow = vert ? node.scrollHeight > node.clientHeight + 1 : node.scrollWidth > node.clientWidth + 1;
            if (overflow) {
              const atBoundary = vert
                ? (e.deltaY > 0 ? node.scrollTop + node.clientHeight >= node.scrollHeight - 1 : node.scrollTop <= 0)
                : (e.deltaX > 0 ? node.scrollLeft + node.clientWidth >= node.scrollWidth - 1 : node.scrollLeft <= 0);
              if (!atBoundary) { canScroll = true; break; }
            }
          }
          node = node.parentElement;
        }
        if (canScroll) return; // native scroll handles the frame
        // otherwise fall through to pan the canvas
      }
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const z = stateRef.current.zoom;
        const factor = Math.exp(-e.deltaY * 0.0015); // smooth, magnitude-aware
        const nz = clamp(z * factor, 0.2, 2);
        const p = stateRef.current.pan;
        setPan({ x: mx - (mx - p.x) * (nz / z), y: my - (my - p.y) * (nz / z) });
        setZoom(nz);
      } else {
        e.preventDefault();
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [layout]);

  // Safari/Mac trackpad pinch fires `gesturechange` (not wheel) — handle it too.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    // Safari fires non-standard `gesture*` events for two-finger pinch on touch
    // devices too, where they conflict with our touch handler and cause the
    // canvas to freeze / components to stop scaling. Only use them on non-touch
    // (trackpad/mouse) devices.
    const isTouchDevice = (navigator.maxTouchPoints || 0) > 0 && window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;
    let gs = null;
    const onStart = (e) => {
      if (fullscreenRef.current) return; // don't pinch-zoom the hidden canvas while full-screen
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      gs = { z: stateRef.current.zoom, pan: { ...stateRef.current.pan }, mx: e.clientX - rect.left, my: e.clientY - rect.top };
    };
    const onChange = (e) => {
      e.preventDefault();
      if (!gs) return;
      const nz = clamp(gs.z * (e.scale || 1), 0.2, 2);
      const p = gs.pan;
      setPan({ x: gs.mx - (gs.mx - p.x) * (nz / gs.z), y: gs.my - (gs.my - p.y) * (nz / gs.z) });
      setZoom(nz);
    };
    const onEnd = (e) => { e.preventDefault(); gs = null; };
    el.addEventListener("gesturestart", onStart, { passive: false });
    el.addEventListener("gesturechange", onChange, { passive: false });
    el.addEventListener("gestureend", onEnd);
    return () => {
      el.removeEventListener("gesturestart", onStart);
      el.removeEventListener("gesturechange", onChange);
      el.removeEventListener("gestureend", onEnd);
    };
  }, [layout]);

  // Touch gestures: two fingers = pinch-zoom AND two-finger pan (simultaneous,
  // in any direction). A single-finger drag pans the canvas from ANYWHERE —
  // background or frames alike — so users aren't stranded when they zoom in and
  // the frames fill the screen; the pan only engages after a short drag distance
  // so taps and clicks inside frames keep working. Swipes that start where a
  // frame's content can genuinely scroll scroll that content instead.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const mid = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
    const findTouch = (touches, id) => { for (let i = 0; i < touches.length; i++) { if (touches[i].identifier === id) return touches[i]; } return null; };
    // px of travel before a single-finger touch is treated as a pan instead of a tap
    const PAN_SLOP = 10;
    // Elements whose touch behavior the canvas must not hijack
    const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, option, label, iframe, video, audio, [role="button"], [role="slider"], [role="switch"], [contenteditable="true"], [data-canvas-interactive]';
    let g = null;

    // ── Momentum (fling) ── a moving pan or frame-content swipe keeps gliding
    // with iOS-style friction after the finger lifts, like Figma. Any new touch
    // grabs control back immediately.
    let fling = null;
    const cancelFling = () => { if (fling) { cancelAnimationFrame(fling.raf); fling = null; } };
    cancelFlingRef.current = cancelFling;
    const pushSample = (t) => {
      const now = performance.now();
      g.samples.push({ t: now, x: t.clientX, y: t.clientY });
      while (g.samples.length > 6 || (g.samples.length > 2 && now - g.samples[0].t > 120)) g.samples.shift();
    };
    const velocity = () => {
      const s = g && g.samples;
      if (!s || s.length < 2) return null;
      const dt = s[s.length - 1].t - s[0].t;
      if (dt <= 0) return null;
      return { x: (s[s.length - 1].x - s[0].x) / dt, y: (s[s.length - 1].y - s[0].y) / dt };
    };
    const startFling = (vx, vy, scrollEl) => {
      cancelFling();
      let last = performance.now();
      const step = (now) => {
        const dt = Math.min(now - last, 32);
        last = now;
        const decay = Math.exp(-dt / 325); // iOS scroll-view time constant
        vx *= decay; vy *= decay;
        if (Math.hypot(vx, vy) < 0.01) { fling = null; return; }
        if (scrollEl) {
          scrollEl.scrollTop -= vy * dt;
          scrollEl.scrollLeft -= vx * dt;
        } else {
          setPan((p) => ({ x: p.x + vx * dt, y: p.y + vy * dt }));
        }
        fling.raf = requestAnimationFrame(step);
      };
      fling = { raf: requestAnimationFrame(step) };
    };

    const beginTwo = (e) => {
      const rect = el.getBoundingClientRect();
      const t0 = e.touches[0], t1 = e.touches[1];
      const m = mid(t0, t1);
      g = {
        mode: "two",
        idA: t0.identifier, idB: t1.identifier,
        startDist: dist(t0, t1) || 1,
        startZoom: stateRef.current.zoom,
        startPan: { ...stateRef.current.pan },
        mx: m.clientX - rect.left,
        my: m.clientY - rect.top,
        startMidClientX: m.clientX,
        startMidClientY: m.clientY,
      };
    };

    const beginPan = (e, alreadyDragging) => {
      const t = e.touches[0];
      g = { mode: "pan", sx: t.clientX, sy: t.clientY, startPan: { ...stateRef.current.pan }, active: !!alreadyDragging, samples: [] };
    };

    // Single-finger swipe that scrolls a frame's content (vertical + horizontal)
    const beginScroll = (e, scroller) => {
      const t = e.touches[0];
      g = { mode: "scroll", el: scroller, sx: t.clientX, sy: t.clientY, top: scroller.scrollTop, left: scroller.scrollLeft, samples: [] };
    };

    // Nearest ancestor of the touched element (inside the canvas) that can
    // actually scroll right now. Returns null when the touched region has
    // nothing to scroll, so the drag pans the canvas instead of feeling frozen.
    const findScroller = (target) => {
      let node = target;
      while (node && node !== el) {
        if (node.nodeType === 1) {
          const style = window.getComputedStyle(node);
          const scrollable = style.overflowY === "auto" || style.overflowY === "scroll" ||
            style.overflowX === "auto" || style.overflowX === "scroll";
          if (scrollable && (node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1)) return node;
        }
        node = node.parentElement;
      }
      return null;
    };

    const onStart = (e) => {
      cancelFling(); // any new touch grabs control from a running fling
      if (fullscreenRef.current) return; // let full-screen content scroll/swipe natively
      if (e.touches.length >= 2) {
        // Keep an existing pinch stable if a stray third finger grazes the screen
        if (g && g.mode === "two" && findTouch(e.touches, g.idA) && findTouch(e.touches, g.idB)) return;
        beginTwo(e);
      } else if (e.touches.length === 1) {
        const t = e.target;
        if (!t || typeof t.closest !== "function") { g = null; return; }
        // Drawing/annotation surfaces own their touches
        if (t.closest('[data-canvas-interactive]')) { g = null; return; }
        const scroller = findScroller(t);
        if (scroller) { beginScroll(e, scroller); return; }
        // Buttons, links, inputs etc. keep their native touch behavior
        if (t.closest(INTERACTIVE_SELECTOR)) { g = null; return; }
        // Background and frame bodies: pan once the drag passes the slop
        beginPan(e);
      } else {
        g = null;
      }
    };

    const onMove = (e) => {
      if (!g) return;
      if (g.mode === "two") {
        const a = findTouch(e.touches, g.idA);
        const b = findTouch(e.touches, g.idB);
        if (!a || !b) return; // a pinch finger lifted — wait for the end event
        e.preventDefault();
        const curMid = mid(a, b);
        const ratio = dist(a, b) / g.startDist;
        const nz = clamp(g.startZoom * ratio, 0.2, 2);
        // zoom anchored at the starting pinch midpoint
        const baseX = g.mx - (g.mx - g.startPan.x) * (nz / g.startZoom);
        const baseY = g.my - (g.my - g.startPan.y) * (nz / g.startZoom);
        // plus two-finger pan (midpoint travel) — works in any direction
        setPan({ x: baseX + (curMid.clientX - g.startMidClientX), y: baseY + (curMid.clientY - g.startMidClientY) });
        setZoom(nz);
      } else if (g.mode === "pan" && e.touches.length >= 1) {
        const t = e.touches[0];
        if (!g.active) {
          // Still within the slop — treat as a tap and don't steal it yet
          if (Math.hypot(t.clientX - g.sx, t.clientY - g.sy) < PAN_SLOP) return;
          g.active = true;
        }
        pushSample(t);
        e.preventDefault();
        setPan({ x: g.startPan.x + (t.clientX - g.sx), y: g.startPan.y + (t.clientY - g.sy) });
      } else if (g.mode === "scroll" && e.touches.length >= 1) {
        e.preventDefault();
        const t = e.touches[0];
        pushSample(t);
        g.el.scrollTop = g.top - (t.clientY - g.sy);
        g.el.scrollLeft = g.left - (t.clientX - g.sx);
      }
    };

    const onEnd = (e) => {
      if (e.touches.length === 0) {
        // Release a moving pan or frame-content swipe with momentum
        if (g && (g.mode === "pan" ? g.active : g.mode === "scroll")) {
          const v = velocity();
          if (v && Math.hypot(v.x, v.y) > 0.15) startFling(v.x, v.y, g.mode === "scroll" ? g.el : null);
        }
        g = null;
        return;
      }
      if (g && g.mode === "two") {
        const a = findTouch(e.touches, g.idA);
        const b = findTouch(e.touches, g.idB);
        if (a && b) return; // both pinch fingers still down (a stray finger lifted) — keep pinching
        // One pinch finger lifted but the other is still down — hand the
        // remaining finger a pan so the canvas keeps following it instead of
        // freezing mid-gesture.
        const t = a || b;
        if (t) beginPan({ touches: [t] }, true);
        else g = null;
      }
    };

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      cancelFling();
      cancelFlingRef.current = null;
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [layout]);

  const startPan = useCallback((e) => {
    const startX = e.clientX, startY = e.clientY;
    const orig = { ...stateRef.current.pan };
    const move = (ev) => setPan({ x: orig.x + (ev.clientX - startX), y: orig.y + (ev.clientY - startY) });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, []);

  const onCanvasMouseDown = (e) => {
    if (e.target.dataset && e.target.dataset.canvasBg === "true") {
      setSelectedId(null);
      setAddOpen(false);
      startPan(e);
    }
  };

  const zoomIn = () => setZoom((z) => clamp(z * 1.2, 0.2, 2));
  const zoomOut = () => setZoom((z) => clamp(z / 1.2, 0.2, 2));
  const zoomFit = () => {
    cancelFlingRef.current?.();
    if (!layout || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const visible = Object.entries(layout).filter(([, f]) => !f.hidden);
    if (visible.length === 0) { setZoom(0.7); setPan({ x: 40, y: 40 }); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    visible.forEach(([, f]) => {
      minX = Math.min(minX, f.x); minY = Math.min(minY, f.y);
      maxX = Math.max(maxX, f.x + f.w); maxY = Math.max(maxY, f.y + f.h);
    });
    const w = maxX - minX, h = maxY - minY;
    const z = clamp(Math.min((rect.width - 120) / w, (rect.height - 120) / h), 0.2, 1.5);
    setZoom(z);
    setPan({ x: -minX * z + (rect.width - w * z) / 2, y: -minY * z + (rect.height - h * z) / 2 });
  };

  // Keep a ref to the latest zoomFit so the one-time auto-fit effect can call it.
  const zoomFitRef = useRef(zoomFit);
  zoomFitRef.current = zoomFit;

  // Re-arrange all visible frames into a non-overlapping masonry grid.
  // Each column is sized to its widest frame so nothing overlaps, and frames
  // stack vertically within their column. Custom frame sizes are preserved.
  const organizeFrames = useCallback(() => {
    if (!layout) return;
    const visibleDefs = defs.filter((d) => !layout[d.id]?.hidden);
    if (!visibleDefs.length) return;
    const cols = Math.min(3, visibleDefs.length);
    const gapX = 48, gapY = 48;
    const next = { ...layout };
    // Distribute frames round-robin into columns to balance the layout.
    const buckets = Array.from({ length: cols }, () => []);
    visibleDefs.forEach((d, i) => buckets[i % cols].push(d));
    // Column width = widest frame in that column (respect custom sizes, min 360).
    const colWidths = buckets.map((b) => Math.max(360, ...b.map((d) => next[d.id]?.w || d.w)));
    const colX = [];
    let acc = 0;
    for (let c = 0; c < cols; c++) { colX.push(acc); acc += colWidths[c] + gapX; }
    const colY = new Array(cols).fill(0);
    let z = 0;
    buckets.forEach((bucket, c) => {
      bucket.forEach((d) => {
        const prev = next[d.id] || {};
        const w = prev.w || d.w;
        const h = prev.h || d.h;
        next[d.id] = { ...prev, x: colX[c], y: colY[c], w, h, z: z++ };
        colY[c] += h + gapY;
      });
    });
    setLayout(next);
    saveLayout(next);
    setTimeout(() => zoomFitRef.current(), 80);
  }, [layout, defs, saveLayout]);

  // First time the layout is ready, frame all visible components instead of
  // dropping the user at a static 70% offset. Retry a few times so the fit
  // lands reliably once the viewport and saved frame positions have settled
  // (covers cases where the first tick fires before the canvas is measured).
  useEffect(() => {
    if (!layout) return;
    if (autoFitDone.current) return;
    autoFitDone.current = true;
    let cancelled = false;
    const delays = [0, 150, 400, 800, 1400];
    const timers = delays.map((d) => setTimeout(() => { if (!cancelled) zoomFitRef.current(); }, d));
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [layout]);

  // After exiting a frame's full-screen view, refresh shared data and remount
  // the canvas frames so they re-fetch and reflect changes made while full-screen.
  const [frameNonce, setFrameNonce] = useState(0);
  const wasFullscreenId = useRef(null);
  useEffect(() => {
    if (fullscreenId) { wasFullscreenId.current = fullscreenId; return; }
    const exitedId = wasFullscreenId.current;
    wasFullscreenId.current = null;
    if (!exitedId) return;
    refreshTasks(); refreshMilestones(); refreshAssets();
    setFrameNonce((n) => n + 1);
  }, [fullscreenId]);

  const hiddenFrames = defs.filter((d) => layout?.[d.id]?.hidden);
  const onAddFrame = (id) => { updateFrame(id, { hidden: false }); setAddOpen(false); };

  if (!layout) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#18A0FB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#F5F5F5] flex flex-col select-none">
      {/* Top bar */}
      <div className="h-11 bg-white border-b border-gray-200 flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onBack} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Back to Feed">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {project?.logo_url ? (
            <img src={project.logo_url} alt={project?.title} className="w-6 h-6 rounded object-cover" />
          ) : (
            <span className="w-6 h-6 rounded bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {(project?.title || "P").slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="text-sm font-medium text-gray-800 truncate max-w-[120px] md:max-w-[260px]">{project?.title}</span>
          <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{readOnly ? "Viewer" : isOwner ? "Owner" : "Collaborator"}</span>
        </div>
        <div className="flex items-center gap-2">
          {(isOwner || isCollaborator) && (
            <button onClick={() => setShowChat((v) => !v)} className={`relative p-1.5 rounded hover:bg-gray-100 text-gray-600 ${showChat ? "bg-purple-50 text-purple-600" : ""}`} title="Project Chat">
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
          <button onClick={onShare} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Share project">
            <Share2 className="w-4 h-4" />
          </button>
          {readOnly && canApply && (
            <Button onClick={onApply} className="bg-[#18A0FB] hover:bg-[#0E8FE0] text-white text-xs h-8 rounded-md px-2.5 md:px-3">
              <UserPlus className="w-3.5 h-3.5 md:mr-1" /><span className="hidden md:inline">Apply to Join</span>
            </Button>
          )}
          {!readOnly && (
            <button onClick={() => setLayersOpen((v) => !v)} className={`p-1.5 rounded hover:bg-gray-100 text-gray-600 ${layersOpen ? "bg-gray-100 text-[#18A0FB]" : ""}`} title="Workspaces">
              <Layers className="w-4 h-4" />
            </button>
          )}
          <div className="hidden md:flex items-center bg-gray-100 rounded-md text-xs">
            <button onClick={zoomOut} className="p-1.5 hover:bg-gray-200 text-gray-600"><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className="px-1 text-gray-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 hover:bg-gray-200 text-gray-600"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={zoomFit} className="p-1.5 hover:bg-gray-200 border-l border-gray-200 text-gray-600" title="Zoom to fit"><Maximize className="w-3.5 h-3.5" /></button>
          </div>
          <CanvasPresenceStack project={project} currentUser={currentUser} projectUsers={projectUsers} projectOwnerProfile={projectOwnerProfile} />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left layers (hidden in read-only preview mode) */}
        <div className={`${!readOnly && layersOpen ? "hidden lg:block" : "hidden"} w-56 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto`}>
          <CanvasLayers
            defs={defs}
            layout={layout}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggleHide={(id) => updateFrame(id, { hidden: !layout[id].hidden })}
            isOwner={isOwner}
            pendingApplicationsCount={pendingApplicationsCount}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>

        {/* Canvas viewport */}
        <div
          ref={viewportRef}
          className="flex-1 relative overflow-hidden"
          onMouseDown={onCanvasMouseDown}
          style={{ touchAction: "none" }}
        >
          <div
            data-canvas-bg="true"
            className="absolute inset-0"
            style={{
              backgroundColor: "#F7F6FB",
              backgroundImage:
                "radial-gradient(circle, rgba(91,71,219,0.09) 1px, transparent 1.6px), radial-gradient(circle, rgba(124,106,232,0.05) 1.4px, transparent 2.4px)",
              backgroundSize: `${24 * zoom}px ${24 * zoom}px, ${96 * zoom}px ${96 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px`,
            }}
          />
          <div
            data-canvas-bg="true"
            className="absolute"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              ...(readOnly ? { pointerEvents: "none", userSelect: "none" } : {}),
            }}
          >
            {defs.map((d) => {
              const f = layout[d.id];
              if (!f || f.hidden) return null;
              return (
                <CanvasFrame
                  key={`${d.id}-${frameNonce}`}
                  def={d}
                  frame={f}
                  zoom={zoom}
                  selected={selectedId === d.id}
                  onSelect={() => setSelectedId(d.id)}
                  onChange={(patch) => updateFrame(d.id, patch)}
                  onDelete={() => { updateFrame(d.id, { hidden: true }); setSelectedId(null); }}
                  onToggleCollapse={() => updateFrame(d.id, { collapsed: !f.collapsed })}
                  onToggleHide={() => updateFrame(d.id, { hidden: !f.hidden })}
                  onToggleFullscreen={() => setFullscreenId(d.id)}
                  blurred={readOnly}
                />
              );
            })}
          </div>

          {readOnly && (
            <ReadOnlyProjectBanner
              project={project}
              projectUsers={projectUsers}
              projectOwnerProfile={projectOwnerProfile}
              canApply={canApply}
              onApply={onApply}
            />
          )}

          {fullscreenId && (() => {
            const d = defs.find((dd) => dd.id === fullscreenId);
            if (!d) return null;
            const FIcon = d.icon;
            return (
              <div className="fixed inset-0 z-[110] bg-white flex flex-col">
                <div className="h-10 flex items-center gap-2 px-3 border-b border-gray-200 bg-white flex-shrink-0">
                  <FIcon className="w-4 h-4 text-[#18A0FB]" />
                  <span className="text-sm font-semibold text-gray-800">{d.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Full screen</span>
                  <button
                    onClick={() => setFullscreenId(null)}
                    className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs"
                  >
                    <Minimize2 className="w-3.5 h-3.5" /> Exit full screen
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto" data-canvas-scroll="true" style={{ touchAction: 'auto' }}>{d.render()}</div>
              </div>
            );
          })()}
        </div>

      </div>

      {!readOnly && layersOpen && (
        <div className="lg:hidden fixed top-11 left-0 right-0 bottom-0 z-[120]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setLayersOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 max-w-[80%] bg-white border-r border-gray-200 overflow-y-auto">
            <CanvasLayers
              defs={defs}
              layout={layout}
              selectedId={selectedId}
              onSelect={(id) => { setSelectedId(id); setLayersOpen(false); }}
              onToggleHide={(id) => updateFrame(id, { hidden: !layout[id].hidden })}
              isOwner={isOwner}
              pendingApplicationsCount={pendingApplicationsCount}
              onOpenSettings={() => { setShowSettings(true); setLayersOpen(false); }}
            />
          </div>
        </div>
      )}

      {/* Bottom toolbar (Add/Organize hidden in read-only preview mode) */}
      <CanvasToolbar
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomFit={zoomFit}
        addOpen={addOpen}
        setAddOpen={setAddOpen}
        hiddenFrames={hiddenFrames}
        onAddFrame={onAddFrame}
        onOrganize={organizeFrames}
        readOnly={readOnly}
      />

      {(isOwner || isCollaborator) && (
        <ProjectChatPanel
          open={showChat}
          onClose={() => setShowChat(false)}
          project={project}
          currentUser={currentUser}
          projectUsers={projectUsers}
        />
      )}

      <ProjectSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        project={project}
        currentUser={currentUser}
        projectUsers={projectUsers}
        projectOwnerProfile={projectOwnerProfile}
        isOwner={isOwner}
        isCollaborator={isCollaborator}
        pendingApplicationsCount={pendingApplicationsCount}
        onProjectUpdate={onProjectUpdate}
        onUpdateSocialLinks={onUpdateSocialLinks}
      />
    </div>
  );
}