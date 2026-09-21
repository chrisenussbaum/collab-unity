import React from "react";
import { Lightbulb } from "lucide-react";

/**
 * Shows the user's level-based active project slots:
 * e.g. "2 of 3 active project slots used" with a gradient segment bar.
 */
export default function ProjectSlotMeter({ slotInfo }) {
  if (!slotInfo || typeof slotInfo.capacity !== "number") return null;

  const used = Math.min(slotInfo.activeCount || 0, slotInfo.capacity);
  const free = Math.max(0, slotInfo.capacity - used);

  return (
    <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg cu-gradient flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {used} of {slotInfo.capacity} active project slots used
          </span>
        </div>
        <span className="text-xs font-medium text-purple-600 flex-shrink-0">
          Level {slotInfo.level || 1}
        </span>
      </div>

      <div className="flex gap-1.5">
        {[...Array(slotInfo.capacity)].map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${i < used ? "cu-gradient" : "bg-gray-100"}`}
          />
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
        {free > 0
          ? `You can start ${free} more project${free !== 1 ? "s" : ""}. Completing a project frees its slot — finishing is how you level up and unlock more.`
          : "All slots are in use. Complete a project to free a slot, or join someone else's project — collaborating is unlimited."}
      </p>
    </div>
  );
}