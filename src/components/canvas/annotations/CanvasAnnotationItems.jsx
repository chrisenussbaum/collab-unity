import React from "react";
import CanvasDrawing from "./CanvasDrawing";
import CanvasStickyNote from "./CanvasStickyNote";
import CanvasImagePin from "./CanvasImagePin";

// Renders all persisted annotations inside the transformed canvas container.
// Annotations are only interactive in the Select (move) tool so the creation
// overlay can own pointer events in draw/sticky/image modes.
export default function CanvasAnnotationItems({
  annotations, tool, zoom, readOnly,
  selectedAnnoId, onSelect, onUpdate, onDelete,
}) {
  if (readOnly) return null;
  const interactive = tool === "move";
  return (
    <>
      {annotations.map((a) => {
        const sel = selectedAnnoId === a.id;
        if (a.type === "draw") {
          return (
            <CanvasDrawing
              key={a.id}
              anno={a}
              interactive={interactive}
              selected={sel}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          );
        }
        if (a.type === "sticky") {
          return (
            <CanvasStickyNote
              key={a.id}
              anno={a}
              zoom={zoom}
              interactive={interactive}
              selected={sel}
              onSelect={onSelect}
              onChange={onUpdate}
              onDelete={onDelete}
            />
          );
        }
        if (a.type === "image") {
          return (
            <CanvasImagePin
              key={a.id}
              anno={a}
              zoom={zoom}
              interactive={interactive}
              selected={sel}
              onSelect={onSelect}
              onChange={onUpdate}
              onDelete={onDelete}
            />
          );
        }
        return null;
      })}
    </>
  );
}