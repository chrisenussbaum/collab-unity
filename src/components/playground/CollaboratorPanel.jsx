import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, X, Crown, Edit, Eye, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function CollaboratorPanel({ project, currentUser, onUpdate }) {
  const [collaborators, setCollaborators] = useState([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    if (project?.id) {
      loadCollaborators();
      subscribeToCollaborators();
    }
  }, [project?.id]);

  const subscribeToCollaborators = () => {
    if (!project?.id) return;

    const unsubscribe = base44.entities.CodeProjectCollaborator.subscribe((event) => {
      if (event.data?.project_id === project.id) {
        loadCollaborators();
      }
    });

    return () => unsubscribe();
  };

  const loadCollaborators = async () => {
    try {
      const collabs = await base44.entities.CodeProjectCollaborator.filter({
        project_id: project.id,
        status: "accepted"
      });
      setCollaborators(collabs || []);

      // Load user profiles
      const emails = [...new Set(collabs.map(c => c.user_email))];
      const profiles = {};
      for (const email of emails) {
        try {
          const { data } = await base44.functions.invoke('getUserByEmail', { email });
          profiles[email] = data;
        } catch (error) {
          console.error(`Error loading profile for ${email}:`, error);
        }
      }
      setUserProfiles(profiles);
    } catch (error) {
      console.error("Error loading collaborators:", error);
    }
  };

  const inviteCollaborator = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (inviteEmail === currentUser.email) {
      toast.error("You cannot invite yourself");
      return;
    }

    setIsLoading(true);
    try {
      // Check if already a collaborator
      const existing = await base44.entities.CodeProjectCollaborator.filter({
        project_id: project.id,
        user_email: inviteEmail.trim()
      });

      if (existing && existing.length > 0) {
        toast.error("User is already a collaborator");
        setIsLoading(false);
        return;
      }

      // Create invitation
      await base44.entities.CodeProjectCollaborator.create({
        project_id: project.id,
        user_email: inviteEmail.trim(),
        role: inviteRole,
        invited_by: currentUser.email,
        status: "accepted" // Auto-accept for now
      });

      // Send notification
      await base44.entities.Notification.create({
        user_email: inviteEmail.trim(),
        title: "Code Project Invitation",
        message: `${currentUser.full_name} invited you to collaborate on "${project.title}"`,
        type: "collaboration_request",
        related_project_id: project.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name
      });

      toast.success("Collaborator invited!");
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("editor");
      loadCollaborators();
    } catch (error) {
      console.error("Error inviting collaborator:", error);
      toast.error("Failed to invite collaborator");
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (collaboratorId, newRole) => {
    try {
      await base44.entities.CodeProjectCollaborator.update(collaboratorId, {
        role: newRole
      });
      toast.success("Role updated!");
      loadCollaborators();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const removeCollaborator = async (collaboratorId, userEmail) => {
    if (!confirm("Remove this collaborator?")) return;

    try {
      await base44.entities.CodeProjectCollaborator.delete(collaboratorId);
      toast.success("Collaborator removed");
      loadCollaborators();
    } catch (error) {
      console.error("Error removing collaborator:", error);
      toast.error("Failed to remove collaborator");
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner": return <Crown className="w-3 h-3" />;
      case "editor": return <Edit className="w-3 h-3" />;
      case "viewer": return <Eye className="w-3 h-3" />;
      default: return null;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "editor": return "bg-blue-100 text-blue-800 border-blue-300";
      case "viewer": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "";
    }
  };

  const isOwner = collaborators.some(c => c.user_email === currentUser.email && c.role === "owner");

  return (
    <>
      <div className="h-full flex flex-col bg-gray-800 border-l border-gray-700">
        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="font-semibold text-sm">Collaborators</span>
            <Badge variant="outline" className="ml-1">{collaborators.length}</Badge>
          </div>
          {isOwner && (
            <Button
              size="sm"
              onClick={() => setShowInviteDialog(true)}
              className="h-7 px-2"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Invite
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {collaborators.map((collab) => {
            const profile = userProfiles[collab.user_email];
            const isCurrentUser = collab.user_email === currentUser.email;

            return (
              <div
                key={collab.id}
                className="bg-gray-700/50 rounded p-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.profile_image} />
                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                      {profile?.full_name?.[0] || collab.user_email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {profile?.full_name || collab.user_email}
                      {isCurrentUser && <span className="text-gray-400 ml-1">(You)</span>}
                    </div>
                    <Badge className={`text-xs ${getRoleColor(collab.role)}`}>
                      {getRoleIcon(collab.role)}
                      <span className="ml-1 capitalize">{collab.role}</span>
                    </Badge>
                  </div>
                </div>

                {isOwner && !isCurrentUser && (
                  <div className="flex items-center gap-1">
                    <Select
                      value={collab.role}
                      onValueChange={(value) => updateRole(collab.id, value)}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCollaborator(collab.id, collab.user_email)}
                      className="h-7 w-7 p-0 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {collaborators.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No collaborators yet</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Collaborator</DialogTitle>
            <DialogDescription>
              Add someone to collaborate on this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collaborator@example.com"
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Editor</div>
                        <div className="text-xs text-gray-500">Can edit code and files</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Viewer</div>
                        <div className="text-xs text-gray-500">Can only view code</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={inviteCollaborator} disabled={isLoading} className="cu-button">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inviting...
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
    </>
  );
}