import React from "react";
import {
  Trash2, Type as TypeIcon, Hash, Square as SquareIcon,
  Circle, Triangle, Diamond, Star,
} from "lucide-react";

const MIN_W = 100, MIN_H = 80;

const SHAPES = [
  { key: "rect", label: "Rectangle", Icon: SquareIcon },
  { key: "circle", label: "Circle", Icon: Circle },
  { key: "triangle", label: "Triangle", Icon: Triangle },
  { key: "diamond", label: "Diamond", Icon: Diamond },
  { key: "star", label: "Star", Icon: Star },
];

function ShapeSvg({ shape, color }) {
  const common = { fill: color, stroke: "rgba(0,0,0,0.15)", strokeWidth: 1 };
  switch (shape) {
    case "circle":
      return <ellipse cx={50} cy={50} rx={48} ry={48} {...common} />;
    case "triangle":
      return <polygon points="50,4 96,92 4,92" {...common} />;
    case "diamond":
      return <polygon points="50,4 96,50 50,96 4,50" {...common} />;
    case "star":
      return <polygon points="50,4 61,38 96,38 68,60 79,92 50,72 21,92 32,60 4,38 39,38" {...common} />;
    default:
      return <rect x={4} y={4} width={92} height={92} rx={8} {...common} />;
  }
}

export default function CanvasItemFrame({ item, zoom, selected, onSelect, onChange, onDelete }) {
  const headerDrag = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();
    const sx = e.clientX, sy = e.clientY;
    const ox = item.x, oy = item.y;
    const move = (ev) =>
      onChange({ x: ox + (ev.clientX - sx) / zoom, y: oy + (ev.clientY - sy) / zoom });
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const resizeStart = (e, edges) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const sx = e.clientX, sy = e.clientY;
    const o = { x: item.x, y: item.y, w: item.w, h: item.h };
    const move = (ev) => {
      const dx = (ev.clientX - sx) / zoom, dy = (ev.clientY - sy) / zoom;
      let x = o.x, y = o.y, w = o.w, h = o.h;
      if (edges.w) { x = o.x + dx; w = o.w - dx; }
      if (edges.e) { w = o.w + dx; }
      if (edges.n) { y = o.y + dy; h = o.h - dy; }
      if (edges.s) { h = o.h + dy; }
      if (w < MIN_W) { if (edges.w) x = o.x + (o.w - MIN_W); w = MIN_W; }
      if (h < MIN_H) { if (edges.n) y = o.y + (o.h - MIN_H); h = MIN_H; }
      onChange({ x, y, w, h });
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const handles = [
    { cls: "top-0 left-0 w-2.5 h-2.5 cursor-nwse-resize", edges: { n: true, w: true } },
    { cls: "top-0 right-0 w-2.5 h-2.5 cursor-nesw-resize", edges: { n: true, e: true } },
    { cls: "bottom-0 left-0 w-2.5 h-2.5 cursor-nesw-resize", edges: { s: true, w: true } },
    { cls: "bottom-0 right-0 w-2.5 h-2.5 cursor-nwse-resize", edges: { s: true, e: true } },
  ];

  const Icon = item.type === "text" ? TypeIcon : item.type === "canvas" ? Hash : SquareIcon;
  const title = item.type === "text" ? "Text" : item.type === "canvas" ? "Canvas" : "Shape";

  return (
    <div
      className="absolute bg-white rounded-lg border border-gray-200 flex flex-col"
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        zIndex: item.z || 0,
        boxShadow: selected
          ? "0 0 0 2px #18A0FB, 0 8px 24px rgba(0,0,0,0.12)"
          : "0 4px 12px rgba(0,0,0,0.08)",
      }}
      onMouseDown={(e) => { e.stopPropagation(); onSelect(); }}
    >
      <div
        className="h-8 flex items-center gap-1.5 px-2 border-b border-gray-100 cursor-grab active:cursor-grabbing flex-shrink-0"
        onMouseDown={headerDrag}
      >
        <Icon className="w-3.5 h-3.5 text-[#18A0FB] flex-shrink-0" />
        <span className="text-xs font-medium text-gray-700 flex-1 truncate">{title}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        {item.type === "text" && (
          <textarea
            value={item.content || ""}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Type a note…"
            className="w-full h-full p-2 text-sm text-gray-700 resize-none focus:outline-none bg-transparent"
            style={{ touchAction: "auto" }}
          />
        )}

        {item.type === "canvas" && (
          <div className="w-full h-full flex flex-col" style={{ background: item.color || "#ffffff" }}>
            <div className="flex items-center gap-1.5 p-2 bg-white/70 border-b border-black/5">
              <input
                type="color"
                value={item.color || "#ffffff"}
                onChange={(e) => onChange({ color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border border-gray-200"
                title="Pick color"
              />
              <input
                type="text"
                value={item.color || "#ffffff"}
                onChange={(e) => onChange({ color: e.target.value })}
                placeholder="#ffffff"
                className="text-xs px-1.5 py-0.5 rounded border border-gray-200 w-24 focus:outline-none"
              />
            </div>
          </div>
        )}

        {item.type === "shape" && (
          <div className="w-full h-full flex flex-col">
            <div className="flex items-center gap-1 p-1 border-b border-gray-100 bg-white flex-wrap">
              {SHAPES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onChange({ shape: s.key })}
                  className={`p-1 rounded ${item.shape === s.key ? "bg-[#18A0FB]/15 text-[#18A0FB]" : "text-gray-500 hover:bg-gray-100"}`}
                  title={s.label}
                >
                  <s.Icon className="w-3.5 h-3.5" />
                </button>
              ))}
              <input
                type="color"
                value={item.color || "#9ca3af"}
                onChange={(e) => onChange({ color: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border border-gray-200 ml-1"
                title="Color"
              />
            </div>
            <div className="flex-1 flex items-center justify-center p-2">
              <svg viewBox="0 0 100 100" className="w-full h-full max-w-[120px] max-h-[120px]">
                <ShapeSvg shape={item.shape} color={item.color || "#9ca3af"} />
              </svg>
            </div>
          </div>
        )}
      </div>

      {handles.map((h, i) => (
        <div
          key={i}
          onMouseDown={(e) => resizeStart(e, h.edges)}
          className={`absolute ${h.cls}`}
          style={{ zIndex: 5 }}
        />
      ))}
    </div>
  );
}