import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTED_SKILLS = [
  "JavaScript", "Python", "React", "Node.js", "UI/UX Design", "Graphic Design",
  "Data Analysis", "Machine Learning", "Marketing", "Content Writing",
  "Project Management", "Video Editing", "Photography", "Mobile Development",
  "Cloud Computing", "Cybersecurity", "SEO", "Social Media", "Business Strategy"
];

const SUGGESTED_INTERESTS = [
  "Technology", "Art & Design", "Music", "Education", "Healthcare",
  "Environment", "Gaming", "Finance", "Social Impact", "E-commerce",
  "AI & ML", "Blockchain", "Startups", "Nonprofit", "Entertainment"
];

export default function OnboardingStep2({
  skills,
  setSkills,
  interests,
  setInterests,
  bio,
  setBio,
  location,
  setLocation,
  onNext,
  onBack,
  isSubmitting
}) {
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const addSkill = (skill) => {
    if (skill && !skills.includes(skill) && skills.length < 15) {
      setSkills([...skills, skill]);
    }
    setNewSkill("");
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const addInterest = (interest) => {
    if (interest && !interests.includes(interest) && interests.length < 10) {
      setInterests([...interests, interest]);
    }
    setNewInterest("");
  };

  const removeInterest = (interestToRemove) => {
    setInterests(interests.filter(i => i !== interestToRemove));
  };

  const isValid = skills.length >= 1 && interests.length >= 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Bio */}
      <div>
        <Label className="text-base font-medium mb-2 block">
          Tell us about yourself
        </Label>
        <Textarea
          placeholder="I'm a passionate developer who loves building innovative solutions..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-gray-500 mt-1 text-right">{bio.length}/300</p>
      </div>

      {/* Location */}
      <div>
        <Label className="text-base font-medium mb-2 block">
          Location
        </Label>
        <Input
          placeholder="e.g., San Francisco, CA or Remote"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {/* Skills */}
      <div>
        <Label className="text-base font-medium mb-2 block">
          Your Skills <span className="text-red-500">*</span>
          <span className="text-gray-500 text-sm font-normal ml-2">(Select at least 1)</span>
        </Label>
        
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map(skill => (
              <Badge key={skill} className="bg-purple-100 text-purple-800 px-3 py-1">
                {skill}
                <button onClick={() => removeSkill(skill)} className="ml-2 hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Add a skill..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
          />
          <Button type="button" variant="outline" onClick={() => addSkill(newSkill)} disabled={!newSkill}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).slice(0, 8).map(skill => (
            <Badge
              key={skill}
              variant="outline"
              className="cursor-pointer hover:bg-purple-50 hover:border-purple-300"
              onClick={() => addSkill(skill)}
            >
              + {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <Label className="text-base font-medium mb-2 block">
          Your Interests <span className="text-red-500">*</span>
          <span className="text-gray-500 text-sm font-normal ml-2">(Select at least 1)</span>
        </Label>
        
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {interests.map(interest => (
              <Badge key={interest} className="bg-blue-100 text-blue-800 px-3 py-1">
                {interest}
                <button onClick={() => removeInterest(interest)} className="ml-2 hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Add an interest..."
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest(newInterest))}
          />
          <Button type="button" variant="outline" onClick={() => addInterest(newInterest)} disabled={!newInterest}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTED_INTERESTS.filter(i => !interests.includes(i)).slice(0, 8).map(interest => (
            <Badge
              key={interest}
              variant="outline"
              className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
              onClick={() => addInterest(interest)}
            >
              + {interest}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="cu-button flex-1"
          disabled={!isValid || isSubmitting}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}