import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroBadge = () => (
  <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm shadow-sm">
    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
    <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">New</span>
    <span className="text-purple-900 font-medium">AI Project Assistant — your workspace, now smarter</span>
    <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
  </div>
);

const HeroVisual = () => (
  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-purple-200/60 max-w-4xl mx-auto">
    <div className="bg-purple-50 border-b border-purple-100 px-4 py-2.5 flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-orange-400" />
      <span className="w-3 h-3 rounded-full bg-yellow-400" />
      <span className="w-3 h-3 rounded-full bg-green-400" />
      <div className="ml-3 flex-1 max-w-xs bg-purple-100 rounded-md px-2 py-1 text-[10px] text-purple-400 font-medium">Collab Unity</div>
    </div>
    <img
      src="https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/933b7c03e_generated_image.png"
      alt="Collab Unity platform dashboard"
      className="w-full"
      style={{ minHeight: 280, objectFit: "cover" }}
    />
  </div>
);

export default function HeroSection({ onAuth }) {
  return (
    <section className="pt-28 pb-16 px-4" style={{ background: "linear-gradient(180deg, #F8F7FF 0%, #EDE9FF 100%)" }}>
      <div className="max-w-[640px] mx-auto text-center">
        <div className="flex justify-center mb-6">
          <HeroBadge />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#3B2A7D] tracking-tight leading-tight mb-5">
          Where Ideas Happen.
        </h1>
        <p className="text-lg sm:text-xl text-purple-700/80 leading-relaxed mb-8 max-w-[540px] mx-auto">
          The platform for creators, builders, and innovators to <span className="font-bold text-[#5B47DB]">launch projects</span>, find collaborators, and ship together.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap mb-12">
          <button
            onClick={onAuth}
            className="bg-[#5B47DB] text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-[#4A37C0] transition-colors shadow-md flex items-center gap-2"
          >
            Get started, it is free <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onAuth}
            className="bg-white border-2 border-purple-300 text-[#5B47DB] rounded-full px-6 py-3 text-sm font-medium hover:bg-purple-50 transition-colors"
          >
            Explore features
          </button>
        </div>
      </div>
      <HeroVisual />
    </section>
  );
}