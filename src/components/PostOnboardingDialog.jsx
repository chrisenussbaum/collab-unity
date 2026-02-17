import React, { useState } from "react";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Compass, Plus, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import DiscoverProjectsDialog from "./DiscoverProjectsDialog";

export default function PostOnboardingDialog({ isOpen, onClose, currentUser }) {
  const [showDiscoverProjects, setShowDiscoverProjects] = useState(false);
  // Force a full page reload to ensure Layout fetches updated user data
  const handleNavigation = (path) => {
    onClose();
    
    // Check if there's a stored redirect URL from pre-onboarding navigation
    const redirectUrl = sessionStorage.getItem('postOnboardingRedirect');
    if (redirectUrl) {
      sessionStorage.removeItem('postOnboardingRedirect');
      window.location.href = redirectUrl;
    } else {
      window.location.href = path;
    }
  };

  const options = [
    {
      icon: User,
      title: "Complete Profile Setup",
      description: "Add more details to help others discover you",
      color: "from-purple-500 to-indigo-600",
      action: () => handleNavigation(createPageUrl(`UserProfile?username=${currentUser?.username || ''}`))
    },
    {
      icon: Compass,
      title: "Join & Discover Projects",
      description: "Find exciting projects looking for collaborators",
      color: "from-blue-500 to-cyan-600",
      action: () => { onClose(); setShowDiscoverProjects(true); }
    },
    {
      icon: Plus,
      title: "Start a Project",
      description: "Create your own project and invite others",
      color: "from-green-500 to-emerald-600",
      action: () => handleNavigation(createPageUrl("CreateProject"))
    },
    {
      icon: LayoutGrid,
      title: "Explore Projects",
      description: "See what the community is working on",
      color: "from-orange-500 to-red-600",
      action: () => handleNavigation(createPageUrl("Feed"))
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Welcome to Collab Unity! 🎉</DialogTitle>
          <DialogDescription className="text-center text-base">
            What would you like to do first?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border-2 border-gray-100 hover:border-purple-300 h-full"
                  onClick={option.action}
                >
                  <div className="p-6 text-center space-y-3">
                    <div className={`w-16 h-16 bg-gradient-to-br ${option.color} rounded-2xl flex items-center justify-center mx-auto`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 text-center pt-2">
          You can access all of these options anytime from the navigation menu
        </p>
      </DialogContent>
    </Dialog>

    <DiscoverProjectsDialog
      isOpen={showDiscoverProjects}
      onClose={() => setShowDiscoverProjects(false)}
      currentUser={currentUser}
    />
  );
}