import React, { useState, useEffect } from 'react';
import { Task, AssetVersion, Thought, ActivityLog } from '@/entities/all';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle, FileUp, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Helper to format task status labels
const formatTaskStatus = (status) => {
  const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done'
  };
  return statusLabels[status] || status;
};

const ContributionsTab = ({ project, currentUser, collaborators }) => {
  const [contributions, setContributions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('all');

  useEffect(() => {
    fetchContributions();
  }, [project.id]);

  const fetchContributions = async () => {
    setIsLoading(true);
    try {
      const [tasks, assets, thoughts, activities] = await Promise.all([
        Task.filter({ project_id: project.id }),
        AssetVersion.filter({ project_id: project.id }),
        Thought.filter({ project_id: project.id }),
        ActivityLog.filter({ project_id: project.id }),
      ]);

      const contributionsByUser = {};

      // Group tasks by user
      (tasks || []).forEach(task => {
        if (task.assigned_to) {
          if (!contributionsByUser[task.assigned_to]) {
            contributionsByUser[task.assigned_to] = { tasks: [], assets: [], thoughts: [], activities: [] };
          }
          contributionsByUser[task.assigned_to].tasks.push(task);
        }
      });

      // Group assets by user
      (assets || []).forEach(asset => {
        if (asset.uploaded_by) {
          if (!contributionsByUser[asset.uploaded_by]) {
            contributionsByUser[asset.uploaded_by] = { tasks: [], assets: [], thoughts: [], activities: [] };
          }
          contributionsByUser[asset.uploaded_by].assets.push(asset);
        }
      });

      // Group thoughts by user
      (thoughts || []).forEach(thought => {
        if (thought.last_edited_by) {
          if (!contributionsByUser[thought.last_edited_by]) {
            contributionsByUser[thought.last_edited_by] = { tasks: [], assets: [], thoughts: [], activities: [] };
          }
          contributionsByUser[thought.last_edited_by].thoughts.push(thought);
        }
      });

      // Group activities by user
      (activities || []).forEach(activity => {
        if (activity.user_email) {
          if (!contributionsByUser[activity.user_email]) {
            contributionsByUser[activity.user_email] = { tasks: [], assets: [], thoughts: [], activities: [] };
          }
          contributionsByUser[activity.user_email].activities.push(activity);
        }
      });

      setContributions(contributionsByUser);
    } catch (error) {
      console.error("Error fetching contributions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserProfile = (email) => {
    return collaborators.find(c => c.email === email);
  };

  const filteredContributions = selectedUser === 'all' 
    ? contributions 
    : { [selectedUser]: contributions[selectedUser] };

  const getTotalContributions = (userContribs) => {
    if (!userContribs) return 0;
    return (userContribs.tasks?.length || 0) + 
           (userContribs.assets?.length || 0) + 
           (userContribs.thoughts?.length || 0);
  };

  if (isLoading) {
    return (
      <Card className="cu-card">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading contributions...</div>
        </CardContent>
      </Card>
    );
  }

  const contributorEmails = Object.keys(contributions);

  if (contributorEmails.length === 0) {
    return (
      <Card className="cu-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            Team Contributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No contributions yet. Start collaborating to see activity here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cu-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
          Team Contributions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedUser} onValueChange={setSelectedUser} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="all">All Members</TabsTrigger>
            {contributorEmails.map(email => {
              const profile = getUserProfile(email);
              return (
                <TabsTrigger key={email} value={email}>
                  {profile?.full_name || email.split('@')[0]}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedUser} className="space-y-4">
            {Object.entries(filteredContributions).map(([email, userContribs]) => {
              const profile = getUserProfile(email);
              const totalContributions = getTotalContributions(userContribs);

              return (
                <div key={email} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={profile?.profile_image} />
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {profile?.full_name?.[0] || email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{profile?.full_name || email}</h3>
                        <p className="text-sm text-gray-500">
                          {totalContributions} contribution{totalContributions !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Tasks */}
                    {userContribs.tasks && userContribs.tasks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                          Tasks ({userContribs.tasks.length})
                        </h4>
                        <div className="space-y-2 pl-5">
                          {userContribs.tasks.map(task => (
                            <div key={task.id} className="text-sm">
                              <div className="flex items-center justify-between">
                                <span>{task.title}</span>
                                <Badge variant={task.status === 'done' ? 'default' : 'secondary'}>
                                  {formatTaskStatus(task.status)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assets */}
                    {userContribs.assets && userContribs.assets.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <FileUp className="w-4 h-4 mr-1 text-blue-600" />
                          Assets Uploaded ({userContribs.assets.length})
                        </h4>
                        <div className="space-y-2 pl-5">
                          {userContribs.assets.slice(0, 5).map(asset => (
                            <div key={asset.id} className="text-sm flex items-center justify-between">
                              <span className="truncate">{asset.asset_name}</span>
                              <span className="text-xs text-gray-500">
                                {asset.created_date && formatDistanceToNow(new Date(asset.created_date), { addSuffix: true })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Thoughts */}
                    {userContribs.thoughts && userContribs.thoughts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <BookOpen className="w-4 h-4 mr-1 text-purple-600" />
                          Thoughts ({userContribs.thoughts.length})
                        </h4>
                        <div className="space-y-2 pl-5">
                          {userContribs.thoughts.map(thought => (
                            <div key={thought.id} className="text-sm">
                              <span>{thought.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Activities */}
                    {userContribs.activities && userContribs.activities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-orange-600" />
                          Recent Activity ({userContribs.activities.length})
                        </h4>
                        <div className="space-y-2 pl-5">
                          {userContribs.activities.slice(0, 3).map(activity => (
                            <div key={activity.id} className="text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700">{activity.action_description}</span>
                                <span className="text-xs text-gray-500">
                                  {activity.created_date && formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContributionsTab;