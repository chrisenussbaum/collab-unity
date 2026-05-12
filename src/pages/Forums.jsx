import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Search, Plus, ThumbsUp, Eye, Clock, Pin, ChevronRight, ArrowLeft, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = ["General", "Design", "Development", "Marketing", "Startup", "Career", "Creative", "Tools & Tech", "Feedback", "Off-Topic"];

const getCategoryColor = (cat) => {
  const map = {
    "General": "bg-gray-100 text-gray-700",
    "Design": "bg-pink-100 text-pink-700",
    "Development": "bg-blue-100 text-blue-700",
    "Marketing": "bg-yellow-100 text-yellow-700",
    "Startup": "bg-orange-100 text-orange-700",
    "Career": "bg-green-100 text-green-700",
    "Creative": "bg-purple-100 text-purple-700",
    "Tools & Tech": "bg-cyan-100 text-cyan-700",
    "Feedback": "bg-indigo-100 text-indigo-700",
    "Off-Topic": "bg-red-100 text-red-700",
  };
  return map[cat] || "bg-gray-100 text-gray-700";
};

export default function Forums({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "General" });
  const [submittingPost, setSubmittingPost] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await base44.entities.ForumPost.list("-created_date", 100);
    setPosts(data);
    setLoading(false);
  };

  const loadReplies = async (postId) => {
    const data = await base44.entities.ForumReply.filter({ post_id: postId }, "created_date", 200);
    setReplies(data);
  };

  const openPost = async (post) => {
    // Increment view count
    base44.entities.ForumPost.update(post.id, { views: (post.views || 0) + 1 }).catch(() => {});
    setSelectedPost({ ...post, views: (post.views || 0) + 1 });
    await loadReplies(post.id);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !currentUser) return;
    setSubmittingReply(true);
    const reply = await base44.entities.ForumReply.create({
      post_id: selectedPost.id,
      content: replyText.trim(),
      author_email: currentUser.email,
      author_name: currentUser.full_name || currentUser.email,
      author_avatar: currentUser.profile_image || "",
    });
    setReplies(prev => [...prev, reply]);
    setReplyText("");
    // Update reply count on post
    const updatedCount = (selectedPost.reply_count || 0) + 1;
    base44.entities.ForumPost.update(selectedPost.id, { reply_count: updatedCount }).catch(() => {});
    setSelectedPost(prev => ({ ...prev, reply_count: updatedCount }));
    setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, reply_count: updatedCount } : p));
    setSubmittingReply(false);
  };

  const handleLikePost = async (postId, e) => {
    e.stopPropagation();
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    const liked = (post?.liked_by || []).includes(currentUser.email);
    const newLikedBy = liked
      ? (post.liked_by || []).filter(e => e !== currentUser.email)
      : [...(post.liked_by || []), currentUser.email];
    await base44.entities.ForumPost.update(postId, { liked_by: newLikedBy, likes: newLikedBy.length });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by: newLikedBy, likes: newLikedBy.length } : p));
    if (selectedPost?.id === postId) setSelectedPost(prev => ({ ...prev, liked_by: newLikedBy, likes: newLikedBy.length }));
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !currentUser) return;
    setSubmittingPost(true);
    const created = await base44.entities.ForumPost.create({
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      category: newPost.category,
      author_email: currentUser.email,
      author_name: currentUser.full_name || currentUser.email,
      author_avatar: currentUser.profile_image || "",
      likes: 0,
      liked_by: [],
      views: 0,
      reply_count: 0,
      is_pinned: false,
    });
    setPosts(prev => [created, ...prev]);
    setNewPost({ title: "", content: "", category: "General" });
    setShowNewPostDialog(false);
    setSubmittingPost(false);
    toast.success("Post created!");
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const pinnedPosts = filteredPosts.filter(p => p.is_pinned);
  const regularPosts = filteredPosts.filter(p => !p.is_pinned);
  const allSorted = [...pinnedPosts, ...regularPosts];

  if (selectedPost) {
    const isLiked = currentUser && (selectedPost.liked_by || []).includes(currentUser.email);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="cu-container cu-page max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => setSelectedPost(null)} className="mb-4 text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Forums
          </Button>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedPost.is_pinned && <Pin className="w-4 h-4 text-purple-600" />}
                    <Badge className={getCategoryColor(selectedPost.category)}>{selectedPost.category}</Badge>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 mb-3">{selectedPost.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <OptimizedAvatar src={selectedPost.author_avatar} alt={selectedPost.author_name} fallback={selectedPost.author_name?.[0] || "?"} size="xs" className="w-6 h-6" />
                    <span className="font-medium text-gray-700">{selectedPost.author_name}</span>
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(selectedPost.created_date), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
            </CardContent>
            <CardFooter className="flex items-center gap-4 border-t pt-4">
              <button onClick={(e) => handleLikePost(selectedPost.id, e)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isLiked ? "text-purple-600" : "text-gray-500 hover:text-purple-600"}`}>
                <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-purple-600" : ""}`} />
                {selectedPost.likes || 0}
              </button>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MessageSquare className="w-4 h-4" />
                {selectedPost.reply_count || 0} replies
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Eye className="w-4 h-4" />
                {selectedPost.views || 0} views
              </div>
            </CardFooter>
          </Card>

          <div className="space-y-4 mb-6">
            <h2 className="font-semibold text-gray-900">{replies.length} {replies.length === 1 ? "Reply" : "Replies"}</h2>
            {replies.map(reply => (
              <Card key={reply.id} className="bg-white">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <OptimizedAvatar src={reply.author_avatar} alt={reply.author_name} fallback={reply.author_name?.[0] || "?"} size="xs" className="w-6 h-6" />
                    <span className="text-sm font-medium text-gray-800">{reply.author_name}</span>
                    <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(reply.created_date), { addSuffix: true })}</span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {currentUser ? (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Label className="font-semibold">Add a Reply</Label>
                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Share your thoughts..." rows={3} />
                <Button onClick={handleSubmitReply} disabled={submittingReply || !replyText.trim()} style={{ background: "var(--cu-primary)" }} className="text-white">
                  {submittingReply ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Post Reply
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4 text-center text-sm text-gray-600">
                <Button onClick={() => base44.auth.redirectToLogin()} style={{ background: "var(--cu-primary)" }} className="text-white">Sign in to reply</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12 -mt-14 pt-28 sm:-mt-16 sm:pt-32">
        <div className="cu-container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl cu-gradient flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Community <span style={{ color: "var(--cu-primary)" }}>Forums</span></h1>
            <p className="text-gray-600 max-w-xl mx-auto mb-6">Ask questions, share ideas, and connect with the Collab Unity community.</p>
            {currentUser && (
              <Button onClick={() => setShowNewPostDialog(true)} style={{ background: "var(--cu-primary)" }} className="text-white">
                <Plus className="w-4 h-4 mr-2" /> New Post
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      <div className="cu-container cu-page">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Input placeholder="Search discussions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-white" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-44 bg-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></div>
        ) : allSorted.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No posts yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allSorted.map((post, i) => {
              const isLiked = currentUser && (post.liked_by || []).includes(currentUser.email);
              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="cu-card cursor-pointer hover:border-purple-200 transition-all" onClick={() => openPost(post)}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-4">
                        <OptimizedAvatar src={post.author_avatar} alt={post.author_name} fallback={post.author_name?.[0] || "?"} size="sm" className="w-9 h-9 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {post.is_pinned && <Pin className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />}
                            <Badge className={`text-xs ${getCategoryColor(post.category)}`}>{post.category}</Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{post.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="font-medium text-gray-600">{post.author_name}</span>
                            <span>{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</span>
                            <button onClick={(e) => handleLikePost(post.id, e)} className={`flex items-center gap-1 transition-colors ${isLiked ? "text-purple-600" : "hover:text-purple-600"}`}>
                              <ThumbsUp className={`w-3 h-3 ${isLiked ? "fill-purple-600" : ""}`} /> {post.likes || 0}
                            </button>
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.reply_count || 0}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views || 0}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Post Dialog */}
      <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create a New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Category</Label>
              <Select value={newPost.category} onValueChange={v => setNewPost(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title *</Label>
              <Input className="mt-1" value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="What's your post about?" />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea className="mt-1" rows={5} value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} placeholder="Share your thoughts, questions, or ideas..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePost} disabled={submittingPost || !newPost.title.trim() || !newPost.content.trim()} style={{ background: "var(--cu-primary)" }} className="text-white">
              {submittingPost ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}