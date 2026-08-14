import React, { useRef, useState } from "react";
import { prepareCanvasMedia } from "./canvasMediaUpload";

// Screen-space overlay that owns creation of new annotations. Active only when
// an annotation tool is selected; otherwise it renders nothing and lets the
// underlying canvas / frames receive pointer events normally.
//
// - draw: freehand ink stroke.
// - sticky: click to drop a note.
// - image: click to open a file picker, or drag-and-drop an image/video file
//   onto the canvas. Videos use the same 50MB / 5-min limit as the rest of the
//   app.
export default function CanvasAnnotationsOverlay({
  tool, pan, zoom, viewportRef, drawColor, onCreate,
}) {
  const active = tool === "draw" || tool === "sticky" || tool === "image";
  const [stroke, setStroke] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [dropHover, setDropHover] = useState(false);
  const drawing = useRef(false);
  const fileInputRef = useRef(null);
  const clickPosRef = useRef(null);

  const toCanvas = (clientX, clientY) => {
    const rect = viewportRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const handleFile = async (file, canvasPos) => {
    if (!file) return;
    try {
      const prepared = await prepareCanvasMedia(file, (msg) => setUploading(msg));
      onCreate({
        ...prepared,
        x: canvasPos.x - prepared.width / 2,
        y: canvasPos.y - prepared.height / 2,
      });
    } catch (e) {
      console.warn("Canvas media upload failed:", e);
      alert(e.message || "Failed to upload media");
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      clickPosRef.current = toCanvas(e.clientX, e.clientY);
      if (fileInputRef.current) fileInputRef.current.click();
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

  const onDrop = (e) => {
    e.preventDefault();
    setDropHover(false);
    if (tool !== "image") return;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const pos = toCanvas(e.clientX, e.clientY);
    handleFile(file, pos);
  };

  const onDragOver = (e) => {
    if (tool !== "image") return;
    e.preventDefault();
    if (!dropHover) setDropHover(true);
  };

  const onDragLeave = () => setDropHover(false);

  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const pos = clickPosRef.current || { x: 0, y: 0 };
    handleFile(file, pos);
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
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onFilePicked}
      />

      {tool === "image" && !uploading && (
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none ${dropHover ? "bg-[#18A0FB] text-white" : "bg-white/90 text-gray-600 shadow"}`}>
          Click to upload or drag &amp; drop an image / video (max 50MB)
        </div>
      )}

      {uploading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-white shadow-lg text-sm text-gray-700 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-[#18A0FB] border-t-transparent rounded-full animate-spin" />
          {uploading}
        </div>
      )}

      {tool === "image" && dropHover && (
        <div className="absolute inset-3 border-2 border-dashed border-[#18A0FB] rounded-xl bg-[#18A0FB]/5 pointer-events-none" />
      )}

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