import React, { useState, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, Briefcase, CheckCircle, ArrowRight, Compass, X, MapPin, Building2, Tag, MessageCircle, Sparkles, Wrench, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function PostOnboardingProjects({ currentUser }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [skippedIds, setSkippedIds] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);
  const [applyDialogProject, setApplyDialogProject] = useState(null);
  const [applyMessage, setApplyMessage] = useState("");

  // Collaborators section
  const [collaborators, setCollaborators] = useState([]);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [startingChatWith, setStartingChatWith] = useState(null);

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

  // Fetch collaborators (project owners) related to applied projects
  useEffect(() => {
    if (appliedIds.size === 0) return;
    const fetchCollaborators = async () => {
      setIsLoadingCollaborators(true);
      try {
        const appliedProjects = projects.filter(p => appliedIds.has(p.id));
        const ownerEmails = [...new Set(appliedProjects.map(p => p.created_by).filter(Boolean))];
        if (ownerEmails.length === 0) return;
        const { data: profiles } = await getPublicUserProfiles({ emails: ownerEmails });
        setCollaborators((profiles || []).filter(u => u.email !== currentUser?.email));
      } catch (e) {
        // silently fail
      } finally {
        setIsLoadingCollaborators(false);
      }
    };
    fetchCollaborators();
  }, [appliedIds]);

  const openApplyDialog = (project) => {
    setApplyDialogProject(project);
    setApplyMessage("");
  };

  const handleApply = async () => {
    if (!applyDialogProject || !applyMessage.trim()) return;
    const project = applyDialogProject;
    setApplyingId(project.id);
    try {
      await base44.entities.ProjectApplication.create({
        project_id: project.id,
        applicant_email: currentUser.email,
        message: applyMessage.trim(),
        status: "pending"
      });

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
      setApplyDialogProject(null);
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

  const handleStartChat = async (user) => {
    if (startingChatWith) return;
    setStartingChatWith(user.email);
    try {
      const [conv1, conv2] = await Promise.all([
        base44.entities.Conversation.filter({ participant_1_email: currentUser.email, participant_2_email: user.email }),
        base44.entities.Conversation.filter({ participant_1_email: user.email, participant_2_email: currentUser.email })
      ]);

      let conversation;
      if (conv1.length > 0) conversation = conv1[0];
      else if (conv2.length > 0) conversation = conv2[0];
      else {
        conversation = await base44.entities.Conversation.create({
          conversation_type: "direct",
          participant_1_email: currentUser.email,
          participant_2_email: user.email,
          last_message: "",
          last_message_time: new Date().toISOString(),
          participant_1_unread_count: 0,
          participant_2_unread_count: 0
        });
      }

      window.location.href = `${createPageUrl("Chat")}?conversation=${conversation.id}`;
    } catch (e) {
      toast.error("Failed to start conversation.");
    } finally {
      setStartingChatWith(null);
    }
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
  const showCollaborators = collaborators.length > 0;

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

      <div className="max-w-5xl mx-auto px-4 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          </div>
        ) : projects.length === 0 ? (
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
            {/* Project Cards */}
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
                      {/* Logo + Title */}
                      <div className="p-4 flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          {project.logo_url ? (
                            <img src={project.logo_url} alt={project.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-bold text-purple-600">{project.title?.[0] || "P"}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{project.title}</h3>
                          </div>
                        </div>

                        {/* Status + Classification Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs border-orange-400 text-orange-600 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Seeking Collaborators
                          </Badge>
                          {project.classification && (
                            <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                              {project.classification.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 line-clamp-3">{project.description}</p>

                        {/* Location / Industry / Area of Interest */}
                        <div className="space-y-1">
                          {project.location && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <MapPin className="w-3.5 h-3.5 text-purple-400" />
                              <span>{project.location}</span>
                            </div>
                          )}
                          {project.industry && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Building2 className="w-3.5 h-3.5 text-purple-400" />
                              <span>{project.industry}</span>
                            </div>
                          )}
                          {project.area_of_interest && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Tag className="w-3.5 h-3.5 text-purple-400" />
                              <span>{project.area_of_interest}</span>
                            </div>
                          )}
                        </div>

                        {/* Skills */}
                        {skillsToShow.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {skillsToShow.map(skill => (
                              <Badge key={skill} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                                {skill}
                              </Badge>
                            ))}
                            {extraSkills > 0 && (
                              <Badge variant="outline" className="text-xs text-gray-500">+{extraSkills}</Badge>
                            )}
                          </div>
                        )}

                        {/* Highlights preview */}
                        {project.highlights && project.highlights.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mb-1.5">
                              <Camera className="w-3 h-3" /> Project Highlights
                            </p>
                            <div className="flex gap-2 overflow-hidden">
                              {project.highlights.slice(0, 2).map((h, i) => (
                                <div key={i} className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  <img
                                    src={h.media_type === 'video' ? h.thumbnail_url : (h.media_url || h.image_url)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Showcase links */}
                        {project.project_urls && project.project_urls.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Showcase</p>
                            <div className="space-y-0.5">
                              {project.project_urls.slice(0, 2).map((link, i) => (
                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-purple-600 hover:underline">
                                  <ArrowRight className="w-3 h-3" />
                                  {link.title || link.url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
                        <div className="flex items-center text-xs text-gray-400 mr-auto gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{project.current_collaborators_count || 1}</span>
                        </div>
                        {!isApplied && (
                          <button onClick={() => handleSkip(project.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Skip">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <Button
                         className={`${isApplied ? "bg-purple-100 text-purple-700 hover:bg-purple-100 cursor-default border border-purple-200" : "cu-button"}`}
                         size="sm"
                         onClick={() => !isApplied && openApplyDialog(project)}
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

            {/* Collaborators Section */}
            <AnimatePresence>
              {showCollaborators && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Meet the Project Owners</h2>
                    <p className="text-gray-500 text-sm">Start a conversation with the owners of projects you've applied to.</p>
                  </div>

                  {isLoadingCollaborators ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {collaborators.map((user, i) => (
                        <motion.div
                          key={user.email}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
                            {/* Cover */}
                            <div className="h-20 bg-gradient-to-r from-purple-500 to-indigo-500 relative">
                              {user.cover_image && <img src={user.cover_image} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="px-5 pb-5 flex flex-col items-center text-center -mt-10">
                              <Avatar className="w-16 h-16 border-4 border-white shadow-md mb-2">
                                <AvatarImage src={user.profile_image} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white font-bold text-lg">
                                  {user.full_name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <p className="font-bold text-gray-900">{user.full_name || 'Anonymous'}</p>
                              {user.username && <p className="text-sm text-gray-500 mb-2">@{user.username}</p>}
                              {user.bio && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{user.bio}</p>}

                              <div className="w-full space-y-1.5 mb-4">
                                {user.skills && user.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 justify-center">
                                    {user.skills.slice(0, 3).map((s, idx) => (
                                      <Badge key={idx} className="text-xs bg-purple-50 border-purple-200 text-purple-700">{s}</Badge>
                                    ))}
                                    {user.skills.length > 3 && <Badge variant="outline" className="text-xs text-gray-500">+{user.skills.length - 3}</Badge>}
                                  </div>
                                )}
                                {user.interests && user.interests.length > 0 && (
                                  <div className="flex flex-wrap gap-1 justify-center">
                                    {user.interests.slice(0, 3).map((s, idx) => (
                                      <Badge key={idx} className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700 flex items-center">
                                        <Sparkles className="w-3 h-3 mr-1" />{s}
                                      </Badge>
                                    ))}
                                    {user.interests.length > 3 && <Badge variant="outline" className="text-xs text-gray-500">+{user.interests.length - 3}</Badge>}
                                  </div>
                                )}
                                {user.tools_technologies && user.tools_technologies.length > 0 && (
                                  <div className="flex flex-wrap gap-1 justify-center">
                                    {user.tools_technologies.slice(0, 3).map((s, idx) => (
                                      <Badge key={idx} className="text-xs bg-blue-50 border-blue-200 text-blue-700 flex items-center">
                                        <Wrench className="w-3 h-3 mr-1" />{s}
                                      </Badge>
                                    ))}
                                    {user.tools_technologies.length > 3 && <Badge variant="outline" className="text-xs text-gray-500">+{user.tools_technologies.length - 3}</Badge>}
                                  </div>
                                )}
                              </div>

                              <Button
                                className="w-full cu-button bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                                size="sm"
                                onClick={() => handleStartChat(user)}
                                disabled={startingChatWith === user.email}
                              >
                                {startingChatWith === user.email ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <><MessageCircle className="w-4 h-4 mr-2" /> Chat</>
                                )}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            {appliedCount > 0
              ? `Applied to ${appliedCount} project${appliedCount !== 1 ? "s" : ""}`
              : "Apply to projects or skip for now"}
          </p>
          <Button onClick={handleFinish} className="cu-button">
            Finish
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}