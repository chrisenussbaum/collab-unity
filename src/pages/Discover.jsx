import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Clock, CheckCircle, MapPin, Building2, Tag, Eye, Plus, Briefcase, Megaphone, Lightbulb, Sparkles, Filter, X, Bell, BellOff, Bookmark, BookmarkCheck, HandHeart, DollarSign, Camera, Play, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserCard from "../components/discover/UserCard";
import { getPublicUserProfilesForDiscovery } from "@/functions/getPublicUserProfilesForDiscovery";
import { toast } from "sonner";
import HorizontalScrollContainer from "../components/HorizontalScrollContainer";
import ProjectActivityIndicator, { isProjectActive } from "../components/ProjectActivityIndicator";
import OptimizedImage from "@/components/OptimizedImage";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ServiceListingCard from "../components/ServiceListingCard";
import ClickableImage from "../components/ClickableImage";

const formatEnumLabel = (str) => {
  if (!str) return '';
  return String(str)
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const userProfileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

const withRetry = async (apiCall, maxRetries = 3, baseDelay = 3000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(3, attempt) + Math.random() * 2000;
        console.warn(`Rate limit hit, retrying in ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

export default function Discover({ currentUser: propCurrentUser }) {
  const [projects, setProjects] = useState([]);
  const [allProjectsUnfiltered, setAllProjectsUnfiltered] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);
  const [userInitialized, setUserInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [userInterests, setUserInterests] = useState(new Set());
  
  const [sortBy, setSortBy] = useState("most_recent");
  const [projectTypeFilter, setProjectTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [followedProjects, setFollowedProjects] = useState(new Set());
  const [projectApplauds, setProjectApplauds] = useState([]);

  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedProjectForApplication, setSelectedProjectForApplication] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  const [serviceListings, setServiceListings] = useState([]);
  const [serviceProviders, setServiceProviders] = useState({});
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = propCurrentUser || await base44.auth.me().catch(() => null);
        console.log("Initialized user:", user?.email);
        setCurrentUser(user);
      } catch (error) {
        console.log("User not authenticated", error);
        setCurrentUser(null);
      } finally {
        setUserInitialized(true);
      }
    };
    initializeUser();
  }, [propCurrentUser]);

  // UPDATED: Refresh user data when user-updated event fires
  useEffect(() => {
    const refreshUserData = async () => {
      if (userInitialized) {
        try {
          const freshUser = await base44.auth.me().catch(() => null);
          if (freshUser) {
            setCurrentUser(freshUser);
            if (freshUser.followed_projects) {
              setFollowedProjects(new Set(freshUser.followed_projects));
            } else {
              setFollowedProjects(new Set());
            }
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      }
    };
    
    refreshUserData();
  }, [userInitialized]);

  // UPDATED: Listen for user-updated events from Feed page
  useEffect(() => {
    const handleUserUpdated = (event) => {
      const updatedUser = event.detail;
      if (updatedUser) {
        setCurrentUser(updatedUser);
        if (updatedUser.followed_projects) {
          setFollowedProjects(new Set(updatedUser.followed_projects));
        } else {
          setFollowedProjects(new Set());
        }
      }
    };

    window.addEventListener('user-updated', handleUserUpdated);
    return () => window.removeEventListener('user-updated', handleUserUpdated);
  }, []);

  // Listen for project membership changes
  useEffect(() => {
    const handleProjectUpdated = async (event) => {
      const { projectId } = event.detail || {};
      if (projectId && currentUser) {
        // Refresh application status for this project
        try {
          const applications = await base44.entities.ProjectApplication.filter({
            project_id: projectId,
            applicant_email: currentUser.email
          });
          
          const hasActiveApplication = applications.some(
            app => app.status === 'pending' || app.status === 'accepted'
          );
          
          if (hasActiveApplication && !userInterests.has(projectId)) {
            setUserInterests(prev => new Set([...prev, projectId]));
          } else if (!hasActiveApplication && userInterests.has(projectId)) {
            setUserInterests(prev => {
              const newSet = new Set(prev);
              newSet.delete(projectId);
              return newSet;
            });
            // Update user's interested_projects
            const updatedInterests = (currentUser.interested_projects || []).filter(id => id !== projectId);
            await base44.auth.updateMe({ interested_projects: updatedInterests });
            setCurrentUser(prev => ({ ...prev, interested_projects: updatedInterests }));
          }
        } catch (error) {
          console.error("Error refreshing application status:", error);
        }
      }
    };

    window.addEventListener('projectUpdated', handleProjectUpdated);
    return () => window.removeEventListener('projectUpdated', handleProjectUpdated);
  }, [currentUser, userInterests]);

  useEffect(() => {
    const syncApplicationStatus = async () => {
      if (currentUser?.interested_projects) {
        setUserInterests(new Set(currentUser.interested_projects));
      } else {
        setUserInterests(new Set());
      }
      if (currentUser?.followed_projects) {
        setFollowedProjects(new Set(currentUser.followed_projects));
      } else {
        setFollowedProjects(new Set());
      }
      
      // Sync actual application status
      if (currentUser && currentUser.interested_projects && currentUser.interested_projects.length > 0) {
        try {
          const applications = await base44.entities.ProjectApplication.filter({
            applicant_email: currentUser.email
          });
          
          const pendingProjectIds = applications
            .filter(app => app.status === 'pending' || app.status === 'accepted')
            .map(app => app.project_id);
          
          // Update interested_projects to only include projects with pending/accepted applications
          if (pendingProjectIds.length !== currentUser.interested_projects.length || 
              !currentUser.interested_projects.every(id => pendingProjectIds.includes(id))) {
            await base44.auth.updateMe({ interested_projects: pendingProjectIds });
            setUserInterests(new Set(pendingProjectIds));
          }
        } catch (error) {
          console.error("Error syncing application status:", error);
        }
      }
    };
    
    syncApplicationStatus();
  }, [currentUser]);

  const queryClient = useQueryClient();

  const { data: projectsQueryData, isLoading: isProjectsQueryLoading } = useQuery({
    queryKey: ['discover-projects', currentUser?.email],
    queryFn: async () => {
      // Parallel fetch projects and applauds
      const [rawAllProjects, allApplauds] = await Promise.all([
        withRetry(() => base44.entities.Project.filter({ 
          is_visible_on_feed: true
        }, "-created_date")),
        withRetry(() => base44.entities.ProjectApplaud.filter({}))
      ]);
      
      // Fetch owner profiles for ALL projects
      const ownerEmails = [...new Set(rawAllProjects.map(p => p.created_by))];
      let profilesMap = {};
      
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

        cachedProfiles.forEach(profile => {
          profilesMap[profile.email] = profile;
        });

        if (uncachedEmails.length > 0) {
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
        }
      }

      // Fetch collaborator profiles for all projects (first 3 per project)
      const allCollaboratorEmails = new Set();
      rawAllProjects.forEach(project => {
        if (project.collaborator_emails) {
          project.collaborator_emails.slice(0, 3).forEach(email => allCollaboratorEmails.add(email));
        }
      });

      let collaboratorProfilesMap = {};
      if (allCollaboratorEmails.size > 0) {
        const { data: collabProfiles } = await getPublicUserProfiles({ emails: Array.from(allCollaboratorEmails) });
        (collabProfiles || []).forEach(profile => {
          collaboratorProfilesMap[profile.email] = profile;
        });
      }

      // Apply owner and collaborator profiles to ALL projects
      const allProjectsWithOwners = rawAllProjects.map(project => ({
        ...project,
        owner: profilesMap[project.created_by] || {
          email: project.created_by,
          full_name: project.created_by.split('@')[0],
          profile_image: null
        },
        collaboratorProfiles: project.collaborator_emails 
          ? project.collaborator_emails.slice(0, 3).map(email => collaboratorProfilesMap[email]).filter(Boolean)
          : [],
        collaboratorProfilesMap: collaboratorProfilesMap
      }));

      // Filter for the 'projects' tab (excluding own/collaborated)
      let filteredForProjectsTab = allProjectsWithOwners;
      if (currentUser && currentUser.email) {
        filteredForProjectsTab = allProjectsWithOwners.filter(project => {
          const isOwnProject = project.created_by === currentUser.email;
          const isCollaborator = project.collaborator_emails?.includes(currentUser.email);
          return !isOwnProject && !isCollaborator;
        });
      }
      
      return {
        allProjects: allProjectsWithOwners,
        projects: filteredForProjectsTab,
        applauds: allApplauds
      };
    },
    enabled: userInitialized,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: usersQueryData, isLoading: isUsersQueryLoading } = useQuery({
    queryKey: ['discover-users', currentUser?.email],
    queryFn: async () => {
      const { data: allUsers } = await withRetry(() => getPublicUserProfilesForDiscovery());
      
      let filteredUsers = allUsers || [];
      
      // Filter out current user by email and id
      if (currentUser) {
        filteredUsers = filteredUsers.filter(user => 
          user.email !== currentUser.email && 
          user.id !== currentUser.id
        );
      }
      
      return filteredUsers;
    },
    enabled: userInitialized && activeTab === "people",
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: servicesQueryData, isLoading: isServicesQueryLoading } = useQuery({
    queryKey: ['discover-services'],
    queryFn: async () => {
      const allListings = await withRetry(() => base44.entities.ServiceListing.filter({}));
      
      // Fetch provider profiles
      const providerEmails = [...new Set(allListings.map(l => l.provider_email))];
      let providersMap = {};
      
      if (providerEmails.length > 0) {
        const { data: providerProfiles } = await withRetry(() => 
          getPublicUserProfiles({ emails: providerEmails })
        );
        
        (providerProfiles || []).forEach(profile => {
          providersMap[profile.email] = profile;
        });
      }
      
      return {
        listings: allListings,
        providers: providersMap
      };
    },
    enabled: userInitialized && activeTab === "services",
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update state when query data changes
  useEffect(() => {
    if (projectsQueryData && activeTab === "projects") {
      setAllProjectsUnfiltered(projectsQueryData.allProjects);
      setProjects(projectsQueryData.projects);
      setProjectApplauds(projectsQueryData.applauds);
      setIsLoading(false);
    }
  }, [projectsQueryData, activeTab]);

  useEffect(() => {
    if (usersQueryData && activeTab === "people") {
      setUsers(usersQueryData);
      setIsLoadingUsers(false);
    }
  }, [usersQueryData, activeTab]);

  useEffect(() => {
    if (servicesQueryData && activeTab === "services") {
      setServiceListings(servicesQueryData.listings);
      setServiceProviders(servicesQueryData.providers);
      setIsLoadingServices(false);
    }
  }, [servicesQueryData, activeTab]);

  useEffect(() => {
    setIsLoading(isProjectsQueryLoading && activeTab === "projects");
    setIsLoadingUsers(isUsersQueryLoading && activeTab === "people");
    setIsLoadingServices(isServicesQueryLoading && activeTab === "services");
  }, [isProjectsQueryLoading, isUsersQueryLoading, isServicesQueryLoading, activeTab]);

  const handleFollow = async (projectId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      return;
    }

    try {
      const isFollowing = followedProjects.has(projectId);
      
      if (isFollowing) {
        const updatedFollowed = (currentUser.followed_projects || []).filter(id => id !== projectId);
        await base44.auth.updateMe({ followed_projects: updatedFollowed });
        
        setFollowedProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
        
        setCurrentUser(prev => ({ ...prev, followed_projects: updatedFollowed }));
      } else {
        const updatedFollowed = [...(currentUser.followed_projects || []), projectId];
        await base44.auth.updateMe({ followed_projects: updatedFollowed });
        
        setFollowedProjects(prev => new Set([...prev, projectId]));
        
        setCurrentUser(prev => ({ ...prev, followed_projects: updatedFollowed }));
      }
    } catch (error) {
      console.error("Error handling follow:", error);
      toast.error("Failed to update follow status.");
    }
  };

  const handleExpressInterest = async (project, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      return;
    }

    const isInterested = userInterests.has(project.id);
    
    if (isInterested) {
      // Withdraw application
      try {
        const updatedInterests = currentUser.interested_projects ? currentUser.interested_projects.filter(id => id !== project.id) : [];
        await base44.auth.updateMe({ interested_projects: updatedInterests });
        
        setUserInterests(prev => {
          const newSet = new Set(prev);
          newSet.delete(project.id);
          return newSet;
        });
        
        const existingApplications = await base44.entities.ProjectApplication.filter({
          project_id: project.id,
          applicant_email: currentUser.email,
          status: 'pending'
        });
        
        if (existingApplications && existingApplications.length > 0) {
          await base44.entities.ProjectApplication.update(existingApplications[0].id, {
            status: 'withdrawn'
          });
        }
        
        setCurrentUser(prev => ({ ...prev, interested_projects: updatedInterests }));
      } catch (error) {
        console.error("Error withdrawing application:", error);
        toast.error("Failed to withdraw application.");
      }
    } else {
      // Show application dialog
      setSelectedProjectForApplication(project);
      setApplicationMessage("");
      setShowApplicationDialog(true);
    }
  };

  const handleSubmitApplication = async () => {
    if (!applicationMessage.trim()) {
      toast.error("Please write a message to the project owner.");
      return;
    }

    setIsSubmittingApplication(true);
    try {
      const project = selectedProjectForApplication;
      
      const updatedInterests = [...(currentUser.interested_projects || []), project.id];
      await base44.auth.updateMe({ interested_projects: updatedInterests });
      
      setUserInterests(prev => new Set([...prev, project.id]));
      
      const existingApplications = await base44.entities.ProjectApplication.filter({
        project_id: project.id,
        applicant_email: currentUser.email
      });
      
      if (existingApplications && existingApplications.length > 0) {
        const existingApp = existingApplications[0];
        if (existingApp.status === 'withdrawn' || existingApp.status === 'rejected') {
          await base44.entities.ProjectApplication.update(existingApp.id, {
            status: 'pending',
            message: applicationMessage.trim()
          });
        }
      } else {
        await base44.entities.ProjectApplication.create({
          project_id: project.id,
          applicant_email: currentUser.email,
          message: applicationMessage.trim(),
          status: 'pending'
        });
      }
      
      if (project.created_by !== currentUser.email) {
        await base44.entities.Notification.create({
          user_email: project.created_by,
          title: `New application for "${project.title}"`,
          message: `${currentUser.full_name || currentUser.email} has applied to join your project.`,
          type: "project_application",
          related_project_id: project.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email,
          metadata: { project_title: project.title }
        });
      }
      
      setCurrentUser(prev => ({ ...prev, interested_projects: updatedInterests }));
      setShowApplicationDialog(false);
      setApplicationMessage("");
      setSelectedProjectForApplication(null);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const calculateMatchScore = useCallback((project) => {
    if (!currentUser) return 0;
    
    let score = 0;
    const userSkills = currentUser.skills || [];
    const userInterests = currentUser.interests || [];
    const userTools = currentUser.tools_technologies || [];
    
    // Match based on skills
    if (project.skills_needed && userSkills.length > 0) {
      const matchingSkills = project.skills_needed.filter(skill =>
        userSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())
      );
      score += matchingSkills.length * 3;
    }
    
    // Match based on tools
    if (project.tools_needed && userTools.length > 0) {
      const matchingTools = project.tools_needed.filter(tool =>
        userTools.some(userTool => userTool.toLowerCase() === tool.toLowerCase())
      );
      score += matchingTools.length * 2;
    }
    
    // Match based on interests and area of interest
    if (project.area_of_interest && userInterests.length > 0) {
      const matchingInterests = userInterests.filter(interest =>
        project.area_of_interest.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(project.area_of_interest.toLowerCase())
      );
      score += matchingInterests.length * 2;
    }
    
    // Match based on location
    if (project.location && currentUser.location) {
      if (project.location.toLowerCase().includes(currentUser.location.toLowerCase()) ||
          currentUser.location.toLowerCase().includes(project.location.toLowerCase())) {
        score += 1;
      }
    }
    
    return score;
  }, [currentUser]);

  const calculateUserMatchScore = useCallback((user) => {
    if (!currentUser) return 0;
    
    let score = 0;
    const currentUserSkills = currentUser.skills || [];
    const currentUserInterests = currentUser.interests || [];
    const currentUserTools = currentUser.tools_technologies || [];
    
    // Match based on skills
    if (user.skills && currentUserSkills.length > 0) {
      const matchingSkills = user.skills.filter(skill =>
        currentUserSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())
      );
      score += matchingSkills.length * 3;
    }
    
    // Match based on tools
    if (user.tools_technologies && currentUserTools.length > 0) {
      const matchingTools = user.tools_technologies.filter(tool =>
        currentUserTools.some(userTool => userTool.toLowerCase() === tool.toLowerCase())
      );
      score += matchingTools.length * 2;
    }
    
    // Match based on interests
    if (user.interests && currentUserInterests.length > 0) {
      const matchingInterests = user.interests.filter(interest =>
        currentUserInterests.some(currentUserInterest => currentUserInterest.toLowerCase() === interest.toLowerCase())
      );
      score += matchingInterests.length * 2;
    }
    
    // Match based on location
    if (user.location && currentUser.location) {
      if (user.location.toLowerCase().includes(currentUser.location.toLowerCase()) ||
          currentUser.location.toLowerCase().includes(user.location.toLowerCase())) {
        score += 1;
      }
    }
    
    return score;
  }, [currentUser]);

  const { allSkills, allIndustries } = useMemo(() => {
    const skillsSet = new Set();
    const industriesSet = new Set();
    
    if (activeTab === "projects") { // Removed 'following'
      projects.forEach(project => {
        if (project.skills_needed) {
          project.skills_needed.forEach(skill => skillsSet.add(skill));
        }
        if (project.industry) {
          industriesSet.add(project.industry);
        }
      });
    } else if (activeTab === "people") {
      users.forEach(user => {
        if (user.skills) {
          user.skills.forEach(skill => skillsSet.add(skill));
        }
      });
    }
    
    return {
      allSkills: Array.from(skillsSet).sort(),
      allIndustries: Array.from(industriesSet).sort()
    };
  }, [projects, users, activeTab]);

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = searchQuery === "" || 
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.area_of_interest?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.skills_needed && project.skills_needed.some(skill =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        ));

      const matchesSkills = selectedSkills.length === 0 || (
        project.skills_needed && selectedSkills.every(selectedSkill =>
          project.skills_needed.some(projectSkill => 
            projectSkill.toLowerCase() === selectedSkill.toLowerCase()
          )
        )
      );

      const matchesIndustry = selectedIndustries.length === 0 || 
        selectedIndustries.includes(project.industry);

      const matchesType = projectTypeFilter === "all" || 
        (projectTypeFilter === "collaborative" && project.project_type === "Collaborative") ||
        (projectTypeFilter === "personal" && project.project_type === "Personal");

      const matchesStatus = statusFilter === "all" || project.status === statusFilter;

      if (showOnlyMatching && currentUser) {
        const score = calculateMatchScore(project);
        return matchesSearch && matchesSkills && matchesIndustry && matchesType && matchesStatus && score > 0;
      }

      return matchesSearch && matchesSkills && matchesIndustry && matchesType && matchesStatus;
    });

    filtered = filtered.map(project => ({
      ...project,
      matchScore: calculateMatchScore(project),
      applaudCount: projectApplauds.filter(a => a.project_id === project.id).length
    }));

    filtered.sort((a, b) => {
      if (sortBy === "most_recent") {
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (sortBy === "most_popular") {
        if (b.applaudCount !== a.applaudCount) {
          return b.applaudCount - a.applaudCount;
        }
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (sortBy === "best_match") {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (sortBy === "most_active") {
        return new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date);
      }
      return 0;
    });

    return filtered;
  }, [projects, searchQuery, selectedSkills, selectedIndustries, projectTypeFilter, statusFilter, showOnlyMatching, sortBy, currentUser, calculateMatchScore, projectApplauds]);

  const recommendedProjects = useMemo(() => {
    if (!currentUser) return [];
    
    // Show recommendations if user has ANY profile data (skills, tools, or interests)
    const hasSkills = currentUser.skills && currentUser.skills.length > 0;
    const hasTools = currentUser.tools_technologies && currentUser.tools_technologies.length > 0;
    const hasInterests = currentUser.interests && currentUser.interests.length > 0;
    
    if (!hasSkills && !hasTools && !hasInterests) {
      return [];
    }
    
    return filteredProjects
      .filter(p => p.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);
  }, [filteredProjects, currentUser]);

  // Removed followedProjectsList useMemo as the "Following" tab is removed.

  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = searchQuery === "" ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.skills && user.skills.some(skill =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        )) ||
        (user.interests && user.interests.some(interest =>
          interest.toLowerCase().includes(searchQuery.toLowerCase())
        ));

      const matchesSkills = selectedSkills.length === 0 || (
        user.skills && selectedSkills.every(selectedSkill =>
          user.skills.some(userSkill => 
            userSkill.toLowerCase() === selectedSkill.toLowerCase()
          )
        )
      );

      if (showOnlyMatching && currentUser) {
        const score = calculateUserMatchScore(user);
        return matchesSearch && matchesSkills && score > 0;
      }

      return matchesSearch && matchesSkills;
    });

    if (currentUser) {
      filtered = filtered.map(user => ({
        ...user,
        matchScore: calculateUserMatchScore(user)
      })).sort((a, b) => {
        if (showOnlyMatching) {
          return b.matchScore - a.matchScore;
        }
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return 0;
      });
    }

    return filtered;
  }, [users, searchQuery, selectedSkills, showOnlyMatching, currentUser, calculateUserMatchScore]);

  const filteredServices = useMemo(() => {
    return serviceListings.filter(listing => {
      const provider = serviceProviders[listing.provider_email];
      
      const matchesSearch = searchQuery === "" ||
        listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (listing.skills_offered && listing.skills_offered.some(skill =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        ));

      const matchesSkills = selectedSkills.length === 0 || (
        listing.skills_offered && selectedSkills.every(selectedSkill =>
          listing.skills_offered.some(skill => 
            skill.toLowerCase() === selectedSkill.toLowerCase()
          )
        )
      );

      return matchesSearch && matchesSkills;
    });
  }, [serviceListings, serviceProviders, searchQuery, selectedSkills]);

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

  const clearAllFilters = () => {
    setSelectedSkills([]);
    setSelectedIndustries([]);
    setShowOnlyMatching(false);
    setSearchQuery("");
    setProjectTypeFilter("all");
    setStatusFilter("all");
    setSortBy("most_recent");
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSkills.length > 0) count += selectedSkills.length;
    if (selectedIndustries.length > 0) count += selectedIndustries.length;
    if (projectTypeFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (showOnlyMatching) count++;
    if (searchQuery !== "") count++;
    return count;
  }, [selectedSkills, selectedIndustries, projectTypeFilter, statusFilter, showOnlyMatching, searchQuery]);

  const hasActiveFilters = activeFilterCount > 0;

  const statusConfig = {
    seeking_collaborators: {
      color: "border-orange-500",
      icon: <Users className="w-3 h-3 mr-1 text-orange-500" />,
      label: "Seeking Collaborators"
    },
    in_progress: {
      color: "border-blue-500",
      icon: <Clock className="w-3 h-3 mr-1 text-blue-500" />,
      label: "In Progress"
    },
    completed: {
      color: "border-green-500",
      icon: <CheckCircle className="w-3 h-3 mr-1 text-green-500" />,
      label: "Completed"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Apply to join "{selectedProjectForApplication?.title}"</DialogTitle>
            <DialogDescription>
              Send a message to the project owner explaining why you'd be a great collaborator.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="application-message">Your Message *</Label>
              <Textarea
                id="application-message"
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Introduce yourself, mention relevant skills, and express your interest..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {applicationMessage.length} characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApplicationDialog(false);
                setApplicationMessage("");
                setSelectedProjectForApplication(null);
              }}
              disabled={isSubmittingApplication}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={isSubmittingApplication || !applicationMessage.trim()}
              className="cu-button"
            >
              {isSubmittingApplication ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white border-b border-gray-200 py-16 sm:py-20 md:py-24 -mt-14 pt-28 sm:-mt-16 sm:pt-32 md:-mt-20 md:pt-36">
        <div className="cu-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-gray-900">
              Where <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Ideas</span> Happen
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto px-4">
              Connect with talented professionals, collaborate on meaningful projects,
              and bring your vision to life.
            </p>
            
            <div className="hidden sm:flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 px-4">
              <Link to={createPageUrl("Marketplace")}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 cu-button-mobile-full"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Marketplace
                </Button>
              </Link>
              
              <Link to={createPageUrl("CreateProject")}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all cu-button-mobile-full"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Project
                </Button>
              </Link>

              <Link to={createPageUrl("Advertise")}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 cu-button-mobile-full"
                >
                  <Megaphone className="w-5 h-5 mr-2" />
                  Promote
                </Button>
              </Link>
            </div>

            <div className="flex sm:hidden flex-col items-center justify-center gap-3 mb-6 px-4">
              <Link to={createPageUrl("Marketplace")} className="w-full">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 w-full"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Marketplace
                </Button>
              </Link>

              <Link to={createPageUrl("CreateProject")} className="w-full">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all w-full"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Project
                </Button>
              </Link>

              <Link to={createPageUrl("Advertise")} className="w-full">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 w-full"
                >
                  <Megaphone className="w-5 h-5 mr-2" />
                  Promote
                </Button>
              </Link>
            </div>

          </motion.div>
        </div>
      </div>

      <div className="cu-container">
        <div className="cu-page">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="projects" className="text-sm sm:text-base">
                <Briefcase className="w-4 h-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="people" className="text-sm sm:text-base">
                <Users className="w-4 h-4 mr-2" />
                Collaborators
              </TabsTrigger>
              <TabsTrigger value="services" className="text-sm sm:text-base">
                <DollarSign className="w-4 h-4 mr-2" />
                Services
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
              {recommendedProjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Projects that match your skills and interests</p>
                    
                    <HorizontalScrollContainer showArrows={recommendedProjects.length > 1}>
                      {recommendedProjects.map((project) => {
                        const config = statusConfig[project.status] || {};
                        const isInterested = userInterests.has(project.id);
                        const isOwnProject = currentUser && project.created_by === currentUser.email;

                        return (
                          <Link 
                            key={project.id} 
                            to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                            className="flex-shrink-0 w-[280px] sm:w-[320px] block"
                          >
                            <Card className={`cu-card h-full flex flex-col border-t-4 ${config.color} hover:shadow-lg transition-shadow`}>
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-start space-x-2 flex-1 min-w-0">
                                    <img 
                                      src={project.logo_url} 
                                      alt={project.title}
                                      className="w-10 h-10 rounded-lg object-cover border-2 border-gray-100 shadow-sm flex-shrink-0"
                                      loading="lazy"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-bold text-sm text-gray-900 hover:text-purple-600 transition-colors line-clamp-2">
                                        {project.title}
                                      </h3>
                                      <Badge className="mt-1 text-xs bg-purple-600 text-white">
                                        {project.matchScore}% Match
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                  {project.description}
                                </p>
                              </CardHeader>
                              
                              <CardContent className="flex-grow pb-2">
                                {project.skills_needed && project.skills_needed.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {project.skills_needed.slice(0, 3).map(skill => (
                                      <Badge key={skill} className="text-xs bg-purple-100 text-purple-700">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {project.skills_needed.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{project.skills_needed.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                              
                              <CardFooter className="bg-gray-50 border-t p-3">
                                {currentUser && !isOwnProject && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => handleExpressInterest(project, e)}
                                    className={`w-full ${isInterested ? 'bg-purple-50 border-purple-300' : ''}`}
                                  >
                                    <Briefcase className={`w-4 h-4 mr-2 ${isInterested ? 'fill-purple-600 text-purple-600' : ''}`} />
                                    {isInterested ? 'Applied' : 'Apply'}
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          </Link>
                        );
                      })}
                    </HorizontalScrollContainer>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div className="relative mb-4">
                  <Input
                    type="text"
                    placeholder="Search projects by title, skills, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white"
                  />
                  <Lightbulb className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filters:</span>
                    {activeFilterCount > 0 && (
                      <Badge className="bg-purple-600 text-white">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </div>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="most_recent">Most Recent</SelectItem>
                      <SelectItem value="most_popular">Most Applauded</SelectItem>
                      {currentUser && <SelectItem value="best_match">Best Match</SelectItem>}
                      <SelectItem value="most_active">Most Active</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
                    <SelectTrigger className="w-[160px] bg-white">
                      <SelectValue placeholder="Project Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="collaborative">Collaborative</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="seeking_collaborators">Seeking Collaborators</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {currentUser && (
                    <Button
                      variant={showOnlyMatching ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowOnlyMatching(!showOnlyMatching)}
                      className={showOnlyMatching ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-white"}
                    >
                      Show Only Matching
                    </Button>
                  )}

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedSkills.map(skill => (
                      <Badge 
                        key={skill} 
                        className="bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                    {selectedIndustries.map(industry => (
                      <Badge 
                        key={industry} 
                        className="bg-indigo-100 text-indigo-800 cursor-pointer hover:bg-indigo-200"
                        onClick={() => toggleIndustry(industry)}
                      >
                        {formatEnumLabel(industry)}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                {allSkills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Filter by Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {allSkills.slice(0, 10).map(skill => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className={`cursor-pointer transition-colors ${
                            selectedSkills.includes(skill)
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {allIndustries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Filter by Industry:</h4>
                    <div className="flex flex-wrap gap-2">
                      {allIndustries.map(industry => (
                        <Badge
                          key={industry}
                          variant="outline"
                          className={`cursor-pointer transition-colors ${
                            selectedIndustries.includes(industry)
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                          onClick={() => toggleIndustry(industry)}
                        >
                          {formatEnumLabel(industry)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {isLoading ? (
                <div className="text-center py-16">
                  <p className="cu-text-responsive-sm text-gray-500">Loading projects...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16">
                  <Lightbulb className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="cu-text-responsive-lg font-semibold text-gray-900 mb-2">
                    {hasActiveFilters ? "No matching projects found" : "No projects available"}
                  </h3>
                  <p className="text-gray-600 cu-text-responsive-sm mb-4">
                    {hasActiveFilters 
                      ? "Try adjusting your filters or search terms" 
                      : "Check back later for exciting collaborative opportunities!"}
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearAllFilters} variant="outline">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="cu-grid-responsive-1-2-3">
                  {filteredProjects.map((project, index) => {
                    const config = statusConfig[project.status] || {};
                    const isHighMatch = currentUser && project.matchScore >= 5;
                    const isInterested = userInterests.has(project.id);
                    const isFollowing = followedProjects.has(project.id);
                    const isOwnProject = currentUser && project.created_by === currentUser.email;
                    
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                          <Card className={`cu-card h-full flex flex-col border-t-4 ${config.color} hover:shadow-lg transition-shadow cursor-pointer`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                  <div className="relative flex-shrink-0">
                                    <OptimizedImage
                                      src={project.logo_url} 
                                      alt={project.title}
                                      width={96}
                                      className="w-12 h-12 rounded-lg object-cover border-2 border-gray-100 shadow-sm"
                                      loading="lazy"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-gray-900 hover:text-purple-600 transition-colors line-clamp-2 cu-text-responsive-sm leading-tight">
                                        {project.title}
                                      </h3>
                                      <ProjectActivityIndicator 
                                        isActive={isProjectActive(project.collaborator_emails, project.collaboratorProfilesMap || {})} 
                                        size="sm"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Link
                                        to={createPageUrl(project.owner?.username ? `UserProfile?username=${project.owner.username}` : `UserProfile?email=${project.created_by}`)}
                                        className="flex items-center space-x-1.5"
                                        onClick={(e) => e.stopPropagation()} // Prevent card link from firing
                                      >
                                        <OptimizedAvatar
                                          src={project.owner?.profile_image}
                                          alt={project.owner?.full_name || 'Owner'}
                                          fallback={project.owner?.full_name?.[0] || 'U'}
                                          size="xs"
                                          className="w-5 h-5 border-2 border-white shadow-sm"
                                        />
                                        <span className="cu-text-responsive-xs text-gray-600 hover:text-purple-600 transition-colors">
                                          {project.owner?.full_name || 'Anonymous'}
                                        </span>
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                                
                                {currentUser && !isOwnProject && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 ${isFollowing ? 'text-purple-600 hover:text-purple-700 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                                    onClick={(e) => handleFollow(project.id, e)}
                                    title={isFollowing ? "Unfollow" : "Follow for updates"}
                                  >
                                    {isFollowing ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                  </Button>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge variant="outline" className={`text-xs ${config.color} border-current shadow-sm`}>
                                  {config.icon}
                                  <span className="ml-1">{formatEnumLabel(project.status)}</span>
                                </Badge>
                                {isHighMatch && (
                                  <Badge className="text-xs bg-purple-600 text-white">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    {project.matchScore}% Match
                                  </Badge>
                                )}
                                {project.classification && (
                                  <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50">
                                    {formatEnumLabel(project.classification)}
                                  </Badge>
                                )}
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
                                  {project.skills_needed.slice(0, 4).map(skill => (
                                    <Badge key={skill} className="cu-text-responsive-xs bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {project.skills_needed.length > 4 && (
                                    <Badge variant="outline" className="cu-text-responsive-xs border-purple-200 text-purple-600">
                                      +{project.skills_needed.length - 4}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {project.highlights && project.highlights.length > 0 && (
                                <div className="pt-3 border-t">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Camera className="w-4 h-4 text-purple-600" />
                                    <span className="text-xs font-medium text-gray-700">Project Highlights</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {project.highlights.slice(0, 3).map((highlight, idx) => {
                                      const mediaUrl = highlight.media_url || highlight.image_url;
                                      const mediaType = highlight.media_type || 'image';
                                      
                                      return (
                                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100" onClick={(e) => e.preventDefault()}>
                                          {mediaType === 'video' ? (
                                            <div className="relative w-full h-full">
                                              {highlight.thumbnail_url ? (
                                                <img 
                                                  src={highlight.thumbnail_url} 
                                                  alt={highlight.caption || 'Video thumbnail'}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <video 
                                                  src={mediaUrl}
                                                  className="w-full h-full object-cover"
                                                />
                                              )}
                                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <Play className="w-6 h-6 text-white" />
                                              </div>
                                            </div>
                                          ) : (
                                            <ClickableImage
                                              src={mediaUrl} 
                                              alt={highlight.caption || 'Project highlight'}
                                              caption={highlight.caption}
                                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                                            />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {project.project_urls && project.project_urls.length > 0 && (
                                <div className="pt-3 border-t">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ExternalLink className="w-4 h-4 text-purple-600" />
                                    <span className="text-xs font-medium text-gray-700">Showcase</span>
                                  </div>
                                  <div className="space-y-1">
                                    {project.project_urls.slice(0, 2).map((link, idx) => (
                                      <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-xs text-purple-600 hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        {link.title || link.url}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>

                            <CardFooter className="bg-gradient-to-r from-gray-50 to-purple-50/30 border-t border-purple-100/50 p-4">
                              <div className="flex items-center justify-between w-full gap-3">
                              <div className="flex items-center gap-3 text-gray-600 cu-text-responsive-xs">
                                <div className="flex items-center gap-1.5 text-purple-600">
                                  {project.collaboratorProfiles && project.collaboratorProfiles.length > 0 ? (
                                    <div className="flex items-center -space-x-1.5">
                                      {project.collaboratorProfiles.map((collab) => (
                                        <OptimizedAvatar
                                          key={collab.email}
                                          src={collab.profile_image}
                                          alt={collab.full_name || 'Collaborator'}
                                          fallback={collab.full_name?.[0] || collab.email?.[0] || 'U'}
                                          size="xs"
                                          className="w-6 h-6 border-2 border-white shadow-sm"
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <Users className="cu-icon-sm" />
                                  )}
                                  <span className="font-medium ml-1">{project.collaborator_emails?.length || 1}</span>
                                </div>
                                {project.applaudCount > 0 && (
                                  <div className="flex items-center text-purple-600">
                                    <HandHeart className="cu-icon-sm mr-1" />
                                    <span className="font-medium">{project.applaudCount}</span>
                                  </div>
                                )}
                              </div>
                                {currentUser && !isOwnProject && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => handleExpressInterest(project, e)}
                                    className={`flex-shrink-0 ${isInterested ? 'bg-purple-50 border-purple-300' : ''}`}
                                    title={isInterested ? "Withdraw application" : "Apply to join"}
                                  >
                                    <Briefcase className={`w-4 h-4 ${isInterested ? 'fill-purple-600 text-purple-600' : ''}`} />
                                  </Button>
                                )}
                              </div>
                            </CardFooter>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="people">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div className="relative mb-4">
                  <Input
                    type="text"
                    placeholder="Search collaborators by name, skills, or interests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white"
                  />
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filters:</span>
                  </div>
                  
                  {currentUser && (
                    <>
                      <Button
                        variant={!showOnlyMatching ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowOnlyMatching(false)}
                        className={!showOnlyMatching ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
                      >
                        Show All
                      </Button>
                      <Button
                        variant={showOnlyMatching ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowOnlyMatching(true)}
                        className={showOnlyMatching ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
                      >
                        Show Only Matching
                      </Button>
                    </>
                  )}

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedSkills.map(skill => (
                      <Badge 
                        key={skill} 
                        className="bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                {allSkills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Filter by Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {allSkills.slice(0, 10).map(skill => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className={`cursor-pointer transition-colors ${
                            selectedSkills.includes(skill)
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {isLoadingUsers ? (
                <div className="text-center py-16">
                  <p className="cu-text-responsive-sm text-gray-500">Loading collaborators...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="cu-text-responsive-lg font-semibold text-gray-900 mb-2">
                    {hasActiveFilters ? "No matching collaborators found" : "No collaborators available"}
                  </h3>
                  <p className="text-gray-600 cu-text-responsive-sm mb-4">
                    {hasActiveFilters 
                      ? "Try adjusting your filters or search terms" 
                      : "Check back later for new collaborators!"}
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearAllFilters} variant="outline">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="cu-grid-responsive-1-2-3">
                  {filteredUsers.map((user, index) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      currentUser={currentUser}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="services">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div className="relative mb-4">
                  <Input
                    type="text"
                    placeholder="Search services by title, skills, or provider..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white"
                  />
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                {allSkills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Filter by Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {allSkills.slice(0, 10).map(skill => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className={`cursor-pointer transition-colors ${
                            selectedSkills.includes(skill)
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedSkills.map(skill => (
                      <Badge 
                        key={skill} 
                        className="bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>

              {isLoadingServices ? (
                <div className="text-center py-16">
                  <p className="cu-text-responsive-sm text-gray-500">Loading services...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-16">
                  <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="cu-text-responsive-lg font-semibold text-gray-900 mb-2">
                    {hasActiveFilters ? "No matching services found" : "No services available yet"}
                  </h3>
                  <p className="text-gray-600 cu-text-responsive-sm mb-4">
                    {hasActiveFilters 
                      ? "Try adjusting your filters or search terms" 
                      : "Be the first to offer your services!"}
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearAllFilters} variant="outline">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="cu-grid-responsive-1-2-3">
                  {filteredServices.map((listing, index) => (
                    <ServiceListingCard
                      key={listing.id}
                      listing={listing}
                      provider={serviceProviders[listing.provider_email]}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}