import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const COMMON_TAGS = [
  "draft", "final", "approved", "review", "v1", "v2",
  "logo", "brand", "wireframe", "mockup", "prototype",
  "frontend", "backend", "api", "database", "infra",
  "presentation", "report", "contract", "spec", "guide"
];

export default function TagInput({ tags, onChange, allExistingTags = [] }) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Merge common + existing tags, exclude already selected
  const suggestions = [...new Set([...COMMON_TAGS, ...allExistingTags])]
    .filter(t => !tags.includes(t) && t.toLowerCase().includes(inputValue.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  return (
    <div ref={containerRef} className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500 leading-none">×</button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); if (inputValue.trim()) addTag(inputValue); }
              if (e.key === "Escape") setShowSuggestions(false);
            }}
            placeholder="Add a tag…"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={() => { if (inputValue.trim()) addTag(inputValue); }}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {inputValue === "" && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {[...COMMON_TAGS].filter(t => !tags.includes(t)).slice(0, 6).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}