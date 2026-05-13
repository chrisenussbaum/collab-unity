import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Search, BookOpen, Video, Headphones, FileText, Users, ExternalLink, Sparkles, Loader2, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CATEGORIES = [
  { label: "All", icon: null },
  { label: "Design", icon: "🎨" },
  { label: "Development", icon: "💻" },
  { label: "Business", icon: "📈" },
  { label: "Marketing", icon: "📣" },
  { label: "Creative", icon: "✨" },
  { label: "Leadership", icon: "🧭" },
  { label: "Productivity", icon: "⚡" },
];

const FORMAT_ICONS = {
  Video: <Video className="w-4 h-4" />,
  Article: <FileText className="w-4 h-4" />,
  "Audio Book": <Headphones className="w-4 h-4" />,
  Workshop: <Users className="w-4 h-4" />,
  Course: <BookOpen className="w-4 h-4" />,
};

const RESOURCES = [
  { id: 1, title: "Figma for Beginners: Complete UI/UX Course", category: "Design", format: "Course", url: "https://www.youtube.com/watch?v=fZ0D0cnR88E", description: "Learn Figma from scratch — components, auto-layout, prototyping and more.", difficulty: "Beginner", duration: "4 hrs", free: true },
  { id: 2, title: "The Lean Startup by Eric Ries", category: "Business", format: "Audio Book", url: "https://www.audible.com/pd/The-Lean-Startup-Audiobook/B005LXV0HI", description: "How today's entrepreneurs use continuous innovation to create radically successful businesses.", difficulty: "Intermediate", duration: "8 hrs", free: false },
  { id: 3, title: "CS50: Introduction to Computer Science", category: "Development", format: "Course", url: "https://cs50.harvard.edu/x/", description: "Harvard's legendary intro to CS — free, rigorous and highly recommended.", difficulty: "Beginner", duration: "12 hrs", free: true },
  { id: 4, title: "How to Build a Startup (Steve Blank)", category: "Business", format: "Course", url: "https://www.udacity.com/course/how-to-build-a-startup--ep245", description: "The Customer Development process and how to turn an idea into a successful business.", difficulty: "Intermediate", duration: "6 hrs", free: true },
  { id: 5, title: "SEO Fundamentals by Semrush", category: "Marketing", format: "Course", url: "https://www.semrush.com/academy/courses/seo-fundamentals-course-with-greg-gifford/", description: "Master the basics of SEO and start ranking your content higher.", difficulty: "Beginner", duration: "3 hrs", free: true },
  { id: 6, title: "Deep Work by Cal Newport", category: "Productivity", format: "Audio Book", url: "https://www.audible.com/pd/Deep-Work-Audiobook/B0189PX1RW", description: "Rules for focused success in a distracted world.", difficulty: "Beginner", duration: "7 hrs", free: false },
  { id: 7, title: "The Design of Everyday Things", category: "Design", format: "Article", url: "https://www.nngroup.com/books/design-everyday-things-revised/", description: "A must-read classic on user-centered design and usability.", difficulty: "Beginner", duration: "45 min read", free: false },
  { id: 8, title: "JavaScript 30", category: "Development", format: "Workshop", url: "https://javascript30.com/", description: "Build 30 things in 30 days with 30 tutorials — no frameworks, no compilers.", difficulty: "Intermediate", duration: "30 days", free: true },
  { id: 9, title: "Content Marketing Masterclass", category: "Marketing", format: "Video", url: "https://www.youtube.com/watch?v=RnLmS-5mCEY", description: "A comprehensive guide to creating content that attracts and retains audiences.", difficulty: "Intermediate", duration: "2 hrs", free: true },
  { id: 10, title: "Atomic Habits by James Clear", category: "Productivity", format: "Audio Book", url: "https://www.audible.com/pd/Atomic-Habits-Audiobook/1524779261", description: "An easy and proven way to build good habits and break bad ones.", difficulty: "Beginner", duration: "5 hrs", free: false },
  { id: 11, title: "Storytelling for Creatives", category: "Creative", format: "Workshop", url: "https://www.skillshare.com/en/classes/Storytelling-101/", description: "Learn the fundamentals of compelling storytelling across mediums.", difficulty: "Beginner", duration: "2 hrs", free: false },
  { id: 12, title: "Leaders Eat Last by Simon Sinek", category: "Leadership", format: "Video", url: "https://www.youtube.com/watch?v=ReRcHdeUG9Y", description: "Why some teams pull together and others don't — a talk by Simon Sinek.", difficulty: "Intermediate", duration: "45 min", free: true },
];

const difficultyColor = { Beginner: "bg-green-100 text-green-700", Intermediate: "bg-yellow-100 text-yellow-700", Advanced: "bg-red-100 text-red-700" };

export default function LearningHub({ currentUser }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [aiTopic, setAiTopic] = useState("");
  const [aiResults, setAiResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [resources, setResources] = useState(RESOURCES);

  useEffect(() => {
    base44.entities.LearningResource.list().then(data => {
      if (data && data.length > 0) setResources(data);
    }).catch(() => {});
  }, []);

  const filtered = resources.filter(r => {
    const matchesSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAiSearch = async (topicOverride) => {
    const topic = (topicOverride || aiTopic).trim();
    if (!topic) return;
    if (topicOverride) setAiTopic(topicOverride);
    setAiLoading(true);
    setAiResults([]);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a learning resource curator for a collaborative project platform.
The user wants to learn about: "${topic}".
Suggest 6 real, specific learning resources (articles, videos, courses, books) that would be genuinely helpful.
Use well-known platforms: YouTube, Coursera, Udemy, freeCodeCamp, MDN, Khan Academy, Harvard OpenCourseWare, edX, Skillshare, Medium, dev.to, etc.
For each resource provide: title, url (a real existing URL), platform, format (one of: Video, Article, Course, Book, Workshop), a one-sentence description, and free (true/false).
Only return resources you are confident actually exist.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            resources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  platform: { type: "string" },
                  format: { type: "string" },
                  description: { type: "string" },
                  free: { type: "boolean" }
                }
              }
            }
          }
        }
      });
      const found = result?.resources || [];
      if (found.length === 0) {
        toast.error("No resources found for that topic. Try rephrasing.");
      }
      setAiResults(found);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // When the main search bar has a query that yields no local results, offer AI search
  const handleMainSearchAI = () => {
    handleAiSearch(searchQuery);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12 -mt-14 pt-28 sm:-mt-16 sm:pt-32">
        <div className="cu-container mb-4">
          <button
            onClick={() => navigate("/Discover")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:border-purple-400 hover:text-purple-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Discover
          </button>
        </div>
        <div className="cu-container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl cu-gradient flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Learning <span style={{ color: "var(--cu-primary)" }}>Hub</span></h1>
            <p className="text-gray-600 max-w-xl mx-auto">Curated resources to level up your skills and bring your projects to life.</p>
          </motion.div>
        </div>
      </div>

      <div className="cu-container cu-page">
        {/* AI Search */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-gray-900">Resource Finder</h2>
          </div>
          <p className="text-sm text-gray-600 mb-3">Tell us what you want to learn and we'll find resources for you.</p>
          <div className="flex gap-2">
            <Input
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              placeholder="e.g. React hooks, pitch decks, video editing..."
              className="bg-white"
              onKeyDown={e => e.key === "Enter" && handleAiSearch()}
            />
            <Button onClick={handleAiSearch} disabled={aiLoading || !aiTopic.trim()} style={{ background: "var(--cu-primary)" }} className="text-white flex-shrink-0">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          </div>
          {aiLoading && (
            <div className="mt-4 flex items-center gap-3 text-sm text-purple-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching the web for resources on "{aiTopic}"…
            </div>
          )}
          {aiResults.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Results for "{aiTopic}"</p>
                <button onClick={() => setAiResults([])} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Clear</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {aiResults.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="bg-white rounded-lg border border-purple-100 p-3 hover:border-purple-400 transition-colors group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900 group-hover:text-purple-700 line-clamp-1">{r.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.platform} · {r.format} · {r.free ? "Free" : "Paid"}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.description}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Browse */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center">
          <div className="relative flex-1">
            <Input placeholder="Search resources..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-white" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.label ? "cu-gradient text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700"}`}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                <Card className="cu-card h-full flex flex-col hover:border-purple-300 transition-all overflow-hidden group">
                  <div className="relative w-full h-32 overflow-hidden bg-gray-100">
                    <img
                      src={`https://api.microlink.io/?url=${encodeURIComponent(r.url)}&screenshot=true&meta=false&embed=screenshot.url`}
                      alt={`${r.title} preview`}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-600">{FORMAT_ICONS[r.format] || <BookOpen className="w-4 h-4" />}</span>
                      <span className="text-xs text-gray-500 font-medium">{r.format}</span>
                      {r.free && <Badge className="text-xs bg-green-100 text-green-700 ml-auto">Free</Badge>}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors">{r.title}</h3>
                  </CardHeader>
                  <CardContent className="flex-1 pb-2">
                    <p className="text-xs text-gray-600 line-clamp-3">{r.description}</p>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex items-center gap-2">
                    <Badge className={`text-xs ${difficultyColor[r.difficulty] || "bg-gray-100 text-gray-700"}`}>{r.difficulty}</Badge>
                    <span className="text-xs text-gray-400 ml-auto">{r.duration}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </CardFooter>
                </Card>
              </a>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium mb-2">No resources found for "{searchQuery}".</p>
            {searchQuery && (
              <Button
                onClick={handleMainSearchAI}
                disabled={aiLoading}
                style={{ background: "var(--cu-primary)" }}
                className="text-white mt-2"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Find with AI
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}