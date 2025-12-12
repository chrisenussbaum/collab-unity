import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Lightbulb,
  User,
  FileText,
  Loader2,
  Filter,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Users as UsersIcon,
  TrendingUp,
  BookOpen,
  SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";

const formatEnumLabel = (str) => {
  if (!str) return '';
  return str.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function SearchPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({ projects: [], users: [], posts: [] });
  
  // Filters
  const [projectStatus, setProjectStatus] = useState("all");
  const [projectType, setProjectType] = useState("all");
  const [projectVisibility, setProjectVisibility] = useState("all");
  const [postType, setPostType] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  
  // Search function
  const performSearch = useCallback(async () => {
    if (query.trim().length < 2) {
      setResults({ projects: [], users: [], posts: [] });
      return;
    }

    setIsSearching(true);
    try {
      const response = await base44.functions.invoke('globalSearch', { query });
      let searchResults = response.data.results || { projects: [], users: [], posts: [] };
      
      // Apply filters to projects
      let filteredProjects = searchResults.projects;
      if (projectStatus !== "all") {
        filteredProjects = filteredProjects.filter(p => p.status === projectStatus);
      }
      if (projectType !== "all") {
        filteredProjects = filteredProjects.filter(p => p.project_type === projectType);
      }
      if (projectVisibility !== "all") {
        const isPublic = projectVisibility === "public";
        filteredProjects = filteredProjects.filter(p => 
          isPublic ? p.is_visible_on_feed !== false : p.is_visible_on_feed === false
        );
      }
      
      // Apply filters to posts
      let filteredPosts = searchResults.posts;
      if (postType !== "all") {
        filteredPosts = filteredPosts.filter(p => p.post_type === postType);
      }
      
      // Apply sorting
      if (sortBy === "newest") {
        filteredProjects.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        filteredPosts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      } else if (sortBy === "oldest") {
        filteredProjects.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        filteredPosts.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      }
      
      setResults({
        projects: filteredProjects,
        users: searchResults.users,
        posts: filteredPosts
      });
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [query, projectStatus, projectType, projectVisibility, postType, sortBy]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeTab !== "all") params.set("tab", activeTab);
    setSearchParams(params, { replace: true });
  }, [query, activeTab, setSearchParams]);

  // Perform search when filters change
  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounce);
  }, [performSearch]);

  const handleProjectClick = (projectId) => {
    navigate(createPageUrl(`ProjectDetail?id=${projectId}`));
  };

  const handleUserClick = (username, email) => {
    if (username) {
      navigate(createPageUrl(`UserProfile?username=${username}`));
    } else {
      navigate(createPageUrl(`UserProfile?email=${email}`));
    }
  };

  const handlePostClick = (postId) => {
    navigate(createPageUrl(`Feed#feedpost-${postId}`));
  };

  const clearFilters = () => {
    setProjectStatus("all");
    setProjectType("all");
    setProjectVisibility("all");
    setPostType("all");
    setSortBy("relevance");
  };

  const hasActiveFilters = projectStatus !== "all" || projectType !== "all" || 
                          projectVisibility !== "all" || postType !== "all" || 
                          sortBy !== "relevance";

  const totalResults = results.projects.length + results.users.length + results.posts.length;

  return (
    <div className="cu-container cu-page">
      <div className="max-w-5xl mx-auto">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Search</h1>
          
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search projects, people, and posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
            )}
          </div>

          {/* Filter Toggle & Actions */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
                  Active
                </Badge>
              )}
            </Button>

            {query && (
              <div className="text-sm text-gray-600">
                {isSearching ? (
                  <span>Searching...</span>
                ) : (
                  <span>
                    {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="cu-card mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Filter Results</CardTitle>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Sort By
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Project Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Project Status
                  </label>
                  <Select value={projectStatus} onValueChange={setProjectStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="seeking_collaborators">Seeking Collaborators</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Project Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Project Type
                  </label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Collaborative">Collaborative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Project Visibility */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Project Visibility
                  </label>
                  <Select value={projectVisibility} onValueChange={setProjectVisibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Post Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Post Type
                  </label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="status_update">Status Update</SelectItem>
                      <SelectItem value="narrative">Story & Insights</SelectItem>
                      <SelectItem value="collaboration_call">Call for Collaboration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All ({totalResults})
            </TabsTrigger>
            <TabsTrigger value="projects">
              Projects ({results.projects.length})
            </TabsTrigger>
            <TabsTrigger value="people">
              People ({results.users.length})
            </TabsTrigger>
            <TabsTrigger value="posts">
              Posts ({results.posts.length})
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-6">
            {!query && (
              <Card className="cu-card p-12 text-center">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start Your Search
                </h3>
                <p className="text-gray-600">
                  Search for projects, collaborators, and posts by keywords, tags, or status
                </p>
              </Card>
            )}

            {query && !isSearching && totalResults === 0 && (
              <Card className="cu-card p-12 text-center">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Results Found
                </h3>
                <p className="text-gray-600">
                  Try different keywords or adjust your filters
                </p>
              </Card>
            )}

            {/* Projects */}
            {results.projects.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-purple-600" />
                  Projects ({results.projects.length})
                </h2>
                <div className="space-y-3">
                  {results.projects.map((project) => (
                    <ProjectResultCard
                      key={project.id}
                      project={project}
                      onClick={() => handleProjectClick(project.id)}
                      query={query}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {results.users.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  People ({results.users.length})
                </h2>
                <div className="space-y-3">
                  {results.users.map((user) => (
                    <UserResultCard
                      key={user.email}
                      user={user}
                      onClick={() => handleUserClick(user.username, user.email)}
                      query={query}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {results.posts.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  Posts ({results.posts.length})
                </h2>
                <div className="space-y-3">
                  {results.posts.map((post) => (
                    <PostResultCard
                      key={post.id}
                      post={post}
                      onClick={() => handlePostClick(post.id)}
                      query={query}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            {results.projects.length === 0 ? (
              <Card className="cu-card p-12 text-center">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No projects found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {results.projects.map((project) => (
                  <ProjectResultCard
                    key={project.id}
                    project={project}
                    onClick={() => handleProjectClick(project.id)}
                    query={query}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people">
            {results.users.length === 0 ? (
              <Card className="cu-card p-12 text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No people found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {results.users.map((user) => (
                  <UserResultCard
                    key={user.email}
                    user={user}
                    onClick={() => handleUserClick(user.username, user.email)}
                    query={query}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            {results.posts.length === 0 ? (
              <Card className="cu-card p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No posts found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {results.posts.map((post) => (
                  <PostResultCard
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post.id)}
                    query={query}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Project Result Card Component
function ProjectResultCard({ project, onClick, query }) {
  const statusIcons = {
    seeking_collaborators: UsersIcon,
    in_progress: Clock,
    completed: CheckCircle
  };
  const StatusIcon = statusIcons[project.status] || Lightbulb;

  return (
    <Card className="cu-card hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {project.logo_url ? (
            <img
              src={project.logo_url}
              alt={project.title}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-purple-600" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
            {project.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {project.description}
              </p>
            )}
            <div className="flex items-center flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <StatusIcon className="w-3 h-3 mr-1" />
                {formatEnumLabel(project.status)}
              </Badge>
              {project.is_visible_on_feed === false && (
                <Badge variant="secondary" className="text-xs">Private</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// User Result Card Component
function UserResultCard({ user, onClick, query }) {
  return (
    <Card className="cu-card hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage src={user.profile_image} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {user.full_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
            {user.username && (
              <p className="text-sm text-gray-600">@{user.username}</p>
            )}
            {user.bio && (
              <p className="text-sm text-gray-600 line-clamp-1 mt-1">{user.bio}</p>
            )}
            {user.location && (
              <p className="text-xs text-gray-500 mt-1">{user.location}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Post Result Card Component
function PostResultCard({ post, onClick, query }) {
  const postTypeIcons = {
    status_update: TrendingUp,
    narrative: BookOpen,
    collaboration_call: UsersIcon
  };
  const PostIcon = postTypeIcons[post.post_type] || FileText;

  return (
    <Card className="cu-card hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <PostIcon className="w-5 h-5 text-green-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">
              {post.title || "Untitled Post"}
            </h3>
            {post.content && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.content}</p>
            )}
            <Badge variant="outline" className="text-xs">
              {formatEnumLabel(post.post_type)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}