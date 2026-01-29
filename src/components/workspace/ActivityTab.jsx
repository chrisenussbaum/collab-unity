import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity,
  MessageSquare,
  Eye,
  Lock,
  FileStack,
  CheckSquare,
  BookOpen,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { ActivityLog } from "@/entities/all";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ICON_MAP = {
  asset_uploaded: FileStack,
  asset_updated: FileStack,
  asset_deleted: FileStack,
  task_created: CheckSquare,
  task_updated: CheckSquare,
  task_completed: CheckSquare,
  task_deleted: CheckSquare,
  task_assigned: CheckSquare,
  thought_created: BookOpen,
  thought_updated: BookOpen,
  thought_deleted: BookOpen,
  ideation_updated: BookOpen,
  comment_posted: MessageSquare,
  member_added: UserPlus,
  member_left: UserPlus,
  member_removed: UserPlus,
  status_changed: RefreshCw,
  milestone_created: CheckSquare,
  milestone_updated: CheckSquare,
  milestone_completed: CheckSquare,
  milestone_deleted: CheckSquare,
  tool_added: RefreshCw,
  tool_removed: RefreshCw,
  project_updated: RefreshCw,
  link_added: RefreshCw,
  link_removed: RefreshCw,
};

// Utility function to handle rate limits with exponential backoff
const withRetry = async (apiCall, maxRetries = 5, baseDelay = 2000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000;
        console.warn(`Rate limit hit, retrying in ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

export default function ActivityTab({ project, currentUser, isCollaborator, isProjectOwner, projectOwnerName }) {
  const [activities, setActivities] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Determine access level
  const isProjectAdmin = isProjectOwner;
  const isAcceptedCollaborator = currentUser && project.collaborator_emails?.includes(currentUser.email);
  const hasWriteAccess = isProjectAdmin || isAcceptedCollaborator;
  const hasReadAccess = !!currentUser;

  const loadActivities = useCallback(async () => {
    if (!project?.id || !hasReadAccess) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Add initial delay to prevent hitting rate limits when switching tabs quickly
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const projectActivities = await withRetry(() => ActivityLog.filter({ project_id: project.id }, "-created_date", 50));
      const safeActivities = Array.isArray(projectActivities) ? projectActivities : [];
      setActivities(safeActivities);

      // Load profile images for all users who appear in activities
      const userEmails = [...new Set(safeActivities.map(activity => activity.user_email).filter(Boolean))];

      if (userEmails.length > 0) {
        // Add delay between API calls
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          const { data: profilesData } = await withRetry(() => getPublicUserProfiles({ emails: userEmails }));
          const profilesMap = {};
          if (Array.isArray(profilesData)) {
            profilesData.forEach(profile => {
              profilesMap[profile.email] = profile;
            });
          }
          setProfiles(profilesMap);
        } catch (error) {
          console.error("Error loading user profiles for activity:", error);
          // Don't show toast for profile errors - silently fail
          setProfiles({});
        }
      } else {
        setProfiles({});
      }
    } catch (error) {
      console.error("Error loading activities:", error);
      if (error.response?.status !== 429) {
        toast.error("Failed to load project activities.");
      }
      setActivities([]);
      setProfiles({});
    } finally {
      setIsLoading(false);
    }
  }, [project?.id, hasReadAccess]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  if (isLoading && hasReadAccess) {
    return (
      <Card className="cu-card">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading project activity...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center space-x-2">
          <Activity className="w-5 h-5 text-purple-600" />
          <span>Project Activity</span>
        </h3>
      </div>

      {!hasReadAccess ? (
        <Card className="cu-card">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Activity Access Required</p>
            <p className="text-sm text-gray-500">
              Please log in to view project activity.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {!hasWriteAccess && (
            <Card className="cu-card border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-amber-800">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Join this project to contribute and generate activity.</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              {activities.length > 0 ? (
                <div className="space-y-6">
                  {activities.map(activity => {
                    const ActionIcon = ICON_MAP[activity.action_type] || Activity;
                    const userProfile = profiles[activity.user_email];
                    return (
                      <div key={activity.id} className="flex items-start space-x-4">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={userProfile?.profile_image} />
                          <AvatarFallback>
                            {userProfile?.full_name?.[0]?.toUpperCase() || activity.user_email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{userProfile?.full_name || activity.user_email}</span> {activity.action_description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                          </p>
                        </div>
                        <ActionIcon className="w-5 h-5 text-gray-400 mt-1" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No activity recorded for this project yet.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {hasWriteAccess ? "Start working on the project to see activity here." : `Activity will appear here once ${projectOwnerName || 'the team'} gets to work.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}