import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Lightbulb,
  Bookmark,
  Users,
  Rocket,
  MessageCircle,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Globe,
  Heart,
  LayoutGrid,
  Compass,
  BookOpen,
  Folder,
  User,
  FileText,
  CheckSquare,
  MessageSquare,
  Settings,
  MapPin,
  Building2,
  Tag,
  Eye,
  Send,
  Search,
  Share2,
  DollarSign,
  HandHeart,
  Briefcase,
  Menu,
  X,
  Image,
  FolderOpen,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Hat icon component (lighter version matching platform style) - REMOVED

// Visual mockup components from Demos page
const FeedPostMockup = () => {
  const [activeTab, setActiveTab] = React.useState('showcase');
  const [showcaseIndex, setShowcaseIndex] = React.useState(0);
  
  const showcaseItems = [
    { title: "Live Website", domain: "velnor.pro", screenshotUrl: "https://api.microlink.io/?url=https%3A%2F%2Fvelnor.pro&screenshot=true&meta=false&embed=screenshot.url" },
    { title: "GitHub Repo", domain: "github.com", screenshotUrl: "https://api.microlink.io/?url=https%3A%2F%2Fgithub.com&screenshot=true&meta=false&embed=screenshot.url" },
  ];
  
  const currentItem = showcaseItems[showcaseIndex];
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <img 
              src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop"
              alt="Project Logo"
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base mb-1">The Forgotten Library</h3>
              <div className="flex items-center gap-2">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
                  alt="Jordan Blake"
                  className="w-4 h-4 rounded-full object-cover"
                />
                <p className="text-xs text-gray-500">Jordan Blake • 2 weeks ago</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <Bookmark className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className="bg-orange-100 text-orange-700 border-0 text-xs font-medium">Seeking Collaborators</Badge>
          <Badge className="bg-purple-100 text-purple-700 border-0 text-xs font-medium">Collaborative</Badge>
          <Badge className="bg-green-100 text-green-700 border-0 text-xs font-medium">Educational</Badge>
          <div className="flex items-center gap-1 text-purple-600 text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>3 collaborators</span>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
          Writing a fantasy novel about a hidden library containing books that can alter reality. Looking for co-authors, editors, and illustrators to bring this story to life...
        </p>

        {/* Showcase Navigation Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <button 
            onClick={() => setShowcaseIndex((showcaseIndex - 1 + showcaseItems.length) % showcaseItems.length)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Globe className="w-3.5 h-3.5" />
            <span className="font-medium">Showcase</span>
            <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">{showcaseItems.length}</span>
          </div>
          <button 
            onClick={() => setShowcaseIndex((showcaseIndex + 1) % showcaseItems.length)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Microlink-style browser preview */}
        <div className="rounded-lg border border-gray-200 overflow-hidden mb-4 cursor-pointer hover:border-purple-300 transition-colors">
          {/* Browser chrome */}
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <div className="flex-1 text-center bg-white rounded px-2 py-0.5 mx-3 truncate text-[10px] text-gray-500">
              {currentItem.domain}
            </div>
          </div>
          {/* Screenshot */}
          <div className="relative aspect-video bg-gray-100 overflow-hidden">
            <img
              src={currentItem.screenshotUrl}
              alt={currentItem.title}
              className="w-full h-full object-cover"
              onError={e => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 hidden items-center justify-center bg-gray-50">
              <div className="text-center">
                <Globe className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">{currentItem.domain}</p>
              </div>
            </div>
          </div>
          {/* Title bar */}
          <div className="px-3 py-2 bg-white">
            <p className="text-sm font-semibold text-gray-900">{currentItem.title}</p>
            <p className="text-xs text-gray-500">Click to visit</p>
          </div>
        </div>
        
        {/* Metadata Icons */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Remote</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Creative Writing</span>
          </div>
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            <span>Fantasy</span>
          </div>
        </div>
        
        {/* Skills Tags */}
        <div className="flex flex-wrap gap-1.5 pb-3 border-b border-gray-100">
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Creative Writing</Badge>
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Storytelling</Badge>
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Editing</Badge>
          <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">+2 more</Badge>
        </div>

        {/* Recent Activity */}
        <div className="py-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
            <svg className="w-3.5 h-3.5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Recent Activity <span className="bg-gray-200 text-gray-600 rounded-full px-1.5">2</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=faces" className="w-5 h-5 rounded-full object-cover flex-shrink-0" alt="" />
              <span><span className="font-medium text-gray-800">Jordan Blake</span> posted a discussion comment</span>
              <span className="ml-auto text-gray-400 whitespace-nowrap">2 days ago</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=faces" className="w-5 h-5 rounded-full object-cover flex-shrink-0" alt="" />
              <span><span className="font-medium text-gray-800">Alex M.</span> completed a task</span>
              <span className="ml-auto text-gray-400 whitespace-nowrap">4 days ago</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-around pt-3">
          <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group">
            <HandHeart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Applaud</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group">
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group">
            <DollarSign className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Fund</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const DiscoverProjectsMockup = () => (
  <div className="space-y-4">
    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h4 className="font-semibold text-purple-900">Recommended for You</h4>
      </div>
      <p className="text-sm text-purple-700 mb-4">Projects that match your skills and interests</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { name: "Social Media Dashboard", match: "85%", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop", desc: "Analytics platform for tracking social media performance across multiple channels" },
          { name: "E-commerce Platform", match: "78%", image: "https://images.unsplash.com/photo-1661956602116-aa6865609028?w=100&h=100&fit=crop", desc: "Modern online marketplace connecting local artisans with global customers" }
        ].map((project, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col">
            <div className="flex items-start space-x-3 mb-3">
              <img src={project.image} alt={project.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-gray-900 text-sm mb-1">{project.name}</h5>
                <Badge className="bg-purple-100 text-purple-700 text-xs">{project.match} Match</Badge>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3 flex-grow">{project.desc}</p>
            <div className="flex justify-end pt-2 border-t">
              <Button size="sm" variant="outline" className="text-xs">
                <Briefcase className="w-3 h-3 mr-1" />
                Apply
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[
        { name: "Mobile Fitness App", type: "Seeking Collaborators", image: "https://images.unsplash.com/photo-1461773518188-b3e86f98242f?w=100&h=100&fit=crop", industry: "Health & Fitness", collaborators: 2, desc: "Comprehensive fitness tracking app with personalized workout plans and nutrition guidance", skills: ["Flutter", "Firebase"] },
        { name: "Podcast Platform", type: "In Progress", image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=100&fit=crop", industry: "Media", collaborators: 7, desc: "Audio streaming service for independent creators with built-in monetization tools", skills: ["Adobe Premier Pro", "YouTube"] }
      ].map((project, i) => (
        <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-blue-500 hover:shadow-xl transition-all cursor-pointer h-full flex flex-col">
          <div className="p-4 flex flex-col flex-grow">
            <div className="flex items-start space-x-3 mb-3">
              <img src={project.image} alt={project.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 mb-1">{project.name}</h4>
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">{project.type}</Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
              {project.desc}
            </p>
            <div className="flex items-center text-xs text-gray-600 space-x-3 mb-3">
              <span className="flex items-center"><Building2 className="w-3 h-3 mr-1" />{project.industry}</span>
              <span className="flex items-center"><Users className="w-3 h-3 mr-1" />{project.collaborators} members</span>
            </div>
            <div className="flex gap-1.5 flex-wrap mb-4">
              {project.skills.map(skill => (
                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
            </div>
            <div className="flex items-center justify-end border-t pt-3 mt-auto">
              <Button size="sm" variant="outline" className="text-xs">
                <Briefcase className="w-3 h-3 mr-1" />
                Apply
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MarketplaceMockup = () => {
  const [activeTab, setActiveTab] = React.useState('projects');
  
  const projectListings = [
    { 
      name: "E-commerce Platform", 
      price: "$2,500",
      seller: "Sarah K.",
      type: "Fixed Price",
      image: "https://images.unsplash.com/photo-1661956602116-aa6865609028?w=100&h=100&fit=crop",
      skills: ["React", "Node.js"]
    },
    { 
      name: "Social Dashboard", 
      price: "$1,800",
      seller: "Alex J.",
      type: "Fixed Price",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
      skills: ["Analytics", "Design"]
    }
  ];

  const serviceListings = [
    {
      name: "UI/UX Design Services",
      rate: "$150/hr",
      provider: "Sarah K.",
      type: "Consultation - 60 min",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
      skills: ["Figma", "User Research"]
    },
    {
      name: "Full-Stack Development",
      rate: "$200/hr",
      provider: "Alex J.",
      type: "Consultation - 90 min",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
      skills: ["React", "Node.js"]
    }
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 text-lg">Project Marketplace</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'projects' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Projects
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'services' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Services
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(activeTab === 'projects' ? projectListings : serviceListings).map((item, i) => (
            <div key={i} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-purple-300 transition-all cursor-pointer">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-gray-600">by {activeTab === 'projects' ? item.seller : item.provider}</p>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                    {activeTab === 'projects' ? item.price : item.rate}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    {item.type}
                  </span>
                  {item.skills.map(skill => (
                    <span key={skill} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-3 border-t">
                  <button className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors">
                    Book Now
                  </button>
                  <button className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <MessageCircle className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-900 text-xs mb-0.5">Sell Your Projects</h4>
              <p className="text-xs text-purple-700">List your projects and services to earn from your work</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatMockup = () => {
  const [activeChat, setActiveChat] = React.useState(0);
  
  const chats = [
    { 
      name: "Alex Johnson", 
      message: "Sounds good!", 
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
      messages: [
        { from: "them", text: "Hey! How's the project coming along?", time: "10:30 AM" },
        { from: "me", text: "Great! Just finished the design mockups", time: "10:32 AM" },
        { from: "them", text: "Awesome! Can't wait to see them 👀", time: "10:33 AM" }
      ]
    },
    { 
      name: "Sarah Lee", 
      message: "Let's schedule a call", 
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
      messages: [
        { from: "them", text: "Let's schedule a planning session", time: "9:15 AM" },
        { from: "me", text: "How about tomorrow at 2pm?", time: "9:20 AM" },
        { from: "them", text: "Perfect! I'll send the calendar invite", time: "9:22 AM" }
      ]
    },
    { 
      name: "Team Project", 
      message: "New task assigned", 
      avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop&crop=faces",
      messages: [
        { from: "them", text: "New task assigned: Review documentation", time: "Yesterday" },
        { from: "me", text: "I'll take a look this afternoon", time: "Yesterday" },
        { from: "them", text: "Thanks! No rush on this one", time: "Yesterday" }
      ]
    }
  ];

  return (
  <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
    <div className="grid grid-cols-3 h-96">
      <div className="col-span-1 border-r border-gray-200 bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">Messages</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="space-y-1 p-2">
          {chats.map((chat, i) => (
            <div 
              key={i} 
              className={`p-3 rounded-lg cursor-pointer transition-colors ${activeChat === i ? 'bg-purple-100' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveChat(i)}
            >
              <div className="flex items-center space-x-3">
                <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{chat.name}</p>
                  <p className="text-xs text-gray-600 truncate">{chat.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="col-span-2 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <img 
              src={chats[activeChat].avatar}
              alt={chats[activeChat].name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold text-gray-900">{chats[activeChat].name}</h4>
              <p className="text-xs text-green-600">● Online</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
          {chats[activeChat].messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${msg.from === 'me' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'} rounded-2xl px-4 py-2 max-w-xs shadow-sm`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.from === 'me' ? 'text-purple-200' : 'text-gray-500'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm"
            />
            <button className="w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

const BuildWorkspaceMockup = () => {
  const [activeSection, setActiveSection] = React.useState("chat");

  const sidebarItems = [
    { id: "chat",       icon: Sparkles,     label: "Assistant" },
    { id: "tasks",      icon: CheckSquare,  label: "Tasks" },
    { id: "milestones", icon: CheckCircle,  label: "Milestones" },
    { id: "assets",     icon: FolderOpen,   label: "Assets" },
    { id: "notes",      icon: BookOpen,     label: "Notes" },
    { id: "tools",      icon: Settings,     label: "Tools" },
  ];

  const sectionContent = {
    chat: (
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-hidden space-y-3 p-3">
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 max-w-[85%] shadow-sm">
              Hey! I'm your <strong>Project Assistant</strong> for <em>Redapt Website Update</em>. I can help you plan tasks, brainstorm ideas, suggest tools, and more. What do you want to work on?
            </div>
          </div>
          <div className="flex gap-2 flex-row-reverse">
            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-white" />
            </div>
            <div className="bg-purple-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[75%]">
              Break this into milestones
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 max-w-[85%] shadow-sm">
              <p className="mb-1.5 font-medium">Here are 3 milestones:</p>
              <p>1. <strong>Discovery & Design</strong> — wireframes, brand alignment</p>
              <p>2. <strong>Development</strong> — build & integrate components</p>
              <p>3. <strong>Launch</strong> — QA, deploy, go live</p>
              {/* Action chips */}
              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs bg-orange-50 text-orange-700 border-orange-200 cursor-pointer">
                  <CheckCircle className="w-3 h-3" /> Save as Milestone
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-pointer">
                  <CheckSquare className="w-3 h-3" /> Save as Task
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs bg-green-50 text-green-700 border-green-200 cursor-pointer">
                  <BookOpen className="w-3 h-3" /> Save as Note
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Input */}
        <div className="p-2 border-t border-gray-200 bg-white">
          <div className="flex gap-1.5 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
            <input className="flex-1 bg-transparent text-xs outline-none text-gray-500 placeholder-gray-400" placeholder="Ask anything..." readOnly />
            <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center flex-shrink-0">
              <Send className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>
      </div>
    ),
    tasks: (
      <div className="p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700 mb-2">Tasks</p>
        {[
          { label: "Design landing page", priority: "Urgent", done: false, color: "bg-red-100 text-red-700" },
          { label: "Review pull requests", priority: "Medium", done: false, color: "bg-yellow-100 text-yellow-700" },
          { label: "Setup repository", priority: "", done: true, color: "" },
        ].map((t, i) => (
          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${t.done ? "bg-green-50 opacity-60" : "bg-gray-50"}`}>
            <input type="checkbox" readOnly checked={t.done} className="w-3.5 h-3.5" />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${t.done ? "line-through text-gray-400" : "text-gray-800"}`}>{t.label}</p>
            </div>
            {t.priority && <span className={`text-xs px-1.5 py-0.5 rounded ${t.color}`}>{t.priority}</span>}
          </div>
        ))}
      </div>
    ),
    milestones: (
      <div className="p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700 mb-2">Milestones</p>
        {[
          { label: "Discovery & Design", status: "Done", color: "bg-green-100 text-green-700", icon: CheckCircle, iconColor: "text-green-600" },
          { label: "Development", status: "Active", color: "bg-purple-100 text-purple-700", icon: Rocket, iconColor: "text-purple-600" },
          { label: "Launch", status: "Todo", color: "bg-gray-100 text-gray-600", icon: Target, iconColor: "text-gray-400" },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <Icon className={`w-4 h-4 flex-shrink-0 ${m.iconColor}`} />
              <p className="flex-1 text-xs font-medium text-gray-800">{m.label}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded ${m.color}`}>{m.status}</span>
            </div>
          );
        })}
      </div>
    ),
    assets: (
      <div className="p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700 mb-2">Assets</p>
        {[
          { name: "design-mockups.fig", color: "text-blue-500" },
          { name: "project-brief.pdf", color: "text-green-500" },
          { name: "brand-guidelines.pdf", color: "text-purple-500" },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
            <FileText className={`w-4 h-4 flex-shrink-0 ${a.color}`} />
            <p className="text-xs font-medium text-gray-800 truncate">{a.name}</p>
          </div>
        ))}
      </div>
    ),
    notes: (
      <div className="p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700 mb-2">Thoughts & Notes</p>
        {[
          { title: "Design System", content: "Stick to purple brand palette for consistency" },
          { title: "Launch Checklist", content: "QA review, stakeholder sign-off, DNS update" },
        ].map((n, i) => (
          <div key={i} className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-semibold text-gray-800 mb-0.5">{n.title}</p>
            <p className="text-xs text-gray-600">{n.content}</p>
          </div>
        ))}
      </div>
    ),
    tools: (
      <div className="p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700 mb-2">Project Tools</p>
        {[
          { name: "GitHub", icon: "🐙", url: "github.com/project" },
          { name: "Figma", icon: "🎨", url: "figma.com/design" },
        ].map((tool, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer">
            <span className="text-lg">{tool.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900">{tool.name}</p>
              <p className="text-xs text-gray-400 truncate">{tool.url}</p>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight">Project Assistant</p>
            <p className="text-xs text-white/70 leading-tight">Your project workspace for "Redapt Website"</p>
          </div>
        </div>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">3 tasks · 3 milestones</span>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex" style={{ height: "280px" }}>
        {/* Sidebar */}
        <div className="flex flex-col items-center gap-1 py-3 px-1.5 bg-gray-50 border-r border-gray-200 w-12 flex-shrink-0">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                title={item.label}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  active ? "bg-purple-600 text-white shadow-sm" : "text-gray-400 hover:bg-purple-50 hover:text-purple-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/40 flex flex-col">
          {sectionContent[activeSection]}
        </div>
      </div>
    </div>
  );
};

const IDEMockup = () => {
  const [activeFile, setActiveFile] = React.useState("html");
  
  const files = {
    html: {
      name: "index.html",
      lines: [
        { num: 1, text: "<!DOCTYPE html>" },
        { num: 2, text: "<html>" },
        { num: 3, text: "  <head>" },
        { num: 4, text: "    <title>My Project</title>" },
        { num: 5, text: "  </head>" },
        { num: 6, text: "  <body>" },
        { num: 7, text: "    <h1>Hello World!</h1>" },
        { num: 8, text: "  </body>" },
        { num: 9, text: "</html>" }
      ]
    },
    css: {
      name: "styles.css",
      lines: [
        { num: 1, text: "body {" },
        { num: 2, text: "  font-family: sans-serif;" },
        { num: 3, text: "  margin: 0;" },
        { num: 4, text: "  padding: 20px;" },
        { num: 5, text: "}" },
        { num: 6, text: "" },
        { num: 7, text: "h1 {" },
        { num: 8, text: "  color: #7c3aed;" },
        { num: 9, text: "}" }
      ]
    }
  };

  return (
  <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
    <div className="border-b border-gray-200 bg-gray-900 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-white font-semibold text-sm">Code Playground</h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveFile("html")}
              className={`px-3 py-1 text-xs rounded transition-colors ${activeFile === "html" ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              index.html
            </button>
            <button 
              onClick={() => setActiveFile("css")}
              className={`px-3 py-1 text-xs rounded transition-colors ${activeFile === "css" ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              styles.css
            </button>
          </div>
        </div>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
          <Eye className="w-3 h-3 mr-1" />
          Preview
        </Button>
      </div>
    </div>
    
    <div className="grid grid-cols-2">
      <div className="bg-gray-900 p-4 font-mono text-sm">
        <div className="flex">
          <div className="pr-4 text-right select-none">
            {files[activeFile].lines.map(line => (
              <div key={line.num} className="text-gray-500">{line.num}</div>
            ))}
          </div>
          <div className="flex-1 text-gray-300">
            {files[activeFile].lines.map(line => (
              <div key={line.num}>{line.text}</div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 border-l border-gray-200">
        <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-500 ml-2">Preview</span>
        </div>
        <div className="flex items-center justify-center h-40">
          <h1 className="text-3xl font-bold" style={{ color: '#7c3aed' }}>Hello World!</h1>
        </div>
      </div>
    </div>
    
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
      <p className="text-xs text-gray-600">Last modified: Just now</p>
    </div>
  </div>
  );
};

const ProfileMockup = () => (
  <div className="space-y-4">
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
      <div className="flex items-start space-x-4">
        <img 
          src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces"
          alt="Sarah Kristine"
          className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
        />
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-1">Sarah Kristine</h3>
          <p className="text-purple-100 mb-2">@sarahkristine</p>
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />Chelan, WA</span>
            <span className="flex items-center"><Users className="w-4 h-4 mr-1" />Remote</span>
          </div>
        </div>
      </div>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Lightbulb className="w-4 h-4 mr-2 text-purple-600" />
          Projects (3)
        </h4>
        <div className="space-y-3">
          {[
            { name: "E-commerce Platform", image: "https://images.unsplash.com/photo-1661956602116-aa6865609028?w=100&h=100&fit=crop" },
            { name: "Social Dashboard", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop" }
          ].map((project, i) => (
            <div key={i} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <img src={project.image} alt={project.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                <Badge className="text-xs bg-green-100 text-green-700">Completed</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
          Skills
        </h4>
        <div className="flex flex-wrap gap-2">
          {["R", "Chemistry", "Biology", "Science", "Data Visualization", "Leadership"].map((skill, i) => (
            <Badge key={i} className="bg-purple-100 text-purple-700 text-xs">{skill}</Badge>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
            <FileText className="w-4 h-4 mr-2 text-purple-600" />
            Education
          </h4>
          <p className="text-sm text-gray-700 font-medium">B.S. Biology</p>
          <p className="text-xs text-gray-600">Pacific Lutheran University • 2020</p>
        </div>
      </div>
    </div>
  </div>
);

// Language translations
const translations = {
  en: {
    hero: {
      title1: "Collab Unity",
      title2: "Where Ideas Happen.",
      description: "Join a community of creators, learners, and innovators. Build projects together, share knowledge, and turn your ideas into reality with the perfect team.",
      getStarted: "Get Started",
      haveAccount: "I Already Have an Account"
    },
    nav: {
      about: "About",
      legal: "Legal",
      featureRequest: "Feature Request",
      testimonials: "Testimonials",
      support: "Support",
      login: "Log In",
      signup: "Sign Up",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy"
    },
    stats: {
      collaborators: "Active Collaborators",
      projects: "Projects Created",
      countries: "Countries Represented"
    },
    features: {
      title: "Where Your Ideas Are Realized",
      description: "Collab Unity is the creative catalyst where solopreneurs and hobbyists turn their dreams into legacies."
    },
    howItWorks: {
      title: "Start collaborating in minutes",
      subtitle: "It's simple, fast, and extremely effective"
    },
    cta: {
      title: "Ready to start your journey?",
      description: "Join hundreds of creators, learners, and innovators building amazing projects together on Collab Unity.",
      button: "Get Started Now"
    },
    footer: {
      contact: "Contact",
      copyright: "© 2025 Collab Unity. All rights reserved."
    }
  },
  es: {
    tagline: "Donde Suceden las Ideas",
    hero: {
      title1: "Collab Unity",
      title2: "El futuro del trabajo",
      description: "Únete a una comunidad de creadores, aprendices e innovadores. Construye proyectos juntos, comparte conocimiento y convierte tus ideas en realidad con el equipo perfecto.",
      getStarted: "Comenzar",
      haveAccount: "Ya Tengo una Cuenta"
    },
    nav: {
      about: "Acerca de",
      legal: "Legal",
      featureRequest: "Solicitud de Función",
      testimonials: "Testimonios",
      support: "Apoyar",
      login: "Iniciar Sesión",
      signup: "Registrarse",
      termsOfService: "Términos de Servicio",
      privacyPolicy: "Política de Privacidad"
    },
    stats: {
      collaborators: "Colaboradores Activos",
      projects: "Proyectos Creados",
      countries: "Países Representados"
    },
    features: {
      title: "Todo lo que necesitas para colaborar",
      description: "Explora las poderosas funciones que hacen de Collab Unity la plataforma definitiva para que creadores, aprendices e innovadores construyan proyectos increíbles juntos."
    },
    howItWorks: {
      title: "Comienza a colaborar en minutos",
      subtitle: "Es simple, rápido y extremadamente efectivo"
    },
    cta: {
      title: "¿Listo para comenzar tu viaje?",
      description: "Únete a cientos de creadores, aprendices e innovadores construyendo proyectos increíbles juntos en Collab Unity.",
      button: "Comenzar Ahora"
    },
    footer: {
      contact: "Contacto",
      copyright: "© 2025 Collab Unity. Todos los derechos reservados."
    }
  },
  fr: {
    tagline: "Où les Idées Prennent Vie",
    hero: {
      title1: "Collab Unity",
      title2: "L'avenir du travail",
      description: "Rejoignez une communauté de créateurs, d'apprenants et d'innovateurs. Construisez des projets ensemble, partagez des connaissances et transformez vos idées en réalité avec l'équipe parfaite.",
      getStarted: "Commencer",
      haveAccount: "J'ai Déjà un Compte"
    },
    nav: {
      about: "À Propos",
      legal: "Juridique",
      featureRequest: "Demande de Fonctionnalité",
      testimonials: "Témoignages",
      support: "Soutenir",
      login: "Connexion",
      signup: "S'inscrire",
      termsOfService: "Conditions d'Utilisation",
      privacyPolicy: "Politique de Confidentialité"
    },
    stats: {
      collaborators: "Collaborateurs Actifs",
      projects: "Projets Créés",
      countries: "Pays Représentés"
    },
    features: {
      title: "Tout ce dont vous avez besoin pour collaborer",
      description: "Explorez les fonctionnalités puissantes qui font de Collab Unity la plateforme ultime pour que créateurs, apprenants et innovateurs construisent des projets incroyables ensemble."
    },
    howItWorks: {
      title: "Commencez à collaborer en quelques minutes",
      subtitle: "C'est simple, rapide et extrêmement efficace"
    },
    cta: {
      title: "Prêt à commencer votre voyage?",
      description: "Rejoignez des centaines de créateurs, d'apprenants et d'innovateurs qui construisent des projets incroyables ensemble sur Collab Unity.",
      button: "Commencer Maintenant"
    },
    footer: {
      contact: "Contact",
      copyright: "© 2025 Collab Unity. Tous droits réservés."
    }
  }
};

export default function Welcome() {
  const [language, setLanguage] = useState('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  const handleAuth = () => {
    window.location.href = "https://collabunity.io/login";
  };

  const stats = [
    { icon: Users, label: t.stats.collaborators, value: "30+" },
    { icon: Rocket, label: t.stats.projects, value: "50+" },
    { icon: Globe, label: t.stats.countries, value: "5+" }
  ];

  const values = [
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We believe in the power of creative ideas and collaborative innovation to solve real-world problems."
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a supportive, inclusive community where everyone can contribute and grow together."
    },
    {
      icon: BookOpen,
      title: "Learning",
      description: "Fostering continuous learning through hands-on project experience and peer collaboration."
    },
    {
      icon: Heart,
      title: "Passion",
      description: "Empowering people to work on projects they're truly passionate about with like-minded collaborators."
    }
  ];

  const demoFeatures = [
    {
      title: "Feed - Share Your Journey",
      icon: LayoutGrid,
      description: "Post updates, share progress, and celebrate milestones with the community",
      color: "purple",
      demoElements: [
        { icon: Globe, label: "Published Projects", desc: "Share live projects" },
        { icon: Image, label: "Highlights", desc: "Photos & videos" },
        { icon: MessageSquare, label: "Comments", desc: "Engage with community" }
      ],
      mockup: <FeedPostMockup />
    },
    {
      title: "Discover - Find Your Team",
      icon: Compass,
      description: "Explore projects seeking collaborators, apply to join, and connect with talented creators who share your interests",
      color: "blue",
      demoElements: [
        { icon: Search, label: "Browse Projects", desc: "Filter by skills & industry" },
        { icon: Users, label: "Find Collaborators", desc: "Discover people by expertise" },
        { icon: Sparkles, label: "AI Recommendations", desc: "Matched to your profile" },
        { icon: Briefcase, label: "Apply to Join", desc: "Send a custom message" }
      ],
      mockup: <DiscoverProjectsMockup />
    },
    {
      title: "Chat - Message In Real-Time",
      icon: MessageCircle,
      description: "Stay connected with your team through instant messaging and collaboration",
      color: "orange",
      demoElements: [
        { icon: MessageCircle, label: "Direct Messages", desc: "1-on-1 conversations" },
        { icon: Users, label: "Team Chats", desc: "Group discussions" },
        { icon: FileText, label: "Share Updates", desc: "Quick notifications" },
        { icon: CheckCircle, label: "Task Mentions", desc: "Coordinate work" }
      ],
      mockup: <ChatMockup />
    },
    {
      title: "Build Workspace",
      icon: Folder,
      description: "Your AI-powered project hub — chat with your Project Assistant and access all workspace sections in one unified space",
      color: "indigo",
      demoElements: [
        { icon: Sparkles, label: "Project Assistant", desc: "AI chat with full project context" },
        { icon: CheckSquare, label: "Tasks", desc: "Action items & daily work" },
        { icon: CheckCircle, label: "Milestones", desc: "Major goals & achievements" },
        { icon: FolderOpen, label: "Assets", desc: "Files, uploads & links" },
        { icon: BookOpen, label: "Notes", desc: "Thoughts & reflections" },
        { icon: Settings, label: "Tools", desc: "Integrated project tools" }
      ],
      mockup: <BuildWorkspaceMockup />
    },
    {
      title: "Profile - Showcase Your Work",
      icon: User,
      description: "Build your portfolio and highlight your skills with professional tools",
      color: "pink",
      demoElements: [
        { icon: FolderOpen, label: "Projects Portfolio", desc: "Display your work" },
        { icon: Users, label: "Skills & Endorsements", desc: "Build credibility" },
        { icon: FileText, label: "Generate Resume", desc: "AI-powered PDF resume" }
      ],
      mockup: <ProfileMockup />
    }
  ];

  const colorClasses = {
    purple: "from-purple-600 to-purple-700",
    blue: "from-blue-600 to-cyan-600",
    green: "from-green-600 to-emerald-600",
    orange: "from-orange-600 to-red-600",
    pink: "from-pink-600 to-purple-600",
    indigo: "from-indigo-600 to-purple-600"
  };

  const badgeColors = {
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    pink: "bg-pink-100 text-pink-700",
    indigo: "bg-indigo-100 text-indigo-700"
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
                alt="Collab Unity"
                className="w-8 h-8 rounded-lg"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
            </nav>

            <div className="flex items-center space-x-3">
              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-700 hover:text-purple-600">
                    <Globe className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('en')} className="cursor-pointer">
                    🇺🇸 English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('es')} className="cursor-pointer">
                    🇪🇸 Español
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('fr')} className="cursor-pointer">
                    🇫🇷 Français
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                onClick={handleAuth}
                className="text-gray-700 hover:text-purple-600"
              >
                {t.nav.login}
              </Button>
              <Button
                onClick={handleAuth}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {t.nav.signup}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-6xl sm:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                {t.hero.title1}
                <br />
                <span className="text-purple-600">{t.hero.title2}</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {t.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleAuth}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {t.hero.getStarted}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleAuth}
                  className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 text-lg px-8 py-6 rounded-xl"
                >
                  {t.hero.haveAccount}
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-purple-400 to-indigo-500 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full"></div>
                    <div className="w-8 h-8 bg-green-100 rounded-full"></div>
                    <div className="w-8 h-8 bg-orange-100 rounded-full"></div>
                    <span className="text-sm text-gray-600">+5 collaborators</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3">
                      <CheckSquare className="w-5 h-5 text-purple-600 mb-1" />
                      <div className="h-2 bg-purple-200 rounded w-full"></div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <MessageCircle className="w-5 h-5 text-blue-600 mb-1" />
                      <div className="h-2 bg-blue-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-semibold">Project Complete!</span>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4"
              >
                <div className="flex items-center space-x-2">
                  <HandHeart className="w-5 h-5 text-purple-600" /> {/* Changed from HatIcon */}
                  <span className="text-sm font-semibold">25 Applauds</span> {/* Changed from Hats Off */}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features Section - Integrated from Demos */}
      <section id="demos" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >

            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {t.features.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.features.description}
            </p>
          </motion.div>

          {/* Feature Demos */}
          <div className="space-y-16">
            {demoFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border border-gray-200 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-0">
                      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${!isEven ? 'lg:grid-flow-dense' : ''}`}>
                        {/* Content Side */}
                        <div className={`p-8 lg:p-12 flex flex-col justify-center ${!isEven ? 'lg:col-start-2' : ''}`}>
                          <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[feature.color]} rounded-2xl flex items-center justify-center mb-6`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            {feature.title}
                          </h2>
                          <p className="text-lg text-gray-600 mb-8">
                            {feature.description}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {feature.demoElements.map((element) => {
                              const ElementIcon = element.icon;
                              return (
                                <div key={element.label} className="flex items-start space-x-3">
                                  <div className={`w-10 h-10 ${badgeColors[feature.color]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                    <ElementIcon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">
                                      {element.label}
                                    </h4>
                                    <p className="text-xs text-gray-600">
                                      {element.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Visual Demo Side */}
                        <div className={`bg-gradient-to-br ${colorClasses[feature.color]} p-4 sm:p-8 lg:p-12 flex items-center justify-center ${!isEven ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                          <div className="w-full max-w-2xl">
                            {feature.mockup}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section - Integrated from About page */}
      <section id="about" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">About Collab Unity</h2>
            </div>
            <p className="text-gray-600 text-xl">{t.tagline}</p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="cu-card">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <Target className="w-6 h-6 mr-3 text-purple-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
                  </div>
                  <div className="space-y-4 text-gray-700">
                    <p className="text-lg leading-relaxed">
                      Collab Unity is a project-oriented collaboration platform designed to bring creators, 
                      learners, and innovators together. We believe that the best projects happen when 
                      passionate people unite around a shared vision.
                    </p>
                    <p className="leading-relaxed">
                      Our platform provides all the tools you need to find collaborators, manage projects, 
                      and bring your ideas to life—whether you're building a startup, learning new skills, 
                      working on a hobby project, or creating something for social good.
                    </p>
                    <p className="leading-relaxed">
                      We're committed to making collaboration accessible, efficient, and enjoyable for 
                      everyone, regardless of their background or experience level.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="cu-card">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Core Values</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {values.map((value, index) => {
                      const Icon = value.icon;
                      return (
                        <div key={value.title} className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{value.title}</h4>
                            <p className="text-sm text-gray-600">{value.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="cu-card">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">What Makes Us Different</h3>
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-purple-600 mt-1">1</Badge>
                      <div>
                        <h4 className="font-semibold mb-1">Project-First Approach</h4>
                        <p className="text-sm">Everything revolves around bringing your projects to life, not just networking.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-purple-600 mt-1">2</Badge>
                      <div>
                        <h4 className="font-semibold mb-1">Built-in Tools</h4>
                        <p className="text-sm">Task management, file sharing, and communication—all in one place.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-purple-600 mt-1">3</Badge>
                      <div>
                        <h4 className="font-semibold mb-1">Learning-Focused</h4>
                        <p className="text-sm">Grow your skills through hands-on collaboration with talented peers and curated resources.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-purple-600 mt-1">4</Badge>
                      <div>
                        <h4 className="font-semibold mb-1">Free & Open</h4>
                        <p className="text-sm">Core features are free. We believe great collaboration shouldn't have a price tag.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {t.howItWorks.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.howItWorks.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Your Profile",
                description: "Set up your profile and showcase your skills, interests, and what you're looking to build.",
                icon: Users
              },
              {
                step: "2",
                title: "Find or Start a Project",
                description: "Browse existing projects looking for collaborators or create your own and invite others to join.",
                icon: Lightbulb
              },
              {
                step: "3",
                title: "Collaborate & Build",
                description: "Work together using our built-in tools, share ideas, and bring your project to life.",
                icon: Rocket
              }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <Card className="h-full bg-white border-2 border-purple-100">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                        {step.step}
                      </div>
                      <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-7 h-7 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="w-8 h-8 text-purple-300" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 border-0 shadow-2xl">
              <CardContent className="p-12 text-center">
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                  {t.cta.title}
                </h2>
                <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                  {t.cta.description}
                </p>
                <Button
                  size="lg"
                  onClick={handleAuth}
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-12 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {t.cta.button}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Collab Unity
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "What is Collab Unity?",
                a: "Collab Unity is a project-based collaboration platform that connects creators, learners, and innovators. You can create or join projects, find collaborators with matching skills, manage your work with built-in tools, and share your progress with the community — all in one place."
              },
              {
                q: "Is Collab Unity free to use?",
                a: "Yes! Core features on Collab Unity are completely free. You can create projects, join collaborations, use the workspace tools, message teammates, and build your profile at no cost."
              },
              {
                q: "Who is Collab Unity for?",
                a: "Collab Unity is for anyone who wants to build something with others — students working on school projects, developers building apps, artists creating content, entrepreneurs launching startups, or hobbyists pursuing a passion. If you have an idea and want a team, Collab Unity is for you."
              },
              {
                q: "How do I find collaborators for my project?",
                a: "Once you create a project and list the skills you need, your project appears on the Discover page where other users can apply to join. You can also browse the Collaborators tab to find people by skill set and reach out directly. Our AI-powered matching also recommends relevant projects and people based on your profile."
              },
              {
                q: "How do I join an existing project?",
                a: "Head to the Discover page, browse projects, and click 'Apply' on any project that interests you. You'll send a short message to the project owner, and if they accept, you'll be added as a collaborator with full access to the project workspace."
              },
              {
                q: "What tools are available in the project workspace?",
                a: "Each project workspace includes an overview dashboard, milestone tracking, a task board, asset and file management, a rich-text ideation editor, an integrated tools hub, a team discussion board, and an activity log — everything your team needs to collaborate effectively."
              },
              {
                q: "Can I keep my project private?",
                a: "Yes. When creating or editing a project, you can set it to private so it won't appear on the public Feed or Discover pages. Only invited collaborators will have access."
              },
              {
                q: "How does the AI project generation work?",
                a: "On the Create Project page, you can describe your idea in plain language. Our AI will automatically suggest a project title, description, relevant skills, tools, industry classification, and more — giving you a head start so you can focus on building rather than filling out forms."
              },
              {
                q: "Can I showcase my work on my profile?",
                a: "Absolutely. Your profile includes sections for your projects, skills (with peer endorsements), a portfolio, collaborator reviews, and even an AI-generated resume you can download as a PDF. It's designed to be a living portfolio that grows as you collaborate."
              },
              {
                q: "How do I get started?",
                a: "Sign up for a free account, complete your profile with your skills and interests, and then either create your first project or explore the Discover page to find one to join. The whole process takes just a few minutes."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <details className="group border border-gray-200 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none bg-white hover:bg-gray-50 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.q}</h3>
                    <span className="flex-shrink-0 w-6 h-6 text-purple-600 transition-transform group-open:rotate-45">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 bg-gray-50">
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
                alt="Collab Unity"
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-xl font-bold text-white">Collab Unity</span>
            </div>
            <p className="text-gray-400 mb-6">
              Where Ideas Happen
            </p>
            <div className="flex items-center justify-center flex-wrap gap-6 text-sm">
              <Link to={createPageUrl("Contact")} className="hover:text-white transition-colors">
                {t.footer.contact}
              </Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-white transition-colors">
                {t.nav.termsOfService}
              </Link>
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-white transition-colors">
                {t.nav.privacyPolicy}
              </Link>
            </div>
          </div>
          <p className="text-gray-500 text-sm text-center">
            {t.footer.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}