import React from "react";
import { Trash2, EyeOff, ChevronDown, ChevronRight } from "lucide-react";

export default function CanvasFrame({
  def, frame, zoom, selected, onSelect, onChange, onDelete, onToggleCollapse, onToggleHide,
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
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const onResizeStart = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const origW = frame.w, origH = frame.h;
    const move = (ev) => {
      onChange({
        w: Math.max(280, origW + (ev.clientX - startX) / zoom),
        h: Math.max(220, origH + (ev.clientY - startY) / zoom),
      });
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

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
      {!frame.collapsed && (
        <div
          onMouseDown={onResizeStart}
          className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
          style={{ background: "linear-gradient(135deg, transparent 50%, #18A0FB 50%)" }}
        />
      )}
    </div>
  );
}