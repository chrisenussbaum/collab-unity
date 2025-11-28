
import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, User } from "@/entities/all";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Lightbulb,
  ArrowLeft,
  Eye,
  Settings,
  Trash2,
  Users,
  MapPin,
  Calendar,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ConfirmationDialog from "../components/ConfirmationDialog";

export default function UserProjects() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profileEmail = searchParams.get("email");

  const [profileUser, setProfileUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    projectId: null,
    isDeleting: false
  });

  const isOwner = currentUser && profileUser && currentUser.email === profileUser.email;

  useEffect(() => {
    const loadPageData = async () => {
      if (!profileEmail) {
        navigate(createPageUrl("Discover"));
        return;
      }

      setIsLoading(true);
      try {
        let me = null;
        try {
            me = await User.me();
            setCurrentUser(me);
        } catch (e) {
            console.log("Viewing as guest");
        }
        
        const { data: profileData } = await getPublicUserProfiles({ emails: [profileEmail] });
        if (!profileData || profileData.length === 0) {
            toast.error("User profile not found.");
            navigate(createPageUrl("Discover"));
            return;
        }
        const foundUser = profileData[0];
        setProfileUser(foundUser);

        const isOwnerView = me && me.email === profileEmail;
        
        let projectFilter;
        if (isOwnerView) {
          // Owner can see all their projects
          projectFilter = { created_by: profileEmail };
        } else {
          // Visitors can only see public projects
          projectFilter = { 
            created_by: profileEmail,
            is_visible_on_feed: true 
          };
        }
        
        const userProjects = await Project.filter(projectFilter, "-created_date");
        setProjects(userProjects);
        
      } catch (error) {
        console.error("Error loading user projects:", error);
        toast.error("Failed to load projects.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, [profileEmail, navigate]);

  const handleDeleteProject = (projectId) => {
    setDeleteConfirm({
      isOpen: true,
      projectId: projectId,
      isDeleting: false
    });
  };

  const confirmDeleteProject = async () => {
    if (!deleteConfirm.projectId) return;

    setDeleteConfirm(prev => ({...prev, isDeleting: true}));
    try {
      await Project.delete(deleteConfirm.projectId);
      toast.success("Project deleted successfully.");
      // Reload projects
      const userProjects = await Project.filter({ created_by: profileEmail }, "-created_date");
      setProjects(userProjects);
    } catch(error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project.");
    } finally {
      setDeleteConfirm({ isOpen: false, projectId: null, isDeleting: false });
    }
  };

  const ProjectCard = ({ project }) => {
    const statusColors = {
      seeking_collaborators: "bg-orange-100 text-orange-800 border-orange-500",
      in_progress: "bg-blue-100 text-blue-800 border-blue-500", 
      completed: "bg-green-100 text-green-800 border-green-500"
    };

    const statusLabels = {
      seeking_collaborators: "Seeking Collaborators",
      in_progress: "In Progress", 
      completed: "Completed"
    };

    const statusColor = statusColors[project.status] || "bg-gray-100 text-gray-800 border-gray-500";
    const statusLabel = statusLabels[project.status] || project.status;

    // Handler to stop navigation when clicking internal buttons
    const handleButtonClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="block group">
            <Card className={`cu-card border-t-4 ${statusColor.split(' ')[2]} h-full flex flex-col group-hover:shadow-xl group-hover:-translate-y-1 transition-all`}>
                <CardHeader className="pb-4 flex-1">
                <div className="flex items-start justify-between mb-3">
                    <Badge className={`text-xs px-2 py-1 ${statusColor.split(' ').slice(0, 2).join(' ')}`}>
                    {statusLabel}
                    </Badge>
                    <Badge 
                    variant={project.project_type === 'Personal' ? 'default' : 'secondary'}
                    className="text-xs"
                    >
                    {project.project_type}
                    </Badge>
                </div>

                <div className="flex items-start space-x-3 mb-3">
                    {project.logo_url && (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={project.logo_url} alt={`${project.title} logo`} className="w-full h-full object-cover" />
                    </div>
                    )}
                    <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600">
                        {project.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3">
                        {project.description}
                    </p>
                    </div>
                </div>

                {project.skills_needed && project.skills_needed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                    {project.skills_needed.slice(0, 4).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                        </Badge>
                    ))}
                    {project.skills_needed.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                        +{project.skills_needed.length - 4} more
                        </Badge>
                    )}
                    </div>
                )}

                <div className="space-y-2">
                    {project.location && (
                    <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-2" />
                        {project.location}
                    </div>
                    )}
                    
                    {project.collaborators_needed && (
                    <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-2" />
                        {project.current_collaborators_count || 0} / {project.collaborators_needed} collaborator{project.collaborators_needed !== 1 ? 's' : ''}
                    </div>
                    )}
                </div>
                </CardHeader>

                <CardContent className="pt-0 mt-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-400">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(project.created_date).toLocaleDateString()}
                    </div>

                    <div className="flex items-center space-x-2">
                    {isOwner && (
                        <>
                        <Link to={createPageUrl(`EditProject?id=${project.id}`)} onClick={handleButtonClick}>
                            <Button size="sm" variant="outline" className="text-xs px-3 py-1">
                            <Settings className="w-3 h-3 mr-1" />
                            Edit
                            </Button>
                        </Link>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs px-3 py-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={(e) => {
                                handleButtonClick(e);
                                handleDeleteProject(project.id);
                            }}
                        >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                        </Button>
                        </>
                    )}
                    </div>
                </div>
                </CardContent>
            </Card>
        </Link>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h3>
          <p className="text-gray-600 mb-6">The user profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(createPageUrl("Discover"))}>
            Go Back to Discover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, projectId: null, isDeleting: false })}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action is permanent and cannot be undone."
        confirmText="Delete Project"
        onConfirm={confirmDeleteProject}
        isLoading={deleteConfirm.isDeleting}
        isDestructive={true}
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center space-x-3">
                {profileUser?.profile_image && (
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profileUser.profile_image} />
                    <AvatarFallback>
                      {profileUser.full_name?.[0] || profileUser.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profileUser?.full_name || 'User'}'s Projects
                  </h1>
                  <p className="text-gray-600">
                    {projects.length} project{projects.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>

            {isOwner && (
              <Link to={createPageUrl("CreateProject")}>
                <Button className="cu-button">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">
                {isOwner ? "You haven't created any projects yet." : "This user hasn't shared any projects yet."}
              </p>
              {isOwner && (
                <Link to={createPageUrl("CreateProject")} className="mt-4 inline-block">
                  <Button className="cu-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <ProjectCard project={project} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
