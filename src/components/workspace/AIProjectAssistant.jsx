import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bot,
  Sparkles,
  ListTodo,
  FileText,
  TrendingUp,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Wand2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Task, Comment, ActivityLog } from "@/entities/all";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function AIProjectAssistant({ project, currentUser, isCollaborator, onTasksGenerated }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const assistantActions = [
    {
      id: "outline",
      title: "Generate Project Outline",
      description: "Create a structured outline with milestones and task breakdown",
      icon: ListTodo,
      color: "bg-blue-100 text-blue-700"
    },
    {
      id: "summary",
      title: "Summarize Activity",
      description: "Get a summary of recent updates and discussions",
      icon: FileText,
      color: "bg-purple-100 text-purple-700"
    },
    {
      id: "status",
      title: "Draft Status Update",
      description: "Generate a status update based on recent progress",
      icon: TrendingUp,
      color: "bg-green-100 text-green-700"
    }
  ];

  const generateProjectOutline = async () => {
    const prompt = `You are a project management expert. Based on the following project details, generate a comprehensive project outline with phases, milestones, and actionable tasks.

Project Title: ${project.title}
Project Description: ${project.description}
Project Type: ${project.project_type}
Classification: ${project.classification || 'Not specified'}
Industry: ${project.industry || 'Not specified'}
Skills Needed: ${project.skills_needed?.join(', ') || 'Not specified'}
Tools Needed: ${project.tools_needed?.join(', ') || 'Not specified'}

Please provide:
1. A brief project overview (2-3 sentences)
2. 3-4 major phases/milestones with descriptions
3. 5-8 specific, actionable tasks with priorities (high/medium/low) and estimated effort
4. Key success criteria
5. Potential risks or challenges to watch for

Format your response in a clear, structured way that's easy to read and act upon.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          overview: { type: "string" },
          phases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                duration: { type: "string" }
              }
            }
          },
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string" },
                effort: { type: "string" }
              }
            }
          },
          success_criteria: {
            type: "array",
            items: { type: "string" }
          },
          risks: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return response;
  };

  const generateActivitySummary = async () => {
    // Fetch recent activity data
    let recentComments = [];
    let recentActivity = [];
    let recentTasks = [];

    try {
      [recentComments, recentActivity, recentTasks] = await Promise.all([
        Comment.filter({ project_id: project.id, context: "discussion" }, "-created_date", 20),
        ActivityLog.filter({ project_id: project.id }, "-created_date", 20),
        Task.filter({ project_id: project.id }, "-updated_date", 10)
      ]);
    } catch (error) {
      console.warn("Error fetching activity data:", error);
    }

    const discussionSummary = recentComments.map(c => 
      `- ${c.user_name || c.user_email}: "${c.content.substring(0, 100)}${c.content.length > 100 ? '...' : ''}"`
    ).join('\n');

    const activitySummary = recentActivity.map(a => 
      `- ${a.action_description}`
    ).join('\n');

    const tasksSummary = recentTasks.map(t => 
      `- ${t.title} (${t.status}, ${t.priority} priority)`
    ).join('\n');

    const prompt = `You are a project analyst. Summarize the recent activity for this project in a clear, concise way.

Project: ${project.title}
Description: ${project.description}

Recent Discussions:
${discussionSummary || 'No recent discussions'}

Recent Activity:
${activitySummary || 'No recent activity logged'}

Current Tasks:
${tasksSummary || 'No tasks yet'}

Please provide:
1. A brief overall status summary (2-3 sentences)
2. Key highlights from discussions (if any)
3. Notable progress or completions
4. Areas that may need attention
5. Recommended next steps

Keep the summary focused and actionable.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          status_summary: { type: "string" },
          discussion_highlights: {
            type: "array",
            items: { type: "string" }
          },
          progress_notes: {
            type: "array",
            items: { type: "string" }
          },
          attention_areas: {
            type: "array",
            items: { type: "string" }
          },
          next_steps: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return response;
  };

  const generateStatusUpdate = async () => {
    // Fetch recent data for status update
    let recentTasks = [];
    let recentActivity = [];

    try {
      [recentTasks, recentActivity] = await Promise.all([
        Task.filter({ project_id: project.id }, "-updated_date", 15),
        ActivityLog.filter({ project_id: project.id }, "-created_date", 15)
      ]);
    } catch (error) {
      console.warn("Error fetching data for status update:", error);
    }

    const completedTasks = recentTasks.filter(t => t.status === 'done');
    const inProgressTasks = recentTasks.filter(t => t.status === 'in_progress');
    const todoTasks = recentTasks.filter(t => t.status === 'todo');

    const taskProgress = `
Completed: ${completedTasks.length} tasks
In Progress: ${inProgressTasks.length} tasks
To Do: ${todoTasks.length} tasks

Recently completed: ${completedTasks.slice(0, 3).map(t => t.title).join(', ') || 'None'}
Currently working on: ${inProgressTasks.slice(0, 3).map(t => t.title).join(', ') || 'None'}`;

    const activityList = recentActivity.slice(0, 10).map(a => 
      `- ${a.action_description}`
    ).join('\n');

    const prompt = `You are helping a project leader write a professional status update for their team and stakeholders.

Project: ${project.title}
Description: ${project.description}
Current Status: ${project.status?.replace(/_/g, ' ') || 'In Progress'}

Task Progress:
${taskProgress}

Recent Activity:
${activityList || 'No recent activity'}

Please draft a concise, professional status update that includes:
1. A brief summary of overall project health (1-2 sentences)
2. Key accomplishments this period (2-3 bullet points)
3. Current focus areas (2-3 bullet points)
4. Any blockers or challenges (if applicable)
5. Next milestones or goals

The tone should be professional but friendly, suitable for sharing with collaborators and stakeholders.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          health_summary: { type: "string" },
          accomplishments: {
            type: "array",
            items: { type: "string" }
          },
          current_focus: {
            type: "array",
            items: { type: "string" }
          },
          blockers: {
            type: "array",
            items: { type: "string" }
          },
          next_milestones: {
            type: "array",
            items: { type: "string" }
          },
          formatted_update: { type: "string" }
        }
      }
    });

    return response;
  };

  const handleAction = async (actionId) => {
    if (!isCollaborator) {
      toast.error("Only collaborators can use the AI assistant");
      return;
    }

    setIsGenerating(true);
    setActiveAction(actionId);
    setGeneratedContent(null);

    try {
      let result;
      
      switch (actionId) {
        case "outline":
          result = await generateProjectOutline();
          break;
        case "summary":
          result = await generateActivitySummary();
          break;
        case "status":
          result = await generateStatusUpdate();
          break;
        default:
          throw new Error("Unknown action");
      }

      setGeneratedContent({ type: actionId, data: result });
      setShowResultDialog(true);
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleCopyContent = () => {
    if (!generatedContent) return;

    let textToCopy = "";
    const { type, data } = generatedContent;

    if (type === "outline") {
      textToCopy = `PROJECT OUTLINE: ${project.title}\n\n`;
      textToCopy += `Overview:\n${data.overview}\n\n`;
      textToCopy += `Phases:\n${data.phases?.map(p => `• ${p.name}: ${p.description} (${p.duration})`).join('\n')}\n\n`;
      textToCopy += `Tasks:\n${data.tasks?.map(t => `• [${t.priority}] ${t.title} - ${t.description} (${t.effort})`).join('\n')}\n\n`;
      textToCopy += `Success Criteria:\n${data.success_criteria?.map(s => `• ${s}`).join('\n')}\n\n`;
      textToCopy += `Risks:\n${data.risks?.map(r => `• ${r}`).join('\n')}`;
    } else if (type === "summary") {
      textToCopy = `ACTIVITY SUMMARY: ${project.title}\n\n`;
      textToCopy += `Status: ${data.status_summary}\n\n`;
      textToCopy += `Discussion Highlights:\n${data.discussion_highlights?.map(h => `• ${h}`).join('\n')}\n\n`;
      textToCopy += `Progress:\n${data.progress_notes?.map(p => `• ${p}`).join('\n')}\n\n`;
      textToCopy += `Needs Attention:\n${data.attention_areas?.map(a => `• ${a}`).join('\n')}\n\n`;
      textToCopy += `Next Steps:\n${data.next_steps?.map(n => `• ${n}`).join('\n')}`;
    } else if (type === "status") {
      textToCopy = data.formatted_update || `STATUS UPDATE: ${project.title}\n\n${data.health_summary}\n\nAccomplishments:\n${data.accomplishments?.map(a => `• ${a}`).join('\n')}\n\nCurrent Focus:\n${data.current_focus?.map(c => `• ${c}`).join('\n')}\n\nNext Milestones:\n${data.next_milestones?.map(m => `• ${m}`).join('\n')}`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTasks = async () => {
    if (!generatedContent || generatedContent.type !== "outline") return;

    const { tasks } = generatedContent.data;
    if (!tasks || tasks.length === 0) {
      toast.error("No tasks to create");
      return;
    }

    setIsGenerating(true);
    try {
      const priorityMap = {
        'high': 'high',
        'medium': 'medium',
        'low': 'low',
        'urgent': 'urgent'
      };

      for (const task of tasks) {
        await Task.create({
          project_id: project.id,
          title: task.title,
          description: task.description,
          priority: priorityMap[task.priority?.toLowerCase()] || 'medium',
          status: 'todo'
        });
      }

      setShowResultDialog(false);
      if (onTasksGenerated) onTasksGenerated();
    } catch (error) {
      console.error("Error creating tasks:", error);
      toast.error("Failed to create tasks");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderGeneratedContent = () => {
    if (!generatedContent) return null;

    const { type, data } = generatedContent;

    if (type === "outline") {
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Overview</h4>
            <p className="text-gray-700 text-sm">{data.overview}</p>
          </div>

          {data.phases?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Phases</h4>
              <div className="space-y-2">
                {data.phases.map((phase, idx) => (
                  <div key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-blue-900">{phase.name}</span>
                      <Badge variant="outline" className="text-xs">{phase.duration}</Badge>
                    </div>
                    <p className="text-sm text-blue-700">{phase.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.tasks?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Suggested Tasks</h4>
              <div className="space-y-2">
                {data.tasks.map((task, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-gray-900 text-sm">{task.title}</span>
                      <Badge className={`text-xs ${
                        task.priority?.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                    <span className="text-xs text-gray-500 mt-1 block">Effort: {task.effort}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.success_criteria?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Success Criteria</h4>
              <ul className="list-disc list-inside space-y-1">
                {data.success_criteria.map((criteria, idx) => (
                  <li key={idx} className="text-sm text-gray-700">{criteria}</li>
                ))}
              </ul>
            </div>
          )}

          {data.risks?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Potential Risks</h4>
              <ul className="list-disc list-inside space-y-1">
                {data.risks.map((risk, idx) => (
                  <li key={idx} className="text-sm text-orange-700">{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (type === "summary") {
      return (
        <div className="space-y-6">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <h4 className="font-semibold text-purple-900 mb-2">Status Summary</h4>
            <p className="text-purple-800 text-sm">{data.status_summary}</p>
          </div>

          {data.discussion_highlights?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Discussion Highlights</h4>
              <ul className="space-y-1">
                {data.discussion_highlights.map((highlight, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.progress_notes?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Progress</h4>
              <ul className="space-y-1">
                {data.progress_notes.map((note, idx) => (
                  <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.attention_areas?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Needs Attention</h4>
              <ul className="space-y-1">
                {data.attention_areas.map((area, idx) => (
                  <li key={idx} className="text-sm text-orange-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">!</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.next_steps?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Recommended Next Steps</h4>
              <ul className="space-y-1">
                {data.next_steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">→</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (type === "status") {
      return (
        <div className="space-y-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <h4 className="font-semibold text-green-900 mb-2">Project Health</h4>
            <p className="text-green-800 text-sm">{data.health_summary}</p>
          </div>

          {data.accomplishments?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Accomplishments</h4>
              <ul className="space-y-1">
                {data.accomplishments.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.current_focus?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Current Focus</h4>
              <ul className="space-y-1">
                {data.current_focus.map((item, idx) => (
                  <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.blockers?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Blockers</h4>
              <ul className="space-y-1">
                {data.blockers.map((item, idx) => (
                  <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-500 mt-1">⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.next_milestones?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Next Milestones</h4>
              <ul className="space-y-1">
                {data.next_milestones.map((item, idx) => (
                  <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                    <span className="text-purple-500 mt-1">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.formatted_update && (
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-900 mb-2">Ready-to-Share Update</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.formatted_update}</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (!isCollaborator) return null;

  return (
    <>
      <Card className="cu-card border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="pb-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <CardTitle className="flex items-center text-base">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span>AI Project Assistant</span>
              <Badge className="ml-2 bg-purple-100 text-purple-700 text-xs">Beta</Badge>
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          {!isExpanded && (
            <p className="text-xs text-gray-500 mt-1 ml-11">
              Get AI-powered help with planning, summaries, and updates
            </p>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-2">
            <div className="space-y-3">
              {assistantActions.map((action) => {
                const Icon = action.icon;
                const isLoading = isGenerating && activeAction === action.id;

                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    disabled={isGenerating}
                    className="w-full text-left p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">{action.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                      </div>
                      <Wand2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
              {generatedContent?.type === "outline" && "Project Outline"}
              {generatedContent?.type === "summary" && "Activity Summary"}
              {generatedContent?.type === "status" && "Status Update Draft"}
            </DialogTitle>
            <DialogDescription>
              AI-generated content based on your project details
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {renderGeneratedContent()}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCopyContent}
              className="w-full sm:w-auto"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
            
            {generatedContent?.type === "outline" && generatedContent.data?.tasks?.length > 0 && (
              <Button
                onClick={handleCreateTasks}
                disabled={isGenerating}
                className="w-full sm:w-auto cu-button"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ListTodo className="w-4 h-4 mr-2" />
                )}
                Create {generatedContent.data.tasks.length} Tasks
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={() => setShowResultDialog(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}