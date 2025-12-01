import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Loader2, Upload, Camera, CheckCircle, XCircle, FileText, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PostOnboardingDialog from "../components/PostOnboardingDialog";

export default function Onboarding({ currentUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = profile, 2 = terms
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [showPostOnboardingDialog, setShowPostOnboardingDialog] = useState(false);
  const [completedUser, setCompletedUser] = useState(null);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [hasScrolledPrivacy, setHasScrolledPrivacy] = useState(false);
  const termsScrollRef = useRef(null);
  const privacyScrollRef = useRef(null);
  const profileImageInputRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      navigate(createPageUrl("Feed"));
      return;
    }

    if (currentUser.has_completed_onboarding) {
      navigate(createPageUrl("Feed"));
      return;
    }

    // Pre-fill with existing data if available
    if (currentUser.username) setUsername(currentUser.username);
    if (currentUser.full_name) setFullName(currentUser.full_name);
    if (currentUser.profile_image) setProfileImage(currentUser.profile_image);
  }, [currentUser, navigate]);

  const checkUsernameAvailability = async (usernameToCheck) => {
    if (!usernameToCheck || usernameToCheck === currentUser?.username) {
      setUsernameError("");
      return { available: true };
    }

    try {
      const response = await base44.functions.invoke('checkUsernameAvailability', {
        username: usernameToCheck
      });
      
      if (response.data.available) {
        setUsernameError("");
        return { available: true };
      } else {
        const error = response.data.error || "This username is already taken.";
        setUsernameError(error);
        return { available: false, error };
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Error checking username availability.");
      return { available: false, error: "Error checking username availability." };
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileImage(file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload profile photo. Please try again.");
    } finally {
      setIsUploadingImage(false);
      if (profileImageInputRef.current) {
        profileImageInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error("Please enter a username.");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!profileImage) {
      toast.error("Please upload a profile photo.");
      return;
    }

    setIsSubmitting(true);
    setIsCheckingUsername(true);

    try {
      // Validate username
      const { available, error } = await checkUsernameAvailability(username);
      setIsCheckingUsername(false);

      if (!available) {
        toast.error(error || "This username is already taken. Please choose another one.");
        setIsSubmitting(false);
        return;
      }

      // Update user profile
      await base44.auth.updateMe({
        username: username.toLowerCase().trim(),
        full_name: fullName.trim(),
        profile_image: profileImage,
        has_completed_onboarding: true
      });

      // Fetch the updated user to pass to dialog
      const updatedUser = await base44.auth.me();
      setCompletedUser(updatedUser);

      setShowPostOnboardingDialog(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsCheckingUsername(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <>
      <PostOnboardingDialog 
        isOpen={showPostOnboardingDialog}
        onClose={() => setShowPostOnboardingDialog(false)}
        currentUser={completedUser}
      />

      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        ref={profileImageInputRef}
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Welcome to Collab Unity
            </h1>
            <p className="text-gray-600">
              Let's get you set up in just a few seconds
            </p>
          </div>

          <Card className="cu-card">
            <CardHeader>
              <CardTitle>Create Your Profile</CardTitle>
              <CardDescription>
                Complete these required fields to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Photo */}
                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Profile Photo <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-col items-center space-y-3">
                    <div
                      onClick={() => !isUploadingImage && profileImageInputRef.current.click()}
                      className="cursor-pointer w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors overflow-hidden"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                      ) : profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => profileImageInputRef.current.click()}
                      disabled={isUploadingImage}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {profileImage ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Click to upload a profile photo
                    </p>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <Label htmlFor="username" className="text-base font-medium mb-2 block">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-500 mb-3">
                    This will be part of your profile URL (e.g., collabunity.app/@{username || 'yourname'})
                  </p>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">@</span>
                    </div>
                    <Input
                      id="username"
                      placeholder="yourname"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      maxLength={30}
                      className={`pl-7 ${usernameError ? 'border-red-500' : ''}`}
                      disabled={isSubmitting || isCheckingUsername}
                      autoCapitalize="off"
                      autoCorrect="off"
                      required
                    />
                  </div>
                  {isCheckingUsername && (
                    <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
                  )}
                  {usernameError && (
                    <p className="text-xs text-red-600 mt-1">{usernameError}</p>
                  )}
                  {username && !usernameError && !isCheckingUsername && username !== currentUser?.username && (
                    <p className="text-xs text-green-600 mt-1">✓ Username is available</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    3-30 characters: letters, numbers, hyphens, and underscores only
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName" className="text-base font-medium mb-2 block">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSubmitting || isCheckingUsername}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="cu-button w-full"
                  disabled={isSubmitting || isCheckingUsername || !username.trim() || !fullName.trim() || !profileImage || !!usernameError}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Completing Setup...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  You can add more details to your profile later from your profile settings
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}