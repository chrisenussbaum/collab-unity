import React, { useState } from "react";
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
import { Search, Users, X, Camera, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function NewGroupChatDialog({ 
  isOpen, 
  onClose, 
  allUsers, 
  currentUser,
  onCreateGroup,
  isLoading
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const toggleUser = (user) => {
    if (selectedUsers.find(u => u.email === user.email)) {
      setSelectedUsers(selectedUsers.filter(u => u.email !== user.email));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

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

  const handleCreate = () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedUsers.length < 2) {
      toast.error("Please select at least 2 members");
      return;
    }

    onCreateGroup({
      groupName: groupName.trim(),
      groupImage,
      participants: selectedUsers
    });

    // Reset form
    setGroupName("");
    setGroupImage("");
    setSelectedUsers([]);
    setSearchQuery("");
  };

  const filteredUsers = allUsers.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label>Group Name *</Label>
            <Input
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Group Image */}
          <div className="space-y-2">
            <Label>Group Image (Optional)</Label>
            <div className="flex items-center space-x-3">
              <Avatar className="w-16 h-16">
                <AvatarImage src={groupImage} />
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  <Users className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadGroupImage}
                className="hidden"
                id="group-image-upload"
              />
              <label htmlFor="group-image-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingImage}
                  onClick={() => document.getElementById('group-image-upload').click()}
                >
                  {isUploadingImage ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Camera className="w-4 h-4 mr-2" /> Upload Image</>
                  )}
                </Button>
              </label>
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Members ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <Badge key={user.email} variant="secondary" className="flex items-center gap-1 pr-1">
                    {user.full_name}
                    <button
                      onClick={() => toggleUser(user)}
                      className="hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User Search */}
          <div className="space-y-2">
            <Label>Add Members *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* User List */}
          <ScrollArea className="h-[250px] border rounded-lg">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.find(u => u.email === user.email);
                  return (
                    <button
                      key={user.email}
                      onClick={() => toggleUser(user)}
                      className={`w-full p-3 hover:bg-gray-50 transition-colors flex items-center space-x-3 text-left ${
                        isSelected ? 'bg-purple-50' : ''
                      }`}
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
                      {isSelected && (
                        <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isLoading || !groupName.trim() || selectedUsers.length < 2}
              className="cu-button"
            >
              {isLoading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}