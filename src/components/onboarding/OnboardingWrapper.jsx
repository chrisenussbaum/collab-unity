import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import InteractiveTutorial from "./InteractiveTutorial";
import ContextualTooltip from "./ContextualTooltip";
import WelcomeChecklist from "./WelcomeChecklist";
import { createPageUrl } from "@/utils";

// Define tooltips for different pages
const pageTooltips = {
  [createPageUrl("Feed")]: {
    id: "feed-applaud",
    title: "Show Your Support",
    description: "Applaud projects you find interesting to encourage creators and show your support!",
    delay: 2000
  },
  [createPageUrl("Discover")]: {
    id: "discover-filters",
    title: "Filter Projects",
    description: "Use filters to find projects that match your skills and interests perfectly.",
    delay: 1500
  },
  [createPageUrl("Chat")]: {
    id: "chat-start",
    title: "Start Chatting",
    description: "Click here to start a new conversation with potential collaborators.",
    delay: 1500
  }
};

export default function OnboardingWrapper({ currentUser, children }) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [currentTooltip, setCurrentTooltip] = useState(null);
  const [tooltipsSeen, setTooltipsSeen] = useState([]);
  const location = useLocation();
  const tooltipTargetRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const progress = currentUser.onboarding_progress || {};
    const seenTooltips = currentUser.tooltips_seen || [];
    
    setTooltipsSeen(seenTooltips);

    // Show tutorial on first login (after completing basic onboarding)
    if (!progress.completed_tutorial && currentUser.has_completed_onboarding) {
      setShowTutorial(true);
    }

    // Show checklist if not dismissed and not all tasks complete
    const allTasksComplete = 
      progress.completed_profile &&
      progress.viewed_discover &&
      progress.created_project &&
      progress.sent_first_message;

    if (!progress.dismissed_checklist && !allTasksComplete) {
      // Small delay before showing checklist
      setTimeout(() => setShowChecklist(true), 1000);
    }
  }, [currentUser]);

  // Handle contextual tooltips based on current page
  useEffect(() => {
    if (!currentUser || !currentUser.has_completed_onboarding) return;

    const tooltip = pageTooltips[location.pathname];
    
    if (tooltip && !tooltipsSeen.includes(tooltip.id)) {
      setCurrentTooltip(tooltip);
    }
  }, [location.pathname, currentUser, tooltipsSeen]);

  const handleTutorialComplete = async () => {
    setShowTutorial(false);
    try {
      await base44.auth.updateMe({
        onboarding_progress: {
          ...currentUser.onboarding_progress,
          completed_tutorial: true
        }
      });
    } catch (error) {
      console.error("Error updating tutorial progress:", error);
    }
  };

  const handleTutorialSkip = async () => {
    setShowTutorial(false);
    try {
      await base44.auth.updateMe({
        onboarding_progress: {
          ...currentUser.onboarding_progress,
          completed_tutorial: true
        }
      });
    } catch (error) {
      console.error("Error updating tutorial progress:", error);
    }
  };

  const handleChecklistDismiss = async () => {
    setShowChecklist(false);
    try {
      await base44.auth.updateMe({
        onboarding_progress: {
          ...currentUser.onboarding_progress,
          dismissed_checklist: true
        }
      });
    } catch (error) {
      console.error("Error dismissing checklist:", error);
    }
  };

  const handleTooltipDismiss = async (tooltipId) => {
    setCurrentTooltip(null);
    const newTooltipsSeen = [...tooltipsSeen, tooltipId];
    setTooltipsSeen(newTooltipsSeen);

    try {
      await base44.auth.updateMe({
        tooltips_seen: newTooltipsSeen
      });
    } catch (error) {
      console.error("Error updating tooltips:", error);
    }
  };

  return (
    <>
      {children}
      
      {showTutorial && (
        <InteractiveTutorial
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      {showChecklist && currentUser && (
        <WelcomeChecklist
          currentUser={currentUser}
          onDismiss={handleChecklistDismiss}
        />
      )}

      {currentTooltip && (
        <ContextualTooltip
          id={currentTooltip.id}
          title={currentTooltip.title}
          description={currentTooltip.description}
          targetRef={tooltipTargetRef}
          onDismiss={handleTooltipDismiss}
          delay={currentTooltip.delay}
        />
      )}
    </>
  );
}