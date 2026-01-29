import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Activity,
  MessageSquare,
  FileStack,
  CheckSquare,
  BookOpen,
  UserPlus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ActivityLog } from "@/entities/all";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { formatDistanceToNow } from "date-fns";

const ICON_MAP = {
  asset_uploaded: FileStack,
  asset_updated: FileStack,
  task_created: CheckSquare,
  task_completed: CheckSquare,
  thought_created: BookOpen,
  thought_updated: BookOpen,
  ideation_updated: BookOpen,
  comment_posted: MessageSquare,
  member_added: UserPlus,
  status_changed: RefreshCw,
};

export default function ProjectActivityFeed({ project }) {
  const [activities, setActivities] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
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

  const displayedActivities = isExpanded ? activities : activities.slice(0, 3);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600" />
          <h4 className="text-sm font-semibold text-gray-900">Recent Activity</h4>
          <Badge variant="secondary" className="text-xs">
            {activityCount}
          </Badge>
        </div>
        
        {activities.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-auto py-1 px-2 text-xs text-purple-600 hover:text-purple-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                View All
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {displayedActivities.map(activity => {
          const ActionIcon = ICON_MAP[activity.action_type] || Activity;
          const userProfile = profiles[activity.user_email];
          
          return (
            <div key={activity.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarImage src={userProfile?.profile_image} />
                <AvatarFallback className="text-xs">
                  {userProfile?.full_name?.[0]?.toUpperCase() || activity.user_email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">{userProfile?.full_name || activity.user_name || activity.user_email}</span>
                  {' '}
                  <span className="text-gray-600">{activity.action_description}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                </p>
              </div>
              
              <ActionIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            </div>
          );
        })}
      </div>
    </div>
  );
}