import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  Users, Rocket, Globe, Lightbulb, MessageCircle, CheckCircle,
  Sparkles, ArrowRight, Heart, LayoutGrid, Compass, Folder,
  User, FileText, CheckSquare, Send, Search, Share2, DollarSign,
  HandHeart, Briefcase, ChevronLeft, ChevronRight, BookOpen,
  MapPin, Building2, Tag, Bookmark, Eye, Settings, FolderOpen,
  Target, MessageSquare, Image
} from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";

// ─── Pill Button ─────────────────────────────────────────────────────────────
const PillButton = ({ children, primary, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`
      inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all
      px-5 py-2
      ${primary
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "bg-transparent border border-gray-400 text-gray-800 hover:border-gray-700"
      }
      ${className}
    `}
  >
    {children}
  </button>
);

// ─── Minimal Nav ──────────────────────────────────────────────────────────────
const Nav = ({ onAuth }) => {
  const [scrolled, setScrolled] = useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/80" : "bg-white/70 backdrop-blur-md"
      }`}
    >
      <div className="max-w-[980px] mx-auto px-4 flex items-center justify-between h-12">
        {/* Logo */}
        <a href="#" className="flex-shrink-0">
          <img src={LOGO_URL} alt="Collab Unity" className="w-6 h-6 rounded object-cover" />
        </a>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] text-gray-700">
          <a href="#features" className="hover:text-black transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-black transition-colors">How It Works</a>
          <a href="#about" className="hover:text-black transition-colors">About</a>
          <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          <Link to={createPageUrl("Contact")} className="hover:text-black transition-colors">Contact</Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-4 text-[13px]">
          <button onClick={onAuth} className="text-gray-700 hover:text-black transition-colors">Log in</button>
          <button
            onClick={onAuth}
            className="bg-blue-600 text-white rounded-full px-4 py-1.5 text-[13px] font-medium hover:bg-blue-700 transition-colors"
          >
            Sign up free
          </button>
        </div>
      </div>
    </header>
  );
};

// ─── Hero Section ─────────────────────────────────────────────────────────────
const HeroSection = ({ onAuth }) => (
  <section className="pt-32 pb-12 text-center bg-[#f5f5f7] px-4">
    <div className="max-w-[700px] mx-auto">
      <p className="text-sm font-semibold text-blue-600 mb-3 tracking-wide uppercase">Collab Unity</p>
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-gray-900 tracking-tight leading-tight mb-5">
        Where Ideas Happen.
      </h1>
      <p className="text-xl text-gray-500 leading-relaxed mb-8 max-w-[560px] mx-auto">
        The platform for creators, builders, and innovators to launch projects, find collaborators, and ship together.
      </p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <PillButton primary onClick={onAuth}>
          Get started free <ArrowRight className="w-4 h-4" />
        </PillButton>
        <PillButton onClick={onAuth}>
          Log in to your account
        </PillButton>
      </div>
    </div>

    {/* Hero Visual */}
    <div className="mt-16 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/60">
        {/* Fake browser chrome */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <div className="mx-auto bg-white rounded-full px-4 py-1 text-xs text-gray-400 border border-gray-200">
            collabunity.io/feed
          </div>
        </div>
        {/* Dashboard preview */}
        <div className="p-6 bg-gradient-to-b from-white to-gray-50 grid grid-cols-3 gap-4 min-h-[260px]">
          {/* Left sidebar */}
          <div className="col-span-1 space-y-3">
            {[
              { label: "Feed", icon: LayoutGrid, active: true },
              { label: "Discover", icon: Compass, active: false },
              { label: "My Projects", icon: Folder, active: false },
              { label: "Chat", icon: MessageCircle, active: false },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`flex items-center gap-2.5 p-2 rounded-lg text-sm font-medium ${item.active ? "bg-purple-50 text-purple-700" : "text-gray-500"}`}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
              );
            })}
          </div>
          {/* Main content */}
          <div className="col-span-2 space-y-3">
            {[
              { title: "AI-Powered Health Tracker", status: "Seeking Collaborators", match: "92%", color: "bg-green-100 text-green-700" },
              { title: "E-Commerce Platform", status: "In Progress", match: "87%", color: "bg-blue-100 text-blue-700" },
              { title: "Educational App for Kids", status: "Seeking Collaborators", match: "79%", color: "bg-purple-100 text-purple-700" },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.color}`}>{p.status}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">{p.match} match</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Stats Banner ─────────────────────────────────────────────────────────────
const StatsBanner = () => (
  <section className="py-12 bg-white border-y border-gray-200">
    <div className="max-w-[980px] mx-auto px-4 grid grid-cols-3 gap-8 text-center">
      {[
        { value: "50+", label: "Projects Created" },
        { value: "30+", label: "Active Collaborators" },
        { value: "5+", label: "Countries" },
      ].map((s) => (
        <div key={s.label}>
          <div className="text-4xl font-semibold text-gray-900 mb-1">{s.value}</div>
          <div className="text-sm text-gray-500">{s.label}</div>
        </div>
      ))}
    </div>
  </section>
);

// ─── Full-Width Feature Card (Apple product panel style) ──────────────────────
const FeaturePanel = ({ bg, eyebrow, title, subtitle, cta, ctaSecondary, onAuth, children, light = false }) => (
  <section className={`py-16 px-4 text-center overflow-hidden ${bg}`}>
    <div className="max-w-[980px] mx-auto">
      <p className={`text-sm font-semibold mb-2 ${light ? "text-blue-500" : "text-blue-400"}`}>{eyebrow}</p>
      <h2 className={`text-4xl sm:text-5xl font-semibold tracking-tight mb-3 leading-tight ${light ? "text-gray-900" : "text-white"}`}>
        {title}
      </h2>
      <p className={`text-xl mb-6 ${light ? "text-gray-500" : "text-white/70"}`}>{subtitle}</p>
      <div className="flex items-center justify-center gap-4 flex-wrap mb-12">
        <button
          onClick={onAuth}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
            light ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-gray-900 hover:bg-gray-100"
          }`}
        >
          {cta}
        </button>
        {ctaSecondary && (
          <button
            onClick={onAuth}
            className={`rounded-full px-5 py-2 text-sm font-medium border transition-colors ${
              light ? "border-blue-600 text-blue-600 hover:bg-blue-50" : "border-white/50 text-white hover:border-white"
            }`}
          >
            {ctaSecondary}
          </button>
        )}
      </div>
      {children}
    </div>
  </section>
);

// ─── Two-Column Card Grid (like Apple's Watch/iPad grid) ──────────────────────
const TwoColGrid = ({ cards }) => (
  <section className="bg-[#f5f5f7] py-4 px-4">
    <div className="max-w-[980px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`rounded-3xl p-8 text-center overflow-hidden relative flex flex-col items-center justify-between min-h-[360px] ${card.bg}`}
          >
            <div>
              <p className={`text-xs font-semibold mb-2 ${card.eyebrowColor || "text-gray-500"}`}>{card.eyebrow}</p>
              <h3 className={`text-3xl font-semibold tracking-tight mb-2 ${card.titleColor || "text-gray-900"}`}>{card.title}</h3>
              <p className={`text-base mb-4 ${card.subtitleColor || "text-gray-500"}`}>{card.subtitle}</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={card.onAuth} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${card.ctaBg || "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  {card.cta}
                </button>
              </div>
            </div>
            <div className="mt-6 w-full flex items-end justify-center">
              <Icon className={`w-20 h-20 ${card.iconColor || "text-gray-300"}`} />
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

// ─── How It Works ─────────────────────────────────────────────────────────────
const HowItWorks = ({ onAuth }) => (
  <section id="how-it-works" className="py-20 px-4 bg-white text-center">
    <div className="max-w-[980px] mx-auto">
      <p className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wide">Process</p>
      <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-4">
        Start collaborating in minutes.
      </h2>
      <p className="text-xl text-gray-500 mb-16 max-w-[500px] mx-auto">Simple, fast, and extremely effective.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            step: "01",
            title: "Create Your Profile",
            desc: "Set up your profile, showcase your skills, and tell the community what you want to build.",
            icon: User,
            color: "bg-purple-50",
            iconColor: "text-purple-500"
          },
          {
            step: "02",
            title: "Find or Start a Project",
            desc: "Browse existing projects looking for collaborators — or create your own and invite others.",
            icon: Lightbulb,
            color: "bg-blue-50",
            iconColor: "text-blue-500"
          },
          {
            step: "03",
            title: "Collaborate & Ship",
            desc: "Use built-in workspace tools to manage tasks, share files, chat, and bring your project to life.",
            icon: Rocket,
            color: "bg-green-50",
            iconColor: "text-green-500"
          }
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="relative">
              <div className={`${s.color} rounded-3xl p-8 flex flex-col items-center text-center`}>
                <span className="text-xs font-mono font-bold text-gray-400 mb-4">{s.step}</span>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                  <Icon className={`w-8 h-8 ${s.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{s.title}</h3>
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

      <div className="mt-12">
        <button
          onClick={onAuth}
          className="bg-blue-600 text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Get started — it's free
        </button>
      </div>
    </div>
  </section>
);

// ─── About / Mission ──────────────────────────────────────────────────────────
const AboutSection = () => (
  <section id="about" className="py-20 px-4 bg-[#f5f5f7]">
    <div className="max-w-[700px] mx-auto text-center">
      <p className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wide">Our Mission</p>
      <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-6 leading-tight">
        Built for builders who think bigger.
      </h2>
      <p className="text-lg text-gray-500 leading-relaxed mb-6">
        Collab Unity is a project-first platform where creators, learners, and innovators unite around shared visions. We give you every tool to plan, build, and ship — without the friction.
      </p>
      <p className="text-lg text-gray-500 leading-relaxed">
        Whether you're building a startup, a side project, a nonprofit, or something you're just passionate about — Collab Unity is the place where your ideas find their team.
      </p>
    </div>

    <div className="max-w-[980px] mx-auto mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <h4 className="font-semibold text-gray-900 mb-1">{v.title}</h4>
            <p className="text-sm text-gray-500">{v.desc}</p>
          </div>
        );
      })}
    </div>
  </section>
);

// ─── Features Showcase ────────────────────────────────────────────────────────
const FeaturesShowcase = ({ onAuth }) => {
  const features = [
    {
      eyebrow: "Feed",
      title: "Share your journey with the world.",
      subtitle: "Post progress updates, showcase live links, and celebrate milestones with a community that cheers you on.",
      bg: "bg-white",
      light: true,
      icon: LayoutGrid,
      items: ["Published project cards", "Media highlights", "Applaud & comments", "Link previews"],
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=500&fit=crop",
    },
    {
      eyebrow: "Discover",
      title: "Find your perfect collaborators.",
      subtitle: "Browse projects seeking help, apply to join, and connect with talented people who share your skills and interests.",
      bg: "bg-[#f5f5f7]",
      light: true,
      icon: Compass,
      items: ["AI-powered recommendations", "Filter by skill & industry", "Direct apply flow", "Collaborator profiles"],
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&fit=crop",
    },
    {
      eyebrow: "Build Workspace",
      title: "Your AI-powered project command center.",
      subtitle: "Tasks, milestones, assets, notes, and an AI assistant — all in one unified workspace built for how modern teams work.",
      bg: "bg-gray-900",
      light: false,
      icon: Sparkles,
      items: ["AI Project Assistant", "Task & milestone board", "Asset management", "Notes & ideation"],
      image: null,
    },
    {
      eyebrow: "Profile",
      title: "Build a portfolio that speaks for itself.",
      subtitle: "Showcase projects, collect peer endorsements, gather collaborator reviews, and generate an AI-powered resume in seconds.",
      bg: "bg-[#f5f5f7]",
      light: true,
      icon: User,
      items: ["Live project portfolio", "Skill endorsements", "Peer reviews", "AI-generated resume PDF"],
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop",
    },
  ];

  return (
    <section id="features" className="bg-white">
      {features.map((f, i) => {
        const Icon = f.icon;
        const isEven = i % 2 === 0;
        return (
          <div key={i} className={`py-20 px-4 border-t border-gray-200 ${f.bg}`}>
            <div className={`max-w-[980px] mx-auto flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12`}>
              {/* Text */}
              <div className="flex-1 text-left">
                <p className={`text-sm font-semibold mb-2 ${f.light ? "text-blue-600" : "text-blue-400"}`}>{f.eyebrow}</p>
                <h2 className={`text-3xl sm:text-4xl font-semibold tracking-tight mb-4 leading-tight ${f.light ? "text-gray-900" : "text-white"}`}>
                  {f.title}
                </h2>
                <p className={`text-lg mb-6 leading-relaxed ${f.light ? "text-gray-500" : "text-gray-400"}`}>{f.subtitle}</p>
                <ul className="space-y-2 mb-8">
                  {f.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${f.light ? "text-blue-600" : "text-blue-400"}`} />
                      <span className={`text-sm font-medium ${f.light ? "text-gray-700" : "text-gray-300"}`}>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onAuth}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                    f.light ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Get started
                </button>
              </div>

              {/* Visual */}
              <div className="flex-1 w-full">
                {f.image ? (
                  <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50">
                    <img src={f.image} alt={f.eyebrow} className="w-full object-cover" style={{ aspectRatio: "16/10" }} />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gray-800 border border-gray-700 p-8 shadow-2xl" style={{ aspectRatio: "16/10" }}>
                    {/* Workspace mockup */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">AI Project Assistant</p>
                        <p className="text-gray-400 text-xs">Ask anything about your project</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-700 rounded-xl p-3 max-w-[80%]">
                        <p className="text-gray-200 text-xs">Break this project into milestones for me.</p>
                      </div>
                      <div className="bg-indigo-600 rounded-xl p-3 ml-auto max-w-[85%]">
                        <p className="text-white text-xs font-medium mb-1">Here are 3 suggested milestones:</p>
                        <p className="text-indigo-200 text-xs">1. Discovery & Design</p>
                        <p className="text-indigo-200 text-xs">2. Development & Integration</p>
                        <p className="text-indigo-200 text-xs">3. Testing & Launch</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {["Save as Milestone", "Create Tasks", "Save as Note"].map(a => (
                          <span key={a} className="bg-gray-700 text-gray-300 rounded-full px-2 py-0.5 text-[10px] border border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors">{a}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      {[
                        { label: "Tasks", count: "3", color: "bg-purple-900 text-purple-300" },
                        { label: "Milestones", count: "3", color: "bg-blue-900 text-blue-300" },
                        { label: "Assets", count: "7", color: "bg-green-900 text-green-300" },
                      ].map(b => (
                        <div key={b.label} className={`${b.color} rounded-lg px-3 py-1.5 text-xs font-medium`}>
                          {b.label} · {b.count}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

// ─── CTA Banner ───────────────────────────────────────────────────────────────
const CTABanner = ({ onAuth }) => (
  <section className="py-24 px-4 bg-gradient-to-b from-[#f5f5f7] to-white text-center">
    <div className="max-w-[620px] mx-auto">
      <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-4 leading-tight">
        Ready to build something great?
      </h2>
      <p className="text-xl text-gray-500 mb-8">
        Join a growing community of creators bringing ambitious ideas to life. Free to start, forever.
      </p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
          onClick={onAuth}
          className="bg-blue-600 text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Start for free <ArrowRight className="inline w-4 h-4 ml-1" />
        </button>
        <button
          onClick={onAuth}
          className="text-blue-600 text-sm font-medium hover:underline"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  </section>
);

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ = () => {
  const faqs = [
    { q: "What is Collab Unity?", a: "A project-based collaboration platform connecting creators, learners, and innovators to build projects together with built-in tools for tasks, chat, assets, and AI assistance." },
    { q: "Is it free?", a: "Yes. Core features are completely free — create projects, join collaborations, use workspace tools, message teammates, and build your profile at no cost." },
    { q: "Who is it for?", a: "Students, developers, designers, entrepreneurs, hobbyists — anyone who wants to build something with others." },
    { q: "How do I find collaborators?", a: "Create a project and list the skills you need. It appears on Discover where others can apply. AI matching also recommends relevant people and projects." },
    { q: "What's in the workspace?", a: "An AI project assistant, milestone tracking, task board, asset management, rich-text ideation editor, tools hub, team discussions, and an activity log." },
    { q: "Can I keep my project private?", a: "Yes. Toggle visibility when creating or editing — private projects won't appear on Feed or Discover." },
  ];

  return (
    <section id="faq" className="py-20 px-4 bg-white border-t border-gray-200">
      <div className="max-w-[700px] mx-auto">
        <h2 className="text-4xl font-semibold text-gray-900 text-center mb-12 tracking-tight">Frequently asked questions</h2>
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
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="bg-[#f5f5f7] border-t border-gray-200 py-10 px-4">
    <div className="max-w-[980px] mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm text-gray-500 mb-8">
        <div>
          <h5 className="font-semibold text-gray-900 mb-3">Platform</h5>
          <ul className="space-y-2">
            <li><a href="#features" className="hover:text-gray-900 transition-colors">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a></li>
            <li><a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold text-gray-900 mb-3">Company</h5>
          <ul className="space-y-2">
            <li><Link to={createPageUrl("AboutUs")} className="hover:text-gray-900 transition-colors">About Us</Link></li>
            <li><Link to={createPageUrl("Contact")} className="hover:text-gray-900 transition-colors">Contact</Link></li>
            <li><Link to={createPageUrl("Testimonials")} className="hover:text-gray-900 transition-colors">Testimonials</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold text-gray-900 mb-3">Support</h5>
          <ul className="space-y-2">
            <li><Link to={createPageUrl("ReportBug")} className="hover:text-gray-900 transition-colors">Report a Bug</Link></li>
            <li><Link to={createPageUrl("FeatureRequest")} className="hover:text-gray-900 transition-colors">Feature Request</Link></li>
            <li><Link to={createPageUrl("SupportCU")} className="hover:text-gray-900 transition-colors">Support Us</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold text-gray-900 mb-3">Legal</h5>
          <ul className="space-y-2">
            <li><Link to={createPageUrl("TermsOfService")} className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
            <li><Link to={createPageUrl("PrivacyPolicy")} className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Collab Unity" className="w-5 h-5 rounded object-cover" />
          <span className="text-xs text-gray-500">Copyright © 2025 Collab Unity. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <Link to={createPageUrl("TermsOfService")} className="hover:text-gray-600 transition-colors">Terms of Use</Link>
        </div>
      </div>
    </div>
  </footer>
);

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Welcome() {
  const handleAuth = () => {
    window.location.href = "https://collabunity.io/login";
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Nav onAuth={handleAuth} />
      <HeroSection onAuth={handleAuth} />
      <StatsBanner />

      {/* Feature panels — Apple full-width stacked sections */}
      <section className="bg-[#f5f5f7] border-t border-gray-200 py-4 px-4">
        <div className="max-w-[980px] mx-auto">
          <FeaturePanel
            bg="bg-white rounded-3xl"
            eyebrow="Collab Unity"
            title="Project collaboration, supercharged."
            subtitle="Create, discover, and build with a team. Powered by AI."
            cta="Start your first project"
            ctaSecondary="Explore the platform"
            onAuth={handleAuth}
            light
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {[
                { icon: Sparkles, label: "AI Assistant", desc: "Chat with your Project Assistant for ideas, tasks, and briefs.", color: "from-purple-500 to-indigo-600" },
                { icon: Users, label: "Team Collaboration", desc: "Invite collaborators, assign roles, and track progress together.", color: "from-blue-500 to-cyan-500" },
                { icon: Rocket, label: "Ship Faster", desc: "Tasks, milestones, and assets — all in one workspace.", color: "from-orange-500 to-pink-500" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-[#f5f5f7] rounded-2xl p-6 text-left">
                    <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.label}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </FeaturePanel>
        </div>
      </section>

      <FeaturesShowcase onAuth={handleAuth} />

      <TwoColGrid
        cards={[
          {
            eyebrow: "Chat",
            title: "Real-time team messaging.",
            subtitle: "1-on-1 and group chats, with project context baked in.",
            bg: "bg-gray-900",
            eyebrowColor: "text-blue-400",
            titleColor: "text-white",
            subtitleColor: "text-gray-400",
            icon: MessageCircle,
            iconColor: "text-blue-400 opacity-30",
            cta: "Start chatting",
            ctaBg: "bg-white text-gray-900 hover:bg-gray-100",
            onAuth: handleAuth,
          },
          {
            eyebrow: "Profile",
            title: "Your professional identity.",
            subtitle: "Portfolio, reviews, endorsements, and an AI-generated resume.",
            bg: "bg-gradient-to-br from-purple-50 to-indigo-100",
            eyebrowColor: "text-purple-600",
            titleColor: "text-gray-900",
            subtitleColor: "text-gray-500",
            icon: User,
            iconColor: "text-purple-300",
            cta: "Build your profile",
            ctaBg: "bg-purple-600 text-white hover:bg-purple-700",
            onAuth: handleAuth,
          },
        ]}
      />

      <HowItWorks onAuth={handleAuth} />
      <AboutSection />
      <CTABanner onAuth={handleAuth} />
      <FAQ />
      <Footer />
    </div>
  );
}