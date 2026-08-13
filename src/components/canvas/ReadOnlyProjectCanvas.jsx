import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Share2, MapPin, Users, Heart, Briefcase, GraduationCap, Building, Rocket, Eye, Link as LinkIcon } from "lucide-react";
import { buildFrameDefs } from "./canvasFrameRegistry";
import SkillMatchBadge from "../project/SkillMatchBadge";
import SocialsPanel from "../SocialsPanel";
import ProjectFundingCard from "../ProjectFundingCard";
import MicrolinkPreview from "../MicrolinkPreview";
import HorizontalScrollContainer from "../HorizontalScrollContainer";

const categoryIcons = {
  educational: GraduationCap,
  career_development: Briefcase,
  hobby: Heart,
  business: Building,
  nonprofit: Users,
  startup: Rocket,
};

const statusColors = {
  seeking_collaborators: "text-orange-600 bg-orange-100",
  in_progress: "text-blue-600 bg-blue-100",
  completed: "text-green-600 bg-green-100",
};

// A read-only, advertisement-style glimpse of a project for non-collaborators.
// Shows the project hero, showcase links, a read-only canvas of workspace
// components, plus socials and funding — all without edit capabilities.
export default function ReadOnlyProjectCanvas({
  project, currentUser, projectUsers, projectOwnerProfile,
  canApply, onApply, onShare,
}) {
  const defs = useMemo(() => buildFrameDefs({
    project, currentUser, projectUsers, projectOwnerProfile,
    isOwner: false, isCollaborator: false, onProjectUpdate: () => {},
    refreshTasks: () => {}, refreshMilestones: () => {}, navigateToFrame: () => {},
    tasks: [], milestones: [], assets: [],
  }), [project, currentUser, projectUsers, projectOwnerProfile]);

  // Skip interactive/edit-only frames for the read-only glimpse.
  const visibleDefs = defs.filter((d) => d.id !== "assistant" && d.id !== "scratchpad");
  const CategoryIcon = categoryIcons[project?.classification] || Building;
  const statusClass = statusColors[project?.status] || "text-gray-600 bg-gray-100";
  const isExplicitCollaborator = currentUser && project?.collaborator_emails?.includes(currentUser.email);
  const urls = (project?.project_urls || []).map((l) => (typeof l === "object" ? l : { url: l, title: "" }));

  return (
    <div className="cu-container cu-page">
      {/* Action bar */}
      <div className="flex items-center justify-end mb-4 sm:mb-6 gap-2 sm:gap-3">
        {canApply && (
          <Button onClick={onApply} className="cu-button text-sm" size="sm">
            <UserPlus className="w-4 h-4 mr-1 sm:mr-2" /> Apply to Join
          </Button>
        )}
        <Button variant="ghost" onClick={onShare} className="flex items-center text-sm hover:bg-transparent" size="sm">
          <Share2 className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      {/* Hero */}
      <Card className="cu-card overflow-hidden mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {project?.logo_url ? (
                <img src={project.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <CategoryIcon className="w-6 h-6 sm:w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-words">{project?.title}</h1>
              <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Badge className={`${statusClass} text-xs sm:text-sm px-2 sm:px-3 py-1`}>{project?.status?.replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="text-xs sm:text-sm">{project?.project_type}</Badge>
                <Badge variant="outline" className="text-xs sm:text-sm">{project?.classification?.replace(/_/g, " ")}</Badge>
                {project?.is_visible_on_feed && (
                  <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm flex items-center">
                    <UserPlus className="w-3 h-3 mr-1" /> Open for Collaboration
                  </Badge>
                )}
                {currentUser && !isExplicitCollaborator && <SkillMatchBadge currentUser={currentUser} project={project} />}
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{project?.description}</p>
              {project?.area_of_interest && (
                <div className="flex items-center mt-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{project.area_of_interest}</span>
                  {project?.location && <><span className="mx-2">•</span><span>{project.location}</span></>}
                </div>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            {project?.skills_needed?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Skills Needed</h3>
                <div className="flex flex-wrap gap-2">
                  {project.skills_needed.map((s, i) => <Badge key={i} variant="secondary" className="text-xs sm:text-sm">{s}</Badge>)}
                </div>
              </div>
            )}
            {project?.tools_needed?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Tools Needed</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tools_needed.map((t, i) => <Badge key={i} variant="outline" className="text-xs sm:text-sm">{t}</Badge>)}
                </div>
              </div>
            )}
          </div>

          {projectUsers?.length > 0 && (
            <div className="mt-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base flex items-center">
                <Users className="w-4 h-4 mr-2 text-purple-600" /> Team Members ({projectUsers.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {projectUsers.slice(0, 10).map((u) => (
                  <Link key={u.email} to={createPageUrl(`UserProfile?username=${u.username}`)} className="group">
                    <div className="flex flex-col items-center space-y-1">
                      <Avatar className="h-10 w-10 ring-2 ring-white group-hover:ring-purple-200 transition-all">
                        <AvatarImage src={u.profile_image} />
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-600">{u.full_name?.[0] || u.email?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600 group-hover:text-purple-600 max-w-[80px] truncate text-center">{u.full_name || u.email}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Showcase */}
      {urls.length > 0 && (
        <Card className="cu-card mb-6">
          <CardContent className="p-4 sm:p-6">
            <h3 className="flex items-center text-base sm:text-lg font-semibold text-gray-900 mb-4">
              <LinkIcon className="w-5 h-5 mr-2 text-purple-600" /> Showcase
            </h3>
            {urls.length === 1 ? (
              <MicrolinkPreview url={urls[0].url} title={urls[0].title} className="w-full max-w-md mx-auto" />
            ) : (
              <HorizontalScrollContainer className="pb-2" showArrows={urls.length > 1}>
                {urls.map((l, i) => (
                  <MicrolinkPreview key={i} url={l.url} title={l.title || ""} className="flex-shrink-0 w-[280px] sm:w-[320px]" />
                ))}
              </HorizontalScrollContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* A read-only glimpse of the workspace canvas */}
      <div className="mb-3 flex items-center gap-2">
        <Eye className="w-4 h-4 text-purple-600" />
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">A glimpse inside the workspace</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {visibleDefs.map((d) => {
          const Icon = d.icon;
          return (
            <Card key={d.id} className="cu-card overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <Icon className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-gray-800">{d.title}</span>
              </div>
              <div className="flex-1 min-h-0 max-h-[420px] overflow-auto p-3" data-canvas-scroll="true">
                {d.render()}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Socials & Funding (read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <SocialsPanel
          socialLinks={project?.social_links || {}}
          onUpdate={() => {}}
          canEdit={false}
          title="Project Social Media"
          emptyMessage=""
        />
        <ProjectFundingCard
          project={project}
          projectOwner={projectOwnerProfile}
          canEdit={false}
          onUpdate={() => {}}
        />
      </div>
    </div>
  );
}