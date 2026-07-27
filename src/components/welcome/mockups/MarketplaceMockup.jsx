import React from "react";
import { MapPin, Code, Palette, Megaphone } from "lucide-react";

export default function MarketplaceMockup() {
  const gigs = [
    { title: "Build a responsive landing page", price: "$350", name: "James Smith", category: "Web Dev", icon: Code, color: "#5B47DB" },
    { title: "Design a brand logo package", price: "$180", name: "Alex Johnson", category: "Graphics", icon: Palette, color: "#F97316" },
    { title: "Set up social media ads campaign", price: "$520", name: "Emily Davis", category: "Marketing", icon: Megaphone, color: "#22C559" },
  ];
  const categories = [
    { label: "Programming", icon: Code, color: "#5B47DB" },
    { label: "Design", icon: Palette, color: "#F97316" },
    { label: "Marketing", icon: Megaphone, color: "#22C559" },
    { label: "Writing", icon: Code, color: "#3B82F6" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-gray-900">Marketplace</p>
        <span className="text-xs font-medium text-white bg-[#5B47DB] rounded-full px-3 py-1.5">+ Post a Gig</span>
      </div>

      {/* Category icons */}
      <div className="grid grid-cols-4 gap-3">
        {categories.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 p-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${c.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: c.color }} />
              </div>
              <span className="text-[10px] text-gray-600 text-center">{c.label}</span>
            </div>
          );
        })}
      </div>

      {/* Gig cards */}
      <div className="space-y-2">
        {gigs.map((g, i) => {
          const Icon = g.icon;
          return (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${g.color}15` }}>
                <Icon className="w-4 h-4" style={{ color: g.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{g.title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{g.name}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> Remote</span>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900">{g.price}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}