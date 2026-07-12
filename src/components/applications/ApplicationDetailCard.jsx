import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calendar, ChevronDown, ChevronUp, Paperclip, FileText, Lightbulb, MapPin } from 'lucide-react';
import OptimizedAvatar from '@/components/OptimizedAvatar';

const STATUS_META = {
  pending: { className: "bg-amber-50 border-amber-200 text-amber-700", label: "Pending" },
  interviewing: { className: "bg-blue-50 border-blue-200 text-blue-700", label: "Interviewing" },
  accepted: { className: "bg-green-50 border-green-200 text-green-700", label: "Accepted" },
  rejected: { className: "bg-gray-100 border-gray-200 text-gray-500", label: "Declined" },
  withdrawn: { className: "bg-gray-100 border-gray-200 text-gray-500", label: "Withdrawn" },
};

export default function ApplicationDetailCard({
  application,
  project,
  applicantProfile,
  isProcessing,
  onAccept,
  onReject,
  onStartInterview,
  defaultExpanded = false,
  showProjectContext = false,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const profile = applicantProfile || {};
  const statusMeta = STATUS_META[application.status] || STATUS_META.pending;
  const isPending = application.status === 'pending';

  const hasDetails = application.message || application.description ||
    (application.attachments && application.attachments.length > 0) ||
    profile.headline || (profile.skills && profile.skills.length > 0) || profile.bio;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
      {/* Project context bar (for received panel) */}
      {showProjectContext && project && (
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
          <Link
            to={createPageUrl(`ProjectDetail?id=${project.id}`)}
            className="flex items-center gap-2 min-w-0 flex-1"
          >
            {project.logo_url ? (
              <img
                src={project.logo_url}
                alt={project.title}
                className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-purple-600" />
              </div>
            )}
            <p className="text-sm font-semibold text-gray-800 truncate hover:text-purple-600 transition-colors">
              {project.title}
            </p>
          </Link>
        </div>
      )}

      {/* Applicant header */}
      <div className="flex items-start gap-3">
        <OptimizedAvatar
          src={profile.profile_image}
          alt={profile.full_name || 'Applicant'}
          fallback={(profile.full_name || application.applicant_email?.[0] || '?').charAt(0)}
          size="sm"
          className="w-10 h-10 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {profile.username ? (
              <Link
                to={createPageUrl(`UserProfile?username=${profile.username}`)}
                className="font-semibold text-sm text-gray-900 hover:text-purple-600 transition-colors"
              >
                {profile.full_name || application.applicant_email}
              </Link>
            ) : (
              <p className="font-semibold text-sm text-gray-900">
                {profile.full_name || application.applicant_email}
              </p>
            )}
            <Badge variant="outline" className={`text-xs ${statusMeta.className}`}>
              {statusMeta.label}
            </Badge>
          </div>
          {profile.headline && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{profile.headline}</p>
          )}
          {profile.location && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {profile.location}
            </p>
          )}
        </div>

        {/* Action buttons — only for pending */}
        {isPending && (
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
              onClick={() => onReject(application, project)}
              disabled={isProcessing === application.id}
              title="Decline"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
              onClick={() => onStartInterview(application, project)}
              disabled={isProcessing === application.id}
              title="Schedule Interview"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
              onClick={() => onAccept(application, project, profile)}
              disabled={isProcessing === application.id}
              title="Accept"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Expandable details */}
      {hasDetails && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {isExpanded ? "Hide details" : "View details"}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-3">
              {/* Applicant skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 12).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Applicant bio */}
              {profile.bio && (
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">About</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {/* Application message */}
              {application.message && (
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Application message</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.message}</p>
                </div>
              )}

              {/* Additional description */}
              {application.description && (
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Additional context</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.description}</p>
                </div>
              )}

              {/* Attachments */}
              {application.attachments && application.attachments.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium flex items-center gap-1">
                    <Paperclip className="w-3 h-3" /> Attachments ({application.attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {application.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-200 hover:bg-purple-50/50 transition-colors"
                      >
                        {att.file_type === "image" ? (
                          <img
                            src={att.file_url}
                            alt={att.file_name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-xs text-gray-600 truncate max-w-[140px]">
                          {att.file_name || att.file_type}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}