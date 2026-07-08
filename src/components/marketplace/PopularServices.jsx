import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const POPULAR_SERVICES = [
  { title: "Logo & Brand Design", category: "Design", img: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop" },
  { title: "Website Development", category: "Development", img: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=300&fit=crop" },
  { title: "Social Media Strategy", category: "Marketing", img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop" },
  { title: "Resume Review", category: "Career Development", img: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop" },
  { title: "Video Editing", category: "Video & Photo", img: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=400&h=300&fit=crop" },
  { title: "Content Writing", category: "Writing & Content", img: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop" },
  { title: "Music Production", category: "Music & Audio", img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop" },
];

export default function PopularServices({ onSelectService }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Popular Services</h2>
        <div className="flex gap-2">
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
        className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1"
      >
        {POPULAR_SERVICES.map((service, i) => (
          <button
            key={i}
            onClick={() => onSelectService?.(service)}
            className="flex-shrink-0 w-[200px] sm:w-[240px] text-left group"
          >
            <div
              className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#0B3D23" }}
            >
              <div className="p-3 pb-2">
                <p className="text-white font-bold text-sm leading-tight mb-0.5">{service.title}</p>
                <p className="text-white/50 text-[10px] font-medium uppercase tracking-wide">{service.category}</p>
              </div>
              <div className="mx-2 mb-2 rounded-lg overflow-hidden" style={{ backgroundColor: "#E0F2E9" }}>
                <img
                  src={service.img}
                  alt={service.title}
                  className="w-full h-[100px] object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}