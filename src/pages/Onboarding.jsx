import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import OnboardingStep1 from "@/components/onboarding/OnboardingStep1";
import OnboardingStep2 from "@/components/onboarding/OnboardingStep2";
import OnboardingStep3 from "@/components/onboarding/OnboardingStep3";
import OnboardingStep4 from "@/components/onboarding/OnboardingStep4";

const STEP_TITLES = [
  { title: "Create Your Profile", description: "Let's start with the basics" },
  { title: "Skills & Interests", description: "Help us understand what you bring to the table" },
  { title: "Project Ideas", description: "AI-generated ideas based on your profile" },
  { title: "Find Collaborators", description: "Connect with like-minded creators" }
];

export default function Onboarding({ currentUser }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Step 1 state
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  // Step 2 state
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  // Step 3 state
  const [selectedIdea, setSelectedIdea] = useState(null);

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

    setIsCheckingUsername(true);
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
    } finally {
      setIsCheckingUsername(false);
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
    const { available, error } = await checkUsernameAvailability(username);
    if (!available) {
      toast.error(error || "Please choose a different username.");
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
        toast.error(error || "Username is no longer available.");
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }

      // Build update data
      const updateData = {
        username: username.toLowerCase().trim(),
        full_name: fullName.trim(),
        profile_image: profileImage,
        skills,
        interests,
        has_completed_onboarding: true
      };

      if (bio.trim()) updateData.bio = bio.trim();
      if (location.trim()) updateData.location = location.trim();

      await base44.auth.updateMe(updateData);

      toast.success("Welcome to Collab Unity! 🎉");

      // Navigate based on whether they selected a project idea
      if (selectedIdea) {
        // Navigate to create project with pre-filled data
        const params = new URLSearchParams({
          fromOnboarding: 'true',
          title: selectedIdea.title,
          description: selectedIdea.description,
          skills: JSON.stringify(selectedIdea.skills_needed || [])
        });
        navigate(`${createPageUrl("CreateProject")}?${params.toString()}`);
      } else {
        navigate(createPageUrl("Feed"));
      }
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

  const stepInfo = STEP_TITLES[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Welcome to Collab Unity
          </h1>
          <p className="text-gray-600 text-sm">
            Let's get you set up in a few quick steps
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? 'w-8 bg-purple-600'
                  : step < currentStep
                  ? 'w-2 bg-purple-400'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <Card className="cu-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{stepInfo.title}</CardTitle>
            <CardDescription>{stepInfo.description}</CardDescription>
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
          Step {currentStep} of 4
        </p>
      </motion.div>
    </div>
  );
}