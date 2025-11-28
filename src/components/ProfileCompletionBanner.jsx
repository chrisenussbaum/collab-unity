import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Lightbulb, Users, Handshake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileCompletionBanner({ user, onDismiss }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user || isDismissed) return null;

  // Check if user has made any profile edits beyond required fields
  const hasSkills = user.skills && user.skills.length > 0;
  const hasTools = user.tools_technologies && user.tools_technologies.length > 0;
  const hasInterests = user.interests && user.interests.length > 0;
  const hasMadeEdits = hasSkills || hasTools || hasInterests;

  // Don't show banner if user has made any edits (has skills, tools, or interests)
  if (hasMadeEdits) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                    Welcome to Collab Unity!
                  </h3>
                  
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                    Complete your profile to maximize your chances of collaborating with others! A detailed profile helps you:
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700">Connect with talented collaborators</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Handshake className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-gray-700">Join exciting projects</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <Link to={createPageUrl("EditProfile")}>
                      <Button size="sm" className="cu-button text-sm shadow-sm">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Complete Your Profile
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleDismiss}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      I'll do this later
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 h-8 w-8 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}