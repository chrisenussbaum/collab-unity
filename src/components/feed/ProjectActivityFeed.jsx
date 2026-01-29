import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity,
  MessageSquare,
  FileStack,
  CheckSquare,
  BookOpen,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { ActivityLog } from "@/entities/all";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { formatDistanceToNow } from "date-fns";
import HorizontalScrollContainer from "../HorizontalScrollContainer";

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

export default function ProjectActivityFeed({ project }) {
  const [activities, setActivities] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activityCount, setActivityCount] = useState(0);

  useEffect(() => {
    const loadActivities = async () => {
      if (!project?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const projectActivities = await ActivityLog.filter(
          { project_id: project.id }, 
          "-created_date", 
          10
        );
        
        const safeActivities = Array.isArray(projectActivities) ? projectActivities : [];
        setActivities(safeActivities);
        setActivityCount(safeActivities.length);

        // Load profile images for users in activities
        const userEmails = [...new Set(safeActivities.map(a => a.user_email).filter(Boolean))];

        if (userEmails.length > 0) {
          try {
            const { data: profilesData } = await getPublicUserProfiles({ emails: userEmails });
            const profilesMap = {};
            if (Array.isArray(profilesData)) {
              profilesData.forEach(profile => {
                profilesMap[profile.email] = profile;
              });
            }
            setProfiles(profilesMap);
          } catch (error) {
            console.error("Error loading profiles:", error);
          }
        }
      } catch (error) {
        console.error("Error loading activities:", error);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, [project?.id]);

  // Don't show if no activities or still loading
  if (isLoading || activityCount === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-purple-600" />
        <h4 className="text-sm font-semibold text-gray-900">Recent Activity</h4>
        <Badge variant="secondary" className="text-xs">
          {activityCount}
        </Badge>
      </div>

      <HorizontalScrollContainer showArrows={activities.length > 2}>
        {activities.map(activity => {
          const ActionIcon = ICON_MAP[activity.action_type] || Activity;
          const userProfile = profiles[activity.user_email];
          
          return (
            <div key={activity.id} className="flex-shrink-0 w-[280px] sm:w-[320px] p-3 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-start space-x-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={userProfile?.profile_image} />
                  <AvatarFallback className="text-xs">
                    {userProfile?.full_name?.[0]?.toUpperCase() || activity.user_email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-semibold">{userProfile?.full_name || activity.user_name || activity.user_email}</span>
                    {' '}
                    <span className="text-gray-600">{activity.action_description}</span>
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                    </p>
                    <ActionIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </HorizontalScrollContainer>
    </div>
  );
}