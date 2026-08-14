import React, { useEffect, useState } from "react";

const COLORS = ["#FEF3C7", "#FECACA", "#BBF7D0", "#BFDBFE", "#E9D5FF", "#FFFFFF"];

// A draggable, editable sticky-note card.
export default function CanvasStickyNote({ anno, zoom, interactive, erasable, selected, onSelect, onChange, onDelete }) {
  const data = anno.data || {};
  const [text, setText] = useState(data.text || "");
  const [color, setColor] = useState(data.color || "#FEF3C7");

  useEffect(() => {
    setText(data.text || "");
    setColor(data.color || "#FEF3C7");
  }, [anno.id]);

  const commit = (patch) => onChange(anno.id, { data: { ...data, ...patch } });

  const startDrag = (e) => {
    if (erasable) {
      e.stopPropagation();
      onDelete && onDelete(anno.id);
      return;
    }
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
      className="absolute rounded-md shadow-md flex flex-col"
      style={{
        left: anno.x,
        top: anno.y,
        width: anno.width,
        height: anno.height,
        background: color,
        zIndex: anno.z,
        pointerEvents: interactive || erasable ? "auto" : "none",
        cursor: erasable ? "pointer" : "default",
      }}
      onPointerDown={startDrag}
    >
      <div className="flex items-center justify-between px-2 py-1 border-b border-black/5 cursor-move">
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setColor(c); commit({ color: c }); }}
              className="w-3 h-3 rounded-full border border-black/10"
              style={{ background: c }}
              title="Note color"
            />
          ))}
        </div>
        {selected && interactive && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(anno.id); }}
            className="text-red-500 text-sm leading-none px-1"
            title="Delete note"
          >
            ×
          </button>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit({ text })}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Type a note…"
        className="flex-1 w-full resize-none bg-transparent outline-none p-2 text-sm leading-snug"
        style={{ fontSize: data.fontSize || 14 }}
      />
    </div>
  );
}