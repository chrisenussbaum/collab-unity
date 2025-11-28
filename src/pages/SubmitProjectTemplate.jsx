import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ProjectTemplate, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, Lightbulb, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ArrayInputWithSearch from "@/components/ArrayInputWithSearch";

const TEMPLATE_CATEGORIES = [
  { value: "technology", label: "Technology" },
  { value: "content", label: "Content" },
  { value: "business", label: "Business" },
  { value: "design", label: "Design" },
  { value: "data_science", label: "Data Science" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" }
];

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

export default function SubmitProjectTemplate({ currentUser }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    custom_category: "",
    difficulty_level: "beginner",
    estimated_duration: "",
    target_skills: [],
    suggested_tools: [],
    learning_resources: [],
    tags: [],
    project_instructions: {
      overview: "",
      planning_phase: {
        title: "Planning Phase",
        description: "",
        steps: [],
        deliverables: []
      },
      execution_phase: {
        title: "Execution Phase",
        description: "",
        steps: [],
        deliverables: []
      },
      delivery_phase: {
        title: "Delivery Phase",
        description: "",
        steps: [],
        deliverables: []
      },
      success_criteria: [],
      common_challenges: []
    }
  });

  const [newResource, setNewResource] = useState("");
  const [newPlanningStep, setNewPlanningStep] = useState("");
  const [newPlanningDeliverable, setNewPlanningDeliverable] = useState("");
  const [newExecutionStep, setNewExecutionStep] = useState("");
  const [newExecutionDeliverable, setNewExecutionDeliverable] = useState("");
  const [newDeliveryStep, setNewDeliveryStep] = useState("");
  const [newDeliveryDeliverable, setNewDeliveryDeliverable] = useState("");
  const [newSuccessCriteria, setNewSuccessCriteria] = useState("");
  const [newChallenge, setNewChallenge] = useState({ challenge: "", solution: "" });

  useEffect(() => {
    if (!currentUser) {
      toast.error("Please sign in to submit a template.");
      navigate(createPageUrl("Discover"));
    }
  }, [currentUser, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleInstructionsChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      project_instructions: {
        ...prev.project_instructions,
        [section]: typeof prev.project_instructions[section] === 'object' && section !== 'success_criteria' && section !== 'common_challenges'
          ? { ...prev.project_instructions[section], [field]: value }
          : value
      }
    }));
  };

  const addToArray = (field, value) => {
    if (value && value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeFromArray = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addToPhaseArray = (phase, field, value) => {
    if (value && value.trim()) {
      setFormData(prev => ({
        ...prev,
        project_instructions: {
          ...prev.project_instructions,
          [phase]: {
            ...prev.project_instructions[phase],
            [field]: [...prev.project_instructions[phase][field], value.trim()]
          }
        }
      }));
    }
  };

  const removeFromPhaseArray = (phase, field, index) => {
    setFormData(prev => ({
      ...prev,
      project_instructions: {
        ...prev.project_instructions,
        [phase]: {
          ...prev.project_instructions[phase],
          [field]: prev.project_instructions[phase][field].filter((_, i) => i !== index)
        }
      }
    }));
  };

  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = "Template title is required";
      if (!formData.description.trim()) newErrors.description = "Template description is required";
      if (!formData.category) newErrors.category = "Category is required";
      if (formData.category === "other" && !formData.custom_category.trim()) {
        newErrors.custom_category = "Custom category name is required";
      }
    }
    
    if (currentStep === 2) {
      if (formData.target_skills.length === 0) newErrors.target_skills = "At least one target skill is required";
      if (formData.suggested_tools.length === 0) newErrors.suggested_tools = "At least one suggested tool is required";
      if (!formData.difficulty_level) newErrors.difficulty_level = "Difficulty level is required";
    }
    
    if (currentStep === 3) {
      if (!formData.project_instructions.overview.trim()) {
        newErrors.overview = "Project overview is required";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const templateData = {
        ...formData,
        is_active: false, // Requires admin approval
        created_by: currentUser.email,
        creator_name: currentUser.full_name || currentUser.email.split('@')[0],
        creator_profile_image: currentUser.profile_image || ""
      };

      await ProjectTemplate.create(templateData);
      toast.success("Template submitted successfully! It will be reviewed by our team.");
      navigate(createPageUrl("ProjectTemplates"));
    } catch (error) {
      console.error("Error submitting template:", error);
      toast.error("Failed to submit template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("ProjectTemplates"))}
            className="mb-4 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Submit Project Template</h1>
          <p className="text-gray-600 mt-2">Share your project idea to help others learn and grow</p>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 mt-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full ${
                  step <= currentStep ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span className={currentStep >= 1 ? 'font-medium text-purple-600' : ''}>Basic Info</span>
            <span className={currentStep >= 2 ? 'font-medium text-purple-600' : ''}>Skills & Tools</span>
            <span className={currentStep >= 3 ? 'font-medium text-purple-600' : ''}>Instructions</span>
          </div>
        </motion.div>

        <Card className="cu-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-6 h-6 text-purple-600" />
              <span>
                {currentStep === 1 && "Basic Information"}
                {currentStep === 2 && "Skills & Tools"}
                {currentStep === 3 && "Project Instructions"}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Template Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Build a React To-Do App"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Template Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe what this project template will help users accomplish..."
                    rows={6}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                  </div>

                  {formData.category === "other" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom_category">Custom Category Name *</Label>
                      <Input
                        id="custom_category"
                        value={formData.custom_category}
                        onChange={(e) => handleInputChange("custom_category", e.target.value)}
                        placeholder="Enter custom category"
                        className={errors.custom_category ? 'border-red-500' : ''}
                      />
                      {errors.custom_category && <p className="text-sm text-red-500">{errors.custom_category}</p>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select 
                      value={formData.difficulty_level} 
                      onValueChange={(value) => handleInputChange("difficulty_level", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated_duration">Estimated Duration</Label>
                    <Input
                      id="estimated_duration"
                      value={formData.estimated_duration}
                      onChange={(e) => handleInputChange("estimated_duration", e.target.value)}
                      placeholder="e.g., 1-2 weeks, 2-4 months"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tags to help users find this template"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('tags', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeFromArray('tags', index)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Skills & Tools */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <ArrayInputWithSearch
                  title="Target Skills (Skills users will learn) *"
                  items={formData.target_skills}
                  onAdd={(skill) => addToArray('target_skills', skill)}
                  onRemove={(skill) => removeFromArray('target_skills', formData.target_skills.indexOf(skill))}
                  placeholder="Search skills or add custom..."
                  type="skills"
                />
                {errors.target_skills && <p className="text-sm text-red-500 -mt-4">{errors.target_skills}</p>}

                <ArrayInputWithSearch
                  title="Suggested Tools *"
                  items={formData.suggested_tools}
                  onAdd={(tool) => addToArray('suggested_tools', tool)}
                  onRemove={(tool) => removeFromArray('suggested_tools', formData.suggested_tools.indexOf(tool))}
                  placeholder="Search tools or add custom..."
                  type="tools"
                />
                {errors.suggested_tools && <p className="text-sm text-red-500 -mt-4">{errors.suggested_tools}</p>}

                <div className="space-y-2">
                  <Label>Learning Resources (Optional)</Label>
                  <p className="text-sm text-gray-500">Add URLs to helpful tutorials, documentation, or courses</p>
                  <div className="flex gap-2">
                    <Input
                      value={newResource}
                      onChange={(e) => setNewResource(e.target.value)}
                      placeholder="https://example.com/tutorial"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newResource.startsWith('http')) {
                            addToArray('learning_resources', newResource);
                            setNewResource('');
                          } else {
                            toast.error("Please enter a valid URL starting with http:// or https://");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (newResource.startsWith('http')) {
                          addToArray('learning_resources', newResource);
                          setNewResource('');
                        } else {
                          toast.error("Please enter a valid URL starting with http:// or https://");
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.learning_resources.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {formData.learning_resources.map((resource, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <a href={resource} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline truncate flex-1">
                            {resource}
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromArray('learning_resources', index)}
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

            {/* Step 3: Project Instructions */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="overview">Project Overview *</Label>
                  <Textarea
                    id="overview"
                    value={formData.project_instructions.overview}
                    onChange={(e) => handleInstructionsChange('overview', null, e.target.value)}
                    placeholder="Provide a high-level overview of what this project accomplishes and who it's for..."
                    rows={4}
                    className={errors.overview ? 'border-red-500' : ''}
                  />
                  {errors.overview && <p className="text-sm text-red-500">{errors.overview}</p>}
                </div>

                {/* Planning Phase */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-900">Planning Phase (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={formData.project_instructions.planning_phase.description}
                      onChange={(e) => handleInstructionsChange('planning_phase', 'description', e.target.value)}
                      placeholder="Describe the initial planning phase..."
                      rows={3}
                    />
                    
                    <div>
                      <Label className="text-sm">Planning Steps</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newPlanningStep}
                          onChange={(e) => setNewPlanningStep(e.target.value)}
                          placeholder="Add a planning step..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToPhaseArray('planning_phase', 'steps', newPlanningStep);
                              setNewPlanningStep('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            addToPhaseArray('planning_phase', 'steps', newPlanningStep);
                            setNewPlanningStep('');
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {formData.project_instructions.planning_phase.steps.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {formData.project_instructions.planning_phase.steps.map((step, index) => (
                            <li key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                              <span>{index + 1}. {step}</span>
                              <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => removeFromPhaseArray('planning_phase', 'steps', index)} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm">Expected Deliverables</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newPlanningDeliverable}
                          onChange={(e) => setNewPlanningDeliverable(e.target.value)}
                          placeholder="Add a deliverable..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToPhaseArray('planning_phase', 'deliverables', newPlanningDeliverable);
                              setNewPlanningDeliverable('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            addToPhaseArray('planning_phase', 'deliverables', newPlanningDeliverable);
                            setNewPlanningDeliverable('');
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {formData.project_instructions.planning_phase.deliverables.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {formData.project_instructions.planning_phase.deliverables.map((deliverable, index) => (
                            <li key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                              <span>• {deliverable}</span>
                              <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => removeFromPhaseArray('planning_phase', 'deliverables', index)} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Execution Phase */}
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-purple-900">Execution Phase (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={formData.project_instructions.execution_phase.description}
                      onChange={(e) => handleInstructionsChange('execution_phase', 'description', e.target.value)}
                      placeholder="Describe the core execution phase..."
                      rows={3}
                    />
                    
                    <div>
                      <Label className="text-sm">Execution Steps</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newExecutionStep}
                          onChange={(e) => setNewExecutionStep(e.target.value)}
                          placeholder="Add an execution step..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToPhaseArray('execution_phase', 'steps', newExecutionStep);
                              setNewExecutionStep('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            addToPhaseArray('execution_phase', 'steps', newExecutionStep);
                            setNewExecutionStep('');
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {formData.project_instructions.execution_phase.steps.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {formData.project_instructions.execution_phase.steps.map((step, index) => (
                            <li key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                              <span>{index + 1}. {step}</span>
                              <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => removeFromPhaseArray('execution_phase', 'steps', index)} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm">Expected Deliverables</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newExecutionDeliverable}
                          onChange={(e) => setNewExecutionDeliverable(e.target.value)}
                          placeholder="Add a deliverable..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToPhaseArray('execution_phase', 'deliverables', newExecutionDeliverable);
                              setNewExecutionDeliverable('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            addToPhaseArray('execution_phase', 'deliverables', newExecutionDeliverable);
                            setNewExecutionDeliverable('');
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {formData.project_instructions.execution_phase.deliverables.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {formData.project_instructions.execution_phase.deliverables.map((deliverable, index) => (
                            <li key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                              <span>• {deliverable}</span>
                              <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => removeFromPhaseArray('execution_phase', 'deliverables', index)} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Phase */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-900">Delivery Phase (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={formData.project_instructions.delivery_phase.description}
                      onChange={(e) => handleInstructionsChange('delivery_phase', 'description', e.target.value)}
                      placeholder="Describe the final delivery/completion phase..."
                      rows={3}
                    />
                    
                    <div>
                      <Label className="text-sm">Delivery Steps</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newDeliveryStep}
                          onChange={(e) => setNewDeliveryStep(e.target.value)}
                          placeholder="Add a delivery step..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToPhaseArray('delivery_phase', 'steps', newDeliveryStep);
                              setNewDeliveryStep('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            addToPhaseArray('delivery_phase', 'steps', newDeliveryStep);
                            setNewDeliveryStep('');
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {formData.project_instructions.delivery_phase.steps.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {formData.project_instructions.delivery_phase.steps.map((step, index) => (
                            <li key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                              <span>{index + 1}. {step}</span>
                              <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => removeFromPhaseArray('delivery_phase', 'steps', index)} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm">Expected Deliverables</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newDeliveryDeliverable}
                          onChange={(e) => setNewDeliveryDeliverable(e.target.value)}
                          placeholder="Add a deliverable..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToPhaseArray('delivery_phase', 'deliverables', newDeliveryDeliverable);
                              setNewDeliveryDeliverable('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            addToPhaseArray('delivery_phase', 'deliverables', newDeliveryDeliverable);
                            setNewDeliveryDeliverable('');
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {formData.project_instructions.delivery_phase.deliverables.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {formData.project_instructions.delivery_phase.deliverables.map((deliverable, index) => (
                            <li key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                              <span>• {deliverable}</span>
                              <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => removeFromPhaseArray('delivery_phase', 'deliverables', index)} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Success Criteria */}
                <div className="space-y-2">
                  <Label>Success Criteria (Optional)</Label>
                  <p className="text-sm text-gray-500">What indicates successful project completion?</p>
                  <div className="flex gap-2">
                    <Input
                      value={newSuccessCriteria}
                      onChange={(e) => setNewSuccessCriteria(e.target.value)}
                      placeholder="Add a success criterion..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInstructionsChange('success_criteria', null, [...formData.project_instructions.success_criteria, newSuccessCriteria]);
                          setNewSuccessCriteria('');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleInstructionsChange('success_criteria', null, [...formData.project_instructions.success_criteria, newSuccessCriteria]);
                        setNewSuccessCriteria('');
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.project_instructions.success_criteria.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {formData.project_instructions.success_criteria.map((criterion, index) => (
                        <li key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>✓ {criterion}</span>
                          <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500" onClick={() => {
                            const updated = formData.project_instructions.success_criteria.filter((_, i) => i !== index);
                            handleInstructionsChange('success_criteria', null, updated);
                          }} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Common Challenges */}
                <div className="space-y-2">
                  <Label>Common Challenges & Solutions (Optional)</Label>
                  <p className="text-sm text-gray-500">Help users anticipate and overcome obstacles</p>
                  <div className="space-y-2">
                    <Input
                      value={newChallenge.challenge}
                      onChange={(e) => setNewChallenge(prev => ({ ...prev, challenge: e.target.value }))}
                      placeholder="Describe a common challenge..."
                    />
                    <Textarea
                      value={newChallenge.solution}
                      onChange={(e) => setNewChallenge(prev => ({ ...prev, solution: e.target.value }))}
                      placeholder="Suggest a solution..."
                      rows={2}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (newChallenge.challenge && newChallenge.solution) {
                          handleInstructionsChange('common_challenges', null, [...formData.project_instructions.common_challenges, newChallenge]);
                          setNewChallenge({ challenge: "", solution: "" });
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Challenge
                    </Button>
                  </div>
                  {formData.project_instructions.common_challenges.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {formData.project_instructions.common_challenges.map((item, index) => (
                        <Card key={index} className="border-yellow-200 bg-yellow-50">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-yellow-900">{item.challenge}</p>
                                <p className="text-xs text-yellow-800 mt-1">{item.solution}</p>
                              </div>
                              <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500 ml-2 flex-shrink-0" onClick={() => {
                                const updated = formData.project_instructions.common_challenges.filter((_, i) => i !== index);
                                handleInstructionsChange('common_challenges', null, updated);
                              }} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              <div className="flex space-x-3">
                {currentStep < 3 ? (
                  <Button onClick={handleNext} className="cu-button">
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="cu-button"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}