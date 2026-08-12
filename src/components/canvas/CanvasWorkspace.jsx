import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import OptimizedAvatar from "../OptimizedAvatar";
import { Share2, ChevronLeft, ZoomIn, ZoomOut, Maximize, Minimize2 } from "lucide-react";
import { buildFrameDefs } from "./canvasFrameRegistry";
import CanvasFrame from "./CanvasFrame";
import CanvasLayers from "./CanvasLayers";
import CanvasToolbar from "./CanvasToolbar";
import CanvasInspector from "./CanvasInspector";

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
  isOwner, isCollaborator, onProjectUpdate, onUpdateSocialLinks, onShare, onBack,
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
      defs.forEach((d) => {
        const dl = defaultLayout([d])[d.id];
        merged[d.id] = saved[d.id] ? { ...dl, ...saved[d.id] } : dl;
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

  // Wheel: ctrl/cmd = zoom, otherwise pan. Native non-passive listener so preventDefault works.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e) => {
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const z = stateRef.current.zoom;
        const nz = clamp(z * (e.deltaY < 0 ? 1.1 : 0.9), 0.2, 2);
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
  }, []);

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
          <span className="text-sm font-medium text-gray-800 truncate max-w-[260px]">{project?.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{isOwner ? "Owner" : "Collaborator"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-md text-xs">
            <button onClick={zoomOut} className="p-1.5 hover:bg-gray-200 text-gray-600"><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className="px-1 text-gray-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 hover:bg-gray-200 text-gray-600"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={zoomFit} className="p-1.5 hover:bg-gray-200 border-l border-gray-200 text-gray-600" title="Zoom to fit"><Maximize className="w-3.5 h-3.5" /></button>
          </div>
          <Button onClick={onShare} className="bg-[#18A0FB] hover:bg-[#0E8FE0] text-white text-xs h-8 rounded-md px-3">
            <Share2 className="w-3.5 h-3.5 mr-1" />Share
          </Button>
          <OptimizedAvatar src={currentUser?.profile_image} alt={currentUser?.full_name || "User"} fallback={currentUser?.full_name?.[0] || "U"} size="xs" className="w-7 h-7" />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left layers */}
        <div className="w-56 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <CanvasLayers
            defs={defs}
            layout={layout}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggleHide={(id) => updateFrame(id, { hidden: !layout[id].hidden })}
          />
        </div>

        {/* Canvas viewport */}
        <div
          ref={viewportRef}
          className="flex-1 relative overflow-hidden"
          onMouseDown={onCanvasMouseDown}
          style={{ cursor: tool === "hand" ? "grab" : "default" }}
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

        {/* Right inspector */}
        <div className="w-60 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
          <CanvasInspector defs={defs} layout={layout} selectedId={selectedId} updateFrame={updateFrame} />
        </div>
      </div>

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
    </div>
  );
}