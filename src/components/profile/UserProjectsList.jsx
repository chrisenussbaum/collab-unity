import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, MapPin, Tag, Clock, Camera, Play, Globe, ExternalLink, Link as LinkIcon } from "lucide-react";
import ClickableImage from "../ClickableImage";
import { formatDistanceToNow } from "date-fns";

export default function UserProjectsList({
  userProjects,
  displayedProjects,
  displayedProjectsCount,
  isOwner,
  propCurrentUser,
  profileUser,
  loadMoreProjects,
  showLessProjects,
}) {
  return (
    <Card className="cu-card">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
          <div className="flex items-center">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
            <span>Projects ({userProjects.length})</span>
          </div>
          {!isOwner && userProjects.length > 0 && (
            <Badge variant="outline" className="text-xs w-fit">
              {userProjects.filter(p => p.is_visible_on_feed).length} Public
              {propCurrentUser && userProjects.filter(p => !p.is_visible_on_feed && p.collaborator_emails?.includes(propCurrentUser.email)).length > 0 &&
                ` • ${userProjects.filter(p => !p.is_visible_on_feed && p.collaborator_emails?.includes(propCurrentUser.email)).length} Shared`
              }
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4 sm:space-y-6">
        {userProjects.length > 0 ? (
          <>
            {displayedProjects.map(project => {
              const isProjectOwner = propCurrentUser && project.created_by === propCurrentUser.email;
              const isProjectCollaborator = propCurrentUser && project.collaborator_emails?.includes(propCurrentUser.email) && !isProjectOwner;
              const isPublicProject = project.is_visible_on_feed;
              const highlights = project.highlights || [];
              const projectUrls = project.project_urls || [];
              const hasRichMedia = highlights.length > 0 || projectUrls.length > 0;

              return (
                <div key={project.id} className="border rounded-lg hover:bg-gray-50 transition-colors overflow-hidden">
                  <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="block group">
                    <div className="p-3 sm:p-4 md:p-6">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                          {project.logo_url && (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <ClickableImage src={project.logo_url} alt="Project logo" caption={`${project.title} - Project Logo`} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base sm:text-lg text-gray-800 group-hover:text-purple-600 transition-colors mb-1">{project.title}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">{project.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0 ml-2 sm:ml-4">
                          <Badge variant={project.project_type === 'Personal' ? 'default' : 'secondary'} className="text-xs">{project.project_type}</Badge>
                          {isProjectOwner && <Badge className="bg-purple-100 text-purple-800 text-xs">Owner</Badge>}
                          {isProjectCollaborator && <Badge className="bg-blue-100 text-blue-800 text-xs">Collaborator</Badge>}
                          {!isPublicProject && <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">Private</Badge>}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          <Badge variant="outline" className={`text-xs ${project.status === 'completed' ? 'border-green-500 text-green-700' : project.status === 'in_progress' ? 'border-blue-500 text-blue-700' : 'border-orange-500 text-orange-700'}`}>
                            {project.status?.replace(/_/g, ' ')}
                          </Badge>
                          {project.area_of_interest && <span className="flex items-center"><Tag className="w-3 h-3 mr-1" /><span className="truncate max-w-20 sm:max-w-none">{project.area_of_interest}</span></span>}
                          {project.location && <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /><span className="truncate max-w-20 sm:max-w-none">{project.location}</span></span>}
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {project.created_date ? formatDistanceToNow(new Date(project.created_date)) : 'N/A'} ago
                        </div>
                      </div>

                      {project.skills_needed && project.skills_needed.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 pt-3 border-t border-gray-100">
                          {project.skills_needed.slice(0, 4).map(skill => <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>)}
                          {project.skills_needed.length > 4 && <Badge variant="outline" className="text-xs">+{project.skills_needed.length - 4} more</Badge>}
                        </div>
                      )}
                    </div>
                  </Link>

                  {hasRichMedia && (
                    <div className="border-t bg-gray-50/50 p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
                      {highlights.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Camera className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-medium text-gray-700">Project Highlights</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {highlights.slice(0, 3).map((highlight, idx) => {
                              const mediaUrl = highlight.media_url || highlight.image_url;
                              const mediaType = highlight.media_type || 'image';
                              return (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 group">
                                  {mediaType === 'video' ? (
                                    <div className="relative w-full h-full">
                                      {highlight.thumbnail_url ? <img src={highlight.thumbnail_url} alt={highlight.caption || 'Video'} className="w-full h-full object-cover" /> : <video src={mediaUrl} className="w-full h-full object-cover" />}
                                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Play className="w-8 h-8 text-white" /></div>
                                    </div>
                                  ) : (
                                    <img src={mediaUrl} alt={highlight.caption || 'Highlight'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  )}
                                </div>
                              );
                            })}
                            {highlights.length > 3 && (
                              <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="aspect-video rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                                <span className="text-sm font-medium text-gray-600">+{highlights.length - 3} more</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      )}

                      {projectUrls.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <LinkIcon className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-medium text-gray-700">Showcase</span>
                          </div>
                          <div className="space-y-2">
                            {projectUrls.slice(0, 2).map((link, idx) => (
                              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded-lg bg-white border hover:border-purple-300 hover:shadow-sm transition-all group" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                    <Globe className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 truncate group-hover:text-purple-600">{link.title || link.url}</span>
                                </div>
                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-purple-600 flex-shrink-0 ml-2" />
                              </a>
                            ))}
                            {projectUrls.length > 2 && (
                              <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                                <span className="text-xs font-medium text-gray-600">View all {projectUrls.length} links</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {userProjects.length > 3 && (
              <div className="text-center pt-4 sm:pt-6 border-t">
                {displayedProjectsCount < userProjects.length ? (
                  <Button variant="outline" className="w-full" onClick={loadMoreProjects}>
                    Load More Projects ({userProjects.length - displayedProjectsCount} remaining)
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={showLessProjects}>Show Less</Button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-sm sm:text-base text-gray-500 mb-4">
              {isOwner ? "You haven't created any projects yet." : `${profileUser?.full_name || 'This user'} hasn't shared any ${propCurrentUser ? 'visible' : 'public'} projects yet.`}
            </p>
            {isOwner && (
              <Link to={createPageUrl("CreateProject")}>
                <Button className="cu-button w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />Create Your First Project
                </Button>
              </Link>
            )}
            {!isOwner && !propCurrentUser && <p className="text-xs sm:text-sm text-gray-400 mt-2">Sign in to see projects you might be collaborating on.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}