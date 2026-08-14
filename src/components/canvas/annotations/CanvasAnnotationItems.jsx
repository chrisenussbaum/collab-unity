import React from "react";
import CanvasDrawing from "./CanvasDrawing";
import CanvasStickyNote from "./CanvasStickyNote";
import CanvasImagePin from "./CanvasImagePin";
import CanvasVideoPin from "./CanvasVideoPin";

// Renders all persisted annotations inside the transformed canvas container.
// - Select (move) tool: annotations are draggable / editable.
// - Erase tool: clicking any annotation deletes it.
// - Other tools: annotations are non-interactive so the creation overlay owns
//   pointer events.
export default function CanvasAnnotationItems({
  annotations, tool, zoom, readOnly,
  selectedAnnoId, onSelect, onUpdate, onDelete,
}) {
  if (readOnly) return null;
  const interactive = tool === "move";
  const erasable = tool === "erase";
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
              erasable={erasable}
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
              erasable={erasable}
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
              erasable={erasable}
              selected={sel}
              onSelect={onSelect}
              onChange={onUpdate}
              onDelete={onDelete}
            />
          );
        }
        if (a.type === "video") {
          return (
            <CanvasVideoPin
              key={a.id}
              anno={a}
              zoom={zoom}
              interactive={interactive}
              erasable={erasable}
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