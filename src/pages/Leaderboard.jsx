import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, Users, Zap, TrendingUp, Award, Crown, Medal } from "lucide-react";
import { motion } from "framer-motion";
import BadgeDisplay, { LevelBadge } from "../components/gamification/BadgeDisplay";
import OptimizedAvatar from "../components/OptimizedAvatar";

export default function Leaderboard({ currentUser }) {
  const [topUsers, setTopUsers] = useState([]);
  const [topCreators, setTopCreators] = useState([]);
  const [topCollaborators, setTopCollaborators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overall");

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setIsLoading(true);
    try {
      // Get top users by points
      const topPointUsers = await base44.entities.UserGameStats.filter({}, '-total_points', 10);
      
      // Get top creators by projects
      const topProjectCreators = await base44.entities.UserGameStats.filter({}, '-projects_created', 10);
      
      // Get top collaborators
      const topProjectCollaborators = await base44.entities.UserGameStats.filter({}, '-projects_collaborated', 10);

      // Get user profiles for all unique emails
      const allEmails = [...new Set([
        ...topPointUsers.map(u => u.user_email),
        ...topProjectCreators.map(u => u.user_email),
        ...topProjectCollaborators.map(u => u.user_email)
      ])];

      const { data: userProfiles } = await base44.functions.invoke('getPublicUserProfiles', { emails: allEmails });
      
      const profilesMap = {};
      userProfiles.forEach(profile => {
        profilesMap[profile.email] = profile;
      });

      // Merge stats with profiles
      const enrichUsers = (stats) => stats.map(stat => ({
        ...stat,
        profile: profilesMap[stat.user_email]
      })).filter(u => u.profile);

      setTopUsers(enrichUsers(topPointUsers));
      setTopCreators(enrichUsers(topProjectCreators));
      setTopCollaborators(enrichUsers(topProjectCollaborators));
    } catch (error) {
      console.error("Error loading leaderboards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-500">#{rank + 1}</span>;
  };

  const tabs = [
    { id: "overall", label: "Overall", icon: Trophy },
    { id: "creators", label: "Top Creators", icon: Star },
    { id: "collaborators", label: "Top Collaborators", icon: Users }
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case "creators": return topCreators;
      case "collaborators": return topCollaborators;
      default: return topUsers;
    }
  };

  const getStatDisplay = (user) => {
    switch (activeTab) {
      case "creators": 
        return { value: user.projects_created, label: "Projects Created" };
      case "collaborators": 
        return { value: user.projects_collaborated, label: "Collaborations" };
      default: 
        return { value: user.total_points.toLocaleString(), label: "Points" };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-purple-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">See who's leading the Collab Unity community</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-start sm:justify-center mb-8 space-x-2 overflow-x-auto pb-2 px-4 sm:px-0 scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={`${activeTab === tab.id ? "cu-button" : ""} whitespace-nowrap flex-shrink-0`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Leaderboard */}
        <Card className="cu-card">
          <CardContent className="p-0">
            <div className="divide-y">
              {getCurrentData().map((user, index) => {
                const stat = getStatDisplay(user);
                const isCurrentUser = currentUser && user.user_email === currentUser.email;
                
                return (
                  <motion.div
                    key={user.user_email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${isCurrentUser ? 'bg-purple-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {/* Rank */}
                        <div className="w-12 flex items-center justify-center flex-shrink-0">
                          {getRankIcon(index)}
                        </div>

                        {/* User Info */}
                        <Link 
                          to={createPageUrl(`UserProfile?username=${user.profile.username || user.profile.email}`)}
                          className="flex items-center space-x-3 flex-1 min-w-0 group"
                        >
                          <OptimizedAvatar
                            src={user.profile.profile_image}
                            alt={user.profile.full_name}
                            fallback={user.profile.full_name?.[0] || 'U'}
                            size="md"
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                              {user.profile.full_name}
                              {isCurrentUser && (
                                <Badge className="ml-2 bg-purple-100 text-purple-800">You</Badge>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              @{user.profile.username || user.profile.email.split('@')[0]}
                            </p>
                          </div>
                        </Link>

                        {/* Level */}
                        <div className="hidden sm:block flex-shrink-0">
                          <LevelBadge level={user.level} size="sm" />
                        </div>

                        {/* Badges */}
                        {user.badges && user.badges.length > 0 && (
                          <div className="hidden md:flex items-center space-x-1 flex-shrink-0">
                            <BadgeDisplay badges={user.badges.slice(0, 3)} size="sm" />
                            {user.badges.length > 3 && (
                              <span className="text-xs text-gray-500 ml-1">
                                +{user.badges.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-2xl font-bold text-purple-600">
                          {stat.value}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {getCurrentData().length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No rankings yet. Be the first!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="cu-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Zap className="w-5 h-5 mr-2 text-purple-600" />
              How to Earn Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start">
                <Star className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Create a Project</p>
                  <p className="text-gray-600">+100 points</p>
                </div>
              </div>
              <div className="flex items-start">
                <Star className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Complete Profile</p>
                  <p className="text-gray-600">+75 points</p>
                </div>
              </div>
              <div className="flex items-start">
                <Star className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Join Collaboration</p>
                  <p className="text-gray-600">+50 points</p>
                </div>
              </div>
              <div className="flex items-start">
                <Star className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Invite a User</p>
                  <p className="text-gray-600">+40 points</p>
                </div>
              </div>
              <div className="flex items-start">
                <Star className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Receive Review</p>
                  <p className="text-gray-600">+20 points</p>
                </div>
              </div>
              <div className="flex items-start">
                <Star className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Write Review</p>
                  <p className="text-gray-600">+15 points</p>
                </div>
              </div>
              <div className="flex items-start">
                <Star className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Receive Endorsement</p>
                  <p className="text-gray-600">+10 points</p>
                </div>
              </div>
              <div className="flex items-start">
                <Star className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Give Endorsement</p>
                  <p className="text-gray-600">+5 points</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}