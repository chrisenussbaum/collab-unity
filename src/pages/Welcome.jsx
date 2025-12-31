import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Lightbulb,
  Users,
  Code,
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
  MoreHorizontal,
  Share2,
  DollarSign,
  HandHeart,
  Briefcase,
  Menu,
  X,
  Image,
  FolderOpen
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
  const [activeTab, setActiveTab] = React.useState('published');
  
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex items-start space-x-3 mb-4">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
            alt="User"
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Blogs</h3>
            <p className="text-sm text-gray-600">John Snow • 2 days ago</p>
          </div>
          {/* Modified section: Added Share2 and wrapped buttons */}
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          {/* End modified section */}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className="bg-blue-100 text-blue-700 border-0">In Progress</Badge>
          <Badge className="bg-purple-100 text-purple-700 border-0">Educational</Badge>
          <Badge className="bg-green-100 text-green-700 border-0">Career Development</Badge>
          <div className="flex items-center text-purple-600 text-sm">
            <div className="flex items-center -space-x-2 mr-2">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces"
                alt="Collaborator 1"
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces"
                alt="Collaborator 2"
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
                alt="Collaborator 3"
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
              />
            </div>
            <span>3 collaborators</span>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4 leading-relaxed">
          Focusing on a new marketing campaign for Dell.
          We're making great progress on campaign!
        </p>
        
        {/* Content Toggle Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('published')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'published'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🔗 Showcase
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'highlights'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📸 Highlights
          </button>
        </div>

        {/* Fixed Height Container for Tab Content */}
        <div className="mb-4 h-[280px]">
          {/* Published Tab Content */}
          {activeTab === 'published' && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-gray-500">medium.com</span>
                <img 
                  src="https://www.google.com/s2/favicons?sz=64&domain_url=medium.com"
                  alt="Medium"
                  className="w-4 h-4"
                />
              </div>
              <div className="flex-1 bg-white rounded p-6 flex items-center justify-center border border-gray-200">
                <div className="text-center">
                  <img 
                    src="https://www.google.com/s2/favicons?sz=128&domain_url=medium.com"
                    alt="Medium"
                    className="w-16 h-16 mx-auto mb-2 object-contain"
                  />
                  <p className="text-sm font-medium text-gray-900">Published Project</p>
                  <p className="text-xs text-gray-500 mt-1">Click to visit</p>
                </div>
              </div>
            </div>
          )}

          {/* Highlights Tab Content */}
          {activeTab === 'highlights' && (
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 h-full relative">
              <img 
                src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=400&fit=crop"
                alt="Project Highlight"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm">Team brainstorming session - curating a content calendar for January.</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" />Remote</div>
          <div className="flex items-center"><Building2 className="w-4 h-4 mr-1" />Technology</div>
          <div className="flex items-center"><Tag className="w-4 h-4 mr-1" />Education</div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4 pt-4 border-t">
          <Badge variant="secondary" className="text-xs">Blogging</Badge>
          <Badge variant="secondary" className="text-xs">Content</Badge>
          <Badge variant="secondary" className="text-xs">Marketing</Badge>
          <Badge variant="secondary" className="text-xs">Journalism</Badge>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
            <HandHeart className="w-5 h-5" /> {/* Changed from HatIcon */}
            <span className="text-sm font-medium">Applaud</span> {/* Changed from Hats Off */}
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          {/* Modified button: Changed icon from ArrowRight to DollarSign and text */}
          <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Fund</span>
          </button>
          {/* End modified section */}
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
        { name: "Podcast Platform", type: "In Progress", image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=100&fit=crop", industry: "Media", collaborators: 7, desc: "Audio streaming service for independent creators with built-in monetization tools", skills: ["Video Editing", "Scripting"] }
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

const SyncChatMockup = () => {
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

const WorkspaceMockup = () => {
  const [activeTab, setActiveTab] = React.useState("tools");
  
  const tabs = [
    { id: "discussion", icon: MessageSquare, label: "Discussion" },
    { id: "ideate", icon: Lightbulb, label: "Ideate" },
    { id: "tasks", icon: CheckSquare, label: "Tasks" },
    { id: "tools", icon: Settings, label: "Tools" },
    { id: "assets", icon: Folder, label: "Assets" }
  ];

  const tabContent = {
    discussion: (
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Team Discussions</h3>
        <p className="text-sm text-gray-600 mb-4">Collaborate and communicate with your team</p>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces" alt="Alex" className="w-8 h-8 rounded-full object-cover" />
              <div className="flex-1">
                <p className="font-medium text-sm">Alex started a discussion</p>
                <p className="text-sm text-gray-600 mt-1">What's everyone's availability for this week?</p>
                <p className="text-xs text-gray-400 mt-2">2 hours ago</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" alt="Sarah" className="w-8 h-8 rounded-full object-cover" />
              <div className="flex-1">
                <p className="font-medium text-sm">Sarah posted an update</p>
                <p className="text-sm text-gray-600 mt-1">Design review is scheduled for Friday</p>
                <p className="text-xs text-gray-400 mt-2">5 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    ideate: (
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ideation Board</h3>
        <p className="text-sm text-gray-600 mb-4">Brainstorm and capture ideas together</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium">💡 Feature Idea</p>
            <p className="text-xs text-gray-600 mt-2">Add dark mode support</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium">🎯 Goal</p>
            <p className="text-xs text-gray-600 mt-2">Launch beta by end of month</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium">✅ Decision</p>
            <p className="text-xs text-gray-600 mt-2">Use React for frontend</p>
          </div>
          <div className="p-4 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
            <span className="text-2xl">+</span>
          </div>
        </div>
      </div>
    ),
    tasks: (
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Task Board</h3>
        <p className="text-sm text-gray-600 mb-4">Track progress and manage work</p>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <input type="checkbox" className="w-4 h-4 rounded" />
            <div className="flex-1">
              <p className="text-sm font-medium">Design landing page</p>
              <p className="text-xs text-gray-500">Due: Tomorrow</p>
            </div>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">High</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <input type="checkbox" className="w-4 h-4 rounded" />
            <div className="flex-1">
              <p className="text-sm font-medium">Review pull requests</p>
              <p className="text-xs text-gray-500">Due: Friday</p>
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Medium</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg opacity-60">
            <input type="checkbox" checked readOnly className="w-4 h-4 rounded" />
            <div className="flex-1">
              <p className="text-sm font-medium line-through">Setup repository</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>
    ),
    tools: (
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Project Tools</h3>
        <p className="text-sm text-gray-600 mb-6">Add and manage tools your team uses for collaboration</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { name: "GitHub", url: "github.com/project", icon: "🐙" },
            { name: "Figma", url: "figma.com/design", icon: "🎨" }
          ].map((tool, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl border border-gray-200">
                    {tool.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{tool.name}</h4>
                    <p className="text-xs text-gray-500">{tool.url}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
        <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center space-x-2">
          <span className="text-2xl">+</span>
          <span className="font-medium">Add Custom Tool</span>
        </button>
      </div>
    ),
    assets: (
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Project Assets</h3>
        <p className="text-sm text-gray-600 mb-4">Manage files and resources</p>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
            <FileText className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">design-mockups.fig</p>
              <p className="text-xs text-gray-500">Updated 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
            <FileText className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">project-brief.pdf</p>
              <p className="text-xs text-gray-500">Updated yesterday</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
            <FileText className="w-5 h-5 text-purple-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">brand-guidelines.pdf</p>
              <p className="text-xs text-gray-500">Updated last week</p>
            </div>
          </div>
        </div>
      </div>
    )
  };

  return (
  <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
    <div className="border-b border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-1 p-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
    
    <div className="p-6">
      {tabContent[activeTab]}
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
      title2: "Where Your Ideas Are Realized",
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
    { icon: Users, label: t.stats.collaborators, value: "10+" },
    { icon: Rocket, label: t.stats.projects, value: "20+" },
    { icon: Globe, label: t.stats.countries, value: "1+" }
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
        { icon: Globe, label: "Published Links", desc: "Share live projects" },
        { icon: Image, label: "Highlights", desc: "Photos & videos" },
        { icon: MessageSquare, label: "Comments", desc: "Engage with community" }
      ],
      mockup: <FeedPostMockup />
    },
    {
      title: "Discover - Find Your Team",
      icon: Compass,
      description: "Browse projects looking for collaborators and connect with talented creators",
      color: "blue",
      demoElements: [
        { icon: Search, label: "Browse Projects", desc: "Click cards to view" },
        { icon: Users, label: "Find Collaborators", desc: "Connect with creators" },
        { icon: Settings, label: "Smart Filters", desc: "Match by skills & interests" },
        { icon: Briefcase, label: "Quick Apply", desc: "Send custom message" }
      ],
      mockup: <DiscoverProjectsMockup />
    },
    {
      title: "Chat - Message In Real-Time",
      icon: MessageCircle,
      description: "Stay connected with your team through instant messaging and collaboration",
      color: "green",
      demoElements: [
        { icon: MessageCircle, label: "Direct Messages", desc: "1-on-1 conversations" },
        { icon: Users, label: "Team Chats", desc: "Group discussions" },
        { icon: FileText, label: "Share Updates", desc: "Quick notifications" },
        { icon: CheckSquare, label: "Task Mentions", desc: "Coordinate work" }
      ],
      mockup: <SyncChatMockup />
    },
    {
      title: "Workspace - Collaborate Seamlessly",
      icon: Folder,
      description: "Everything you need to build together in one integrated workspace",
      color: "orange",
      demoElements: [
        { icon: MessageSquare, label: "Discussion", desc: "Team communication" },
        { icon: Lightbulb, label: "Ideate", desc: "Rich text planning" },
        { icon: CheckSquare, label: "Tasks", desc: "Track progress" },
        { icon: Settings, label: "Tools", desc: "Integrated links" },
        { icon: Folder, label: "Assets", desc: "Manage files" }
      ],
      mockup: <WorkspaceMockup />
    },
    {
      title: "Profile - Showcase Your Work",
      icon: User,
      description: "Build your portfolio and highlight your skills and achievements",
      color: "indigo",
      demoElements: [
        { icon: FolderOpen, label: "Projects Portfolio", desc: "Display your work" },
        { icon: Users, label: "Skills & Endorsements", desc: "Build credibility" },
        { icon: FileText, label: "Education & Awards", desc: "Share achievements" },
        { icon: FileText, label: "Generate Resume", desc: "PDF download" }
      ],
      mockup: <ProfileMockup />
    }
  ];

  const colorClasses = {
    purple: "from-purple-500 to-indigo-600",
    blue: "from-blue-500 to-cyan-600",
    green: "from-green-500 to-emerald-600",
    orange: "from-orange-500 to-red-600",
    pink: "from-pink-500 to-purple-600",
    indigo: "from-indigo-500 to-purple-600"
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50">
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
              <Link to={createPageUrl("Testimonials")}>
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  {t.nav.testimonials}
                </Button>
              </Link>
              <Link to={createPageUrl("Support")}>
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  {t.nav.support}
                </Button>
              </Link>
              <Link to={createPageUrl("FeatureRequest")}>
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  {t.nav.featureRequest}
                </Button>
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-purple-600"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

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

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <nav className="py-4 px-4 space-y-2">
              <Link to={createPageUrl("Testimonials")} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-purple-600">
                  {t.nav.testimonials}
                </Button>
              </Link>
              <Link to={createPageUrl("Support")} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-purple-600">
                  {t.nav.support}
                </Button>
              </Link>
              <Link to={createPageUrl("FeatureRequest")} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-purple-600">
                  {t.nav.featureRequest}
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
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
      <section className="py-16 bg-white">
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
      <section id="demos" className="py-20 px-4 sm:px-6 lg:px-8">
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
                  <Card className="overflow-hidden border-2 border-gray-100 hover:border-purple-200 transition-colors">
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
      <section id="about" className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50 px-4 sm:px-6 lg:px-8">
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
      <section className="py-20 bg-white px-4 sm:px-6 lg:px-8">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8">
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