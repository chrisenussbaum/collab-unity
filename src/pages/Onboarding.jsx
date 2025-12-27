import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Loader2, Upload, Camera, CheckCircle, XCircle, FileText, Shield, ArrowLeft, Cookie, Image, Briefcase, GraduationCap, Users, BookOpen, Rocket, Target } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PostOnboardingDialog from "../components/PostOnboardingDialog";

export default function Onboarding({ currentUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = goal, 2 = profile, 3 = terms, 4 = cookies
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [showPostOnboardingDialog, setShowPostOnboardingDialog] = useState(false);
  const [completedUser, setCompletedUser] = useState(null);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [hasScrolledPrivacy, setHasScrolledPrivacy] = useState(false);
  const [hasScrolledCookies, setHasScrolledCookies] = useState(false);
  const termsScrollRef = useRef(null);
  const privacyScrollRef = useRef(null);
  const profileImageInputRef = useRef(null);
  const coverImageInputRef = useRef(null);

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
    if (currentUser.cover_image) setCoverImage(currentUser.cover_image);
    if (currentUser.primary_goal) setPrimaryGoal(currentUser.primary_goal);
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

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCoverImage(file_url);
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast.error("Failed to upload cover photo. Please try again.");
    } finally {
      setIsUploadingCover(false);
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = '';
      }
    }
  };

  const handleProfileSubmit = async (e) => {
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
    if (!coverImage) {
      toast.error("Please upload a cover photo.");
      return;
    }

    setIsCheckingUsername(true);

    try {
      // Validate username
      const { available, error } = await checkUsernameAvailability(username);
      setIsCheckingUsername(false);

      if (!available) {
        toast.error(error || "This username is already taken. Please choose another one.");
        return;
      }

      // Move to terms step
      setStep(3);
    } catch (error) {
      console.error("Error checking username:", error);
      toast.error("Failed to verify username. Please try again.");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleAcceptTerms = async () => {
    // Move to cookies step
    setStep(4);
  };

  const handleCookiesChoice = async (accepted) => {
    setIsSubmitting(true);

    try {
      // Update user profile with all data, terms acceptance, and cookie choice
      await base44.auth.updateMe({
        username: username.toLowerCase().trim(),
        full_name: fullName.trim(),
        profile_image: profileImage,
        cover_image: coverImage,
        primary_goal: primaryGoal,
        has_completed_onboarding: true,
        accepted_terms: true,
        terms_accepted_at: new Date().toISOString(),
        accepted_cookies: accepted,
        cookies_accepted_at: new Date().toISOString()
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
    }
  };

  const handleDeclineTerms = async () => {
    // Log the decline and redirect to welcome page
    try {
      await base44.auth.updateMe({
        accepted_terms: false
      });
    } catch (error) {
      console.error("Error logging terms decline:", error);
    }
    
    // Logout and redirect
    await base44.auth.logout(createPageUrl("Welcome"));
  };

  const handleTermsScroll = (e) => {
    const element = e.target;
    const scrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (scrolledToBottom) {
      setHasScrolledTerms(true);
    }
  };

  const handlePrivacyScroll = (e) => {
    const element = e.target;
    const scrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (scrolledToBottom) {
      setHasScrolledPrivacy(true);
    }
  };

  const handleCookiesScroll = (e) => {
    const element = e.target;
    const scrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (scrolledToBottom) {
      setHasScrolledCookies(true);
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
      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        ref={coverImageInputRef}
        onChange={handleCoverUpload}
        className="hidden"
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="goal-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-3xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  What brings you to Collab Unity?
                </h1>
                <p className="text-gray-600">
                  Choose your primary goal to get personalized recommendations
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    value: "build_business",
                    icon: Briefcase,
                    title: "Build a Business",
                    description: "Launch a startup or turn your idea into a viable business",
                    color: "from-green-500 to-emerald-600"
                  },
                  {
                    value: "enhance_portfolio",
                    icon: Rocket,
                    title: "Enhance Portfolio",
                    description: "Showcase your work and build an impressive portfolio",
                    color: "from-purple-500 to-indigo-600"
                  },
                  {
                    value: "organizational_projects",
                    icon: Users,
                    title: "Organizational Projects",
                    description: "Manage projects for your company or organization",
                    color: "from-blue-500 to-cyan-600"
                  },
                  {
                    value: "educational_assignments",
                    icon: GraduationCap,
                    title: "Educational Projects",
                    description: "Collaborate on school assignments and learning projects",
                    color: "from-orange-500 to-amber-600"
                  },
                  {
                    value: "personal_development",
                    icon: BookOpen,
                    title: "Personal Development",
                    description: "Learn new skills and grow through hands-on projects",
                    color: "from-pink-500 to-rose-600"
                  },
                  {
                    value: "explore",
                    icon: Lightbulb,
                    title: "Just Exploring",
                    description: "Discover opportunities and see what's possible",
                    color: "from-violet-500 to-purple-600"
                  }
                ].map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = primaryGoal === goal.value;
                  
                  return (
                    <motion.div
                      key={goal.value}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        onClick={() => setPrimaryGoal(goal.value)}
                        className={`cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'border-2 border-purple-500 shadow-lg bg-purple-50'
                            : 'border-2 border-transparent hover:border-purple-200 hover:shadow-md'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className={`w-12 h-12 bg-gradient-to-br ${goal.color} rounded-lg flex items-center justify-center mb-4`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-bold text-gray-900 mb-2">{goal.title}</h3>
                          <p className="text-sm text-gray-600">{goal.description}</p>
                          {isSelected && (
                            <div className="mt-4 flex items-center text-purple-600">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              <span className="text-sm font-medium">Selected</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 text-center">
                <Button
                  onClick={() => setStep(2)}
                  className="cu-button px-12"
                  disabled={!primaryGoal}
                >
                  Continue
                </Button>
                {!primaryGoal && (
                  <p className="text-xs text-gray-500 mt-4">
                    Please select your primary goal to continue
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="profile-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Create Your Profile
                </h1>
                <p className="text-gray-600">
                  Complete these required fields to get started
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
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
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
                          disabled={isCheckingUsername}
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
                        disabled={isCheckingUsername}
                        required
                      />
                    </div>

                    {/* Cover Photo */}
                    <div>
                      <Label className="text-base font-medium mb-2 block">
                        Cover Photo <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex flex-col items-center space-y-3">
                        <div
                          onClick={() => !isUploadingCover && coverImageInputRef.current.click()}
                          className="cursor-pointer w-full h-24 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors overflow-hidden"
                        >
                          {isUploadingCover ? (
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                          ) : coverImage ? (
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center">
                              <Image className="w-8 h-8 text-gray-400" />
                              <span className="text-xs text-gray-500 mt-1">Click to upload</span>
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => coverImageInputRef.current.click()}
                          disabled={isUploadingCover}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {coverImage ? 'Change Cover' : 'Upload Cover'}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          This will appear at the top of your profile
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1"
                        disabled={isCheckingUsername}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="cu-button flex-1"
                        disabled={isCheckingUsername || !username.trim() || !fullName.trim() || !profileImage || !coverImage || !!usernameError}
                      >
                        {isCheckingUsername ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          'Continue'
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-center text-gray-500">
                      You can add more details to your profile later from your profile settings
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="terms-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Review Our Terms
                </h1>
                <p className="text-gray-600">
                  Please review and accept our Terms of Service and Privacy Policy to continue
                </p>
              </div>

              <div className="space-y-4">
                {/* Terms of Service */}
                <Card className="cu-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <CardTitle className="text-lg">Terms of Service</CardTitle>
                      </div>
                      {hasScrolledTerms && (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Read
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea 
                      className="h-48 w-full rounded-md border p-4 bg-gray-50"
                      onScrollCapture={handleTermsScroll}
                    >
                      <div className="text-sm text-gray-700 space-y-4">
                        <p className="font-semibold">Last Updated: December 1, 2024</p>
                        
                        <div>
                          <h3 className="font-semibold mb-1">1. Introduction</h3>
                          <p>Welcome to Collab Unity ("we," "our," or "us"). By accessing or using our platform at collabunity.io (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">2. Eligibility</h3>
                          <p>You must be at least 13 years old to use Collab Unity. If you are under 18, you represent that you have your parent or guardian's permission to use the Service.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">3. Account Registration</h3>
                          <p>When you create an account, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password. You agree to notify us immediately of any unauthorized use of your account.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">4. User Conduct</h3>
                          <p>You agree not to: (a) violate any laws or regulations; (b) post false, misleading, or fraudulent content; (c) harass, abuse, or threaten other users; (d) infringe on intellectual property rights; (e) upload malware or harmful code; (f) attempt to gain unauthorized access to our systems; (g) use the Service for any illegal or unauthorized purpose.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">5. Content Ownership</h3>
                          <p>You retain ownership of content you create and post on Collab Unity. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the Service.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">6. Collaboration Projects</h3>
                          <p>When you join or create collaborative projects, you agree to act in good faith with other collaborators. Disputes between collaborators should be resolved between the parties involved. Collab Unity is not responsible for the outcome of collaborations.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">7. Intellectual Property</h3>
                          <p>Project owners and collaborators should establish clear agreements regarding intellectual property rights for collaborative work. Collab Unity does not claim ownership over projects created using our platform.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">8. Termination</h3>
                          <p>We may terminate or suspend your account at any time for violations of these Terms or for any other reason at our discretion. Upon termination, your right to use the Service will immediately cease.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">9. Disclaimer of Warranties</h3>
                          <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THE ACCURACY, COMPLETENESS, OR USEFULNESS OF ANY INFORMATION ON THE SERVICE.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">10. Limitation of Liability</h3>
                          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, COLLAB UNITY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">11. Changes to Terms</h3>
                          <p>We may update these Terms from time to time. We will notify you of significant changes by posting a notice on our Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">12. Contact</h3>
                          <p>For questions about these Terms, please contact us at collabunity@collabunity.io.</p>
                        </div>
                      </div>
                    </ScrollArea>
                    {!hasScrolledTerms && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Please scroll to read the entire document
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Privacy Policy */}
                <Card className="cu-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <CardTitle className="text-lg">Privacy Policy</CardTitle>
                      </div>
                      {hasScrolledPrivacy && (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Read
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea 
                      className="h-48 w-full rounded-md border p-4 bg-gray-50"
                      onScrollCapture={handlePrivacyScroll}
                    >
                      <div className="text-sm text-gray-700 space-y-4">
                        <p className="font-semibold">Last Updated: December 1, 2024</p>

                        <div>
                          <h3 className="font-semibold mb-1">1. Introduction</h3>
                          <p>Collab Unity ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at collabunity.io.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">2. Information We Collect</h3>
                          <p><strong>Personal Information:</strong> Name, email address, profile photo, username, and any other information you provide.</p>
                          <p><strong>Usage Data:</strong> Information about how you use our Service, including pages visited, features used, and time spent.</p>
                          <p><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">3. How We Use Your Information</h3>
                          <p>We use your information to: (a) provide and maintain our Service; (b) personalize your experience; (c) communicate with you; (d) improve our Service; (e) ensure security and prevent fraud; (f) comply with legal obligations.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">4. Information Sharing</h3>
                          <p>We may share your information with: (a) other users as part of your public profile; (b) service providers who assist in operating our platform; (c) legal authorities when required by law; (d) in connection with a merger or acquisition.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">5. Data Security</h3>
                          <p>We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">6. Your Rights</h3>
                          <p>You have the right to: (a) access your personal data; (b) correct inaccurate data; (c) delete your data; (d) object to processing; (e) data portability; (f) withdraw consent.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">7. Cookies</h3>
                          <p>We use cookies and similar technologies to enhance your experience, analyze usage, and personalize content. You can control cookies through your browser settings.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">8. Children's Privacy</h3>
                          <p>Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">9. International Data Transfers</h3>
                          <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">10. Data Retention</h3>
                          <p>We retain your personal information for as long as necessary to provide our Service and fulfill the purposes described in this Policy, unless a longer retention period is required by law.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">11. Changes to This Policy</h3>
                          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on our Service.</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-1">12. Contact Us</h3>
                          <p>For questions about this Privacy Policy, please contact us at collabunity@collabunity.io.</p>
                        </div>
                      </div>
                    </ScrollArea>
                    {!hasScrolledPrivacy && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Please scroll to read the entire document
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="sm:flex-1"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeclineTerms}
                    className="sm:flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    disabled={isSubmitting}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                  <Button
                    onClick={handleAcceptTerms}
                    className="cu-button sm:flex-1"
                    disabled={isSubmitting || !hasScrolledTerms || !hasScrolledPrivacy}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept & Continue
                      </>
                    )}
                  </Button>
                </div>

                {(!hasScrolledTerms || !hasScrolledPrivacy) && (
                  <p className="text-xs text-center text-gray-500">
                    Please scroll through both documents to enable the Accept button
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="cookies-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cookie className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Cookie Preferences
                </h1>
                <p className="text-gray-600">
                  We use cookies to enhance your experience. Please review our cookie policy.
                </p>
              </div>

              <Card className="cu-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cookie className="w-5 h-5 text-purple-600" />
                      <CardTitle className="text-lg">How We Use Cookies</CardTitle>
                    </div>
                    {hasScrolledCookies && (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Read
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea 
                    className="h-64 w-full rounded-md border p-4 bg-gray-50"
                    onScrollCapture={handleCookiesScroll}
                  >
                    <div className="text-sm text-gray-700 space-y-4">
                      <p className="font-semibold">Cookie Policy - Last Updated: December 1, 2024</p>

                      <div>
                        <h3 className="font-semibold mb-1">What Are Cookies?</h3>
                        <p>Cookies are small text files that are stored on your device when you visit our platform. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.</p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-1">Essential Cookies</h3>
                        <p>These cookies are necessary for the platform to function properly. They enable core functionality such as:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Keeping you signed in to your account</li>
                          <li>Remembering your security preferences</li>
                          <li>Ensuring the platform works correctly</li>
                        </ul>
                        <p className="mt-2 text-xs text-gray-500">Essential cookies cannot be disabled as they are required for the platform to operate.</p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-1">Performance & Analytics Cookies</h3>
                        <p>These cookies help us understand how you interact with our platform:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Which pages you visit most often</li>
                          <li>How you navigate through the platform</li>
                          <li>Any errors you might encounter</li>
                        </ul>
                        <p className="mt-2 text-xs text-gray-500">This information helps us improve our service and fix issues.</p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-1">Functionality Cookies</h3>
                        <p>These cookies remember your preferences:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Your language and region settings</li>
                          <li>Your display preferences</li>
                          <li>Recently viewed projects</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-1">Your Choices</h3>
                        <p><strong>Accept:</strong> You consent to all cookies described above, including analytics and functionality cookies. This helps us improve your experience.</p>
                        <p className="mt-2"><strong>Decline:</strong> Only essential cookies will be used. Some features may be limited, but the core platform will still work.</p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-1">Managing Cookies</h3>
                        <p>You can change your cookie preferences at any time through your browser settings. Most browsers allow you to:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>See what cookies are stored on your device</li>
                          <li>Delete all or specific cookies</li>
                          <li>Block cookies from specific websites</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-1">Third-Party Cookies</h3>
                        <p>Some cookies may be set by third-party services we use:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Authentication providers (for secure login)</li>
                          <li>Analytics services (to understand usage patterns)</li>
                          <li>Content delivery networks (to serve content faster)</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-1">Contact Us</h3>
                        <p>If you have questions about our use of cookies, please contact us at collabunity@collabunity.io.</p>
                      </div>
                    </div>
                  </ScrollArea>
                  {!hasScrolledCookies && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Please scroll to read the entire document
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="sm:flex-1"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCookiesChoice(false)}
                  className="sm:flex-1"
                  disabled={isSubmitting || !hasScrolledCookies}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Decline Optional
                </Button>
                <Button
                  onClick={() => handleCookiesChoice(true)}
                  className="cu-button sm:flex-1"
                  disabled={isSubmitting || !hasScrolledCookies}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept All
                    </>
                  )}
                </Button>
              </div>

              {!hasScrolledCookies && (
                <p className="text-xs text-center text-gray-500 mt-4">
                  Please scroll through the cookie policy to make your choice
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}