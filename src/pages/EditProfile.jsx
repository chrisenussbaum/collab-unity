
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/all";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, X, Upload, Edit, FileText, Download } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmationDialog from "../components/ConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ArrayInputWithSearch from "../components/ArrayInputWithSearch";
import { base44 } from "@/api/base44Client";


const EducationSection = ({ educationHistory, setEducationHistory }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentEducation, setCurrentEducation] = useState({ university_name: '', degree: '', major: '', graduation_date: '' });

  const handleOpenDialog = (index = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setCurrentEducation(educationHistory[index]);
    } else {
      setEditingIndex(null);
      setCurrentEducation({ university_name: '', degree: '', major: '', graduation_date: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!currentEducation.university_name || !currentEducation.degree || !currentEducation.major || !currentEducation.graduation_date) {
      toast.error("Please fill all education fields.");
      return;
    }
    let newHistory = [...educationHistory];
    if (editingIndex !== null) {
      newHistory[editingIndex] = currentEducation;
    } else {
      newHistory.push(currentEducation);
    }
    setEducationHistory(newHistory);
    setIsDialogOpen(false);
  };

  const handleRemove = (index) => {
    setEducationHistory(educationHistory.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Education</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" /> Add Education
        </Button>
      </div>
      <div className="space-y-4">
        {educationHistory.map((edu, index) => (
          <div key={index} className="p-4 border rounded-lg flex justify-between items-start">
            <div>
              <p className="font-semibold">{edu.university_name}</p>
              <p className="text-sm text-gray-600">{edu.degree} in {edu.major}</p>
              <p className="text-sm text-gray-500">{edu.graduation_date}</p>
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => handleOpenDialog(index)}><Edit className="w-4 h-4 text-gray-500" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)}><X className="w-4 h-4 text-red-500" /></Button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Education</DialogTitle>
            <DialogDescription>
              Provide details about your academic background.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="University Name" value={currentEducation.university_name} onChange={(e) => setCurrentEducation(prev => ({ ...prev, university_name: e.target.value }))} />
            <Input placeholder="Degree (e.g., B.A., M.Sc.)" value={currentEducation.degree} onChange={(e) => setCurrentEducation(prev => ({ ...prev, degree: e.target.value }))} />
            <Input placeholder="Major (e.g., Computer Science)" value={currentEducation.major} onChange={(e) => setCurrentEducation(prev => ({ ...prev, major: e.target.value }))} />
            <Input placeholder="Graduation Date (e.g., May 2025)" value={currentEducation.graduation_date} onChange={(e) => setCurrentEducation(prev => ({ ...prev, graduation_date: e.target.value }))} />
          </div>
          <Button onClick={handleSave}>{editingIndex !== null ? 'Save Changes' : 'Add Education'}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AwardsSection = ({ awardsHistory, setAwardsHistory }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentAward, setCurrentAward] = useState({ name: '', issuing_organization: '', date_received: '', credential_url: '' });

  const handleOpenDialog = (index = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setCurrentAward(awardsHistory[index]);
    } else {
      setEditingIndex(null);
      setCurrentAward({ name: '', issuing_organization: '', date_received: '', credential_url: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!currentAward.name || !currentAward.issuing_organization || !currentAward.date_received) {
      toast.error("Please fill all required award fields.");
      return;
    }
    let newHistory = [...awardsHistory];
    if (editingIndex !== null) {
      newHistory[editingIndex] = currentAward;
    } else {
      newHistory.push(currentAward);
    }
    setAwardsHistory(newHistory);
    setIsDialogOpen(false);
  };

  const handleRemove = (index) => {
    setAwardsHistory(awardsHistory.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Awards & Certifications</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" /> Add Award
        </Button>
      </div>
      <div className="space-y-4">
        {awardsHistory.map((award, index) => (
          <div key={index} className="p-4 border rounded-lg flex justify-between items-start">
            <div>
              <p className="font-semibold">{award.name}</p>
              <p className="text-sm text-gray-600">{award.issuing_organization} • {award.date_received}</p>
              {award.credential_url && <a href={award.credential_url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline">View Credential</a>}
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => handleOpenDialog(index)}><Edit className="w-4 h-4 text-gray-500" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)}><X className="w-4 h-4 text-red-500" /></Button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Award/Certification</DialogTitle>
            <DialogDescription>
              Add details about your awards, honors, or professional certifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Award/Certification Name" value={currentAward.name} onChange={(e) => setCurrentAward(prev => ({ ...prev, name: e.target.value }))} />
            <Input placeholder="Issuing Organization" value={currentAward.issuing_organization} onChange={(e) => setCurrentAward(prev => ({ ...prev, issuing_organization: e.target.value }))} />
            <Input placeholder="Date Received (e.g., Jan 2023)" value={currentAward.date_received} onChange={(e) => setCurrentAward(prev => ({ ...prev, date_received: e.target.value }))} />
            <Input placeholder="Credential URL (Optional)" value={currentAward.credential_url} onChange={(e) => setCurrentAward(prev => ({ ...prev, credential_url: e.target.value }))} />
          </div>
          <Button onClick={handleSave}>{editingIndex !== null ? 'Save Changes' : 'Add Award'}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function EditProfile({ currentUser, authIsLoading }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [originalProfileData, setOriginalProfileData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("");
  let checkUsernameTimeout = useRef(null);

  const [navigationConfirm, setNavigationConfirm] = useState({
    isOpen: false,
    proceed: null,
  });

  const profileImageInputRef = useRef(null);
  const coverImageInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const handleSafeNavigation = useCallback(() => {
    if (currentUser?.username) {
      navigate(createPageUrl(`UserProfile?username=${currentUser.username}`));
    } else {
      navigate(createPageUrl("UserProfile"));
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser) {
      const profileData = {
        username: currentUser.username || "",
        full_name: currentUser.full_name || "",
        location: currentUser.location || "",
        bio: currentUser.bio || "",
        skills: currentUser.skills || [],
        interests: currentUser.interests || [],
        tools_technologies: currentUser.tools_technologies || [],
        education: currentUser.education || [],
        awards_certifications: currentUser.awards_certifications || [],
        profile_image: currentUser.profile_image || "",
        cover_image: currentUser.cover_image || "",
        website_url: currentUser.website_url || "",
        linkedin_url: currentUser.linkedin_url || "",
        phone_number: currentUser.phone_number || "",
        birthday: currentUser.birthday || "",
        resume_url: currentUser.resume_url || "",
      };
      setFormData(profileData);
      setOriginalProfileData(profileData);
      setOriginalUsername(currentUser.username || "");
      setIsLoading(false);
    } else if (!authIsLoading) {
      setIsLoading(false);
    }
  }, [currentUser, authIsLoading]);

  useEffect(() => {
    if (originalProfileData && formData) {
      setIsDirty(JSON.stringify(formData) !== JSON.stringify(originalProfileData));
    }
  }, [formData, originalProfileData]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (checkUsernameTimeout.current) clearTimeout(checkUsernameTimeout.current);
    };
  }, [isDirty]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange(field, file_url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error(`Error uploading ${field}:`, error);
      toast.error(`Failed to upload ${field}. Please try again.`);
    } finally {
      setIsSaving(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document (.pdf, .doc, .docx).");
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB.");
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
      return;
    }

    setIsUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange("resume_url", file_url);
      toast.success("Resume uploaded successfully! Don't forget to save your changes.");
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error("Failed to upload resume. Please try again.");
    } finally {
      setIsUploadingResume(false);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  };

  const handleRemoveResume = () => {
    handleInputChange("resume_url", "");
    toast.success("Resume removed! Don't forget to save your changes.");
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3 || username === originalUsername) {
      setUsernameError("");
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const { checkUsernameAvailability: checkUsernameApi } = await import("@/functions/checkUsernameAvailability");
      const { data } = await checkUsernameApi({ username });

      if (!data.available) {
        setUsernameError(data.error || "This username is already taken");
      } else {
        setUsernameError("");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Error checking username availability");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    handleInputChange("username", sanitized);

    if (checkUsernameTimeout.current) clearTimeout(checkUsernameTimeout.current);
    checkUsernameTimeout.current = setTimeout(() => {
      checkUsernameAvailability(sanitized);
    }, 500);
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!formData.username?.trim()) newErrors.username = "Username is required.";
    if (usernameError) newErrors.username = usernameError;
    if (!formData.full_name?.trim()) newErrors.full_name = "Full name is required.";
    if (!formData.profile_image) newErrors.profile_image = "Profile photo is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (usernameError) {
      toast.error("Please choose a valid username before saving.");
      return;
    }
    if (!validateProfile()) {
      toast.error("Please fill all required fields before saving.");
      return;
    }

    setIsSaving(true);
    try {
      await base44.auth.updateMe(formData);
      toast.success("Profile saved successfully!");
      setOriginalProfileData(formData);
      setIsDirty(false);
      navigate(createPageUrl(formData.username ? `UserProfile?username=${formData.username}` : "UserProfile"));
    } catch (error) {
      console.error("Error saving profile:", error);
      if (error.message && error.message.includes("username")) {
        toast.error("This username is already taken. Please choose another.");
      } else {
        toast.error("Failed to save profile. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackNavigation = () => {
    if (!isDirty) {
      handleSafeNavigation();
    } else {
      setNavigationConfirm({
        isOpen: true,
        proceed: () => {
          handleSafeNavigation();
        },
      });
    }
  };

  const addToArray = (field, value) => {
    if (value && !formData[field].includes(value)) {
      handleInputChange(field, [...formData[field], value]);
    }
  };

  const removeFromArray = (field, valueToRemove) => {
    handleInputChange(field, formData[field].filter(item => item !== valueToRemove));
  };

  if (authIsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm sm:text-base">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Please sign in to edit your profile.</p>
          <Button onClick={() => User.login()} className="cu-button">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !formData.username) {
    return <div className="p-8 text-center">Loading profile editor...</div>;
  }

  return (
    <>
      <input type="file" accept="image/png, image/jpeg, image/jpg" ref={profileImageInputRef} onChange={(e) => handleImageUpload(e, 'profile_image')} className="hidden" />
      <input type="file" accept="image/png, image/jpeg, image/jpg" ref={coverImageInputRef} onChange={(e) => handleImageUpload(e, 'cover_image')} className="hidden" />
      <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" ref={resumeInputRef} onChange={handleResumeUpload} className="hidden" />

      <ConfirmationDialog
        isOpen={navigationConfirm.isOpen}
        onOpenChange={(open) => !open && setNavigationConfirm({ isOpen: false, proceed: null })}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmText="Leave Page"
        cancelText="Stay"
        onConfirm={() => {
          if (navigationConfirm.proceed) navigationConfirm.proceed();
          setNavigationConfirm({ isOpen: false, proceed: null });
        }}
        onCancel={() => setNavigationConfirm({ isOpen: false, proceed: null })}
        isDestructive={true}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackNavigation}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Profile</h1>
              </div>
              <Button type="submit" form="edit-profile-form" onClick={handleSubmit} disabled={isSaving || !isDirty || !!usernameError || isCheckingUsername} className="cu-button">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Card */}
              <Card className="cu-card">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">@</span>
                      </div>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="yourname"
                        className={`pl-7 ${errors.username ? 'border-red-500' : ''}`}
                        required
                      />
                    </div>
                    {isCheckingUsername && (
                      <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
                    )}
                    {errors.username && (
                      <p className="text-xs text-red-600 mt-1">{errors.username}</p>
                    )}
                    {formData.username && !errors.username && !isCheckingUsername && formData.username !== originalUsername && (
                      <p className="text-xs text-green-600 mt-1">✓ Username is available</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Your public profile URL: collabunity.app/UserProfile?username={formData.username || "yourname"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name <span className="text-red-500">*</span></Label>
                      <Input id="full_name" value={formData.full_name} onChange={(e) => handleInputChange("full_name", e.target.value)} className={errors.full_name ? 'border-red-500' : ''}/>
                      {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" placeholder="e.g., San Francisco, CA" value={formData.location} onChange={(e) => handleInputChange("location", e.target.value)} className={errors.location ? 'border-red-500' : ''}/>
                      {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biography</Label>
                    <Textarea id="bio" rows={5} placeholder="Tell everyone about yourself..." value={formData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} className={errors.bio ? 'border-red-500' : ''}/>
                    {errors.bio && <p className="text-sm text-red-500 mt-1">{errors.bio}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Profile Images */}
              <Card className="cu-card">
                <CardHeader>
                  <CardTitle>Profile Images</CardTitle>
                  <CardDescription>Click to upload new images.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Cover Photo <span className="text-gray-500 text-sm font-normal">(Optional)</span></Label>
                      <div onClick={() => coverImageInputRef.current.click()} className={`cursor-pointer h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed hover:border-purple-400 ${errors.cover_image ? 'border-red-500' : ''}`}>
                        {formData.cover_image ? <img src={formData.cover_image} className="w-full h-full object-cover rounded-lg" alt="Cover" /> : <Upload className="w-6 h-6 text-gray-400" />}
                      </div>
                      {errors.cover_image && <p className="text-sm text-red-500 mt-1">{errors.cover_image}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Profile Photo <span className="text-red-500">*</span></Label>
                      <div onClick={() => profileImageInputRef.current.click()} className={`cursor-pointer mx-auto w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed hover:border-purple-400 ${errors.profile_image ? 'border-red-500' : ''}`}>
                        {formData.profile_image ? <img src={formData.profile_image} className="w-full h-full object-cover rounded-full" alt="Profile" /> : <Upload className="w-8 h-8 text-gray-400" />}
                      </div>
                      {errors.profile_image && <p className="text-sm text-red-500 mt-1 text-center">{errors.profile_image}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact &amp; Links <span className="text-gray-500 text-sm font-normal">(All Optional)</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                      <Input id="linkedin_url" placeholder="https://linkedin.com/in/your-profile" value={formData.linkedin_url} onChange={(e) => handleInputChange("linkedin_url", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website_url">Personal Website URL</Label>
                      <Input id="website_url" placeholder="https://your-website.com" value={formData.website_url} onChange={(e) => handleInputChange("website_url", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input id="phone_number" type="tel" placeholder="(123) 456-7890" value={formData.phone_number} onChange={(e) => handleInputChange("phone_number", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthday">Birthday</Label>
                      <Input id="birthday" type="date" value={formData.birthday} onChange={(e) => handleInputChange("birthday", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cu-card">
                <CardHeader>
                  <CardTitle>Skills & Interests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <ArrayInputWithSearch
                    title="Skills"
                    field="skills"
                    items={formData.skills}
                    onAdd={(skill) => addToArray('skills', skill)}
                    onRemove={(skill) => removeFromArray('skills', skill)}
                    placeholder="Search skills or add custom..."
                    type="skills"
                    disabled={isSaving}
                  />
                  {errors.skills && <p className="text-sm text-red-500 -mt-6">{errors.skills}</p>}

                  <ArrayInputWithSearch
                    title="Tools & Technologies"
                    field="tools_technologies"
                    items={formData.tools_technologies}
                    onAdd={(tool) => addToArray('tools_technologies', tool)}
                    onRemove={(tool) => removeFromArray('tools_technologies', tool)}
                    placeholder="Search tools or add custom..."
                    type="tools"
                    disabled={isSaving}
                  />
                  {errors.tools_technologies && <p className="text-sm text-red-500 -mt-6">{errors.tools_technologies}</p>}

                  <ArrayInputWithSearch
                    title="Interests"
                    field="interests"
                    items={formData.interests}
                    onAdd={(interest) => addToArray('interests', interest)}
                    onRemove={(interest) => removeFromArray('interests', interest)}
                    placeholder="Search interests or add custom..."
                    type="interests"
                    disabled={isSaving}
                  />
                  {errors.interests && <p className="text-sm text-red-500 -mt-6">{errors.interests}</p>}
                </CardContent>
              </Card>

              <Card className="cu-card">
                <CardHeader>
                  <CardTitle>Education & Awards <span className="text-gray-500 text-sm font-normal">(Optional)</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <EducationSection
                    educationHistory={formData.education}
                    setEducationHistory={(newHistory) => handleInputChange('education', newHistory)}
                  />

                  <AwardsSection
                    awardsHistory={formData.awards_certifications}
                    setAwardsHistory={(newHistory) => handleInputChange('awards_certifications', newHistory)}
                  />
                </CardContent>
              </Card>

              {/* Resume Section - NEW */}
              <Card className="cu-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                    Resume/CV <span className="text-gray-500 text-sm font-normal ml-1">(Optional)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.resume_url ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-6 h-6 text-purple-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Resume Uploaded</p>
                            <p className="text-xs text-gray-500">Click to view or download</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={formData.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button type="button" variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveResume}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => resumeInputRef.current?.click()}
                        disabled={isUploadingResume || isSaving}
                        className="w-full"
                      >
                        {isUploadingResume ? "Uploading..." : "Replace Resume"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-sm text-gray-500 mb-4">
                        Upload your resume to share with others
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => resumeInputRef.current?.click()}
                        disabled={isUploadingResume || isSaving}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {isUploadingResume ? "Uploading..." : "Upload Resume"}
                      </Button>
                      <p className="text-xs text-gray-400 mt-2">
                        Accepts PDF or Word documents (max 10MB)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}
