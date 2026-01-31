import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  Eye,
  Activity,
  CheckSquare,
  FileStack,
  BookOpen,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { ActivityLog } from "@/entities/all";
import { formatDistanceToNow, format, subDays, startOfDay } from "date-fns";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";

const CHART_COLORS = {
  primary: "#8b5cf6",
  secondary: "#6366f1",
  tertiary: "#3b82f6",
  quaternary: "#10b981",
  quinary: "#f59e0b",
};

const ACTIVITY_TYPES = {
  task_created: { label: "Tasks Created", icon: CheckSquare, color: CHART_COLORS.primary },
  task_completed: { label: "Tasks Completed", icon: CheckSquare, color: CHART_COLORS.primary },
  asset_uploaded: { label: "Assets Uploaded", icon: FileStack, color: CHART_COLORS.secondary },
  thought_created: { label: "Thoughts Created", icon: BookOpen, color: CHART_COLORS.tertiary },
  milestone_created: { label: "Milestones Created", icon: TrendingUp, color: CHART_COLORS.quaternary },
  milestone_completed: { label: "Milestones Completed", icon: TrendingUp, color: CHART_COLORS.quaternary },
  ideation_updated: { label: "Ideation Sessions", icon: Activity, color: CHART_COLORS.quinary },
  tool_added: { label: "Tools Added", icon: Activity, color: "#ec4899" },
  comment_posted: { label: "Comments Posted", icon: MessageSquare, color: "#14b8a6" },
};

export default function ProjectAnalyticsDashboard({ project, currentUser, isCollaborator }) {
  const [activities, setActivities] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30"); // days

  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!project?.id) return;

      setIsLoading(true);
      try {
        // Fetch all activity logs for the project
        const projectActivities = await ActivityLog.filter(
          { project_id: project.id },
          "-created_date",
          500 // Get more activities for better analytics
        );

        const safeActivities = Array.isArray(projectActivities) ? projectActivities : [];
        
        // Filter out highlight uploads for analytics
        const filteredActivities = safeActivities.filter(
          activity => !(activity.action_type === 'asset_uploaded' && activity.entity_type === 'highlight')
        );
        
        setActivities(filteredActivities);

        // Load user profiles for all contributors
        const userEmails = [...new Set(filteredActivities.map(a => a.user_email).filter(Boolean))];

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
            console.error("Error loading profiles for analytics:", error);
          }
        }
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsData();
  }, [project?.id]);

  if (isLoading) {
    return (
      <Card className="cu-card">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-4">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  // Filter activities by time range
  const daysAgo = parseInt(timeRange);
  const cutoffDate = subDays(new Date(), daysAgo);
  const filteredActivities = activities.filter(
    activity => new Date(activity.created_date) >= cutoffDate
  );

  // Calculate metrics
  const totalActivities = filteredActivities.length;
  const uniqueContributors = new Set(filteredActivities.map(a => a.user_email)).size;
  
  // Activity by type
  const activityByType = {};
  Object.keys(ACTIVITY_TYPES).forEach(type => {
    activityByType[type] = filteredActivities.filter(a => a.action_type === type).length;
  });

  // Activity over time (last 30 days, grouped by day)
  const activityOverTime = [];
  for (let i = Math.min(daysAgo, 30) - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayStart = startOfDay(date);
    const dayActivities = filteredActivities.filter(a => {
      const activityDate = startOfDay(new Date(a.created_date));
      return activityDate.getTime() === dayStart.getTime();
    });
    
    activityOverTime.push({
      date: format(date, "MMM dd"),
      count: dayActivities.length,
    });
  }

  // Top contributors
  const contributorCounts = {};
  filteredActivities.forEach(activity => {
    const email = activity.user_email;
    contributorCounts[email] = (contributorCounts[email] || 0) + 1;
  });

  const topContributors = Object.entries(contributorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([email, count]) => ({
      email,
      count,
      profile: profiles[email],
    }));

  // Activity distribution for pie chart
  const activityDistribution = Object.entries(activityByType)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      name: ACTIVITY_TYPES[type].label,
      value: count,
      color: ACTIVITY_TYPES[type].color,
    }));

  // No data state
  if (totalActivities === 0) {
    return (
      <Card className="cu-card">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            Project Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No activity data yet</p>
          <p className="text-sm text-gray-500">
            Start working on the project to see analytics here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cu-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            Project Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <Badge variant="secondary" className="text-xs">
                {timeRange}d
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalActivities}</div>
            <div className="text-xs text-gray-600">Total Activities</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900">{uniqueContributors}</div>
            <div className="text-xs text-gray-600">Contributors</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <Badge variant="secondary" className="text-xs">
                Avg
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(totalActivities / Math.min(daysAgo, 30)).toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Activities/Day</div>
          </div>
        </div>

        {/* Activity Over Time Chart */}
        {activityOverTime.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
              Activity Trend
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={activityOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.primary, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Activity Distribution */}
        {activityDistribution.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-purple-600" />
                Activity Distribution
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={activityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {activityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity Type Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Activity Breakdown
              </h4>
              <div className="space-y-3">
                {activityDistribution.map((item, index) => {
                  const percentage = ((item.value / totalActivities) * 100).toFixed(1);
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-600">
                          {item.value} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Top Contributors */}
        {topContributors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2 text-purple-600" />
              Top Contributors
            </h4>
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div
                  key={contributor.email}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-white">
                        <AvatarImage src={contributor.profile?.profile_image} />
                        <AvatarFallback className="text-sm">
                          {contributor.profile?.full_name?.[0] || contributor.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
                          🏆
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {contributor.profile?.full_name || contributor.email}
                      </p>
                      <p className="text-xs text-gray-600">
                        {contributor.count} {contributor.count === 1 ? 'activity' : 'activities'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Visibility Metric (for public projects) */}
        {project.is_visible_on_feed && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Public Project</p>
                <p className="text-xs text-gray-600">
                  Visible on the community feed • {project.followers_count || 0} {project.followers_count === 1 ? 'follower' : 'followers'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}