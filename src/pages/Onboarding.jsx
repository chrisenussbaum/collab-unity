import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb, Loader2, User, Sparkles, Users, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PostOnboardingDialog from "../components/PostOnboardingDialog";
import OnboardingStep1 from "../components/onboarding/OnboardingStep1";
import OnboardingStep2 from "../components/onboarding/OnboardingStep2";
import OnboardingStep3 from "../components/onboarding/OnboardingStep3";
import OnboardingStep4 from "../components/onboarding/OnboardingStep4";

const STEPS = [
  { id: 1, title: "Profile", icon: User },
  { id: 2, title: "Skills", icon: Sparkles },
  { id: 3, title: "Ideas", icon: Lightbulb },
  { id: 4, title: "Connect", icon: Users }
];

export default function Onboarding({ currentUser }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1 state
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Step 2 state
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  
  // Step 3 state
  const [selectedIdea, setSelectedIdea] = useState(null);
  
  // General state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostOnboardingDialog, setShowPostOnboardingDialog] = useState(false);
  const [completedUser, setCompletedUser] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate(createPageUrl("Feed"));
      return;
    }

    if (currentUser.has_completed_onboarding && currentUser.profile_image) {
      navigate(createPageUrl("Feed"));
      return;
    }

    // Pre-fill with existing data
    if (currentUser.username) setUsername(currentUser.username);
    if (currentUser.full_name) setFullName(currentUser.full_name);
    if (currentUser.profile_image) setProfileImage(currentUser.profile_image);
    if (currentUser.skills) setSkills(currentUser.skills);
    if (currentUser.interests) setInterests(currentUser.interests);
    if (currentUser.bio) setBio(currentUser.bio);
    if (currentUser.location) setLocation(currentUser.location);
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

  const handleImageUpload = async (e, setImage) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImage(file_url);
      toast.success("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleStep1Next = async () => {
    setIsCheckingUsername(true);
    const { available, error } = await checkUsernameAvailability(username);
    setIsCheckingUsername(false);
    
    if (!available) {
      toast.error(error || "Username not available");
      return;
    }
    
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    setCurrentStep(3);
  };

  const handleStep3Next = () => {
    setCurrentStep(4);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      // Final username check
      const { available, error } = await checkUsernameAvailability(username);
      if (!available) {
        toast.error(error || "Username not available");
        setIsSubmitting(false);
        return;
      }

      // Update user profile with all collected data
      await base44.auth.updateMe({
        username: username.toLowerCase().trim(),
        full_name: fullName.trim(),
        profile_image: profileImage,
        skills: skills,
        interests: interests,
        bio: bio.trim(),
        location: location.trim(),
        has_completed_onboarding: true
      });

      // If user selected a project idea, create it
      if (selectedIdea) {
        try {
          await base44.entities.Project.create({
            title: selectedIdea.title,
            description: selectedIdea.description,
            project_type: selectedIdea.project_type || "Collaborative",
            skills_needed: selectedIdea.skills_needed || [],
            tools_needed: [],
            collaborator_emails: [currentUser.email],
            current_collaborators_count: 1,
            status: "seeking_collaborators",
            is_visible_on_feed: false,
            classification: "hobby",
            industry: "technology",
            area_of_interest: interests[0] || "General",
            location: location || "Remote"
          });
          toast.success("Project created from your selected idea!");
        } catch (projectError) {
          console.error("Error creating project:", projectError);
          // Don't fail the whole onboarding if project creation fails
        }
      }

      const updatedUser = await base44.auth.me();
      setCompletedUser(updatedUser);

      toast.success("Welcome to Collab Unity! 🎉");
      setShowPostOnboardingDialog(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Create Your Profile";
      case 2: return "Tell Us About You";
      case 3: return "Project Ideas for You";
      case 4: return "Find Collaborators";
      default: return "Welcome";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Let's start with the basics";
      case 2: return "Help us personalize your experience";
      case 3: return "AI-powered suggestions based on your skills";
      case 4: return "People you might want to work with";
      default: return "";
    }
  };

  return (
    <>
      <PostOnboardingDialog 
        isOpen={showPostOnboardingDialog}
        onClose={() => setShowPostOnboardingDialog(false)}
        currentUser={completedUser}
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 cu-gradient rounded-full flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Welcome to Collab Unity
            </h1>
            <p className="text-gray-600 text-sm">
              Let's get you set up in a few steps
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`text-xs mt-1 ${isCurrent ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>
                        {step.title}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`w-8 h-0.5 mb-5 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Card */}
          <Card className="cu-card">
            <CardHeader className="pb-4">
              <CardTitle>{getStepTitle()}</CardTitle>
              <CardDescription>{getStepDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <OnboardingStep1
                    key="step1"
                    username={username}
                    setUsername={setUsername}
                    fullName={fullName}
                    setFullName={setFullName}
                    profileImage={profileImage}
                    setProfileImage={setProfileImage}
                    usernameError={usernameError}
                    isCheckingUsername={isCheckingUsername}
                    isUploadingImage={isUploadingImage}
                    onImageUpload={handleImageUpload}
                    onNext={handleStep1Next}
                    isSubmitting={isSubmitting}
                    currentUser={currentUser}
                  />
                )}

                {currentStep === 2 && (
                  <OnboardingStep2
                    key="step2"
                    skills={skills}
                    setSkills={setSkills}
                    interests={interests}
                    setInterests={setInterests}
                    bio={bio}
                    setBio={setBio}
                    location={location}
                    setLocation={setLocation}
                    onNext={handleStep2Next}
                    onBack={() => setCurrentStep(1)}
                    isSubmitting={isSubmitting}
                  />
                )}

                {currentStep === 3 && (
                  <OnboardingStep3
                    key="step3"
                    skills={skills}
                    interests={interests}
                    onNext={handleStep3Next}
                    onBack={() => setCurrentStep(2)}
                    onSelectIdea={setSelectedIdea}
                    selectedIdea={selectedIdea}
                    isSubmitting={isSubmitting}
                  />
                )}

                {currentStep === 4 && (
                  <OnboardingStep4
                    key="step4"
                    skills={skills}
                    interests={interests}
                    selectedIdea={selectedIdea}
                    onBack={() => setCurrentStep(3)}
                    onComplete={handleComplete}
                    isSubmitting={isSubmitting}
                  />
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-gray-500 mt-4">
            You can always update your profile and preferences later
          </p>
        </motion.div>
      </div>
    </>
  );
}