import React, { useState } from "react";
import { Check, Plus, Wrench, ExternalLink } from "lucide-react";

export default function ToolSuggestionCards({ tools = [], onAddTool }) {
  const [added, setAdded] = useState({});

  const handleAdd = (tool) => {
    if (added[tool.url]) return;
    onAddTool(tool);
    setAdded((prev) => ({ ...prev, [tool.url]: true }));
  };

  if (!tools.length) return null;

  return (
    <div className="space-y-2">
      {tools.map((tool, i) => (
        <div
          key={`${tool.url}-${i}`}
          className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {tool.icon ? (
              <img
                src={tool.icon}
                alt={tool.name}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
            ) : null}
            <Wrench className="w-4 h-4 text-purple-500" style={{ display: tool.icon ? "none" : "block" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{tool.name}</p>
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-purple-600 truncate flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{tool.url.replace(/^https?:\/\//, "")}</span>
            </a>
          </div>
          <button
            onClick={() => handleAdd(tool)}
            disabled={added[tool.url]}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
              added[tool.url]
                ? "bg-green-100 text-green-700 cursor-default"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {added[tool.url] ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {added[tool.url] ? "Added" : "Add"}
          </button>
        </div>
      ))}
    </div>
  );
}