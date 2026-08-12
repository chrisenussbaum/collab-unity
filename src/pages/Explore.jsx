import React from "react";
import GamesSection from "@/components/explore/GamesSection";
import CollaboratorsSection from "@/components/explore/CollaboratorsSection";
import LearningHubSection from "@/components/explore/LearningHubSection";
import NewsSection from "@/components/explore/NewsSection";
import AppsSection from "@/components/explore/AppsSection";
import LeaderboardSection from "@/components/explore/LeaderboardSection";

export default function Explore({ currentUser }) {
  return (
    <div className="cu-container cu-page">
      <div className="space-y-5">
        <GamesSection />
        <CollaboratorsSection currentUser={currentUser} />
        <LearningHubSection />
        <NewsSection />
        <AppsSection />
        <LeaderboardSection />
      </div>
    </div>
  );
}