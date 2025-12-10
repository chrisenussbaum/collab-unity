import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Lightbulb,
  Users,
  CheckCircle,
  Clock,
  MapPin,
  Building2,
  Tag,
  Eye,
  EyeOff,
  Search,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import ProjectActivityIndicator, { isProjectActive } from "@/components/ProjectActivityIndicator";
import OptimizedImage from "@/components/OptimizedImage";
import OptimizedAvatar from "@/components/OptimizedAvatar";

const formatEnumLabel = (str) => {
  if (!str) return '';
  return str.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function MyProjects({ currentUser, authIsLoading }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("public");
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [collaboratorProfiles, setCollaboratorProfiles] = useState({});

  const queryClient = useQueryClient();

  const { data: projectsData, isLoading: isQueryLoading } = useQuery({
    queryKey: ['my-projects', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return { projects: [], collaboratorProfiles: {} };

      // Fetch both queries in parallel
      const [createdProjects, collaboratingProjects] = await Promise.all([
        base44.entities.Project.filter(
          { created_by: currentUser.email },
          "-created_date"
        ),
        base44.entities.Project.filter(
          { collaborator_emails: { $in: [currentUser.email] } },
          "-created_date"
        )
      ]);

      // Combine and deduplicate projects
      const allUserProjects = [...createdProjects, ...collaboratingProjects];
      const uniqueProjects = allUserProjects.reduce((acc, current) => {
        if (!acc.find(item => item.id === current.id)) {
          acc.push(current);
        }
        return acc;
      }, []);

      // Sort by created_date (most recent first)
      uniqueProjects.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      // Fetch collaborator profiles for all projects
      const allCollaboratorEmails = new Set();
      uniqueProjects.forEach(project => {
        if (project.collaborator_emails) {
          project.collaborator_emails.slice(0, 3).forEach(email => allCollaboratorEmails.add(email));
        }
      });

      let profilesMap = {};
      if (allCollaboratorEmails.size > 0) {
        try {
          const { data: profiles } = await getPublicUserProfiles({ emails: Array.from(allCollaboratorEmails) });
          (profiles || []).forEach(profile => {
            profilesMap[profile.email] = profile;
          });
        } catch (error) {
          console.error("Error fetching collaborator profiles:", error);
        }
      }

      return { projects: uniqueProjects, collaboratorProfiles: profilesMap };
    },
    enabled: !!currentUser && !authIsLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (projectsData && !isQueryLoading) {
      setProjects(projectsData.projects);
      setCollaboratorProfiles(projectsData.collaboratorProfiles);
    }
  }, [projectsData, isQueryLoading]);

  useEffect(() => {
    setIsLoading(isQueryLoading);
  }, [isQueryLoading]);

  const statusConfig = {
    seeking_collaborators: {
      color: "border-orange-500",
      icon: <Users className="w-3 h-3 mr-1 text-orange-500" />,
      label: "Seeking Collaborators"
    },
    in_progress: {
      color: "border-blue-500",
      icon: <Clock className="w-3 h-3 mr-1 text-blue-500" />,
      label: "In Progress"
    },
    completed: {
      color: "border-green-500",
      icon: <CheckCircle className="w-3 h-3 mr-1 text-green-500" />,
      label: "Completed"
    }
  };

  // Filter projects based on search query and active tab
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === "" || 
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.area_of_interest?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.skills_needed && project.skills_needed.some(skill => 
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      ));

    const matchesTab = activeTab === "public" 
      ? project.is_visible_on_feed !== false 
      : project.is_visible_on_feed === false;

    return matchesSearch && matchesTab;
  });

  const publicProjectsCount = projects.filter(p => p.is_visible_on_feed !== false).length;
  const privateProjectsCount = projects.filter(p => p.is_visible_on_feed === false).length;

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await base44.entities.Project.delete(projectToDelete.id);
      
      // Invalidate cache to refetch data
      queryClient.invalidateQueries(['my-projects']);
      
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (authIsLoading || isLoading) {
    return (
      <div className="cu-container py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmationDialog
        isOpen={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDelete?.title}"? This action cannot be undone and will permanently remove all project data, tasks, and discussions.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        onConfirm={handleDeleteProject}
        isDestructive={true}
        isLoading={isDeleting}
      />

      <div className="cu-container py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="public" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Public Projects</span>
                <span className="sm:hidden">Public</span>
                <Badge variant="secondary" className="ml-1">{publicProjectsCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="private" className="flex items-center gap-2">
                <EyeOff className="w-4 h-4" />
                <span className="hidden sm:inline">Private Projects</span>
                <span className="sm:hidden">Private</span>
                <Badge variant="secondary" className="ml-1">{privateProjectsCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              No projects yet
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
              Start your collaboration journey by creating your first project. Share your ideas and find talented collaborators!
            </p>
            <Link to={createPageUrl("CreateProject")}>
              <Button className="cu-button">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </Button>
            </Link>
          </motion.div>
        ) : filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : `You don't have any ${activeTab} projects yet`}
            </p>
            {!searchQuery && activeTab === "public" && (
              <Link to={createPageUrl("CreateProject")} className="inline-block mt-4">
                <Button className="cu-button">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Public Project
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence>
              {filteredProjects.map((project, index) => {
                const config = statusConfig[project.status] || statusConfig.in_progress;
                const isProjectOwner = currentUser && project.created_by === currentUser.email;
                const isCollaborator = currentUser && project.collaborator_emails?.includes(currentUser.email) && !isProjectOwner;
                
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`cu-card overflow-hidden border-t-4 ${config.color} hover:shadow-lg transition-all duration-300 h-full`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-3">
                          <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="flex items-start space-x-3 flex-1 min-w-0">
                            {project.logo_url ? (
                              <OptimizedImage
                                src={project.logo_url} 
                                alt={project.title}
                                width={112}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border-2 border-gray-100 shadow-sm"
                                loading="lazy"
                                fallback={
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center border-2 border-gray-100 shadow-sm">
                                    <Lightbulb className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
                                  </div>
                                }
                              />
                            ) : (
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center border-2 border-gray-100 shadow-sm">
                                <Lightbulb className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
                              </div>
                            )}
                          </Link>
                          <div className="flex items-center gap-1">
                            {isProjectOwner && (
                              <>
                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                  Owner
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setProjectToDelete(project);
                                  }}
                                  className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  title="Delete project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {isCollaborator && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                Collaborator
                              </Badge>
                            )}
                            {project.is_visible_on_feed === false ? (
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-600 flex items-center gap-1">
                                <EyeOff className="w-3 h-3" />
                                Private
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-green-300 text-green-600 flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Public
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2">
                              {project.title}
                            </h3>
                            <ProjectActivityIndicator 
                              isActive={isProjectActive(project.collaborator_emails, collaboratorProfiles)} 
                              size="sm"
                            />
                          </div>
                        </Link>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className={`text-xs ${config.color} border-current`}>
                            {config.icon}
                            <span className="ml-1">{config.label}</span>
                          </Badge>
                          <Badge className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200">
                            {project.project_type}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                          <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                            {project.description}
                          </p>

                          <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                            {project.location && (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-purple-500" />
                                <span className="truncate">{project.location}</span>
                              </div>
                            )}
                            {project.industry && (
                              <div className="flex items-center">
                                <Building2 className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-500" />
                                <span className="truncate">{formatEnumLabel(project.industry)}</span>
                              </div>
                            )}
                            {project.area_of_interest && (
                              <div className="flex items-center">
                                <Tag className="w-4 h-4 mr-2 flex-shrink-0 text-pink-500" />
                                <span className="truncate">{formatEnumLabel(project.area_of_interest)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-purple-600">
                              {project.collaborator_emails && project.collaborator_emails.length > 0 ? (
                                <div className="flex items-center -space-x-1.5">
                                  {project.collaborator_emails.slice(0, 3).map((email) => {
                                    const profile = collaboratorProfiles[email];
                                    return (
                                      <OptimizedAvatar
                                        key={email}
                                        src={profile?.profile_image}
                                        alt={profile?.full_name || 'Collaborator'}
                                        fallback={profile?.full_name?.[0] || email?.[0] || 'U'}
                                        size="xs"
                                        className="w-6 h-6 border-2 border-white shadow-sm"
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                <Users className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="font-medium ml-1">{project.collaborator_emails?.length || 1} collaborator{(project.collaborator_emails?.length || 1) !== 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {project.skills_needed && project.skills_needed.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                              {project.skills_needed.slice(0, 3).map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {project.skills_needed.length > 3 && (
                                <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">
                                  +{project.skills_needed.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}