import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bot, Sparkles, ListTodo, Target, Wrench, FileText, Plus, ChevronDown, ChevronUp,
  Loader2, CheckCircle, Flag, Clock, Zap, X, ArrowRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ProjectOwnerAssistant({ project, currentUser, isOwner, onProjectUpdate }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeDialog, setActiveDialog] = useState(null); // 'milestone' | 'task' | 'note' | 'tool' | 'ai_plan'
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Milestone form
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", due_date: "", order_index: 0 });

  // Task form
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", due_date: "" });

  // Note form
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });

  // Tool form
  const [toolInput, setToolInput] = useState("");

  // AI Plan result
  const [aiPlan, setAiPlan] = useState(null);

  // Stats
  const [stats, setStats] = useState({ tasks: 0, milestones: 0 });

  useEffect(() => {
    if (!project?.id) return;
    loadStats();
  }, [project?.id]);

  const loadStats = async () => {
    try {
      const [tasks, milestones] = await Promise.all([
        base44.entities.Task.filter({ project_id: project.id }),
        base44.entities.ProjectMilestone.filter({ project_id: project.id })
      ]);
      setStats({ tasks: tasks.length, milestones: milestones.length });
    } catch (e) {
      // silent
    }
  };

  const handleAddMilestone = async () => {
    if (!milestoneForm.title.trim()) return toast.error("Please enter a milestone title.");
    setIsSaving(true);
    try {
      await base44.entities.ProjectMilestone.create({
        project_id: project.id,
        title: milestoneForm.title.trim(),
        description: milestoneForm.description.trim(),
        due_date: milestoneForm.due_date || null,
        status: "not_started",
        order_index: stats.milestones
      });
      toast.success("Milestone added!");
      setMilestoneForm({ title: "", description: "", due_date: "", order_index: 0 });
      setActiveDialog(null);
      loadStats();
    } catch (e) {
      toast.error("Failed to add milestone.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskForm.title.trim()) return toast.error("Please enter a task title.");
    setIsSaving(true);
    try {
      await base44.entities.Task.create({
        project_id: project.id,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        status: "todo",
        due_date: taskForm.due_date || undefined
      });
      toast.success("Task added!");
      setTaskForm({ title: "", description: "", priority: "medium", due_date: "" });
      setActiveDialog(null);
      loadStats();
    } catch (e) {
      toast.error("Failed to add task.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) return toast.error("Please fill in title and content.");
    setIsSaving(true);
    try {
      await base44.entities.Thought.create({
        project_id: project.id,
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        category: "Planning",
        tags: ["planning"]
      });
      toast.success("Planning note added!");
      setNoteForm({ title: "", content: "" });
      setActiveDialog(null);
    } catch (e) {
      toast.error("Failed to add note.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTool = async () => {
    if (!toolInput.trim()) return toast.error("Please enter a tool name.");
    setIsSaving(true);
    try {
      const currentTools = project.project_tools || [];
      const newTool = { name: toolInput.trim(), icon: "🔧" };
      await base44.entities.Project.update(project.id, {
        project_tools: [...currentTools, newTool]
      });
      toast.success(`"${toolInput.trim()}" added to project tools!`);
      setToolInput("");
      setActiveDialog(null);
      if (onProjectUpdate) onProjectUpdate();
    } catch (e) {
      toast.error("Failed to add tool.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setAiPlan(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a project management expert. Create a concise, actionable completion plan for this project.

Project: ${project.title}
Description: ${project.description}
Type: ${project.project_type}
Classification: ${project.classification || 'N/A'}
Skills Needed: ${project.skills_needed?.join(', ') || 'N/A'}

Generate a realistic 3-phase completion plan with specific milestones, 5 key tasks, and 3 immediate next actions.`,
        response_json_schema: {
          type: "object",
          properties: {
            phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  goal: { type: "string" }
                }
              }
            },
            key_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            next_actions: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      setAiPlan(result);
      setActiveDialog("ai_plan");
    } catch (e) {
      toast.error("Failed to generate plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAIPlan = async () => {
    if (!aiPlan) return;
    setIsSaving(true);
    try {
      const taskPromises = (aiPlan.key_tasks || []).map(task =>
        base44.entities.Task.create({
          project_id: project.id,
          title: task.title,
          priority: ['high', 'medium', 'low'].includes(task.priority?.toLowerCase()) ? task.priority.toLowerCase() : 'medium',
          status: 'todo'
        })
      );
      const milestonePromises = (aiPlan.phases || []).map((phase, i) =>
        base44.entities.ProjectMilestone.create({
          project_id: project.id,
          title: phase.name,
          description: phase.goal,
          status: 'not_started',
          order_index: i
        })
      );
      await Promise.all([...taskPromises, ...milestonePromises]);
      toast.success(`Created ${aiPlan.key_tasks?.length || 0} tasks & ${aiPlan.phases?.length || 0} milestones!`);
      setActiveDialog(null);
      setAiPlan(null);
      loadStats();
    } catch (e) {
      toast.error("Failed to apply plan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOwner) return null;

  const quickActions = [
    { id: "milestone", label: "Add Milestone", icon: Flag, color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
    { id: "task", label: "Add Task", icon: ListTodo, color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
    { id: "note", label: "Planning Note", icon: FileText, color: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
    { id: "tool", label: "Add Tool", icon: Wrench, color: "text-green-600 bg-green-50 hover:bg-green-100" },
  ];

  return (
    <>
      <Card className="cu-card border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-sm font-semibold text-indigo-900">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-2">
                <Bot className="w-4 h-4 text-white" />
              </div>
              Project Assistant
              <Badge className="ml-2 bg-indigo-100 text-indigo-700 text-xs border-0">Owner</Badge>
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-3">
            {/* Stats row */}
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1 bg-white rounded-md px-2 py-1 border text-gray-600">
                <ListTodo className="w-3 h-3 text-blue-500" /> {stats.tasks} tasks
              </span>
              <span className="flex items-center gap-1 bg-white rounded-md px-2 py-1 border text-gray-600">
                <Flag className="w-3 h-3 text-purple-500" /> {stats.milestones} milestones
              </span>
            </div>

            {/* Quick actions grid */}
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setActiveDialog(id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${color} border border-transparent`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* AI Plan button */}
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-60"
            >
              {isGenerating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating Plan...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Generate Completion Plan</>
              )}
            </button>
          </CardContent>
        )}
      </Card>

      {/* Add Milestone Dialog */}
      <Dialog open={activeDialog === "milestone"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Flag className="w-5 h-5 text-purple-600" /> Add Milestone</DialogTitle>
            <DialogDescription>Set a key checkpoint to track your project's progress.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
              <Input placeholder="e.g. MVP Launch, Beta Testing Complete..." value={milestoneForm.title} onChange={e => setMilestoneForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea placeholder="What does completing this milestone mean?" value={milestoneForm.description} onChange={e => setMilestoneForm(p => ({ ...p, description: e.target.value }))} className="h-20 resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Target Date</label>
              <Input type="date" value={milestoneForm.due_date} onChange={e => setMilestoneForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button onClick={handleAddMilestone} disabled={isSaving || !milestoneForm.title.trim()} className="cu-button">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={activeDialog === "task"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ListTodo className="w-5 h-5 text-blue-600" /> Add Task</DialogTitle>
            <DialogDescription>Create a specific action item to move the project forward.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
              <Input placeholder="e.g. Design landing page, Write API docs..." value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea placeholder="Details about what needs to be done..." value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} className="h-20 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</label>
                <Input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button onClick={handleAddTask} disabled={isSaving || !taskForm.title.trim()} className="cu-button">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Planning Note Dialog */}
      <Dialog open={activeDialog === "note"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" /> Planning Note</DialogTitle>
            <DialogDescription>Capture ideas, decisions, and plans to keep your team aligned.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
              <Input placeholder="e.g. Sprint 1 Goals, Design Decisions..." value={noteForm.title} onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Content *</label>
              <Textarea placeholder="Write your planning note here..." value={noteForm.content} onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))} className="h-32 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={isSaving || !noteForm.title.trim() || !noteForm.content.trim()} className="cu-button">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tool Dialog */}
      <Dialog open={activeDialog === "tool"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wrench className="w-5 h-5 text-green-600" /> Add Tool</DialogTitle>
            <DialogDescription>Add a tool or technology your team is using for this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tool Name *</label>
              <Input placeholder="e.g. Figma, Notion, GitHub, Slack..." value={toolInput} onChange={e => setToolInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddTool(); }}
              />
            </div>
            {/* Quick suggestions */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-1.5">
                {["Figma", "Notion", "GitHub", "Slack", "Trello", "Jira", "VS Code", "Discord"].filter(t => !(project.project_tools || []).some(pt => pt.name === t)).slice(0, 6).map(t => (
                  <button key={t} onClick={() => setToolInput(t)} className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-green-100 hover:text-green-700 transition-colors border border-gray-200">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>Cancel</Button>
            <Button onClick={handleAddTool} disabled={isSaving || !toolInput.trim()} className="cu-button">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Tool"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Plan Dialog */}
      <Dialog open={activeDialog === "ai_plan"} onOpenChange={() => { setActiveDialog(null); setAiPlan(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" /> AI Completion Plan
            </DialogTitle>
            <DialogDescription>Generated based on your project details. Apply to create all items at once.</DialogDescription>
          </DialogHeader>

          {aiPlan && (
            <div className="space-y-4 py-2">
              {aiPlan.phases?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-1.5"><Flag className="w-4 h-4 text-purple-600" /> Phases / Milestones</h4>
                  <div className="space-y-2">
                    {aiPlan.phases.map((phase, i) => (
                      <div key={i} className="flex items-start gap-2 bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-purple-900">{phase.name}</p>
                          <p className="text-xs text-purple-700 mt-0.5">{phase.goal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiPlan.key_tasks?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-1.5"><ListTodo className="w-4 h-4 text-blue-600" /> Key Tasks</h4>
                  <div className="space-y-1.5">
                    {aiPlan.key_tasks.map((task, i) => (
                      <div key={i} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                        <span className="text-sm text-blue-900">{task.title}</span>
                        <Badge className={`text-xs ml-2 flex-shrink-0 ${
                          task.priority?.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority?.toLowerCase() === 'low' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{task.priority || 'medium'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiPlan.next_actions?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-600" /> Immediate Next Actions</h4>
                  <ul className="space-y-1.5">
                    {aiPlan.next_actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setActiveDialog(null); setAiPlan(null); }}>Dismiss</Button>
            <Button onClick={handleApplyAIPlan} disabled={isSaving} className="cu-button">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Apply Plan ({(aiPlan?.key_tasks?.length || 0) + (aiPlan?.phases?.length || 0)} items)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}