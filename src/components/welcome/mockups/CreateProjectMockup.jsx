import React from "react";
import { Lightbulb, Upload, Pencil, Sparkles } from "lucide-react";

export default function CreateProjectMockup() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md mx-auto shadow-sm">
      <div className="text-center mb-5">
        <h3 className="text-xl font-bold text-gray-900 mb-1">What are you working on?</h3>
        <p className="text-sm text-gray-500">Describe your idea and we'll help you bring it to life.</p>
      </div>

      {/* Textarea */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4 min-h-[100px]">
        <p className="text-sm text-gray-400 leading-relaxed">
          Describe your project idea... e.g. 'A mobile app that helps people track their daily water intake' or 'A community platform for local musicians to collaborate on songs'
        </p>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2">
            <Pencil className="w-3.5 h-3.5" /> Manual
          </button>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#7C6AE8] rounded-lg px-4 py-2">
          <Lightbulb className="w-3.5 h-3.5" /> Generate
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3" /> Press ⌘+⏎ to generate · or use the options above
      </p>
    </div>
  );
}