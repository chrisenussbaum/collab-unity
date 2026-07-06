import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Loader2, Briefcase, HandHeart, Plus, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const CATEGORIES = [
  "Design", "Development", "Marketing", "Writing & Content",
  "Video & Photo", "Music & Audio", "Business",
  "Career Development", "Resume Review", "Coaching & Mentoring", "Other"
];

export default function CreateListingDialog({ currentUser, defaultType = "gig", onClose, onCreated }) {
  const [listingType, setListingType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [skillsNeeded, setSkillsNeeded] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [compensationType, setCompensationType] = useState("negotiable");
  const [compensationAmount, setCompensationAmount] = useState("");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(true);
  const [externalUrl, setExternalUrl] = useState("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900">Post a Listing</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type toggle */}
          <div>
            <Label className="mb-2 block">Listing Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setListingType("gig")}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  listingType === "gig"
                    ? "bg-purple-50 border-purple-300 text-purple-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-purple-200"
                }`}
              >
                <Briefcase className="w-4 h-4" /> Gig
              </button>
              <button
                type="button"
                onClick={() => setListingType("service")}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  listingType === "service"
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-indigo-200"
                }`}
              >
                <HandHeart className="w-4 h-4" /> Service
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label className="mb-1.5 block">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={listingType === "gig" ? "e.g. Need a logo designer for startup" : "e.g. Professional resume review & feedback"}
              maxLength={120}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label className="mb-1.5 block">Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={listingType === "gig"
                ? "Describe the gig — what needs to be done, timeline, deliverables..."
                : "Describe your service — what you offer, what's included, turnaround time..."}
              rows={4}
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label className="mb-1.5 block">Category *</Label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
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

          {/* Skills */}
          <div>
            <Label className="mb-1.5 block">Skills {listingType === "gig" ? "Needed" : "Offered"}</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill and press Enter"
                className="flex-1"
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
          </div>

          {/* Compensation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Compensation</Label>
              <div className="relative">
                <select
                  value={compensationType}
                  onChange={(e) => setCompensationType(e.target.value)}
                  className="w-full h-10 bg-white border border-gray-200 rounded-lg pl-3 pr-8 text-sm text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="negotiable">Negotiable</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Amount (optional)</Label>
              <Input
                value={compensationAmount}
                onChange={(e) => setCompensationAmount(e.target.value)}
                placeholder="e.g. $500, $25/hr"
              />
            </div>
          </div>

          {/* Location + Remote */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="mb-1.5 block">Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Seattle, WA"
                disabled={isRemote}
              />
            </div>
            <div className="flex flex-col items-center pt-5">
              <div className="flex items-center gap-2">
                <Switch checked={isRemote} onCheckedChange={setIsRemote} id="remote" />
                <Label htmlFor="remote" className="text-sm cursor-pointer">Remote</Label>
              </div>
            </div>
          </div>

          {/* External URL */}
          <div>
            <Label className="mb-1.5 block">External URL (optional)</Label>
            <Input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...
                </>
              ) : (
                listingType === "gig" ? "Post Gig" : "List Service"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}