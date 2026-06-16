import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Briefcase, TrendingUp, Users, Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import OptimizedImage from "@/components/OptimizedImage";
import OptimizedAvatar from "@/components/OptimizedAvatar";

const REASON_CACHE_KEY = "cu_foryou_reasons";
const REASON_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function loadCachedReasons() {
  try {
    const raw = sessionStorage.getItem(REASON_CACHE_KEY);
    if (!raw) return {};
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > REASON_CACHE_TTL) return {};
    return data;
  } catch {
    return {};
  }
}

function saveCachedReasons(data) {
  try {
    sessionStorage.setItem(REASON_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

export default function ForYouSection({ projects, currentUser, userInterests, onApply }) {
  const [reasons, setReasons] = useState(() => loadCachedReasons());
  const [isLoadingReasons, setIsLoadingReasons] = useState(false);

  // Fetch AI reasons for top recommendations (max 4 projects)
  useEffect(() => {
    if (!currentUser || projects.length === 0) return;

    const topProjects = projects.slice(0, 4);
    const missing = topProjects.filter(p => !reasons[p.id]);
    if (missing.length === 0) return;

    const userProfile = {
      skills: currentUser.skills || [],
      interests: currentUser.interests || [],
      tools: currentUser.tools_technologies || [],
      area_of_interest: currentUser.area_of_interest || "",
    };

    setIsLoadingReasons(true);

    base44.integrations.Core.InvokeLLM({
      prompt: `You are a collaboration matchmaker. Given a user profile and a list of projects, write a SHORT (max 12 words) personalized reason why this user should join each project. Be specific about skills or interests that match. Return only a JSON object with project IDs as keys and reason strings as values.

User profile: ${JSON.stringify(userProfile)}

Projects:
${missing.map(p => `ID: ${p.id}
Title: ${p.title}
Skills needed: ${(p.skills_needed || []).join(", ")}
Area: ${p.area_of_interest || ""}
Description: ${p.description?.substring(0, 100) || ""}`).join("\n\n")}`,
      response_json_schema: {
        type: "object",
        additionalProperties: { type: "string" }
      }
    }).then((result) => {
      const newReasons = { ...reasons, ...result };
      setReasons(newReasons);
      saveCachedReasons(newReasons);
    }).catch(() => {
      // silently fail — fallback reasons shown instead
    }).finally(() => setIsLoadingReasons(false));
  }, [projects, currentUser]);

  if (!currentUser || projects.length === 0) return null;

  const statusColors = {
    seeking_collaborators: "border-orange-400",
    in_progress: "border-blue-400",
    completed: "border-green-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">For You</h2>
            {isLoadingReasons && (
              <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            )}
          </div>
          <span className="text-xs text-purple-600 font-medium">Based on your profile</span>
        </div>
        <p className="text-xs text-gray-500 mb-4 ml-10">Projects matched to your skills &amp; interests</p>

        <HorizontalScrollContainer showArrows={projects.length > 2}>
          {projects.slice(0, 6).map((project) => {
            const isInterested = userInterests.has(project.id);
            const borderColor = statusColors[project.status] || "border-purple-300";
            const reason = reasons[project.id];

            return (
              <Link
                key={project.id}
                to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                className="flex-shrink-0 w-[260px] sm:w-[300px] block"
              >
                <Card className={`h-full flex flex-col border-t-4 ${borderColor} bg-white hover:shadow-md transition-shadow cursor-pointer`}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start gap-3">
                      <OptimizedImage
                        src={project.logo_url}
                        alt={project.title}
                        width={40}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge className="text-[10px] bg-purple-600 text-white px-1.5 py-0">
                            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                            {project.matchScore} match pts
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* AI Reason */}
                    <div className="mt-2.5 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 min-h-[36px] flex items-center">
                      {reason ? (
                        <p className="text-xs text-purple-700 italic leading-snug">"{reason}"</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          {project.skills_needed?.length > 0
                            ? `Needs: ${project.skills_needed.slice(0, 2).join(", ")}`
                            : "Matches your interests"}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow pb-2 px-4">
                    {project.collaboratorProfiles?.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                        <div className="flex -space-x-1">
                          {project.collaboratorProfiles.slice(0, 3).map((c) => (
                            <OptimizedAvatar
                              key={c.email}
                              src={c.profile_image}
                              alt={c.full_name}
                              fallback={c.full_name?.[0] || "U"}
                              size="xs"
                              className="w-5 h-5 border border-white"
                            />
                          ))}
                        </div>
                        <span>{project.collaborator_emails?.length || 1} collaborating</span>
                      </div>
                    )}
                    {project.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        <span>{project.location}</span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="px-4 pb-4 pt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApply(project, e); }}
                      className={`w-full text-xs ${isInterested ? "bg-purple-50 border-purple-300 text-purple-700" : ""}`}
                    >
                      <Briefcase className={`w-3.5 h-3.5 mr-1.5 ${isInterested ? "text-purple-600" : ""}`} />
                      {isInterested ? "Applied" : "Apply to Join"}
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </HorizontalScrollContainer>
      </div>
    </motion.div>
  );
}