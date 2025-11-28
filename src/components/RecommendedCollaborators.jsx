import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Sparkles, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { getPublicUserProfilesForDiscovery } from "@/functions/getPublicUserProfilesForDiscovery";

export default function RecommendedCollaborators({ currentUser, profileUser, limit = 5 }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRecommendations = async () => {
      if (!profileUser) {
        setIsLoading(false);
        return;
      }

      // Check if profile has necessary fields for matching (skills, tools, or interests)
      const hasSkills = profileUser.skills && profileUser.skills.length > 0;
      const hasTools = profileUser.tools_technologies && profileUser.tools_technologies.length > 0;
      const hasInterests = profileUser.interests && profileUser.interests.length > 0;
      
      if (!hasSkills && !hasTools && !hasInterests) {
        setIsLoading(false);
        setRecommendations([]);
        return;
      }

      setIsLoading(true);
      try {
        // Get all public users using backend function (has service role permissions)
        const { data: allUsers } = await getPublicUserProfilesForDiscovery();
        
        if (!isMounted) return;
        
        const otherUsers = (allUsers || []).filter(u => u.email !== profileUser.email);

        // Get projects the profile user has worked on
        const userProjects = await base44.entities.Project.filter({
          collaborator_emails: { $in: [profileUser.email] }
        });

        if (!isMounted) return;

        // Calculate recommendation scores
        const scoredUsers = otherUsers.map(user => {
          let score = 0;
          const reasons = [];

          // Shared skills (3 points per shared skill)
          const sharedSkills = (user.skills || []).filter(skill => 
            (profileUser.skills || []).includes(skill)
          );
          if (sharedSkills.length > 0) {
            score += sharedSkills.length * 3;
            reasons.push(`${sharedSkills.length} shared skill${sharedSkills.length > 1 ? 's' : ''}`);
          }

          // Shared interests (2 points per shared interest)
          const sharedInterests = (user.interests || []).filter(interest => 
            (profileUser.interests || []).includes(interest)
          );
          if (sharedInterests.length > 0) {
            score += sharedInterests.length * 2;
            reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}`);
          }

          // Shared tools/technologies (1 point per shared tool)
          const sharedTools = (user.tools_technologies || []).filter(tool => 
            (profileUser.tools_technologies || []).includes(tool)
          );
          if (sharedTools.length > 0) {
            score += sharedTools.length;
            reasons.push(`${sharedTools.length} shared tool${sharedTools.length > 1 ? 's' : ''}`);
          }

          // Past collaboration (10 points if they've worked together)
          const hasCollaborated = userProjects.some(project => 
            (project.collaborator_emails || []).includes(user.email)
          );
          if (hasCollaborated) {
            score += 10;
            reasons.push('Past collaborator');
          }

          // Same location (2 points)
          if (user.location && profileUser.location && user.location === profileUser.location) {
            score += 2;
            reasons.push('Same location');
          }

          return {
            ...user,
            score,
            reasons,
            sharedSkills
          };
        });

        if (!isMounted) return;

        // Filter out users with no score and sort by score
        const topRecommendations = scoredUsers
          .filter(u => u.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);

        setRecommendations(topRecommendations);
      } catch (error) {
        // Only log and show error if component is still mounted
        if (isMounted) {
          console.error("Error loading recommendations:", error);
          toast.error("Failed to load recommendations");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [profileUser, limit]);

  if (isLoading) {
    return (
      <Card className="cu-card">
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
            Recommended Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3">Finding matches...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="cu-card">
      <CardHeader>
        <CardTitle className="flex items-center text-base sm:text-lg">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
          Recommended Collaborators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map(user => (
          <Link
            key={user.id}
            to={createPageUrl(user.username ? `UserProfile?username=${user.username}` : `UserProfile?email=${user.email}`)}
            className="block"
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarImage src={user.profile_image} className="object-cover" />
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  {user.full_name?.[0] || user.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                    {user.full_name || user.email}
                  </h4>
                  <Badge className="ml-2 bg-purple-100 text-purple-700 text-xs flex-shrink-0">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {user.score}
                  </Badge>
                </div>
                
                {user.location && (
                  <p className="text-xs text-gray-500 mb-2">{user.location}</p>
                )}
                
                {user.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {user.reasons.slice(0, 2).map((reason, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {user.sharedSkills && user.sharedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {user.sharedSkills.slice(0, 3).map(skill => (
                      <Badge key={skill} className="text-xs bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200">
                        {skill}
                      </Badge>
                    ))}
                    {user.sharedSkills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.sharedSkills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
        
        {currentUser && currentUser.email === profileUser?.email && (
          <Link to={createPageUrl("Discover")}>
            <Button variant="outline" className="w-full text-sm">
              <Users className="w-4 h-4 mr-2" />
              Discover More Collaborators
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}