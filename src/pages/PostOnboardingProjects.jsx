import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Briefcase, CheckCircle, ArrowRight, Compass, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function PostOnboardingProjects({ currentUser }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [skippedIds, setSkippedIds] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);
  const [existingApplicationIds, setExistingApplicationIds] = useState(new Set());

  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [results, applications] = await Promise.all([
          base44.entities.Project.filter(
            { status: "seeking_collaborators", is_visible_on_feed: true },
            "-created_date",
            20
          ),
          base44.entities.ProjectApplication.filter({ applicant_email: currentUser.email })
        ]);

        const existingAppProjectIds = new Set(applications.map(a => a.project_id));
        setExistingApplicationIds(existingAppProjectIds);

        const filtered = results
          .filter(p => p.created_by !== currentUser.email && !existingAppProjectIds.has(p.id))
          .slice(0, 9);
        setProjects(filtered);
      } catch (e) {
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleApply = async (project) => {
    if (applyingId) return;
    setApplyingId(project.id);
    try {
      await base44.entities.ProjectApplication.create({
        project_id: project.id,
        applicant_email: currentUser.email,
        message: "I'm interested in collaborating on this project!",
        status: "pending"
      });

      // Notify project owner
      await base44.entities.Notification.create({
        user_email: project.created_by,
        title: "New Collaboration Request",
        message: `${currentUser.full_name || currentUser.email} wants to join "${project.title}"`,
        type: "project_application",
        related_project_id: project.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        read: false,
        metadata: { applicant_profile_image: currentUser.profile_image }
      });

      setAppliedIds(prev => new Set([...prev, project.id]));
      toast.success(`Applied to "${project.title}"!`);
    } catch (e) {
      toast.error("Failed to apply. Please try again.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleSkip = (projectId) => {
    setSkippedIds(prev => new Set([...prev, projectId]));
  };

  const handleFinish = () => {
    const redirectUrl = sessionStorage.getItem('postOnboardingRedirect');
    if (redirectUrl) {
      sessionStorage.removeItem('postOnboardingRedirect');
      window.location.href = redirectUrl;
    } else {
      window.location.href = createPageUrl("Feed");
    }
  };

  const visibleProjects = projects.filter(p => !skippedIds.has(p.id));
  const appliedCount = appliedIds.size;

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="text-center pt-12 pb-6 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects Looking for You</h1>
        <p className="text-gray-500 text-base max-w-md mx-auto">
          Apply to projects you're interested in — or skip to explore later.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          </div>
        ) : visibleProjects.length === 0 && projects.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Compass className="w-16 h-16 mx-auto text-gray-300" />
            <p className="font-medium text-gray-700 text-lg">No open projects right now</p>
            <p className="text-sm text-gray-500">Head to the Discover page to explore all projects</p>
            <Button onClick={handleFinish} className="cu-button mt-2">
              Go to Feed <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {visibleProjects.map((project, index) => {
                  const isApplied = appliedIds.has(project.id);
                  const isApplying = applyingId === project.id;
                  const skillsToShow = project.skills_needed?.slice(0, 3) || [];
                  const extraSkills = (project.skills_needed?.length || 0) - 3;

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white rounded-2xl border-2 shadow-sm flex flex-col transition-all ${
                        isApplied ? "border-purple-400" : "border-gray-100 hover:border-purple-200 hover:shadow-md"
                      }`}
                    >
                      {/* Card Top */}
                      <div className="p-4 flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          {project.logo_url ? (
                            <img
                              src={project.logo_url}
                              alt={project.title}
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-bold text-purple-600">
                                {project.title?.[0] || "P"}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{project.title}</h3>
                            {isApplied && (
                              <Badge className="bg-purple-100 text-purple-700 border-0 text-xs mt-1">
                                <CheckCircle className="w-3 h-3 mr-1" /> Applied
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>

                        <div className="flex flex-wrap gap-1.5">
                          {project.area_of_interest && (
                            <Badge className="bg-purple-50 text-purple-700 border-0 text-xs">
                              {project.area_of_interest}
                            </Badge>
                          )}
                          {skillsToShow.map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs text-gray-600">
                              {skill}
                            </Badge>
                          ))}
                          {extraSkills > 0 && (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              +{extraSkills}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom */}
                      <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
                        {!isApplied && (
                          <button
                            onClick={() => handleSkip(project.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Skip"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <Button
                          className={`flex-1 ${isApplied ? "bg-purple-100 text-purple-700 hover:bg-purple-100 cursor-default" : "cu-button"}`}
                          size="sm"
                          onClick={() => !isApplied && handleApply(project)}
                          disabled={isApplying || isApplied}
                        >
                          {isApplying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isApplied ? (
                            <><CheckCircle className="w-4 h-4 mr-1" /> Applied</>
                          ) : (
                            <><Briefcase className="w-4 h-4 mr-1" /> Apply</>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* All skipped/applied */}
            {visibleProjects.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto text-purple-400 mb-3" />
                <p className="text-gray-700 font-medium">You've reviewed all projects!</p>
                {appliedCount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">Applied to {appliedCount} project{appliedCount !== 1 ? "s" : ""}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            {appliedCount > 0
              ? `Applied to ${appliedCount} project${appliedCount !== 1 ? "s" : ""}`
              : "Skip projects you're not interested in"}
          </p>
          <Button onClick={handleFinish} className="cu-button">
            {appliedCount > 0 ? "Continue to Feed" : "Skip for now"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}