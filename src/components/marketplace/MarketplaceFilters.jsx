import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Search, X, SlidersHorizontal, Briefcase, Award } from "lucide-react";

const RATING_OPTIONS = [
  { value: 0, label: "Any rating" },
  { value: 3, label: "3.0+" },
  { value: 4, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
];

export default function MarketplaceFilters({
  search,
  setSearch,
  selectedSkills,
  setSelectedSkills,
  minRating,
  setMinRating,
  hasActiveProjects,
  setHasActiveProjects,
  hasBountyProjects,
  setHasBountyProjects,
  availableSkills,
  onClearAll,
  totalCount,
}) {
  const [skillInput, setSkillInput] = useState("");

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const filteredSuggestions = availableSkills
    .filter((s) => s.toLowerCase().includes(skillInput.toLowerCase()))
    .slice(0, 8);

  const hasActiveFilters = selectedSkills.length > 0 || minRating > 0 || hasActiveProjects || hasBountyProjects;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-600" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-900">{totalCount}</span> collaborator{totalCount !== 1 ? "s" : ""} found
      </p>

      {/* Skill filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Skills</label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Search skills..."
              className="pl-9 text-sm"
            />
          </div>
          {skillInput && filteredSuggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 text-gray-700"
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedSkills.map((skill) => (
              <Badge
                key={skill}
                className="bg-purple-100 text-purple-700 border border-purple-200 pr-1.5"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Rating filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Minimum Rating</label>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMinRating(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                minRating === opt.value
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
              }`}
            >
              {opt.value > 0 && <Star className="w-3 h-3 inline mr-1 fill-current" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle filters */}
      <div className="space-y-2">
        <button
          onClick={() => setHasActiveProjects(!hasActiveProjects)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            hasActiveProjects
              ? "bg-purple-50 border-purple-300 text-purple-700"
              : "bg-white border-gray-200 text-gray-600 hover:border-purple-200"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Has active projects
          {hasActiveProjects && <X className="w-3 h-3 ml-auto" />}
        </button>

        <button
          onClick={() => setHasBountyProjects(!hasBountyProjects)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            hasBountyProjects
              ? "bg-amber-50 border-amber-300 text-amber-700"
              : "bg-white border-gray-200 text-gray-600 hover:border-amber-200"
          }`}
        >
          <Award className="w-4 h-4" />
          Has paid gigs
          {hasBountyProjects && <X className="w-3 h-3 ml-auto" />}
        </button>
      </div>
    </div>
  );
}