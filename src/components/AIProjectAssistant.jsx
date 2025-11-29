import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, Lightbulb, Target, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AIProjectAssistant({ 
  projectTitle, 
  projectDescription, 
  projectType,
  classification,
  industry,
  onSkillsSuggested,
  onToolsSuggested,
  onMilestonesSuggested,
  existingSkills = [],
  existingTools = []
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [activeTab, setActiveTab] = useState('skills');

  const generateSuggestions = async () => {
    if (!projectTitle.trim() || !projectDescription.trim()) {
      toast.error("Please provide a project title and description first.");
      return;
    }

    setIsGenerating(true);
    setSuggestions(null);

    try {
      const prompt = `You are a project planning assistant. Based on the following project details, provide helpful suggestions.

Project Title: ${projectTitle}
Project Description: ${projectDescription}
Project Type: ${projectType || 'Not specified'}
Classification: ${classification || 'Not specified'}
Industry: ${industry || 'Not specified'}

Please provide:
1. A list of 8-12 relevant skills needed for this project (technical and soft skills)
2. A list of 6-10 tools/technologies that would be useful
3. 4-6 key milestones with brief descriptions
4. 2-3 examples of similar successful projects (real or hypothetical) with brief descriptions of what made them successful

Be specific and practical. Focus on skills and tools that are commonly used and in-demand.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            skills: {
              type: "array",
              items: { type: "string" },
              description: "List of relevant skills for the project"
            },
            tools: {
              type: "array",
              items: { type: "string" },
              description: "List of useful tools/technologies"
            },
            milestones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" }
                }
              },
              description: "Key project milestones"
            },
            similarProjects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  successFactors: { type: "string" }
                }
              },
              description: "Examples of similar successful projects"
            }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Failed to generate suggestions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addSkill = (skill) => {
    if (!existingSkills.includes(skill)) {
      onSkillsSuggested(skill);
    }
  };

  const addTool = (tool) => {
    if (!existingTools.includes(tool)) {
      onToolsSuggested(tool);
    }
  };

  const addAllSkills = () => {
    if (suggestions?.skills) {
      suggestions.skills.forEach(skill => {
        if (!existingSkills.includes(skill)) {
          onSkillsSuggested(skill);
        }
      });
    }
  };

  const addAllTools = () => {
    if (suggestions?.tools) {
      suggestions.tools.forEach(tool => {
        if (!existingTools.includes(tool)) {
          onToolsSuggested(tool);
        }
      });
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base sm:text-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          AI Project Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-4">
              Get AI-powered suggestions for skills, tools, milestones, and see examples of similar successful projects.
            </p>
            <Button
              onClick={generateSuggestions}
              disabled={isGenerating || !projectTitle.trim() || !projectDescription.trim()}
              className="cu-button"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Suggestions
                </>
              )}
            </Button>
            {(!projectTitle.trim() || !projectDescription.trim()) && (
              <p className="text-xs text-gray-500 mt-2">
                Add a title and description first
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b pb-3">
              {['skills', 'tools', 'milestones', 'examples'].map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className="text-xs capitalize"
                >
                  {tab === 'skills' && <Target className="w-3 h-3 mr-1" />}
                  {tab === 'tools' && <Lightbulb className="w-3 h-3 mr-1" />}
                  {tab === 'milestones' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {tab === 'examples' && <Sparkles className="w-3 h-3 mr-1" />}
                  {tab}
                </Button>
              ))}
            </div>

            {/* Skills Tab */}
            {activeTab === 'skills' && suggestions.skills && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Suggested Skills</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addAllSkills}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.skills.map((skill, index) => {
                    const isAdded = existingSkills.includes(skill);
                    return (
                      <Badge
                        key={index}
                        variant={isAdded ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          isAdded 
                            ? 'bg-green-100 text-green-700 border-green-300' 
                            : 'hover:bg-purple-100 hover:border-purple-300'
                        }`}
                        onClick={() => !isAdded && addSkill(skill)}
                      >
                        {isAdded && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {skill}
                        {!isAdded && <Plus className="w-3 h-3 ml-1" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tools Tab */}
            {activeTab === 'tools' && suggestions.tools && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Suggested Tools</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addAllTools}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.tools.map((tool, index) => {
                    const isAdded = existingTools.includes(tool);
                    return (
                      <Badge
                        key={index}
                        variant={isAdded ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          isAdded 
                            ? 'bg-green-100 text-green-700 border-green-300' 
                            : 'hover:bg-indigo-100 hover:border-indigo-300'
                        }`}
                        onClick={() => !isAdded && addTool(tool)}
                      >
                        {isAdded && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {tool}
                        {!isAdded && <Plus className="w-3 h-3 ml-1" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Milestones Tab */}
            {activeTab === 'milestones' && suggestions.milestones && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Suggested Milestones</h4>
                <div className="space-y-2">
                  {suggestions.milestones.map((milestone, index) => (
                    <div 
                      key={index} 
                      className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-xs flex-shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 text-sm">{milestone.title}</h5>
                          <p className="text-xs text-gray-600 mt-1">{milestone.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 italic">
                  💡 Use these milestones as a starting point for your project planning.
                </p>
              </div>
            )}

            {/* Examples Tab */}
            {activeTab === 'examples' && suggestions.similarProjects && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Similar Successful Projects</h4>
                <div className="space-y-3">
                  {suggestions.similarProjects.map((project, index) => (
                    <div 
                      key={index} 
                      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                    >
                      <h5 className="font-semibold text-gray-900 text-sm mb-1">{project.name}</h5>
                      <p className="text-xs text-gray-600 mb-2">{project.description}</p>
                      <div className="bg-green-50 rounded-md p-2 border border-green-100">
                        <p className="text-xs text-green-700">
                          <span className="font-medium">Success factors:</span> {project.successFactors}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate Button */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={generateSuggestions}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Regenerate Suggestions
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}