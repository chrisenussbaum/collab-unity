
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { ALL_SKILLS, ALL_INTERESTS, ALL_TOOLS } from "./constants";

export default function ArrayInputWithSearch({ 
  title, 
  field, 
  items, 
  onAdd, 
  onRemove, 
  placeholder,
  type = "skills", // "skills", "interests", or "tools"
  disabled = false 
}) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allOptions = useMemo(() => {
    if (type === "skills") return ALL_SKILLS;
    if (type === "interests") return ALL_INTERESTS;
    if (type === "tools") return ALL_TOOLS.map(t => t.name);
    return [];
  }, [type]);

  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return [];
    
    const query = inputValue.toLowerCase();
    return allOptions
      .filter(option => 
        option.toLowerCase().includes(query) && 
        !items.includes(option)
      )
      .slice(0, 10);
  }, [inputValue, allOptions, items]);

  const handleAdd = (value) => {
    if (value && value.trim() && !items.includes(value.trim())) {
      onAdd(value.trim());
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(e.target.value.trim().length > 0);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleAdd(suggestions[0]);
      } else {
        handleAdd(inputValue);
      }
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">{title}</label>
      
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50/50">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="flex items-center text-sm py-1 px-3">
              {item}
              <button 
                type="button"
                onClick={() => onRemove(item)} 
                className="ml-2 hover:text-red-500 rounded-full hover:bg-gray-300 p-0.5"
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      <div className="relative">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              placeholder={placeholder || `Type to search or add custom ${type}...`}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => inputValue.trim() && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              disabled={disabled}
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAdd(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-purple-50 text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleAdd(inputValue)} 
            disabled={!inputValue.trim() || disabled}
          >
            <Plus className="w-4 h-4"/>
          </Button>
        </div>
        
        {inputValue.trim() && suggestions.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Press Enter to add "{inputValue}" as a custom {type.slice(0, -1)}
          </p>
        )}
      </div>
    </div>
  );
}
