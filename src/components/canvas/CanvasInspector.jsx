import React from "react";
import { EyeOff, ChevronDown, ChevronRight } from "lucide-react";

export default function CanvasInspector({ defs, layout, selectedId, updateFrame }) {
  const def = defs.find((d) => d.id === selectedId);
  const f = selectedId ? layout[selectedId] : null;
  const num = (label, value, onChange, min) => (
    <label className="flex flex-col gap-1">
      <span className="text-gray-400">{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(min ? Math.max(min, Number(e.target.value)) : Number(e.target.value))}
        className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-[#18A0FB]"
      />
    </label>
  );
  return (
    <div className="py-2 text-xs">
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Design</div>
      {!f ? (
        <div className="px-3 py-2 space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-1.5">Page</div>
            <div className="flex items-center gap-2 p-2 border border-gray-200 rounded">
              <div className="w-5 h-5 rounded border border-gray-300" style={{ background: "#F5F5F5" }} />
              <span className="text-gray-500">#F5F5F5</span>
            </div>
          </div>
          <div className="pt-1">
            <div className="text-xs font-semibold text-gray-700 mb-1.5">Styles</div>
            <button className="w-full text-left p-2 border border-dashed border-gray-200 rounded text-gray-400 hover:bg-gray-50">+ Add style</button>
          </div>
          <p className="text-gray-400 text-[11px] leading-relaxed pt-1">
            Select a frame on the canvas to edit its position, size, and visibility.
          </p>
        </div>
      ) : (
        <div className="px-3 py-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-[#18A0FB]/10 flex items-center justify-center">
              {def && (() => { const I = def.icon; return <I className="w-3 h-3 text-[#18A0FB]" />; })()}
            </span>
            <span className="text-xs font-semibold text-gray-700 truncate">{def?.title}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {num("X", f.x, (v) => updateFrame(selectedId, { x: v }))}
            {num("Y", f.y, (v) => updateFrame(selectedId, { y: v }))}
            {num("W", f.w, (v) => updateFrame(selectedId, { w: v }), 280)}
            {num("H", f.h, (v) => updateFrame(selectedId, { h: v }), 220)}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => updateFrame(selectedId, { collapsed: !f.collapsed })}
              className="flex items-center gap-1.5 flex-1 px-2 py-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
            >
              {f.collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {f.collapsed ? "Expand" : "Collapse"}
            </button>
            <button
              onClick={() => updateFrame(selectedId, { hidden: true })}
              className="px-2 py-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
              title="Hide"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}