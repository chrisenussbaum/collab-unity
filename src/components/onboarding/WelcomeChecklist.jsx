import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  X, 
  Sparkles,
  User,
  Compass,
  Plus,
  MessageCircle,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const checklistItems = [
  {
    id: "completed_profile",
    icon: User,
    title: "Complete Your Profile",
    description: "Add your bio, skills, and portfolio to attract collaborators",
    action: "Complete Profile",
    link: null, // Will use username dynamically
    progressKey: "completed_profile"
  },
  {
    id: "viewed_discover",
    icon: Compass,
    title: "Explore Projects",
    description: "Browse the Discover page to find exciting collaboration opportunities",
    action: "Explore Now",
    link: createPageUrl("Discover"),
    progressKey: "viewed_discover"
  },
  {
    id: "created_project",
    icon: Plus,
    title: "Create a Project",
    description: "Share your idea and find the perfect collaborators to bring it to life",
    action: "Create Project",
    link: createPageUrl("CreateProject"),
    progressKey: "created_project"
  },
  {
    id: "sent_first_message",
    icon: MessageCircle,
    title: "Send a Message",
    description: "Connect with someone and start a conversation",
    action: "Go to Chat",
    link: createPageUrl("Chat"),
    progressKey: "sent_first_message"
  }
];

export default function WelcomeChecklist({ currentUser, onDismiss }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    if (currentUser?.onboarding_progress) {
      setProgress(currentUser.onboarding_progress);
    }
  }, [currentUser]);

  const completedCount = checklistItems.filter(
    item => progress[item.progressKey]
  ).length;
  const totalCount = checklistItems.length;
  const progressPercent = (completedCount / totalCount) * 100;

  const isAllComplete = completedCount === totalCount;

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="cu-gradient text-white shadow-lg relative"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Getting Started ({completedCount}/{totalCount})
          {completedCount < totalCount && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
      >
        <Card className="shadow-2xl border-purple-200">
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 cu-gradient rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-lg">Welcome Guide</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsMinimized(true)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onDismiss}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">
                  {completedCount} of {totalCount} completed
                </span>
                <span className="font-semibold text-purple-600">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {isAllComplete ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  All Set! 🎉
                </h3>
                <p className="text-gray-600 mb-4">
                  You've completed all the onboarding tasks. You're ready to collaborate!
                </p>
                <Button onClick={onDismiss} className="cu-gradient text-white">
                  Start Collaborating
                </Button>
              </motion.div>
            ) : (
              checklistItems.map((item) => {
                const Icon = item.icon;
                const isComplete = progress[item.progressKey];
                const itemLink = item.id === "completed_profile" 
                  ? createPageUrl(`UserProfile?username=${currentUser?.username}`)
                  : item.link;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border transition-colors ${
                      isComplete 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isComplete ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <Icon className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium mb-1 ${
                          isComplete ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {item.title}
                        </h4>
                        <p className={`text-xs mb-2 ${
                          isComplete ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {item.description}
                        </p>
                        {!isComplete && (
                          <Link to={itemLink}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                              {item.action}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}