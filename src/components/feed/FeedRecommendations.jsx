import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, BookOpen, Tv, ChevronRight } from "lucide-react";
import ForYouSection from "@/components/discover/ForYouSection";
import UserCard from "@/components/discover/UserCard";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { getPublicUserProfilesForDiscovery } from "@/functions/getPublicUserProfilesForDiscovery";

export default function FeedRecommendations({
  projects,
  currentUser,
  userInterests,
  onApply,
  collaboratorProfilesMap = {},
}) {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Fetch suggested collaborators
  useEffect(() => {
    if (!currentUser) {
      setIsLoadingUsers(false);
      return;
    }
    let cancelled = false;
    const fetchUsers = async () => {
      try {
        const { data: allUsers } = await getPublicUserProfilesForDiscovery();
        if (cancelled) return;
        const filtered = (allUsers || []).filter(
          (u) => u.email !== currentUser.email && u.id !== currentUser.id
        );
        const scored = filtered.map((u) => ({
          ...u,
          matchScore: calculateUserMatchScore(u, currentUser),
        }));
        scored.sort((a, b) => b.matchScore - a.matchScore);
        setSuggestedUsers(scored.slice(0, 8));
      } catch (e) {
        console.error("Error fetching suggested users:", e);
      } finally {
        if (!cancelled) setIsLoadingUsers(false);
      }
    };
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // Compute recommended projects with match scores
  const recommendedProjects = useMemo(() => {
    if (!currentUser) return [];
    const hasSkills = currentUser.skills?.length > 0;
    const hasTools = currentUser.tools_technologies?.length > 0;
    const hasInterests = currentUser.interests?.length > 0;
    if (!hasSkills && !hasTools && !hasInterests) return [];

    return projects
      .filter((p) => {
        if (p.created_by === currentUser.email) return false;
        if (p.collaborator_emails?.includes(currentUser.email)) return false;
        return true;
      })
      .map((p) => ({
        ...p,
        matchScore: calculateProjectMatchScore(p, currentUser),
        collaboratorProfiles: (p.collaborator_emails || [])
          .slice(0, 3)
          .map((email) => collaboratorProfilesMap[email])
          .filter(Boolean),
      }))
      .filter((p) => p.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  }, [projects, currentUser, collaboratorProfilesMap]);

  if (!currentUser) return null;

  const hasRecommendations = recommendedProjects.length > 0 || suggestedUsers.length > 0;

  return (
    <div className="mb-6 space-y-6">
      {/* Quick links to Learning Hub & News & Entertainment */}
      <div className="flex gap-3">
        <Link to="/LearningHub" className="flex-1">
          <div className="group flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:border-purple-400 transition-all">
            <div className="w-9 h-9 rounded-lg cu-gradient flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-xs sm:text-sm">Learning Hub</p>
              <p className="text-[10px] text-gray-500 hidden sm:block">Courses &amp; videos</p>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-purple-600 ml-auto flex-shrink-0" />
          </div>
        </Link>
        <Link to="/NewsEntertainment" className="flex-1">
          <div className="group flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:border-purple-400 transition-all">
            <div className="w-9 h-9 rounded-lg cu-gradient flex items-center justify-center flex-shrink-0">
              <Tv className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-xs sm:text-sm">News &amp; Entertainment</p>
              <p className="text-[10px] text-gray-500 hidden sm:block">Trending news</p>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-purple-600 ml-auto flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* Recommended Projects — reuses ForYouSection layout */}
      {recommendedProjects.length > 0 && (
        <ForYouSection
          projects={recommendedProjects}
          currentUser={currentUser}
          userInterests={userInterests}
          onApply={onApply}
        />
      )}

      {/* Suggested Collaborators */}
      {suggestedUsers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-200">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Suggested Collaborators</h2>
              </div>
              <span className="text-xs text-indigo-600 font-medium hidden sm:inline">
                Based on your profile
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4 ml-10">
              People with matching skills &amp; interests
            </p>
            <HorizontalScrollContainer showArrows={suggestedUsers.length > 2}>
              {suggestedUsers.map((user, index) => (
                <div key={user.id} className="flex-shrink-0 w-[260px] sm:w-[300px]">
                  <UserCard user={user} currentUser={currentUser} index={index} />
                </div>
              ))}
            </HorizontalScrollContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function calculateProjectMatchScore(project, currentUser) {
  let score = 0;
  const userSkills = currentUser.skills || [];
  const userInterests = currentUser.interests || [];
  const userTools = currentUser.tools_technologies || [];

  if (project.skills_needed && userSkills.length > 0) {
    const matching = project.skills_needed.filter((s) =>
      userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
    );
    score += matching.length * 3;
  }
  if (project.tools_needed && userTools.length > 0) {
    const matching = project.tools_needed.filter((t) =>
      userTools.some((ut) => ut.toLowerCase() === t.toLowerCase())
    );
    score += matching.length * 2;
  }
  if (project.area_of_interest && userInterests.length > 0) {
    const matching = userInterests.filter(
      (i) =>
        project.area_of_interest.toLowerCase().includes(i.toLowerCase()) ||
        i.toLowerCase().includes(project.area_of_interest.toLowerCase())
    );
    score += matching.length * 2;
  }
  if (project.location && currentUser.location) {
    if (
      project.location.toLowerCase().includes(currentUser.location.toLowerCase()) ||
      currentUser.location.toLowerCase().includes(project.location.toLowerCase())
    ) {
      score += 1;
    }
  }
  return score;
}

function calculateUserMatchScore(user, currentUser) {
  let score = 0;
  const cs = currentUser.skills || [];
  const ci = currentUser.interests || [];
  const ct = currentUser.tools_technologies || [];

  if (user.skills && cs.length > 0) {
    const matching = user.skills.filter((s) =>
      cs.some((us) => us.toLowerCase() === s.toLowerCase())
    );
    score += matching.length * 3;
  }
  if (user.tools_technologies && ct.length > 0) {
    const matching = user.tools_technologies.filter((t) =>
      ct.some((ut) => ut.toLowerCase() === t.toLowerCase())
    );
    score += matching.length * 2;
  }
  if (user.interests && ci.length > 0) {
    const matching = user.interests.filter((i) =>
      ci.some((ui) => ui.toLowerCase() === i.toLowerCase())
    );
    score += matching.length * 2;
  }
  if (user.location && currentUser.location) {
    if (
      user.location.toLowerCase().includes(currentUser.location.toLowerCase()) ||
      currentUser.location.toLowerCase().includes(user.location.toLowerCase())
    ) {
      score += 1;
    }
  }
  return score;
}