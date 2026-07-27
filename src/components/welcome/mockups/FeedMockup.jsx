import React from "react";
import { Heart, MessageCircle, Share2, Sparkles } from "lucide-react";

export default function FeedMockup() {
  return (
    <div className="space-y-3">
      {/* Create post bar */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex-shrink-0" />
        <div className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm text-gray-400">Share a progress update...</div>
        <span className="text-sm font-medium text-white bg-[#5B47DB] rounded-full px-4 py-2">Post</span>
      </div>

      {/* Feed post card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Sarah Carter</p>
            <p className="text-xs text-gray-400">2 hours ago</p>
          </div>
          <span className="ml-auto text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">Remote</span>
        </div>
        <p className="text-sm text-gray-700">
          Just shipped v2.0 of our community garden app! Users can now log plant photos and track environmental impact across 12 neighborhoods. Excited for this! 🌱
        </p>
        <div className="h-32 rounded-lg bg-gradient-to-br from-green-100 via-green-200 to-green-300 flex items-center justify-center">
          <span className="text-3xl">🌿</span>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <button className="flex items-center gap-1.5 text-xs text-gray-500">
            <Heart className="w-4 h-4" /> 47
          </button>
          <button className="flex items-center gap-1.5 text-xs text-gray-500">
            <MessageCircle className="w-4 h-4" /> 12
          </button>
          <button className="flex items-center gap-1.5 text-xs text-gray-500">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {/* For You card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#5B47DB]" />
          <p className="text-sm font-semibold text-gray-900">For You</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">Projects matched to your skills & interests</p>
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-900">Volunteer Tracker Platform</p>
            <span className="text-xs text-[#5B47DB] font-medium">7 match pts</span>
          </div>
          <p className="text-xs text-gray-500">Needs: React, Firebase, UX Design</p>
        </div>
      </div>
    </div>
  );
}