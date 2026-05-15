import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, BookOpen, ArrowLeft, Tag, Eye, ChevronRight, Search } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";

const TOPIC_COLORS = {
  "Collaboration": "bg-purple-100 text-purple-700",
  "Remote Work": "bg-blue-100 text-blue-700",
  "Productivity": "bg-green-100 text-green-700",
  "Startups": "bg-orange-100 text-orange-700",
  "Career Development": "bg-pink-100 text-pink-700",
  "Leadership": "bg-indigo-100 text-indigo-700",
  "Innovation": "bg-yellow-100 text-yellow-700",
  "Design": "bg-red-100 text-red-700",
  "Open Source": "bg-teal-100 text-teal-700",
  "Community Building": "bg-cyan-100 text-cyan-700",
};

// Render markdown-lite content
function ArticleContent({ content }) {
  const lines = content.split('\n');
  return (
    <div className="prose prose-lg max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-2xl font-bold text-gray-900 mt-10 mb-4">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-3xl font-bold text-gray-900 mt-10 mb-4">{line.replace('# ', '')}</h1>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold text-gray-900 my-2">{line.replace(/\*\*/g, '')}</p>;
        }
        if (line.trim() === '') return <div key={i} className="my-3" />;
        // Handle inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-gray-700 leading-relaxed text-lg my-2">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

// Article Detail View
function ArticleDetail({ article, onBack }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    // Increment view count silently
    base44.entities.ResourceArticle.update(article.id, { view_count: (article.view_count || 0) + 1 }).catch(() => {});
  }, [article.id]);

  const topicColor = TOPIC_COLORS[article.topic] || "bg-gray-100 text-gray-700";

  return (
    <div className="max-w-[720px] mx-auto px-4 py-10">
      <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors mb-8 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Resources
      </button>

      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${topicColor}`}>
        <Tag className="w-3 h-3" /> {article.topic}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">{article.title}</h1>
      <p className="text-xl text-gray-500 leading-relaxed mb-6">{article.excerpt}</p>

      <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <img src={LOGO_URL} alt="Collab Unity" className="w-6 h-6 rounded-full object-cover" />
          <span className="font-medium text-gray-600">Collab Unity Editorial</span>
        </div>
        <span>·</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {article.read_time_minutes} min read</span>
        <span>·</span>
        <span>{article.published_at ? format(new Date(article.published_at), 'MMM d, yyyy') : ''}</span>
        {article.view_count > 0 && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {article.view_count} views</span>
          </>
        )}
      </div>

      {article.cover_image_url && (
        <img
          src={article.cover_image_url}
          alt={article.title}
          className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-10"
        />
      )}

      <ArticleContent content={article.content} />

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-gray-200">
          {article.tags.map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">#{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-12 p-6 bg-gradient-to-br from-[#5B47DB] to-indigo-600 rounded-2xl text-white text-center">
        <h3 className="text-xl font-bold mb-2">Ready to put this into practice?</h3>
        <p className="text-purple-200 mb-4 text-sm">Join Collab Unity and start collaborating on real projects today.</p>
        <a
          href="https://collabunity.io/login"
          className="inline-flex items-center gap-2 bg-white text-[#5B47DB] font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-purple-50 transition-colors"
        >
          Get started free <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// Article Card for list
function ArticleCard({ article, onClick }) {
  const topicColor = TOPIC_COLORS[article.topic] || "bg-gray-100 text-gray-700";
  return (
    <article
      onClick={onClick}
      className="flex flex-col sm:flex-row gap-4 sm:gap-6 py-8 border-b border-gray-200 cursor-pointer group"
    >
      <div className="flex-1 min-w-0 order-2 sm:order-1">
        <div className="flex items-center gap-2 mb-2">
          <img src={LOGO_URL} alt="CU" className="w-5 h-5 rounded-full object-cover" />
          <span className="text-sm text-gray-500 font-medium">Collab Unity Editorial</span>
          {article.published_at && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-400">{format(new Date(article.published_at), 'MMM d')}</span>
            </>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#5B47DB] transition-colors leading-snug mb-2 line-clamp-2">
          {article.title}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">{article.excerpt}</p>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${topicColor}`}>{article.topic}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" /> {article.read_time_minutes} min read
          </span>
          {article.view_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="w-3 h-3" /> {article.view_count}
            </span>
          )}
        </div>
      </div>
      {article.cover_image_url && (
        <div className="order-1 sm:order-2 flex-shrink-0">
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full sm:w-[200px] h-32 sm:h-[134px] object-cover rounded-xl"
          />
        </div>
      )}
    </article>
  );
}

export default function Resources() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const topics = ["All", ...Object.keys(TOPIC_COLORS)];

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.ResourceArticle.filter(
        { is_published: true },
        "-published_at",
        50
      );
      setArticles(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArticles = articles.filter(a => {
    const matchesTopic = activeFilter === "All" || a.topic === activeFilter;
    const matchesSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  const featuredArticle = filteredArticles[0];
  const remainingArticles = filteredArticles.slice(1);

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-white font-sans antialiased">
        {/* Nav */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <Link to={createPageUrl("Welcome")} className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Collab Unity" className="w-7 h-7 rounded-lg object-cover" />
              <span className="text-sm font-semibold text-gray-900 hidden sm:inline">Collab Unity</span>
            </Link>
            <Link to={createPageUrl("Resources")} className="text-sm text-gray-600 hover:text-[#5B47DB] font-medium transition-colors">
              ← Resources
            </Link>
          </div>
        </header>
        <div className="pt-14">
          <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to={createPageUrl("Welcome")} className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Collab Unity" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-sm font-semibold text-gray-900 hidden sm:inline">Collab Unity</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-gray-600">
            <Link to={createPageUrl("Welcome")} className="hover:text-[#5B47DB] transition-colors">Home</Link>
            <Link to={createPageUrl("Contact")} className="hover:text-[#5B47DB] transition-colors">Contact</Link>
            <Link to={createPageUrl("Resources")} className="text-[#5B47DB] font-semibold">Resources</Link>
          </nav>
          <div className="flex items-center gap-3">
            <a href="https://collabunity.io/login" className="text-sm text-gray-600 font-medium hover:text-[#5B47DB] transition-colors">Log in</a>
            <a href="https://collabunity.io/login" className="bg-[#5B47DB] text-white rounded-full px-4 py-1.5 text-sm font-medium hover:bg-[#4A37C0] transition-colors">Sign up</a>
          </div>
        </div>
      </header>

      <div className="pt-14">
        {/* Hero */}
        <div className="border-b border-gray-200 py-12 px-4">
          <div className="max-w-[1100px] mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-[#5B47DB]" />
              <span className="text-sm font-semibold text-[#5B47DB] uppercase tracking-wide">Collab Unity Resources</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-3">
              Thought Leadership for Builders
            </h1>
            <p className="text-lg text-gray-500 max-w-[560px]">
              Insights on collaboration, innovation, and building meaningful projects — published weekly by the Collab Unity team.
            </p>

            {/* Search */}
            <div className="relative mt-6 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5B47DB]/30 focus:border-[#5B47DB]"
              />
            </div>
          </div>
        </div>

        {/* Topic filter tabs */}
        <div className="border-b border-gray-200 bg-white sticky top-14 z-40">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
              {topics.map(topic => (
                <button
                  key={topic}
                  onClick={() => setActiveFilter(topic)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                    activeFilter === topic
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
          {isLoading ? (
            <div className="space-y-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-6 py-8 border-b border-gray-200 animate-pulse">
                  <div className="flex-1 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="w-[200px] h-[134px] bg-gray-200 rounded-xl flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No articles yet</h3>
              <p className="text-gray-400 text-sm">
                {searchQuery ? "Try a different search term." : "Articles are published weekly. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main feed */}
              <div className="lg:col-span-2">
                {/* Featured article */}
                {featuredArticle && !searchQuery && activeFilter === "All" && (
                  <div
                    className="mb-6 cursor-pointer group"
                    onClick={() => setSelectedArticle(featuredArticle)}
                  >
                    {featuredArticle.cover_image_url && (
                      <img
                        src={featuredArticle.cover_image_url}
                        alt={featuredArticle.title}
                        className="w-full h-56 sm:h-72 object-cover rounded-2xl mb-4"
                      />
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <img src={LOGO_URL} alt="CU" className="w-5 h-5 rounded-full object-cover" />
                      <span className="text-sm text-gray-500 font-medium">Collab Unity Editorial</span>
                      {featuredArticle.published_at && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-sm text-gray-400">{format(new Date(featuredArticle.published_at), 'MMM d')}</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-[#5B47DB] transition-colors leading-snug mb-2">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-gray-500 leading-relaxed mb-3">{featuredArticle.excerpt}</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TOPIC_COLORS[featuredArticle.topic] || "bg-gray-100 text-gray-700"}`}>
                        {featuredArticle.topic}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" /> {featuredArticle.read_time_minutes} min read
                      </span>
                    </div>
                    <div className="border-b border-gray-200 mt-6" />
                  </div>
                )}

                {/* Rest of articles */}
                <div>
                  {(searchQuery || activeFilter !== "All" ? filteredArticles : remainingArticles).map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onClick={() => setSelectedArticle(article)}
                    />
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-32 space-y-8">
                  {/* Topics */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Explore Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(TOPIC_COLORS).map(topic => (
                        <button
                          key={topic}
                          onClick={() => setActiveFilter(topic === activeFilter ? "All" : topic)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                            activeFilter === topic
                              ? TOPIC_COLORS[topic]
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                    <h3 className="font-bold text-gray-900 mb-2 text-sm">Join the community</h3>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">Build projects, find collaborators, and ship ideas with thousands of creators.</p>
                    <a
                      href="https://collabunity.io/login"
                      className="flex items-center justify-center gap-1 w-full bg-[#5B47DB] text-white text-xs font-semibold py-2.5 rounded-full hover:bg-[#4A37C0] transition-colors"
                    >
                      Get started free <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 px-4 mt-8">
          <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Collab Unity" className="w-5 h-5 rounded object-cover" />
              <span className="font-medium text-gray-600">Collab Unity Resources</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("Welcome")} className="hover:text-gray-600 transition-colors">Home</Link>
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-gray-600 transition-colors">Privacy</Link>
              <Link to={createPageUrl("Contact")} className="hover:text-gray-600 transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}