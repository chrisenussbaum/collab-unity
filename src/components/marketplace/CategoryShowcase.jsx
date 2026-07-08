import React from "react";
import {
  Code2, Palette, Megaphone, FileText, Video, Sparkles, Music, Building2, MessageSquare,
  ChevronRight
} from "lucide-react";

const CATEGORY_DATA = [
  { label: "Programming & Tech", value: "Development", icon: Code2, color: "text-blue-600 bg-blue-50" },
  { label: "Graphics & Design", value: "Design", icon: Palette, color: "text-pink-600 bg-pink-50" },
  { label: "Digital Marketing", value: "Marketing", icon: Megaphone, color: "text-orange-600 bg-orange-50" },
  { label: "Writing & Translation", value: "Writing & Content", icon: FileText, color: "text-teal-600 bg-teal-50" },
  { label: "Video & Animation", value: "Video & Photo", icon: Video, color: "text-purple-600 bg-purple-50" },
  { label: "AI Services", value: "Career Development", icon: Sparkles, color: "text-indigo-600 bg-indigo-50" },
  { label: "Music & Audio", value: "Music & Audio", icon: Music, color: "text-green-600 bg-green-50" },
  { label: "Business", value: "Business", icon: Building2, color: "text-amber-600 bg-amber-50" },
  { label: "Consulting", value: "Coaching & Mentoring", icon: MessageSquare, color: "text-cyan-600 bg-cyan-50" },
];

export default function CategoryShowcase({ selectedCategory, onSelectCategory }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Browse by Category</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {CATEGORY_DATA.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onSelectCategory(isActive ? "all" : cat.value)}
              className={`flex-shrink-0 w-[120px] sm:w-[140px] flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                isActive
                  ? "border-purple-400 bg-purple-50 shadow-md ring-1 ring-purple-200"
                  : "border-gray-200 bg-white hover:border-purple-200 hover:shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold text-center leading-tight ${isActive ? "text-purple-700" : "text-gray-700"}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}