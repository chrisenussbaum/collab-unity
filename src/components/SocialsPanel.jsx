
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label"; // New import
import { Share2, Edit, Instagram, Facebook, Twitter, Youtube, Twitch, Globe, Plus, X, ExternalLink, Music, Linkedin } from 'lucide-react'; // Updated imports
import { toast } from "sonner";

// New SOCIAL_PLATFORMS structure
const SOCIAL_PLATFORMS = {
  instagram: {
    name: 'Instagram',
    baseUrl: 'https://www.instagram.com/',
    icon: Instagram,
    color: 'text-pink-600'
  },
  facebook: {
    name: 'Facebook',
    baseUrl: 'https://www.facebook.com/',
    icon: Facebook,
    color: 'text-blue-600'
  },
  twitter: {
    name: 'X (Twitter)',
    baseUrl: 'https://x.com/',
    icon: Twitter,
    color: 'text-black'
  },
  youtube: {
    name: 'YouTube',
    baseUrl: 'https://www.youtube.com/@',
    icon: Youtube,
    color: 'text-red-600'
  },
  twitch: {
    name: 'Twitch',
    baseUrl: 'https://www.twitch.tv/',
    icon: Twitch,
    color: 'text-purple-600'
  },
  tiktok: {
    name: 'TikTok',
    baseUrl: 'https://www.tiktok.com/@',
    icon: Music,
    color: 'text-black'
  },
  linkedin: {
    name: 'LinkedIn',
    baseUrl: 'https://www.linkedin.com/in/',
    icon: Linkedin,
    color: 'text-blue-700'
  },
  website: {
    name: 'Website',
    baseUrl: '', // No base URL for website, user provides full URL
    icon: Globe,
    color: 'text-gray-600'
  },
};

export default function SocialsPanel({
  socialLinks = {},
  onUpdate,
  canEdit = false,
  title = "Social Media",
  emptyMessage = "No social links added yet"
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Renamed state variable
  const [editedLinks, setEditedLinks] = useState({}); // Initialize as empty, populate in handleOpenEdit
  const [isSaving, setIsSaving] = useState(false);

  // Derive activeSocials for display based on the new SOCIAL_PLATFORMS structure
  const activeSocials = Object.keys(SOCIAL_PLATFORMS)
    .filter(key => socialLinks[key]) // Filter for platforms that have a link in socialLinks
    .map(key => ({
      key,
      ...SOCIAL_PLATFORMS[key], // Spread platform details
      displayUrl: socialLinks[key] // Keep the original full URL for display
    }));

  const handleOpenEdit = () => {
    const initialEditedLinks = {};
    for (const [key, platform] of Object.entries(SOCIAL_PLATFORMS)) {
      const storedLink = socialLinks[key];
      if (storedLink) {
        if (key === 'website') {
          initialEditedLinks[key] = storedLink; // Website link is stored as full URL
        } else {
          // For social platforms, extract username from the full URL
          const baseUrl = platform.baseUrl;
          if (storedLink.startsWith(baseUrl)) {
            let username = storedLink.substring(baseUrl.length);
            initialEditedLinks[key] = username;
          } else {
            // If the stored link doesn't match the expected base URL,
            // treat the entire stored link as the 'username' for editing.
            // The save function will then try to re-form and validate it.
            initialEditedLinks[key] = storedLink;
          }
        }
      }
    }
    setEditedLinks(initialEditedLinks);
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    const cleanedLinksForUpdate = {};
    for (const [key, value] of Object.entries(editedLinks)) {
        if (value && value.trim()) {
            let fullUrlToValidate = value.trim();
            const platform = SOCIAL_PLATFORMS[key]; // Fixed typo here: SOCIAL_PLATFORS -> SOCIAL_PLATFORMS

            if (key === 'website') {
                // For website, ensure it has a protocol if not already present
                if (!/^https?:\/\//i.test(fullUrlToValidate)) {
                    fullUrlToValidate = `https://${fullUrlToValidate}`;
                }
            } else {
                // For social profiles, construct the full URL from base and username
                fullUrlToValidate = platform.baseUrl + value.trim();
            }

            try {
                new URL(fullUrlToValidate); // Validate the constructed URL
                cleanedLinksForUpdate[key] = fullUrlToValidate;
            } catch (e) {
                toast.error(`Invalid URL for ${platform.name}. Please ensure it's a valid link or username.`);
                return;
            }
        }
    }

    setIsSaving(true);
    try {
      await onUpdate(cleanedLinksForUpdate);
      toast.success("Social media links updated successfully!");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating social links:", error);
      toast.error("Failed to update social links. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key, value) => { // Renamed from handleLinkChange for clarity
    setEditedLinks(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!canEdit && activeSocials.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="cu-card">
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
              {title}
            </CardTitle>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenEdit}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {activeSocials.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">{emptyMessage}</p>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEdit}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Social Links
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {activeSocials.map(platform => {
                const Icon = platform.icon;
                return (
                  <a
                    key={platform.key}
                    href={platform.displayUrl} // Use displayUrl from activeSocials
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${platform.color}`} />
                      <span className="font-medium text-sm text-gray-900">{platform.name}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </a>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Social Media Links</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Add links to your social media profiles. Leave fields empty to remove them.
            </p>

            {Object.entries(SOCIAL_PLATFORMS).map(([key, platform]) => {
              const Icon = platform.icon;
              const isWebsite = key === 'website';

              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-sm font-medium flex items-center">
                    <Icon className={`w-4 h-4 mr-2 ${platform.color}`} />
                    {platform.name}
                  </Label>
                  {isWebsite ? (
                    <Input
                      id={key}
                      placeholder="https://example.com"
                      value={editedLinks[key] || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                        {platform.baseUrl}
                      </span>
                      <Input
                        id={key}
                        placeholder="username"
                        value={editedLinks[key] || ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="rounded-l-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="cu-button"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
