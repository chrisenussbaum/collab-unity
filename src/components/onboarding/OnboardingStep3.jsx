import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Sparkles, Lightbulb, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function OnboardingStep3({
  skills,
  interests,
  onNext,
  onBack,
  onSelectIdea,
  selectedIdea,
  isSubmitting
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectIdeas, setProjectIdeas] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateIdeas = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Based on these skills: ${skills.join(", ")} and interests: ${interests.join(", ")}, generate 3 creative and unique project ideas that would be suitable for collaboration on a platform like Collab Unity. 

For each project idea, provide:
1. A catchy title (max 50 chars)
2. A brief description (max 150 chars)
3. 3 key skills needed
4. Project type (Personal or Collaborative)
5. Estimated difficulty (Beginner, Intermediate, Advanced)

Make the ideas diverse, innovative, and actionable.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  skills_needed: { type: "array", items: { type: "string" } },
                  project_type: { type: "string" },
                  difficulty: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (response && response.ideas) {
        setProjectIdeas(response.ideas);
        setHasGenerated(true);
      }
    } catch (error) {
      console.error("Error generating ideas:", error);
      toast.error("Failed to generate project ideas. You can skip this step.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (skills.length > 0 && interests.length > 0 && !hasGenerated) {
      generateIdeas();
    }
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">AI-Generated Project Ideas</h3>
        <p className="text-sm text-gray-600">Based on your skills and interests</p>
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600">Generating personalized project ideas...</p>
        </div>
      ) : projectIdeas.length > 0 ? (
        <>
          <div className="space-y-4">
            {projectIdeas.map((idea, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedIdea?.title === idea.title
                      ? 'border-2 border-purple-500 bg-purple-50'
                      : 'border border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => onSelectIdea(selectedIdea?.title === idea.title ? null : idea)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{idea.title}</h4>
                        <Badge className={getDifficultyColor(idea.difficulty)} variant="secondary">
                          {idea.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{idea.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {idea.skills_needed?.map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={generateIdeas}
            disabled={isGenerating}
            className="w-full text-purple-600 hover:text-purple-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate New Ideas
          </Button>

          {selectedIdea && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <p className="text-sm text-purple-800">
                <strong>Selected:</strong> {selectedIdea.title}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No ideas generated yet.</p>
          <Button onClick={generateIdeas} className="cu-button">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Ideas
          </Button>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="cu-button flex-1"
          disabled={isSubmitting}
        >
          {selectedIdea ? 'Continue with Idea' : 'Skip for Now'}
        </Button>
      </div>
    </motion.div>
  );
}