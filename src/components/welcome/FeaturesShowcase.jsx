import React from "react";
import { ArrowRight } from "lucide-react";

const SCREENSHOTS = {
  feed: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/95736e6bf_Screenshot2026-07-26at115024PM.png",
  marketplace: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/dfdc69e59_Screenshot2026-07-26at115034PM.png",
  workspace: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/985564772_Screenshot2026-07-26at115045PM.png",
  chat: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/985564772_Screenshot2026-07-26at115045PM.png",
  profile: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/a74be81f4_Screenshot2026-07-26at115053PM.png",
};

const FeatureCard = ({ children }) => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/60">
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
      <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
    </div>
    <div className="p-4 bg-white">
      {children}
    </div>
  </div>
);

const FeatureRow = ({ eyebrow, title, subtitle, visual, buttonLabel, reverse, onAuth }) => (
  <div className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16`}>
    <div className="flex-1 text-left">
      <span className="inline-block text-xs font-semibold tracking-wider uppercase text-gray-500 border border-gray-300 rounded-full px-3 py-1 mb-4">
        {eyebrow}
      </span>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-4 leading-tight">
        {title}
      </h2>
      <p className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed max-w-md">{subtitle}</p>
      <button
        onClick={onAuth}
        className="bg-white border border-gray-900 text-gray-900 rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors inline-flex items-center gap-2"
      >
        {buttonLabel} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
    <div className="flex-1 w-full">{visual}</div>
  </div>
);

export default function FeaturesShowcase({ onAuth }) {
  const features = [
    { type: "feed", eyebrow: "Feed", title: "Share your journey with the world.", subtitle: "Post progress updates, showcase live links, and celebrate milestones with a community that cheers you on.", buttonLabel: "Explore Feed" },
    { type: "marketplace", eyebrow: "Marketplace", title: "Find gigs, services, and talent.", subtitle: "Browse paid gigs and professional services, post opportunities, and connect with talented people ready to collaborate.", buttonLabel: "Explore Marketplace" },
    { type: "workspace", eyebrow: "Build Workspace", title: "Your collaborative project workspace.", subtitle: "Tasks, milestones, assets, and an AI project assistant all in one unified workspace built for shipping.", buttonLabel: "Explore Workspace" },
    { type: "chat", eyebrow: "Chat", title: "Message your team in real-time.", subtitle: "Stay connected with 1-on-1 and group chats, with your project context always accessible right alongside your work.", buttonLabel: "Explore Chat" },
    { type: "profile", eyebrow: "Profile", title: "Build a portfolio that speaks for itself.", subtitle: "Showcase projects, collect peer endorsements, gather reviews, and generate an AI-powered resume in seconds.", buttonLabel: "Explore Profiles" },
  ];

  return (
    <section id="features" className="bg-[#F8F7FF]">
      {features.map((f, i) => {
        const visual = (
          <FeatureCard>
            <img
              src={SCREENSHOTS[f.type]}
              alt={f.title}
              className="w-full rounded-lg"
              style={{ minHeight: 200, objectFit: "cover" }}
            />
          </FeatureCard>
        );
        return (
          <div key={i} className="py-16 px-4">
            <div className="max-w-[980px] mx-auto">
              <FeatureRow
                eyebrow={f.eyebrow}
                title={f.title}
                subtitle={f.subtitle}
                visual={visual}
                buttonLabel={f.buttonLabel}
                reverse={i % 2 === 1}
                onAuth={onAuth}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}