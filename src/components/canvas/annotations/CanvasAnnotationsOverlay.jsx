import React, { useRef, useState } from "react";

// Screen-space overlay that owns creation of new annotations. Active only when
// an annotation tool is selected; otherwise it renders nothing and lets the
// underlying canvas / frames receive pointer events normally.
export default function CanvasAnnotationsOverlay({
  tool, pan, zoom, viewportRef, drawColor, onCreate,
}) {
  const active = tool === "draw" || tool === "sticky" || tool === "image";
  const [stroke, setStroke] = useState(null);
  const drawing = useRef(false);

  const toCanvas = (clientX, clientY) => {
    const rect = viewportRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const onPointerDown = (e) => {
    if (!active) return;
    if (tool === "draw") {
      e.currentTarget.setPointerCapture(e.pointerId);
      const p = toCanvas(e.clientX, e.clientY);
      drawing.current = true;
      setStroke({
        points: [[p.x, p.y]],
        color: drawColor,
        strokeWidth: 3,
        minX: p.x, minY: p.y, maxX: p.x, maxY: p.y,
      });
    } else if (tool === "sticky") {
      const p = toCanvas(e.clientX, e.clientY);
      onCreate({
        type: "sticky",
        x: p.x - 110, y: p.y - 90, width: 220, height: 180,
        data: { text: "", color: "#FEF3C7", fontSize: 14 },
      });
    } else if (tool === "image") {
      const p = toCanvas(e.clientX, e.clientY);
      const url = window.prompt("Paste an image URL to pin to the canvas:");
      if (url) {
        onCreate({
          type: "image",
          x: p.x - 150, y: p.y - 100, width: 300, height: 200,
          data: { src: url, borderColor: "#18A0FB", borderWidth: 2 },
        });
      }
    }
  };

  const onPointerMove = (e) => {
    if (!active || tool !== "draw" || !drawing.current) return;
    const p = toCanvas(e.clientX, e.clientY);
    setStroke((s) => s ? {
      ...s,
      points: [...s.points, [p.x, p.y]],
      minX: Math.min(s.minX, p.x), minY: Math.min(s.minY, p.y),
      maxX: Math.max(s.maxX, p.x), maxY: Math.max(s.maxY, p.y),
    } : s);
  };

  const onPointerUp = () => {
    if (!active) return;
    if (tool === "draw" && drawing.current && stroke && stroke.points.length > 1) {
      drawing.current = false;
      const x = stroke.minX, y = stroke.minY;
      const w = Math.max(stroke.maxX - stroke.minX, 2);
      const h = Math.max(stroke.maxY - stroke.minY, 2);
      const relPoints = stroke.points.map((p) => [p[0] - x, p[1] - y]);
      onCreate({
        type: "draw",
        x, y, width: w, height: h,
        data: { points: relPoints, color: stroke.color, strokeWidth: stroke.strokeWidth, bbox: { width: w, height: h } },
      });
      setStroke(null);
    } else {
      drawing.current = false;
      setStroke(null);
    }
  };

  if (!active) return null;

  return (
    <div
      className="absolute inset-0 z-10"
      style={{
        pointerEvents: "auto",
        cursor: tool === "draw" ? "crosshair" : "default",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {stroke && (
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            pointerEvents: "none",
          }}
        >
          <svg width="1" height="1" className="overflow-visible">
            <polyline
              points={stroke.points.map((p) => `${p[0]},${p[1]}`).join(" ")}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}