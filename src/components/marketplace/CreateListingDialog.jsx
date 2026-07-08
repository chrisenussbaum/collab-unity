import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  X, Loader2, Briefcase, HandHeart, Plus, ChevronDown, ChevronLeft, ChevronRight,
  Image as ImageIcon, Upload, Check, Info, DollarSign
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const CATEGORIES = [
  "Design", "Development", "Marketing", "Writing & Content",
  "Video & Photo", "Music & Audio", "Business",
  "Career Development", "Resume Review", "Coaching & Mentoring", "Other"
];

const STEPS = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "Description" },
  { id: "pricing", label: "Pricing" },
  { id: "gallery", label: "Gallery" },
  { id: "publish", label: "Publish" },
];

const SERVICE_TYPES = {
  gig: ["One-time project", "Ongoing work", "Short-term gig", "Contract role"],
  service: ["One-time service", "Ongoing service", "Package deal", "Consultation"],
};

export default function CreateListingDialog({ currentUser, defaultType = "gig", onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [listingType, setListingType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [skillsNeeded, setSkillsNeeded] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [compensationType, setCompensationType] = useState("negotiable");
  const [compensationAmount, setCompensationAmount] = useState("");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(true);
  const [externalUrl, setExternalUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [mediaAttachments, setMediaAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skillsNeeded.includes(trimmed)) {
      setSkillsNeeded([...skillsNeeded, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setSkillsNeeded(skillsNeeded.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      addSkill();
    }
  };

  const getMediaType = (file) => {
    if (file.type.startsWith("video/")) return "video";
    return "image";
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
      toast.success("Logo uploaded");
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          toast.error(`${file.name} is not an image or video`);
          continue;
        }
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({
          media_url: file_url,
          media_type: getMediaType(file),
        });
      }
      setMediaAttachments([...mediaAttachments, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (error) {
      toast.error("Failed to upload media");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeMedia = (idx) => {
    setMediaAttachments(mediaAttachments.filter((_, i) => i !== idx));
  };

  const canProceed = () => {
    if (step === 0) return title.trim().length > 0 && category;
    if (step === 1) return description.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const listing = await base44.entities.MarketplaceListing.create({
        listing_type: listingType,
        title: title.trim(),
        description: description.trim(),
        category,
        skills_needed: skillsNeeded,
        compensation_type: compensationType,
        compensation_amount: compensationAmount.trim(),
        location: location.trim(),
        is_remote: isRemote,
        external_url: externalUrl.trim(),
        logo_url: logoUrl,
        media_attachments: mediaAttachments,
        posted_by_email: currentUser.email,
        posted_by_name: currentUser.full_name,
        posted_by_avatar: currentUser.profile_image || "",
        posted_by_username: currentUser.username || "",
        status: "open",
        application_count: 0,
      });
      toast.success(listingType === "gig" ? "Gig posted!" : "Service listed!");
      onCreated?.(listing);
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error("Failed to post listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleCount = title.length;
  const titleMax = 80;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-gray-50 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with stepper */}
        <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {listingType === "gig" ? "Create a Gig" : "Create a Service"}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="bg-white border-b border-gray-200 px-5 py-3">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                    i === step ? "text-purple-600" : i < step ? "text-purple-500 cursor-pointer hover:text-purple-700" : "text-gray-400"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                    i === step
                      ? "border-purple-600 bg-purple-600 text-white"
                      : i < step
                      ? "border-purple-500 bg-purple-50 text-purple-600"
                      : "border-gray-300 bg-white text-gray-400"
                  }`}>
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < step ? "bg-purple-500" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {/* Step 0: Overview */}
          {step === 0 && (
            <div className="space-y-5 max-w-lg mx-auto">
              {/* Type selector */}
              <div>
                <Label className="mb-2 block text-sm font-semibold text-gray-900">Listing Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setListingType("gig")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      listingType === "gig"
                        ? "bg-purple-50 border-purple-400 text-purple-700 ring-1 ring-purple-200"
                        : "bg-white border-gray-200 text-gray-600 hover:border-purple-200"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" /> Gig
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingType("service")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      listingType === "service"
                        ? "bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-200"
                        : "bg-white border-gray-200 text-gray-600 hover:border-indigo-200"
                    }`}
                  >
                    <HandHeart className="w-4 h-4" /> Service
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <Label className="mb-1.5 block text-sm font-semibold text-gray-900">Gig Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, titleMax))}
                  placeholder={listingType === "gig"
                    ? "I will help you build a portfolio website"
                    : "I will review and optimize your resume"}
                  maxLength={titleMax}
                  className="bg-white"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">As your storefront, make it catchy and clear.</p>
                  <span className={`text-xs ${titleCount > titleMax * 0.9 ? "text-amber-600" : "text-gray-400"}`}>
                    {titleCount} / {titleMax}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label className="mb-1.5 block text-sm font-semibold text-gray-900">Category *</Label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 bg-white border border-gray-200 rounded-lg pl-3 pr-8 text-sm text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Service type */}
              <div>
                <Label className="mb-1.5 block text-sm font-semibold text-gray-900">Service Type</Label>
                <div className="relative">
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full h-10 bg-white border border-gray-200 rounded-lg pl-3 pr-8 text-sm text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a service type</option>
                    {SERVICE_TYPES[listingType].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Description */}
          {step === 1 && (
            <div className="space-y-5 max-w-lg mx-auto">
              <div>
                <Label className="mb-1.5 block text-sm font-semibold text-gray-900">Description *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={listingType === "gig"
                    ? "Describe the gig — what needs to be done, timeline, deliverables..."
                    : "Describe your service — what you offer, what's included, turnaround time..."}
                  rows={6}
                  className="bg-white"
                />
                <p className="text-xs text-gray-400 mt-1">Be specific about what you offer and what's included.</p>
              </div>

              <div>
                <Label className="mb-1.5 block text-sm font-semibold text-gray-900">
                  Skills {listingType === "gig" ? "Needed" : "Offered"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Type a skill and press Enter"
                    className="flex-1 bg-white"
                  />
                  <Button type="button" variant="outline" onClick={addSkill} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {skillsNeeded.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {skillsNeeded.map((skill) => (
                      <Badge key={skill} className="bg-purple-100 text-purple-700 border border-purple-200 pr-1.5">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="ml-1 hover:bg-purple-200 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">Add up to 5 tags to help people find your listing.</p>
              </div>

              <div>
                <Label className="mb-1.5 block text-sm font-semibold text-gray-900">External URL (optional)</Label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://your-portfolio.com"
                  type="url"
                  className="bg-white"
                />
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-5 max-w-lg mx-auto">
              <div>
                <Label className="mb-2 block text-sm font-semibold text-gray-900">Compensation Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "paid", label: "Paid" },
                    { value: "unpaid", label: "Unpaid" },
                    { value: "negotiable", label: "Negotiable" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCompensationType(opt.value)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        compensationType === opt.value
                          ? "bg-purple-50 border-purple-400 text-purple-700 ring-1 ring-purple-200"
                          : "bg-white border-gray-200 text-gray-600 hover:border-purple-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {compensationType !== "unpaid" && (
                <div>
                  <Label className="mb-1.5 block text-sm font-semibold text-gray-900">
                    {compensationType === "paid" ? "Compensation Amount" : "Suggested Amount"}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={compensationAmount}
                      onChange={(e) => setCompensationAmount(e.target.value)}
                      placeholder={compensationType === "paid" ? "e.g. 500, 25/hr" : "e.g. 200 (negotiable)"}
                      className="pl-9 bg-white"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Enter the amount or rate for your {listingType}.</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="mb-1.5 block text-sm font-semibold text-gray-900">Location</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Seattle, WA"
                    disabled={isRemote}
                    className="bg-white"
                  />
                </div>
                <div className="flex flex-col items-center pt-5">
                  <div className="flex items-center gap-2">
                    <Switch checked={isRemote} onCheckedChange={setIsRemote} id="remote" />
                    <Label htmlFor="remote" className="text-sm cursor-pointer">Remote</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Gallery */}
          {step === 3 && (
            <div className="space-y-5 max-w-lg mx-auto">
              <div>
                <Label className="mb-1.5 block text-sm font-semibold text-gray-900">Logo / Brand Image</Label>
                <p className="text-xs text-gray-400 mb-2">This appears as the main thumbnail for your listing.</p>
                {logoUrl ? (
                  <div className="relative inline-block">
                    <img src={logoUrl} alt="Logo" className="w-24 h-24 rounded-lg object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-colors bg-white">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Click to upload a logo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploading} />
                  </label>
                )}
              </div>

              <div>
                <Label className="mb-1.5 block text-sm font-semibold text-gray-900">Media Gallery</Label>
                <p className="text-xs text-gray-400 mb-2">Add photos or short videos to showcase your work.</p>
                {mediaAttachments.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {mediaAttachments.map((media, idx) => (
                      <div key={idx} className="relative group">
                        {media.media_type === "video" ? (
                          <video src={media.media_url} className="w-full h-20 rounded-lg object-cover border border-gray-200" muted />
                        ) : (
                          <img src={media.media_url} alt="" className="w-full h-20 rounded-lg object-cover border border-gray-200" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full h-10 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-colors bg-white">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Add photos or videos</span>
                    </>
                  )}
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaUpload} disabled={isUploading} />
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Review & Publish */}
          {step === 4 && (
            <div className="max-w-lg mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Preview media thumbnail */}
                {(logoUrl || mediaAttachments.length > 0) && (
                  <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                    {mediaAttachments.length > 0 ? (
                      mediaAttachments[0].media_type === "video" ? (
                        <video src={mediaAttachments[0].media_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={mediaAttachments[0].media_url} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className={listingType === "gig" ? "bg-purple-600 text-white" : "bg-indigo-600 text-white"}>
                        {listingType === "gig" ? <Briefcase className="w-2.5 h-2.5 mr-1" /> : <HandHeart className="w-2.5 h-2.5 mr-1" />}
                        {listingType === "gig" ? "Gig" : "Service"}
                      </Badge>
                    </div>
                  </div>
                )}
                {/* Preview header */}
                <div className={`px-4 py-3 ${!logoUrl && mediaAttachments.length === 0 ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "border-b border-gray-100"}`}>
                  <p className={`${!logoUrl && mediaAttachments.length === 0 ? "text-white/70" : "text-gray-400"} text-xs font-medium uppercase tracking-wide`}>Preview</p>
                  <h3 className={`font-bold text-lg mt-0.5 ${!logoUrl && mediaAttachments.length === 0 ? "text-white" : "text-gray-900"}`}>{title || "Untitled Listing"}</h3>
                </div>
                <div className="p-4 space-y-3">
                  {/* Badges */}
                  {(!logoUrl && mediaAttachments.length === 0) && (
                    <div className="flex items-center gap-2">
                      <Badge className={listingType === "gig" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}>
                        {listingType === "gig" ? <Briefcase className="w-3 h-3 mr-1" /> : <HandHeart className="w-3 h-3 mr-1" />}
                        {listingType === "gig" ? "Gig" : "Service"}
                      </Badge>
                      {category && <Badge variant="outline" className="text-gray-600">{category}</Badge>}
                    </div>
                  )}
                  {category && logoUrl && mediaAttachments.length === 0 && (
                    <Badge variant="outline" className="text-gray-600">{category}</Badge>
                  )}
                  {category && (logoUrl || mediaAttachments.length > 0) && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-gray-600">{category}</Badge>
                    </div>
                  )}

                  {/* Service type */}
                  {serviceType && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">Service Type:</span>
                      <span className="text-gray-700 font-medium">{serviceType}</span>
                    </div>
                  )}

                  {/* Description */}
                  {description && <p className="text-sm text-gray-600 line-clamp-4">{description}</p>}

                  {/* Skills */}
                  {skillsNeeded.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                        {listingType === "gig" ? "Skills Needed" : "Skills Offered"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {skillsNeeded.map((s) => (
                          <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Media gallery thumbnails */}
                  {mediaAttachments.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Media Gallery</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {mediaAttachments.slice(0, 4).map((media, idx) => (
                          <div key={idx} className="w-full h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            {media.media_type === "video" ? (
                              <video src={media.media_url} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={media.media_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* External URL */}
                  {externalUrl && externalUrl !== "https://" && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">Link:</span>
                      <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 font-medium truncate">
                        {externalUrl}
                      </a>
                    </div>
                  )}

                  {/* Compensation + Location */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm font-bold text-gray-900">
                      {compensationType === "paid" && compensationAmount
                        ? `$${compensationAmount}`
                        : compensationType === "negotiable"
                        ? "Negotiable"
                        : "Unpaid"}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      {isRemote ? "Remote" : location || "Location TBD"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Review your listing above. Once published, it will appear in the Marketplace for others to discover and apply to.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            disabled={isSubmitting}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => canProceed() ? setStep(step + 1) : toast.error("Please complete required fields")}
              disabled={!canProceed() || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 gap-1"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 gap-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Publish {listingType === "gig" ? "Gig" : "Service"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}