import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Lightbulb,
  User,
  FileText,
  Loader2,
  TrendingUp,
  BookOpen,
  Users as UsersIcon,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  Briefcase,
  ArrowRight
} from "lucide-react";

const formatEnumLabel = (str) => {
  if (!str) return '';
  return str.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper function to highlight matching text
const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim() || !text) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-gray-900 font-medium">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export default function GlobalSearchBar({ className = "", placeholder = "Search..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ projects: [], users: [], posts: [], templates: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults({ projects: [], users: [], posts: [], templates: [] });
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await base44.functions.invoke('globalSearch', { query });
        setResults(response.data.results || { projects: [], users: [], posts: [], templates: [] });
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults({ projects: [], users: [], posts: [], templates: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleProjectClick = (projectId) => {
    navigate(createPageUrl(`ProjectDetail?id=${projectId}`));
    setShowResults(false);
    setQuery("");
  };

  const handleUserClick = (username, email) => {
    if (username) {
      navigate(createPageUrl(`UserProfile?username=${username}`));
    } else {
      navigate(createPageUrl(`UserProfile?email=${email}`));
    }
    setShowResults(false);
    setQuery("");
  };

  const handlePostClick = (postId) => {
    navigate(createPageUrl(`Feed#feedpost-${postId}`));
    setShowResults(false);
    setQuery("");
  };

  const handleTemplateClick = (templateId) => {
    navigate(createPageUrl(`ProjectTemplates`));
    setShowResults(false);
    setQuery("");
  };

  const handleViewAllResults = () => {
    navigate(createPageUrl(`Search?q=${encodeURIComponent(query)}`));
    setShowResults(false);
  };

  const postTypeIcons = {
    status_update: TrendingUp,
    narrative: BookOpen,
    collaboration_call: UsersIcon
  };

  const statusIcons = {
    seeking_collaborators: UsersIcon,
    in_progress: Clock,
    completed: CheckCircle
  };

  const hasResults = results.projects.length > 0 || results.users.length > 0 || results.posts.length > 0 || results.templates.length > 0;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
          className="pl-9 sm:pl-10 pr-9 sm:pr-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
        )}
      </div>

      {showResults && query.trim().length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-[70vh] overflow-y-auto z-[60] shadow-xl border-2">
          {!hasResults && !isSearching && (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No results found</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          )}

          {/* Projects Section */}
          {results.projects.length > 0 && (
            <div className="p-2">
              <div className="flex items-center space-x-2 px-3 py-2">
                <Lightbulb className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Projects</span>
              </div>
              <div className="space-y-1">
                {results.projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3"
                  >
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {project.logo_url ? (
                      <img
                        src={project.logo_url}
                        alt={project.title}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-purple-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        <HighlightText text={project.title} highlight={query} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">Project</span>
                        {project.status && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-500 capitalize">
                              {formatEnumLabel(project.status)}
                            </span>
                          </>
                        )}
                        {project.is_visible_on_feed === false && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              <EyeOff className="w-2.5 h-2.5 mr-0.5" />
                              Private
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.projects.length > 0 && (results.users.length > 0 || results.posts.length > 0 || results.templates.length > 0) && (
            <Separator className="my-1" />
          )}

          {/* Users Section */}
          {results.users.length > 0 && (
            <div className="p-2">
              <div className="flex items-center space-x-2 px-3 py-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">People</span>
              </div>
              <div className="space-y-1">
                {results.users.map((user) => (
                  <button
                    key={user.email}
                    onClick={() => handleUserClick(user.username, user.email)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3"
                  >
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {user.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        <HighlightText text={user.full_name} highlight={query} />
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.username ? (
                          <>
                            <HighlightText text={`@${user.username}`} highlight={query} />
                            {user.location && ` • ${user.location}`}
                          </>
                        ) : (
                          user.location || user.email
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.users.length > 0 && (results.posts.length > 0 || results.templates.length > 0) && (
            <Separator className="my-1" />
          )}

          {/* Templates Section */}
          {results.templates.length > 0 && (
            <div className="p-2">
              <div className="flex items-center space-x-2 px-3 py-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Templates</span>
              </div>
              <div className="space-y-1">
                {results.templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template.id)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3"
                  >
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        <HighlightText text={template.title} highlight={query} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">Template</span>
                        {template.difficulty_level && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-500 capitalize">
                              {template.difficulty_level}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.templates.length > 0 && results.posts.length > 0 && (
            <Separator className="my-1" />
          )}

          {/* Posts Section */}
          {results.posts.length > 0 && (
            <div className="p-2">
              <div className="flex items-center space-x-2 px-3 py-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Posts</span>
              </div>
              <div className="space-y-1">
                {results.posts.map((post) => {
                  const PostIcon = postTypeIcons[post.post_type] || FileText;
                  return (
                    <button
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3"
                    >
                      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                        <PostIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">
                          <HighlightText text={post.title || "Untitled Post"} highlight={query} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 capitalize">
                            {formatEnumLabel(post.post_type)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* View All Results Button */}
          {hasResults && (
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                className="w-full justify-center text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                onClick={handleViewAllResults}
              >
                View All Results
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}