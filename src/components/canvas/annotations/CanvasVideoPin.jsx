import React from "react";

// A draggable video pin. Uses a header bar for moving (so the native video
// controls stay usable) and renders the video poster / inline player.
export default function CanvasVideoPin({ anno, zoom, interactive, erasable, selected, onSelect, onChange, onDelete }) {
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

  const onRootPointerDown = (e) => {
    if (erasable) {
      e.stopPropagation();
      onDelete && onDelete(anno.id);
    } else if (interactive) {
      onSelect && onSelect(anno.id);
    }
  };

  return (
    <div
      className="absolute rounded-md overflow-hidden shadow-md bg-black"
      style={{
        left: anno.x,
        top: anno.y,
        width: anno.width,
        height: anno.height + 24,
        zIndex: anno.z,
        pointerEvents: interactive || erasable ? "auto" : "none",
      }}
      onPointerDown={onRootPointerDown}
    >
      <div
        className="flex items-center justify-between px-2 h-6 bg-white/90 border-b border-gray-200 cursor-move"
        onPointerDown={startDrag}
      >
        <span className="text-[10px] text-gray-500 truncate">Video</span>
        {selected && interactive && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(anno.id); }}
            className="text-red-500 text-sm leading-none px-1"
            title="Delete video"
          >
            ×
          </button>
        )}
      </div>
      <video
        src={data.src}
        poster={data.thumbnail_url}
        controls
        playsInline
        className="w-full bg-black"
        style={{ height: anno.height, pointerEvents: erasable ? "none" : "auto" }}
      />
    </div>
  );
}