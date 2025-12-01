import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, UserMinus, LogOut, Crown, UserPlus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Project, ProjectInvitation, Notification, ProjectApplication, User } from "@/entities/all"; // Added User for follower notification
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ConfirmationDialog from "./ConfirmationDialog";
import { getAllPublicUserProfiles } from "@/functions/getAllPublicUserProfiles";

export default function ProjectMembershipManager({
  project,
  currentUser,
  projectUsers,
  isOwner,
  isExplicitCollaborator,
  onUpdate,
}) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteMessage, setInviteMessage] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const { data: users } = await getAllPublicUserProfiles();
        setAllUsers(users || []);
      } catch (error) {
        console.error("Error loading users for invite:", error);
      }
    };

    if (showInviteDialog && allUsers.length === 0) {
      loadAllUsers();
    }
  }, [showInviteDialog, allUsers.length]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    
    // Filter users who are not already collaborators and not the current user
    const collaboratorEmails = project.collaborator_emails || [];
    const filtered = allUsers.filter(user => {
      if (collaboratorEmails.includes(user.email) || user.email === currentUser.email) {
        return false;
      }
      
      return (
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query)
      );
    }).slice(0, 5);

    setSearchResults(filtered);
    setIsSearching(false);
  }, [searchQuery, allUsers, project.collaborator_emails, currentUser.email]);

  const handleLeaveProject = async () => {
    if (!currentUser || !project) return;

    setIsLeaving(true);
    try {
      const updatedCollaborators = (project.collaborator_emails || []).filter(
        email => email !== currentUser.email
      );

      await Project.update(project.id, {
        collaborator_emails: updatedCollaborators,
        current_collaborators_count: Math.max(0, (project.current_collaborators_count || 1) - 1)
      });

      // Update any accepted applications to withdrawn status
      try {
        const userApplications = await ProjectApplication.filter({
          project_id: project.id,
          applicant_email: currentUser.email,
          status: 'accepted'
        });

        for (const application of userApplications) {
          await ProjectApplication.update(application.id, {
            status: 'withdrawn'
          });
        }
      } catch (error) {
        console.error("Error updating application status:", error);
        // Continue with leave process even if application update fails
      }

      // Notify project owner
      if (project.created_by !== currentUser.email) {
        await Notification.create({
          user_email: project.created_by,
          title: "Team member left project",
          message: `${currentUser.full_name || currentUser.email} has left the project "${project.title}".`,
          type: "project_member_left",
          related_project_id: project.id,
          actor_email: currentUser.email,
          actor_name: currentUser.full_name || currentUser.email,
          metadata: {
            project_title: project.title,
            member_email: currentUser.email
          }
        });
      }

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error leaving project:", error);
      toast.error("Failed to leave project. Please try again.");
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !isOwner) return;

    setIsRemoving(true);
    try {
      const updatedCollaborators = (project.collaborator_emails || []).filter(
        email => email !== memberToRemove.email
      );

      await Project.update(project.id, {
        collaborator_emails: updatedCollaborators,
        current_collaborators_count: Math.max(0, (project.current_collaborators_count || 1) - 1)
      });

      // Update any accepted applications to withdrawn status
      try {
        const memberApplications = await ProjectApplication.filter({
          project_id: project.id,
          applicant_email: memberToRemove.email,
          status: 'accepted'
        });

        for (const application of memberApplications) {
          await ProjectApplication.update(application.id, {
            status: 'withdrawn'
          });
        }
      } catch (error) {
        console.error("Error updating application status:", error);
        // Continue with removal process even if application update fails
      }

      // Notify the removed member
      await Notification.create({
        user_email: memberToRemove.email,
        title: "Removed from project",
        message: `You have been removed from the project "${project.title}" by the project owner.`,
        type: "project_member_removed",
        related_project_id: project.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        metadata: {
          project_title: project.title
        }
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member. Please try again.");
    } finally {
      setIsRemoving(false);
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedUser || !isOwner) return;

    setIsSendingInvite(true);
    try {
      // Check if user is already a collaborator
      if (project.collaborator_emails?.includes(selectedUser.email)) {
        toast.error("This person is already a member of the project");
        setIsSendingInvite(false);
        return;
      }

      // Check if invitation already exists
      const existingInvites = await ProjectInvitation.filter({
        project_id: project.id,
        invitee_email: selectedUser.email,
        status: "pending"
      });

      if (existingInvites.length > 0) {
        toast.error("An invitation is already pending for this person");
        setIsSendingInvite(false);
        return;
      }

      // Create invitation record
      await ProjectInvitation.create({
        project_id: project.id,
        inviter_email: currentUser.email,
        invitee_email: selectedUser.email,
        message: inviteMessage.trim() || undefined
      });

      // Create notification for the invitee
      const messageText = inviteMessage.trim() 
        ? `${currentUser.full_name || currentUser.email} has invited you to join "${project.title}".\n\nMessage: "${inviteMessage}"`
        : `${currentUser.full_name || currentUser.email} has invited you to join "${project.title}".`;

      await Notification.create({
        user_email: selectedUser.email,
        title: "Project Invitation",
        message: messageText,
        type: "collaboration_request",
        related_project_id: project.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        metadata: {
          project_title: project.title,
          invitation_message: inviteMessage.trim() || null
        }
      });

      // ADDED: Notify followers about new member being invited
      try {
        const { data: allUsersData } = await User.filter({});
        const followersToNotify = (allUsersData || []).filter(user => 
          user.followed_projects?.includes(project.id) && 
          user.email !== currentUser.email &&
          user.email !== selectedUser.email // Don't notify the person being invited
        );

        for (const follower of followersToNotify) {
          await Notification.create({
            user_email: follower.email,
            title: "New team member invited",
            message: `${currentUser.full_name || currentUser.email} invited ${selectedUser.full_name || selectedUser.email} to join "${project.title}".`,
            type: "project_update",
            related_project_id: project.id,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            metadata: {
              project_title: project.title,
              update_type: "member_invited",
              new_member_email: selectedUser.email,
              new_member_name: selectedUser.full_name || selectedUser.email
            }
          });
        }
      } catch (error) {
        console.error("Error notifying followers about new invitation:", error);
        // Don't fail the invitation if follower notifications fail
      }

      // Reset and close
      setShowInviteDialog(false);
      setSearchQuery("");
      setSelectedUser(null);
      setInviteMessage("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const owner = projectUsers.find(u => u.email === project.created_by);
  const collaborators = projectUsers.filter(u => u.email !== project.created_by);
  const totalMembers = projectUsers.length;

  return (
    <>
      <ConfirmationDialog
        isOpen={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="Leave Project"
        description="Are you sure you want to leave this project? You will lose access to all project resources and discussions."
        confirmText="Leave Project"
        isDestructive={true}
        onConfirm={handleLeaveProject}
        isLoading={isLeaving}
      />

      <ConfirmationDialog
        isOpen={showRemoveConfirm}
        onOpenChange={(open) => {
          setShowRemoveConfirm(open);
          if (!open) setMemberToRemove(null);
        }}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${memberToRemove?.full_name || memberToRemove?.email} from this project? They will lose access to all project resources.`}
        confirmText="Remove Member"
        isDestructive={true}
        onConfirm={handleRemoveMember}
        isLoading={isRemoving}
      />

      {/* Invite Collaborator Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-purple-600" />
              Invite Collaborator
            </DialogTitle>
            <DialogDescription>
              Search for collaborators to invite to your project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!selectedUser ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="search-user">Search by name, username, or email</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search-user"
                      placeholder="Start typing to search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Search Results */}
                {searchQuery && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.profile_image} className="object-cover" />
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {user.full_name?.[0] || user.email?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900">
                              {user.full_name || 'Anonymous User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.username ? `@${user.username}` : user.email}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No users found</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Selected User Preview */}
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedUser.profile_image} className="object-cover" />
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {selectedUser.full_name?.[0] || selectedUser.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {selectedUser.full_name || 'Anonymous User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedUser.username ? `@${selectedUser.username}` : selectedUser.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    Change
                  </Button>
                </div>

                {/* Invitation Message */}
                <div className="space-y-2">
                  <Label htmlFor="invite-message">Personal Message (Optional)</Label>
                  <Textarea
                    id="invite-message"
                    placeholder="Add a personal message to your invitation..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    Tell them why you'd like them to join your project
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteDialog(false);
                setSearchQuery("");
                setSelectedUser(null);
                setInviteMessage("");
                setSearchResults([]);
              }}
              disabled={isSendingInvite}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={!selectedUser || isSendingInvite}
              className="cu-button"
            >
              {isSendingInvite ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="cu-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="cu-text-responsive-base flex items-center">
              <Users className="cu-icon-base mr-2 text-purple-600" />
              Team Members ({totalMembers})
            </CardTitle>
            {isOwner && (
              <Button
                size="sm"
                onClick={() => setShowInviteDialog(true)}
                className="cu-button"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Project Owner */}
          {owner && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Link
                  to={createPageUrl(owner.username ? `UserProfile?username=${owner.username}` : `UserProfile?email=${owner.email}`)}
                >
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer">
                    <AvatarImage src={owner.profile_image} className="object-cover" />
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {owner.full_name?.[0] || owner.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={createPageUrl(owner.username ? `UserProfile?username=${owner.username}` : `UserProfile?email=${owner.email}`)}
                    className="font-semibold text-sm sm:text-base text-gray-900 hover:text-purple-600 transition-colors block truncate"
                  >
                    {owner.full_name || owner.email}
                  </Link>
                  {owner.location && (
                    <p className="text-xs text-gray-500 truncate">{owner.location}</p>
                  )}
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center gap-1 flex-shrink-0">
                <Crown className="w-3 h-3" />
                Owner
              </Badge>
            </div>
          )}

          {/* Collaborators */}
          {collaborators.map((member) => (
            <div key={member.email} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Link
                  to={createPageUrl(member.username ? `UserProfile?username=${member.username}` : `UserProfile?email=${member.email}`)}
                >
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer">
                    <AvatarImage src={member.profile_image} className="object-cover" />
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {member.full_name?.[0] || member.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={createPageUrl(member.username ? `UserProfile?username=${member.username}` : `UserProfile?email=${member.email}`)}
                    className="font-semibold text-sm sm:text-base text-gray-900 hover:text-purple-600 transition-colors block truncate"
                  >
                    {member.full_name || member.email}
                  </Link>
                  {member.location && (
                    <p className="text-xs text-gray-500 truncate">{member.location}</p>
                  )}
                </div>
              </div>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMemberToRemove(member);
                    setShowRemoveConfirm(true);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}

          {/* Empty State */}
          {totalMembers === 1 && (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">You are currently the only member of this project.</p>
            </div>
          )}

          {/* Leave Project Button for Collaborators */}
          {isExplicitCollaborator && !isOwner && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                If you no longer wish to be a part of this project, you can leave at any time.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowLeaveConfirm(true)}
                className="w-full"
                disabled={isLeaving}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}