import React from "react";
import {
  MousePointer2, Hand, ZoomIn, ZoomOut, Maximize, Plus, Frame, Type, Square,
} from "lucide-react";

export default function CanvasToolbar({
  tool, setTool, zoom, onZoomIn, onZoomOut, onZoomFit,
  addOpen, setAddOpen, hiddenFrames, onAddFrame,
}) {
  const btn = (active) =>
    `p-2 rounded-full ${active ? "bg-[#18A0FB] text-white" : "text-gray-600 hover:bg-gray-100"}`;
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">
      {addOpen && hiddenFrames.length > 0 && (
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
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-1.5 py-1.5">
        <button onClick={() => setTool("move")} className={btn(tool === "move")} title="Move (V)"><MousePointer2 className="w-4 h-4" /></button>
        <button onClick={() => setTool("hand")} className={btn(tool === "hand")} title="Hand (H)"><Hand className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button className="p-2 rounded-full text-gray-400 cursor-default" title="Frame"><Frame className="w-4 h-4" /></button>
        <button className="p-2 rounded-full text-gray-400 cursor-default" title="Text"><Type className="w-4 h-4" /></button>
        <button className="p-2 rounded-full text-gray-400 cursor-default" title="Shape"><Square className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button
          onClick={() => setAddOpen(!addOpen)}
          className={btn(addOpen)}
          title="Add component"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button onClick={onZoomOut} className="p-2 rounded-full text-gray-600 hover:bg-gray-100" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
        <span className="text-xs text-gray-500 w-9 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={onZoomIn} className="p-2 rounded-full text-gray-600 hover:bg-gray-100" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
        <button onClick={onZoomFit} className="p-2 rounded-full text-gray-600 hover:bg-gray-100" title="Zoom to fit"><Maximize className="w-4 h-4" /></button>
      </div>
    </div>
  );
}