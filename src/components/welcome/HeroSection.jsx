import React from "react";
import { ArrowRight } from "lucide-react";

const HeroBadge = () => (
  <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm">
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">New</span>
    <span className="text-gray-800 font-medium">AI Project Assistant — your workspace, now smarter</span>
    <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
  </div>
);

const HeroVisual = () => (
  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/60 max-w-4xl mx-auto">
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-red-400" />
      <span className="w-3 h-3 rounded-full bg-yellow-400" />
      <span className="w-3 h-3 rounded-full bg-green-400" />
      <div className="ml-3 flex-1 max-w-xs bg-gray-100 rounded-md px-2 py-1 text-[10px] text-gray-400">collabunity.io/feed</div>
    </div>
    <img
      src="https://images.unsplash.com/photo-1551432870-28521ac3a3ed?w=1200&h=600&fit=crop"
      alt="Collab Unity Feed"
      className="w-full"
      style={{ minHeight: 280, objectFit: "cover" }}
    />
  </div>
);

export default function HeroSection({ onAuth }) {
  return (
    <section className="pt-28 pb-16 px-4" style={{ background: "linear-gradient(180deg, #f8f7ff 0%, #f3f0ff 100%)" }}>
      <div className="max-w-[640px] mx-auto text-center">
        <div className="flex justify-center mb-6">
          <HeroBadge />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-5">
          Where Ideas Happen.
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-8 max-w-[540px] mx-auto">
          The platform for creators, builders, and innovators to <span className="font-semibold text-gray-700">launch projects</span>, find collaborators, and ship together.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap mb-12">
          <button
            onClick={onAuth}
            className="bg-[#5B47DB] text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-[#4A37C0] transition-colors shadow-sm flex items-center gap-2"
          >
            Get started, it is free <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#features"
            className="bg-white border border-gray-400 text-gray-800 rounded-full px-6 py-3 text-sm font-medium hover:border-gray-700 transition-colors"
          >
            Explore features
          </a>
        </div>
      </div>
      <HeroVisual />
    </section>
  );
}