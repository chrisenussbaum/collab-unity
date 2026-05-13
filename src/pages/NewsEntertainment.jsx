import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tv, Search, ExternalLink, Loader2, Flame, Globe, Lightbulb, Briefcase, Palette, Cpu, Music, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const FALLBACK_NEWS_SOURCES = [
  { name: "TechCrunch", url: "https://techcrunch.com", category: "Tech", description: "Startup and technology news", color: "bg-green-50 border-green-200" },
  { name: "The Verge", url: "https://theverge.com", category: "Tech", description: "Tech, science, art & culture", color: "bg-blue-50 border-blue-200" },
  { name: "Fast Company", url: "https://fastcompany.com", category: "Business", description: "Business, innovation & design", color: "bg-orange-50 border-orange-200" },
  { name: "Hacker News", url: "https://news.ycombinator.com", category: "Tech", description: "Top tech & startup discussions", color: "bg-amber-50 border-amber-200" },
  { name: "Dezeen", url: "https://dezeen.com", category: "Design", description: "Architecture & design inspiration", color: "bg-pink-50 border-pink-200" },
  { name: "Variety", url: "https://variety.com", category: "Entertainment", description: "Film, TV & entertainment news", color: "bg-purple-50 border-purple-200" },
  { name: "Billboard", url: "https://billboard.com", category: "Entertainment", description: "Music charts & artist news", color: "bg-red-50 border-red-200" },
  { name: "ESPN", url: "https://espn.com", category: "Sports", description: "Live scores & sports news", color: "bg-yellow-50 border-yellow-200" },
  { name: "Science Daily", url: "https://sciencedaily.com", category: "Science", description: "Latest scientific discoveries", color: "bg-teal-50 border-teal-200" },
  { name: "Wired", url: "https://wired.com", category: "Tech", description: "Future of technology & culture", color: "bg-indigo-50 border-indigo-200" },
  { name: "Harvard Business Review", url: "https://hbr.org", category: "Business", description: "Management & business insights", color: "bg-slate-50 border-slate-200" },
  { name: "Awwwards", url: "https://awwwards.com", category: "Design", description: "Award-winning web design", color: "bg-rose-50 border-rose-200" },
];

const CATEGORIES = [
  { label: "All", icon: Globe },
  { label: "Tech", icon: Cpu },
  { label: "Business", icon: Briefcase },
  { label: "Design", icon: Palette },
  { label: "Entertainment", icon: Music },
  { label: "Sports", icon: Trophy },
  { label: "Science", icon: Lightbulb },
];

const TRENDING_TOPICS = [
  "AI & Machine Learning", "Startup Funding", "Remote Work", "Web3", "Climate Tech",
  "Creator Economy", "Space Exploration", "Mental Health", "Electric Vehicles", "Metaverse",
];

// Curated YouTube channels / playlists by category
const VIDEOS = [
  { id: "dQw4w9WgXcQ", title: "Y Combinator: How to Start a Startup", category: "Business", channel: "Y Combinator", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg" },
  { id: "aircAruvnKk", title: "But what is a neural network?", category: "Tech", channel: "3Blue1Brown", thumbnail: "https://img.youtube.com/vi/aircAruvnKk/mqdefault.jpg" },
  { id: "XbDmxEOj9OY", title: "The Future of UI/UX Design", category: "Design", channel: "Figma", thumbnail: "https://img.youtube.com/vi/XbDmxEOj9OY/mqdefault.jpg" },
  { id: "9bZkp7q19f0", title: "Gangnam Style (Global Phenomenon)", category: "Entertainment", channel: "PSY", thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg" },
  { id: "kCc8FmEb1nY", title: "Let's build GPT from scratch", category: "Tech", channel: "Andrej Karpathy", thumbnail: "https://img.youtube.com/vi/kCc8FmEb1nY/mqdefault.jpg" },
  { id: "2ePf9rue1Ao", title: "How I Built a $1M Business", category: "Business", channel: "My First Million", thumbnail: "https://img.youtube.com/vi/2ePf9rue1Ao/mqdefault.jpg" },
  { id: "RnLmS-5mCEY", title: "Content Marketing Masterclass", category: "Business", channel: "Marketing Explained", thumbnail: "https://img.youtube.com/vi/RnLmS-5mCEY/mqdefault.jpg" },
  { id: "KPoeNZZ6H4s", title: "James Webb Telescope: New Images", category: "Science", channel: "NASA", thumbnail: "https://img.youtube.com/vi/KPoeNZZ6H4s/mqdefault.jpg" },
];

// Curated news feeds by category
const getFavicon = (url) => `https://www.google.com/s2/favicons?domain=${url}&sz=64`;

export default function NewsEntertainment({ currentUser }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("news"); // "news" | "videos"
  const [aiHeadlines, setAiHeadlines] = useState([]);
  const [loadingHeadlines, setLoadingHeadlines] = useState(false);
  const [headlinesFetched, setHeadlinesFetched] = useState(false);
  const [newsSources, setNewsSources] = useState(FALLBACK_NEWS_SOURCES);
  const [trendingTopic, setTrendingTopic] = useState(null);

  useEffect(() => {
    base44.entities.NewsSource.list().then(data => {
      if (data && data.length > 0) setNewsSources(data);
    }).catch(() => {});
  }, []);

  // Auto-load headlines on mount
  useEffect(() => {
    fetchAiHeadlines();
  }, []);

  const fetchAiHeadlines = async (topic = null) => {
    setLoadingHeadlines(true);
    const topicClause = topic ? `Focus specifically on the topic: "${topic}".` : "Cover a broad mix of tech, business, design, entertainment, and science.";
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a news curator. Generate 8 realistic, engaging trending headlines from today (${new Date().toDateString()}). ${topicClause} Make them feel current, specific, and relevant to creators and entrepreneurs. For each headline, include a real URL to the actual article or a search URL on the source's website.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          headlines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headline: { type: "string" },
                category: { type: "string" },
                summary: { type: "string" },
                source: { type: "string" },
                url: { type: "string" }
              }
            }
          }
        }
      }
    });
    setAiHeadlines(result?.headlines || []);
    setLoadingHeadlines(false);
    setHeadlinesFetched(true);
  };

  const handleTrendingTopicClick = (topic) => {
    setTrendingTopic(topic);
    fetchAiHeadlines(topic);
  };

  const filteredSources = newsSources.filter(s => {
    const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredVideos = VIDEOS.filter(v => {
    const matchesCategory = selectedCategory === "All" || v.category === selectedCategory;
    const matchesSearch = !searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.channel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryHeadlineColors = {
    Tech: "bg-blue-100 text-blue-700",
    Business: "bg-orange-100 text-orange-700",
    Design: "bg-pink-100 text-pink-700",
    Entertainment: "bg-purple-100 text-purple-700",
    Science: "bg-teal-100 text-teal-700",
    Sports: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12 -mt-14 pt-28 sm:-mt-16 sm:pt-32">
        <div className="cu-container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl cu-gradient flex items-center justify-center mx-auto mb-4">
              <Tv className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              News & <span style={{ color: "var(--cu-primary)" }}>Entertainment</span>
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">Stay current with trending news and discover great content curated for creators and collaborators.</p>
          </motion.div>
        </div>
      </div>

      <div className="cu-container cu-page">

        {/* Trending Topics */}
        <div className="mb-8 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">Trending Now</span>
          </div>
          <div className="flex gap-2 flex-nowrap pb-1">
            {TRENDING_TOPICS.map(topic => (
              <button
                key={topic}
                onClick={() => handleTrendingTopicClick(topic)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${trendingTopic === topic ? "cu-gradient text-white border border-transparent" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-700"}`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* AI Headlines */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-900">
                Today's Trending News{trendingTopic ? <span className="ml-2 text-sm font-normal text-purple-600">— {trendingTopic}</span> : ""}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {trendingTopic && (
                <button onClick={() => { setTrendingTopic(null); fetchAiHeadlines(null); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>
              )}
              <Button
                onClick={() => fetchAiHeadlines(trendingTopic)}
                disabled={loadingHeadlines}
                size="sm"
                style={{ background: "var(--cu-primary)" }}
                className="text-white text-xs"
              >
                {loadingHeadlines ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Flame className="w-3.5 h-3.5 mr-1" />}
                Refresh
              </Button>
            </div>
          </div>
          {loadingHeadlines && !headlinesFetched && (
            <p className="text-sm text-gray-500">Fetching today's top stories...</p>
          )}
          {loadingHeadlines && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> Fetching today's top stories...
            </div>
          )}
          {aiHeadlines.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {aiHeadlines.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <a
                    href={item.url || `https://www.google.com/search?q=${encodeURIComponent(item.headline)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="bg-white rounded-lg border border-purple-100 p-3 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-xs ${categoryHeadlineColors[item.category] || "bg-gray-100 text-gray-700"}`}>{item.category}</Badge>
                        {item.source && <span className="text-xs text-gray-400">{item.source}</span>}
                        <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-purple-400 ml-auto transition-colors" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 leading-snug mb-1 group-hover:text-purple-700 transition-colors">{item.headline}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{item.summary}</p>
                    </div>
                  </a>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Section Toggle + Search + Category */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
            <button
              onClick={() => setActiveSection("news")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeSection === "news" ? "cu-gradient text-white" : "text-gray-600 hover:text-purple-700"}`}
            >
              📰 News Sources
            </button>
            <button
              onClick={() => setActiveSection("videos")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeSection === "videos" ? "cu-gradient text-white" : "text-gray-600 hover:text-purple-700"}`}
            >
              🎬 Videos
            </button>
          </div>
          <div className="relative flex-1">
            <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-white" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.label ? "cu-gradient text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700"}`}
              >
                <Icon className="w-3.5 h-3.5" />{cat.label}
              </button>
            );
          })}
        </div>

        {/* News Sources */}
        {activeSection === "news" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSources.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-gray-400">No sources found.</div>
            ) : filteredSources.map((source, i) => (
              <motion.div key={source.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  <Card className={`cu-card border hover:shadow-md transition-all group overflow-hidden ${source.color}`}>
                    <div className="relative w-full h-32 overflow-hidden bg-gray-100">
                      <img
                        src={`https://api.microlink.io/?url=${encodeURIComponent(source.url)}&screenshot=true&meta=false&embed=screenshot.url`}
                        alt={`${source.name} preview`}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start gap-3">
                        <img src={getFavicon(source.url)} alt={source.name} className="w-7 h-7 rounded object-contain flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-gray-900 text-sm group-hover:text-purple-700 transition-colors">{source.name}</h3>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{source.description}</p>
                          <Badge className="mt-2 text-xs bg-white/70 text-gray-600 border border-gray-200">{source.category}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </motion.div>
            ))}
          </div>
        )}

        {/* Videos */}
        {activeSection === "videos" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.length === 0 ? (
              <div className="col-span-4 text-center py-12 text-gray-400">No videos found.</div>
            ) : filteredVideos.map((video, i) => (
              <motion.div key={video.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                  <Card className="cu-card overflow-hidden hover:shadow-md transition-all group">
                    <div className="relative aspect-video bg-gray-200 overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-white ml-1"><polygon points="5,3 19,12 5,21" /></svg>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-3 pb-3">
                      <h3 className="font-semibold text-gray-900 text-xs line-clamp-2 leading-snug mb-1 group-hover:text-purple-700 transition-colors">{video.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{video.channel}</span>
                        <Badge className={`text-xs ${categoryHeadlineColors[video.category] || "bg-gray-100 text-gray-700"}`}>{video.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}