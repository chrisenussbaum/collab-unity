import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Users, DollarSign, MapPin, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { createPageUrl } from "@/utils";

const STATUS_LABELS = {
  seeking_collaborators: "Seeking Collaborators",
  in_progress: "In Progress",
  completed: "Completed",
};

const FUNDING_LABELS = {
  paypal_link: "PayPal",
  venmo_link: "Venmo",
  cashapp_link: "CashApp",
};

const SOCIAL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "Twitter",
  youtube: "YouTube",
  twitch: "Twitch",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  website: "Website",
};

// Mobile-friendly, read-only summary of a project: description, metadata,
// skills/tools, showcase links, team, funding and socials.
export default function MobileProjectDetails({ project, projectUsers, canApply, onApply }) {
  const collaborators = projectUsers || [];
  const ownerEmail = project.created_by;
  const funding = Object.keys(FUNDING_LABELS)
    .filter((key) => project[key])
    .map((key) => ({ label: FUNDING_LABELS[key], url: project[key] }));
  const socials = Object.keys(SOCIAL_LABELS)
    .filter((key) => project.social_links?.[key])
    .map((key) => ({ label: SOCIAL_LABELS[key], url: project.social_links[key] }));
  const projectLinks = project.project_urls || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge className="bg-purple-600 text-white">
            {STATUS_LABELS[project.status] || project.status}
          </Badge>
          {project.classification && (
            <Badge variant="outline" className="capitalize border-gray-200 text-gray-600">
              {project.classification.replace(/_/g, " ")}
            </Badge>
          )}
          {project.industry && (
            <Badge variant="outline" className="border-gray-200 text-gray-600">
              {project.industry}
            </Badge>
          )}
          {project.area_of_interest && (
            <Badge variant="outline" className="border-gray-200 text-gray-600">
              {project.area_of_interest}
            </Badge>
          )}
          {project.location && (
            <Badge variant="outline" className="border-gray-200 text-gray-600">
              <MapPin className="w-3 h-3 mr-1" />
              {project.location}
            </Badge>
          )}
        </div>

        {project.description && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {project.description}
          </p>
        )}
      </div>

      {project.skills_needed?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Skills Needed
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {project.skills_needed.map((s) => (
              <Badge key={s} variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {project.tools_needed?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Tools & Technologies
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {project.tools_needed.map((t) => (
              <Badge key={t} variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {projectLinks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Showcase Links
          </h3>
          <div className="space-y-2">
            {projectLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800 truncate">
                  {link.title || link.url}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {collaborators.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Team
          </h3>
          <div className="space-y-2">
            {collaborators.map((u) => {
              const profileUrl = u.username
                ? createPageUrl(`UserProfile?username=${u.username}`)
                : createPageUrl(`UserProfile?email=${u.email}`);
              return (
                <Link key={u.email} to={profileUrl} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <OptimizedAvatar
                    src={u.profile_image}
                    alt={u.full_name || u.email}
                    fallback={(u.full_name?.[0] || u.email?.[0] || "U")}
                    size="sm"
                    className="w-8 h-8"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {u.full_name || u.email.split("@")[0]}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {u.email === ownerEmail
                        ? "Owner"
                        : project.collaborator_roles?.[u.email] || "Collaborator"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {(funding.length > 0 || socials.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          {funding.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Support this project
              </h3>
              <div className="flex flex-wrap gap-2">
                {funding.map((f) => (
                  <a key={f.label} href={f.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs">
                      {f.label}
                    </Button>
                  </a>
                ))}
              </div>
            </div>
          )}
          {socials.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs">
                      {s.label}
                    </Button>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {canApply && (
        <Button onClick={onApply} className="cu-button w-full">
          <UserPlus className="w-4 h-4 mr-2" />
          Apply to join this project
        </Button>
      )}
    </div>
  );
}