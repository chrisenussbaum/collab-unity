import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Link as LinkIcon, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SubmitContent({ currentUser }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    category: '',
    tags: '',
    title: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("Please sign in to submit content.");
      return;
    }

    if (!formData.url || !formData.category) {
      toast.error("Please provide a URL and select a category.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract domain for favicon
      const urlObj = new URL(formData.url);
      const domain = urlObj.hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Create pending content submission
      await base44.entities.PlaygroundContent.create({
        url: formData.url.trim(),
        category: formData.category,
        title: formData.title.trim() || urlObj.hostname,
        description: formData.description.trim(),
        image_url: faviconUrl,
        tags: tagsArray,
        content_type: formData.url.includes('rss') || formData.url.includes('feed') ? 'rss_feed' : 'article',
        is_approved: false,
        submitted_by: currentUser.email
      });

      toast.success("Content submitted! It will be reviewed by our team.");
      navigate(createPageUrl("Discover"));
    } catch (error) {
      console.error("Error submitting content:", error);
      toast.error("Failed to submit content. Please check the URL and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white py-16 sm:py-20 -mt-14 pt-28 sm:-mt-16 sm:pt-32">
        <div className="cu-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 mb-4"
              onClick={() => navigate(createPageUrl("Discover"))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discover
            </Button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">Submit Content</h1>
                <p className="text-purple-100 text-lg">Share resources with the community</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="cu-container cu-page">
        <div className="max-w-2xl mx-auto">
          <Card className="cu-card">
            <CardHeader>
              <CardTitle>Content Submission</CardTitle>
              <CardDescription>
                Submit educational content, entertainment, or tools for the Playground. 
                Your submission will be reviewed before appearing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="url">Content URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/content"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The URL to the content you want to share
                  </p>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital_library">Digital Library</SelectItem>
                      <SelectItem value="video_courses">Video Courses</SelectItem>
                      <SelectItem value="podcasts">Podcasts</SelectItem>
                      <SelectItem value="tutorials">Tutorials</SelectItem>
                      <SelectItem value="games">Games</SelectItem>
                      <SelectItem value="shows_movies">Shows & Movies</SelectItem>
                      <SelectItem value="puzzles">Puzzles</SelectItem>
                      <SelectItem value="interactive_stories">Interactive Stories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Content title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to auto-detect from the URL
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the content..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <Input
                    id="tags"
                    type="text"
                    placeholder="movie, action, thriller"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated tags (e.g., "movie", "show", "comedy")
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Review Process:</strong> Your submission will be reviewed by our team. 
                    Approved content will appear in the Playground for all users.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.url || !formData.category}
                  className="w-full cu-button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Submit Content
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}