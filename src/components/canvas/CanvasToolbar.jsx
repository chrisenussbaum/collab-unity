import React from "react";
import {
  MousePointer2, Hand, ZoomIn, ZoomOut, Maximize, Plus, LayoutGrid,
  Pencil, StickyNote, Image as ImageIcon, Eraser,
} from "lucide-react";

const DRAW_COLORS = ["#18A0FB", "#111827", "#EF4444", "#22C55E", "#F59E0B", "#8B5CF6"];

export default function CanvasToolbar({
  tool, setTool, zoom, onZoomIn, onZoomOut, onZoomFit, onOrganize,
  addOpen, setAddOpen, hiddenFrames, onAddFrame, readOnly = false,
  drawColor, setDrawColor,
}) {
  const btn = (active) =>
    `p-1.5 md:p-2 rounded-full ${active ? "bg-[#18A0FB] text-white" : "text-gray-600 hover:bg-gray-100"}`;
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">
      {!readOnly && tool === "draw" && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white border border-gray-200 rounded-full shadow px-2 py-1">
          {DRAW_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setDrawColor(c)}
              className={`w-5 h-5 rounded-full border border-black/10 ${drawColor === c ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
              style={{ background: c }}
              title="Stroke color"
            />
          ))}
        </div>
      )}
      {!readOnly && addOpen && hiddenFrames.length > 0 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-48 max-h-72 overflow-auto">
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Add component</div>
          {hiddenFrames.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => onAddFrame(d.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                <Icon className="w-3.5 h-3.5 text-[#18A0FB]" />
                {d.title}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-1 py-1 md:px-1.5 md:py-1.5">
        <button onClick={() => setTool("move")} className={btn(tool === "move")} title="Move (V)"><MousePointer2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
        <button onClick={() => setTool("hand")} className={btn(tool === "hand")} title="Hand (H)"><Hand className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
        {!readOnly && (
          <>
            <div className="w-px h-4 md:h-5 bg-gray-200 mx-1" />
            <button onClick={() => setTool("draw")} className={btn(tool === "draw")} title="Draw (D)"><Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
            <button onClick={() => setTool("sticky")} className={btn(tool === "sticky")} title="Sticky note (S)"><StickyNote className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
            <button onClick={() => setTool("image")} className={btn(tool === "image")} title="Image (I)"><ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
            <button onClick={() => setTool("erase")} className={btn(tool === "erase")} title="Eraser (E)"><Eraser className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
            <div className="w-px h-4 md:h-5 bg-gray-200 mx-1" />
            <button
              onClick={() => setAddOpen(!addOpen)}
              className={btn(addOpen)}
              title="Add component"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </>
        )}
        <div className="w-px h-4 md:h-5 bg-gray-200 mx-1" />
        <button onClick={onZoomOut} className="p-1.5 md:p-2 rounded-full text-gray-600 hover:bg-gray-100" title="Zoom out"><ZoomOut className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
        <span className="text-[11px] md:text-xs text-gray-500 w-7 md:w-9 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={onZoomIn} className="p-1.5 md:p-2 rounded-full text-gray-600 hover:bg-gray-100" title="Zoom in"><ZoomIn className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
        <button onClick={onZoomFit} className="p-1.5 md:p-2 rounded-full text-gray-600 hover:bg-gray-100" title="Zoom to fit"><Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
        {!readOnly && (
          <>
            <div className="w-px h-4 md:h-5 bg-gray-200 mx-1" />
            <button onClick={onOrganize} className="p-1.5 md:p-2 rounded-full text-gray-600 hover:bg-gray-100" title="Organize components"><LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
          </>
        )}
      </div>
    </div>
  );
}