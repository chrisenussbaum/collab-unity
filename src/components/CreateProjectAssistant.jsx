import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, Lightbulb, Loader2, Plus, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

const STEP_PROMPTS = {
  1: (form) => `You are a project creation assistant for Collab Unity. A user is filling out a project form.
Current info:
- Title: "${form.title || "(not set yet)"}"
- Description: "${form.description || "(not set yet)"}"
- Type: ${form.project_type || "(not set yet)"}
- Classification: ${form.classification || "(not set yet)"}
- Industry: ${form.industry || "(not set yet)"}

Give 2-3 short, specific suggestions to improve the project title and description based on their classification/industry. Be concise and actionable. Use bullet points.`,

  2: (form) => `You are a project creation assistant for Collab Unity.
Project: "${form.title || "Untitled"}" — ${form.classification || ""} / ${form.industry || ""} / ${form.area_of_interest || ""}
Current skills: ${form.skills_needed?.join(", ") || "none"}
Current tools: ${form.tools_needed?.join(", ") || "none"}

Suggest 3-5 additional relevant skills AND 3-5 tools that would complement this project type and industry. Be specific. Use bullet points with short explanations.`,

  3: (form) => `You are a project creation assistant for Collab Unity.
Project: "${form.title || "Untitled"}" — ${form.classification || ""} in ${form.industry || ""}
Description: "${form.description || ""}"

Suggest 3 specific, achievable project goals/milestones this user should track. Also suggest 2-3 media/showcase ideas (what kinds of images or videos would make this project shine on the platform). Keep it short and practical.`,
};

const STEP_LABELS = {
  1: "Improve title & description",
  2: "Suggest skills & tools",
  3: "Suggest goals & media ideas",
};

export default function CreateProjectAssistant({ formData, currentStep }) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestion = async () => {
    setIsLoading(true);
    setSuggestion("");
    try {
      const prompt = STEP_PROMPTS[currentStep]?.(formData);
      if (!prompt) return;
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setSuggestion(typeof result === "string" ? result : JSON.stringify(result));
    } catch (e) {
      setSuggestion("Sorry, couldn't fetch suggestions right now. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen && !suggestion) {
      fetchSuggestion();
    }
    setIsOpen((prev) => !prev);
  };

  if (!STEP_PROMPTS[currentStep]) return null;

  return (
    <div className="border border-purple-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight">Project Assistant</p>
            <p className="text-xs text-white/70 leading-tight">{STEP_LABELS[currentStep]}</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Body */}
      {isOpen && (
        <div className="p-4 bg-gray-50/50">
          {isLoading ? (
            <div className="flex items-center gap-2 text-purple-600 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing your project...</span>
            </div>
          ) : suggestion ? (
            <div className="space-y-3">
              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 text-gray-700">
                <ReactMarkdown>{suggestion}</ReactMarkdown>
              </div>
              <button
                type="button"
                onClick={fetchSuggestion}
                className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh suggestions
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}