import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X, ChevronRight, LayoutTemplate } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TEMPLATES = [
  {
    id: "mobile-app",
    emoji: "📱",
    name: "Mobile App",
    category: "Technology",
    tagline: "Build a native or cross-platform mobile application",
    description: "A mobile app project with a clear product vision, user stories, and technical foundation. Great for iOS/Android apps, utility tools, or consumer products.",
    project_type: "Collaborative",
    classification: "startup",
    industry: "technology",
    area_of_interest: "Mobile Dev",
    skills_needed: ["React Native", "iOS Development", "Android Development", "UI/UX Design", "Backend Development"],
    tools_needed: ["Figma", "Xcode", "Android Studio", "Firebase", "GitHub"],
  },
  {
    id: "web-platform",
    emoji: "🌐",
    name: "Web Platform",
    category: "Technology",
    tagline: "Create a full-stack web application or SaaS product",
    description: "A web platform project designed for scalable SaaS or community tools. Includes frontend, backend, and database layers.",
    project_type: "Collaborative",
    classification: "startup",
    industry: "technology",
    area_of_interest: "Web Dev",
    skills_needed: ["React", "Node.js", "PostgreSQL", "UI/UX Design", "DevOps"],
    tools_needed: ["Figma", "GitHub", "Vercel", "Supabase", "Postman"],
  },
  {
    id: "social-impact",
    emoji: "🌍",
    name: "Social Impact",
    category: "Nonprofit",
    tagline: "Launch a project that makes a positive difference",
    description: "A mission-driven project focused on community good, advocacy, or awareness. Build something meaningful with a team that cares.",
    project_type: "Collaborative",
    classification: "nonprofit",
    industry: "social_good",
    area_of_interest: "Social Good",
    skills_needed: ["Project Management", "Community Outreach", "Content Writing", "Social Media", "Fundraising"],
    tools_needed: ["Notion", "Canva", "Mailchimp", "Google Docs", "Slack"],
  },
  {
    id: "creative-content",
    emoji: "🎨",
    name: "Creative Content",
    category: "Art & Design",
    tagline: "Produce a creative work — film, art, music, or writing",
    description: "A creative production project for artists, writers, musicians, or filmmakers looking to collaborate on an original work.",
    project_type: "Collaborative",
    classification: "hobby",
    industry: "entertainment_media",
    area_of_interest: "Creative Arts",
    skills_needed: ["Graphic Design", "Video Editing", "Copywriting", "Photography", "Illustration"],
    tools_needed: ["Adobe Creative Suite", "DaVinci Resolve", "Notion", "Canva", "Figma"],
  },
  {
    id: "educational-course",
    emoji: "📚",
    name: "Educational Course",
    category: "Education",
    tagline: "Create a curriculum, course, or learning resource",
    description: "An educational project to design and deliver structured learning experiences — online courses, workshops, or study guides.",
    project_type: "Collaborative",
    classification: "educational",
    industry: "education",
    area_of_interest: "Education",
    skills_needed: ["Curriculum Design", "Content Writing", "Video Production", "Instructional Design", "Research"],
    tools_needed: ["Notion", "Loom", "Google Docs", "Canva", "Teachable"],
  },
  {
    id: "data-research",
    emoji: "🔬",
    name: "Data & Research",
    category: "Science",
    tagline: "Conduct research or build a data-driven project",
    description: "A research or analytics project for scientists, data analysts, or academics exploring a topic with data and evidence.",
    project_type: "Collaborative",
    classification: "educational",
    industry: "science_research",
    area_of_interest: "Data Science",
    skills_needed: ["Data Analysis", "Python", "Statistics", "Research Writing", "Data Visualization"],
    tools_needed: ["Jupyter Notebook", "Python", "R", "Tableau", "Google Sheets"],
  },
  {
    id: "ecommerce",
    emoji: "🛒",
    name: "E-commerce Store",
    category: "Business",
    tagline: "Launch an online store or marketplace",
    description: "An e-commerce project to build and launch a product-based or service-based online store with payment and logistics.",
    project_type: "Collaborative",
    classification: "business",
    industry: "e_commerce_retail",
    area_of_interest: "E-commerce",
    skills_needed: ["E-commerce Development", "UI/UX Design", "Digital Marketing", "SEO", "Product Photography"],
    tools_needed: ["Shopify", "Figma", "Google Analytics", "Mailchimp", "Stripe"],
  },
  {
    id: "game-development",
    emoji: "🎮",
    name: "Game Development",
    category: "Entertainment",
    tagline: "Build a video game or interactive experience",
    description: "A game development project for indie devs, designers, and storytellers building a unique gaming experience.",
    project_type: "Collaborative",
    classification: "hobby",
    industry: "entertainment_media",
    area_of_interest: "Game Dev",
    skills_needed: ["Unity", "Game Design", "3D Modeling", "Sound Design", "C#"],
    tools_needed: ["Unity", "Blender", "GitHub", "Audacity", "Trello"],
  },
  {
    id: "personal-portfolio",
    emoji: "💼",
    name: "Personal Portfolio",
    category: "Career",
    tagline: "Build a portfolio to showcase your work and skills",
    description: "A personal project to design and develop a portfolio website or presentation that highlights your skills and past work.",
    project_type: "Personal",
    classification: "career_development",
    industry: "art_design",
    area_of_interest: "Portfolio",
    skills_needed: ["Web Development", "UI/UX Design", "Copywriting", "SEO", "Branding"],
    tools_needed: ["Figma", "React", "GitHub", "Vercel", "Notion"],
  },
  {
    id: "healthcare-app",
    emoji: "🏥",
    name: "Healthcare App",
    category: "Healthcare",
    tagline: "Build a health or wellness digital product",
    description: "A health-tech project focused on patient care, wellness tracking, or medical information — designed with privacy and compliance in mind.",
    project_type: "Collaborative",
    classification: "startup",
    industry: "healthcare",
    area_of_interest: "Health Tech",
    skills_needed: ["Mobile Development", "UI/UX Design", "HIPAA Compliance", "Backend Development", "Healthcare Knowledge"],
    tools_needed: ["Figma", "React Native", "Firebase", "GitHub", "Notion"],
  },
  {
    id: "fintech",
    emoji: "💰",
    name: "Fintech Product",
    category: "Finance",
    tagline: "Create a financial tool or service",
    description: "A fintech project to build payment tools, budgeting apps, investment platforms, or financial literacy resources.",
    project_type: "Collaborative",
    classification: "startup",
    industry: "finance",
    area_of_interest: "Fintech",
    skills_needed: ["Backend Development", "Security", "UI/UX Design", "API Integration", "Financial Modeling"],
    tools_needed: ["Stripe", "Plaid", "Figma", "GitHub", "PostgreSQL"],
  },
  {
    id: "open-source",
    emoji: "🛠️",
    name: "Open Source Tool",
    category: "Technology",
    tagline: "Build a developer tool or open-source library",
    description: "An open-source project to build tools, libraries, or SDKs for the developer community. Community-first and documentation-driven.",
    project_type: "Collaborative",
    classification: "hobby",
    industry: "technology",
    area_of_interest: "Open Source",
    skills_needed: ["Software Engineering", "Documentation", "Testing", "DevOps", "API Design"],
    tools_needed: ["GitHub", "VS Code", "Docker", "CI/CD", "Markdown"],
  },
];

const CATEGORIES = ["All", "Technology", "Business", "Nonprofit", "Education", "Art & Design", "Science", "Entertainment", "Healthcare", "Finance", "Career"];

export default function ProjectTemplatesSelector({ onSelectTemplate, onClose }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = TEMPLATES.filter(t => {
    const matchesSearch = !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tagline.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Choose a Template</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-3 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide flex-shrink-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <LayoutTemplate className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No templates match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
            <AnimatePresence mode="popLayout">
              {filtered.map(template => (
                <motion.button
                  key={template.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onSelectTemplate(template)}
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                    hoveredId === template.id
                      ? "border-purple-400 bg-purple-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{template.emoji}</span>
                    <ChevronRight className={`w-4 h-4 mt-1 transition-colors ${hoveredId === template.id ? "text-purple-600" : "text-gray-300"}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{template.tagline}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge className="text-xs bg-purple-100 text-purple-700 border-0">{template.category}</Badge>
                    <Badge variant="outline" className="text-xs text-gray-500">{template.skills_needed.length} skills</Badge>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}