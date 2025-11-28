import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, User } from "@/entities/all";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Users,
  Clock,
  CheckCircle,
  MapPin,
  Building2,
  Tag,
  Eye,
  Search,
  Lightbulb,
  ArrowLeft,
  Filter,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import HorizontalScrollContainer from "../components/HorizontalScrollContainer";

const formatEnumLabel = (str) => {
  if (!str) return '';
  return String(str)
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const withRetry = async (apiCall, maxRetries = 3, baseDelay = 3000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(3, attempt) + Math.random() * 2000;
        console.warn(`Rate limit hit, retrying in ${(delay / 1000).toFixed(1)}s`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

const userProfileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

export default function JoinProjects() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        await fetchProjects(user);
      } catch (error) {
        console.log("User not authenticated", error);
        setCurrentUser(null);
        await fetchProjects(null);
      }
    };
    initialize();
  }, []);

  const fetchProjects = async (user) => {
    setIsLoading(true);
    try {
      const allProjects = await withRetry(() => 
        Project.filter({ 
          is_visible_on_feed: true,
          status: "seeking_collaborators"
        }, "-created_date")
      );

      const ownerEmails = [...new Set(allProjects.map(p => p.created_by))];

      if (ownerEmails.length > 0) {
        const cachedProfiles = [];
        const uncachedEmails = [];

        ownerEmails.forEach(email => {
          const cached = userProfileCache.get(email);
          if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            cachedProfiles.push(cached.profile);
          } else {
            uncachedEmails.push(email);
          }
        });

        let profilesMap = {};

        cachedProfiles.forEach(profile => {
          profilesMap[profile.email] = profile;
        });

        if (uncachedEmails.length > 0) {
          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: ownerProfiles } = await withRetry(() =>
              getPublicUserProfiles({ emails: uncachedEmails })
            );

            (ownerProfiles || []).forEach(profile => {
              userProfileCache.set(profile.email, {
                profile,
                timestamp: Date.now()
              });
              profilesMap[profile.email] = profile;
            });
          } catch (error) {
            console.error("Error fetching user profiles:", error);
            toast.warning("Some user profile information could not be loaded.");
          }
        }

        const projectsWithOwners = allProjects
          .filter(project => {
            // Filter out projects where user is already a collaborator
            if (user && project.collaborator_emails?.includes(user.email)) {
              return false;
            }
            return true;
          })
          .map(project => ({
            ...project,
            owner: profilesMap[project.created_by] || {
              email: project.created_by,
              full_name: project.created_by.split('@')[0],
              profile_image: null
            }
          }));

        setProjects(projectsWithOwners);
      } else {
        setProjects(allProjects);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects. Please refresh the page.");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = {
    seeking_collaborators: {
      color: "border-orange-500",
      icon: <Users className="w-3 h-3 mr-1 text-orange-500" />,
      label: "Seeking Collaborators"
    }
  };

  const allSkills = useMemo(() => {
    const skillsSet = new Set();
    projects.forEach(project => {
      if (project.skills_needed) {
        project.skills_needed.forEach(skill => skillsSet.add(skill));
      }
    });
    return Array.from(skillsSet).sort();
  }, [projects]);

  const allIndustries = useMemo(() => {
    const industriesSet = new Set();
    projects.forEach(project => {
      if (project.industry) {
        industriesSet.add(project.industry);
      }
    });
    return Array.from(industriesSet).sort();
  }, [projects]);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleIndustry = (industry) => {
    setSelectedIndustries(prev =>
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  const clearFilters = () => {
    setSelectedSkills([]);
    setSelectedIndustries([]);
    setShowOnlyMatching(false);
    setSearchQuery("");
  };

  const getMatchScore = (project) => {
    if (!currentUser) return 0;

    let score = 0;
    const userSkills = currentUser.skills || [];
    const userInterests = currentUser.interests || [];

    // Check skill matches
    if (project.skills_needed) {
      const matchingSkills = project.skills_needed.filter(skill =>
        userSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())
      );
      score += matchingSkills.length * 2;
    }

    // Check interest matches
    if (project.area_of_interest) {
      const matchesInterest = userInterests.some(interest =>
        project.area_of_interest.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(project.area_of_interest.toLowerCase())
      );
      if (matchesInterest) score += 3;
    }

    // Check industry match
    if (project.industry && userInterests) {
      const matchesIndustryInterest = userInterests.some(interest =>
        project.industry.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(project.industry.toLowerCase())
      );
      if (matchesIndustryInterest) score += 2;
    }

    return score;
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.area_of_interest?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.skills_needed && project.skills_needed.some(skill =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    // Apply skill filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(project =>
        project.skills_needed && project.skills_needed.some(skill =>
          selectedSkills.includes(skill)
        )
      );
    }

    // Apply industry filter
    if (selectedIndustries.length > 0) {
      filtered = filtered.filter(project =>
        selectedIndustries.includes(project.industry)
      );
    }

    // Apply "only matching" filter
    if (showOnlyMatching && currentUser) {
      filtered = filtered.filter(project => getMatchScore(project) > 0);
    }

    // Sort by match score if user is logged in
    if (currentUser) {
      filtered = filtered.sort((a, b) => getMatchScore(b) - getMatchScore(a));
    }

    return filtered;
  }, [projects, searchQuery, selectedSkills, selectedIndustries, showOnlyMatching, currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="cu-container">
        <div className="cu-page">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(createPageUrl("Discover"))}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="cu-text-responsive-xl font-bold text-gray-900">Join Projects</h1>
                <p className="text-gray-600 cu-text-responsive-sm mt-1">
                  Find projects seeking collaborators that match your skills and interests
                </p>
              </div>
            </div>

            {/* Profile Match Banner */}
            {currentUser && (
              <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Smart Matching Enabled</h3>
                      <p className="text-sm text-gray-600">
                        Projects are sorted by how well they match your profile. Projects with{" "}
                        <Badge className="inline-flex bg-purple-100 text-purple-700 border-purple-200 text-xs">
                          High Match
                        </Badge>{" "}
                        badges align with your skills and interests.
                      </p>
                      {currentUser.skills?.length === 0 && currentUser.interests?.length === 0 && (
                        <p className="text-sm text-orange-600 mt-2">
                          <Link to={createPageUrl("EditProfile")} className="underline hover:text-orange-700">
                            Complete your profile
                          </Link>{" "}
                          to get better project recommendations.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search projects by title, skills, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>

            {/* Filters */}
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                {currentUser && (
                  <Button
                    variant={showOnlyMatching ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOnlyMatching(!showOnlyMatching)}
                    className={showOnlyMatching ? "cu-button" : ""}
                  >
                    Show Only Matching
                  </Button>
                )}
                {(selectedSkills.length > 0 || selectedIndustries.length > 0 || showOnlyMatching) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Skills Filter */}
              {allSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by Skills:</h3>
                  <HorizontalScrollContainer showArrows={true}>
                    <div className="flex gap-2 px-1">
                      {allSkills.map(skill => (
                        <Button
                          key={skill}
                          variant={selectedSkills.includes(skill) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSkill(skill)}
                          className={`cu-text-responsive-xs flex-shrink-0 ${
                            selectedSkills.includes(skill) ? "cu-button" : ""
                          }`}
                        >
                          {skill}
                        </Button>
                      ))}
                    </div>
                  </HorizontalScrollContainer>
                </div>
              )}

              {/* Industries Filter */}
              {allIndustries.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by Industry:</h3>
                  <div className="flex flex-wrap gap-2">
                    {allIndustries.map(industry => (
                      <Button
                        key={industry}
                        variant={selectedIndustries.includes(industry) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleIndustry(industry)}
                        className={`cu-text-responsive-xs ${
                          selectedIndustries.includes(industry) ? "cu-button" : ""
                        }`}
                      >
                        {formatEnumLabel(industry)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-white animate-pulse" />
              </div>
              <p className="text-gray-600 font-medium cu-text-responsive-sm">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="cu-text-responsive-lg font-semibold text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-gray-600 cu-text-responsive-sm mb-6">
                {searchQuery || selectedSkills.length > 0 || selectedIndustries.length > 0 || showOnlyMatching
                  ? "Try adjusting your filters or search terms"
                  : "Check back later for new opportunities to collaborate!"}
              </p>
              {(selectedSkills.length > 0 || selectedIndustries.length > 0 || showOnlyMatching) && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div>
              <div className="cu-grid-responsive-1-2-3">
                {filteredProjects.map((project, index) => {
                  const config = statusConfig.seeking_collaborators;
                  const matchScore = currentUser ? getMatchScore(project) : 0;
                  const isHighMatch = matchScore >= 5;

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`cu-card h-full flex flex-col border-t-4 ${config.color} ${isHighMatch ? 'ring-2 ring-purple-300' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start space-x-3 mb-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={project.logo_url}
                                alt={project.title}
                                className="w-12 h-12 rounded-lg object-cover border-2 border-gray-100 shadow-sm"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                                className="font-bold text-gray-900 hover:text-purple-600 transition-colors line-clamp-2 cu-text-responsive-sm leading-tight"
                              >
                                {project.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <Link
                                  to={createPageUrl(project.owner?.username ? `UserProfile?username=${project.owner.username}` : `UserProfile?email=${project.created_by}`)}
                                  className="flex items-center space-x-1.5"
                                >
                                  <Avatar className="w-5 h-5 border-2 border-white shadow-sm">
                                    <AvatarImage src={project.owner?.profile_image} className="object-cover" />
                                    <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                      {project.owner?.full_name?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="cu-text-responsive-xs text-gray-600 hover:text-purple-600 transition-colors">
                                    {project.owner?.full_name || 'Anonymous'}
                                  </span>
                                </Link>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="outline" className={`text-xs ${config.color} border-current shadow-sm`}>
                              {config.icon}
                              <span className="ml-1">Seeking Collaborators</span>
                            </Badge>
                            {isHighMatch && (
                              <Badge className="text-xs bg-purple-100 text-purple-700 border border-purple-200">
                                <Users className="w-3 h-3 mr-1" />
                                High Match
                              </Badge>
                            )}
                            <Badge className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200 shadow-sm">
                              {project.project_type}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-grow pb-3 space-y-3">
                          <p className="text-gray-700 line-clamp-3 cu-text-responsive-xs leading-relaxed">
                            {project.description}
                          </p>

                          <div className="space-y-2 cu-text-responsive-xs text-gray-600">
                            {project.location && (
                              <div className="flex items-center">
                                <MapPin className="cu-icon-sm mr-2 flex-shrink-0 text-purple-500" />
                                <span className="truncate">{project.location}</span>
                              </div>
                            )}
                            {project.industry && (
                              <div className="flex items-center">
                                <Building2 className="cu-icon-sm mr-2 flex-shrink-0 text-indigo-500" />
                                <span className="truncate">{formatEnumLabel(project.industry)}</span>
                              </div>
                            )}
                            {project.area_of_interest && (
                              <div className="flex items-center">
                                <Tag className="cu-icon-sm mr-2 flex-shrink-0 text-pink-500" />
                                <span className="truncate">{project.area_of_interest}</span>
                              </div>
                            )}
                          </div>

                          {project.skills_needed && project.skills_needed.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {project.skills_needed.slice(0, 4).map(skill => {
                                const isUserSkill = currentUser?.skills?.some(
                                  userSkill => userSkill.toLowerCase() === skill.toLowerCase()
                                );
                                return (
                                  <Badge
                                    key={skill}
                                    className={`cu-text-responsive-xs ${
                                      isUserSkill
                                        ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-2 border-purple-400 font-semibold'
                                        : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200'
                                    }`}
                                  >
                                    {skill}
                                  </Badge>
                                );
                              })}
                              {project.skills_needed.length > 4 && (
                                <Badge variant="outline" className="cu-text-responsive-xs border-purple-200 text-purple-600">
                                  +{project.skills_needed.length - 4}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="bg-gradient-to-r from-gray-50 to-purple-50/30 border-t border-purple-100/50 p-4">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center text-purple-600 cu-text-responsive-xs">
                              <Users className="cu-icon-sm mr-1.5" />
                              <span className="font-medium">{project.current_collaborators_count || 1}</span>
                            </div>
                            <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                              <Button size="sm" className="cu-button cu-text-responsive-xs">
                                <Eye className="cu-icon-sm mr-1.5" />
                                View Project
                              </Button>
                            </Link>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}