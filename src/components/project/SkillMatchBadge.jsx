import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

function normalize(str) {
  return (str || "").trim().toLowerCase();
}

/**
 * Computes a skill-match percentage between the current user's profile
 * (skills + tools_technologies) and the project's requirements
 * (skills_needed + tools_needed).
 */
function computeMatchPercentage(user, project) {
  if (!user || !project) return null;

  const userSkills = new Set((user.skills || []).map(normalize).filter(Boolean));
  const userTools = new Set((user.tools_technologies || []).map(normalize).filter(Boolean));

  const neededSkills = (project.skills_needed || []).filter(Boolean);
  const neededTools = (project.tools_needed || []).filter(Boolean);

  const totalRequirements = neededSkills.length + neededTools.length;
  if (totalRequirements === 0) return null;

  const matchedSkills = neededSkills.filter((s) => userSkills.has(normalize(s))).length;
  const matchedTools = neededTools.filter((t) => userTools.has(normalize(t))).length;
  const totalMatched = matchedSkills + matchedTools;

  return Math.round((totalMatched / totalRequirements) * 100);
}

function getMatchStyle(percentage) {
  if (percentage >= 75) return "bg-green-100 text-green-700 border-green-200";
  if (percentage >= 50) return "bg-blue-100 text-blue-700 border-blue-200";
  if (percentage >= 25) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

export default function SkillMatchBadge({ currentUser, project }) {
  const percentage = useMemo(
    () => computeMatchPercentage(currentUser, project),
    [currentUser, project]
  );

  if (percentage === null) return null;

  return (
    <Badge
      variant="outline"
      className={`text-xs sm:text-sm flex items-center gap-1 ${getMatchStyle(percentage)}`}
      title="Based on your profile skills and tools vs. this project's requirements"
    >
      <Sparkles className="w-3 h-3" />
      {percentage}% Skill Match
    </Badge>
  );
}