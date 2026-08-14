import React from "react";

// A draggable image pinned to the canvas.
export default function CanvasImagePin({ anno, zoom, interactive, selected, onSelect, onChange, onDelete }) {
  const data = anno.data || {};

  const startDrag = (e) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelect && onSelect(anno.id);
    const startX = e.clientX, startY = e.clientY;
    const ox = anno.x, oy = anno.y;
    const move = (ev) =>
      onChange(anno.id, { x: ox + (ev.clientX - startX) / zoom, y: oy + (ev.clientY - startY) / zoom });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      className="absolute"
      style={{
        left: anno.x,
        top: anno.y,
        width: anno.width,
        height: anno.height,
        zIndex: anno.z,
        pointerEvents: interactive ? "auto" : "none",
      }}
      onPointerDown={startDrag}
    >
      <img
        src={data.src}
        alt=""
        draggable={false}
        className="w-full h-full object-contain rounded-md bg-white"
        style={{ border: `${data.borderWidth || 2}px solid ${data.borderColor || "#18A0FB"}` }}
      />
      {selected && interactive && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete && onDelete(anno.id); }}
          className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
          title="Delete image"
        >
          ×
        </button>
      )}
    </div>
  );
}