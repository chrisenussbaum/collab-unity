import React from "react";

// A persisted freehand ink stroke. Points are stored relative to (x, y).
export default function CanvasDrawing({ anno, interactive, selected, onSelect, onDelete }) {
  const data = anno.data || {};
  const points = Array.isArray(data.points) ? data.points : [];
  const color = data.color || "#18A0FB";
  const strokeWidth = data.strokeWidth || 3;
  return (
    <div
      className="absolute"
      style={{
        left: anno.x,
        top: anno.y,
        width: Math.max(anno.width, 1),
        height: Math.max(anno.height, 1),
        zIndex: anno.z,
        pointerEvents: interactive ? "auto" : "none",
      }}
      onPointerDown={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        onSelect && onSelect(anno.id);
      }}
    >
      <svg
        width={Math.max(anno.width, 1)}
        height={Math.max(anno.height, 1)}
        className="overflow-visible"
        style={{ pointerEvents: "none" }}
      >
        <polyline
          points={points.map((p) => `${p[0]},${p[1]}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {selected && interactive && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete && onDelete(anno.id); }}
          className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
          title="Delete stroke"
        >
          ×
        </button>
      )}
    </div>
  );
}