import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ArrowRight, Map, Hammer, Users, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function getSlides(project) {
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(project.updated_date)) / (24 * 60 * 60 * 1000)
  );
  const hasCollaborators = (project.collaborator_emails?.length || 0) > 1;
  const isStale = daysSinceUpdate > 7;

  return [
    {
      phase: "Plan",
      icon: Map,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      border: "border-blue-200",
      textColor: "text-blue-700",
      title: "Build a clear roadmap",
      description: "Break your project into milestones with deadlines to keep everyone aligned.",
      actions: [
        "Add 2–3 milestones with target dates",
        "Define the core deliverable per phase",
        "Set a realistic launch date",
      ],
      cta: "Open Milestones",
      ctaPath: `ProjectDetail?id=${project.id}`,
    },
    {
      phase: "Build",
      icon: Hammer,
      color: "from-orange-500 to-amber-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
      textColor: "text-orange-700",
      title: isStale ? `${daysSinceUpdate}d since last update` : "Make progress today",
      description: isStale
        ? "Even a small step keeps momentum alive. Pick one task and do it now."
        : "Keep the build phase strong with focused, daily tasks.",
      actions: [
        "Create or update a task in the board",
        "Upload a work-in-progress asset",
        "Write a short planning note",
      ],
      cta: "Go to Task Board",
      ctaPath: `ProjectDetail?id=${project.id}`,
    },
    {
      phase: "Collaborate",
      icon: Users,
      color: "from-purple-500 to-indigo-500",
      bg: "bg-purple-50",
      border: "border-purple-200",
      textColor: "text-purple-700",
      title: hasCollaborators ? "Keep your team engaged" : "Invite collaborators",
      description: hasCollaborators
        ? "Assign tasks, share updates, and celebrate wins with your team."
        : "The right collaborators can multiply your project's impact.",
      actions: hasCollaborators
        ? [
            "Assign an open task to a team member",
            "Post a status update in team chat",
            "Review a collaborator's recent work",
          ]
        : [
            "Post to the Feed to attract collaborators",
            "Add skills needed to your project",
            "Share your project link with your network",
          ],
      cta: hasCollaborators ? "Open Team Chat" : "View on Feed",
      ctaPath: hasCollaborators ? "Chat" : "Feed",
    },
    {
      phase: "Ship",
      icon: Flag,
      color: "from-green-500 to-emerald-500",
      bg: "bg-green-50",
      border: "border-green-200",
      textColor: "text-green-700",
      title: "Push toward the finish line",
      description: "Define what 'done' looks like and celebrate when you get there.",
      actions: [
        "Add a showcase link (demo, GitHub, video)",
        "Mark completed milestones as done",
        "Update project status to 'Completed'",
      ],
      cta: "Edit Project",
      ctaPath: `EditProject?id=${project.id}`,
    },
  ];
}

export default function ProjectGuidancePanel({ project }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = getSlides(project);
  const current = slides[activeSlide];
  const Icon = current.icon;

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlide(i => (i - 1 + slides.length) % slides.length);
  };
  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlide(i => (i + 1) % slides.length);
  };

  return (
    <div className={`rounded-lg border ${current.border} ${current.bg} overflow-hidden`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
          className="p-3"
        >
          {/* Phase label + title */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded bg-gradient-to-br ${current.color} flex items-center justify-center text-white flex-shrink-0`}>
              <Icon className="w-3 h-3" />
            </div>
            <Badge className={`${current.bg} ${current.textColor} border ${current.border} text-[10px] px-1.5 py-0`}>
              {current.phase}
            </Badge>
            <span className={`text-xs font-semibold ${current.textColor} truncate`}>{current.title}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-600 leading-relaxed mb-2">{current.description}</p>

          {/* Actions */}
          <ul className="space-y-1 mb-3">
            {current.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${current.color} text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5`}>
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link to={createPageUrl(current.ctaPath)} onClick={e => e.stopPropagation()}>
            <Button
              size="sm"
              className={`w-full h-7 text-xs bg-gradient-to-r ${current.color} text-white border-0 hover:opacity-90`}
            >
              {current.cta}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Dot navigation */}
      <div className="flex items-center justify-between px-3 pb-2">
        <button onClick={prev} className="p-0.5 rounded hover:bg-white/60 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSlide(i); }}
              className={`h-1 rounded-full transition-all duration-200 ${i === activeSlide ? `w-4 bg-gray-500` : "w-1.5 bg-gray-300"}`}
            />
          ))}
        </div>
        <button onClick={next} className="p-0.5 rounded hover:bg-white/60 transition-colors">
          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
    </div>
  );
}