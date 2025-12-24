import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Advertisement } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Megaphone, ArrowLeft, Upload, Sparkles, Send, Loader2, Trash2, CalendarIcon, ExternalLink, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format, differenceInDays, addDays } from "date-fns";

const AD_TYPES = [
  { value: "business", label: "Business" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "education", label: "Education" },
  { value: "collaborator", label: "Collaborator" }
];

const PLATFORM_VENMO_LINK = "https://account.venmo.com/u/chrisenussbaum";

export default function CreateAd({ currentUser }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedType = searchParams.get('type');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTargeting, setIsGeneratingTargeting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [errors, setErrors] = useState({});
  
  const imageInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    cta_text: "",
    cta_link: "",
    advertiser_name: "",
    advertiser_logo_url: "",
    type: preselectedType || "",
    frequency_cap_hours: 24,
    start_date: null,
    end_date: null,
  });

  useEffect(() => {
    if (!currentUser) {
      toast.error("Please sign in to create advertisements.");
      navigate(createPageUrl("Discover"));
      return;
    }

    // Pre-fill advertiser data from user profile
    setFormData(prev => ({
      ...prev,
      advertiser_name: currentUser.full_name || currentUser.email.split('@')[0],
      advertiser_logo_url: currentUser.profile_image || "",
      start_date: new Date(),
      end_date: addDays(new Date(), 7)
    }));
  }, [currentUser, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const isLogo = field === 'advertiser_logo_url';
    if (isLogo) {
      setIsUploadingLogo(true);
    } else {
      setIsUploadingImage(true);
    }

    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange(field, file_url);
      toast.success(`${isLogo ? 'Logo' : 'Image'} uploaded successfully!`);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload ${isLogo ? 'logo' : 'image'}.`);
    } finally {
      if (isLogo) {
        setIsUploadingLogo(false);
        if (logoInputRef.current) logoInputRef.current.value = "";
      } else {
        setIsUploadingImage(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = "Ad title is required";
    if (!formData.description.trim()) newErrors.description = "Ad description is required";
    if (!formData.image_url) newErrors.image_url = "Ad image is required";
    if (!formData.cta_text.trim()) newErrors.cta_text = "Call-to-action text is required";
    if (!formData.cta_link.trim()) newErrors.cta_link = "Call-to-action link is required";
    if (!formData.advertiser_name.trim()) newErrors.advertiser_name = "Advertiser name is required";
    if (!formData.advertiser_logo_url) newErrors.advertiser_logo_url = "Advertiser logo is required";
    if (!formData.type) newErrors.type = "Ad type is required";
    if (!formData.start_date) newErrors.start_date = "Start date is required";
    if (!formData.end_date) newErrors.end_date = "End date is required";

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = "End date must be after start date";
      }
    }

    if (formData.cta_link && !formData.cta_link.match(/^https?:\/\/.+/)) {
      newErrors.cta_link = "Please enter a valid URL (starting with http:// or https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTargeting = async (adData) => {
    setIsGeneratingTargeting(true);
    try {
      const { InvokeLLM } = await import("@/integrations/Core");
      
      const prompt = `Based on the following advertisement details, generate relevant targeting data:

Ad Title: ${adData.title}
Ad Description: ${adData.description}
Advertiser Type: ${adData.type}
Advertiser Name: ${adData.advertiser_name}

Please analyze this ad and provide:
1. target_categories: Array of 3-5 relevant categories (e.g., "technology", "design", "marketing", "business", "education", "healthcare", "finance", "e-commerce", "nonprofit", "entertainment", "sports", "science", "art", "music", "gaming", "food", "travel", "fashion", "real-estate", "automotive")
2. target_keywords: Array of 10-15 relevant keywords that describe the ad's focus areas, skills, industries, or topics
3. priority_score: A number from 1-10 indicating the relevance and value of this ad (1=lowest, 10=highest). Consider factors like: ad type (nonprofit/education should score higher), content quality, target audience value, and campaign goals.

Be specific and relevant to help match this ad with the right audience based on their skills, interests, and project involvement.`;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            target_categories: {
              type: "array",
              items: { type: "string" },
              description: "Array of relevant category strings"
            },
            target_keywords: {
              type: "array",
              items: { type: "string" },
              description: "Array of relevant keyword strings"
            },
            priority_score: {
              type: "number",
              minimum: 1,
              maximum: 10,
              description: "Priority score from 1-10"
            }
          },
          required: ["target_categories", "target_keywords", "priority_score"]
        }
      });

      return {
        target_categories: response.target_categories || [],
        target_keywords: response.target_keywords || [],
        priority_score: response.priority_score || 1
      };
    } catch (error) {
      console.error("Error generating targeting data:", error);
      toast.warning("Could not generate smart targeting. The ad will still be submitted.");
      return {
        target_categories: [],
        target_keywords: []
      };
    } finally {
      setIsGeneratingTargeting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      toast.info("Generating smart targeting for your ad...");
      const targetingData = await generateTargeting(formData);

      await Advertisement.create({
        ...formData,
        target_categories: targetingData.target_categories,
        target_keywords: targetingData.target_keywords,
        priority_score: targetingData.priority_score,
        is_active: false,
        created_by: currentUser.email
      });

      toast.success("Advertisement submitted successfully! It will be reviewed by our team before going live.");
      navigate(createPageUrl("Feed"));
    } catch (error) {
      console.error("Error creating advertisement:", error);
      toast.error("Failed to create advertisement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDaysDuration = () => {
    if (formData.start_date && formData.end_date) {
      return differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1;
    }
    return 0;
  };

  if (!currentUser) {
    return null;
  }

  const daysDuration = calculateDaysDuration();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleImageUpload(e, 'image_url')}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={logoInputRef}
        onChange={(e) => handleImageUpload(e, 'advertiser_logo_url')}
        accept="image/*"
        className="hidden"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Advertise"))}
            className="mb-4 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create Advertisement</h1>
          <p className="text-gray-600 mt-2">Promote your brand to the Collab Unity community</p>
        </motion.div>

        <Card className="cu-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Megaphone className="w-6 h-6 text-purple-600" />
              <span>Advertisement Details</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ad Content Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Ad Content</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Ad Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter a compelling headline..."
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Ad Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what you're offering..."
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Ad Banner Image *</Label>
                  <div 
                    onClick={() => !isUploadingImage && imageInputRef.current?.click()}
                    className={`cursor-pointer h-48 bg-gray-100 rounded-lg border-2 border-dashed flex items-center justify-center hover:bg-gray-200 transition-colors ${errors.image_url ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    {isUploadingImage ? (
                      <p className="text-gray-500">Uploading...</p>
                    ) : formData.image_url ? (
                      <img src={formData.image_url} alt="Ad preview" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Click to upload banner image</p>
                      </div>
                    )}
                  </div>
                  {errors.image_url && <p className="text-sm text-red-500">{errors.image_url}</p>}
                  {formData.image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInputChange('image_url', '')}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Remove Image
                    </Button>
                  )}
                </div>
              </div>

              {/* Call to Action Section */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900">Call to Action</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cta_text">Button Text *</Label>
                    <Input
                      id="cta_text"
                      value={formData.cta_text}
                      onChange={(e) => handleInputChange('cta_text', e.target.value)}
                      placeholder="e.g., Learn More, Join Now"
                      className={errors.cta_text ? 'border-red-500' : ''}
                    />
                    {errors.cta_text && <p className="text-sm text-red-500">{errors.cta_text}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cta_link">Destination URL *</Label>
                    <Input
                      id="cta_link"
                      value={formData.cta_link}
                      onChange={(e) => handleInputChange('cta_link', e.target.value)}
                      placeholder="https://your-website.com"
                      className={errors.cta_link ? 'border-red-500' : ''}
                    />
                    {errors.cta_link && <p className="text-sm text-red-500">{errors.cta_link}</p>}
                  </div>
                </div>
              </div>

              {/* Advertiser Info Section */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900">Advertiser Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="advertiser_name">Advertiser Name *</Label>
                    <Input
                      id="advertiser_name"
                      value={formData.advertiser_name}
                      onChange={(e) => handleInputChange('advertiser_name', e.target.value)}
                      placeholder="Your organization name"
                      className={errors.advertiser_name ? 'border-red-500' : ''}
                    />
                    {errors.advertiser_name && <p className="text-sm text-red-500">{errors.advertiser_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Ad Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select ad type" />
                      </SelectTrigger>
                      <SelectContent>
                        {AD_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Advertiser Logo *</Label>
                  <div 
                    onClick={() => !isUploadingLogo && logoInputRef.current?.click()}
                    className={`cursor-pointer h-32 bg-gray-100 rounded-lg border-2 border-dashed flex items-center justify-center hover:bg-gray-200 transition-colors ${errors.advertiser_logo_url ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    {isUploadingLogo ? (
                      <p className="text-gray-500">Uploading...</p>
                    ) : formData.advertiser_logo_url ? (
                      <img src={formData.advertiser_logo_url} alt="Logo preview" className="h-20 w-20 object-contain rounded-full" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Click to upload logo</p>
                        <p className="text-xs text-gray-400 mt-1">Required</p>
                      </div>
                    )}
                  </div>
                  {errors.advertiser_logo_url && <p className="text-sm text-red-500">{errors.advertiser_logo_url}</p>}
                  {formData.advertiser_logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInputChange('advertiser_logo_url', '')}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Remove Logo
                    </Button>
                  )}
                </div>
              </div>

              {/* Advertisement Budget Section */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900">Advertisement Budget</h3>
                
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Support Collab Unity</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Help us keep the platform free and improve features for everyone. Your support directly funds development and server costs.
                      </p>
                      <a 
                        href={PLATFORM_VENMO_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Support via Venmo (@chrisenussbaum)
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${errors.start_date ? 'border-red-500' : ''}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(new Date(formData.start_date), 'PPP') : 'Select start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.start_date}
                          onSelect={(date) => handleInputChange('start_date', date)}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${errors.end_date ? 'border-red-500' : ''}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(new Date(formData.end_date), 'PPP') : 'Select end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => handleInputChange('end_date', date)}
                          disabled={(date) => !formData.start_date || date < new Date(formData.start_date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.end_date && <p className="text-sm text-red-500">{errors.end_date}</p>}
                  </div>
                </div>

                {daysDuration > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-900">
                      <strong>Duration:</strong> {daysDuration} day{daysDuration !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      Your ad will be displayed from {format(new Date(formData.start_date), 'MMM d, yyyy')} to {format(new Date(formData.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency_cap">Frequency Cap (hours)</Label>
                  <Input
                    id="frequency_cap"
                    type="number"
                    min="1"
                    value={formData.frequency_cap_hours}
                    onChange={(e) => handleInputChange('frequency_cap_hours', parseInt(e.target.value) || 24)}
                  />
                  <p className="text-sm text-gray-500">Minimum hours between showing this ad to the same user</p>
                </div>
              </div>

              {/* Submit Section */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Advertise"))}
                  disabled={isSubmitting || isGeneratingTargeting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage || isUploadingLogo || isGeneratingTargeting}
                  className="cu-button"
                >
                  {isGeneratingTargeting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Targeting...
                    </>
                  ) : isSubmitting ? (
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}