import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Folder,
  CheckCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Target,
  Hammer,
  Map,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
  ListTodo,
  Flag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Generate personalized suggestions for a project
function getProjectSuggestions(project) {
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(project.updated_date)) / (24 * 60 * 60 * 1000)
  );
  const hasCollaborators = (project.collaborator_emails?.length || 0) > 1;
  const isStale = daysSinceUpdate > 7;

  const suggestions = [];

  // Plan phase
  suggestions.push({
    phase: "Plan",
    icon: Map,
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    textColor: "text-blue-700",
    title: "Build a clear roadmap",
    description: "Break your project into milestones with deadlines. A structured plan keeps everyone aligned and motivated.",
    actions: [
      "Add 2–3 milestones with target dates",
      "Define the core deliverable for each phase",
      "Set a realistic launch or completion date"
    ],
    cta: "Open Workspace → Milestones",
    ctaPath: `ProjectDetail?id=${project.id}`
  });

  // Build phase
  suggestions.push({
    phase: "Build",
    icon: Hammer,
    color: "from-orange-500 to-amber-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    textColor: "text-orange-700",
    title: "Make progress today",
    description: isStale
      ? `This project hasn't been updated in ${daysSinceUpdate} days. Even small steps keep momentum alive.`
      : "Keep the build phase going strong with focused tasks.",
    actions: [
      "Create or update a task in the task board",
      "Upload a work-in-progress file or asset",
      "Write a short planning note on your progress"
    ],
    cta: "Go to Task Board",
    ctaPath: `ProjectDetail?id=${project.id}`
  });

  // Collaborate phase
  suggestions.push({
    phase: "Collaborate",
    icon: Users,
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
    textColor: "text-purple-700",
    title: hasCollaborators ? "Keep your team engaged" : "Invite collaborators",
    description: hasCollaborators
      ? "Your team is stronger together. Assign tasks, share updates, and celebrate wins."
      : "Solo projects are great, but the right collaborators can multiply your impact.",
    actions: hasCollaborators
      ? [
          "Assign an open task to a team member",
          "Post a status update in the team discussion",
          "Leave a comment on a collaborator's recent work"
        ]
      : [
          "Post your project to the Feed to attract collaborators",
          "Add the skills you need to make it easier to find help",
          "Share your project link with someone in your network"
        ],
    cta: hasCollaborators ? "Open Team Chat" : "View on Feed",
    ctaPath: hasCollaborators ? `Chat` : `Feed`
  });

  // Finish / Ship phase
  suggestions.push({
    phase: "Ship",
    icon: Flag,
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-50",
    border: "border-green-200",
    textColor: "text-green-700",
    title: "Push toward the finish line",
    description: "Every project deserves a proper launch. Define what 'done' looks like and celebrate when you get there.",
    actions: [
      "Add a showcase link (live demo, GitHub, video)",
      "Mark completed milestones as done",
      "Update project status to 'Completed' when ready"
    ],
    cta: "Edit Project Details",
    ctaPath: `EditProject?id=${project.id}`
  });

  return suggestions;
}

function ProjectAccordionCard({ project }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const suggestions = getProjectSuggestions(project);
  const current = suggestions[activeSlide];
  const Icon = current.icon;
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(project.updated_date)) / (24 * 60 * 60 * 1000)
  );

  const prev = () => setActiveSlide(i => (i - 1 + suggestions.length) % suggestions.length);
  const next = () => setActiveSlide(i => (i + 1) % suggestions.length);

  return (
    <Card className={`border ${current.border} overflow-hidden transition-all duration-300`}>
      {/* Header — always visible, clickable to expand */}
      <button
        className="w-full text-left"
        onClick={() => setIsExpanded(e => !e)}
      >
        <div className="flex items-center justify-between p-4 gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {project.logo_url ? (
              <img
                src={project.logo_url}
                alt={project.title}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-purple-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{project.title}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysSinceUpdate === 0 ? "Updated today" : `Updated ${daysSinceUpdate}d ago`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`${current.bg} ${current.textColor} border-0 text-xs font-medium`}>
              {current.phase}
            </Badge>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.div>
          </div>
        </div>
      </button>

      {/* Expanded accordion content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={`${current.bg} border-t ${current.border}`}>
              {/* Slide content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${current.color} flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${current.textColor}`}>{current.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{current.description}</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 mb-4 pl-1">
                    {current.actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${current.color} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5`}>
                          {i + 1}
                        </span>
                        {action}
                      </li>
                    ))}
                  </ul>

                  <Link to={createPageUrl(current.ctaPath)}>
                    <Button size="sm" className={`w-full text-xs font-medium bg-gradient-to-r ${current.color} text-white border-0 hover:opacity-90`}>
                      {current.cta}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </motion.div>
              </AnimatePresence>

              {/* Slide navigation */}
              <div className="flex items-center justify-between px-4 pb-3">
                <button onClick={prev} className="p-1 rounded-full hover:bg-white/60 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <div className="flex gap-1.5">
                  {suggestions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeSlide ? "bg-gray-600 w-3" : "bg-gray-300"}`}
                    />
                  ))}
                </div>
                <button onClick={next} className="p-1 rounded-full hover:bg-white/60 transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function ProjectDashboard({ projects, currentUser }) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "in_progress" || p.status === "seeking_collaborators").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;

  // Projects needing attention (stale active projects)
  const staleProjects = projects.filter(p =>
    (p.status === "in_progress" || p.status === "seeking_collaborators") &&
    new Date(p.updated_date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  // For accordion: show all active projects sorted by staleness
  const activeProjectsSorted = projects
    .filter(p => p.status === "in_progress" || p.status === "seeking_collaborators")
    .sort((a, b) => new Date(a.updated_date) - new Date(b.updated_date));

  const stats = [
    { label: "Total", value: totalProjects, icon: Folder, color: "from-purple-500 to-indigo-500" },
    { label: "Active", value: activeProjects, icon: TrendingUp, color: "from-blue-500 to-cyan-500" },
    { label: "Completed", value: completedProjects, icon: CheckCircle, color: "from-green-500 to-emerald-500" }
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
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
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

      {/* Personalized Project Guidance — Accordion Cards */}
      {activeProjectsSorted.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-800">Your Project Guidance</h3>
            {staleProjects.length > 0 && (
              <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                {staleProjects.length} need attention
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {activeProjectsSorted.map(project => (
              <ProjectAccordionCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      {/* Completed banner */}
      {completedProjects > 0 && (
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Great work! 🎉</p>
                <p className="text-xs text-gray-600">
                  You've completed {completedProjects} project{completedProjects > 1 ? "s" : ""}. Keep up the amazing work!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* First project motivator */}
      {activeProjects > 0 && completedProjects === 0 && (
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">You're on your way! 🎯</p>
                <p className="text-xs text-gray-600">Complete your first project to build your portfolio and unlock achievements.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}