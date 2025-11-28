import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, ArrowLeft, Users, Sparkles, MapPin, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function OnboardingStep4({
  skills,
  interests,
  selectedIdea,
  onBack,
  onComplete,
  isSubmitting
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedCollaborators, setSuggestedCollaborators] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const findCollaborators = async () => {
    setIsLoading(true);
    try {
      // Get all public user profiles
      const response = await base44.functions.invoke('getPublicUserProfilesForDiscovery', {
        limit: 50
      });

      if (response.data && response.data.users) {
        const allUsers = response.data.users;
        
        // Use AI to rank and suggest best matches
        const matchPrompt = `Given a new user with:
- Skills: ${skills.join(", ")}
- Interests: ${interests.join(", ")}
${selectedIdea ? `- Project idea: ${selectedIdea.title} - ${selectedIdea.description}` : ''}

And these potential collaborators:
${allUsers.slice(0, 20).map((u, i) => `${i + 1}. ${u.full_name}: Skills: ${(u.skills || []).join(", ")}. Interests: ${(u.interests || []).join(", ")}`).join("\n")}

Return the indices (1-based) of the top 4 most compatible collaborators based on complementary skills, shared interests, and potential for the project idea. Also provide a brief reason (max 50 chars) for each match.`;

        const aiResponse = await base44.integrations.Core.InvokeLLM({
          prompt: matchPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    reason: { type: "string" }
                  }
                }
              }
            }
          }
        });

        if (aiResponse && aiResponse.matches) {
          const matchedUsers = aiResponse.matches
            .filter(m => m.index > 0 && m.index <= allUsers.length)
            .map(match => ({
              ...allUsers[match.index - 1],
              matchReason: match.reason
            }))
            .slice(0, 4);
          
          setSuggestedCollaborators(matchedUsers);
        } else {
          // Fallback: simple skill matching
          const scored = allUsers.map(user => {
            let score = 0;
            const userSkills = user.skills || [];
            const userInterests = user.interests || [];
            
            skills.forEach(skill => {
              if (userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase()))) score += 2;
            });
            interests.forEach(interest => {
              if (userInterests.some(ui => ui.toLowerCase().includes(interest.toLowerCase()))) score += 1;
            });
            
            return { ...user, score, matchReason: "Shared skills & interests" };
          });
          
          setSuggestedCollaborators(
            scored.sort((a, b) => b.score - a.score).slice(0, 4)
          );
        }
        setHasLoaded(true);
      }
    } catch (error) {
      console.error("Error finding collaborators:", error);
      toast.error("Could not load collaborator suggestions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasLoaded) {
      findCollaborators();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Suggested Collaborators</h3>
        <p className="text-sm text-gray-600">People who might be great to work with</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Finding compatible collaborators...</p>
        </div>
      ) : suggestedCollaborators.length > 0 ? (
        <>
          <div className="space-y-3">
            {suggestedCollaborators.map((user, index) => (
              <motion.div
                key={user.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.profile_image} className="object-cover" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {user.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{user.full_name}</h4>
                        {user.username && (
                          <span className="text-sm text-gray-500">@{user.username}</span>
                        )}
                      </div>
                      {user.location && (
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                          <MapPin className="w-3 h-3 mr-1" />
                          {user.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-600">{user.matchReason}</span>
                      </div>
                      {user.skills && user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.skills.slice(0, 3).map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {user.skills.length > 3 && (
                            <span className="text-xs text-gray-500">+{user.skills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={findCollaborators}
            disabled={isLoading}
            className="w-full text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Find More Collaborators
          </Button>

          <p className="text-xs text-gray-500 text-center">
            You can connect with these collaborators after completing setup
          </p>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No collaborators found yet. Don't worry, you can discover people later!</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onComplete}
          className="cu-button flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Completing...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>
      </div>
    </motion.div>
  );
}