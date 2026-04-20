import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Plus, Tag, MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ClickableImage from "../ClickableImage";

export default function FollowingProjectsList({
  followedProjects,
  isLoadingFollowedProjects,
  isOwner,
  profileUser,
  propCurrentUser,
  displayedFollowed,
  displayedFollowedCount,
  loadMoreFollowed,
  showLessFollowed,
}) {
  if (!followedProjects.length && !isOwner && !isLoadingFollowedProjects) return null;

  return (
    <Card className="cu-card">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="flex items-center">
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
            <span>Following ({followedProjects.length})</span>
          </div>
          {!isOwner && followedProjects.length > 0 && (
            <Badge variant="outline" className="text-xs">Public Projects</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4 sm:space-y-6">
        {isLoadingFollowedProjects ? (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading followed projects...</p>
          </div>
        ) : followedProjects.length > 0 ? (
          <>
            {displayedFollowed.map(project => (
              <Link key={project.id} to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="block group">
                <div className="p-3 sm:p-4 md:p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      {project.logo_url && (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <ClickableImage
                            src={project.logo_url}
                            alt="Project logo"
                            caption={`${project.title} - Project Logo`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base sm:text-lg text-gray-800 group-hover:text-purple-600 transition-colors mb-1">
                          {project.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                      <Badge variant={project.project_type === 'Personal' ? 'default' : 'secondary'} className="text-xs">
                        {project.project_type}
                      </Badge>
                      {!project.is_visible_on_feed && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">Private</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        project.status === 'completed' ? 'border-green-500 text-green-700' :
                        project.status === 'in_progress' ? 'border-blue-500 text-blue-700' :
                        'border-orange-500 text-orange-700'
                      }`}
                    >
                      {project.status?.replace(/_/g, ' ')}
                    </Badge>
                    {project.area_of_interest && (
                      <span className="flex items-center"><Tag className="w-3 h-3 mr-1" />{project.area_of_interest}</span>
                    )}
                    {project.location && (
                      <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{project.location}</span>
                    )}
                    <span className="flex items-center ml-auto">
                      <Clock className="w-3 h-3 mr-1" />
                      {project.created_date ? formatDistanceToNow(new Date(project.created_date)) : 'N/A'} ago
                    </span>
                  </div>
                  {project.skills_needed && project.skills_needed.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                      {project.skills_needed.slice(0, 4).map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                      ))}
                      {project.skills_needed.length > 4 && (
                        <Badge variant="outline" className="text-xs">+{project.skills_needed.length - 4} more</Badge>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {followedProjects.length > 3 && (
              <div className="text-center pt-4 border-t">
                {displayedFollowedCount < followedProjects.length ? (
                  <Button variant="outline" className="w-full" onClick={loadMoreFollowed}>
                    Load More ({followedProjects.length - displayedFollowedCount} remaining)
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={showLessFollowed}>Show Less</Button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <Bookmark className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-500 mb-4">
              {isOwner ? "You're not following any projects yet." : `${profileUser?.full_name || 'This user'} isn't following any public projects yet.`}
            </p>
            {isOwner && (
              <Link to={createPageUrl("Discover")}>
                <Button className="cu-button w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" /> Discover Projects
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}