import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, User, Notification, Comment, Issue, Task, AssetVersion, ProjectTemplate, ProjectApplication, ProjectInvitation } from "@/entities/all";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  Users,
  MapPin,
  Link as LinkIcon,
  Plus,
  Heart,
  Briefcase,
  GraduationCap,
  Building,
  Rocket,
  Eye,
  EyeOff,
  Share2,
  Lightbulb,
  UserPlus,
  Pencil,
  Trash2,
  Save,
  X, // Added X for decline button
  Check, // Added Check for accept button
  ExternalLink,
  Upload,
  Camera,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import WorkspaceTabs from "@/components/workspace/WorkspaceTabs";
import ProjectHighlights from "../components/project/ProjectHighlights";
import ClickableImage from "../components/ClickableImage";
import ContextualSearchAssistant from "../components/workspace/ContextualSearchAssistant";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion"; // Added motion for banner animation

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ProjectApplicationsManager from "../components/ProjectApplicationsManager";
import ProjectMembershipManager from "../components/ProjectMembershipManager";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";
import { UploadFile } from "@/functions/UploadFile";
import ProjectFundingCard from "../components/ProjectFundingCard";
import CommunicationsPanel from '../components/CommunicationsPanel';
import SocialsPanel from '../components/SocialsPanel';
import ProjectLinkPreview from "../components/ProjectLinkPreview"; // New import
import HorizontalScrollContainer from "../components/HorizontalScrollContainer"; // New import
import IDEPreviewDialog from "@/components/IDEPreviewDialog";
import { base44 } from "@/api/base44Client";
import { Code, Maximize2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ProjectLinksManager from "../components/ProjectLinksManager";
import CollaboratorPresence from "../components/CollaboratorPresence";
import AIProjectAssistant from "../components/workspace/AIProjectAssistant";

// Add Hat icon component after imports - LIGHTER VERSION
const HatIcon = ({ className }) => (
  <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="32" className={className}>
    <path d="M258.4 17.6c-1.2-1.2-2.7-2.2-4.4-2.9-1.6-.7-3.4-1-5.1-1-1.8 0-3.5.3-5.1 1-1.6.7-3.1 1.7-4.4 2.9L101.3 156.7c-2.4 2.4-3.7 5.6-3.7 9s1.3 6.6 3.7 9l138.1 139.1c2.4 2.4 5.6 3.7 9 3.7s6.6-1.3 9-3.7l138.1-139.1c2.4-2.4 3.7-5.6 3.7-9s-1.3-6.6-3.7-9L258.4 17.6z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M469.3 355.3c-7.9-10.2-18.7-18-31.1-22.4L399 323.5l-59-162.7v-.1L249 17.5l-91 143.2v.1l-59 162.7-39.2 9.4c-12.4 4.4-23.2 12.2-31.1 22.4-7.9 10.2-12.4 22.7-12.4 35.7 0 31.6 25.7 57.3 57.3 57.3h351c31.6 0 57.3-25.7 57.3-57.3 0-13-4.5-25.5-12.4-35.7z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Enhanced retry logic with more aggressive backoff for rate limiting
const withRetry = async (apiCall, maxRetries = 5, baseDelay = 2000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        // More aggressive backoff for rate limiting: 2s, 4s, 8s, 16s, 32s
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000;
        console.warn(`Rate limit hit, retrying in ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// Add request debouncing to prevent rapid successive calls
let debounceTimer;
const debounceRequest = (callback, delay = 1000) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(callback, delay);
};

const categoryIcons = {
  educational: GraduationCap,
  career_development: Briefcase,
  hobby: Heart,
  business: Building,
  nonprofit: Users,
  startup: Rocket,
};

const statusColors = {
  seeking_collaborators: "text-orange-600 bg-orange-100",
  in_progress: "text-blue-600 bg-blue-100",
  completed: "text-green-600 bg-green-100",
};

export default function ProjectDetail({ currentUser: propCurrentUser, authIsLoading }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = searchParams.get("id");
  const tabParam = searchParams.get("tab");

  const [project, setProject] = useState(null);
  const [projectTemplate, setProjectTemplate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [userApplication, setUserApplication] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  
  const isMounted = useRef(true);
  const retryCountRef = useRef(0);
  const previousProjectIdRef = useRef(null);
  const hasInitialized = useRef(false);

  // New state for logo upload and status update
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const logoInputRef = useRef(null);

  // IDE states
  const [projectIDEs, setProjectIDEs] = useState([]);
  const [selectedIDE, setSelectedIDE] = useState(null);
  const [showIDEPreview, setShowIDEPreview] = useState(false);

  // New state for invitations
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const [isRespondingToInvite, setIsRespondingToInvite] = useState(false);

  // Function to check if current user can contribute to this project
  const canContribute = useCallback((project, user, userApplication) => {
    if (!project || !user) return false;
    
    // Project owner can always contribute
    if (project.created_by === user.email) return true;
    
    // Check if they are an explicit collaborator (in collaborator_emails array)
    if (project.collaborator_emails?.includes(user.email)) return true;
    
    // Check if their application was accepted
    if (userApplication && userApplication.status === 'accepted') return true;
    
    return false;
  }, []);

  // Function to fetch collaborator profiles with better error handling
  const getCollaboratorProfiles = useCallback(async (projectData) => {
    if (!projectData) return [];
    
    const uniqueEmails = Array.from(new Set([projectData.created_by, ...(projectData.collaborator_emails || [])]));
    const validEmails = uniqueEmails.filter(email => email);
    
    if (validEmails.length > 0) {
      try {
        const { data: profiles } = await withRetry(() => getPublicUserProfiles({ emails: validEmails }));
        return Array.isArray(profiles) ? profiles : [];
      } catch (error) {
        console.error("Failed to fetch collaborator profiles:", error);
        // Return empty array instead of failing completely
        return [];
      }
    }
    return [];
  }, []);

  // Use React Query for project data
  const { data: projectData, isLoading: isProjectQueryLoading, error: projectQueryError } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      if (!projectId) {
        navigate(createPageUrl("Discover"), { replace: true });
        return null;
      }

      const user = await withRetry(() => User.me().catch(() => null));
      setCurrentUser(user);

        // Small delay to prevent rapid successive requests
        await new Promise(resolve => setTimeout(resolve, 300));

        // Load project data
        const projectResults = await withRetry(() => Project.filter({ id: projectId }));
        
        if (!isMounted.current) return;

        const projectDataResult = projectResults?.[0];
        if (!projectDataResult) {
          toast.error("Project not found.");
          navigate(createPageUrl("Discover"), { replace: true });
          return null;
        }

        // Check access permissions first
        const isOwner = user && projectDataResult.created_by === user.email;
        const isExplicitCollaborator = user && projectDataResult.collaborator_emails?.includes(user.email);
        
        // Check for pending invitations if not already a collaborator
        let hasPendingInvitation = false;
        let pendingInvite = null;
        if (user && !isOwner && !isExplicitCollaborator) {
          try {
            const pendingInvites = await withRetry(() => ProjectInvitation.filter({
              project_id: projectId,
              invitee_email: user.email,
              status: "pending"
            }));
            if (pendingInvites && pendingInvites.length > 0) {
              hasPendingInvitation = true;
              pendingInvite = pendingInvites[0];
            }
          } catch (error) {
            console.warn("Could not check for pending invitations:", error);
          }
        }

        // Check privacy
        if (projectDataResult.is_visible_on_feed === false && !isOwner && !isExplicitCollaborator && !hasPendingInvitation) {
          toast.error("This project is private and you don't have access to view it.");
          navigate(createPageUrl("Discover"), { replace: true });
          return null;
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        // Load application data if needed
        let currentUserApplication = null;
        if (user && !isOwner && !isExplicitCollaborator) {
          try {
            const allApplications = await withRetry(() => ProjectApplication.filter({ 
              project_id: projectId,
              applicant_email: user.email
            }));

            if (allApplications && allApplications.length > 0) {
              currentUserApplication = allApplications.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
            }
          } catch (error) {
            console.warn("Could not fetch user applications:", error);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        // Load collaborator profiles
        const profiles = await getCollaboratorProfiles(projectDataResult);

        // Load project IDEs
        let idesData = [];
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          idesData = await withRetry(() => 
            base44.entities.ProjectIDE.filter({
              project_id: projectId,
              is_active: true,
              ide_type: 'code_playground'
            }, '-created_date')
          );
        } catch (error) {
          console.warn("Could not load project IDEs:", error);
        }

        // Load template if project was created from one
        let templateData = null;
        if (projectDataResult.template_id) {
          try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const templateResults = await withRetry(() => 
              ProjectTemplate.filter({ id: projectDataResult.template_id })
            );
            templateData = templateResults?.[0];
          } catch (error) {
            console.warn("Could not load project template:", error);
          }
        }

        return {
          project: projectDataResult,
          userApplication: currentUserApplication,
          projectUsers: profiles,
          projectIDEs: idesData || [],
          projectTemplate: templateData,
          pendingInvitation: pendingInvite
        };
        } catch (error) {
        console.error("Error loading project:", error);
        throw error;
        }
        },
        enabled: !!projectId,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 2,
        });

        // Update local state from query data
        useEffect(() => {
        if (projectData) {
        setProject(projectData.project);
        setUserApplication(projectData.userApplication);
        setProjectUsers(projectData.projectUsers);
        setProjectIDEs(projectData.projectIDEs);
        setProjectTemplate(projectData.projectTemplate);
        setPendingInvitation(projectData.pendingInvitation);
        setIsLoading(false);
        setHasError(false);
        }
        }, [projectData]);

        useEffect(() => {
        setIsLoading(isProjectQueryLoading);
        if (projectQueryError) {
        setHasError(true);
        if (projectQueryError.response?.status === 429) {
        toast.error("Loading too quickly. Please wait a moment and try again.");
        }
        }
        }, [isProjectQueryLoading, projectQueryError]);

  // Prevent scroll restoration when tab changes
  useEffect(() => {
    // Disable scroll restoration for this page
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
    
    return () => {
      // Re-enable on unmount
      if (window.history.scrollRestoration) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      // Silent success - user sees the action completed
    }).catch(err => {
      toast.error("Failed to copy link.");
      console.error('Failed to copy: ', err);
    });
  };

  const handleToggleVisibility = async () => {
    const isOwner = currentUser && project.created_by === currentUser.email;
    if (!project || !isOwner || isUpdatingVisibility) return;
    
    setIsUpdatingVisibility(true);
    try {
      const newVisibility = !project.is_visible_on_feed;
      await withRetry(() => Project.update(project.id, { is_visible_on_feed: newVisibility }));
      
      setProject(prev => ({ ...prev, is_visible_on_feed: newVisibility }));
      
      // Invalidate all relevant query caches so other pages update
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['discoverProjects'] });
    } catch (error) {
      console.error("Error updating project visibility:", error);
      if (error.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error("Failed to update project visibility.");
      }
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleSafeNavigation = () => {
    navigate(createPageUrl("Discover"));
  };
  
  const handleApplyToProject = async () => {
    if (!applicationMessage.trim()) {
        toast.error("Please provide a message for your application.");
        return;
    }
    setIsSubmittingApplication(true);
    try {
        const newApplication = await withRetry(() => ProjectApplication.create({
            project_id: project.id,
            applicant_email: currentUser.email,
            message: applicationMessage,
            status: 'pending',
        }));

        await withRetry(() => Notification.create({
            user_email: project.created_by,
            title: `New application for "${project.title}"`,
            message: `${currentUser.full_name || currentUser.email} has applied to join your project.`,
            type: 'project_application',
            related_project_id: newApplication.project_id,
            related_entity_id: newApplication.id,
            actor_email: currentUser.full_name || currentUser.email.split('@')[0],
            actor_name: currentUser.full_name || currentUser.email.split('@')[0],
        }));
        
        setUserApplication(newApplication);
        setShowApplyModal(false);
        setApplicationMessage("");

    } catch(error) {
        console.error("Failed to submit application:", error);
        toast.error("Failed to submit application.");
    } finally {
        setIsSubmittingApplication(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!pendingInvitation || !currentUser || !project) return;

    setIsRespondingToInvite(true);
    try {
      // Check if user is already a collaborator
      if (project.collaborator_emails?.includes(currentUser.email)) {
        // toast.info("You are already a member of this project."); // Removed redundant success toast
        await withRetry(() => ProjectInvitation.update(pendingInvitation.id, {
          status: "accepted",
          responded_at: new Date().toISOString()
        }));
        setPendingInvitation(null);
        await handleProjectUpdate(); // Refresh project data to update collaborator list if necessary
        return;
      }

      // Update invitation status to accepted
      await withRetry(() => ProjectInvitation.update(pendingInvitation.id, {
        status: "accepted",
        responded_at: new Date().toISOString()
      }));

      // Add user to project collaborators
      const updatedCollaborators = [...(project.collaborator_emails || []), currentUser.email];
      const newCollaboratorsCount = (project.current_collaborators_count || 0) + 1;
      
      await withRetry(() => Project.update(project.id, {
        collaborator_emails: updatedCollaborators,
        current_collaborators_count: newCollaboratorsCount
      }));

      // Notify project owner of acceptance
      await withRetry(() => Notification.create({
        user_email: project.created_by,
        title: "Invitation Accepted",
        message: `${currentUser.full_name || currentUser.email} has accepted your invitation to join "${project.title}".`,
        type: "project_member_added",
        related_project_id: project.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        metadata: {
          project_title: project.title,
          new_member_email: currentUser.email
        }
      }));

      // toast.success("Invitation accepted! You're now a member of the project."); // Removed redundant success toast
      setPendingInvitation(null);
      await handleProjectUpdate(); // Refresh project data to include new collaborator
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation. Please try again.");
    } finally {
      setIsRespondingToInvite(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!pendingInvitation || !currentUser || !project) return;

    setIsRespondingToInvite(true);
    try {
      // Update invitation status to declined
      await withRetry(() => ProjectInvitation.update(pendingInvitation.id, {
        status: "declined",
        responded_at: new Date().toISOString()
      }));

      // Notify project owner of decline
      await withRetry(() => Notification.create({
        user_email: project.created_by,
        title: "Invitation Declined",
        message: `${currentUser.full_name || currentUser.email} has declined your invitation to join "${project.title}".`,
        type: "general",
        related_project_id: project.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        metadata: {
          project_title: project.title,
          declined_by_email: currentUser.email
        }
      }));

      // toast.success("Invitation declined."); // Removed redundant success toast
      setPendingInvitation(null);
      
      // If project is private, redirect away since they declined
      if (!project.is_visible_on_feed) {
        navigate(createPageUrl("Discover"), { replace: true });
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Failed to decline invitation. Please try again.");
    } finally {
      setIsRespondingToInvite(false);
    }
  };

  const handleUpdateSocialLinks = async (socialLinks) => {
    try {
      await withRetry(() => Project.update(project.id, { social_links: socialLinks }));
      setProject(prev => ({ ...prev, social_links: socialLinks }));
      // toast.success("Project social links updated successfully!"); // Removed redundant success toast
    } catch (error) {
      console.error("Error updating social links:", error);
      toast.error("Failed to update social links. Please try again.");
      throw error; // Re-throw to allow SocialsPanel to handle its own loading/error state
    }
  };

  // Handler for when child components update the project object
  const handleProjectUpdate = useCallback(async () => {
    // Lightweight project data refresh without full reinitialization
    try {
      const projectResults = await withRetry(() => Project.filter({ id: projectId }));
      const projectData = projectResults?.[0];
      
      if (projectData) {
        setProject(projectData);
        // Re-evaluate current user application state and contribution rights
        // This is important because project updates (like collaborator_emails) or application status changes need to be reflected
        if (currentUser) {
            let currentUserApplication = null;
            const isOwner = currentUser && projectData.created_by === currentUser.email;
            const isExplicitCollaborator = currentUser && projectData.collaborator_emails?.includes(currentUser.email);

            if (!isOwner && !isExplicitCollaborator) {
                try {
                    const allApplications = await withRetry(() => ProjectApplication.filter({ 
                        project_id: projectId,
                        applicant_email: currentUser.email
                    }));
                    if (allApplications && allApplications.length > 0) {
                        currentUserApplication = allApplications.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
                    }
                } catch (error) {
                    console.warn("Could not fetch user applications on project update:", error);
                }
            }
            setUserApplication(currentUserApplication);
            // Re-fetch project users to update collaborator list if new member joined
            const profiles = await getCollaboratorProfiles(projectData);
            if (isMounted.current) {
              setProjectUsers(profiles);
            }
        }
      }
    } catch (error) {
      console.error("Error refreshing project data:", error);
      // Silently fail - the user can refresh manually if needed
    }
  }, [projectId, currentUser, getCollaboratorProfiles]);

  // Listen for project update events from child components
  useEffect(() => {
    const handleProjectUpdateEvent = (event) => {
      if (event.detail?.projectId === projectId) {
        handleProjectUpdate();
      }
    };

    window.addEventListener('projectUpdated', handleProjectUpdateEvent);
    
    return () => {
      window.removeEventListener('projectUpdated', handleProjectUpdateEvent);
    };
  }, [projectId, handleProjectUpdate]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file (PNG, JPG, or JPEG).");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large. Maximum size is 5MB.");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const { file_url } = await withRetry(() => UploadFile({ file }));
      
      await withRetry(() => Project.update(projectId, { logo_url: file_url }));
      
      setProject(prev => ({ ...prev, logo_url: file_url }));
      // toast.success("Project logo updated successfully!"); // Removed redundant success toast
    } catch (error) {
      console.error("Error uploading logo:", error);
      if (error.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error("Failed to upload logo. Please try again.");
      }
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    const isOwner = currentUser && project.created_by === currentUser.email;
    if (!isOwner || isUpdatingStatus) return;
    
    const oldStatus = project.status;
    if (oldStatus === newStatus) return;

    setIsUpdatingStatus(true);
    try {
      await withRetry(() => Project.update(projectId, { status: newStatus }));
      
      setProject(prev => ({ ...prev, status: newStatus }));

      // Send notifications to all collaborators except the current user
      const statusLabels = {
        seeking_collaborators: "Seeking Collaborators",
        in_progress: "In Progress",
        completed: "Completed"
      };

      const collaboratorsToNotify = project.collaborator_emails?.filter(
        email => email !== currentUser.email
      ) || [];

      for (const collaboratorEmail of collaboratorsToNotify) {
        await withRetry(() => Notification.create({
          user_email: collaboratorEmail,
          title: "Project status updated",
          message: `${currentUser.full_name || currentUser.email} changed the status of "${project.title}" from "${statusLabels[oldStatus]}" to "${statusLabels[newStatus]}".`,
          type: "project_status_changed",
          related_project_id: projectId,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email,
          metadata: {
            project_title: project.title,
            old_status: oldStatus,
            new_status: newStatus
          }
        }));
      }

      // ADDED: Notify all followers about status change
      try {
        // Fetch all users who are following this project
        const allUsers = await withRetry(() => User.filter({}));
        const followersToNotify = allUsers.filter(user => 
          user.followed_projects?.includes(projectId) && 
          user.email !== currentUser.email &&
          !collaboratorsToNotify.includes(user.email) // Don't duplicate notifications for collaborators
        );

        // Create notifications for all followers
        for (const follower of followersToNotify) {
          await withRetry(() => Notification.create({
            user_email: follower.email,
            title: "Project status updated",
            message: `"${project.title}" status changed from "${statusLabels[oldStatus]}" to "${statusLabels[newStatus]}".`,
            type: "project_update",
            related_project_id: projectId,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            metadata: {
              project_title: project.title,
              update_type: "status_change",
              old_status: oldStatus,
              new_status: newStatus
            }
          }));
        }
      } catch (error) {
        console.error("Error notifying followers about status change:", error);
        // Don't fail the whole operation if follower notifications fail
      }

      // toast.success("Project status updated successfully!"); // Removed redundant success toast
    } catch (error) {
      console.error("Error updating project status:", error);
      if (error.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error("Failed to update project status. Please try again.");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getLinkDomain = (url) => {
    try {
      const urlObject = new URL(url);
      return urlObject.hostname.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
  };

  const getFaviconUrl = (url) => {
    try {
      const urlObject = new URL(url);
      return `https://www.google.com/s2/favicons?sz=64&domain_url=${urlObject.hostname}`;
    } catch (e) {
      return null;
    }
  };

  const handleIDEClick = (ide) => {
    setSelectedIDE(ide);
    setShowIDEPreview(true);
  };

  // Enhanced loading state as per outline
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <Lightbulb className="w-16 h-16 text-purple-600" />
        </div>
      </div>
    );
  }

  // Enhanced error state as per outline (using !project for primary error condition)
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Project Not Found</h3>
          <p className="text-gray-600 mb-4">This project doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate(createPageUrl("Discover"), { replace: true })}>
            Go to Discover
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && project.created_by === currentUser.email;
  const isExplicitCollaborator = currentUser && project.collaborator_emails?.includes(currentUser.email);
  const userCanContribute = canContribute(project, currentUser, userApplication);
  
  // User can apply if logged in, not owner/contributor, no existing pending/accepted application, and project is public
  const canApply = currentUser && 
                   !userCanContribute && 
                   (!userApplication || userApplication.status === 'rejected' || userApplication.status === 'withdrawn') && 
                   project.is_visible_on_feed &&
                   !pendingInvitation; // Cannot apply if there's a pending invitation

  const CategoryIcon = categoryIcons[project.classification] || Building;
  const statusClass = statusColors[project.status] || "text-gray-600 bg-gray-100";

  // Get project owner profile for personalizing messages
  const projectOwnerProfile = projectUsers.find(u => u.email === project.created_by);
  
  return (
    <>
      {/* IDE Preview Dialog */}
      <IDEPreviewDialog
        isOpen={showIDEPreview}
        onClose={() => setShowIDEPreview(false)}
        codeProject={selectedIDE}
        projectTitle={project.title}
      />

      {/* Real-time Collaboration Presence Tracking */}
      {userCanContribute && currentUser && (
        <CollaboratorPresence projectId={projectId} currentUser={currentUser} />
      )}

      {/* Hidden file input for logo upload */}
      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        className="hidden"
      />

      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Apply to join "{project.title}"</DialogTitle>
            <DialogDescription>
              Send a message to the project owner explaining why you'd be a great collaborator.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Introduce yourself, mention relevant skills, and express your interest..."
            value={applicationMessage}
            onChange={(e) => setApplicationMessage(e.target.value)}
            rows={5}
            className="mt-4"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>Cancel</Button>
            <Button onClick={handleApplyToProject} disabled={isSubmittingApplication || !applicationMessage.trim()}>
              {isSubmittingApplication ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="cu-container cu-page">
        <div className="flex items-center justify-end mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {canApply && (
                <Button onClick={() => setShowApplyModal(true)} className="cu-button text-sm" size="sm">
                    <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
                    Apply to Join
                </Button>
            )}
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center text-sm"
              size="sm"
            >
              <Share2 className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            
            {isOwner && (
              <Link to={createPageUrl(`EditProject?id=${project.id}`)}>
                <Button className="cu-button text-sm" size="sm">
                  <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Project</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Invitation Banner - Show prominently if user has a pending invitation */}
        {pendingInvitation && currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="cu-card border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        You've Been Invited!
                      </h3>
                      <p className="text-sm text-gray-700">
                        You've been invited to join this project as a collaborator.
                        {pendingInvitation.message && (
                          <span className="block mt-2 italic text-gray-600">
                            "{pendingInvitation.message}"
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3 sm:flex-shrink-0">
                    <Button
                      onClick={handleAcceptInvitation}
                      disabled={isRespondingToInvite}
                      className="cu-button flex-1 sm:flex-initial"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {isRespondingToInvite ? 'Processing...' : 'Accept'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeclineInvitation}
                      disabled={isRespondingToInvite}
                      className="flex-1 sm:flex-initial"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Desktop Layout (xl and above) - Dynamic grid based on collaborator status */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
          {/* Left Sidebar - Desktop Only */}
          <aside className="hidden xl:block xl:col-span-3 space-y-6">
            {/* Project Information - Desktop Only */}
            <Card className="cu-card">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                {/* Project Status - Editable for Owner */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Project Status</span>
                  {isOwner ? (
                    <Select 
                      value={project.status} 
                      onValueChange={handleStatusChange}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seeking_collaborators">Seeking Collaborators</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${statusClass} text-xs`}>
                      {project.status?.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Total Collaborators</span>
                  <span className="font-medium text-sm sm:text-base">
                    {projectUsers.length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Project Type</span>
                  <Badge variant="outline" className="text-xs">
                    {project.project_type}
                  </Badge>
                </div>
                
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Collaboration</span>
                    <Badge 
                      variant={project.is_visible_on_feed ? "default" : "secondary"} 
                      className={`text-xs ${project.is_visible_on_feed ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      {project.is_visible_on_feed ? "Open" : "Invite-Only"}
                    </Badge>
                  </div>
                
                {project.industry && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Industry</span>
                    <span className="text-xs sm:text-sm font-medium break-words text-right">
                      {project.industry.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* For non-collaborators: Show Social & Funding in left sidebar */}
            {!userCanContribute && (
              <>
                <SocialsPanel
                  socialLinks={project.social_links || {}}
                  onUpdate={handleUpdateSocialLinks}
                  canEdit={isOwner}
                  title="Project Social Media"
                  emptyMessage="Add social media links to promote this project"
                />
                <ProjectFundingCard 
                  project={project} 
                  projectOwner={projectOwnerProfile}
                  canEdit={isOwner}
                  onUpdate={handleProjectUpdate}
                />
              </>
            )}

            {/* For collaborators: Show project tools + social in left sidebar (funding moved to right) */}
            {userCanContribute && (
              <>
                <ProjectLinksManager
                  project={project}
                  currentUser={currentUser}
                  onProjectUpdate={handleProjectUpdate}
                />
                <ContextualSearchAssistant project={project} />
                <SocialsPanel
                  socialLinks={project.social_links || {}}
                  onUpdate={handleUpdateSocialLinks}
                  canEdit={isOwner}
                  title="Project Social Media"
                  emptyMessage="Add social media links to promote this project"
                />
              </>
            )}
          </aside>

          {/* Main Content - 75% width for non-collaborators (9 cols), 50% for collaborators (6 cols) */}
          <main className={`${userCanContribute ? 'xl:col-span-6' : 'xl:col-span-9'} cu-content-grid space-y-4 sm:space-y-6`}>
            {/* Project Visibility Toggle - Mobile/Tablet for project owner - ABOVE project details */}
            {isOwner && (
              <Card className="cu-card xl:hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {project.is_visible_on_feed ? (
                          <Eye className="w-4 h-4 sm:w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                        ) : (
                          <EyeOff className="w-4 h-4 sm:w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <Label htmlFor="visibility-toggle-mobile" className="text-sm font-medium cursor-pointer">
                            {project.is_visible_on_feed ? 'Public on Feed' : 'Private Project'}
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">
                            {project.is_visible_on_feed 
                              ? 'Anyone can view and contribute' 
                              : 'Only invited collaborators can view'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    <Switch
                      id="visibility-toggle-mobile"
                      checked={project.is_visible_on_feed}
                      onCheckedChange={handleToggleVisibility}
                      disabled={isUpdatingVisibility}
                      className="ml-3 flex-shrink-0"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {isOwner && <ProjectApplicationsManager project={project} onProjectUpdate={handleProjectUpdate} />}
            
            <Card className="cu-card">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  {/* Editable Project Logo */}
                  <div className="relative w-12 h-12 sm:w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 group">
                    {project.logo_url ? (
                      <ClickableImage 
                        src={project.logo_url} 
                        alt={`${project.title} logo`}
                        caption={`${project.title} - Project Logo`}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <CategoryIcon className="w-6 h-6 sm:w-8 h-8 text-white" />
                    )}
                    
                    {/* Upload overlay for project owner */}
                    {isOwner && (
                      <div
                        onClick={() => !isUploadingLogo && logoInputRef.current?.click()}
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center transition-all cursor-pointer"
                      >
                        {isUploadingLogo ? (
                          <div className="text-white text-xs">Uploading...</div>
                        ) : (
                          <Camera className="w-5 h-5 sm:w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-words">
                      {project.title}
                    </CardTitle>
                    <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <Badge className={`${statusClass} text-xs sm:text-sm px-2 sm:px-3 py-1`}>
                        {project.status?.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {project.project_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {project.classification?.replace(/_/g, ' ')}
                      </Badge>
                      {project.is_visible_on_feed && (
                        <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm flex items-center">
                          <UserPlus className="w-3 h-3 mr-1" />
                          Open for Collaboration
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <CardDescription className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  {project.description}
                </CardDescription>
                
                {project.area_of_interest && (
                  <div className="flex items-center mt-4 text-sm sm:text-base text-gray-600">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="break-words">{project.area_of_interest}</span>
                    {project.location && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="break-words">{project.location}</span>
                      </>
                    )}
                  </div>
                )}

                {project.skills_needed && project.skills_needed.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Skills Needed</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.skills_needed.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs sm:text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.tools_needed && project.tools_needed.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Tools Needed</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tools_needed.map((tool, index) => (
                        <Badge key={index} variant="outline" className="text-xs sm:text-sm">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Project Assistant - Mobile Only (between project details and instructions) */}
            {userCanContribute && (
              <div className="xl:hidden">
                <AIProjectAssistant
                  project={project}
                  currentUser={currentUser}
                  isCollaborator={userCanContribute}
                  onTasksGenerated={handleProjectUpdate}
                />
              </div>
            )}

            {/* Project Links Section */}
            {(project.project_urls && project.project_urls.length > 0) || projectIDEs.length > 0 ? (
              <Card className="cu-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <LinkIcon className="w-5 h-5 mr-2 text-purple-600" />
                    Showcase
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {project.project_urls && project.project_urls.length === 1 ? (
                    <ProjectLinkPreview linkData={typeof project.project_urls[0] === 'object' ? project.project_urls[0] : { url: project.project_urls[0] }} />
                  ) : project.project_urls && project.project_urls.length > 1 ? (
                    <div className="space-y-3">
                      <HorizontalScrollContainer
                        className="pb-2"
                        showArrows={project.project_urls.length > 1}
                      >
                        {project.project_urls.map((linkItem, index) => {
                          const linkUrl = typeof linkItem === 'object' ? linkItem.url : linkItem;
                          const linkTitle = typeof linkItem === 'object' ? linkItem.title : '';
                          return (
                            <a
                              key={index}
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 w-[280px] sm:w-[320px] block group"
                            >
                              <Card className="cu-card bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden h-full">
                                <div className="p-3">
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2 px-2">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    </div>
                                    <div className="flex-1 text-center bg-white rounded-md mx-3 py-0.5 truncate text-[10px] sm:text-xs">
                                      {getLinkDomain(linkUrl)}
                                    </div>
                                  </div>
                                  <div className="relative aspect-video bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                                    <div className="text-center p-4">
                                      <img 
                                        src={getFaviconUrl(linkUrl)} 
                                        alt="Favicon" 
                                        className="w-10 h-10 mx-auto mb-2" 
                                        onError={(e) => e.currentTarget.style.display = 'none'} 
                                      />
                                      {linkTitle && (
                                        <p className="font-bold text-base text-gray-900 mb-1">{linkTitle}</p>
                                      )}
                                      <p className="font-semibold text-sm text-gray-800">{linkTitle ? 'Showcase' : 'Showcase'}</p>
                                      <p className="text-xs text-gray-500 mt-1">Click to visit</p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <LinkIcon className="w-6 h-6 text-black/50" />
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </a>
                          );
                        })}
                      </HorizontalScrollContainer>

                      {project.project_urls.length > 3 && (
                        <div className="text-center">
                          <p className="text-sm text-gray-500">
                            Scroll to see all {project.project_urls.length} project links
                          </p>
                        </div>
                      )}
                      </div>
                      ) : null}

                      {/* Project IDEs Section */}
                      {projectIDEs.length > 0 && (
                      <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <Code className="w-4 h-4 mr-2 text-blue-600" />
                        Code Playgrounds ({projectIDEs.length})
                      </h4>
                      <HorizontalScrollContainer 
                        className="pb-2"
                        showArrows={projectIDEs.length > 1}
                      >
                        {projectIDEs.map((ide) => (
                          <div
                            key={ide.id}
                            className="flex-shrink-0 w-[280px] sm:w-[320px] cursor-pointer"
                            onClick={() => handleIDEClick(ide)}
                          >
                            <Card className="cu-card bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden h-full border-2 border-purple-100 hover:border-purple-300">
                              <div className="p-3">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                  <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                                    <Code className="w-3 h-3" />
                                    Code Playground
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleIDEClick(ide);
                                    }}
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                  </Button>
                                </div>

                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-2">
                                  <div className="bg-gray-900 px-3 py-2 flex items-center justify-between">
                                    <div className="flex items-center space-x-1">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">Preview</span>
                                  </div>
                                  <div className="aspect-video bg-white flex items-center justify-center p-4">
                                    <div className="text-center">
                                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                        <Code className="w-6 h-6 text-white" />
                                      </div>
                                      <p className="text-xs font-semibold text-gray-800">Interactive Preview</p>
                                      <p className="text-[10px] text-gray-500 mt-1">Click to explore</p>
                                    </div>
                                  </div>
                                </div>

                                <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                                  {ide.title}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Updated {new Date(ide.updated_date).toLocaleDateString()}
                                </p>
                              </div>
                            </Card>
                          </div>
                        ))}
                      </HorizontalScrollContainer>
                      </div>
                      )}
                      </CardContent>
                      </Card>
                      ) : null}

            {/* Project Highlights - Show if highlights exist OR if user can edit (to allow adding) */}
            {(project.highlights && project.highlights.length > 0) || (userCanContribute) ? (
              <ProjectHighlights 
                project={project} 
                currentUser={currentUser}
                isCollaborator={userCanContribute} 
                onProjectUpdate={handleProjectUpdate}
              />
            ) : null}
          </main>

          {/* Right Sidebar - Only show to collaborators on desktop */}
          {userCanContribute && (
            <aside className="hidden xl:block xl:col-span-3 space-y-4 sm:space-y-6">
              {/* Project Visibility Toggle - Only for project owner */}
              {isOwner && (
                <Card className="cu-card">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {project.is_visible_on_feed ? (
                            <Eye className="w-4 h-4 sm:w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                          ) : (
                            <EyeOff className="w-4 h-4 sm:w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <Label htmlFor="visibility-toggle" className="text-sm font-medium cursor-pointer">
                              {project.is_visible_on_feed ? 'Public on Feed' : 'Private Project'}
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">
                              {project.is_visible_on_feed 
                                ? 'Anyone can view and contribute' 
                                : 'Only invited collaborators can view'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      <Switch
                        id="visibility-toggle"
                        checked={project.is_visible_on_feed}
                        onCheckedChange={handleToggleVisibility}
                        disabled={isUpdatingVisibility}
                        className="ml-3 flex-shrink-0"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Project Assistant */}
              <AIProjectAssistant
                project={project}
                currentUser={currentUser}
                isCollaborator={userCanContribute}
                onTasksGenerated={handleProjectUpdate}
              />

              {/* Team Communications Panel */}
              <CommunicationsPanel 
                project={project}
                isCollaborator={userCanContribute}
              />

              {/* Project Membership Manager */}
              {(isOwner || isExplicitCollaborator || (userApplication && userApplication.status === 'accepted')) && (
                <ProjectMembershipManager
                  project={project}
                  currentUser={currentUser}
                  projectUsers={projectUsers}
                  isOwner={isOwner}
                  isExplicitCollaborator={isExplicitCollaborator || (userApplication && userApplication.status === 'accepted')}
                  onUpdate={handleProjectUpdate}
                />
              )}

              {/* Project Funding - Desktop only, below Team Members */}
              <ProjectFundingCard 
                project={project} 
                projectOwner={projectOwnerProfile}
                canEdit={isOwner}
                onUpdate={handleProjectUpdate}
              />
            </aside>
          )}

          {/* Mobile/Tablet Only: All sidebar content */}
          <div className="xl:hidden col-span-1 space-y-4 sm:space-y-6">
            {/* Project Information for Mobile/Tablet */}
            <Card className="cu-card">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 h-5 mr-2 text-purple-600" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Project Status</span>
                  {isOwner ? (
                    <Select 
                      value={project.status} 
                      onValueChange={handleStatusChange}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seeking_collaborators">Seeking Collaborators</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${statusClass} text-xs`}>
                      {project.status?.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Total Collaborators</span>
                  <span className="font-medium text-sm sm:text-base">
                    {projectUsers.length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Project Type</span>
                  <Badge variant="outline" className="text-xs">
                    {project.project_type}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Collaboration</span>
                  <Badge 
                    variant={project.is_visible_on_feed ? "default" : "secondary"} 
                    className={`text-xs ${project.is_visible_on_feed ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {project.is_visible_on_feed ? "Open" : "Invite-Only"}
                  </Badge>
                </div>
                
                {project.industry && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Industry</span>
                    <span className="text-xs sm:text-sm font-medium break-words text-right">
                      {project.industry.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* For non-collaborators on mobile/tablet: Social & Funding */}
            {!userCanContribute && (
              <>
                <SocialsPanel
                  socialLinks={project.social_links || {}}
                  onUpdate={handleUpdateSocialLinks}
                  canEdit={isOwner}
                  title="Project Social Media"
                  emptyMessage="Add social media links to promote this project"
                />
                <ProjectFundingCard 
                  project={project} 
                  projectOwner={projectOwnerProfile}
                  canEdit={isOwner}
                  onUpdate={handleProjectUpdate}
                />
              </>
            )}

            {/* For collaborators on mobile/tablet: All components including Team Members */}
            {userCanContribute && (
              <>
                <ProjectLinksManager
                  project={project}
                  currentUser={currentUser}
                  onProjectUpdate={handleProjectUpdate}
                />
                <ContextualSearchAssistant project={project} />
                <CommunicationsPanel 
                  project={project}
                  isCollaborator={userCanContribute}
                />
                {(isOwner || isExplicitCollaborator || (userApplication && userApplication.status === 'accepted')) && (
                  <ProjectMembershipManager
                    project={project}
                    currentUser={currentUser}
                    projectUsers={projectUsers}
                    isOwner={isOwner}
                    isExplicitCollaborator={isExplicitCollaborator || (userApplication && userApplication.status === 'accepted')}
                    onUpdate={handleProjectUpdate}
                  />
                )}
                <SocialsPanel
                  socialLinks={project.social_links || {}}
                  onUpdate={handleUpdateSocialLinks}
                  canEdit={isOwner}
                  title="Project Social Media"
                  emptyMessage="Add social media links to promote this project"
                />
                <ProjectFundingCard 
                  project={project} 
                  projectOwner={projectOwnerProfile}
                  canEdit={isOwner}
                  onUpdate={handleProjectUpdate}
                />
              </>
            )}
          </div>
        </div>

        {/* Workspace Tabs */}
        {(userCanContribute) && (
          <div className="mt-6 sm:mt-8">
            <WorkspaceTabs 
              project={project} 
              currentUser={currentUser}
              projectUsers={projectUsers}
              onProjectUpdate={handleProjectUpdate}
              isCollaborator={userCanContribute}
              isProjectOwner={isOwner}
            />
          </div>
        )}
      </div>
    </>
  );
}