import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, User } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle }
from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Upload, Lightbulb, File as FileIcon, Trash2, UploadCloud, Link as LinkIcon, Loader2, PenLine, Image, Video, Wrench, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import ArrayInputWithSearch from "@/components/ArrayInputWithSearch";
import { generateProjectSuggestions } from "@/functions/generateProjectSuggestions";
import { base44 } from "@/api/base44Client";

const PROJECT_CLASSIFICATIONS = [
  { value: "educational", label: "Educational" },
  { value: "career_development", label: "Career Development" },
  { value: "hobby", label: "Hobby" },
  { value: "business", label: "Business" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "startup", label: "Startup" }
];

const PROJECT_INDUSTRIES = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "e_commerce_retail", label: "E-commerce & Retail" },
  { value: "entertainment_media", label: "Entertainment & Media" },
  { value: "art_design", label: "Art & Design" },
  { value: "science_research", label: "Science & Research" },
  { value: "social_good", label: "Social Good" },
  { value: "other", label: "Other" },
];

export default function CreateProject() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = initial choice, 1 = step 1, 2 = step 2, 3 = step 3
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectIdea, setProjectIdea] = useState("");
  const [isAIAssisted, setIsAIAssisted] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_type: "",
    classification: "",
    industry: "", 
    area_of_interest: "",
    location: "", 
    project_urls: [],
    skills_needed: [],
    tools_needed: [],
    project_tools: [],
    highlights: [],
    logo_url: "",
    is_visible_on_feed: false,
    template_id: "",
    project_instructions: null,
    paypal_link: "",
    venmo_link: "",
    cashapp_link: "",
  });

  const [newLink, setNewLink] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [newToolName, setNewToolName] = useState("");
  const [newToolUrl, setNewToolUrl] = useState("");
  const logoInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  
  useEffect(() => {
    User.me().then(setCurrentUser).catch(() => navigate(createPageUrl("Discover")));
  }, [navigate]);

  // Handle template data from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromTemplate = params.get('fromTemplate');
    
    if (fromTemplate === 'true') {
      const templateId = params.get('templateId');
      const title = params.get('title');
      const description = params.get('description');
      const skills = params.get('skills');
      const tools = params.get('tools');
      const projectInstructions = params.get('projectInstructions');
      
      setFormData(prev => ({
        ...prev,
        title: title || "",
        description: description || "",
        skills_needed: skills ? JSON.parse(skills) : [],
        tools_needed: tools ? JSON.parse(tools) : [],
        template_id: templateId || "",
        project_instructions: projectInstructions ? JSON.parse(projectInstructions) : null,
      }));
      
      setIsAIAssisted(true);
      setCurrentStep(1);
    }
  }, [location.search]);

  const handleBackNavigation = () => {
    if (currentStep === 0) {
      // On initial screen, navigate back
      const canGoBack = window.history.length > 1;
      if (canGoBack) {
        navigate(-1);
      } else {
        navigate(createPageUrl("Feed"));
      }
    } else if (currentStep === 1) {
      // On step 1, go back to initial choice
      setCurrentStep(0);
      setErrors({});
    } else {
      // On other steps, go to previous step
      prevStep();
    }
  };

  const handleStartFromScratch = () => {
    setIsAIAssisted(false);
    setFormData({
      title: "",
      description: "",
      project_type: "",
      classification: "",
      industry: "", 
      area_of_interest: "",
      location: "", 
      project_urls: [],
      skills_needed: [],
      tools_needed: [],
      project_tools: [],
      highlights: [],
      logo_url: "",
      is_visible_on_feed: false,
      template_id: "",
      project_instructions: null,
      paypal_link: "",
      venmo_link: "",
      cashapp_link: "",
    });
    setCurrentStep(1);
  };

  const handleGenerateProject = async () => {
    if (!projectIdea.trim()) {
      toast.error("Please describe your project idea first.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateProjectSuggestions({ projectIdea: projectIdea.trim() });
      const suggestions = response.data;

      if (suggestions) {
        setFormData(prev => ({
          ...prev,
          title: suggestions.title || "",
          description: suggestions.description || "",
          project_type: suggestions.project_type || "",
          classification: suggestions.classification || "",
          industry: suggestions.industry || "",
          area_of_interest: (suggestions.area_of_interest || "").substring(0, 20),
          skills_needed: suggestions.skills_needed || [],
          tools_needed: suggestions.tools_needed || [],
        }));
        setIsAIAssisted(true);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error("Error generating project suggestions:", error);
      toast.error("Failed to generate suggestions. Please try again or start from scratch.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'description' && value.length > 500) {
      return; 
    }
    
    // Limit area_of_interest to 20 characters
    if (field === 'area_of_interest' && value.length > 20) {
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange("logo_url", file_url);
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo.");
    } finally {
      if(logoInputRef.current) {
        logoInputRef.current.value = "";
      }
      setIsUploadingLogo(false);
    }
  };

  const addToArray = (field, value, setValue = null) => {
    if (value && !formData[field].includes(value)) {
      const newArray = [...formData[field], value];
      handleInputChange(field, newArray); 
      if (setValue) {
        setValue("");
      }
    }
  };

  const removeFromArray = (field, valueToRemove) => {
    const newArray = formData[field].filter(item => item !== valueToRemove);
    handleInputChange(field, newArray);
  };

  const addLink = () => {
    if (formData.project_urls.length >= 10) {
      return;
    }
    if (newLink) {
      if (!newLink.startsWith('http://') && !newLink.startsWith('https://')) {
        toast.error("Please enter a valid URL including http:// or https://");
        return;
      }
      const linkObj = {
        title: newLinkTitle.trim() || '',
        url: newLink.trim()
      };
      setFormData(prev => ({
        ...prev,
        project_urls: [...prev.project_urls, linkObj]
      }));
      setNewLink("");
      setNewLinkTitle("");
    }
  };

  const removeLink = (index) => {
    setFormData(prev => ({
      ...prev,
      project_urls: prev.project_urls.filter((_, i) => i !== index)
    }));
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploadingMedia(true);
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const { file_url } = await UploadFile({ file });
        
        // Generate thumbnail for videos
        let thumbnailUrl = null;
        if (isVideo) {
          try {
            const thumbnailFile = await generateVideoThumbnail(file);
            if (thumbnailFile) {
              const { file_url: thumb_url } = await UploadFile({ file: thumbnailFile });
              thumbnailUrl = thumb_url;
            }
          } catch (thumbError) {
            console.warn("Could not generate video thumbnail:", thumbError);
          }
        }
        
        const newHighlight = {
          media_url: file_url,
          media_type: isVideo ? 'video' : 'image',
          thumbnail_url: thumbnailUrl,
          caption: '',
          file_name: file.name,
          file_size: file.size,
          uploaded_by: currentUser?.email,
          uploaded_at: new Date().toISOString()
        };
        
        setFormData(prev => ({
          ...prev,
          highlights: [...prev.highlights, newHighlight]
        }));
      }
      toast.success(`Uploaded ${files.length} file(s)`);
    } catch (error) {
      console.error("Error uploading media:", error);
      toast.error("Failed to upload media.");
    } finally {
      if (mediaInputRef.current) mediaInputRef.current.value = "";
      setIsUploadingMedia(false);
    }
  };

  // Function to generate thumbnail from video
  const generateVideoThumbnail = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      const videoURL = URL.createObjectURL(videoFile);
      video.src = videoURL;

      video.addEventListener('loadeddata', () => {
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      });

      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(videoURL);
          if (blob) {
            const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
            resolve(thumbnailFile);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.85);
      });

      video.addEventListener('error', (e) => {
        URL.revokeObjectURL(videoURL);
        reject(new Error('Failed to load video for thumbnail generation'));
      });

      video.load();
    });
  };

  const removeHighlight = (index) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const addProjectTool = () => {
    if (!newToolName.trim()) {
      toast.error("Please enter a tool name");
      return;
    }
    
    const tool = {
      name: newToolName.trim(),
      url: newToolUrl.trim() || '',
      icon: '🔧'
    };
    
    setFormData(prev => ({
      ...prev,
      project_tools: [...prev.project_tools, tool]
    }));
    setNewToolName("");
    setNewToolUrl("");
  };

  const removeProjectTool = (index) => {
    setFormData(prev => ({
      ...prev,
      project_tools: prev.project_tools.filter((_, i) => i !== index)
    }));
  };

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = "Project title is required.";
      if (!formData.description.trim()) newErrors.description = "Project description is required.";
      if (!formData.logo_url) newErrors.logo_url = "Project logo is required.";
      if (!formData.project_type) newErrors.project_type = "Please select a project type.";
      if (!formData.classification) newErrors.classification = "Please select a classification.";
      if (!formData.industry) newErrors.industry = "Please select an industry.";
    }
    if (currentStep === 2) {
      if (!formData.area_of_interest.trim()) newErrors.area_of_interest = "Area of interest is required.";
      if (formData.area_of_interest.trim().length > 20) newErrors.area_of_interest = "Area of interest must be 20 characters or less.";
      if (formData.skills_needed.length === 0) newErrors.skills_needed = "At least one skill is required.";
      if (formData.tools_needed.length === 0) newErrors.tools_needed = "At least one tool is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      toast.error("Please fix the errors before publishing.");
      return;
    }
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const projectData = {
        ...formData,
        collaborator_emails: [currentUser.email],
        current_collaborators_count: 1
      };

      // Only include template_id and project_instructions if they exist
      if (!projectData.template_id) delete projectData.template_id;
      if (!projectData.project_instructions) delete projectData.project_instructions;

      const newProject = await Project.create(projectData);
      
      // Award points for creating project
      try {
        await base44.functions.invoke('awardPoints', {
          action: 'project_created',
          user_email: currentUser.email
        });
      } catch (error) {
        console.error("Error awarding points:", error);
      }
      
      navigate(createPageUrl("MyProjects"));
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project. Please check your inputs and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < 3) setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 1) {
      setCurrentStep(0);
    }
    setErrors({});
  };
  
  return (
    <>
      <input
        type="file"
        accept="image/png, image/jpeg"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*,video/*"
        ref={mediaInputRef}
        onChange={handleMediaUpload}
        multiple
        className="hidden"
      />

      <div className={`min-h-screen bg-gray-50 ${currentStep === 0 ? 'flex items-center justify-center py-4' : 'py-4'}`}>
        <div className={`w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${currentStep === 0 ? '' : ''}`}>

          {/* Initial Choice Screen */}
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="cu-card">
                <CardHeader className="text-center pb-2">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/98181e664_collab-unity-lightbulb-assistant.png"
                    alt="Project Assistant"
                    className="w-20 h-20 mx-auto mb-4"
                  />
                  <CardTitle className="text-2xl">How would you like to start?</CardTitle>
                  <p className="text-gray-600 mt-2">
                    Describe your project idea and let us help you get started, or start your project from scratch.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {/* Assisted Option */}
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Tell us about your project idea... For example: 'I want to create a mobile app that helps people track their daily water intake and reminds them to stay hydrated' or 'A community platform for local musicians to collaborate on songs'"
                      value={projectIdea}
                      onChange={(e) => setProjectIdea(e.target.value)}
                      rows={5}
                      className="resize-none text-base"
                    />
                    <Button
                      onClick={handleGenerateProject}
                      disabled={isGenerating || !projectIdea.trim()}
                      className="w-full cu-button py-6 text-lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating Project Details...
                        </>
                      ) : (
                        <>
                          Generate Project Details
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  {/* Start from Scratch Option */}
                  <Button
                    variant="outline"
                    onClick={handleStartFromScratch}
                    className="w-full py-6 text-lg border-2 hover:border-purple-300 hover:bg-purple-50"
                  >
                    <PenLine className="w-5 h-5 mr-2" />
                    Start from Scratch
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Browse Templates button removed - feature being reworked */}

          {/* Assisted Banner */}
          {isAIAssisted && currentStep > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-900 mb-1">
                        {formData.template_id ? 'Template Assistant' : 'Project Assistant'}
                      </h3>
                      <p className="text-sm text-purple-700">
                        {formData.template_id 
                          ? 'We\'ve pre-filled this form based on the template. Customize any details to match your specific needs.'
                          : 'We\'ve pre-filled this form based on your project idea. Feel free to customize any details to match your specific needs.'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep > 0 && (
          <Card className="cu-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-purple-600" />
                <span>
                  {currentStep === 1 && "Project Information"}
                  {currentStep === 2 && "Collaboration Requirements"}
                  {currentStep === 3 && "Media"}
                </span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                          Project Title *
                        </Label>
                        <Input
                          id="title"
                          placeholder="Enter an engaging project title..."
                          value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          className={`text-lg ${errors.title ? 'border-red-500' : ''}`}
                        />
                        {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">
                          Project Description *
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your project vision, goals, and what you hope to achieve..."
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          rows={8}
                          maxLength={500}
                          className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
                        />
                        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                        <div className={`text-sm text-right ${formData.description.length > 450 ? 'text-orange-600' : formData.description.length === 500 ? 'text-red-600' : 'text-gray-500'}`}>
                          {formData.description.length}/500 characters
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Project Logo *</Label>
                      <div
                        onClick={() => !isUploadingLogo && logoInputRef.current.click()}
                        className={`cursor-pointer aspect-square bg-gray-50 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 hover:border-purple-400 transition-colors p-2 ${errors.logo_url ? 'border-red-500' : ''}`}
                      >
                        {isUploadingLogo ? (
                          <p className="text-sm">Uploading...</p>
                        ) : formData.logo_url ? (
                          <img src={formData.logo_url} alt="Project Logo" className="w-full h-full object-contain rounded-md" />
                        ) : (
                          <>
                            <UploadCloud className="w-8 h-8" />
                            <p className="mt-2 text-xs text-center">Click to upload logo</p>
                          </>
                        )}
                      </div>
                      {errors.logo_url && <p className="text-sm text-red-500 mt-1">{errors.logo_url}</p>}
                      {formData.logo_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full text-red-500 hover:text-red-700"
                          onClick={() => handleInputChange("logo_url", "")}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Remove Logo
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Project Type *</Label>
                      <Select onValueChange={(value) => handleInputChange("project_type", value)} value={formData.project_type || undefined}>
                        <SelectTrigger className={errors.project_type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Personal">Personal Project</SelectItem>
                          <SelectItem value="Collaborative">Collaborative Project</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.project_type && <p className="text-sm text-red-500 mt-1">{errors.project_type}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Classification *</Label>
                      <Select onValueChange={(value) => handleInputChange("classification", value)} value={formData.classification || undefined}>
                        <SelectTrigger className={errors.classification ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_CLASSIFICATIONS.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.classification && <p className="text-sm text-red-500 mt-1">{errors.classification}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Industry *</Label>
                      <Select onValueChange={(value) => handleInputChange("industry", value)} value={formData.industry || undefined}>
                        <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_INDUSTRIES.map((ind) => (
                            <SelectItem key={ind.value} value={ind.value}>
                              {ind.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.industry && <p className="text-sm text-red-500 mt-1">{errors.industry}</p>}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Project Funding (Optional)
                    </Label>
                    <p className="text-xs text-gray-500">Add funding links to help support your project</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paypal_link" className="text-sm font-medium">PayPal Link</Label>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 whitespace-nowrap">
                            https://paypal.me/
                          </span>
                          <Input
                            id="paypal_link"
                            placeholder="username"
                            value={formData.paypal_link}
                            onChange={(e) => handleInputChange("paypal_link", e.target.value)}
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venmo_link" className="text-sm font-medium">Venmo Link</Label>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 whitespace-nowrap">
                            https://venmo.com/
                          </span>
                          <Input
                            id="venmo_link"
                            placeholder="username"
                            value={formData.venmo_link}
                            onChange={(e) => handleInputChange("venmo_link", e.target.value)}
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cashapp_link" className="text-sm font-medium">CashApp Link</Label>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 whitespace-nowrap">
                            https://cash.app/$
                          </span>
                          <Input
                            id="cashapp_link"
                            placeholder="username"
                            value={formData.cashapp_link}
                            onChange={(e) => handleInputChange("cashapp_link", e.target.value)}
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="area_of_interest" className="text-sm font-medium">
                        Area of Interest *
                      </Label>
                      <Input
                        id="area_of_interest"
                        placeholder="e.g., Web Dev, Marketing..."
                        value={formData.area_of_interest}
                        onChange={(e) => handleInputChange("area_of_interest", e.target.value)}
                        maxLength={20}
                        className={errors.area_of_interest ? 'border-red-500' : ''}
                      />
                      {errors.area_of_interest && <p className="text-sm text-red-500 mt-1">{errors.area_of_interest}</p>}
                      <p className="text-xs text-gray-500">
                        {formData.area_of_interest.length}/20 characters
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium">
                        Location
                      </Label>
                      <Input
                        id="location"
                        placeholder="e.g., Seattle, WA or Remote"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                      />
                    </div>
                  </div>

                  <ArrayInputWithSearch
                    title="Required Skills *"
                    items={formData.skills_needed}
                    onAdd={(skill) => addToArray('skills_needed', skill)}
                    onRemove={(skill) => removeFromArray('skills_needed', skill)}
                    placeholder="Search skills or add custom..."
                    type="skills"
                  />
                  {errors.skills_needed && <p className="text-sm text-red-500 -mt-6">{errors.skills_needed}</p>}

                  <ArrayInputWithSearch
                    title="Required Tools *"
                    items={formData.tools_needed}
                    onAdd={(tool) => addToArray('tools_needed', tool)}
                    onRemove={(tool) => removeFromArray('tools_needed', tool)}
                    placeholder="Search tools or add custom..."
                    type="tools"
                  />
                  {errors.tools_needed && <p className="text-sm text-red-500 -mt-6">{errors.tools_needed}</p>}
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Photos & Videos (Optional)
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">Add media to showcase your project</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => mediaInputRef.current.click()}
                        disabled={isUploadingMedia}
                        className="flex items-center gap-2"
                      >
                        {isUploadingMedia ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload Media
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {formData.highlights.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.highlights.map((highlight, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                              {highlight.media_type === 'video' ? (
                                <div className="relative w-full h-full">
                                  {highlight.thumbnail_url ? (
                                    <img 
                                      src={highlight.thumbnail_url} 
                                      alt="Video thumbnail"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Video className="w-8 h-8 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                    <Video className="w-8 h-8 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <img 
                                  src={highlight.media_url} 
                                  alt={highlight.caption || 'Project media'}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeHighlight(index)}
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {formData.highlights.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <Image className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No media added yet</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-6 border-t">
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Project Links (Optional)
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">Add relevant links for your project (max 10)</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Link title (e.g., GitHub Repo, Live Demo)"
                          value={newLinkTitle}
                          onChange={(e) => setNewLinkTitle(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://..."
                          value={newLink}
                          onChange={(e) => setNewLink(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addLink();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addLink}
                          variant="outline"
                          disabled={formData.project_urls.length >= 10}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {formData.project_urls.length > 0 && (
                      <div className="space-y-2">
                        {formData.project_urls.map((link, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex-1 min-w-0">
                              {link.title && (
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {link.title}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 truncate">
                                {link.url}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLink(index)}
                              className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}



              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                >
                  Previous
                </Button>

                <div className="flex space-x-3">
                  {currentStep < 3 ? (
                    <Button
                      onClick={nextStep}
                      className="cu-button"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="cu-button"
                    >
                      {isSubmitting ? "Creating Project..." : "Publish Project"}
                    </Button>
                  )}
                </div>
              </div>
                    </CardContent>
                    </Card>
                    )}
                    </div>
                    </div>
                    </>
                    );
                    }