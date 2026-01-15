import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Search, Star, Rocket, Code, Palette, Megaphone, Briefcase, GraduationCap, Sparkles, Clock, TrendingUp } from "lucide-react";

export default function Templates() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ProjectTemplate.filter({ is_public: true }, '-usage_count'),
  });

  const categories = [
    { id: "all", name: "All Templates", icon: Sparkles },
    { id: "web_development", name: "Web Development", icon: Code },
    { id: "mobile_app", name: "Mobile App", icon: Rocket },
    { id: "design", name: "Design", icon: Palette },
    { id: "marketing", name: "Marketing", icon: Megaphone },
    { id: "business", name: "Business", icon: Briefcase },
    { id: "education", name: "Education", icon: GraduationCap },
  ];

  const difficultyColors = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800"
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const officialTemplates = filteredTemplates.filter(t => t.is_official);
  const communityTemplates = filteredTemplates.filter(t => !t.is_official);

  const handleUseTemplate = async (template) => {
    try {
      await base44.entities.ProjectTemplate.update(template.id, {
        usage_count: (template.usage_count || 0) + 1
      });
      navigate(createPageUrl("CreateProject") + `?template_id=${template.id}`);
    } catch (error) {
      console.error("Error updating template usage:", error);
      navigate(createPageUrl("CreateProject") + `?template_id=${template.id}`);
    }
  };

  const TemplateCard = ({ template }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader>
        {template.thumbnail_url && (
          <div className="w-full h-40 rounded-lg mb-4 overflow-hidden bg-gray-100">
            <img 
              src={template.thumbnail_url} 
              alt={template.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{template.title}</CardTitle>
          {template.is_official && (
            <Badge className="bg-indigo-100 text-indigo-800 flex items-center gap-1">
              <Star className="w-3 h-3" /> Official
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {template.difficulty_level && (
              <Badge className={difficultyColors[template.difficulty_level]}>
                {template.difficulty_level}
              </Badge>
            )}
            {template.estimated_duration && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {template.estimated_duration}
              </Badge>
            )}
            {template.usage_count > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {template.usage_count} uses
              </Badge>
            )}
          </div>
          
          {template.skills_needed && template.skills_needed.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.skills_needed.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {template.skills_needed.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.skills_needed.length - 3}
                </Badge>
              )}
            </div>
          )}

          <Button 
            onClick={() => handleUseTemplate(template)}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Project Templates</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Start your project faster with pre-built templates. Choose from official templates or community-created ones.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Templates */}
        <Tabs defaultValue="official" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="official">
              Official ({officialTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="community">
              Community ({communityTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="official">
            {officialTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {officialTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No official templates found.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="community">
            {communityTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No community templates found.</p>
                <Button 
                  onClick={() => navigate(createPageUrl("CreateProject"))}
                  className="mt-4"
                >
                  Create a Project
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}