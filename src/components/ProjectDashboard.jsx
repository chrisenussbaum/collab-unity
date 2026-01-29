import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Folder,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Target,
  ChevronRight,
  Lightbulb
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectDashboard({ projects, currentUser }) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'seeking_collaborators').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  
  // Get projects with incomplete status
  const incompleteProjects = projects.filter(p => 
    (p.status === 'in_progress' || p.status === 'seeking_collaborators') &&
    new Date(p.updated_date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Not updated in 7 days
  ).slice(0, 3);

  const stats = [
    {
      label: "Total Projects",
      value: totalProjects,
      icon: <Folder className="w-5 h-5" />,
      color: "from-purple-500 to-indigo-500"
    },
    {
      label: "Active Projects",
      value: activeProjects,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      label: "Completed",
      value: completedProjects,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "from-green-500 to-emerald-500"
    }
  ];

  if (totalProjects === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Incomplete Projects Alert */}
      {incompleteProjects.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Projects Need Your Attention
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You have {incompleteProjects.length} project{incompleteProjects.length > 1 ? 's' : ''} that haven't been updated recently. Keep the momentum going!
                </p>
                <div className="space-y-2">
                  {incompleteProjects.map(project => (
                    <Link 
                      key={project.id}
                      to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-orange-50 transition-colors border border-orange-100">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {project.logo_url ? (
                            <img 
                              src={project.logo_url} 
                              alt={project.title}
                              className="w-8 h-8 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                              <Lightbulb className="w-4 h-4 text-purple-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">{project.title}</p>
                            <p className="text-xs text-gray-500">
                              Last updated {Math.floor((Date.now() - new Date(project.updated_date)) / (24 * 60 * 60 * 1000))} days ago
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivational Message */}
      {activeProjects > 0 && completedProjects === 0 && (
        <Card className="mt-4 border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">You're on your way! 🎯</p>
                <p className="text-sm text-gray-600">Complete your first project to unlock achievements and build your portfolio.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {completedProjects > 0 && (
        <Card className="mt-4 border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Great work! 🎉</p>
                  <p className="text-sm text-gray-600">You've completed {completedProjects} project{completedProjects > 1 ? 's' : ''}. Keep up the amazing collaboration!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}