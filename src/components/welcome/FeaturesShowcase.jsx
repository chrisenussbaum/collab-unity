import React from "react";
import { ArrowRight } from "lucide-react";

const SCREENSHOTS = {
  feed: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/a4a7e6a0a_Screenshot2026-07-27at123605AM.png",
  marketplace: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/4ccd546c1_Screenshot2026-07-27at120225AM.png",
  myprojects: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/5d25a0cef_Screenshot2026-07-27at120305AM.png",
  workspace: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/35f95fee3_Screenshot2026-07-27at120525AM.png",
  chat: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/4b99d2b2a_Screenshot2026-07-27at123837AM.png",
  profile: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/76a7cdd71_Screenshot2026-07-27at121454AM.png",
  create: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/5ebb1d256_Screenshot2026-07-27at120554AM.png",
  resume: "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/673fa341a_Screenshot2026-07-27at124055AM.png",
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
    { type: "myprojects", eyebrow: "My Projects", title: "All your projects in one place.", subtitle: "Track progress, manage milestones, and switch between personal and collaborative projects from a single dashboard.", buttonLabel: "Explore Projects" },
    { type: "workspace", eyebrow: "Build Workspace", title: "Your collaborative project workspace.", subtitle: "An AI project assistant, tasks, milestones, assets, and activity logs all unified in one workspace built for shipping.", buttonLabel: "Explore Workspace" },
    { type: "chat", eyebrow: "Chat", title: "Message your team in real-time.", subtitle: "Stay connected with 1-on-1 and group chats, with your project context always accessible right alongside your work.", buttonLabel: "Explore Chat" },
    { type: "profile", eyebrow: "Profile", title: "Build a portfolio that speaks for itself.", subtitle: "Showcase projects, collect peer endorsements, gather reviews, and generate an AI-powered resume in seconds.", buttonLabel: "Explore Profiles" },
    { type: "create", eyebrow: "Create Project", title: "Start building in seconds.", subtitle: "Describe your idea in plain text and let AI help you bring it to life with a structured project plan, milestones, and tasks.", buttonLabel: "Explore Create" },
    { type: "resume", eyebrow: "Generate Resume", title: "Generate a professional resume instantly.", subtitle: "Turn your profile, projects, and contributions into a polished resume in one click. Upload your existing resume to enhance it with AI.", buttonLabel: "Explore Resume" },
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