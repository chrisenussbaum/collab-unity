import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, User, Notification } from "@/entities/all"; // Added Notification
import { UploadFile } from "@/integrations/Core";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, UploadCloud, Lightbulb, Trash2, Link as LinkIcon, DollarSign } from "lucide-react";
import ArrayInputWithSearch from "../components/ArrayInputWithSearch";

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

const PROJECT_STATUSES = [
    { value: "seeking_collaborators", label: "Seeking Collaborators" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
];

export default function EditProject({ currentUser, authIsLoading }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(null);
  const [project, setProject] = useState(null); // State to store the fetched project object
  
  const [newLink, setNewLink] = useState("");

  const logoInputRef = useRef(null);

  useEffect(() => {
    if (authIsLoading) {
      return; // Wait for authentication status to be determined
    }

    if (!currentUser) {
      setIsLoading(false); // Make sure isLoading is false so the auth required message can render
      return;
    }

    if (!projectId) {
      toast.error("No project ID found. Redirecting to My Projects.");
      navigate(createPageUrl("MyProjects"));
      return;
    }

    const loadProject = async () => {
      try {
        const projectData = await Project.filter({ id: projectId });
        if (projectData.length > 0) {
          const fetchedProject = projectData[0];
          
          // Check if the current user is the owner of the project (using email comparison)
          if (fetchedProject.created_by !== currentUser.email) {
            toast.error("You don't have permission to edit this project.");
            navigate(createPageUrl(`ProjectDetail?id=${projectId}`)); // Redirect to project detail page
            return;
          }

          setProject(fetchedProject); // Store the project object
          setFormData({
            title: fetchedProject.title || "",
            status: fetchedProject.status || "seeking_collaborators",
            description: fetchedProject.description || "",
            project_type: fetchedProject.project_type || "",
            classification: fetchedProject.classification || "",
            industry: fetchedProject.industry || "",
            area_of_interest: fetchedProject.area_of_interest || "",
            location: fetchedProject.location || "", 
            project_urls: fetchedProject.project_urls || [],
            skills_needed: fetchedProject.skills_needed || [],
            tools_needed: fetchedProject.tools_needed || [],
            logo_url: fetchedProject.logo_url || "",
            // Removed funding links as they are no longer editable on this page
          });
        } else {
          toast.error("Project not found.");
          setProject(null); // Explicitly set project to null if not found
          // The conditional render below will handle showing the "Project Not Found" message
        }
      } catch (error) {
        toast.error("Failed to load project data.");
        console.error("Error loading project:", error);
        setProject(null); // Explicitly set project to null on error
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true); // Indicate loading has started
    loadProject();
  }, [projectId, navigate, currentUser, authIsLoading]); // Add currentUser and authIsLoading to dependencies

  const handleInputChange = (field, value) => {
    if (field === 'description' && value.length > 500) {
      return;
    }
    
    // Limit area_of_interest to 20 characters
    if (field === 'area_of_interest' && value.length > 20) {
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  const addToArray = (field, value) => {
    if (value && !formData[field].includes(value)) {
      const newArray = [...formData[field], value];
      handleInputChange(field, newArray);
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
      addToArray('project_urls', newLink);
      setNewLink(""); // Clear the input after adding
    }
  };

  const removeLink = (linkToRemove) => {
    removeFromArray('project_urls', linkToRemove);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Check if status changed
      const statusChanged = project.status !== formData.status;
      const oldStatus = project.status;
      const newStatus = formData.status;

      await Project.update(projectId, formData);

      // If status changed, notify all collaborators except the current user
      if (statusChanged && project.collaborator_emails && project.collaborator_emails.length > 0) {
        const statusLabels = {
          seeking_collaborators: "Seeking Collaborators",
          in_progress: "In Progress",
          completed: "Completed"
        };

        const collaboratorsToNotify = project.collaborator_emails.filter(
          email => email !== currentUser.email
        );

        for (const collaboratorEmail of collaboratorsToNotify) {
          await Notification.create({
            user_email: collaboratorEmail,
            title: "Project status updated",
            message: `${currentUser.full_name || currentUser.email} changed the status of "${project.title}" from "${statusLabels[oldStatus]}" to "${statusLabels[newStatus]}".`,
            type: "project_status_changed",
            related_project_id: projectId,
            actor_email: currentUser.email,
            actor_name: currentUser.full_name || currentUser.email,
            metadata: {
              project_title: project.title,
              old_status: oldStatus,
              new_status: newStatus
            }
          });
        }
      }

      handleSafeNavigation();
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSafeNavigation = () => {
    // Navigate back to the project detail page, replacing the edit page in history
    if (projectId) {
      navigate(createPageUrl(`ProjectDetail?id=${projectId}`), { replace: true });
    } else {
      navigate(createPageUrl("MyProjects"), { replace: true });
    }
  };

  if (authIsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm sm:text-base">Loading project...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6">Please sign in to edit projects.</p>
          <Button onClick={() => User.login()} className="cu-button">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!project) { // Check if project data was successfully loaded and is accessible
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Project Not Found</h3>
          <p className="text-gray-600 mb-6">This project doesn't exist or you don't have access to edit it.</p>
          <Button onClick={() => navigate(createPageUrl("MyProjects"))}>
            Go to My Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <input
        type="file"
        accept="image/png, image/jpeg"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        className="hidden"
      />

      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost" 
              size="icon"
              onClick={handleSafeNavigation} 
            >
              <ArrowLeft className="w-5 h-5" /> 
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Project</h1> 
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="cu-button">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="cu-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-purple-600" />
                <span>Project Details</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Project Logo *</Label>
                  <div
                    onClick={() => !isSaving && logoInputRef.current.click()}
                    className="cursor-pointer aspect-square bg-gray-50 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 hover:border-purple-400 transition-colors p-2"
                  >
                    {isSaving ? (
                      <p className="text-sm">Uploading...</p>
                    ) : formData.logo_url ? (
                      <img src={formData.logo_url} alt="Project Logo" className="w-full h-full object-contain rounded-md" />
                    ) : (
                      <UploadCloud className="w-8 h-8" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Project Status</Label>
                <Select onValueChange={(value) => handleInputChange("status", value)} value={formData.status || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Project Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={8}
                  maxLength={500}
                  className="resize-none"
                />
                <div className="text-sm text-right text-gray-500">{formData.description.length}/500 characters</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Project Type *</Label>
                  <Select onValueChange={(value) => handleInputChange("project_type", value)} value={formData.project_type || ""}>
                    <SelectTrigger><SelectValue placeholder="Select project type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal">Personal Project</SelectItem>
                      <SelectItem value="Collaborative">Collaborative Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Classification *</Label>
                  <Select onValueChange={(value) => handleInputChange("classification", value)} value={formData.classification || ""}>
                    <SelectTrigger><SelectValue placeholder="Select classification" /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_CLASSIFICATIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Industry *</Label>
                  <Select onValueChange={(value) => handleInputChange("industry", value)} value={formData.industry || ""}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="area_of_interest" className="text-sm font-medium">Area of Interest *</Label>
                  <Input
                    id="area_of_interest"
                    placeholder="e.g., Web Dev, Marketing..."
                    value={formData.area_of_interest}
                    onChange={(e) => handleInputChange("area_of_interest", e.target.value)}
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.area_of_interest?.length || 0}/20 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
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
                field="skills_needed"
                items={formData.skills_needed || []}
                onAdd={(skill) => addToArray('skills_needed', skill)}
                onRemove={(skill) => removeFromArray('skills_needed', skill)}
                placeholder="Search skills or add custom..."
                type="skills"
              />

              <ArrayInputWithSearch
                title="Required Tools *"
                field="tools_needed"
                items={formData.tools_needed || []}
                onAdd={(tool) => addToArray('tools_needed', tool)}
                onRemove={(tool) => removeFromArray('tools_needed', tool)}
                placeholder="Search tools or add custom..."
                type="tools"
              />

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Project Links (Optional)
                </Label>
                {(formData.project_urls || []).length > 0 && (
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
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}