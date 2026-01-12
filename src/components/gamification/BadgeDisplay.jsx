import React from "react";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Users, Zap, Heart, TrendingUp, Target, Crown, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

// Badge definitions
export const BADGES = {
  profile_complete: {
    id: "profile_complete",
    name: "Profile Master",
    icon: Award,
    color: "from-blue-500 to-cyan-500",
    description: "Completed all profile sections"
  },
  first_project: {
    id: "first_project",
    name: "Creator",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    description: "Created your first project"
  },
  five_projects: {
    id: "five_projects",
    name: "Serial Creator",
    icon: Target,
    color: "from-indigo-500 to-purple-500",
    description: "Created 5 projects"
  },
  first_collaboration: {
    id: "first_collaboration",
    name: "Team Player",
    icon: Users,
    color: "from-green-500 to-teal-500",
    description: "Joined your first collaborative project"
  },
  five_collaborations: {
    id: "five_collaborations",
    name: "Collaboration Expert",
    icon: Users,
    color: "from-emerald-500 to-green-500",
    description: "Collaborated on 5 projects"
  },
  ten_endorsements: {
    id: "ten_endorsements",
    name: "Endorsed",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    description: "Received 10 skill endorsements"
  },
  five_reviews: {
    id: "five_reviews",
    name: "Trusted Collaborator",
    icon: Star,
    color: "from-yellow-500 to-orange-500",
    description: "Received 5 positive reviews"
  },
  helpful_reviewer: {
    id: "helpful_reviewer",
    name: "Helpful Reviewer",
    icon: Star,
    color: "from-amber-500 to-yellow-500",
    description: "Gave 5 thoughtful reviews"
  },
  community_supporter: {
    id: "community_supporter",
    name: "Community Supporter",
    icon: Heart,
    color: "from-red-500 to-pink-500",
    description: "Gave 10 endorsements to others"
  },
  inviter: {
    id: "inviter",
    name: "Recruiter",
    icon: Users,
    color: "from-violet-500 to-purple-500",
    description: "Invited 3 users to the platform"
  },
  streak_7: {
    id: "streak_7",
    name: "Dedicated",
    icon: Zap,
    color: "from-orange-500 to-red-500",
    description: "7-day activity streak"
  },
  streak_30: {
    id: "streak_30",
    name: "Unstoppable",
    icon: Crown,
    color: "from-yellow-500 to-amber-500",
    description: "30-day activity streak"
  },
  level_5: {
    id: "level_5",
    name: "Rising Star",
    icon: TrendingUp,
    color: "from-cyan-500 to-blue-500",
    description: "Reached level 5"
  },
  level_10: {
    id: "level_10",
    name: "Veteran",
    icon: Shield,
    color: "from-blue-500 to-indigo-500",
    description: "Reached level 10"
  },
  level_20: {
    id: "level_20",
    name: "Legend",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    description: "Reached level 20"
  }
};

export default function BadgeDisplay({ badges = [], size = "md", showTooltip = true }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badgeId) => {
        const badge = BADGES[badgeId];
        if (!badge) return null;

        const Icon = badge.icon;

        return (
          <motion.div
            key={badgeId}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            className="relative group"
            title={showTooltip ? badge.description : undefined}
          >
            <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg`}>
              <Icon className={`${iconSizes[size]} text-white`} />
            </div>
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                <div className="font-semibold">{badge.name}</div>
                <div className="text-gray-300 text-xs">{badge.description}</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export function LevelBadge({ level, size = "md" }) {
  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-14 h-14 text-sm",
    lg: "w-20 h-20 text-lg"
  };

  const getLevelColor = (lvl) => {
    if (lvl >= 20) return "from-purple-500 to-pink-500";
    if (lvl >= 10) return "from-blue-500 to-indigo-500";
    if (lvl >= 5) return "from-cyan-500 to-blue-500";
    return "from-gray-400 to-gray-500";
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getLevelColor(level)} flex flex-col items-center justify-center shadow-lg text-white font-bold border-2 border-white`}>
      <div className="text-[0.6em] opacity-80">LVL</div>
      <div>{level}</div>
    </div>
  );
}