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
import { ArrowLeft, Plus, X, Upload, Lightbulb, File as FileIcon, Trash2, UploadCloud, Link as LinkIcon, Sparkles, Loader2, PenLine } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import ArrayInputWithSearch from "@/components/ArrayInputWithSearch";
import { generateProjectSuggestions } from "@/functions/generateProjectSuggestions";

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
  const [currentStep, setCurrentStep] = useState(0); // 0 = initial choice, 1 = step 1, 2 = step 2
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
    logo_url: "",
    is_visible_on_feed: false,
  });

  const [newLink, setNewLink] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);
  
  useEffect(() => {
    User.me().then(setCurrentUser).catch(() => navigate(createPageUrl("Discover")));
  }, [navigate]);

  const handleBackNavigation = () => {
    if (currentStep === 1) {
      // On first step, navigate to the previous page in Collab Unity
      // Check if there's a referrer from within the app
      const canGoBack = window.history.length > 1;
      
      if (canGoBack) {
        // Try to go back in history
        navigate(-1);
      } else {
        // Fallback to Feed if no history
        navigate(createPageUrl("Feed"));
      }
    } else {
      // On other steps, go to previous step
      prevStep();
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
    if (newLink && !formData.project_urls.includes(newLink)) {
      if (!newLink.startsWith('http://') && !newLink.startsWith('https://')) {
        toast.error("Please enter a valid URL including http:// or https://");
        return;
      }
      addToArray('project_urls', newLink, setNewLink);
    }
  };

  const removeLink = (linkToRemove) => {
    removeFromArray('project_urls', linkToRemove);
  };

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 1) { // New Step 1 combines old Step 1 & 2
      if (!formData.title.trim()) newErrors.title = "Project title is required.";
      if (!formData.description.trim()) newErrors.description = "Project description is required.";
      if (!formData.logo_url) newErrors.logo_url = "Project logo is required.";
      if (!formData.project_type) newErrors.project_type = "Please select a project type.";
      if (!formData.classification) newErrors.classification = "Please select a classification.";
      if (!formData.industry) newErrors.industry = "Please select an industry.";
    }
    if (currentStep === 2) { // Old Step 3 becomes new Step 2
      if (!formData.area_of_interest.trim()) newErrors.area_of_interest = "Area of interest is required.";
      if (formData.area_of_interest.trim().length > 20) newErrors.area_of_interest = "Area of interest must be 20 characters or less.";
      if (!formData.location.trim()) newErrors.location = "Location is required."; 
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

      if (selectedTemplateId) {
        projectData.template_id = selectedTemplateId;
        
        if (templateLearningResources.length > 0) {
          projectData.learning_resources = templateLearningResources.map(url => {
            let title = url;
            try {
              const urlObj = new URL(url);
              title = urlObj.hostname.replace(/^www\./, '');
            } catch (e) {
              // Ignore invalid URLs, title remains full URL
            }
            return {
              title: title,
              url: url,
              description: 'Resource from project template'
            };
          }).filter(r => r.url.startsWith('http://') || r.url.startsWith('https://'));
        }
        
        if (templateProjectInstructions) {
          projectData.project_instructions = templateProjectInstructions;
        }
      }

      await Project.create(projectData); 
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
      if (currentStep < 2) setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
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

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleBackNavigation}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isFromTemplate ? 'Create Project from Template' : 'Create New Project'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {currentStep === 1 && 'Tell us about your project'}
                  {currentStep === 2 && 'Define your collaboration needs'}
                </p>
                {isFromTemplate && (
                  <div className="flex items-center mt-2">
                    <Badge className="bg-purple-100 text-purple-800">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Template Project
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div className="hidden sm:flex items-center space-x-2">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step <= currentStep
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  } ${Object.keys(errors).length > 0 && currentStep === step ? 'border-2 border-red-300' : ''}`}
                >
                  {step}
                </div>
              ))}
            </div>
          </motion.div>

          {isFromTemplate && (
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
                      <h3 className="font-medium text-purple-900 mb-1">Project Template Applied</h3>
                      <p className="text-sm text-purple-700">
                        We've pre-filled this form based on the template you selected. Feel free to customize any details to match your specific project needs.
                      </p>
                      {templateLearningResources.length > 0 && (
                        <div className="mt-2 text-sm text-purple-700">
                          <p className="font-semibold">Suggested Learning Resources:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {templateLearningResources.map((resource, index) => (
                              <li key={index}>
                                <a href={resource} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                                  {resource.length > 50 ? `${resource.substring(0, 47)}...` : resource}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateProjectInstructions && (
                        <div className="mt-2 text-sm text-purple-700">
                          <p className="font-semibold">This template includes guided instructions!</p>
                          <p>These will be available in your project's detail page after creation.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Card className="cu-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-purple-600" />
                <span>
                  {currentStep === 1 && "Project Information"}
                  {currentStep === 2 && "Collaboration Requirements"}
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
                        Location *
                      </Label>
                      <Input
                        id="location"
                        placeholder="e.g., Seattle, WA or Remote"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className={errors.location ? 'border-red-500' : ''}
                      />
                      {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Project Links (Optional)
                    </Label>
                    {formData.project_urls.length > 0 && (
                      <div className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50/50">
                        {formData.project_urls.map((link) => (
                          <div key={link} className="flex items-center justify-between text-sm">
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline truncate">
                              <LinkIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                              {link}
                            </a>
                            <button onClick={() => removeLink(link)} className="ml-4 flex-shrink-0 text-gray-500 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Input
                        placeholder="https://github.com/your-repo..."
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                      />
                      <Button type="button" variant="outline" onClick={addLink} disabled={!newLink}><Plus className="w-4 h-4"/></Button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Add links to your project's repository, live demo, or other relevant resources. (Max 10 links)
                    </p>
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

              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>

                <div className="flex space-x-3">
                  {currentStep < 2 ? (
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
        </div>
      </div>
    </>
  );
}