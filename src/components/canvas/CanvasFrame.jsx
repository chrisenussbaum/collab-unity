import React from "react";
import { Trash2, EyeOff, ChevronDown, ChevronRight, Maximize2 } from "lucide-react";

const MIN_W = 280;
const MIN_H = 220;

export default function CanvasFrame({
  def, frame, zoom, selected, onSelect, onChange, onDelete,
  onToggleCollapse, onToggleHide, onToggleFullscreen,
}) {
  const Icon = def.icon;

  const onHeaderMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();
    const startX = e.clientX, startY = e.clientY;
    const origX = frame.x, origY = frame.y;
    const move = (ev) => {
      onChange({ x: origX + (ev.clientX - startX) / zoom, y: origY + (ev.clientY - startY) / zoom });
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const onResizeStart = (e, edges) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const startX = e.clientX, startY = e.clientY;
    const orig = { x: frame.x, y: frame.y, w: frame.w, h: frame.h };
    const move = (ev) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      let x = orig.x, y = orig.y, w = orig.w, h = orig.h;
      if (edges.w) { x = orig.x + dx; w = orig.w - dx; }
      if (edges.e) { w = orig.w + dx; }
      if (edges.n) { y = orig.y + dy; h = orig.h - dy; }
      if (edges.s) { h = orig.h + dy; }
      if (w < MIN_W) { if (edges.w) x = orig.x + (orig.w - MIN_W); w = MIN_W; }
      if (h < MIN_H) { if (edges.n) y = orig.y + (orig.h - MIN_H); h = MIN_H; }
      onChange({ x, y, w, h });
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // Resize handle definitions: position + cursor + edges
  const handles = [
    { key: "nw", cls: "top-0 left-0 w-3 h-3 cursor-nwse-resize", edges: { n: true, w: true } },
    { key: "ne", cls: "top-0 right-0 w-3 h-3 cursor-nesw-resize", edges: { n: true, e: true } },
    { key: "sw", cls: "bottom-0 left-0 w-3 h-3 cursor-nesw-resize", edges: { s: true, w: true } },
    { key: "se", cls: "bottom-0 right-0 w-3 h-3 cursor-nwse-resize", edges: { s: true, e: true } },
    { key: "n", cls: "top-0 left-3 right-3 h-1.5 cursor-ns-resize", edges: { n: true } },
    { key: "s", cls: "bottom-0 left-3 right-3 h-1.5 cursor-ns-resize", edges: { s: true } },
    { key: "w", cls: "left-0 top-3 bottom-3 w-1.5 cursor-ew-resize", edges: { w: true } },
    { key: "e", cls: "right-0 top-3 bottom-3 w-1.5 cursor-ew-resize", edges: { e: true } },
  ];

  return (
    <div
      className="absolute bg-white rounded-lg border border-gray-200 flex flex-col"
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.w,
        height: frame.collapsed ? 36 : frame.h,
        boxShadow: selected
          ? "0 0 0 2px #18A0FB, 0 8px 24px rgba(0,0,0,0.12)"
          : "0 4px 12px rgba(0,0,0,0.08)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="h-9 flex items-center gap-2 px-2.5 border-b border-gray-100 cursor-grab active:cursor-grabbing flex-shrink-0"
        onMouseDown={onHeaderMouseDown}
      >
        <Icon className="w-3.5 h-3.5 text-[#18A0FB] flex-shrink-0" />
        <span className="text-xs font-medium text-gray-700 truncate flex-1">{def.title}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-[#18A0FB]"
          title="Full screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          className="p-1 rounded hover:bg-gray-100 text-gray-400"
          title={frame.collapsed ? "Expand" : "Collapse"}
        >
          {frame.collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleHide(); }}
          className="p-1 rounded hover:bg-gray-100 text-gray-400"
          title="Hide"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
          title="Hide from canvas"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {!frame.collapsed && (
        <div className="flex-1 overflow-auto" onMouseDown={(e) => e.stopPropagation()}>
          {def.render()}
        </div>
      )}
      {!frame.collapsed && handles.map((h) => (
        <div
          key={h.key}
          onMouseDown={(e) => onResizeStart(e, h.edges)}
          className={`absolute ${h.cls}`}
          style={{ zIndex: 5 }}
        />
      ))}
    </div>
  );
}