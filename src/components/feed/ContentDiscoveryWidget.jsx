import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Tv, ExternalLink, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const FALLBACK_RESOURCES = [
  { title: "CS50: Introduction to Computer Science", category: "Development", format: "Course", url: "https://cs50.harvard.edu/x/", description: "Harvard's legendary intro to CS.", difficulty: "Beginner", free: true },
  { title: "The Lean Startup by Eric Ries", category: "Business", format: "Audio Book", url: "https://www.audible.com/pd/The-Lean-Startup-Audiobook/B005LXV0HI", description: "How entrepreneurs use continuous innovation.", difficulty: "Intermediate", free: false },
  { title: "JavaScript 30", category: "Development", format: "Workshop", url: "https://javascript30.com/", description: "Build 30 things in 30 days.", difficulty: "Intermediate", free: true },
  { title: "Atomic Habits by James Clear", category: "Productivity", format: "Audio Book", url: "https://www.audible.com/pd/Atomic-Habits-Audiobook/1524779261", description: "Build good habits and break bad ones.", difficulty: "Beginner", free: false },
];

const FALLBACK_NEWS = [
  { name: "TechCrunch", url: "https://techcrunch.com", category: "Tech", description: "Startup and technology news" },
  { name: "The Verge", url: "https://theverge.com", category: "Tech", description: "Tech, science, art & culture" },
  { name: "Fast Company", url: "https://fastcompany.com", category: "Business", description: "Business, innovation & design" },
  { name: "Dezeen", url: "https://dezeen.com", category: "Design", description: "Architecture & design inspiration" },
];

export default function ContentDiscoveryWidget() {
  const [resource, setResource] = useState(null);
  const [newsSource, setNewsSource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resources, newsSources] = await Promise.all([
          base44.entities.LearningResource.list("-created_date", 10).catch(() => []),
          base44.entities.NewsSource.list("-created_date", 10).catch(() => []),
        ]);

        const resPool = resources && resources.length > 0 ? resources : FALLBACK_RESOURCES;
        const newsPool = newsSources && newsSources.length > 0 ? newsSources : FALLBACK_NEWS;

        // Pick a random entry from each
        setResource(resPool[Math.floor(Math.random() * resPool.length)]);
        setNewsSource(newsPool[Math.floor(Math.random() * newsPool.length)]);
      } catch (e) {
        console.error("Error fetching content discovery:", e);
        setResource(FALLBACK_RESOURCES[0]);
        setNewsSource(FALLBACK_NEWS[0]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || (!resource && !newsSource)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Learning Resource */}
        {resource && (
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block">
            <Card className="cu-card h-full border-l-4 border-l-purple-400 hover:shadow-lg transition-all group overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg cu-gradient flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-600">
                    Learning Resource
                  </span>
                  <Link
                    to="/LearningHub"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-auto text-[10px] text-gray-400 hover:text-purple-600 flex items-center gap-0.5 transition-colors"
                  >
                    More <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <h4 className="font-bold text-sm text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-1">
                  {resource.title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {resource.description}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {resource.category && (
                    <Badge className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200">
                      {resource.category}
                    </Badge>
                  )}
                  {resource.format && (
                    <Badge variant="outline" className="text-[10px] text-gray-600">
                      {resource.format}
                    </Badge>
                  )}
                  {resource.free && (
                    <Badge className="text-[10px] bg-green-100 text-green-700">Free</Badge>
                  )}
                  <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-purple-400 ml-auto transition-colors" />
                </div>
              </CardContent>
            </Card>
          </a>
        )}

        {/* News Source */}
        {newsSource && (
          <a href={newsSource.url} target="_blank" rel="noopener noreferrer" className="block">
            <Card className="cu-card h-full border-l-4 border-l-indigo-400 hover:shadow-lg transition-all group overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Tv className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                    News &amp; Entertainment
                  </span>
                  <Link
                    to="/NewsEntertainment"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-auto text-[10px] text-gray-400 hover:text-indigo-600 flex items-center gap-0.5 transition-colors"
                  >
                    More <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <h4 className="font-bold text-sm text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-2 mb-1">
                  {newsSource.name}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {newsSource.description}
                </p>
                <div className="flex items-center gap-1.5">
                  {newsSource.category && (
                    <Badge className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {newsSource.category}
                    </Badge>
                  )}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${newsSource.url}&sz=32`}
                    alt={newsSource.name}
                    className="w-4 h-4 rounded ml-auto"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </a>
        )}
      </div>
    </motion.div>
  );
}