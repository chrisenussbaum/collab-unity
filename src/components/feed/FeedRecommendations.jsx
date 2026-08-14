import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Tv, ChevronRight } from "lucide-react";

export default function FeedRecommendations({ currentUser }) {
  if (!currentUser) return null;

  return (
    <div className="mb-6 space-y-6">
      {/* Quick links to Learning Hub & News & Entertainment */}
      <div className="flex gap-3">
        <Link to="/LearningHub" className="flex-1">
          <div className="group flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:border-purple-400 transition-all">
            <div className="w-9 h-9 rounded-lg cu-gradient flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-xs sm:text-sm">Learning Hub</p>
              <p className="text-[10px] text-gray-500 hidden sm:block">Courses &amp; videos</p>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-purple-600 ml-auto flex-shrink-0" />
          </div>
        </Link>
        <Link to="/NewsEntertainment" className="flex-1">
          <div className="group flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:border-purple-400 transition-all">
            <div className="w-9 h-9 rounded-lg cu-gradient flex items-center justify-center flex-shrink-0">
              <Tv className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-xs sm:text-sm">News &amp; Entertainment</p>
              <p className="text-[10px] text-gray-500 hidden sm:block">Trending news</p>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-purple-600 ml-auto flex-shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}