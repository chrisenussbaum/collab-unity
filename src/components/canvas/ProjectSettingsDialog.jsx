import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Settings, Info, Users, Briefcase, DollarSign, Heart, Link2, Pencil, ChevronDown, ChevronRight,
} from "lucide-react";
import ProjectDetailsFrame from "./ProjectDetailsFrame";
import ProjectFundingCard from "../ProjectFundingCard";
import SocialsPanel from "../SocialsPanel";
import MicrolinkPreview from "../MicrolinkPreview";
import ProjectApplicationsManager from "../ProjectApplicationsManager";
import ProjectMembershipManager from "../ProjectMembershipManager";

const SECTIONS = [
  { id: "details", label: "Project Details", icon: Info },
  { id: "team", label: "Team & Invite", icon: Users },
  { id: "applications", label: "Applications", icon: Briefcase, ownerOnly: true },
  { id: "funding", label: "Funding", icon: DollarSign },
  { id: "social", label: "Social Media", icon: Heart },
  { id: "showcase", label: "Showcase Links", icon: Link2 },
];

// One consolidated home for everything that used to be six scattered
// management dialogs on the canvas.
export default function ProjectSettingsDialog({
  open, onOpenChange, project, currentUser, projectUsers, projectOwnerProfile,
  isOwner, isCollaborator, pendingApplicationsCount = 0, onProjectUpdate, onUpdateSocialLinks,
}) {
  const [openSection, setOpenSection] = useState("details");
  const visibleSections = SECTIONS.filter((s) => !s.ownerOnly || isOwner);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#18A0FB]" /> Project Settings
          </DialogTitle>
          <DialogDescription>
            Manage your project's details, team, funding and links — all in one place.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          {visibleSections.map((s) => {
            const Icon = s.icon;
            const isOpen = openSection === s.id;
            return (
              <div key={s.id} className="rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenSection(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Icon className="w-4 h-4 text-[#18A0FB] flex-shrink-0" />
                  <span className="flex-1 text-left">{s.label}</span>
                  {s.id === "applications" && isOwner && pendingApplicationsCount > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                      {pendingApplicationsCount}
                    </span>
                  )}
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 pt-2 border-t border-gray-100">
                    {s.id === "details" && (
                      <>
                        <ProjectDetailsFrame project={project} canEdit={isOwner} ownerProfile={projectOwnerProfile} />
                        {isOwner && (
                          <Link
                            to={createPageUrl(`EditProject?id=${project?.id}`)}
                            className="inline-flex items-center gap-1 text-xs text-[#18A0FB] hover:underline mt-2"
                          >
                            <Pencil className="w-3 h-3" /> Edit project
                          </Link>
                        )}
                      </>
                    )}
                    {s.id === "team" && (
                      <ProjectMembershipManager
                        project={project}
                        currentUser={currentUser}
                        projectUsers={projectUsers}
                        isOwner={isOwner}
                        isExplicitCollaborator={isCollaborator}
                        onUpdate={onProjectUpdate}
                      />
                    )}
                    {s.id === "applications" && (
                      <ProjectApplicationsManager project={project} onProjectUpdate={onProjectUpdate} alwaysShow />
                    )}
                    {s.id === "funding" && (
                      <ProjectFundingCard
                        project={project}
                        projectOwner={projectOwnerProfile}
                        canEdit={isOwner}
                        onUpdate={onProjectUpdate}
                      />
                    )}
                    {s.id === "social" && (
                      <SocialsPanel
                        socialLinks={project?.social_links || {}}
                        onUpdate={onUpdateSocialLinks}
                        canEdit={isOwner}
                        title="Social Media"
                        emptyMessage="Add social media links to promote this project"
                      />
                    )}
                    {s.id === "showcase" && (
                      <div className="space-y-3">
                        {project?.project_urls?.length ? (
                          project.project_urls.map((l, i) => {
                            const url = typeof l === "object" ? l.url : l;
                            const title = typeof l === "object" ? l.title : "";
                            return <MicrolinkPreview key={i} url={url} title={title || ""} className="w-full" />;
                          })
                        ) : (
                          <p className="text-sm text-gray-400">No showcase links yet.</p>
                        )}
                        {isOwner && (
                          <Link
                            to={createPageUrl(`EditProject?id=${project?.id}`)}
                            className="inline-flex items-center gap-1 text-xs text-[#18A0FB] hover:underline"
                          >
                            <Pencil className="w-3 h-3" /> Edit showcase links
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}