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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Explore</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Discover everything Collab Unity has to offer — games, collaborators, learning, news, apps, and top creators.
        </p>
      </div>
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