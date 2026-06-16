import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X, FileUp, CheckSquare, UserPlus, MessageSquare, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "cu_last_visit_myprojects";

const ACTION_ICONS = {
  asset_uploaded: FileUp,
  asset_updated: FileUp,
  task_completed: CheckSquare,
  task_created: CheckSquare,
  member_added: UserPlus,
  comment_posted: MessageSquare,
  milestone_completed: Star,
};

const ACTION_LABELS = {
  asset_uploaded: "file uploaded",
  asset_updated: "file updated",
  task_completed: "task completed",
  task_created: "task created",
  member_added: "new member joined",
  comment_posted: "comment posted",
  milestone_completed: "milestone completed",
};

export default function WhileYouWereAway({ projectId }) {
  const [summary, setSummary] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const storageKey = `${STORAGE_KEY}_${projectId}`;
    const lastVisit = localStorage.getItem(storageKey);
    const now = new Date().toISOString();

    // Save current visit time immediately
    localStorage.setItem(storageKey, now);

    if (!lastVisit) return; // First visit — no "while you were away" to show

    const since = new Date(lastVisit);
    const hoursSince = (Date.now() - since.getTime()) / (1000 * 60 * 60);

    // Only show if last visit was more than 1 hour ago
    if (hoursSince < 1) return;

    base44.entities.ActivityLog.filter(
      { project_id: projectId },
      "-created_date",
      50
    ).then((logs) => {
      const recent = logs.filter(l => new Date(l.created_date) > since);
      if (recent.length === 0) return;

      // Aggregate by action_type
      const counts = {};
      recent.forEach(log => {
        const key = log.action_type;
        counts[key] = (counts[key] || 0) + 1;
      });

      // Build human-readable items, max 3
      const items = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type, count]) => ({
          type,
          count,
          label: ACTION_LABELS[type] || type.replace(/_/g, " "),
          Icon: ACTION_ICONS[type] || Bell,
        }));

      setSummary({ items, total: recent.length, since });
    }).catch(() => {});
  }, [projectId]);

  if (!summary || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mb-4 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">While you were away</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {summary.items.map(({ type, count, label, Icon }) => (
                  <span key={type} className="flex items-center gap-1 text-xs text-gray-600">
                    <Icon className="w-3 h-3 text-purple-500" />
                    <span className="font-medium text-gray-800">{count}</span> {count === 1 ? label : label + "s"}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}