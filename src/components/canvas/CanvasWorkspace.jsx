import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import OptimizedAvatar from "../OptimizedAvatar";
import { Link } from "react-router-dom";
import { Share2, ChevronLeft, ZoomIn, ZoomOut, Maximize, Minimize2, Layers, Eye, Trophy, Heart, Bug, ShieldCheck, LogOut, Music, Users, Briefcase, Info, DollarSign, Link2, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { buildFrameDefs } from "./canvasFrameRegistry";
import CanvasFrame from "./CanvasFrame";
import ProjectDetailsFrame from "./ProjectDetailsFrame";
import ProjectFundingCard from "../ProjectFundingCard";
import SocialsPanel from "../SocialsPanel";
import MicrolinkPreview from "../MicrolinkPreview";
import CanvasLayers from "./CanvasLayers";
import CanvasToolbar from "./CanvasToolbar";
import CanvasPresenceStack from "./CanvasPresenceStack";
import MusicPlayer from "../music/MusicPlayer";
import ProjectApplicationsManager from "../ProjectApplicationsManager";
import ProjectMembershipManager from "../ProjectMembershipManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function defaultLayout(defs) {
  const cols = 3, colW = 560, gapX = 40, gapY = 40;
  const colY = [0, 0, 0];
  const layout = {};
  defs.forEach((d, i) => {
    const c = i % cols;
    layout[d.id] = { x: c * (colW + gapX), y: colY[c], w: d.w, h: d.h, collapsed: false, hidden: false, z: i };
    colY[c] += d.h + gapY;
  });
  return layout;
}

export default function CanvasWorkspace({
  project, currentUser, projectUsers, projectOwnerProfile,
  isOwner, isCollaborator, onProjectUpdate, onUpdateSocialLinks, onShare, onBack, initialApplicationId,
}) {
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [assets, setAssets] = useState([]);
  const [layout, setLayout] = useState(null);
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("move");
  const [addOpen, setAddOpen] = useState(false);
  const [fullscreenId, setFullscreenId] = useState(null);
  const [layersOpen, setLayersOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : true));
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [showApplicationsDialog, setShowApplicationsDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showProjectDetailsDialog, setShowProjectDetailsDialog] = useState(false);
  const [showFundingDialog, setShowFundingDialog] = useState(false);
  const [showSocialDialog, setShowSocialDialog] = useState(false);
  const [showShowcaseDialog, setShowShowcaseDialog] = useState(false);
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
  const projectIdRef = useRef(null);
  const didInit = useRef(false);

  useEffect(() => { stateRef.current = { zoom, pan }; }, [zoom, pan]);

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

  // Owner-only: pending applications count for the Layers sidebar badge
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
  }, [project?.id, isOwner, showApplicationsDialog]);

  // Deep-link from an application notification: auto-open the Applications panel
  useEffect(() => {
    if (initialApplicationId && isOwner) setShowApplicationsDialog(true);
  }, [initialApplicationId, isOwner]);

  const navigateToFrame = useCallback((target) => {
    const map = { tasks: "tasks", milestones: "milestones", assets: "assets", ideation: "ideation", notes: "notes", tools: "tools", links: "links", activity: "activity" };
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
    }
    if (didInit.current || !defs.length) return;
    didInit.current = true;
    const saved = project?.canvas_layout;
    if (saved && typeof saved === "object" && Object.keys(saved).length > 0) {
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
    if (!project?.id) return;
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
      // Let trackpad / mouse wheel scroll inside frames natively instead of
      // hijacking it to pan the canvas. Ctrl/Cmd+wheel still zooms the canvas.
      const overFrame = e.target && typeof e.target.closest === 'function' && e.target.closest('[data-canvas-scroll="true"]');
      if (overFrame && !e.ctrlKey && !e.metaKey) return;
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
  // in any direction); single-finger drag on empty canvas = pan.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const mid = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
    const findTouch = (touches, id) => { for (let i = 0; i < touches.length; i++) { if (touches[i].identifier === id) return touches[i]; } return null; };
    let g = null;

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

    const beginPan = (e) => {
      const t = e.touches[0];
      g = { mode: "pan", sx: t.clientX, sy: t.clientY, startPan: { ...stateRef.current.pan } };
    };

    // Single-finger swipe that scrolls a frame's content (vertical + horizontal)
    const beginScroll = (e, scroller) => {
      const t = e.touches[0];
      g = { mode: "scroll", el: scroller, sx: t.clientX, sy: t.clientY, top: scroller.scrollTop, left: scroller.scrollLeft };
    };

    const onStart = (e) => {
      if (e.touches.length >= 2) {
        // Keep an existing pinch stable if a stray third finger grazes the screen
        if (g && g.mode === "two" && findTouch(e.touches, g.idA) && findTouch(e.touches, g.idB)) return;
        beginTwo(e);
      } else if (e.touches.length === 1) {
        const scroller = e.target && typeof e.target.closest === 'function' && e.target.closest('[data-canvas-scroll="true"]');
        if (scroller) {
          beginScroll(e, scroller);
        } else if (e.target.dataset && e.target.dataset.canvasBg === "true") {
          beginPan(e);
        } else {
          g = null;
        }
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
        e.preventDefault();
        const t = e.touches[0];
        setPan({ x: g.startPan.x + (t.clientX - g.sx), y: g.startPan.y + (t.clientY - g.sy) });
      } else if (g.mode === "scroll" && e.touches.length >= 1) {
        e.preventDefault();
        const t = e.touches[0];
        g.el.scrollTop = g.top - (t.clientY - g.sy);
        g.el.scrollLeft = g.left - (t.clientX - g.sx);
      }
    };

    const onEnd = (e) => {
      if (e.touches.length === 0) { g = null; return; }
      if (g && g.mode === "two") {
        // only end the pinch if one of the two tracked fingers is gone
        if (!findTouch(e.touches, g.idA) || !findTouch(e.touches, g.idB)) g = null;
      }
    };

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
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
    if (!layout || !viewportRef.current) return;
    const visible = Object.entries(layout).filter(([, f]) => !f.hidden);
    if (visible.length === 0) { setZoom(0.7); setPan({ x: 40, y: 40 }); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    visible.forEach(([, f]) => {
      minX = Math.min(minX, f.x); minY = Math.min(minY, f.y);
      maxX = Math.max(maxX, f.x + f.w); maxY = Math.max(maxY, f.y + f.h);
    });
    const w = maxX - minX, h = maxY - minY;
    const rect = viewportRef.current.getBoundingClientRect();
    const z = clamp(Math.min((rect.width - 120) / w, (rect.height - 120) / h), 0.2, 1.5);
    setZoom(z);
    setPan({ x: -minX * z + (rect.width - w * z) / 2, y: -minY * z + (rect.height - h * z) / 2 });
  };

  const handleLogout = async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    const welcomeUrl = `${window.location.origin}${createPageUrl("Welcome")}`;
    try { await base44.auth.logout(welcomeUrl); } catch {}
    window.location.href = welcomeUrl;
  };

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
          <img src={LOGO_URL} alt="Collab Unity" className="w-6 h-6 rounded" />
          <span className="text-sm font-medium text-gray-800 truncate max-w-[120px] md:max-w-[260px]">{project?.title}</span>
          <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{isOwner ? "Owner" : "Collaborator"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMusicPlayer((v) => !v)} className={`relative p-1.5 rounded hover:bg-gray-100 text-gray-600 ${showMusicPlayer ? "bg-purple-50 text-purple-600" : ""}`} title="CU Radio">
            <Music className="w-4 h-4" />
            {showMusicPlayer && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-600 rounded-full" />}
          </button>
          <button onClick={() => setLayersOpen((v) => !v)} className={`p-1.5 rounded hover:bg-gray-100 text-gray-600 ${layersOpen ? "bg-gray-100 text-[#18A0FB]" : ""}`} title="Layers">
            <Layers className="w-4 h-4" />
          </button>
          <div className="hidden md:flex items-center bg-gray-100 rounded-md text-xs">
            <button onClick={zoomOut} className="p-1.5 hover:bg-gray-200 text-gray-600"><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className="px-1 text-gray-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 hover:bg-gray-200 text-gray-600"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={zoomFit} className="p-1.5 hover:bg-gray-200 border-l border-gray-200 text-gray-600" title="Zoom to fit"><Maximize className="w-3.5 h-3.5" /></button>
          </div>
          <Button onClick={onShare} className="bg-[#18A0FB] hover:bg-[#0E8FE0] text-white text-xs h-8 rounded-md px-2.5 md:px-3">
            <Share2 className="w-3.5 h-3.5 md:mr-1" /><span className="hidden md:inline">Share</span>
          </Button>
          <CanvasPresenceStack project={project} currentUser={currentUser} projectUsers={projectUsers} projectOwnerProfile={projectOwnerProfile} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none">
                <OptimizedAvatar src={currentUser?.profile_image} alt={currentUser?.full_name || "User"} fallback={currentUser?.full_name?.[0] || "U"} size="xs" className="w-7 h-7" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to={createPageUrl(`UserProfile?username=${currentUser?.username}`)} className="flex items-center cursor-pointer">
                  <Eye className="w-4 h-4 mr-2" /> View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Leaderboard")} className="flex items-center cursor-pointer">
                  <Trophy className="w-4 h-4 mr-2" /> Leaderboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("SupportCU")} className="flex items-center cursor-pointer">
                  <Heart className="w-4 h-4 mr-2" /> Support CU
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("ReportBug")} className="flex items-center cursor-pointer">
                  <Bug className="w-4 h-4 mr-2" /> Report Bug
                </Link>
              </DropdownMenuItem>
              {currentUser?.role === "admin" && (
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("AdminReview")} className="flex items-center cursor-pointer">
                    <ShieldCheck className="w-4 h-4 mr-2" /> Admin Review
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left layers */}
        <div className={`${layersOpen ? "hidden lg:block" : "hidden"} w-56 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto`}>
          <CanvasLayers
            defs={defs}
            layout={layout}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggleHide={(id) => updateFrame(id, { hidden: !layout[id].hidden })}
            isOwner={isOwner}
            projectId={project?.id}
            pendingApplicationsCount={pendingApplicationsCount}
            onOpenApplications={() => setShowApplicationsDialog(true)}
            onOpenInvite={() => setShowInviteDialog(true)}
            onOpenProjectDetails={() => setShowProjectDetailsDialog(true)}
            onOpenFunding={() => setShowFundingDialog(true)}
            onOpenSocial={() => setShowSocialDialog(true)}
            onOpenShowcase={() => setShowShowcaseDialog(true)}
          />
        </div>

        {/* Canvas viewport */}
        <div
          ref={viewportRef}
          className="flex-1 relative overflow-hidden"
          onMouseDown={onCanvasMouseDown}
          style={{ cursor: tool === "hand" ? "grab" : "default", touchAction: "none" }}
        >
          <div
            data-canvas-bg="true"
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(#d4d4d4 1px, transparent 1px)",
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />
          <div
            data-canvas-bg="true"
            className="absolute"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
          >
            {defs.map((d) => {
              const f = layout[d.id];
              if (!f || f.hidden) return null;
              return (
                <CanvasFrame
                  key={d.id}
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
                />
              );
            })}
          </div>

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
                <div className="flex-1 min-h-0 overflow-auto">{d.render()}</div>
              </div>
            );
          })()}
        </div>

      </div>

      {layersOpen && (
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
              projectId={project?.id}
              pendingApplicationsCount={pendingApplicationsCount}
              onOpenApplications={() => { setShowApplicationsDialog(true); setLayersOpen(false); }}
              onOpenInvite={() => { setShowInviteDialog(true); setLayersOpen(false); }}
              onOpenProjectDetails={() => { setShowProjectDetailsDialog(true); setLayersOpen(false); }}
              onOpenFunding={() => { setShowFundingDialog(true); setLayersOpen(false); }}
              onOpenSocial={() => { setShowSocialDialog(true); setLayersOpen(false); }}
              onOpenShowcase={() => { setShowShowcaseDialog(true); setLayersOpen(false); }}
            />
          </div>
        </div>
      )}

      {/* Bottom toolbar */}
      <CanvasToolbar
        tool={tool}
        setTool={setTool}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomFit={zoomFit}
        addOpen={addOpen}
        setAddOpen={setAddOpen}
        hiddenFrames={hiddenFrames}
        onAddFrame={onAddFrame}
      />

      <MusicPlayer isVisible={showMusicPlayer} onClose={() => setShowMusicPlayer(false)} zIndex={130} />

      {isOwner && (
        <Dialog open={showApplicationsDialog} onOpenChange={setShowApplicationsDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#18A0FB]" /> Applications
              </DialogTitle>
              <DialogDescription>Review users who applied to join your project and accept or decline them.</DialogDescription>
            </DialogHeader>
            <ProjectApplicationsManager project={project} onProjectUpdate={onProjectUpdate} alwaysShow />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#18A0FB]" /> Team &amp; Invite
            </DialogTitle>
            <DialogDescription>Invite collaborators to join your project and manage existing members.</DialogDescription>
          </DialogHeader>
          <ProjectMembershipManager
            project={project}
            currentUser={currentUser}
            projectUsers={projectUsers}
            isOwner={isOwner}
            isExplicitCollaborator={isCollaborator}
            onUpdate={onProjectUpdate}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showProjectDetailsDialog} onOpenChange={setShowProjectDetailsDialog}>
        <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-[#18A0FB]" /> Project Details
            </DialogTitle>
            <DialogDescription>
              {isOwner ? "View and edit your project information." : "Project information."}
            </DialogDescription>
          </DialogHeader>
          <ProjectDetailsFrame project={project} canEdit={isOwner} />
        </DialogContent>
      </Dialog>

      <Dialog open={showFundingDialog} onOpenChange={setShowFundingDialog}>
        <DialogContent className="sm:max-w-[420px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#18A0FB]" /> Funding
            </DialogTitle>
            <DialogDescription>{isOwner ? "Manage your project funding links." : "Project funding links."}</DialogDescription>
          </DialogHeader>
          <ProjectFundingCard project={project} projectOwner={projectOwnerProfile} canEdit={isOwner} onUpdate={onProjectUpdate} />
        </DialogContent>
      </Dialog>

      <Dialog open={showSocialDialog} onOpenChange={setShowSocialDialog}>
        <DialogContent className="sm:max-w-[420px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#18A0FB]" /> Social Media
            </DialogTitle>
            <DialogDescription>{isOwner ? "Add social media links to promote this project." : "Project social media links."}</DialogDescription>
          </DialogHeader>
          <SocialsPanel
            socialLinks={project?.social_links || {}}
            onUpdate={onUpdateSocialLinks}
            canEdit={isOwner}
            title="Social Media"
            emptyMessage="Add social media links to promote this project"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showShowcaseDialog} onOpenChange={setShowShowcaseDialog}>
        <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#18A0FB]" /> Showcase Links
            </DialogTitle>
            <DialogDescription>{isOwner ? "Showcase links are managed on the Edit Project page." : "Project showcase links."}</DialogDescription>
          </DialogHeader>
          <div className="p-1 space-y-3">
            {project?.project_urls?.length ? (
              project.project_urls.map((l, i) => {
                const url = typeof l === "object" ? l.url : l;
                const title = typeof l === "object" ? l.title : "";
                return <MicrolinkPreview key={i} url={url} title={title || ""} className="w-full" />;
              })
            ) : (
              <p className="text-sm text-gray-400">No showcase links yet. Add them via Edit Project.</p>
            )}
            {isOwner && (
              <Link to={createPageUrl(`EditProject?id=${project?.id}`)} className="inline-flex items-center gap-1 text-xs text-[#18A0FB] hover:underline pt-1">
                <Pencil className="w-3 h-3" /> Edit showcase links
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}