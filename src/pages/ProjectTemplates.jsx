
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ProjectTemplate } from "@/entities/all";
import { getPublicUserProfiles } from '@/functions/getPublicUserProfiles';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Lightbulb,
  Layers,
  Code, // Used for development phase
  FileText,
  Briefcase,
  Palette,
  BarChart,
  TrendingUp,
  Clock,
  Eye,
  Star,
  BookOpen,
  Rocket, // Used for launch phase and 'Use Template' button
  Plus,
  Award, // Used for success criteria
  Settings, // Used for setup phase
  AlertTriangle, // Used for common challenges
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import HorizontalScrollContainer from "../components/HorizontalScrollContainer";

const difficultyConfig = {
  beginner: {
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <TrendingUp className="w-3 h-3 mr-1" />
  },
  intermediate: {
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: <TrendingUp className="w-3 h-3 mr-1" />
  },
  advanced: {
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <TrendingUp className="w-3 h-3 mr-1" />
  }
};

const baseCategoryFilters = [
  { value: "all", label: "All Categories", icon: Layers },
  { value: "technology", label: "Technology", icon: Code },
  { value: "content", label: "Content", icon: FileText },
  { value: "business", label: "Business", icon: Briefcase },
  { value: "design", label: "Design", icon: Palette },
  { value: "data_science", label: "Data Science", icon: BarChart },
  { value: "marketing", label: "Marketing", icon: TrendingUp }
];

const difficultyFilters = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

const getCategoryIcon = (category) => {
  const iconMap = {
    technology: { icon: <Code className="w-6 h-6 text-purple-600" />, color: "bg-purple-100" },
    content: { icon: <FileText className="w-6 h-6 text-blue-600" />, color: "bg-blue-100" },
    business: { icon: <Briefcase className="w-6 h-6 text-green-600" />, color: "bg-green-100" },
    design: { icon: <Palette className="w-6 h-6 text-pink-600" />, color: "bg-pink-100" },
    data_science: { icon: <BarChart className="w-6 h-6 text-orange-600" />, color: "bg-orange-100" },
    marketing: { icon: <TrendingUp className="w-6 h-6 text-teal-600" />, color: "bg-teal-100" },
  };
  return iconMap[category] || { icon: <Lightbulb className="w-6 h-6 text-gray-600" />, color: "bg-gray-100" };
};

export default function ProjectTemplates({ currentUser }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [creators, setCreators] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    setup: true,
    development: false,
    launch: false,
    success: false,
    challenges: false
  });

  // Renamed loadTemplates to fetchTemplatesAndCreators as per outline
  const fetchTemplatesAndCreators = async () => {
    setIsLoading(true);
    try {
      const data = await ProjectTemplate.filter({ is_active: true }, '-created_date');
      const templatesArray = Array.isArray(data) ? data : [];

      const creatorEmails = [...new Set(templatesArray.map(t => t.created_by).filter(Boolean))];

      if (creatorEmails.length > 0) {
        const { data: creatorProfilesData } = await getPublicUserProfiles({ emails: creatorEmails });
        const creatorProfiles = creatorProfilesData || [];

        const profilesMap = creatorProfiles.reduce((acc, profile) => {
          acc[profile.email] = profile;
          return acc;
        }, {});
        setCreators(profilesMap); // Set creators state as per outline

        const populatedTemplates = templatesArray.map(template => {
          const creator = profilesMap[template.created_by] || {
            email: template.created_by,
            full_name: template.created_by?.split('@')[0] || 'Anonymous',
            profile_image: null,
          };
          return { ...template, creator };
        });

        setTemplates(populatedTemplates);
      } else {
        setTemplates(templatesArray);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplatesAndCreators(); // Updated function call
  }, []);

  // Dynamically generate category filters based on templates
  const categoryFilters = useMemo(() => {
    const customCategories = new Set();
    
    templates.forEach(template => {
      if (template.category === 'other' && template.custom_category && template.custom_category.trim()) {
        customCategories.add(template.custom_category.trim());
      }
    });

    const customCategoryFilters = Array.from(customCategories).map(customCat => ({
      value: customCat.toLowerCase().replace(/\s+/g, '_'),
      label: customCat,
      icon: Lightbulb,
      isCustom: true,
      originalName: customCat
    }));

    return [...baseCategoryFilters, ...customCategoryFilters];
  }, [templates]);

  const getTemplateCategory = (template) => {
    if (template.category === 'other' && template.custom_category) {
      return template.custom_category.toLowerCase().replace(/\s+/g, '_');
    }
    return template.category;
  };

  const getTemplateCategoryDisplay = (template) => {
    if (template.category === 'other' && template.custom_category) {
      return template.custom_category;
    }
    return template.category;
  };

  // filteredTemplates now a useMemo as per outline
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Removed searchQuery match
      const templateCategory = getTemplateCategory(template);
      const matchesCategory = selectedCategory === "all" || templateCategory === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "all" || template.difficulty_level === selectedDifficulty;

      return matchesCategory && matchesDifficulty;
    });
  }, [templates, selectedCategory, selectedDifficulty, getTemplateCategory]); // Corrected dependencies

  const handleUseTemplate = (template) => {
    const params = new URLSearchParams({
      fromTemplate: 'true',
      templateId: template.id,
      title: template.title,
      description: template.description,
      skills: JSON.stringify(template.target_skills || []),
      tools: JSON.stringify(template.suggested_tools || []),
      ...(template.project_instructions && { projectInstructions: JSON.stringify(template.project_instructions) }),
    });
    navigate(`${createPageUrl("CreateProject")}?${params.toString()}`);
  };

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
    if (template?.project_instructions) {
      // The outline suggested expandedSections initialization for this, so ensure it reflects that
      setExpandedSections({
        setup: true,
        development: false,
        launch: false,
        success: false,
        challenges: false,
      });
    }
  };

  const togglePreviewSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // handleMigration function removed as per outline
  // isMigrating state removed as per outline

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="cu-container">
        <div className="cu-page">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }} // Changed initial y value as per outline
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} // Added transition as per outline
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4 mb-6">
              <div className="text-center lg:text-left">
                <h1 className="cu-text-responsive-xl font-bold text-gray-900 mb-2">Project Templates</h1>
                <p className="text-gray-600 cu-text-responsive-sm">
                  Jump-start your project with guided templates
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Admin 'Generate Instructions' button and its logic removed as per outline */}
                <Button 
                  onClick={() => navigate(createPageUrl("SubmitProjectTemplate"))}
                  className="cu-button flex-shrink-0 text-xs sm:text-sm"
                >
                  <Plus className="cu-icon-sm mr-2" />
                  <span className="hidden sm:inline">Submit Template</span>
                  <span className="sm:hidden">Submit</span>
                </Button>
              </div>
            </div>

            {/* Removed Search Bar */}

            {/* Category Filters */}
            <div className="mb-4">
              {/* Mobile & Tablet: Horizontal Scroll */}
              <div className="block xl:hidden">
                <HorizontalScrollContainer 
                  className="w-full"
                  showArrows={true}
                  arrowClassName="hidden sm:flex"
                >
                  <div className="flex gap-2 px-1">
                    {categoryFilters.map((filter) => {
                      const Icon = filter.icon;
                      return (
                        <Button
                          key={filter.value}
                          variant={selectedCategory === filter.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(filter.value)}
                          className={`cu-text-responsive-xs flex-shrink-0 ${
                            selectedCategory === filter.value
                              ? "cu-button"
                              : "border-gray-300 text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                          }`}
                        >
                          <Icon className="cu-icon-sm mr-2" />
                          {filter.label}
                        </Button>
                      );
                    })}
                  </div>
                </HorizontalScrollContainer>
              </div>

              {/* Desktop: Centered Flex Wrap */}
              <div className="hidden xl:flex xl:flex-wrap xl:justify-center xl:gap-2">
                {categoryFilters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <Button
                      key={filter.value}
                      variant={selectedCategory === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(filter.value)}
                      className={`cu-text-responsive-xs ${
                        selectedCategory === filter.value
                          ? "cu-button"
                          : "border-gray-300 text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                      }`}
                    >
                      <Icon className="cu-icon-sm mr-2" />
                      {filter.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Filters - Centered on All Devices */}
            <div className="flex flex-wrap justify-center gap-2">
              {difficultyFilters.map(level => (
                <Button
                  key={level.value}
                  variant={selectedDifficulty === level.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDifficulty(level.value)}
                  className={`cu-text-responsive-xs ${
                    selectedDifficulty === level.value
                      ? "cu-button"
                      : "border-gray-300 text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                  }`}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 cu-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-white animate-pulse" />
              </div>
              <p className="cu-text-responsive-sm text-gray-500">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="cu-text-responsive-lg font-semibold text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 cu-text-responsive-sm">Try adjusting your filters</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedDifficulty("all");
                }}
                className="mt-6"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <AnimatePresence>
                {filteredTemplates.map((template, index) => {
                  const diffConfig = difficultyConfig[template.difficulty_level] || difficultyConfig.beginner;
                  const creator = template.creator || {
                    full_name: 'Anonymous',
                    profile_image: null,
                    email: template.created_by
                  };
                  const displayCategory = getTemplateCategoryDisplay(template);

                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="cu-card h-full flex flex-col border-t-4 border-purple-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`p-3 rounded-lg ${getCategoryIcon(template.category === 'other' ? 'other' : template.category).color} flex-shrink-0`}>
                                {getCategoryIcon(template.category === 'other' ? 'other' : template.category).icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 line-clamp-2 cu-text-responsive-sm leading-tight mb-2">
                                  {template.title}
                                </h3>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge className={`text-xs border ${diffConfig.color} shadow-sm`}>
                              {diffConfig.icon}
                              <span className="ml-1 capitalize">{template.difficulty_level}</span>
                            </Badge>
                            {template.estimated_duration && (
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                                <Clock className="w-3 h-3 mr-1" />
                                {template.estimated_duration}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                              {displayCategory}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-grow pb-3 space-y-3">
                          <p className="text-gray-700 line-clamp-3 cu-text-responsive-xs leading-relaxed">
                            {template.description}
                          </p>

                          {template.target_skills && template.target_skills.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
                                <Star className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                                Skills You'll Learn
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {template.target_skills.slice(0, 3).map((skill) => (
                                  <Badge key={skill} className="cu-text-responsive-xs bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200">
                                    {skill}
                                  </Badge>
                                ))}
                                {template.target_skills.length > 3 && (
                                  <Badge variant="outline" className="cu-text-responsive-xs border-purple-200 text-purple-600">
                                    +{template.target_skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {template.learning_resources && template.learning_resources.length > 0 && (
                            <div className="flex items-center text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                              <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                              <span>{template.learning_resources.length} learning resources</span>
                            </div>
                          )}

                          {creator.full_name && (
                            <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                              <Avatar className="w-6 h-6 border-2 border-white shadow-sm">
                                <AvatarImage src={creator.profile_image} className="object-cover" />
                                <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                  {creator.full_name?.[0] || 'A'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-600">by {creator.full_name}</span>
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="bg-gradient-to-r from-gray-50 to-purple-50/30 border-t border-purple-100/50 p-4">
                          <div className="flex items-center justify-between w-full gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewTemplate(template)}
                              className="cu-text-responsive-xs flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                              <Eye className="cu-icon-sm mr-1.5" />
                              Preview
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewTemplate(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6"> {/* Added space-y-6 here */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{previewTemplate.title}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={difficultyConfig[previewTemplate.difficulty_level]?.color || "bg-gray-100"}>
                      {previewTemplate.difficulty_level}
                    </Badge>
                    {previewTemplate.estimated_duration && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {previewTemplate.estimated_duration}
                      </div>
                    )}
                    <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50">
                      {getTemplateCategoryDisplay(previewTemplate)}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(null)}>
                  <span className="text-2xl">&times;</span>
                </Button>
              </div>

              <p className="text-gray-600">{previewTemplate.description}</p>

              {previewTemplate.target_skills && previewTemplate.target_skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Skills You'll Learn</h3>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.target_skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {previewTemplate.suggested_tools && previewTemplate.suggested_tools.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Suggested Tools</h3>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.suggested_tools.map((tool, idx) => (
                      <Badge key={idx} variant="outline">{tool}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {previewTemplate.learning_resources && previewTemplate.learning_resources.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Learning Resources</h3>
                  <ul className="space-y-2">
                    {previewTemplate.learning_resources.map((resource, idx) => (
                      <li key={idx}>
                        <a href={resource} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-sm break-all">
                          {resource}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Display Project Instructions */}
              {previewTemplate.project_instructions && (
                <div className="space-y-4 pt-4 border-t">
                   <h3 className="font-bold text-lg text-gray-900 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                    Project Guide
                  </h3>
                  <p className="text-gray-600 text-sm">{previewTemplate.project_instructions.overview}</p>

                  {['setup', 'development', 'launch'].map(phaseKey => {
                    // Adjusted icon mapping for semantic consistency
                    const Icon = {setup: Settings, development: Code, launch: Rocket}[phaseKey]; 
                    const phase = previewTemplate.project_instructions[`${phaseKey}_phase`];
                    if (!phase) return null;
                    
                    return (
                      <Card key={phaseKey} className="cu-card bg-gray-50">
                        <CardHeader onClick={() => togglePreviewSection(phaseKey)} className="cursor-pointer flex flex-row items-center justify-between p-4">
                          <CardTitle className="text-base font-semibold flex items-center">
                            <Icon className="w-4 h-4 mr-2" /> {phase.title}
                          </CardTitle>
                          {expandedSections[phaseKey] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </CardHeader>
                        {expandedSections[phaseKey] && (
                          <CardContent className="px-4 pb-4 space-y-3">
                            <p className="text-sm text-gray-600">{phase.description}</p>
                            {phase.steps && phase.steps.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Steps:</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                  {phase.steps.map((step, i) => <li key={i}>{step}</li>)}
                                </ul>
                              </div>
                            )}
                            {phase.deliverables && phase.deliverables.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Deliverables:</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                  {phase.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                  
                  {previewTemplate.project_instructions.success_criteria && previewTemplate.project_instructions.success_criteria.length > 0 && (
                     <Card className="cu-card bg-green-50 border-green-200">
                        <CardHeader onClick={() => togglePreviewSection('success')} className="cursor-pointer flex flex-row items-center justify-between p-4">
                           <CardTitle className="text-base font-semibold flex items-center text-green-800">
                            <Award className="w-4 h-4 mr-2" /> Success Criteria
                          </CardTitle>
                          {expandedSections['success'] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </CardHeader>
                        {expandedSections['success'] && (
                          <CardContent className="px-4 pb-4">
                            <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                              {previewTemplate.project_instructions.success_criteria.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </CardContent>
                        )}
                      </Card>
                  )}

                  {previewTemplate.project_instructions.common_challenges && previewTemplate.project_instructions.common_challenges.length > 0 && (
                     <Card className="cu-card bg-yellow-50 border-yellow-200">
                        <CardHeader onClick={() => togglePreviewSection('challenges')} className="cursor-pointer flex flex-row items-center justify-between p-4">
                           <CardTitle className="text-base font-semibold flex items-center text-yellow-800">
                            <AlertTriangle className="w-4 h-4 mr-2" /> Common Challenges
                          </CardTitle>
                          {expandedSections['challenges'] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </CardHeader>
                        {expandedSections['challenges'] && (
                          <CardContent className="px-4 pb-4 space-y-3">
                             {previewTemplate.project_instructions.common_challenges.map((c, i) => (
                               <div key={i}>
                                 <h4 className="font-semibold text-sm text-yellow-900">{c.challenge}</h4>
                                 <p className="text-sm text-yellow-700">{c.solution}</p>
                               </div>
                             ))}
                          </CardContent>
                        )}
                      </Card>
                  )}

                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)} className="flex-1">
                  Close
                </Button>
                <Button onClick={() => handleUseTemplate(previewTemplate)} className="flex-1 cu-button">
                  <Rocket className="w-4 h-4 mr-2" />
                  Use This Template
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
