import React from "react";
import { MapPin, Instagram, Youtube, Linkedin, Globe, Award, TrendingUp } from "lucide-react";

export default function ProfileMockup() {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
      {/* Cover */}
      <div className="h-20 bg-gradient-to-r from-purple-300 via-blue-300 to-purple-400" />

      {/* Header */}
      <div className="px-4 pb-4 -mt-8">
        <div className="flex items-end gap-3 mb-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-4 border-white" />
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-gray-900">Sarah Carter</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#5B47DB] bg-purple-50 rounded-full px-2 py-0.5">
                <Award className="w-3 h-3" /> Verified
              </span>
            </div>
            <p className="text-xs text-gray-500">@sarahcarter</p>
            <p className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5"><MapPin className="w-3 h-3" /> San Francisco, CA</p>
          </div>
          <button className="text-xs border border-gray-300 rounded-full px-3 py-1.5 text-gray-700">Edit Profile</button>
        </div>

        {/* Stats bar */}
        <div className="bg-purple-50 rounded-lg px-3 py-2.5 flex items-center gap-4 mb-3">
          <div>
            <p className="text-base font-bold text-gray-900">3,270</p>
            <p className="text-[10px] text-gray-500">Points</p>
          </div>
          <div className="h-8 w-px bg-gray-300" />
          <div className="flex gap-1.5">
            {["#22C559", "#3B82F6", "#5B47DB", "#F97316"].map((c, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center" style={{ background: `${c}20` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: c }} />
              </div>
            ))}
          </div>
          <button className="ml-auto text-xs font-medium text-[#5B47DB] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Leaderboard
          </button>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-900 mb-1">Biography</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">Building tools that help communities track environmental impact and support local sustainability initiatives.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 mb-1.5">Social Media</p>
            <div className="flex gap-2">
              <Instagram className="w-4 h-4 text-gray-500" />
              <Youtube className="w-4 h-4 text-gray-500" />
              <Linkedin className="w-4 h-4 text-gray-500" />
              <Globe className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}