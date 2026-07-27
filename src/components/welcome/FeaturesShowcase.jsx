import React from "react";

const FeatureCard = ({ children, label }) => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/60">
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
      <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
      <span className="ml-2 text-[10px] text-gray-400">{label}</span>
    </div>
    <div className="p-4 bg-gradient-to-b from-gray-50/50 to-white" style={{ minHeight: 200 }}>
      {children}
    </div>
  </div>
);

const FeatureRow = ({ eyebrow, title, subtitle, visual, buttonLabel, reverse }) => (
  <div className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16`}>
    <div className="flex-1 text-left">
      <span className="inline-block text-xs font-semibold tracking-wider uppercase text-gray-500 border border-gray-300 rounded-full px-3 py-1 mb-4">
        {eyebrow}
      </span>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-4 leading-tight">
        {title}
      </h2>
      <p className="text-base sm:text-lg text-gray-500 mb-6 leading-relaxed max-w-md">{subtitle}</p>
      <a
        href="#features"
        className="border border-gray-900 text-gray-900 rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors inline-block"
      >
        {buttonLabel}
      </a>
    </div>
    <div className="flex-1 w-full">{visual}</div>
  </div>
);

export default function FeaturesShowcase() {
  const features = [
    {
      eyebrow: "Feed",
      title: "Share your journey with the world.",
      subtitle: "Post progress updates, showcase live links, and celebrate milestones with a community that cheers you on.",
      img: "https://images.unsplash.com/photo-1551432870-28521ac3a3ed?w=600&h=400&fit=crop",
      buttonLabel: "Explore Feed",
    },
    {
      eyebrow: "Marketplace",
      title: "Find gigs, services, and talent.",
      subtitle: "Browse paid gigs and professional services, post opportunities, and connect with talented people ready to collaborate.",
      img: "https://images.unsplash.com/photo-1556761175-129467801c3d?w=600&h=400&fit=crop",
      buttonLabel: "Explore Marketplace",
    },
    {
      eyebrow: "Build Workspace",
      title: "Your collaborative project workspace.",
      subtitle: "Tasks, milestones, assets, and an AI project assistant all in one unified workspace built for shipping.",
      img: "https://images.unsplash.com/photo-1531404394758-060a36d38005?w=600&h=400&fit=crop",
      buttonLabel: "Explore Workspace",
    },
    {
      eyebrow: "Chat",
      title: "Message your team in real-time.",
      subtitle: "Stay connected with 1-on-1 and group chats, with your project context always accessible right alongside your work.",
      img: "https://images.unsplash.com/photo-1577536757782-cb3b8c2c2b0e?w=600&h=400&fit=crop",
      buttonLabel: "Explore Chat",
    },
    {
      eyebrow: "Profile",
      title: "Build a portfolio that speaks for itself.",
      subtitle: "Showcase projects, collect peer endorsements, gather reviews, and generate an AI-powered resume in seconds.",
      img: "https://images.unsplash.com/photo-1603473424058-596eb3b335f5?w=600&h=400&fit=crop",
      buttonLabel: "Explore Profiles",
    },
  ];

  return (
    <section id="features" className="bg-[#F7F8FA]">
      {features.map((f, i) => {
        const visual = (
          <FeatureCard label={`collabunity.io/${f.eyebrow.toLowerCase()}`}>
            <img
              src={f.img}
              alt={f.title}
              className="w-full rounded-lg"
              style={{ minHeight: 180, objectFit: "cover" }}
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
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}