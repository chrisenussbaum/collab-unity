import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Compass, 
  LayoutGrid, 
  Plus, 
  MessageCircle, 
  User, 
  X,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

const tutorialSteps = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to Collab Unity! 🎉",
    description: "Let's take a quick tour to help you get started. This will only take a minute!",
    highlight: null
  },
  {
    id: "discover",
    icon: Compass,
    title: "Discover Projects",
    description: "Browse exciting projects and find collaborators who share your interests. Filter by skills, industry, and more!",
    highlight: "discover"
  },
  {
    id: "feed",
    icon: LayoutGrid,
    title: "Stay Updated",
    description: "The Feed shows project updates, collaboration calls, and community highlights. Like, comment, and engage with the community!",
    highlight: "feed"
  },
  {
    id: "create",
    icon: Plus,
    title: "Create Your Project",
    description: "Have an idea? Create a project to find collaborators, share progress, and bring your vision to life!",
    highlight: "create"
  },
  {
    id: "chat",
    icon: MessageCircle,
    title: "Connect & Chat",
    description: "Message collaborators directly, create group chats, and coordinate with your team in real-time.",
    highlight: "chat"
  },
  {
    id: "profile",
    icon: User,
    title: "Build Your Profile",
    description: "Showcase your skills, portfolio, and experience. A complete profile attracts the right collaborators!",
    highlight: "profile"
  }
];

export default function InteractiveTutorial({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tutorialSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
            <motion.div
              className="h-full cu-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10"
            onClick={onSkip}
          >
            <X className="w-4 h-4" />
          </Button>

          <CardContent className="pt-12 pb-6 px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="w-20 h-20 cu-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h2>

                <p className="text-gray-600 mb-8 leading-relaxed">
                  {step.description}
                </p>

                <div className="flex items-center justify-center gap-1.5 mb-6">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        index === currentStep 
                          ? 'w-8 bg-purple-600' 
                          : index < currentStep
                          ? 'w-2 bg-purple-400'
                          : 'w-2 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      className="flex-1"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    className="flex-1 cu-gradient text-white"
                  >
                    {isLastStep ? "Let's Go!" : "Next"}
                    {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>

                {currentStep === 0 && (
                  <button
                    onClick={onSkip}
                    className="text-sm text-gray-500 hover:text-gray-700 mt-4 underline"
                  >
                    Skip tutorial
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}