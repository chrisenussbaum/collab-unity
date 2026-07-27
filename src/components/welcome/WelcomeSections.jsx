import React from "react";
import { ArrowRight, Lightbulb, Users, Rocket, BookOpen, Heart, User } from "lucide-react";

export function StatsBanner() {
  return (
    <section className="py-10 bg-white border-y border-gray-200">
      <div className="max-w-[980px] mx-auto px-4 grid grid-cols-3 gap-8 text-center">
        {[
          { value: "50+", label: "Projects Created" },
          { value: "30+", label: "Active Collaborators" },
          { value: "5+", label: "Countries" },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks({ onAuth }) {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-white text-center border-t border-gray-200">
      <div className="max-w-[980px] mx-auto">
        <p className="text-sm font-semibold text-[#5B47DB] mb-2 uppercase tracking-wide">Process</p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
          Start collaborating in minutes.
        </h2>
        <p className="text-lg text-gray-500 mb-14 max-w-[500px] mx-auto">Simple, fast, and extremely effective.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Create Your Profile", desc: "Set up your profile, showcase your skills, and tell the community what you want to build.", icon: User, color: "bg-purple-50", ic: "text-purple-500" },
            { step: "02", title: "Find or Start a Project", desc: "Browse existing projects looking for collaborators or create your own and invite others.", icon: Lightbulb, color: "bg-blue-50", ic: "text-blue-500" },
            { step: "03", title: "Collaborate and Ship", desc: "Use built-in workspace tools to manage tasks, share files, chat, and bring your project to life.", icon: Rocket, color: "bg-green-50", ic: "text-green-500" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="relative">
                <div className={`${s.color} rounded-3xl p-8 flex flex-col items-center text-center`}>
                  <span className="text-xs font-mono font-bold text-gray-400 mb-4">{s.step}</span>
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <Icon className={`w-7 h-7 ${s.ic}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow border border-gray-100 items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-10">
          <button
            onClick={onAuth}
            className="bg-[#5B47DB] text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-[#4A37C0] transition-colors"
          >
            Get started
          </button>
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 bg-[#F7F8FA]">
      <div className="max-w-[700px] mx-auto text-center">
        <p className="text-sm font-semibold text-[#5B47DB] mb-2 uppercase tracking-wide">Our Mission</p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
          Built for builders who think bigger.
        </h2>
        <p className="text-lg text-gray-500 leading-relaxed mb-6">
          Collab Unity is a project-first platform where creators, learners, and innovators unite around shared visions. We give you every tool to plan, build, and ship without the friction.
        </p>
        <p className="text-lg text-gray-500 leading-relaxed">
          Whether you are building a startup, a side project, a nonprofit, or something you are just passionate about, Collab Unity is the place where your ideas find their team.
        </p>
      </div>
      <div className="max-w-[980px] mx-auto mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Lightbulb, title: "Innovation", desc: "Build products that solve real problems with people who care.", color: "text-yellow-500" },
          { icon: Users, title: "Community", desc: "A supportive, inclusive space where everyone can contribute.", color: "text-blue-500" },
          { icon: BookOpen, title: "Learning", desc: "Grow your skills through hands-on project collaboration.", color: "text-green-500" },
          { icon: Heart, title: "Passion", desc: "Work on things you love with people who share your drive.", color: "text-red-500" },
        ].map((v, i) => {
          const Icon = v.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon className={`w-6 h-6 ${v.color}`} />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{v.title}</h4>
              <p className="text-sm text-gray-500">{v.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CTABanner({ onAuth }) {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[#F7F8FA] to-white text-center">
      <div className="max-w-[620px] mx-auto">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4 leading-tight">
          Ready to build something great?
        </h2>
        <p className="text-lg text-gray-500 mb-8">
          Join a growing community of creators bringing ambitious ideas to life. Free to start, forever.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={onAuth}
            className="bg-[#5B47DB] text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-[#4A37C0] transition-colors flex items-center gap-2"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={onAuth} className="text-[#5B47DB] text-sm font-medium hover:underline">
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const faqs = [
    { q: "What is Collab Unity?", a: "A project-based collaboration platform connecting creators, learners, and innovators to build projects together with built-in tools for tasks, chat, assets, and project assistance." },
    { q: "Is it free?", a: "Yes. Core features are completely free. Create projects, join collaborations, use workspace tools, message teammates, and build your profile at no cost." },
    { q: "Who is it for?", a: "Students, developers, designers, entrepreneurs, hobbyists. Anyone who wants to build something with others." },
    { q: "How do I find collaborators?", a: "Create a project and list the skills you need. It appears on Discover where others can apply. AI matching also recommends relevant people and projects." },
    { q: "What is in the workspace?", a: "An AI project assistant, milestone tracking, task board, asset management, rich-text ideation editor, tools hub, team discussions, and an activity log." },
    { q: "Can I keep my project private?", a: "Yes. Toggle visibility when creating or editing. Private projects will not appear on Feed or Discover." },
  ];
  return (
    <section id="faq" className="py-20 px-4 bg-white border-t border-gray-200">
      <div className="max-w-[700px] mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12 tracking-tight">
          Frequently asked questions
        </h2>
        <div className="space-y-1">
          {faqs.map((faq, i) => (
            <details key={i} className="group border-b border-gray-200 py-4">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-base font-medium text-gray-900">{faq.q}</span>
                <span className="ml-4 flex-shrink-0 w-5 h-5 text-gray-400 transition-transform group-open:rotate-45">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}