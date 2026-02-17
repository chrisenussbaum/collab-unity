import React, { useState, useEffect } from "react";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Compass, Users, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function DiscoverProjectsDialog({ isOpen, onClose, currentUser }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const results = await base44.entities.Project.filter(
          { status: "seeking_collaborators", is_visible_on_feed: true },
          "-created_date",
          6
        );
        // Exclude projects the current user already owns
        const filtered = results.filter(p => p.created_by !== currentUser?.email).slice(0, 3);
        setProjects(filtered);
      } catch (e) {
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [isOpen, currentUser]);

  const handleNavigation = (path) => {
    onClose();
    const redirectUrl = sessionStorage.getItem('postOnboardingRedirect');
    if (redirectUrl) {
      sessionStorage.removeItem('postOnboardingRedirect');
      window.location.href = redirectUrl;
    } else {
      window.location.href = path;
    }
  };

  const handleJoinProject = (projectId) => {
    handleNavigation(createPageUrl(`ProjectDetail?id=${projectId}`));
  };

  const handleExploreAll = () => {
    handleNavigation(createPageUrl("Discover"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            Projects Looking for You
          </DialogTitle>
          <DialogDescription className="text-center">
            These projects are actively seeking collaborators right now
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Compass className="w-14 h-14 mx-auto text-gray-300" />
              <div>
                <p className="font-medium text-gray-700">No featured projects yet</p>
                <p className="text-sm text-gray-500 mt-1">Head to Discover to find projects that match your skills</p>
              </div>
              <Button onClick={handleExploreAll} className="cu-button">
                <Compass className="w-4 h-4 mr-2" />
                Explore Discover Page
              </Button>
            </div>
          ) : (
            <>
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start gap-3">
                    {project.logo_url ? (
                      <img
                        src={project.logo_url}
                        alt={project.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-purple-600">
                          {project.title?.[0] || "P"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{project.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {project.area_of_interest && (
                          <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                            {project.area_of_interest}
                          </Badge>
                        )}
                        {project.skills_needed?.slice(0, 2).map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      {project.current_collaborators_count || 1} collaborator{(project.current_collaborators_count || 1) !== 1 ? "s" : ""}
                    </div>
                    <Button
                      size="sm"
                      className="cu-button"
                      onClick={() => handleJoinProject(project.id)}
                    >
                      Join Project
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={handleExploreAll}
              >
                <Compass className="w-4 h-4 mr-2" />
                See All Projects on Discover
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}