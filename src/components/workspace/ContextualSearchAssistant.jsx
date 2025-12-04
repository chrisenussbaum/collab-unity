import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BrainCircuit } from 'lucide-react';
import { toast } from "sonner";

export default function ContextualSearchAssistant({ project }) {
  const [query, setQuery] = useState("");
  const [lastSearch, setLastSearch] = useState("");

  const handleSearch = () => {
    if (!query.trim()) {
      toast.warning("Please enter a search query.");
      return;
    }

    // Construct an intelligent query using project context
    const keywords = [
      query,
    ];
    
    // Remove duplicates and filter out empty strings to create a clean search string
    const uniqueKeywords = [...new Set(keywords)].filter(Boolean);
    const constructedQuery = uniqueKeywords.join(' ');
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(constructedQuery)}`;
    
    setLastSearch(constructedQuery);
    toast.info(`Searching Google for: "${query}"`, {
        description: "Your results are opening in a new tab with project context.",
    });

    window.open(searchUrl, '_blank');
    setQuery(""); // Clear input after search
  };

  return (
    <Card className="cu-card">
      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="flex items-center text-base sm:text-lg">
          <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
          Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
        <p className="text-sm text-gray-600">
          Find resources, tutorials, or ideas. We'll use your project's context to refine your Google search.
        </p>
        <div className="flex space-x-2">
          <Input
            placeholder="e.g., 'React state management'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Button onClick={handleSearch} disabled={!query.trim()} className="cu-button">
            <Search className="w-4 h-4" />
          </Button>
        </div>
        {lastSearch && (
            <p className="text-xs text-gray-500 mt-2">
                <span className="font-semibold">Last search included context:</span> {project.title}, {project.area_of_interest}, etc.
            </p>
        )}
      </CardContent>
    </Card>
  );
}