import React from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Loader, Flag } from "lucide-react";

export default function MilestoneProgress({ milestones }) {
  if (!milestones || milestones.length === 0) return null;

  const total = milestones.length;
  const completed = milestones.filter(m => m.status === "completed").length;
  const inProgress = milestones.filter(m => m.status === "in_progress").length;
  const percent = Math.round((completed / total) * 100);

  // Color logic: near-completion (>=75%) gets a motivating green tint
  const isNearCompletion = percent >= 75 && percent < 100;
  const isComplete = percent === 100;

  const barColor = isComplete
    ? "bg-green-500"
    : isNearCompletion
    ? "bg-emerald-500"
    : "bg-purple-500";

  return (
    <div className={`mt-3 pt-3 border-t border-gray-100 rounded-b-lg px-1 ${isNearCompletion ? "bg-emerald-50/50 -mx-1 px-2 pb-1 rounded-lg" : ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Flag className="w-3 h-3 text-purple-500" />
          <span>Milestones</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {isNearCompletion && (
            <span className="text-emerald-600 font-semibold animate-pulse">Almost there!</span>
          )}
          {isComplete && (
            <span className="text-green-600 font-semibold">All done! 🎉</span>
          )}
          <span className="text-gray-500 font-medium">{completed}/{total}</span>
        </div>
      </div>

      {/* Custom progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Milestone dots for up to 5 milestones */}
      {total <= 6 && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {milestones
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map((m) => (
              <div key={m.id} className="flex items-center gap-0.5" title={m.title}>
                {m.status === "completed" ? (
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                ) : m.status === "in_progress" ? (
                  <Loader className="w-3 h-3 text-blue-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-3 h-3 text-gray-300 flex-shrink-0" />
                )}
                <span className="text-[10px] text-gray-500 truncate max-w-[56px]">{m.title}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}