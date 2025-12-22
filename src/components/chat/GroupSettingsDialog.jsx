import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Camera, Loader2, Crown, UserMinus, UserPlus, 
  Edit, Trash2, LogOut, X, Search
} from "lucide-react";
import { toast } from "sonner";
import ConfirmationDialog from "../ConfirmationDialog";

export default function GroupSettingsDialog({ 
  isOpen, 
  onClose, 
  conversation,
  currentUser,
  userProfiles,
  onUpdateGroup,
  onLeaveGroup,
  onDeleteGroup,
  allUsers
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);

  useEffect(() => {
    if (conversation) {
      setGroupName(conversation.group_name || "");
      setGroupImage(conversation.group_image || "");
    }
  }, [conversation]);

  if (!conversation || conversation.conversation_type !== 'group') return null;

  const isAdmin = conversation.admin_emails?.includes(currentUser.email);
  const participants = conversation.participants || [];
  const admins = conversation.admin_emails || [];

  const handleUploadGroupImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setGroupImage(file_url);
    } catch (error) {
      console.error("Error uploading group image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!groupName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }

    try {
      await onUpdateGroup({
        group_name: groupName.trim(),
        group_image: groupImage
      });
      setIsEditing(false);
      toast.success("Group updated successfully");
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group");
    }
  };

  const handleAddMember = async (user) => {
    if (participants.includes(user.email)) {
      toast.info("User is already in this group");
      return;
    }

    try {
      const updatedParticipants = [...participants, user.email];
      const unreadCounts = { ...(conversation.unread_counts || {}) };
      unreadCounts[user.email] = 0;

      await onUpdateGroup({
        participants: updatedParticipants,
        unread_counts: unreadCounts
      });

      // Send notification to new member
      const { base44 } = await import("@/api/base44Client");
      await base44.entities.Notification.create({
        user_email: user.email,
        title: "Added to Group Chat",
        message: `${currentUser.full_name || currentUser.email} added you to "${conversation.group_name}"`,
        type: 'direct_message',
        related_entity_id: conversation.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        read: false,
        metadata: {
          conversation_id: conversation.id,
          is_group: true,
          group_name: conversation.group_name
        }
      });

      setShowAddMemberDialog(false);
      setSearchQuery("");
      toast.success("Member added successfully");
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      const updatedParticipants = participants.filter(email => email !== memberToRemove.email);
      const updatedAdmins = admins.filter(email => email !== memberToRemove.email);
      const unreadCounts = { ...(conversation.unread_counts || {}) };
      delete unreadCounts[memberToRemove.email];

      await onUpdateGroup({
        participants: updatedParticipants,
        admin_emails: updatedAdmins,
        unread_counts: unreadCounts
      });

      setShowRemoveMemberDialog(false);
      setMemberToRemove(null);
      toast.success("Member removed successfully");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const availableUsers = allUsers?.filter(u => 
    !participants.includes(u.email) &&
    (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Group Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={groupImage} />
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    <Users className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-gray-900">{conversation.group_name}</h3>
                  )}
                  <p className="text-sm text-gray-500 mt-1">{participants.length} members</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadGroupImage}
                        className="hidden"
                        id="group-settings-image"
                      />
                      <label htmlFor="group-settings-image">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingImage}
                          onClick={() => document.getElementById('group-settings-image').click()}
                        >
                          {isUploadingImage ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                          ) : (
                            <><Camera className="w-4 h-4 mr-2" /> Change Image</>
                          )}
                        </Button>
                      </label>
                      <Button onClick={handleSaveChanges} className="cu-button">
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsEditing(false);
                        setGroupName(conversation.group_name || "");
                        setGroupImage(conversation.group_image || "");
                      }}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Group Info
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Members List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Members ({participants.length})</Label>
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddMemberDialog(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[300px] border rounded-lg p-2">
                <div className="space-y-2">
                  {participants.map(email => {
                    const profile = userProfiles[email] || {
                      email,
                      full_name: email.split('@')[0],
                      profile_image: null
                    };
                    const isUserAdmin = admins.includes(email);
                    const isCurrentUser = email === currentUser.email;

                    return (
                      <div
                        key={email}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={profile.profile_image} />
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {profile.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {profile.full_name}
                              {isCurrentUser && <span className="text-gray-500"> (You)</span>}
                            </p>
                            <p className="text-sm text-gray-500">
                              @{profile.username || email.split('@')[0]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isUserAdmin && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {isAdmin && !isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setMemberToRemove(profile);
                                setShowRemoveMemberDialog(true);
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowLeaveDialog(true)}
                className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Group
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Group
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px]">
              {availableUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    {searchQuery ? "No users found" : "All users are already in this group"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <button
                      key={user.email}
                      onClick={() => handleAddMember(user)}
                      className="w-full p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3 text-left"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {user.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.full_name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          @{user.username || user.email.split('@')[0]}
                        </p>
                      </div>
                      <UserPlus className="w-4 h-4 text-purple-600" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Group Confirmation */}
      <ConfirmationDialog
        isOpen={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        title="Leave Group"
        description={`Are you sure you want to leave "${conversation.group_name}"? You'll need to be re-added by an admin to rejoin.`}
        confirmText="Leave Group"
        cancelText="Cancel"
        onConfirm={onLeaveGroup}
        isDestructive={true}
      />

      {/* Delete Group Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Group"
        description={`Are you sure you want to delete "${conversation.group_name}"? This will remove the group and all its messages for everyone. This action cannot be undone.`}
        confirmText="Delete Group"
        cancelText="Cancel"
        onConfirm={onDeleteGroup}
        isDestructive={true}
      />

      {/* Remove Member Confirmation */}
      <ConfirmationDialog
        isOpen={showRemoveMemberDialog}
        onOpenChange={setShowRemoveMemberDialog}
        title="Remove Member"
        description={`Are you sure you want to remove ${memberToRemove?.full_name || 'this member'} from the group?`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleRemoveMember}
        isDestructive={true}
      />
    </>
  );
}