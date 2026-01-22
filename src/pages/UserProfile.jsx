import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Project, SkillEndorsement, CollaboratorReview, Notification } from "@/entities/all";
import { getUserByUsername } from "@/functions/getUserByUsername";

import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Edit, Briefcase, Star, Heart, Link as LinkIcon, Linkedin, Globe, FileText, LogOut,
  Plus, ZoomIn, MapPin, Clock, Tag, Award, GraduationCap, HardHat, Mail, Phone, Cake, Info,
  Share2, X, Eye, Download, Sparkles, Wrench, MessageSquare, FileText as FileTextIcon,
  Bookmark, Camera, Loader2, Upload, MessageCircle, Play, ExternalLink, Calendar, Bell
} from "lucide-react";
import { motion } from "framer-motion";
import MediaDisplay from "../components/MediaDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ProfileCompletionBanner from "../components/ProfileCompletionBanner";
import ClickableImage from "../components/ClickableImage";
import ImageModal from "../components/ImageModal";
import { getPublicUserProfiles } from '@/functions/getPublicUserProfiles';
import { format, formatDistanceToNow } from 'date-fns';
import SocialsPanel from '../components/SocialsPanel';
import { base44 } from "@/api/base44Client";
import ArrayInputWithSearch from "../components/ArrayInputWithSearch";
import RecommendedCollaborators from "../components/RecommendedCollaborators";
import PortfolioItem from "../components/portfolio/PortfolioItem";
import EditPortfolioItemDialog from "../components/portfolio/EditPortfolioItemDialog";
import GenerateResumeDialog from "../components/GenerateResumeDialog";
import BadgeDisplay, { LevelBadge } from "../components/gamification/BadgeDisplay";
import ServiceListingManager from "../components/ServiceListingManager";

const EditBioModal = ({ isOpen, onClose, bio, onSave }) => {
  const [editedBio, setEditedBio] = useState(bio || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedBio(bio || "");
  }, [bio]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedBio);
      onClose();
    } catch (error) {
      console.error("Error saving bio:", error);
      toast.error("Failed to save bio.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Biography</DialogTitle>
          <DialogDescription>
            Share your story, background, and what drives you.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={editedBio}
            onChange={(e) => setEditedBio(e.target.value)}
            rows={6}
            placeholder="Tell everyone about yourself..."
            className="resize-none"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="cu-button">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditEducationModal = ({ isOpen, onClose, education, onSave }) => {
  const [editedEducation, setEditedEducation] = useState(education || []);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentEducation, setCurrentEducation] = useState({
    university_name: '',
    degree: '',
    major: '',
    graduation_date: ''
  });
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);

  useEffect(() => {
    setEditedEducation(education || []);
  }, [education]);

  const handleOpenAddEdit = (index = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setCurrentEducation(editedEducation[index]);
    } else {
      setEditingIndex(null);
      setCurrentEducation({
        university_name: '',
        degree: '',
        major: '',
        graduation_date: ''
      });
    }
    setIsAddEditOpen(true);
  };

  const handleSaveEducation = () => {
    if (!currentEducation.university_name || !currentEducation.degree ||
        !currentEducation.major || !currentEducation.graduation_date) {
      toast.error("Please fill all education fields.");
      return;
    }
    let newEducation = [...editedEducation];
    if (editingIndex !== null) {
      newEducation[editingIndex] = currentEducation;
    } else {
      newEducation.push(currentEducation);
    }
    setEditedEducation(newEducation);
    setIsAddEditOpen(false);
  };

  const handleRemove = (index) => {
    setEditedEducation(editedEducation.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedEducation);
      onClose();
    } catch (error) {
      console.error("Error saving education:", error);
      toast.error("Failed to save education.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Education</DialogTitle>
            <DialogDescription>
              Add or update your educational background.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Button
              variant="outline"
              onClick={() => handleOpenAddEdit()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Education
            </Button>
            {editedEducation.map((edu, index) => (
              <div key={index} className="p-4 border rounded-lg flex justify-between items-start bg-gray-50">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{edu.university_name}</p>
                  <p className="text-sm text-gray-600">{edu.degree} in {edu.major}</p>
                  <p className="text-sm text-gray-500">{edu.graduation_date}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenAddEdit(index)}
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="cu-button">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Education</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="University Name"
              value={currentEducation.university_name}
              onChange={(e) => setCurrentEducation(prev => ({ ...prev, university_name: e.target.value }))}
            />
            <Input
              placeholder="Degree (e.g., B.A., M.Sc.)"
              value={currentEducation.degree}
              onChange={(e) => setCurrentEducation(prev => ({ ...prev, degree: e.target.value }))}
            />
            <Input
              placeholder="Major (e.g., Computer Science)"
              value={currentEducation.major}
              onChange={(e) => setCurrentEducation(prev => ({ ...prev, major: e.target.value }))}
            />
            <Input
              placeholder="Graduation Date (e.g., May 2025)"
              value={currentEducation.graduation_date}
              onChange={(e) => setCurrentEducation(prev => ({ ...prev, graduation_date: e.target.value }))}
            />
          </div>
          <Button onClick={handleSaveEducation} className="w-full cu-button">
            {editingIndex !== null ? 'Update' : 'Add'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

const EditAwardsModal = ({ isOpen, onClose, awards, onSave }) => {
  const [editedAwards, setEditedAwards] = useState(awards || []);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentAward, setCurrentAward] = useState({
    name: '',
    issuing_organization: '',
    date_received: '',
    credential_url: ''
  });
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);

  useEffect(() => {
    setEditedAwards(awards || []);
  }, [awards]);

  const handleOpenAddEdit = (index = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setCurrentAward(editedAwards[index]);
    } else {
      setEditingIndex(null);
      setCurrentAward({
        name: '',
        issuing_organization: '',
        date_received: '',
        credential_url: ''
      });
    }
    setIsAddEditOpen(true);
  };

  const handleSaveAward = () => {
    if (!currentAward.name || !currentAward.issuing_organization || !currentAward.date_received) {
      toast.error("Please fill all required award fields.");
      return;
    }
    let newAwards = [...editedAwards];
    if (editingIndex !== null) {
      newAwards[editingIndex] = currentAward;
    } else {
      newAwards.push(currentAward);
    }
    setEditedAwards(newAwards);
    setIsAddEditOpen(false);
  };

  const handleRemove = (index) => {
    setEditedAwards(editedAwards.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedAwards);
      onClose();
    } catch (error) {
      console.error("Error saving awards:", error);
      toast.error("Failed to save awards.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Awards & Certifications</DialogTitle>
            <DialogDescription>
              Add or update your awards, honors, and certifications.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Button
              variant="outline"
              onClick={() => handleOpenAddEdit()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Award/Certification
            </Button>
            {editedAwards.map((award, index) => (
              <div key={index} className="p-4 border rounded-lg flex justify-between items-start bg-gray-50">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{award.name}</p>
                  <p className="text-sm text-gray-600">
                    {award.issuing_organization} • {award.date_received}
                  </p>
                  {award.credential_url && (
                    <a
                      href={award.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:underline"
                    >
                      View Credential
                    </a>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenAddEdit(index)}
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="cu-button">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Award/Certification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Award/Certification Name"
              value={currentAward.name}
              onChange={(e) => setCurrentAward(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Issuing Organization"
              value={currentAward.issuing_organization}
              onChange={(e) => setCurrentAward(prev => ({ ...prev, issuing_organization: e.target.value }))}
            />
            <Input
              placeholder="Date Received (e.g., Jan 2023)"
              value={currentAward.date_received}
              onChange={(e) => setCurrentAward(prev => ({ ...prev, date_received: e.target.value }))}
            />
            <Input
              placeholder="Credential URL (Optional)"
              value={currentAward.credential_url}
              onChange={(e) => setCurrentAward(prev => ({ ...prev, credential_url: e.target.value }))}
            />
          </div>
          <Button onClick={handleSaveAward} className="w-full cu-button">
            {editingIndex !== null ? 'Update' : 'Add'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

const EditWebLinksModal = ({ isOpen, onClose, linkedinUrl, websiteUrl, onSave }) => {
  const [editedLinkedin, setEditedLinkedin] = useState(linkedinUrl || "");
  const [editedWebsite, setEditedWebsite] = useState(websiteUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedLinkedin(linkedinUrl || "");
    setEditedWebsite(websiteUrl || "");
  }, [linkedinUrl, websiteUrl]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedLinkedin, editedWebsite);
      onClose();
    } catch (error) {
      console.error("Error saving web links:", error);
      toast.error("Failed to save web links.");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Web Links</DialogTitle>
          <DialogDescription>
            Update your LinkedIn and personal website URLs.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="linkedin_edit" className="text-sm font-medium mb-2 block">
              LinkedIn URL
            </Label>
            <Input
              id="linkedin_edit"
              placeholder="https://linkedin.com/in/your-profile"
              value={editedLinkedin}
              onChange={(e) => setEditedLinkedin(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="website_edit" className="text-sm font-medium mb-2 block">
              Personal Website
            </Label>
            <Input
              id="website_edit"
              placeholder="https://your-website.com"
              value={editedWebsite}
              onChange={(e) => setEditedWebsite(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="cu-button">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditPortfolioModal = ({ isOpen, onClose, portfolioItems, onSave }) => {
  const [editedPortfolio, setEditedPortfolio] = useState(portfolioItems || []);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  useEffect(() => {
    setEditedPortfolio(portfolioItems || []);
  }, [portfolioItems]);

  const handleOpenAddEdit = (index = null) => {
    setEditingIndex(index);
    setIsItemDialogOpen(true);
  };

  const handleSaveItem = (itemData) => {
    let newPortfolio = [...editedPortfolio];
    if (editingIndex !== null) {
      newPortfolio[editingIndex] = itemData;
    } else {
      newPortfolio.push(itemData);
    }
    setEditedPortfolio(newPortfolio);
    setIsItemDialogOpen(false);
    setEditingIndex(null);
  };

  const handleRemove = (index) => {
    setEditedPortfolio(editedPortfolio.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedPortfolio);
      onClose();
    } catch (error) {
      console.error("Error saving portfolio:", error);
      toast.error("Failed to save portfolio.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
            <DialogDescription>
              Showcase your best work and completed projects
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Button
              variant="outline"
              onClick={() => handleOpenAddEdit(null)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Portfolio Item
            </Button>
            {editedPortfolio.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    {item.role && <p className="text-sm text-gray-600">{item.role}</p>}
                    {item.completion_date && (
                      <p className="text-xs text-gray-500 mt-1">{item.completion_date}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenAddEdit(index)}
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(index)}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{item.description}</p>
                {item.technologies && item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.technologies.slice(0, 5).map((tech, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{tech}</Badge>
                    ))}
                    {item.technologies.length > 5 && (
                      <Badge variant="outline" className="text-xs">+{item.technologies.length - 5}</Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="cu-button">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditPortfolioItemDialog
        isOpen={isItemDialogOpen}
        onClose={() => {
          setIsItemDialogOpen(false);
          setEditingIndex(null);
        }}
        item={editingIndex !== null ? editedPortfolio[editingIndex] : null}
        onSave={handleSaveItem}
      />
    </>
  );
};

export default function UserProfile({ currentUser: propCurrentUser, authIsLoading: propAuthIsLoading, setCurrentUser }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const username = searchParams.get("username");
  const emailParam = searchParams.get("email");

  const [profileUser, setProfileUser] = useState(null);
  const DEFAULT_COVER_IMAGE = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/cd4694e0a_purple-background.jpg';
  const [userProjects, setUserProjects] = useState([]);
  const [displayedProjectsCount, setDisplayedProjectsCount] = useState(3);
  const [followedProjects, setFollowedProjects] = useState([]);
  const [displayedFollowedCount, setDisplayedFollowedCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFollowedProjects, setIsLoadingFollowedProjects] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const [isEditBioOpen, setIsEditBioOpen] = useState(false);
  const [isEditEducationOpen, setIsEditEducationOpen] = useState(false);
  const [isEditAwardsOpen, setIsEditAwardsOpen] = useState(false);
  const [isEditWebLinksOpen, setIsEditWebLinksOpen] = useState(false);
  const [isEditPortfolioOpen, setIsEditPortfolioOpen] = useState(false);

  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [isUploadingCoverPhoto, setIsUploadingCoverPhoto] = useState(false);
  const [showGenerateResumeDialog, setShowGenerateResumeDialog] = useState(false);
  const resumeInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);

  const [editingSection, setEditingSection] = useState(null);
  const [editSkills, setEditSkills] = useState([]);
  const [editInterests, setEditInterests] = useState([]);
  const [editTools, setEditTools] = useState([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [zoomedImage, setZoomedImage] = useState(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const [skillEndorsements, setSkillEndorsements] = useState([]);
  const [collaboratorReviews, setCollaboratorReviews] = useState([]);
  const [isLoadingEndorsements, setIsLoadingEndorsements] = useState(false);
  const [showEndorseDialog, setShowEndorseDialog] = useState(false);
  const [selectedSkillToEndorse, setSelectedSkillToEndorse] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    overall_rating: 5,
    collaboration_quality: 5,
    communication: 5,
    reliability: 5,
    skill_level: 5,
    review_text: '',
    would_collaborate_again: true,
    is_public: true
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [sharedProjects, setSharedProjects] = useState([]);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userGameStats, setUserGameStats] = useState(null);
  const [isLoadingGameStats, setIsLoadingGameStats] = useState(false);

  const handleSafeNavigation = useCallback(() => {
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;

    if (referrer && referrer.startsWith(currentOrigin) && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(createPageUrl("Feed"));
    }
  }, [navigate]);

  // Helper function to load followed projects - STABLE, no external dependencies
  const loadFollowedProjectsStable = useCallback(async (user, isOwner) => {
    setIsLoadingFollowedProjects(true);
    
    if (user.followed_projects && user.followed_projects.length > 0) {
      try {
        const followedProjectsData = await base44.entities.Project.filter({
          id: { $in: user.followed_projects }
        });
        
        // Filter to show only public projects if viewing someone else's profile
        const visibleFollowedProjects = followedProjectsData.filter(project => {
          if (isOwner) return true; // Owner sees all their followed projects
          // Others only see public followed projects
          return project.is_visible_on_feed;
        });

        setFollowedProjects(visibleFollowedProjects);
      } catch (error) {
        console.error("Error loading followed projects:", error);
        setFollowedProjects([]);
      }
    } else {
      setFollowedProjects([]);
    }
    
    setIsLoadingFollowedProjects(false);
  }, []); // Empty dependency array - function is stable

  const loadProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      let targetUser = null;

      if (username) {
        try {
          const { data: userData } = await getUserByUsername({ username: username });
          if (userData) {
            targetUser = userData;
          }
        } catch (error) {
          console.error("Error fetching user by username:", error);
        }
        
        // If username lookup failed but current user's username matches, use current user
        if (!targetUser && propCurrentUser && propCurrentUser.username === username) {
          try {
            const freshUser = await base44.auth.me();
            targetUser = freshUser;
          } catch (error) {
            console.error("Error fetching current user:", error);
            targetUser = propCurrentUser;
          }
        }
      }

      if (!targetUser && emailParam) {
        try {
          const { data: userData } = await getPublicUserProfiles({ emails: [emailParam] });
          if (userData && userData.length > 0) {
            targetUser = userData[0];

            if (targetUser.username) {
              navigate(createPageUrl(`UserProfile?username=${targetUser.username}`), { replace: true });
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching user by email:", error);
        }
      }

      if (!targetUser && !username && !emailParam && propCurrentUser) {
        try {
          const freshUser = await base44.auth.me();
          targetUser = freshUser;
        } catch (error) {
          console.error("Error fetching current user:", error);
          targetUser = propCurrentUser;
        }
      }

      if (!targetUser) {
        console.log(`User profile not found - username: ${username}, emailParam: ${emailParam}, propCurrentUser: ${!!propCurrentUser}`);
        setProfileUser(null);
        setIsLoading(false);
        return;
      }

      // Normalize user data to ensure portfolio_items and followed_projects are arrays
      const normalizedUser = {
        ...targetUser,
        portfolio_items: targetUser.portfolio_items || [],
        followed_projects: targetUser.followed_projects || [],
        skills: targetUser.skills || [],
        interests: targetUser.interests || [],
        tools_technologies: targetUser.tools_technologies || [],
        education: targetUser.education || [],
        awards_certifications: targetUser.awards_certifications || []
      };

      setProfileUser(normalizedUser);

      if (propCurrentUser && propCurrentUser.email === normalizedUser.email && setCurrentUser) {
        setCurrentUser(normalizedUser);
      }

      const isOwnerCheck = propCurrentUser && propCurrentUser.email === normalizedUser.email;

        try {
          const createdProjects = await base44.entities.Project.filter({ created_by: normalizedUser.email });
          const collaboratingProjects = await base44.entities.Project.filter({
            collaborator_emails: { $in: [normalizedUser.email] }
          });

          const allProjectsForUser = [...createdProjects, ...collaboratingProjects];
          const uniqueProjects = allProjectsForUser.reduce((acc, current) => {
            if (!acc.find(item => item.id === current.id)) {
              acc.push(current);
            }
            return acc;
          }, []);

          uniqueProjects.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

          const visibleProjects = uniqueProjects.filter(project => {
            if (isOwnerCheck) return true;
            // For others viewing the profile: only show public projects OR projects they're collaborating on
            if (!project.is_visible_on_feed) {
              // Private project - only show if current user is a collaborator
              return propCurrentUser && project.collaborator_emails && project.collaborator_emails.includes(propCurrentUser.email);
            }
            // Public project - always visible
            return true;
          });
          setUserProjects(visibleProjects);

          // Load followed projects in the background
          loadFollowedProjectsStable(normalizedUser, isOwnerCheck);

          // Load skill endorsements ONLY if user has skills
          if (normalizedUser.skills && normalizedUser.skills.length > 0) {
            setIsLoadingEndorsements(true);
            try {
              const endorsements = await base44.entities.SkillEndorsement.filter({
                user_email: normalizedUser.email
              });
              setSkillEndorsements(endorsements || []);
            } catch (error) {
              console.error("Error loading endorsements:", error);
              setSkillEndorsements([]);
            } finally {
              setIsLoadingEndorsements(false);
            }
          } else {
            setSkillEndorsements([]);
            setIsLoadingEndorsements(false);
          }

          // Load collaborator reviews with reviewer profiles
          try {
            const reviews = await base44.entities.CollaboratorReview.filter({
              reviewee_email: normalizedUser.email,
              is_public: true
            }, '-created_date');
            
            // Get unique reviewer emails
            const reviewerEmails = [...new Set(reviews.map(r => r.reviewer_email))];
            
            // Fetch reviewer profiles
            if (reviewerEmails.length > 0) {
              const { data: reviewerProfiles } = await getPublicUserProfiles({ emails: reviewerEmails });
              const profilesMap = {};
              reviewerProfiles.forEach(profile => {
                profilesMap[profile.email] = profile;
              });
              
              // Enhance reviews with reviewer profile images if missing
              const enhancedReviews = reviews.map(review => {
                if (!review.reviewer_profile_image && profilesMap[review.reviewer_email]) {
                  return {
                    ...review,
                    reviewer_profile_image: profilesMap[review.reviewer_email].profile_image
                  };
                }
                return review;
              });
              
              setCollaboratorReviews(enhancedReviews);
            } else {
              setCollaboratorReviews(reviews || []);
            }
          } catch (error) {
            console.error("Error loading reviews:", error);
            setCollaboratorReviews([]);
          }

          // Load gamification stats
          try {
            setIsLoadingGameStats(true);
            const gameStats = await base44.entities.UserGameStats.filter({
              user_email: normalizedUser.email
            });
            if (gameStats && gameStats.length > 0) {
              setUserGameStats(gameStats[0]);
            } else {
              setUserGameStats(null);
            }
          } catch (error) {
            console.error("Error loading game stats:", error);
            setUserGameStats(null);
          } finally {
            setIsLoadingGameStats(false);
          }

          // Load shared projects ONLY if viewing someone else's profile AND current user is logged in
          if (!isOwnerCheck && propCurrentUser) {
            try {
              const userProjectsICollaborateOn = await base44.entities.Project.filter({
                collaborator_emails: { $in: [propCurrentUser.email] }
              });
              const targetUserProjectsTheyCollaborateOn = await base44.entities.Project.filter({
                collaborator_emails: { $in: [normalizedUser.email] }
              });
              
              // Find projects where both current user and target user are collaborators
              const shared = userProjectsICollaborateOn.filter(p1 => 
                targetUserProjectsTheyCollaborateOn.some(p2 => p2.id === p1.id)
              );
              setSharedProjects(shared);
            } catch (error) {
              console.error("Error loading shared projects:", error);
              setSharedProjects([]);
            }
          } else {
            setSharedProjects([]);
          }

        } catch (error) {
          console.log("Error loading user projects:", error);
          setUserProjects([]);
          setFollowedProjects([]);
          setSkillEndorsements([]);
          setCollaboratorReviews([]);
          setSharedProjects([]);
        }
    } catch (error) {
      console.error("Error loading profile data:", error);
      setProfileUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [username, emailParam, navigate, propCurrentUser, setCurrentUser, loadFollowedProjectsStable]);

  // Listen for user updates from Feed/other pages - ONLY when user follows/unfollows
  useEffect(() => {
    const handleUserUpdated = async (event) => {
      const updatedUser = event.detail;

      const isViewingOwnProfile = propCurrentUser && profileUser &&
                                  propCurrentUser.email === profileUser.email;

      if (isViewingOwnProfile && updatedUser && updatedUser.email === profileUser.email) {
        setProfileUser(updatedUser);
        if (setCurrentUser) {
          setCurrentUser(updatedUser);
        }

        // Re-fetch endorsements if skills changed or just to refresh
        if (updatedUser.skills && updatedUser.skills.length > 0) {
            setIsLoadingEndorsements(true);
            const endorsements = await base44.entities.SkillEndorsement.filter({
              user_email: updatedUser.email
            });
            setSkillEndorsements(endorsements || []);
            setIsLoadingEndorsements(false);
        } else {
            setSkillEndorsements([]);
        }

        await loadFollowedProjectsStable(updatedUser, true);
        // Reviews are not directly tied to the current user's profile data like skills or followed projects,
        // but new reviews for them might come in. A full reload or specific review reload logic would be needed
        // if reviews are updated in real-time from outside this component.
        // For now, will assume reviews are fetched when the profile is initially loaded or reloaded.
      }
    };

    window.addEventListener('user-updated', handleUserUpdated);
    return () => window.removeEventListener('user-updated', handleUserUpdated);
  }, [profileUser, propCurrentUser, setCurrentUser, loadFollowedProjectsStable]);

  // Refetch user data when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && profileUser && propCurrentUser &&
          profileUser.email === propCurrentUser.email) {
        // User came back to their profile page, refresh their data
        try {
          const freshUser = await base44.auth.me();
          setProfileUser(freshUser);

          if (setCurrentUser) {
            setCurrentUser(freshUser);
          }

          // Refresh followed projects using the helper function
          await loadFollowedProjectsStable(freshUser, true);

          // Refresh endorsements
          if (freshUser.skills && freshUser.skills.length > 0) {
            setIsLoadingEndorsements(true);
            const endorsements = await base44.entities.SkillEndorsement.filter({
              user_email: freshUser.email
            });
            setSkillEndorsements(endorsements || []);
            setIsLoadingEndorsements(false);
          } else {
             setSkillEndorsements([]);
          }

          // Refresh collaborator reviews
          const reviews = await base44.entities.CollaboratorReview.filter({
            reviewee_email: freshUser.email,
            is_public: true
          }, '-created_date');
          setCollaboratorReviews(reviews || []);

        } catch (error) {
          console.log("Error refreshing user data on visibility change:", error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [profileUser, propCurrentUser, setCurrentUser, loadFollowedProjectsStable]);

  useEffect(() => {
    if (username || emailParam) {
      loadProfileData();
    } else if (!propAuthIsLoading) {
      loadProfileData();
    }
  }, [loadProfileData, propAuthIsLoading, username, emailParam]);

  const isOwner = propCurrentUser && profileUser && propCurrentUser.email === profileUser.email;

  const loadMoreProjects = () => {
    const newCount = Math.min(displayedProjectsCount + 3, userProjects.length);
    setDisplayedProjectsCount(newCount);
  };

  const showLessProjects = () => {
    setDisplayedProjectsCount(3);
  };

  const loadMoreFollowed = () => {
    const newCount = Math.min(displayedFollowedCount + 3, followedProjects.length);
    setDisplayedFollowedCount(newCount);
  };

  const showLessFollowed = () => {
    setDisplayedFollowedCount(3);
  };

  const handleShareProfile = () => {
    if (!profileUser) return;

    let url;
    if (profileUser.username) {
      url = `${window.location.origin}${createPageUrl(`UserProfile?username=${profileUser.username}`)}`;
    } else {
      url = `${window.location.origin}${createPageUrl(`UserProfile?email=${profileUser.email}`)}`;
    }

    navigator.clipboard.writeText(url).then(() => {
      // Profile link copied
    }).catch(err => {
      toast.error("Failed to copy link.");
      console.error('Failed to copy: ', err);
    });
  };

  const handleLogout = async () => {
    if (!propCurrentUser) return;

    try {
      const loginUrl = `${window.location.origin}/login`;
      await User.logout(loginUrl);
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = `${window.location.origin}/login`;
    }
  };

  const handleUpdateSocialLinks = async (socialLinks) => {
    try {
      await User.updateMyUserData({ social_links: socialLinks });
      setProfileUser(prev => ({ ...prev, social_links: socialLinks }));
    } catch (error) {
      console.error("Error updating social links:", error);
      toast.error("Failed to update social links.");
      throw error;
    }
  };

  const handleUpdateBio = async (newBio) => {
    try {
      await User.updateMyUserData({ bio: newBio });
      setProfileUser(prev => ({ ...prev, bio: newBio }));
    } catch (error) {
      console.error("Error updating bio:", error);
      toast.error("Failed to update biography.");
      throw error;
    }
  };

  const handleUpdateEducation = async (newEducation) => {
    try {
      await User.updateMyUserData({ education: newEducation });
      setProfileUser(prev => ({ ...prev, education: newEducation }));
    } catch (error) {
      console.error("Error updating education:", error);
      toast.error("Failed to update education.");
      throw error;
    }
  }

  const handleUpdateAwards = async (newAwards) => {
    try {
      await User.updateMyUserData({ awards_certifications: newAwards });
      setProfileUser(prev => ({ ...prev, awards_certifications: newAwards }));
    } catch (error) {
      console.error("Error updating awards:", error);
      toast.error("Failed to update awards.");
      throw error;
    }
  };

  const handleUpdateWebLinks = async (linkedinUrl, websiteUrl) => {
    try {
      await base44.auth.updateMe({
        linkedin_url: linkedinUrl,
        website_url: websiteUrl
      });
      setProfileUser(prev => ({
        ...prev,
        linkedin_url: linkedinUrl,
        website_url: websiteUrl
      }));
    } catch (error) {
      console.error("Error updating web links:", error);
      toast.error("Failed to update web links.");
      throw error;
    }
  };

  const handleUpdatePortfolio = async (newPortfolio) => {
    try {
      await base44.auth.updateMe({ portfolio_items: newPortfolio });
      setProfileUser(prev => ({ ...prev, portfolio_items: newPortfolio }));
    } catch (error) {
      console.error("Error updating portfolio:", error);
      toast.error("Failed to update portfolio.");
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }

    setIsUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      await base44.auth.updateMe({ resume_url: file_url });

      const freshUser = await base44.auth.me();

      setProfileUser(freshUser);

      if (isOwner && setCurrentUser) {
        setCurrentUser(freshUser);
      }

      // Resume uploaded
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error("Failed to upload resume. Please try again.");
    } finally {
      setIsUploadingResume(false);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  };

  const handleRemoveResume = async () => {
    try {
      await base44.auth.updateMe({ resume_url: "" });

      const freshUser = await base44.auth.me();

      setProfileUser(freshUser);

      if (isOwner && setCurrentUser) {
        setCurrentUser(freshUser);
      }

      // Resume removed
    } catch (error) {
      console.error("Error removing resume:", error);
      toast.error("Failed to remove resume.");
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingProfilePhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_image: file_url });
      
      const freshUser = await base44.auth.me();
      setProfileUser(freshUser);
      
      if (setCurrentUser) {
        setCurrentUser(freshUser);
      }
      
      // Profile photo updated
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      toast.error("Failed to upload profile photo.");
    } finally {
      setIsUploadingProfilePhoto(false);
      if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = '';
      }
    }
  };

  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingCoverPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ cover_image: file_url });
      
      const freshUser = await base44.auth.me();
      setProfileUser(freshUser);
      
      if (setCurrentUser) {
        setCurrentUser(freshUser);
      }
      
      // Cover photo updated
    } catch (error) {
      console.error("Error uploading cover photo:", error);
      toast.error("Failed to upload cover photo.");
    } finally {
      setIsUploadingCoverPhoto(false);
      if (coverPhotoInputRef.current) {
        coverPhotoInputRef.current.value = '';
      }
    }
  };

  const handleOpenEditModal = (section) => {
    if (!profileUser) return;
    if (section === 'skills') {
      setEditSkills([...(profileUser.skills || [])]);
    } else if (section === 'interests') {
      setEditInterests([...(profileUser.interests || [])]);
    } else if (section === 'tools') {
      setEditTools([...(profileUser.tools_technologies || [])]);
    }
    setEditingSection(section);
  };

  const handleCloseEditModal = () => {
    setEditingSection(null);
    setEditSkills([]);
    setEditInterests([]);
    setEditTools([]);
  };

  const handleSaveEdit = async () => {
    if (!propCurrentUser || !isOwner) return;

    setIsSavingEdit(true);
    try {
      let updateData = {};

      if (editingSection === 'skills') {
        updateData.skills = editSkills;
      } else if (editingSection === 'interests') {
        updateData.interests = editInterests;
      } else if (editingSection === 'tools') {
        updateData.tools_technologies = editTools;
      }

      await User.updateMyUserData(updateData);

      setProfileUser(prev => ({ ...prev, ...updateData }));

      handleCloseEditModal();
    } catch (error) {
      console.error(`Error updating ${editingSection}:`, error);
      toast.error(`Failed to update ${editingSection}. Please try again.`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEndorseSkill = async () => {
    if (!propCurrentUser || !profileUser || !selectedSkillToEndorse) return;

    if (propCurrentUser.email === profileUser.email) {
      toast.error("You cannot endorse your own skills.");
      setShowEndorseDialog(false);
      setSelectedSkillToEndorse(null);
      return;
    }

    try {
      // Check if already endorsed
      const existing = skillEndorsements.find(e => 
        e.skill === selectedSkillToEndorse && e.endorser_email === propCurrentUser.email
      );

      if (existing) {
        // Remove endorsement
        await base44.entities.SkillEndorsement.delete(existing.id);
        setSkillEndorsements(prev => prev.filter(e => e.id !== existing.id));
      } else {
        // Add endorsement
        const newEndorsement = await base44.entities.SkillEndorsement.create({
          user_email: profileUser.email,
          skill: selectedSkillToEndorse,
          endorser_email: propCurrentUser.email,
          endorser_name: propCurrentUser.full_name || propCurrentUser.email,
          endorser_profile_image: propCurrentUser.profile_image
        });

        setSkillEndorsements(prev => [...prev, newEndorsement]);

        // Award points - wrapped in try-catch to prevent blocking
        try {
          await base44.functions.invoke('awardPoints', {
            action: 'endorsement_received',
            user_email: profileUser.email
          });
          await base44.functions.invoke('awardPoints', {
            action: 'endorsement_given',
            user_email: propCurrentUser.email
          });
        } catch (pointsError) {
          console.error("Error awarding points for endorsement:", pointsError);
        }

        // Create notification - wrapped in try-catch to prevent blocking
        try {
          await base44.entities.Notification.create({
            user_email: profileUser.email,
            title: "New skill endorsement",
            message: `${propCurrentUser.full_name || propCurrentUser.email} endorsed you for ${selectedSkillToEndorse}`,
            type: "general",
            actor_email: propCurrentUser.email,
            actor_name: propCurrentUser.full_name || propCurrentUser.email,
            image_url: propCurrentUser.profile_image,
            link: createPageUrl(`UserProfile?username=${propCurrentUser.username}`)
          });
        } catch (notifError) {
          console.error("Error creating endorsement notification:", notifError);
          // Don't throw - endorsement was successful
        }
      }
    } catch (error) {
      console.error("Error endorsing skill:", error);
      toast.error("Failed to endorse skill. Please try again.");
    } finally {
      setShowEndorseDialog(false);
      setSelectedSkillToEndorse(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!propCurrentUser || !profileUser || !selectedProjectForReview) return;

    if (!reviewFormData.review_text.trim()) {
      toast.error("Please write a review.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      // Check if already reviewed for this project by this reviewer for this reviewee
      const existingReviews = await base44.entities.CollaboratorReview.filter({
        project_id: selectedProjectForReview.id,
        reviewer_email: propCurrentUser.email,
        reviewee_email: profileUser.email
      });

      if (existingReviews && existingReviews.length > 0) {
        toast.error("You've already reviewed this collaborator for this project.");
        setIsSubmittingReview(false);
        return;
      }

      const review = await base44.entities.CollaboratorReview.create({
        project_id: selectedProjectForReview.id,
        project_title: selectedProjectForReview.title,
        reviewer_email: propCurrentUser.email,
        reviewer_name: propCurrentUser.full_name || propCurrentUser.email,
        reviewer_profile_image: propCurrentUser.profile_image,
        reviewee_email: profileUser.email,
        reviewee_name: profileUser.full_name || profileUser.email,
        ...reviewFormData
      });

      // Add the new review to the local state (only if public)
      if (review.is_public) {
        setCollaboratorReviews(prev => [review, ...prev]);
      }

      // Award points - wrapped in try-catch to prevent blocking
      try {
        await base44.functions.invoke('awardPoints', {
          action: 'review_received',
          user_email: profileUser.email
        });
        await base44.functions.invoke('awardPoints', {
          action: 'review_given',
          user_email: propCurrentUser.email
        });
      } catch (pointsError) {
        console.error("Error awarding points for review:", pointsError);
      }

      // Create notification - wrapped in try-catch to prevent blocking
      try {
        await base44.entities.Notification.create({
          user_email: profileUser.email,
          title: "New collaboration review",
          message: `${propCurrentUser.full_name || propCurrentUser.email} left you a ${reviewFormData.overall_rating}-star review for "${selectedProjectForReview.title}"`,
          type: "general",
          related_project_id: selectedProjectForReview.id,
          actor_email: propCurrentUser.email,
          actor_name: propCurrentUser.full_name || propCurrentUser.email,
          image_url: propCurrentUser.profile_image,
          link: createPageUrl(`ProjectDetail?id=${selectedProjectForReview.id}`)
        });
      } catch (notifError) {
        console.error("Error creating review notification:", notifError);
        // Don't throw - review was successful
      }

      setShowReviewDialog(false);
      setSelectedProjectForReview(null);
      setReviewFormData({
        overall_rating: 5,
        collaboration_quality: 5,
        communication: 5,
        reliability: 5,
        skill_level: 5,
        review_text: '',
        would_collaborate_again: true,
        is_public: true
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getEndorsementCount = (skill) => {
    return skillEndorsements.filter(e => e.skill === skill).length;
  };

  const hasEndorsedSkill = (skill) => {
    if (!propCurrentUser) return false;
    return skillEndorsements.some(e => 
      e.skill === skill && e.endorser_email === propCurrentUser.email
    );
  };

  const calculateAverageRating = () => {
    if (collaboratorReviews.length === 0) return 0;
    const sum = collaboratorReviews.reduce((acc, r) => acc + r.overall_rating, 0);
    return (sum / collaboratorReviews.length).toFixed(1);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const handleOpenGenerateResume = () => {
    if (!profileUser || !username) {
      toast.error("Profile information not available for download.");
      return;
    }
    setShowGenerateResumeDialog(true);
  };

  const handleSyncUser = async () => {
    if (!propCurrentUser || !profileUser) {
      return;
    }

    setIsSyncing(true);
    try {
      const existingConv1 = await base44.entities.Conversation.filter({
        participant_1_email: propCurrentUser.email,
        participant_2_email: profileUser.email
      });

      const existingConv2 = await base44.entities.Conversation.filter({
        participant_1_email: profileUser.email,
        participant_2_email: propCurrentUser.email
      });

      let conversation;
      if (existingConv1.length > 0) {
        conversation = existingConv1[0];
      } else if (existingConv2.length > 0) {
        conversation = existingConv2[0];
      } else {
        conversation = await base44.entities.Conversation.create({
          participant_1_email: propCurrentUser.email,
          participant_2_email: profileUser.email,
          last_message: "",
          last_message_time: new Date().toISOString(),
          participant_1_unread_count: 0,
          participant_2_unread_count: 0
        });
      }

      setShowSyncDialog(false);
      navigate(createPageUrl(`Chat?conversation=${conversation.id}`));
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-sm sm:text-base">Loading profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">The profile you're looking for doesn't exist or hasn't been set up yet.</p>
          <div className="space-x-4">
            <Button
              onClick={() => navigate(createPageUrl("Discover"))}
              variant="outline"
            >
              Go to Discover
            </Button>
            {propCurrentUser && !username && !emailParam && (
              <Link to={createPageUrl("EditProfile")}>
                <Button className="cu-button">Complete Your Profile</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayedProjects = userProjects.slice(0, displayedProjectsCount);
  const displayedFollowed = followedProjects.slice(0, displayedFollowedCount);
  const averageRating = calculateAverageRating();

  return (
    <>
      <input
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ref={resumeInputRef}
        onChange={handleResumeUpload}
        className="hidden"
      />

      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        ref={profilePhotoInputRef}
        onChange={handleProfilePhotoUpload}
        className="hidden"
      />

      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        ref={coverPhotoInputRef}
        onChange={handleCoverPhotoUpload}
        className="hidden"
      />

      <EditBioModal
        isOpen={isEditBioOpen}
        onClose={() => setIsEditBioOpen(false)}
        bio={profileUser?.bio}
        onSave={handleUpdateBio}
      />

      <EditEducationModal
        isOpen={isEditEducationOpen}
        onClose={() => setIsEditEducationOpen(false)}
        education={profileUser?.education}
        onSave={handleUpdateEducation}
      />

      <EditAwardsModal
        isOpen={isEditAwardsOpen}
        onClose={() => setIsEditAwardsOpen(false)}
        awards={profileUser?.awards_certifications}
        onSave={handleUpdateAwards}
      />

      <EditWebLinksModal
        isOpen={isEditWebLinksOpen}
        onClose={() => setIsEditWebLinksOpen(false)}
        linkedinUrl={profileUser?.linkedin_url}
        websiteUrl={profileUser?.website_url}
        onSave={handleUpdateWebLinks}
      />

      <EditPortfolioModal
        isOpen={isEditPortfolioOpen}
        onClose={() => setIsEditPortfolioOpen(false)}
        portfolioItems={profileUser?.portfolio_items}
        onSave={handleUpdatePortfolio}
      />

      <GenerateResumeDialog
        isOpen={showGenerateResumeDialog}
        onClose={() => setShowGenerateResumeDialog(false)}
        profileUser={profileUser}
        username={username}
      />

      <ImageModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        imageUrl={profileUser?.profile_image}
        caption={`${profileUser?.full_name || 'User'}'s Profile Picture`}
        altText={`${profileUser?.full_name || 'User'}'s Profile Picture`}
      />
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center text-base sm:text-lg">
              <Info className="w-5 h-5 mr-2 text-purple-600"/>
              Contact Information
            </DialogTitle>
            <DialogDescription className="text-sm">
              Contact details for {profileUser?.full_name || 'this user'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
              <ContactInfoItem icon={Mail} label="Email" value={profileUser?.email} href={`mailto:${profileUser?.email}`} />
              {isOwner && profileUser?.phone_number && <ContactInfoItem icon={Phone} label="Phone" value={profileUser.phone_number} href={`tel:${profileUser.phone_number}`} />}
              {profileUser?.linkedin_url && <ContactInfoItem icon={Linkedin} label="LinkedIn" value={profileUser.linkedin_url} href={profileUser.linkedin_url} isLink />}
              {profileUser?.website_url && <ContactInfoItem icon={Globe} label="Website" value={profileUser.website_url} href={profileUser.website_url} isLink />}
              {isOwner && profileUser?.birthday && <ContactInfoItem icon={Cake} label="Birthday" value={format(new Date(profileUser.birthday), 'MMMM d, yyyy')} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Endorse Skill Dialog */}
      <Dialog open={showEndorseDialog} onOpenChange={setShowEndorseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Endorse Skill</DialogTitle>
            <DialogDescription>
              Endorse {profileUser?.full_name || 'this user'} for <strong>{selectedSkillToEndorse}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              {hasEndorsedSkill(selectedSkillToEndorse) 
                ? "You've already endorsed this skill. Click 'Remove Endorsement' to revoke it."
                : "Click 'Confirm Endorsement' to endorse this skill. Your endorsement will be visible on their profile."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndorseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndorseSkill} className="cu-button">
              {hasEndorsedSkill(selectedSkillToEndorse) ? 'Remove Endorsement' : 'Confirm Endorsement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Confirmation Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat with {profileUser?.full_name}?</DialogTitle>
            <DialogDescription>
              Start a conversation with {profileUser?.full_name} to chat about a project or collaboration opportunity.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Avatar className="w-12 h-12 border-2 border-purple-200">
              <AvatarImage src={profileUser?.profile_image} />
              <AvatarFallback className="bg-purple-100 text-purple-600">
                {profileUser?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{profileUser?.full_name}</p>
              <p className="text-sm text-gray-500">@{profileUser?.username || profileUser?.email.split('@')[0]}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSyncDialog(false)}
              disabled={isSyncing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSyncUser}
              disabled={isSyncing}
              className="cu-button"
            >
              {isSyncing ? "Chatting..." : "Yes, Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={(open) => {
        if (!open) {
          setShowReviewDialog(false);
          setSelectedProjectForReview(null);
          setReviewFormData({ // Reset form data when closing
            overall_rating: 5,
            collaboration_quality: 5,
            communication: 5,
            reliability: 5,
            skill_level: 5,
            review_text: '',
            would_collaborate_again: true,
            is_public: true
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Collaborator</DialogTitle>
            <DialogDescription>
              Share your experience working with {profileUser?.full_name || 'this user'} on "{selectedProjectForReview?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label className="mb-2 block">Overall Rating *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewFormData(prev => ({ ...prev, overall_rating: rating }))}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${rating <= reviewFormData.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block text-sm">Collaboration Quality (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={reviewFormData.collaboration_quality}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
                    setReviewFormData(prev => ({ ...prev, collaboration_quality: val }));
                  }}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm">Communication (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={reviewFormData.communication}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
                    setReviewFormData(prev => ({ ...prev, communication: val }));
                  }}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm">Reliability (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={reviewFormData.reliability}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
                    setReviewFormData(prev => ({ ...prev, reliability: val }));
                  }}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm">Skill Level (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={reviewFormData.skill_level}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
                    setReviewFormData(prev => ({ ...prev, skill_level: val }));
                  }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="review-text" className="mb-2 block">Review *</Label>
              <Textarea
                id="review-text"
                value={reviewFormData.review_text}
                onChange={(e) => setReviewFormData(prev => ({ ...prev, review_text: e.target.value }))}
                rows={6}
                placeholder="Share your experience working with this collaborator..."
                className="resize-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="would-collaborate"
                checked={reviewFormData.would_collaborate_again}
                onChange={(e) => setReviewFormData(prev => ({ ...prev, would_collaborate_again: e.target.checked }))}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <Label htmlFor="would-collaborate" className="cursor-pointer text-sm font-medium">
                I would collaborate with this person again
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-public"
                checked={reviewFormData.is_public}
                onChange={(e) => setReviewFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <Label htmlFor="is-public" className="cursor-pointer text-sm font-medium">
                Make this review public on their profile
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReviewDialog(false);
              setSelectedProjectForReview(null);
            }} disabled={isSubmittingReview}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={isSubmittingReview || !reviewFormData.review_text.trim()} className="cu-button">
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {isOwner && propCurrentUser && (
              <div className="mb-4 sm:mb-6">
                <ProfileCompletionBanner user={propCurrentUser} />
              </div>
            )}

            <Card className="cu-card mb-4 sm:mb-6 md:mb-8 overflow-hidden">
              <CardContent className="p-0">
                <div className="h-32 sm:h-40 md:h-48 lg:h-64 relative overflow-hidden group">
                  <ClickableImage
                    src={profileUser?.cover_image || DEFAULT_COVER_IMAGE}
                    alt="Cover"
                    caption={`${profileUser.full_name || 'User'}'s Cover Photo`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20" />
                  
                  {isOwner && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                      onClick={() => coverPhotoInputRef.current?.click()}
                      disabled={isUploadingCoverPhoto}
                    >
                      {isUploadingCoverPhoto ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 mr-2" />
                      )}
                      {isUploadingCoverPhoto ? "Uploading..." : "Change Cover"}
                    </Button>
                  )}
                </div>

                <div className="relative px-3 sm:px-4 md:px-6 py-6 sm:py-8">
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                    <div className="flex justify-center md:justify-start -mt-16 sm:-mt-20 md:-mt-24 mb-4 md:mb-0">
                      <div className="relative group">
                        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 border-4 border-white shadow-xl cursor-pointer" onClick={() => profileUser?.profile_image && setIsAvatarModalOpen(true)}>
                          <AvatarImage src={profileUser?.profile_image} className="object-cover" />
                          <AvatarFallback className="text-2xl sm:text-3xl md:text-4xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                            {profileUser?.full_name?.[0] || profileUser?.email?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        {isOwner && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-100 shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              profilePhotoInputRef.current?.click();
                            }}
                            disabled={isUploadingProfilePhoto}
                          >
                            {isUploadingProfilePhoto ? (
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                      <div className="text-center md:text-left">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                          {profileUser?.full_name || 'Anonymous User'}
                        </h1>
                        {profileUser?.username && (
                          <p className="text-sm sm:text-base text-gray-600 mb-2">@{profileUser.username}</p>
                        )}
                        {profileUser?.location && (
                          <div className="flex items-center justify-center md:justify-start text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                            <span className="text-sm sm:text-base">{profileUser.location}</span>
                          </div>
                        )}
                        {!isOwner && propCurrentUser && (
                          <div className="flex justify-center md:justify-start mt-3">
                            <Button
                              onClick={() => setShowSyncDialog(true)}
                              className="cu-button text-sm"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-center md:justify-end gap-2">
                        {isOwner ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => navigate(createPageUrl("EditProfile"))}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Profile
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => navigate(createPageUrl("MyBookings"))}
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              My Bookings
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                  More
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleOpenGenerateResume}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Generate Resume
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsContactModalOpen(true)}>
                                  <Info className="w-4 h-4 mr-2" />
                                  Contact Info
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(createPageUrl("NotificationSettings"))}>
                                  <Bell className="w-4 h-4 mr-2" />
                                  Notification Settings
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleShareProfile}
                              className="text-xs sm:text-sm px-3 sm:px-4"
                            >
                              <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              <span className="hidden xs:inline">Share</span>
                            </Button>
                          </>
                        )}
                        </div>
                        </div>
                        </div>

                        {/* Gamification Stats */}
                        {userGameStats && (
                        <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <LevelBadge level={userGameStats.level} size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-600">
                                {userGameStats.total_points.toLocaleString()} Points
                              </p>
                              {userGameStats.activity_streak > 0 && (
                                <Badge className="bg-orange-100 text-orange-700 text-xs">
                                  🔥 {userGameStats.activity_streak} day streak
                                </Badge>
                              )}
                            </div>
                            {userGameStats.badges && userGameStats.badges.length > 0 && (
                              <div className="mt-2">
                                <BadgeDisplay badges={userGameStats.badges.slice(0, 5)} size="sm" />
                              </div>
                            )}
                          </div>
                        </div>
                        <Link to={createPageUrl("Leaderboard")}>
                          <Button variant="outline" size="sm" className="text-purple-600 border-purple-300">
                            View Leaderboard
                          </Button>
                        </Link>
                        </div>
                        </div>
                        )}
                        </div>
                        </CardContent>
                        </Card>

            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8">
                <div className="lg:col-span-8 space-y-4 sm:space-y-6 md:space-y-8">
                  {profileUser.bio || profileUser.resume_url || isOwner ? (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"/>
                            Biography
                          </CardTitle>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsEditBioOpen(true)}
                              className="text-gray-500 hover:text-purple-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4">
                        {profileUser.bio && (
                          <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">
                            {profileUser.bio}
                          </p>
                        )}

                        {profileUser.resume_url ? (
                          <div className={profileUser.bio ? "pt-4 border-t" : ""}>
                            <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                                <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Resume/CV</p>
                                  <p className="text-xs text-gray-500">Click to view or download</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <a
                                  href={profileUser.resume_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    View
                                  </Button>
                                </a>
                                {isOwner && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveResume}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : isOwner && (
                          <div className={profileUser.bio ? "pt-4 border-t" : ""}>
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500 mb-3">Upload your resume to share with others</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resumeInputRef.current?.click()}
                                disabled={isUploadingResume}
                                className="text-purple-600 hover:text-purple-700"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                {isUploadingResume ? "Uploading..." : "Upload Resume"}
                              </Button>
                              <p className="text-xs text-gray-400 mt-2">Accepts PDF or Word documents (max 10MB)</p>
                            </div>
                          </div>
                        )}

                        {!profileUser.bio && isOwner && !profileUser.resume_url && (
                          <div className="text-center py-6 sm:py-8">
                            <p className="text-sm sm:text-base text-gray-500 mb-4">Tell the world about yourself</p>
                            <Button onClick={() => setIsEditBioOpen(true)} className="cu-button w-full sm:w-auto">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Biography
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : isOwner && (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="flex items-center text-base sm:text-lg">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"/>
                          Biography
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center py-6 sm:py-8 space-y-4">
                        <div>
                          <p className="text-sm sm:text-base text-gray-500 mb-4">Tell the world about yourself</p>
                          <Button onClick={() => setIsEditBioOpen(true)} className="cu-button w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Biography
                          </Button>
                        </div>
                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-500 mb-3">Upload your resume to share with others</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resumeInputRef.current?.click()}
                            disabled={isUploadingResume}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {isUploadingResume ? "Uploading..." : "Upload Resume"}
                          </Button>
                          <p className="text-xs text-gray-400 mt-2">Accepts PDF or Word documents (max 10MB)</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Portfolio Section */}
                  {((profileUser.portfolio_items && profileUser.portfolio_items.length > 0) || isOwner) && (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"/>
                            Portfolio & Case Studies
                          </CardTitle>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsEditPortfolioOpen(true)}
                              className="text-gray-500 hover:text-purple-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {profileUser.portfolio_items && profileUser.portfolio_items.length > 0 ? (
                          <div className="space-y-6">
                            {profileUser.portfolio_items.map((item, index) => (
                              <PortfolioItem 
                                key={index} 
                                item={item} 
                                profileUser={profileUser}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500 mb-3">
                              Showcase your best work
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditPortfolioOpen(true)}
                              className="cu-button"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Portfolio Item
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Collaborator Reviews Section */}
                  {(collaboratorReviews.length > 0 || (!isOwner && propCurrentUser && sharedProjects.length > 0)) && (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                              <span>Collaboration Reviews</span>
                            </div>
                            {collaboratorReviews.length > 0 && (
                              <Badge className="bg-yellow-100 text-yellow-800 ml-2">
                                {averageRating} ⭐ ({collaboratorReviews.length})
                              </Badge>
                            )}
                          </CardTitle>
                          {!isOwner && propCurrentUser && sharedProjects.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" className="cu-button">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Write Review
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {sharedProjects.map(project => (
                                  <DropdownMenuItem
                                    key={project.id}
                                    onClick={() => {
                                      setSelectedProjectForReview(project);
                                      setShowReviewDialog(true);
                                    }}
                                  >
                                    Review for "{project.title}"
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4">
                        {collaboratorReviews.length > 0 ? (
                          <>
                            {collaboratorReviews.slice(0, 3).map(review => (
                              <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <Avatar className="w-8 h-8 mr-2">
                                      <AvatarImage src={review.reviewer_profile_image} />
                                      <AvatarFallback>{review.reviewer_name?.[0] || 'R'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(review.created_date))} ago • <Link to={createPageUrl(`ProjectDetail?id=${review.project_id}`)} className="hover:underline">{review.project_title}</Link>
                                      </p>
                                  </div>
                                  </div>
                                  {renderStars(review.overall_rating)}
                                </div>
                                <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{review.review_text}</p>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800">Collaboration: {review.collaboration_quality}/5</Badge>
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800">Communication: {review.communication}/5</Badge>
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800">Reliability: {review.reliability}/5</Badge>
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800">Skill: {review.skill_level}/5</Badge>
                                  {review.would_collaborate_again && (
                                    <Badge className="bg-green-100 text-green-800">Would collaborate again ✓</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                            {collaboratorReviews.length > 3 && (
                              <Button variant="outline" size="sm" className="w-full">
                                View All {collaboratorReviews.length} Reviews
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">No public reviews yet</p>
                            {!isOwner && propCurrentUser && sharedProjects.length > 0 && (
                              <p className="text-xs text-gray-400 mt-2">Be the first to review this collaborator by clicking "Write Review" above.</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Service Offerings - Moved from sidebar */}
                  {isOwner && propCurrentUser && (
                   <div className="overflow-x-auto">
                     <ServiceListingManager 
                       currentUser={propCurrentUser}
                       isOwner={isOwner}
                       enableHorizontalScroll={true}
                     />
                   </div>
                  )}

                  <Card className="cu-card">
                   <CardHeader className="pb-3 sm:pb-4">
                     <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
                       <div className="flex items-center">
                         <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
                         <span>Projects ({userProjects.length})</span>
                       </div>
                        {!isOwner && userProjects.length > 0 && (
                          <Badge variant="outline" className="text-xs w-fit">
                            {userProjects.filter(p => p.is_visible_on_feed).length} Public
                            {propCurrentUser && userProjects.filter(p => !p.is_visible_on_feed && p.collaborator_emails?.includes(propCurrentUser.email)).length > 0 &&
                              ` • ${userProjects.filter(p => !p.is_visible_on_feed && p.collaborator_emails?.includes(propCurrentUser.email)).length} Shared`
                            }
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4 sm:space-y-6">
                      {userProjects.length > 0 ? (
                        <>
                          {displayedProjects.map(project => {
                            const isProjectOwner = propCurrentUser && project.created_by === propCurrentUser.email;
                            const isProjectCollaborator = propCurrentUser && project.collaborator_emails?.includes(propCurrentUser.email) && !isProjectOwner;
                            const isPublicProject = project.is_visible_on_feed;
                            
                            // Get project highlights and links
                            const highlights = project.highlights || [];
                            const projectUrls = project.project_urls || [];
                            const hasRichMedia = highlights.length > 0 || projectUrls.length > 0;

                            return (
                              <div key={project.id} className="border rounded-lg hover:bg-gray-50 transition-colors overflow-hidden">
                                <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="block group">
                                  <div className="p-3 sm:p-4 md:p-6">
                                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                                        {project.logo_url && (
                                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <ClickableImage
                                              src={project.logo_url}
                                              alt="Project logo"
                                              caption={`${project.title} - Project Logo`}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-base sm:text-lg text-gray-800 group-hover:text-purple-600 transition-colors mb-1">
                                            {project.title}
                                          </h4>
                                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                            {project.description}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0 ml-2 sm:ml-4">
                                        <Badge
                                          variant={project.project_type === 'Personal' ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {project.project_type}
                                        </Badge>
                                        {isProjectOwner && (
                                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                                            Owner
                                          </Badge>
                                        )}
                                        {isProjectCollaborator && (
                                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                                            Collaborator
                                          </Badge>
                                        )}
                                        {!isPublicProject && (
                                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                                            Private
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                            project.status === 'completed' ? 'border-green-500 text-green-700' :
                                            project.status === 'in_progress' ? 'border-blue-500 text-blue-700' :
                                            'border-orange-500 text-orange-700'
                                          }`}
                                        >
                                          {project.status?.replace(/_/g, ' ')}
                                        </Badge>
                                        {project.area_of_interest && (
                                          <span className="flex items-center">
                                            <Tag className="w-3 h-3 mr-1" />
                                            <span className="truncate max-w-20 sm:max-w-none">{project.area_of_interest}</span>
                                          </span>
                                        )}
                                        {project.location && (
                                          <span className="flex items-center">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            <span className="truncate max-w-20 sm:max-w-none">{project.location}</span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center text-xs text-gray-400">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {project.created_date ? formatDistanceToNow(new Date(project.created_date)) : 'N/A'} ago
                                      </div>
                                    </div>

                                    {project.skills_needed && project.skills_needed.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 pt-3 border-t border-gray-100">
                                        {project.skills_needed.slice(0, 4).map(skill => (
                                          <Badge key={skill} variant="secondary" className="text-xs">
                                            {skill}
                                          </Badge>
                                        ))}
                                        {project.skills_needed.length > 4 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{project.skills_needed.length - 4} more
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </Link>

                                {/* Rich Media Section */}
                                {hasRichMedia && (
                                  <div className="border-t bg-gray-50/50 p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
                                    {/* Project Highlights */}
                                    {highlights.length > 0 && (
                                      <div className="mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Camera className="w-4 h-4 text-purple-600" />
                                          <span className="text-xs font-medium text-gray-700">Project Highlights</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                          {highlights.slice(0, 3).map((highlight, idx) => {
                                            const mediaUrl = highlight.media_url || highlight.image_url;
                                            const mediaType = highlight.media_type || 'image';
                                            
                                            return (
                                              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 group">
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
                                                      <Play className="w-8 h-8 text-white" />
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <img 
                                                    src={mediaUrl} 
                                                    alt={highlight.caption || 'Project highlight'}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                  />
                                                )}
                                              </div>
                                            );
                                          })}
                                          {highlights.length > 3 && (
                                            <Link 
                                              to={createPageUrl(`ProjectDetail?id=${project.id}`)} 
                                              className="aspect-video rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                            >
                                              <span className="text-sm font-medium text-gray-600">
                                                +{highlights.length - 3} more
                                              </span>
                                            </Link>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Project Links */}
                                    {projectUrls.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <LinkIcon className="w-4 h-4 text-purple-600" />
                                          <span className="text-xs font-medium text-gray-700">Showcase</span>
                                        </div>
                                        <div className="space-y-2">
                                          {projectUrls.slice(0, 2).map((link, idx) => (
                                            <a
                                              key={idx}
                                              href={link.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center justify-between p-2 rounded-lg bg-white border hover:border-purple-300 hover:shadow-sm transition-all group"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                                  <Globe className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-xs font-medium text-gray-700 truncate group-hover:text-purple-600">
                                                  {link.title || link.url}
                                                </span>
                                              </div>
                                              <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-purple-600 flex-shrink-0 ml-2" />
                                            </a>
                                          ))}
                                          {projectUrls.length > 2 && (
                                            <Link
                                              to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                                              className="flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                            >
                                              <span className="text-xs font-medium text-gray-600">
                                                View all {projectUrls.length} links
                                              </span>
                                            </Link>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {userProjects.length > 3 && (
                            <div className="text-center pt-4 sm:pt-6 border-t">
                              {displayedProjectsCount < userProjects.length ? (
                                <Button variant="outline" className="w-full" onClick={loadMoreProjects}>
                                  Load More Projects ({userProjects.length - displayedProjectsCount} remaining)
                                </Button>
                              ) : (
                                <Button variant="outline" className="w-full" onClick={showLessProjects}>
                                  Show Less
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 sm:py-12">
                          <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                          <p className="text-sm sm:text-base text-gray-500 mb-4">
                            {isOwner
                              ? "You haven't created any projects yet."
                              : `${profileUser?.full_name || 'This user'} hasn't shared any ${propCurrentUser ? 'visible' : 'public'} projects yet.`
                            }
                          </p>
                          {isOwner && (
                            <Link to={createPageUrl("CreateProject")}>
                              <Button className="cu-button w-full sm:w-auto">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Project
                              </Button>
                            </Link>
                          )}
                          {!isOwner && !propCurrentUser && (
                            <p className="text-xs sm:text-sm text-gray-400 mt-2">
                              Sign in to see projects you might be collaborating on.
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* NEW: Following Section */}
                  {(followedProjects.length > 0 || isOwner || isLoadingFollowedProjects) && (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <div className="flex items-center">
                            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
                            <span>Following ({followedProjects.length})</span>
                          </div>
                          {!isOwner && followedProjects.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Public Projects
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4 sm:space-y-6">
                        {isLoadingFollowedProjects ? (
                          <div className="text-center py-8 sm:py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <p className="text-sm text-gray-500">Loading followed projects...</p>
                          </div>
                        ) : followedProjects.length > 0 ? (
                          <>
                            {displayedFollowed.map(project => {
                              const isPublicProject = project.is_visible_on_feed;

                              return (
                                <Link key={project.id} to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="block group">
                                  <div className="p-3 sm:p-4 md:p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                                        {project.logo_url && (
                                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <ClickableImage
                                              src={project.logo_url}
                                              alt="Project logo"
                                              caption={`${project.title} - Project Logo`}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-base sm:text-lg text-gray-800 group-hover:text-purple-600 transition-colors mb-1">
                                            {project.title}
                                          </h4>
                                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                            {project.description}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0 ml-2 sm:ml-4">
                                        <Badge
                                          variant={project.project_type === 'Personal' ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {project.project_type}
                                        </Badge>
                                        {!isPublicProject && (
                                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                                            Private
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                            project.status === 'completed' ? 'border-green-500 text-green-700' :
                                            project.status === 'in_progress' ? 'border-blue-500 text-blue-700' :
                                            'border-orange-500 text-orange-700'
                                          }`}
                                        >
                                          {project.status?.replace(/_/g, ' ')}
                                        </Badge>
                                        {project.area_of_interest && (
                                          <span className="flex items-center">
                                            <Tag className="w-3 h-3 mr-1" />
                                            <span className="truncate max-w-20 sm:max-w-none">{project.area_of_interest}</span>
                                          </span>
                                        )}
                                        {project.location && (
                                          <span className="flex items-center">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            <span className="truncate max-w-20 sm:max-w-none">{project.location}</span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center text-xs text-gray-400">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {project.created_date ? formatDistanceToNow(new Date(project.created_date)) : 'N/A'} ago
                                      </div>
                                    </div>

                                    {project.skills_needed && project.skills_needed.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 pt-3 border-t border-gray-100">
                                        {project.skills_needed.slice(0, 4).map(skill => (
                                          <Badge key={skill} variant="secondary" className="text-xs">
                                            {skill}
                                          </Badge>
                                        ))}
                                        {project.skills_needed.length > 4 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{project.skills_needed.length - 4} more
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}

                            {followedProjects.length > 3 && (
                              <div className="text-center pt-4 sm:pt-6 border-t">
                                {displayedFollowedCount < followedProjects.length ? (
                                  <Button variant="outline" className="w-full" onClick={loadMoreFollowed}>
                                    Load More ({followedProjects.length - displayedFollowedCount} remaining)
                                  </Button>
                                ) : (
                                  <Button variant="outline" className="w-full" onClick={showLessFollowed}>
                                    Show Less
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8 sm:py-12">
                            <Bookmark className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-sm text-gray-500 mb-4">
                              {isOwner
                                ? "You're not following any projects yet."
                                : `${profileUser?.full_name || 'This user'} isn't following any public projects yet.`
                              }
                            </p>
                            {isOwner && (
                              <Link to={createPageUrl("Discover")}>
                                <Button className="cu-button w-full sm:w-auto">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Discover Projects
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="lg:col-span-4 space-y-4 sm:space-y-6 md:space-y-8">
                  <SocialsPanel
                    socialLinks={profileUser.social_links || {}}
                    onUpdate={handleUpdateSocialLinks}
                    canEdit={isOwner}
                    title="Social Media"
                    emptyMessage="Add your social media links"
                  />

                  {(profileUser.website_url || profileUser.linkedin_url || isOwner) && (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base sm:text-lg">Web Links</CardTitle>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsEditWebLinksOpen(true)}
                              className="text-gray-500 hover:text-purple-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2 sm:space-y-3">
                        {profileUser.linkedin_url && <LinkButton href={profileUser.linkedin_url} icon={Linkedin} text="LinkedIn" />}
                        {profileUser.website_url && <LinkButton href={profileUser.website_url} icon={Globe} text="Personal Website" />}
                        {!profileUser.linkedin_url && !profileUser.website_url && isOwner && (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500 mb-3">Add your web links</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditWebLinksOpen(true)}
                              className="w-full sm:w-auto"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Links
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommended Collaborators */}
                  {isOwner && propCurrentUser && (
                    <RecommendedCollaborators 
                      currentUser={propCurrentUser}
                      profileUser={profileUser}
                      limit={5}
                    />
                  )}

                  {profileUser.education && profileUser.education.length > 0 ? (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"/>
                            Education
                          </CardTitle>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsEditEducationOpen(true)}
                              className="text-gray-500 hover:text-purple-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3 sm:space-y-4">
                        {profileUser.education.map((edu, index) => (
                          <div key={index}>
                            <p className="font-semibold text-sm sm:text-base">{edu.university_name}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{edu.degree} in {edu.major}</p>
                            <p className="text-xs sm:text-sm text-gray-500">{edu.graduation_date}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : isOwner && (
                      <Card className="cu-card text-center py-6 sm:py-8">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-center text-base sm:text-lg">
                            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"/>
                            Education
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm sm:text-base text-gray-500 mb-4">Add your educational background.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditEducationOpen(true)}
                            className="w-full sm:w-auto"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Education
                          </Button>
                        </CardContent>
                      </Card>
                  )}

                  {profileUser.skills && profileUser.skills.length > 0 ? (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"/>
                            Skills
                          </CardTitle>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditModal('skills')}
                              className="text-gray-500 hover:text-purple-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {isLoadingEndorsements ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <span className="ml-3 text-sm text-gray-500">Loading skills...</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                            {profileUser.skills.map(skill => {
                                const endorsementCount = getEndorsementCount(skill);
                                const isEndorsed = hasEndorsedSkill(skill);
                                const hasEndorsements = endorsementCount > 0;
                                
                                return (
                                <div key={skill} className="relative group">
                                    <Badge 
                                    className={`pr-8 cursor-pointer transition-all duration-200 ${
                                      hasEndorsements 
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-md hover:shadow-lg ring-2 ring-purple-200' 
                                        : isEndorsed 
                                          ? 'bg-purple-600 text-white' 
                                          : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200 hover:shadow-md'
                                    }`}
                                    onClick={() => {
                                        if (!isOwner && propCurrentUser) {
                                        setSelectedSkillToEndorse(skill);
                                        setShowEndorseDialog(true);
                                        }
                                    }}
                                    >
                                    <div className="flex items-center gap-1.5">
                                      {skill}
                                      {endorsementCount > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                                          hasEndorsements 
                                            ? 'bg-white/30 text-white backdrop-blur-sm' 
                                            : 'bg-purple-200 text-purple-800'
                                        }`}>
                                          {endorsementCount}
                                        </span>
                                      )}
                                    </div>
                                    </Badge>
                                    {!isOwner && propCurrentUser && (
                                    <button
                                        onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSkillToEndorse(skill);
                                        setShowEndorseDialog(true);
                                        }}
                                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-200 ease-in-out ${
                                            isEndorsed 
                                            ? 'bg-red-500 text-white hover:bg-red-600' 
                                            : 'bg-white border-2 border-purple-300 text-purple-600 opacity-0 group-hover:opacity-100 hover:bg-purple-50'
                                        }`}
                                        title={isEndorsed ? 'Remove endorsement' : 'Endorse this skill'}
                                    >
                                        {isEndorsed ? <X size={12} /> : <Plus size={12} />}
                                    </button>
                                    )}
                                </div>
                                );
                            })}
                            </div>
                        )}

                        {!isOwner && propCurrentUser && (profileUser.skills && profileUser.skills.length > 0) && (
                          <p className="text-xs text-gray-500 mt-3 text-center">
                            Click on a skill or the <Plus className="inline w-3 h-3" /> icon to endorse {profileUser.full_name || 'them'}
                          </p>
                        )}
                        
                        {skillEndorsements.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-gray-500 text-center">
                              ✨ Skills with a glow have been endorsed by the community
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : isOwner && (
                      <Card className="cu-card border-dashed border-2 border-purple-200 bg-purple-50/30">
                        <CardContent className="p-6 text-center">
                          <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                          <p className="text-sm text-gray-600 mb-3">Showcase your skills to potential collaborators</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal('skills')}
                            className="border-purple-300 text-purple-600 hover:bg-purple-50 w-full sm:w-auto"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Skills
                          </Button>
                        </CardContent>
                      </Card>
                  )}

                  {profileUser.tools_technologies && profileUser.tools_technologies.length > 0 ? (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <HardHat className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"/>
                            Tools & Technologies
                          </CardTitle>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditModal('tools')}
                              className="text-gray-500 hover:text-purple-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                          {profileUser.tools_technologies.map(tool => (
                            <Badge key={tool} className="bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border border-indigo-200 text-xs sm:text-sm">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : isOwner && (
                      <Card className="cu-card border-dashed border-2 border-indigo-200 bg-indigo-50/30">
                        <CardContent className="p-6 text-center">
                          <Wrench className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
                          <p className="text-sm text-gray-600 mb-3">List the tools and technologies you work with</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal('tools')}
                            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 w-full sm:w-auto"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Tools
                          </Button>
                        </CardContent>
                      </Card>
                  )}

                  {profileUser.interests && profileUser.interests.length > 0 ? (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"/>
                            Interests
                          </CardTitle>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditModal('interests')}
                              className="text-gray-500 hover:text-purple-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                          {profileUser.interests.map(interest => (
                            <Badge key={interest} className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 border border-pink-200 text-xs sm:text-sm">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : isOwner && (
                      <Card className="cu-card border-dashed border-2 border-pink-200 bg-pink-50/30">
                        <CardContent className="p-6 text-center">
                          <Heart className="w-8 h-8 mx-auto mb-3 text-pink-400" />
                          <p className="text-sm text-gray-600 mb-3">Share what you're passionate about</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal('interests')}
                            className="border-pink-300 text-pink-600 hover:bg-pink-50 w-full sm:w-auto"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Interests
                          </Button>
                        </CardContent>
                      </Card>
                  )}

                  {profileUser.awards_certifications && profileUser.awards_certifications.length > 0 ? (
                    <Card className="cu-card">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"/>
                            Awards & Certifications
                          </CardTitle>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsEditAwardsOpen(true)}
                              className="text-gray-500 hover:text-purple-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3 sm:space-y-4">
                        {profileUser.awards_certifications.map((award, index) => (
                          <div key={index}>
                            <p className="font-semibold text-sm sm:text-base">{award.name}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{award.issuing_organization} • {award.date_received}</p>
                            {award.credential_url && <a href={award.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-purple-600 hover:underline break-all">View Credential</a>}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : isOwner && (
                      <Card className="cu-card text-center py-6 sm:py-8">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-center text-base sm:text-lg">
                            <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"/>
                            Awards & Certifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm sm:text-base text-gray-500 mb-4">Showcase your awards and certs.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditAwardsOpen(true)}
                            className="w-full sm:w-auto"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Awards
                          </Button>
                        </CardContent>
                      </Card>
                  )}
                </div>
              </div>
            </>
          </motion.div>
        </div>
      </div>

      <Dialog open={editingSection === 'skills'} onOpenChange={(open) => !open && handleCloseEditModal()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Skills</DialogTitle>
            <DialogDescription>
              Add or remove skills to showcase your expertise
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ArrayInputWithSearch
              title=""
              items={editSkills}
              onAdd={(skill) => setEditSkills([...editSkills, skill])}
              onRemove={(skill) => setEditSkills(editSkills.filter(s => s !== skill))}
              placeholder="Search or add skills..."
              type="skills"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="cu-button">
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingSection === 'interests'} onOpenChange={(open) => !open && handleCloseEditModal()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Interests</DialogTitle>
            <DialogDescription>
              Share what you're passionate about
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ArrayInputWithSearch
              title=""
              items={editInterests}
              onAdd={(interest) => setEditInterests([...editInterests, interest])}
              onRemove={(interest) => setEditInterests(editInterests.filter(i => i !== interest))}
              placeholder="Search or add interests..."
              type="interests"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="cu-button">
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingSection === 'tools'} onOpenChange={(open) => !open && handleCloseEditModal()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Tools & Technologies</DialogTitle>
            <DialogDescription>
              List the tools and technologies you work with
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ArrayInputWithSearch
              title=""
              items={editTools}
              onAdd={(tool) => setEditTools([...editTools, tool])}
              onRemove={(tool) => setEditTools(editTools.filter(t => t !== tool))}
              placeholder="Search or add tools..."
              type="tools"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="cu-button">
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const ContactInfoItem = ({ icon: Icon, label, value, href, isLink }) => (
    <div className="flex items-start">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-1 flex-shrink-0"/>
        <div className="ml-3 sm:ml-4">
            <p className="text-xs text-gray-500">{label}</p>
            {href ? (
                <a
                    href={isLink && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') ? `https://${href}` : href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm sm:text-base text-gray-800 hover:text-purple-600 hover:underline break-all"
                >
                    {value}
                </a>
            ) : (
                <p className="font-medium text-sm sm:text-base text-gray-800 break-all">{value}</p>
            )}
        </div>
    </div>
);

const LinkButton = ({ href, icon: Icon, text }) => (
  <a href={href.startsWith('http') ? href : `https://${href}`} target="_blank" rel="noopener noreferrer">
    <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
      <Icon className="w-4 h-4 mr-2" />
      {text}
    </Button>
  </a>
);