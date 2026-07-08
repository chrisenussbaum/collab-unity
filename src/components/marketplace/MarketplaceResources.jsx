import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Clock } from "lucide-react";

const RESOURCES = [
  {
    title: "How to Write a Gig Title That Converts",
    readTime: "5 MIN READ",
    img: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop",
    description: "Learn the formula for crafting gig titles that attract the right applicants.",
  },
  {
    title: "Setting the Right Price for Your Services",
    readTime: "4 MIN READ",
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    description: "Pricing strategies to stay competitive while valuing your work.",
  },
  {
    title: "Building a Portfolio That Stands Out",
    readTime: "6 MIN READ",
    img: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=400&h=300&fit=crop",
    description: "Showcase your best work with media galleries and brand images.",
  },
  {
    title: "10 Skills That Employers Are Searching For",
    readTime: "3 MIN READ",
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop",
    description: "Discover the most in-demand skills across categories right now.",
  },
  {
    title: "How to Write a Winning Application",
    readTime: "5 MIN READ",
    img: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
    description: "Tips for crafting applications that get noticed by gig posters.",
  },
  {
    title: "Trust & Safety: Protecting Your Work",
    readTime: "4 MIN READ",
    img: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop",
    description: "Best practices for safe collaboration and payment protection.",
  },
];

export default function MarketplaceResources() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Resources</h2>
          <p className="text-sm text-gray-500 mt-0.5">Insights, tips, and tools to help you create impactful gigs and services.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1"
      >
        {RESOURCES.map((resource, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[280px] sm:w-[320px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={resource.img}
                alt={resource.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1 h-1 rounded-full bg-gray-400" />
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {resource.readTime}
                </span>
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1 leading-tight">{resource.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{resource.description}</p>
              <div className="flex items-center gap-1 text-xs font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Read article</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}