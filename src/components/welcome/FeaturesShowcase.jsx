import React from "react";
import { LayoutGrid, Briefcase, Lightbulb, MessageCircle, User, ArrowRight } from "lucide-react";

const brandColors = {
  feed: { bg: "from-blue-50 to-blue-100", accent: "#3B82F6", soft: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  marketplace: { bg: "from-orange-50 to-orange-100", accent: "#F97316", soft: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  workspace: { bg: "from-purple-50 to-purple-100", accent: "#5B47DB", soft: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  chat: { bg: "from-green-50 to-green-100", accent: "#22C559", soft: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  profile: { bg: "from-yellow-50 to-purple-50", accent: "#A78BFA", soft: "bg-yellow-50", text: "text-purple-600", border: "border-yellow-200" },
};

const FeatureVisual = ({ type, c }) => {
  return (
    <div className={`bg-gradient-to-br ${c.bg} rounded-2xl p-6 border ${c.border}`} style={{ minHeight: 240 }}>
      {type === "feed" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="w-5 h-5" style={{ color: c.accent }} />
            <span className="text-sm font-bold" style={{ color: c.accent }}>Feed</span>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-3 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-full" style={{ background: [c.accent, "#FACC15", "#22C559"][i - 1] }} />
              <div className="flex-1">
                <div className="h-2 rounded-full mb-1.5" style={{ background: c.accent, opacity: 0.3, width: `${80 - i * 10}%` }} />
                <div className="h-1.5 rounded-full" style={{ background: c.accent, opacity: 0.15 }} />
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-[10px]">❤</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {type === "marketplace" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-5 h-5" style={{ color: c.accent }} />
            <span className="text-sm font-bold" style={{ color: c.accent }}>Marketplace</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-2 shadow-sm">
                <div className="h-10 rounded mb-1.5" style={{ background: [c.accent, "#5B47DB", "#22C559", "#FACC15"][i - 1], opacity: 0.2 }} />
                <div className="h-1.5 rounded-full mb-1" style={{ background: c.accent, opacity: 0.3, width: "70%" }} />
                <span className="text-[10px] font-bold" style={{ color: c.accent }}>$ {(i * 50).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {type === "workspace" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5" style={{ color: c.accent }} />
            <span className="text-sm font-bold" style={{ color: c.accent }}>Workspace</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["To Do", "Active", "Done"].map((col, ci) => (
              <div key={ci} className="bg-white/70 rounded-lg p-2">
                <div className="text-[9px] font-bold mb-1.5" style={{ color: c.accent }}>{col}</div>
                {[1, 2].map((t) => (
                  <div key={t} className="bg-white rounded p-1.5 mb-1 shadow-sm">
                    <div className="h-1 rounded-full mb-1" style={{ background: c.accent, opacity: 0.3 }} />
                    <div className="h-1 rounded-full" style={{ background: c.accent, opacity: 0.15, width: "60%" }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {type === "chat" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5" style={{ color: c.accent }} />
            <span className="text-sm font-bold" style={{ color: c.accent }}>Chat</span>
          </div>
          <div className="flex justify-end">
            <div className="bg-white rounded-2xl rounded-br-sm px-3 py-2 shadow-sm max-w-[70%]">
              <div className="h-1.5 rounded-full mb-1" style={{ background: c.accent, opacity: 0.3, width: "80%" }} />
              <div className="h-1.5 rounded-full" style={{ background: c.accent, opacity: 0.15, width: "50%" }} />
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm max-w-[70%]" style={{ background: c.accent, opacity: 0.15 }}>
              <div className="h-1.5 rounded-full mb-1 bg-white" style={{ width: "70%" }} />
              <div className="h-1.5 rounded-full bg-white" style={{ width: "40%" }} />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-white rounded-2xl rounded-br-sm px-3 py-2 shadow-sm max-w-[60%]">
              <div className="h-1.5 rounded-full" style={{ background: c.accent, opacity: 0.3, width: "60%" }} />
            </div>
          </div>
        </div>
      )}
      {type === "profile" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5" style={{ color: c.accent }} />
            <span className="text-sm font-bold" style={{ color: c.accent }}>Profile</span>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-2" style={{ background: c.accent, opacity: 0.2 }} />
            <div className="h-2 rounded-full mx-auto mb-1" style={{ background: c.accent, opacity: 0.3, width: "50%" }} />
            <div className="flex justify-center gap-2 mt-3">
              {["#5B47DB", "#F97316", "#22C559"].map((col) => (
                <div key={col} className="w-8 h-8 rounded-lg" style={{ background: col, opacity: 0.2 }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureRow = ({ eyebrow, title, subtitle, visual, buttonLabel, reverse, onAuth, c }) => (
  <div className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16`}>
    <div className="flex-1 text-left">
      <span className={`inline-block text-xs font-semibold tracking-wider uppercase ${c.text} border ${c.border} ${c.soft} rounded-full px-3 py-1 mb-4`}>
        {eyebrow}
      </span>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3B2A7D] tracking-tight mb-4 leading-tight">
        {title}
      </h2>
      <p className="text-base sm:text-lg text-purple-700/70 mb-6 leading-relaxed max-w-md">{subtitle}</p>
      <button
        onClick={onAuth}
        className={`border-2 ${c.border} ${c.text} ${c.soft} rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity inline-flex items-center gap-2`}
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
        const c = brandColors[f.type];
        return (
          <div key={i} className="py-16 px-4">
            <div className="max-w-[980px] mx-auto">
              <FeatureRow
                eyebrow={f.eyebrow}
                title={f.title}
                subtitle={f.subtitle}
                visual={<FeatureVisual type={f.type} c={c} />}
                buttonLabel={f.buttonLabel}
                reverse={i % 2 === 1}
                onAuth={onAuth}
                c={c}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}