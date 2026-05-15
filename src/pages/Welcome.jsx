import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { PublicNav, PublicFooter } from "@/components/public/PublicLayout";
import {
  Users, Rocket, Globe, Lightbulb, MessageCircle, CheckCircle,
  Sparkles, ArrowRight, Heart, LayoutGrid, Compass, Folder,
  User, FileText, CheckSquare, Send, Search, Share2, DollarSign,
  HandHeart, Briefcase, ChevronLeft, ChevronRight, BookOpen,
  MapPin, Building2, Tag, Bookmark, Eye, Settings, FolderOpen,
  Target, MessageSquare, Badge as BadgeIcon, GraduationCap, Newspaper, Play, Clock, Star, TrendingUp
} from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";
const CU_PURPLE = "#5B47DB";
const CU_PURPLE_DARK = "#4A37C0";

// ─── Pill Button ─────────────────────────────────────────────────────────────
const PillButton = ({ children, primary, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all px-5 py-2 ${
      primary
        ? "bg-[#5B47DB] text-white hover:bg-[#4A37C0]"
        : "bg-transparent border border-gray-400 text-gray-800 hover:border-gray-700"
    } ${className}`}
  >
    {children}
  </button>
);



// ─── Interactive Mockups (from old version, Apple-styled) ─────────────────────

const FeedMockup = () => {
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const showcaseItems = [
    { title: "Story World Map", domain: "miro.com", img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop" },
    { title: "Chapter Draft", domain: "notion.so", img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop" },
  ];
  const cur = showcaseItems[showcaseIndex];
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=100&h=100&fit=crop" alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 text-sm">The Forgotten Library</h3>
              <p className="text-xs text-gray-400">Jordan Blake · 2 weeks ago</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button className="p-1 hover:bg-gray-100 rounded-lg"><Share2 className="w-3.5 h-3.5 text-gray-400" /></button>
            <button className="p-1 hover:bg-gray-100 rounded-lg"><Bookmark className="w-3.5 h-3.5 text-gray-400" /></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="bg-orange-100 text-orange-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Seeking Collaborators</span>
          <span className="bg-purple-100 text-purple-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Collaborative</span>
          <span className="bg-green-100 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Educational</span>
        </div>
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">Writing a fantasy novel about a hidden library containing books that can alter reality. Looking for co-authors, editors, and illustrators...</p>
        {/* Showcase */}
        <div className="rounded-lg border border-gray-200 overflow-hidden mb-3">
          <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5 border-b border-gray-200">
            <button onClick={e => { e.stopPropagation(); setShowcaseIndex((showcaseIndex - 1 + showcaseItems.length) % showcaseItems.length); }} className="p-0.5 hover:bg-gray-100 rounded"><ChevronLeft className="w-3 h-3 text-gray-500" /></button>
            <div className="flex items-center gap-1 text-[10px] text-gray-500"><Globe className="w-3 h-3" /> Showcase <span className="bg-gray-200 px-1 rounded">{showcaseItems.length}</span></div>
            <button onClick={e => { e.stopPropagation(); setShowcaseIndex((showcaseIndex + 1) % showcaseItems.length); }} className="p-0.5 hover:bg-gray-100 rounded"><ChevronRight className="w-3 h-3 text-gray-500" /></button>
          </div>
          <img src={cur.img} alt={cur.title} className="w-full h-28 object-cover" />
          <div className="px-2 py-1.5 bg-white"><p className="text-xs font-semibold text-gray-900">{cur.title}</p><p className="text-[10px] text-gray-400">{cur.domain}</p></div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-2">
          <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />Remote</span>
          <span className="flex items-center gap-0.5"><Building2 className="w-3 h-3" />Creative Writing</span>
          <span className="flex items-center gap-0.5"><Tag className="w-3 h-3" />Fantasy</span>
        </div>
        <div className="flex gap-1 flex-wrap pb-2 border-b border-gray-100">
          {["Creative Writing", "Storytelling", "Editing"].map(s => <span key={s} className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] px-2 py-0.5 rounded-full">{s}</span>)}
          <span className="border border-purple-100 text-purple-500 text-[10px] px-2 py-0.5 rounded-full">+2 more</span>
        </div>
        <div className="flex items-center justify-around pt-2">
          {[{ icon: HandHeart, label: "Applaud" }, { icon: MessageSquare, label: "Comment" }, { icon: DollarSign, label: "Fund" }].map(a => {
            const Icon = a.icon;
            return <button key={a.label} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#5B47DB] transition-colors"><Icon className="w-4 h-4" />{a.label}</button>;
          })}
        </div>
      </div>
    </div>
  );
};

const DiscoverMockup = () => (
  <div className="space-y-3">
    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <h4 className="font-semibold text-purple-900 text-sm">Recommended for You</h4>
      </div>
      <p className="text-xs text-purple-600 mb-3">Projects that match your skills and interests</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: "Social Media Dashboard", match: "85%", img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=80&h=80&fit=crop" },
          { name: "E-commerce Platform", match: "78%", img: "https://images.unsplash.com/photo-1661956602116-aa6865609028?w=80&h=80&fit=crop" },
        ].map((p, i) => (
          <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <img src={p.img} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
              <div><p className="text-xs font-semibold text-gray-900 leading-tight">{p.name}</p><span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium">{p.match} Match</span></div>
            </div>
            <button className="w-full text-[10px] py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"><Briefcase className="w-3 h-3" />Apply</button>
          </div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[
        { name: "Mobile Fitness App", type: "Seeking Collaborators", img: "https://images.unsplash.com/photo-1461773518188-b3e86f98242f?w=80&h=80&fit=crop", members: 2, skills: ["Flutter", "Firebase"] },
        { name: "Podcast Platform", type: "In Progress", img: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=80&h=80&fit=crop", members: 7, skills: ["Adobe", "YouTube"] },
      ].map((p, i) => (
        <div key={i} className="bg-white rounded-xl border-t-2 border-[#5B47DB] p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <img src={p.img} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            <div><p className="text-xs font-bold text-gray-900 leading-tight">{p.name}</p><span className="text-[10px] text-blue-600 border border-blue-200 px-1 py-0.5 rounded-full">{p.type}</span></div>
          </div>
          <div className="flex gap-1 mt-1.5 mb-2">{p.skills.map(s => <span key={s} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded">{s}</span>)}</div>
          <button className="w-full text-[10px] py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"><Briefcase className="w-3 h-3" />Apply</button>
        </div>
      ))}
    </div>
  </div>
);

const ChatMockup = () => {
  const [active, setActive] = useState(0);
  const chats = [
    { name: "Alex Johnson", msg: "Sounds good!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces", online: true, messages: [{ from: "them", text: "Hey! How's the project coming along?", time: "10:30 AM" }, { from: "me", text: "Great! Just finished the design mockups", time: "10:32 AM" }, { from: "them", text: "Awesome! Can't wait to see them 👀", time: "10:33 AM" }] },
    { name: "Sarah Lee", msg: "Let's schedule a call", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces", online: false, messages: [{ from: "them", text: "Let's schedule a planning session", time: "9:15 AM" }, { from: "me", text: "How about tomorrow at 2pm?", time: "9:20 AM" }] },
    { name: "Team Project", msg: "New task assigned", avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=80&h=80&fit=crop", online: true, messages: [{ from: "them", text: "New task: Review documentation", time: "Yesterday" }, { from: "me", text: "I'll take a look this afternoon", time: "Yesterday" }] },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200" style={{ height: 340 }}>
      <div className="grid grid-cols-5 h-full">
        <div className="col-span-2 border-r border-gray-100 bg-gray-50 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <p className="font-bold text-gray-900 text-sm mb-2">Messages</p>
            <div className="relative"><Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" /><input className="w-full pl-6 pr-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg" placeholder="Search..." readOnly /></div>
          </div>
          <div className="flex-1 overflow-auto p-1.5 space-y-0.5">
            {chats.map((c, i) => (
              <button key={i} onClick={() => setActive(i)} className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition-colors ${active === i ? "bg-purple-100" : "hover:bg-gray-100"}`}>
                <div className="relative flex-shrink-0">
                  <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                  {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white" />}
                </div>
                <div className="min-w-0"><p className="text-xs font-semibold text-gray-900 truncate">{c.name}</p><p className="text-[10px] text-gray-500 truncate">{c.msg}</p></div>
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-3 flex flex-col">
          <div className="p-3 border-b border-gray-200 flex items-center gap-2">
            <div className="relative"><img src={chats[active].avatar} alt="" className="w-7 h-7 rounded-full object-cover" />{chats[active].online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white" />}</div>
            <div><p className="text-xs font-semibold text-gray-900">{chats[active].name}</p><p className="text-[10px] text-green-500">{chats[active].online ? "● Online" : "Offline"}</p></div>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-auto bg-gray-50">
            {chats[active].messages.map((m, j) => (
              <div key={j} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-2xl px-3 py-1.5 max-w-[85%] ${m.from === "me" ? "bg-[#5B47DB] text-white rounded-tr-none" : "bg-white border border-gray-200 rounded-tl-none"}`}>
                  <p className="text-xs">{m.text}</p>
                  <p className={`text-[10px] mt-0.5 ${m.from === "me" ? "text-purple-200" : "text-gray-400"}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-1.5">
              <input className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full" placeholder="Type a message..." readOnly />
              <button className="w-7 h-7 bg-[#5B47DB] rounded-full flex items-center justify-center flex-shrink-0"><Send className="w-3 h-3 text-white" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkspaceMockup = () => {
  const [section, setSection] = useState("milestones");
  const sidebar = [
    { id: "chat", icon: Sparkles, label: "Assistant" },
    { id: "tasks", icon: CheckSquare, label: "Tasks" },
    { id: "milestones", icon: CheckCircle, label: "Milestones" },
    { id: "assets", icon: FolderOpen, label: "Assets" },
    { id: "notes", icon: BookOpen, label: "Notes" },
    { id: "tools", icon: Settings, label: "Tools" },
  ];
  const content = {
    chat: (
      <div className="p-3 space-y-2 flex-1">
        <div className="flex gap-2"><div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0"><Sparkles className="w-2.5 h-2.5 text-white" /></div><div className="bg-white border border-gray-200 rounded-xl rounded-tl-none px-2.5 py-1.5 text-xs text-gray-700 max-w-[85%]">Hey! I'm your <strong>Project Assistant</strong> for <em>Collab Unity Website</em>. What do you want to work on?</div></div>
        <div className="flex gap-2 flex-row-reverse"><div className="w-5 h-5 rounded-full bg-[#5B47DB] flex items-center justify-center flex-shrink-0"><User className="w-2.5 h-2.5 text-white" /></div><div className="bg-[#5B47DB] text-white rounded-xl rounded-tr-none px-2.5 py-1.5 text-xs max-w-[75%]">Break this into milestones</div></div>
        <div className="flex gap-2"><div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0"><Sparkles className="w-2.5 h-2.5 text-white" /></div><div className="bg-white border border-gray-200 rounded-xl rounded-tl-none px-2.5 py-1.5 text-xs text-gray-700 max-w-[85%]"><p className="font-medium mb-1">Here are 3 milestones:</p><p>1. Discovery & Design</p><p>2. Development</p><p>3. Launch</p><div className="flex gap-1 mt-1.5 flex-wrap">{["Save as Milestone", "Create Tasks"].map(a => <span key={a} className="bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-1.5 py-0.5 text-[10px] cursor-pointer">{a}</span>)}</div></div></div>
      </div>
    ),
    tasks: (
      <div className="p-3 space-y-1.5 flex-1">
        <p className="text-xs font-semibold text-gray-700 mb-2">Tasks</p>
        {[{ label: "Design landing page", priority: "Urgent", done: false, color: "bg-red-100 text-red-700" }, { label: "Review pull requests", priority: "Medium", done: false, color: "bg-yellow-100 text-yellow-700" }, { label: "Setup repository", done: true }].map((t, i) => (
          <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg ${t.done ? "bg-green-50 opacity-70" : "bg-gray-50"}`}>
            <input type="checkbox" readOnly checked={t.done} className="w-3 h-3" />
            <p className={`text-xs flex-1 ${t.done ? "line-through text-gray-400" : "text-gray-800"}`}>{t.label}</p>
            {t.priority && <span className={`text-[10px] px-1 py-0.5 rounded ${t.color}`}>{t.priority}</span>}
          </div>
        ))}
      </div>
    ),
    milestones: (
      <div className="p-3 space-y-1.5 flex-1">
        <p className="text-xs font-semibold text-gray-700 mb-2">Milestones</p>
        {[{ label: "Discovery & Design", status: "Done", color: "bg-green-100 text-green-700", ic: CheckCircle, icCol: "text-green-500" }, { label: "Development", status: "Active", color: "bg-purple-100 text-purple-700", ic: Rocket, icCol: "text-purple-500" }, { label: "Launch", status: "Todo", color: "bg-gray-100 text-gray-500", ic: Target, icCol: "text-gray-400" }].map((m, i) => {
          const IC = m.ic;
          return <div key={i} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-100"><IC className={`w-3.5 h-3.5 flex-shrink-0 ${m.icCol}`} /><p className="flex-1 text-xs font-medium text-gray-800">{m.label}</p><span className={`text-[10px] px-1.5 py-0.5 rounded ${m.color}`}>{m.status}</span></div>;
        })}
      </div>
    ),
    assets: (
      <div className="p-3 space-y-1.5 flex-1">
        <p className="text-xs font-semibold text-gray-700 mb-2">Assets</p>
        {[{ name: "design-mockups.fig", color: "text-blue-500" }, { name: "project-brief.pdf", color: "text-green-500" }, { name: "brand-guidelines.pdf", color: "text-purple-500" }].map((a, i) => (
          <div key={i} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"><FileText className={`w-3.5 h-3.5 flex-shrink-0 ${a.color}`} /><p className="text-xs font-medium text-gray-800 truncate">{a.name}</p></div>
        ))}
      </div>
    ),
    notes: (
      <div className="p-3 space-y-2 flex-1">
        <p className="text-xs font-semibold text-gray-700 mb-2">Thoughts & Notes</p>
        {[{ title: "Design System", content: "Stick to purple brand palette for consistency" }, { title: "Launch Checklist", content: "QA review, stakeholder sign-off, DNS update" }].map((n, i) => (
          <div key={i} className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg"><p className="text-xs font-semibold text-gray-800">{n.title}</p><p className="text-[10px] text-gray-500 mt-0.5">{n.content}</p></div>
        ))}
      </div>
    ),
    tools: (
      <div className="p-3 space-y-1.5 flex-1">
        <p className="text-xs font-semibold text-gray-700 mb-2">Project Tools</p>
        {[{ name: "GitHub", icon: "🐙", url: "github.com/project" }, { name: "Figma", icon: "🎨", url: "figma.com/design" }].map((t, i) => (
          <div key={i} className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-100 rounded-lg hover:border-purple-200 cursor-pointer"><span className="text-base">{t.icon}</span><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900">{t.name}</p><p className="text-[10px] text-gray-400 truncate">{t.url}</p></div><ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" /></div>
        ))}
      </div>
    ),
  };
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#5B47DB] to-indigo-600 text-white">
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><Sparkles className="w-3 h-3 text-white" /></div><div><p className="text-[11px] font-semibold">Project Assistant</p><p className="text-[10px] text-white/70">Collab Unity Website</p></div></div>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">3 tasks · 3 milestones</span>
      </div>
      <div className="flex" style={{ height: 260 }}>
        <div className="flex flex-col items-center gap-1 py-2 px-1 bg-gray-50 border-r border-gray-200 w-10 flex-shrink-0">
          {sidebar.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            return <button key={item.id} onClick={e => { e.stopPropagation(); setSection(item.id); }} title={item.label} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${active ? "bg-[#5B47DB] text-white" : "text-gray-400 hover:bg-purple-50 hover:text-[#5B47DB]"}`}><Icon className="w-3.5 h-3.5" /></button>;
          })}
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col bg-gray-50/40">
          {content[section]}
        </div>
      </div>
    </div>
  );
};

const ProfileMockup = () => (
  <div className="space-y-3">
    <div className="bg-gradient-to-r from-[#5B47DB] to-pink-500 rounded-2xl p-4 text-white">
      <div className="flex items-start gap-3">
        <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces" alt="Sarah Kristine" className="w-14 h-14 rounded-full object-cover border-2 border-white/30 flex-shrink-0" />
        <div>
          <h3 className="text-base font-bold mb-0.5">Brenda Song</h3>
          <p className="text-purple-200 text-xs mb-1">@brendasong</p>
          <div className="flex items-center gap-3 text-xs text-purple-100">
            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />Spokane, WA</span>
            <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />Remote</span>
          </div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
        <h4 className="font-semibold text-gray-900 text-xs mb-2 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5 text-[#5B47DB]" />Projects (3)</h4>
        <div className="space-y-2">
          {[{ name: "E-commerce Platform", img: "https://images.unsplash.com/photo-1661956602116-aa6865609028?w=80&h=80&fit=crop" }, { name: "Social Dashboard", img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=80&h=80&fit=crop" }].map((p, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg">
              <img src={p.img} alt={p.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
              <div><p className="text-[10px] font-medium text-gray-900 truncate">{p.name}</p><span className="text-[10px] bg-green-100 text-green-700 rounded px-1">Completed</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
        <h4 className="font-semibold text-gray-900 text-xs mb-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-[#5B47DB]" />Skills</h4>
        <div className="flex flex-wrap gap-1">
          {["R", "Chemistry", "Biology", "Science", "Data Viz"].map(s => <span key={s} className="bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full border border-purple-100">{s}</span>)}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-gray-800">B.S. Biology</p>
          <p className="text-[10px] text-gray-400">Oregon State University · 2020</p>
        </div>
      </div>
    </div>
  </div>
);

const LearningHubMockup = () => (
  <div className="space-y-3">
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="w-4 h-4 text-[#5B47DB]" />
        <h4 className="font-semibold text-gray-900 text-sm">Learning Hub</h4>
        <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Curated for You</span>
      </div>
      <div className="space-y-2">
        {[
          { title: "React for Beginners", category: "Development", duration: "4h 30m", level: "Beginner", color: "bg-blue-50 text-blue-700", img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=80&h=80&fit=crop" },
          { title: "Figma UI/UX Masterclass", category: "Design", duration: "6h 15m", level: "Intermediate", color: "bg-pink-50 text-pink-700", img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=80&h=80&fit=crop" },
          { title: "Product Management 101", category: "Business", duration: "3h 00m", level: "Beginner", color: "bg-green-50 text-green-700", img: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=80&h=80&fit=crop" },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-100 transition-colors">
            <img src={r.img} alt={r.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{r.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${r.color}`}>{r.category}</span>
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><Clock className="w-2.5 h-2.5" />{r.duration}</span>
              </div>
            </div>
            <button className="flex-shrink-0 w-7 h-7 bg-[#5B47DB] rounded-full flex items-center justify-center"><Play className="w-3 h-3 text-white fill-white" /></button>
          </div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[{ label: "Courses Available", value: "200+", icon: BookOpen, color: "text-purple-500" }, { label: "Avg. Rating", value: "4.8★", icon: Star, color: "text-yellow-500" }].map((s, i) => (
        <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-2">
          <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
          <div><p className="text-xs font-bold text-gray-900">{s.value}</p><p className="text-[10px] text-gray-400">{s.label}</p></div>
        </div>
      ))}
    </div>
  </div>
);

const NewsEntertainmentMockup = () => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-4">
    <div className="flex items-center gap-2 mb-3">
      <Newspaper className="w-4 h-4 text-[#5B47DB]" />
      <h4 className="font-semibold text-gray-900 text-sm">News & Entertainment</h4>
      <span className="ml-auto text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Trending</span>
    </div>
    <div className="space-y-2.5">
      {[
        { title: "The Future of Remote Collaboration in 2025", source: "TechCrunch", time: "2h ago", tag: "Tech", tagColor: "bg-blue-100 text-blue-700", img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=80&h=80&fit=crop" },
        { title: "10 Tools Every Creator Needs This Year", source: "Product Hunt", time: "5h ago", tag: "Design", tagColor: "bg-pink-100 text-pink-700", img: "https://images.unsplash.com/photo-1542744094-24638eff58bb?w=80&h=80&fit=crop" },
        { title: "How Open Source is Shaping Modern Dev", source: "GitHub Blog", time: "1d ago", tag: "Dev", tagColor: "bg-green-100 text-green-700", img: "https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=80&h=80&fit=crop" },
      ].map((n, i) => (
        <div key={i} className="flex gap-3 items-start">
          <img src={n.img} alt={n.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{n.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${n.tagColor}`}>{n.tag}</span>
              <span className="text-[10px] text-gray-400">{n.source} · {n.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
      <span className="flex items-center gap-1 text-[10px] text-gray-500"><TrendingUp className="w-3 h-3 text-orange-500" /> Updated hourly</span>
      <button className="text-[10px] text-[#5B47DB] font-medium hover:underline">See all →</button>
    </div>
  </div>
);

// ─── Interactive Hero Mockup ──────────────────────────────────────────────────

const HERO_TABS = [
  { label: "Feed", icon: LayoutGrid, url: "collabunity.io/feed" },
  { label: "Discover", icon: Compass, url: "collabunity.io/discover" },
  { label: "My Projects", icon: Folder, url: "collabunity.io/myprojects" },
  { label: "Chat", icon: MessageCircle, url: "collabunity.io/chat" },
];

const HeroFeedTab = () => (
  <div className="space-y-2">
    {/* Create post bar */}
    <div className="bg-[#5B47DB] text-white rounded-xl px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer hover:bg-[#4A37C0] transition-colors">
      <span className="text-base leading-none">+</span> Post
    </div>
    {/* Got an idea banner */}
    <div className="bg-gradient-to-r from-[#5B47DB] to-indigo-600 rounded-xl p-3 flex items-center justify-between">
      <div><p className="text-white text-xs font-semibold">Got an idea?</p><p className="text-purple-200 text-[10px]">Create a project and find collaborators</p></div>
      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><span className="text-white text-sm leading-none">+</span></div>
    </div>
    {/* Search */}
    <div className="relative"><Search className="w-3 h-3 absolute left-2.5 top-2 text-gray-400" /><div className="w-full pl-7 pr-2 py-1.5 text-[10px] bg-gray-50 border border-gray-200 rounded-lg text-gray-400">Search posts and projects...</div></div>
    {/* Feed card */}
    <div className="border border-gray-200 rounded-xl p-3 bg-white">
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=80&h=80&fit=crop" alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-gray-900">Community Garden App</p>
            <p className="text-[10px] text-gray-400">Taylor Moss · 2 days ago</p>
          </div>
        </div>
        <Share2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
      </div>
      <div className="flex gap-1 flex-wrap mb-1.5">
        <span className="text-[10px] border border-gray-300 text-gray-600 rounded-full px-2 py-0.5">Seeking Collaborators</span>
        <span className="text-[10px] bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">Collaborative</span>
        <span className="text-[10px] bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">Nonprofit</span>
      </div>
      <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">Building a mobile app to help neighborhoods organize shared garden spaces, track plant schedules, and coordinate volunteers. Need designers and mobile devs...</p>
      {/* Collaborator avatars */}
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
        <div className="flex -space-x-1.5">
          {[
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
          ].map((src, i) => (
            <img key={i} src={src} alt="" className="w-5 h-5 rounded-full object-cover border border-white" />
          ))}
        </div>
        <span className="text-[10px] text-gray-400">3 collaborators</span>
      </div>
    </div>
  </div>
);

const HeroDiscoverTab = () => (
  <div className="space-y-2">
    {/* Hero banner */}
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 text-center border border-purple-100">
      <h3 className="font-bold text-gray-900 text-sm mb-0.5">Where <span className="text-[#5B47DB]">Ideas</span> Happen</h3>
      <p className="text-[10px] text-gray-500 mb-2">Connect with talented professionals and collaborate.</p>
      <div className="grid grid-cols-2 gap-1.5">
        {[{ label: "Learning Hub", sub: "Courses & videos", icon: GraduationCap }, { label: "News", sub: "Trending news", icon: Newspaper }].map((b, i) => (
          <div key={i} className="bg-white rounded-lg p-2 border border-gray-100 flex items-center gap-1.5 cursor-pointer hover:border-purple-200 transition-colors">
            <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center flex-shrink-0"><b.icon className="w-3 h-3 text-[#5B47DB]" /></div>
            <div><p className="text-[10px] font-semibold text-gray-900">{b.label}</p><p className="text-[9px] text-gray-400">{b.sub}</p></div>
          </div>
        ))}
      </div>
    </div>
    {/* Tabs */}
    <div className="grid grid-cols-2 gap-1 bg-gray-100 p-0.5 rounded-lg">
      <div className="bg-white rounded-md py-1 text-center text-[10px] font-semibold text-gray-900">📊 Projects</div>
      <div className="py-1 text-center text-[10px] font-medium text-gray-500">👥 Collaborators</div>
    </div>
    {/* Recommended */}
    <div className="flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3 text-purple-600" /><p className="text-[10px] font-semibold text-gray-900">Recommended for You</p></div>
    <div className="grid grid-cols-2 gap-1.5">
      {[
        { name: "UW Masters Digital Media", match: "7%", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=80&h=80&fit=crop", skills: ["Intercultural Communication", "Digital Media"] },
        { name: "Screen Time Challenge App", match: "5%", img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=80&h=80&fit=crop", skills: ["Mobile Development", "UI/UX Design"] },
      ].map((p, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-2 hover:border-purple-200 transition-colors cursor-pointer">
          <img src={p.img} alt={p.name} className="w-8 h-8 rounded-lg object-cover mb-1.5" />
          <p className="text-[10px] font-semibold text-gray-900 leading-tight mb-1">{p.name}</p>
          <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{p.match} Match</span>
          <div className="flex flex-wrap gap-0.5 mt-1">{p.skills.map(s => <span key={s} className="text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">{s}</span>)}</div>
        </div>
      ))}
    </div>
  </div>
);

const HeroMyProjectsTab = () => (
  <div className="space-y-2">
    {/* Search */}
    <div className="relative"><Search className="w-3 h-3 absolute left-2.5 top-2 text-gray-400" /><div className="w-full pl-7 pr-2 py-1.5 text-[10px] bg-gray-50 border border-gray-200 rounded-lg text-gray-400">Search your projects...</div></div>
    {/* Tabs */}
    <div className="grid grid-cols-3 gap-1 bg-gray-100 p-0.5 rounded-lg">
      <div className="bg-white rounded-md py-1 text-center text-[10px] font-semibold text-gray-900 flex items-center justify-center gap-1"><Eye className="w-2.5 h-2.5" />Public <span className="text-gray-400">14</span></div>
      <div className="py-1 text-center text-[10px] text-gray-500 flex items-center justify-center gap-1">Private <span className="text-gray-400">1</span></div>
      <div className="py-1 text-center text-[10px] text-gray-500 flex items-center justify-center gap-1">Archived <span className="text-gray-400">8</span></div>
    </div>
    {/* Project cards */}
    <div className="grid grid-cols-2 gap-1.5">
      {[
        { name: "Redapt Website Update", role: "Owner", status: "In Progress", statusColor: "border-blue-500", badgeColor: "text-blue-700 border border-blue-200", type: "Personal", img: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=80&h=80&fit=crop", skills: ["Web Design", "UI/UX Design"] },
        { name: "Velnor", role: "Collaborator", status: "Seeking Collaborators", statusColor: "border-orange-500", badgeColor: "text-orange-700 border border-orange-200", type: "Collaborative", img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=80&h=80&fit=crop", skills: ["Marketing Strategy", "Branding"] },
      ].map((p, i) => (
        <div key={i} className={`bg-white rounded-xl border-t-2 ${p.statusColor} border border-gray-200 p-2 hover:shadow-sm transition-all cursor-pointer`}>
          <div className="flex items-center justify-between mb-1.5">
            <img src={p.img} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{p.role}</span>
          </div>
          <p className="text-[10px] font-bold text-gray-900 leading-tight mb-1">{p.name}</p>
          <div className="flex gap-0.5 flex-wrap mb-1">
            <span className={`text-[9px] ${p.badgeColor} rounded-full px-1.5 py-0.5`}>{p.status}</span>
            <span className="text-[9px] bg-purple-50 text-purple-700 rounded-full px-1.5 py-0.5">{p.type}</span>
          </div>
          <div className="flex gap-0.5 flex-wrap">{p.skills.map(s => <span key={s} className="text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">{s}</span>)}</div>
        </div>
      ))}
    </div>
  </div>
);

const HeroChatTab = () => {
  const [activeChat, setActiveChat] = useState(0);
  const chats = [
    { name: "daniel", msg: "Whenever you're back online...", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces", online: true },
    { name: "Pablo Santana", msg: "Okay! Thanks for the suggestion!", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces", online: false },
    { name: "asvaldez5", msg: "Hey, Asvaldez! What brings you...", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces", online: true },
  ];
  const messages = [
    [
      { from: "them", text: "Hey! How's the project coming along?", time: "10:30 AM" },
      { from: "me", text: "Great! Just finished the mockups 🎨", time: "10:32 AM" },
      { from: "them", text: "Awesome! Can't wait to see them 👀", time: "10:33 AM" },
    ],
    [
      { from: "them", text: "Okay! Thanks for the suggestion!", time: "9:15 AM" },
      { from: "me", text: "Happy to help anytime 👍", time: "9:20 AM" },
    ],
    [
      { from: "them", text: "Hey, what brings you to Collab Unity?", time: "Yesterday" },
      { from: "me", text: "Looking to collaborate on projects!", time: "Yesterday" },
    ],
  ];
  return (
    <div className="grid grid-cols-5 gap-2 h-full" style={{ minHeight: 240 }}>
      {/* Conversation list */}
      <div className="col-span-2 flex flex-col gap-1">
        <div className="relative mb-1"><Search className="w-2.5 h-2.5 absolute left-2 top-1.5 text-gray-400" /><div className="w-full pl-6 pr-2 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded-lg text-gray-400">Search conversations...</div></div>
        {chats.map((c, i) => (
          <button key={i} onClick={() => setActiveChat(i)} className={`flex items-center gap-2 p-2 rounded-xl text-left transition-colors w-full ${activeChat === i ? "bg-purple-50 border border-purple-100" : "hover:bg-gray-50"}`}>
            <div className="relative flex-shrink-0">
              <img src={c.avatar} alt={c.name} className="w-7 h-7 rounded-full object-cover" />
              {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white" />}
            </div>
            <div className="min-w-0"><p className="text-[10px] font-semibold text-gray-900 truncate">{c.name}</p><p className="text-[9px] text-gray-400 truncate">{c.msg}</p></div>
          </button>
        ))}
      </div>
      {/* Active chat */}
      <div className="col-span-3 flex flex-col bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
        <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-gray-200 bg-white">
          <div className="relative flex-shrink-0">
            <img src={chats[activeChat].avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
            {chats[activeChat].online && <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full border border-white" />}
          </div>
          <p className="text-[10px] font-semibold text-gray-900">{chats[activeChat].name}</p>
          <span className={`text-[9px] ml-auto ${chats[activeChat].online ? "text-green-500" : "text-gray-400"}`}>● {chats[activeChat].online ? "Online" : "Offline"}</span>
        </div>
        <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
          {messages[activeChat].map((m, j) => (
            <div key={j} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-2xl px-2.5 py-1 text-[10px] max-w-[85%] ${m.from === "me" ? "bg-[#5B47DB] text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-700 rounded-tl-none"}`}>{m.text}</div>
            </div>
          ))}
        </div>
        <div className="px-2 py-1.5 bg-white border-t border-gray-200 flex items-center gap-1">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-[9px] text-gray-400">Type a message...</div>
          <div className="w-5 h-5 bg-[#5B47DB] rounded-full flex items-center justify-center flex-shrink-0"><Send className="w-2.5 h-2.5 text-white" /></div>
        </div>
      </div>
    </div>
  );
};

const HeroMockup = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabContent = [<HeroFeedTab />, <HeroDiscoverTab />, <HeroMyProjectsTab />, <HeroChatTab />];

  return (
    <div className="mt-14 max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/60">
        {/* Browser chrome */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
          <span className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0" />
          <span className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0" />
        </div>
        {/* Platform top nav */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
          <img src={LOGO_URL} alt="CU" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
          {/* Search */}
          <div className="relative flex-1 max-w-[160px]">
            <Search className="w-2.5 h-2.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <div className="w-full pl-6 pr-2 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded-lg text-gray-400">Search...</div>
          </div>
          {/* Nav links */}
          <div className="flex items-center gap-0.5 flex-1 justify-center">
            {HERO_TABS.map((t, i) => {
              const Icon = t.icon;
              const active = activeTab === i;
              return (
                <button
                  key={t.label}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${active ? "text-[#5B47DB]" : "text-gray-500 hover:text-gray-800"}`}
                >
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
          {/* Create + avatar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="flex items-center gap-1 bg-[#5B47DB] text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg hover:bg-[#4A37C0] transition-colors">
              <span className="text-sm leading-none">+</span> Create Project
            </button>
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces" alt="User" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
          </div>
        </div>
        {/* Page content */}
        <div className="p-4 overflow-hidden" style={{ minHeight: 280 }}>
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
};

// ─── Hero Section ─────────────────────────────────────────────────────────────
const HeroSection = ({ onAuth }) => {
  const handleAuth = onAuth;
  return (
  <section className="pt-32 pb-12 text-center px-4" style={{ background: "transparent" }}>
    <div className="max-w-[700px] mx-auto">
      <p className="text-sm font-semibold text-[#5B47DB] mb-3 tracking-wide uppercase">Collab Unity</p>
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-gray-900 tracking-tight leading-tight mb-5">
        Where Ideas Happen.
      </h1>
      <p className="text-xl text-gray-500 leading-relaxed mb-8 max-w-[560px] mx-auto">
        The platform for creators, builders, and innovators to launch projects, find collaborators, and ship together.
      </p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <PillButton primary onClick={onAuth}>Get started <ArrowRight className="w-4 h-4" /></PillButton>
        <PillButton onClick={onAuth}>Log in to your account</PillButton>
      </div>
    </div>
    {/* Hero Visual — Interactive Mockup */}
    <HeroMockup />
  </section>
  );
};

// ─── Stats Banner ─────────────────────────────────────────────────────────────
const StatsBanner = () => (
  <section className="py-12 bg-white border-y border-gray-200">
    <div className="max-w-[980px] mx-auto px-4 grid grid-cols-3 gap-8 text-center">
      {[{ value: "50+", label: "Projects Created" }, { value: "30+", label: "Active Collaborators" }, { value: "5+", label: "Countries" }].map(s => (
        <div key={s.label}><div className="text-4xl font-semibold text-gray-900 mb-1">{s.value}</div><div className="text-sm text-gray-500">{s.label}</div></div>
      ))}
    </div>
  </section>
);

// ─── Features Showcase (Apple left/right alternating with real mockups) ────────
const FeaturesShowcase = ({ onAuth }) => {
  const features = [
    {
      eyebrow: "Feed",
      title: "Share your journey with the world.",
      subtitle: "Post progress updates, showcase live links, and celebrate milestones with a community that cheers you on.",
      bg: "bg-[#f5f5f7]",
      accentBg: "bg-gradient-to-br from-[#5B47DB] to-purple-700",
      items: ["Published projects", "Media", "Comments & Feedback"],
      mockup: <FeedMockup />,
      icon: LayoutGrid,
    },
    {
      eyebrow: "Discover",
      title: "Find your perfect collaborators.",
      subtitle: "Browse projects seeking help, apply to join, and connect with talented people who share your skills and interests.",
      bg: "bg-white",
      accentBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      items: ["Project & Collaborator recommendations", "Filter by skill & industry", "Apply for Projects", "Collaborator profiles"],
      mockup: <DiscoverMockup />,
      icon: Compass,
    },
    {
      eyebrow: "Chat",
      title: "Message your team in real-time.",
      subtitle: "Stay connected with 1-on-1 and group chats, with your project context always accessible.",
      bg: "bg-[#f5f5f7]",
      accentBg: "bg-gradient-to-br from-orange-500 to-red-500",
      items: ["Direct messages", "Team group chats", "Share updates", "Task mentions"],
      mockup: <ChatMockup />,
      icon: MessageCircle,
    },
    {
      eyebrow: "Build Workspace",
      title: "Your collaborative project workspace.",
      subtitle: "Tasks, milestones, assets, notes, and a project assistant — all in one unified workspace.",
      bg: "bg-white",
      accentBg: "bg-gradient-to-br from-[#5B47DB] to-indigo-700",
      items: ["Project Assistant", "Task & milestone board", "Asset management", "Notes & ideation"],
      mockup: <WorkspaceMockup />,
      icon: Sparkles,
    },
    {
      eyebrow: "Profile",
      title: "Build a portfolio that speaks for itself.",
      subtitle: "Showcase projects, collect peer endorsements, gather reviews, and generate an AI-powered resume in seconds.",
      bg: "bg-[#f5f5f7]",
      accentBg: "bg-gradient-to-br from-pink-500 to-purple-600",
      items: ["Live project portfolio", "Skill endorsements", "Peer reviews", "PDF Resume Generator"],
      mockup: <ProfileMockup />,
      icon: User,
    },
    {
      eyebrow: "Learning Hub",
      title: "Level up while you build.",
      subtitle: "Access a curated library of courses, tutorials, and resources to sharpen your skills — right alongside your projects.",
      bg: "bg-white",
      accentBg: "bg-gradient-to-br from-[#5B47DB] to-blue-500",
      items: ["Curated courses & tutorials", "Skill-matched recommendations", "Track your progress", "Free & premium resources"],
      mockup: <LearningHubMockup />,
      icon: GraduationCap,
    },
    {
      eyebrow: "News & Entertainment",
      title: "Stay inspired and informed.",
      subtitle: "Follow the latest in tech, design, and entrepreneurship — handpicked stories to fuel your creativity and keep you sharp.",
      bg: "bg-[#f5f5f7]",
      accentBg: "bg-gradient-to-br from-orange-500 to-red-500",
      items: ["Curated tech & design news", "Trending topics in your field", "Updated hourly", "Discover new tools & ideas"],
      mockup: <NewsEntertainmentMockup />,
      icon: Newspaper,
    },
  ];

  return (
    <section id="features" className="bg-white">
      {features.map((f, i) => {
        const isEven = i % 2 === 0;
        return (
          <div key={i} className={`py-16 px-4 border-t border-gray-200 ${f.bg}`}>
            <div className={`max-w-[980px] mx-auto flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12`}>
              {/* Text side */}
              <div className="flex-1 text-left">
                <div className={`w-12 h-12 ${f.accentBg} rounded-2xl flex items-center justify-center mb-5`}>
                  {(() => { const Icon = f.icon || [LayoutGrid, Compass, MessageCircle, Sparkles, User, GraduationCap, Newspaper][i]; return <Icon className="w-6 h-6 text-white" />; })()}
                </div>
                <p className="text-sm font-semibold text-[#5B47DB] mb-1">{f.eyebrow}</p>
                <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight mb-4 leading-tight">{f.title}</h2>
                <p className="text-lg text-gray-500 mb-6 leading-relaxed">{f.subtitle}</p>
                <ul className="space-y-2 mb-8">
                  {f.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 text-[#5B47DB]" />
                      <span className="text-sm font-medium text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={onAuth} className="bg-[#5B47DB] text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-[#4A37C0] transition-colors">
                  Get started
                </button>
              </div>
              {/* Mockup side */}
              <div className="flex-1 w-full">
                {f.mockup}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

// ─── How It Works ─────────────────────────────────────────────────────────────
const HowItWorks = ({ onAuth }) => (
  <section id="how-it-works" className="py-20 px-4 bg-white text-center">
    <div className="max-w-[980px] mx-auto">
      <p className="text-sm font-semibold text-[#5B47DB] mb-2 uppercase tracking-wide">Process</p>
      <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-4">Start collaborating in minutes.</h2>
      <p className="text-xl text-gray-500 mb-16 max-w-[500px] mx-auto">Simple, fast, and extremely effective.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[{ step: "01", title: "Create Your Profile", desc: "Set up your profile, showcase your skills, and tell the community what you want to build.", icon: User, color: "bg-purple-50", ic: "text-purple-500" }, { step: "02", title: "Find or Start a Project", desc: "Browse existing projects looking for collaborators — or create your own and invite others.", icon: Lightbulb, color: "bg-blue-50", ic: "text-blue-500" }, { step: "03", title: "Collaborate & Ship", desc: "Use built-in workspace tools to manage tasks, share files, chat, and bring your project to life.", icon: Rocket, color: "bg-green-50", ic: "text-green-500" }].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="relative">
              <div className={`${s.color} rounded-3xl p-8 flex flex-col items-center text-center`}>
                <span className="text-xs font-mono font-bold text-gray-400 mb-4">{s.step}</span>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4"><Icon className={`w-8 h-8 ${s.ic}`} /></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
              {i < 2 && <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow border border-gray-100 items-center justify-center"><ArrowRight className="w-4 h-4 text-gray-400" /></div>}
            </div>
          );
        })}
      </div>
      <div className="mt-12">
        <button onClick={onAuth} className="bg-[#5B47DB] text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-[#4A37C0] transition-colors">Get started</button>
      </div>
    </div>
  </section>
);

// ─── About ─────────────────────────────────────────────────────────────────────
const AboutSection = () => (
  <section id="about" className="py-20 px-4 bg-[#f5f5f7]">
    <div className="max-w-[700px] mx-auto text-center">
      <p className="text-sm font-semibold text-[#5B47DB] mb-2 uppercase tracking-wide">Our Mission</p>
      <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-6 leading-tight">Built for builders who think bigger.</h2>
      <p className="text-lg text-gray-500 leading-relaxed mb-6">Collab Unity is a project-first platform where creators, learners, and innovators unite around shared visions. We give you every tool to plan, build, and ship — without the friction.</p>
      <p className="text-lg text-gray-500 leading-relaxed">Whether you're building a startup, a side project, a nonprofit, or something you're just passionate about — Collab Unity is the place where your ideas find their team.</p>
    </div>
    <div className="max-w-[980px] mx-auto mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[{ icon: Lightbulb, title: "Innovation", desc: "Build products that solve real problems with people who care.", color: "text-yellow-500" }, { icon: Users, title: "Community", desc: "A supportive, inclusive space where everyone can contribute.", color: "text-blue-500" }, { icon: BookOpen, title: "Learning", desc: "Grow your skills through hands-on project collaboration.", color: "text-green-500" }, { icon: Heart, title: "Passion", desc: "Work on things you love with people who share your drive.", color: "text-red-500" }].map((v, i) => {
        const Icon = v.icon;
        return <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100"><div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4"><Icon className={`w-6 h-6 ${v.color}`} /></div><h4 className="font-semibold text-gray-900 mb-1">{v.title}</h4><p className="text-sm text-gray-500">{v.desc}</p></div>;
      })}
    </div>
  </section>
);

// ─── CTA Banner ───────────────────────────────────────────────────────────────
const CTABanner = ({ onAuth }) => (
  <section className="py-24 px-4 bg-gradient-to-b from-[#f5f5f7] to-white text-center">
    <div className="max-w-[620px] mx-auto">
      <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-4 leading-tight">Ready to build something great?</h2>
      <p className="text-xl text-gray-500 mb-8">Join a growing community of creators bringing ambitious ideas to life. Free to start, forever.</p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button onClick={onAuth} className="bg-[#5B47DB] text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-[#4A37C0] transition-colors">Get started <ArrowRight className="inline w-4 h-4 ml-1" /></button>
        <button onClick={onAuth} className="text-[#5B47DB] text-sm font-medium hover:underline">Already have an account? Sign in</button>
      </div>
    </div>
  </section>
);

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ = () => {
  const faqs = [
    { q: "What is Collab Unity?", a: "A project-based collaboration platform connecting creators, learners, and innovators to build projects together with built-in tools for tasks, chat, assets, and project assistance." },
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
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
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
      <div className="flex flex-col sm:flex-row justify-between gap-8 text-sm text-gray-500 mb-8">
        <div>
          <h5 className="font-semibold text-gray-900 mb-3">Platform</h5>
          <ul className="space-y-2">
            <li><a href="#features" className="hover:text-gray-900 transition-colors">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a></li>
            <li><a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a></li>
            <li><Link to={createPageUrl("Featured")} className="hover:text-gray-900 transition-colors">Featured</Link></li>
            <li><Link to={createPageUrl("Resources")} className="hover:text-gray-900 transition-colors">Resources</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold text-gray-900 mb-3">Legal</h5>
          <ul className="space-y-2">
            <li><Link to={createPageUrl("Contact")} className="hover:text-gray-900 transition-colors">Contact</Link></li>
            <li><Link to={createPageUrl("TermsOfService")} className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
            <li><Link to={createPageUrl("PrivacyPolicy")} className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Collab Unity" className="w-5 h-5 rounded object-cover" />
          <div>
            <span className="text-xs font-semibold text-gray-700">Collab Unity</span>
            <span className="text-xs text-gray-400 ml-2">Where Ideas Happen</span>
          </div>
        </div>
        <span className="text-xs text-gray-400">Copyright © 2025 Collab Unity. All rights reserved.</span>
      </div>
    </div>
  </footer>
);

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Welcome() {
  const handleAuth = () => {
    window.location.href = "https://collabunity.io/login";
  };

  React.useEffect(() => {
    const target = sessionStorage.getItem("welcomeScrollTarget");
    if (target) {
      sessionStorage.removeItem("welcomeScrollTarget");
      setTimeout(() => {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #f3f0ff 40%, #f5f3ff 70%, #faf5ff 100%)" }}>
      <PublicNav currentPage="Welcome" />
      <HeroSection onAuth={handleAuth} />
      <StatsBanner />
      <FeaturesShowcase onAuth={handleAuth} />
      <HowItWorks onAuth={handleAuth} />
      <AboutSection />
      <CTABanner onAuth={handleAuth} />
      <FAQ />
      <PublicFooter />
    </div>

  );
}