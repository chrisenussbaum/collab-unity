import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, CheckCircle, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectDashboard({ projects, currentUser }) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "in_progress" || p.status === "seeking_collaborators").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;

  const stats = [
    { label: "Total", value: totalProjects, icon: Folder, color: "from-purple-500 to-indigo-500" },
    { label: "Active", value: activeProjects, icon: TrendingUp, color: "from-blue-500 to-cyan-500" },
    { label: "Completed", value: completedProjects, icon: CheckCircle, color: "from-green-500 to-emerald-500" },
  ];

  if (totalProjects === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 space-y-4"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Motivational banners */}
      {completedProjects > 0 && (
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Great work! 🎉</p>
              <p className="text-xs text-gray-600">You've completed {completedProjects} project{completedProjects > 1 ? "s" : ""}. Keep up the amazing collaboration!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeProjects > 0 && completedProjects === 0 && (
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">You're on your way! 🎯</p>
              <p className="text-xs text-gray-600">Complete your first project to build your portfolio and unlock achievements.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}