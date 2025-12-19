import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  StickyNote, 
  Network, 
  PenTool, 
  LayoutGrid,
  Plus,
  ArrowLeft,
  Loader2,
  Trash2
} from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

import IdeationNotes from './IdeationNotes';
import MindMapTool from './MindMapTool';
import WhiteboardTool from './WhiteboardTool';
import IdeationKanban from './IdeationKanban';

const IDEATION_TOOLS = [
  {
    id: 'notes',
    type: 'notes',
    title: 'Notes',
    description: 'Rich text notes for capturing ideas and plans',
    icon: StickyNote,
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    iconBg: 'bg-amber-500'
  },
  {
    id: 'mindmap',
    type: 'mindmap',
    title: 'Mind Map',
    description: 'Visual canvas to connect and organize ideas',
    icon: Network,
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    iconBg: 'bg-purple-500'
  },
  {
    id: 'whiteboard',
    type: 'whiteboard',
    title: 'Whiteboard',
    description: 'Freeform drawing and sketching space',
    icon: PenTool,
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    iconBg: 'bg-blue-500'
  },
  {
    id: 'kanban',
    type: 'kanban',
    title: 'Idea Board',
    description: 'Organize ideas into categories and stages',
    icon: LayoutGrid,
    color: 'bg-green-100 text-green-700 border-green-300',
    iconBg: 'bg-green-500'
  }
];

export default function IdeationHub({ project, currentUser, isCollaborator, isProjectOwner }) {
  const [activeToolType, setActiveToolType] = useState(null);
  const [activeToolInstance, setActiveToolInstance] = useState(null);
  const [toolInstances, setToolInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToolInstances();
  }, [project.id]);

  const loadToolInstances = async () => {
    setIsLoading(true);
    try {
      const instances = await base44.entities.ProjectIDE.filter({
        project_id: project.id,
        ide_type: { $in: ['ideation_notes', 'ideation_mindmap', 'ideation_whiteboard', 'ideation_kanban'] },
        is_active: true
      }, '-created_date', 50);
      setToolInstances(instances || []);
    } catch (error) {
      console.error("Error loading ideation tools:", error);
      setToolInstances([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolSelect = (tool) => {
    // Show existing instances or create new
    const existingInstances = toolInstances.filter(i => 
      i.ide_type === `ideation_${tool.type}`
    );
    
    if (existingInstances.length === 0 && isCollaborator) {
      handleCreateInstance(tool);
    } else if (existingInstances.length === 1) {
      setActiveToolType(tool.type);
      setActiveToolInstance(existingInstances[0]);
    } else {
      // Multiple instances - let user choose
      setActiveToolType(tool.type);
      setActiveToolInstance(null);
    }
  };

  const handleCreateInstance = async (tool) => {
    try {
      let initialContent = {};
      if (tool.type === 'notes') {
        initialContent = { content: '' };
      } else if (tool.type === 'mindmap') {
        initialContent = { nodes: [], edges: [] };
      } else if (tool.type === 'whiteboard') {
        initialContent = { paths: [] };
      } else if (tool.type === 'kanban') {
        initialContent = { cards: [] };
      }

      const newInstance = await base44.entities.ProjectIDE.create({
        project_id: project.id,
        ide_type: `ideation_${tool.type}`,
        title: `${tool.title} - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify(initialContent),
        last_modified_by: currentUser.email,
        is_active: true
      });
      
      setToolInstances(prev => [newInstance, ...prev]);
      setActiveToolType(tool.type);
      setActiveToolInstance(newInstance);
      toast.success(`Created new ${tool.title}`);
    } catch (error) {
      console.error("Error creating tool instance:", error);
      toast.error(`Failed to create ${tool.title}`);
    }
  };

  const handleDeleteInstance = async (instanceId, toolType) => {
    if (!window.confirm("Are you sure you want to delete this? This action cannot be undone.")) {
      return;
    }
    
    try {
      await base44.entities.ProjectIDE.update(instanceId, { is_active: false });
      setToolInstances(prev => prev.filter(i => i.id !== instanceId));
      toast.success("Deleted successfully");
      
      // If we're viewing the deleted instance, go back
      if (activeToolInstance?.id === instanceId) {
        handleBack();
      }
    } catch (error) {
      console.error("Error deleting instance:", error);
      toast.error("Failed to delete");
    }
  };

  const handleBack = () => {
    setActiveToolType(null);
    setActiveToolInstance(null);
    loadToolInstances();
  };

  const handleInstanceSelect = (instance) => {
    const toolType = instance.ide_type.replace('ideation_', '');
    setActiveToolType(toolType);
    setActiveToolInstance(instance);
  };

  const handleSaveInstance = (updatedInstance) => {
    setToolInstances(prev => 
      prev.map(i => i.id === updatedInstance.id ? updatedInstance : i)
    );
  };

  // Render active tool
  if (activeToolType === 'notes' && activeToolInstance) {
    return (
      <IdeationNotes
        instance={activeToolInstance}
        project={project}
        currentUser={currentUser}
        isCollaborator={isCollaborator}
        onBack={handleBack}
        onSave={handleSaveInstance}
        onDelete={handleDeleteInstance}
      />
    );
  }

  if (activeToolType === 'mindmap' && activeToolInstance) {
    return (
      <MindMapTool
        instance={activeToolInstance}
        project={project}
        currentUser={currentUser}
        isCollaborator={isCollaborator}
        onBack={handleBack}
        onSave={handleSaveInstance}
        onDelete={handleDeleteInstance}
      />
    );
  }

  if (activeToolType === 'whiteboard' && activeToolInstance) {
    return (
      <WhiteboardTool
        instance={activeToolInstance}
        project={project}
        currentUser={currentUser}
        isCollaborator={isCollaborator}
        onBack={handleBack}
        onSave={handleSaveInstance}
        onDelete={handleDeleteInstance}
      />
    );
  }

  if (activeToolType === 'kanban' && activeToolInstance) {
    return (
      <IdeationKanban
        instance={activeToolInstance}
        project={project}
        currentUser={currentUser}
        isCollaborator={isCollaborator}
        onBack={handleBack}
        onSave={handleSaveInstance}
        onDelete={handleDeleteInstance}
      />
    );
  }

  // Show instance picker for tools with multiple instances
  if (activeToolType && !activeToolInstance) {
    const tool = IDEATION_TOOLS.find(t => t.type === activeToolType);
    const instances = toolInstances.filter(i => i.ide_type === `ideation_${activeToolType}`);
    
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Ideation Hub
        </Button>
        
        <Card className="cu-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {tool && <tool.icon className="w-5 h-5" />}
              {tool?.title} Collection
            </CardTitle>
            <CardDescription>Select an existing {tool?.title.toLowerCase()} or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instances.map(instance => (
                <div
                  key={instance.id}
                  className="relative p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all hover:border-purple-300 group"
                  onClick={() => handleInstanceSelect(instance)}
                >
                  <h4 className="font-medium text-gray-900 mb-1 pr-8">{instance.title}</h4>
                  <p className="text-xs text-gray-500 mb-2">
                    Last modified: {new Date(instance.updated_date).toLocaleDateString()}
                  </p>
                  {isCollaborator && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteInstance(instance.id, tool.type);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {isCollaborator && (
                <div
                  onClick={() => handleCreateInstance(tool)}
                  className="p-4 border-2 border-dashed rounded-lg hover:shadow-md cursor-pointer transition-all hover:border-purple-400 flex flex-col items-center justify-center text-gray-500 hover:text-purple-600 min-h-[100px]"
                >
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Create New</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main hub view
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="cu-card bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900">
            <Lightbulb className="w-6 h-6 mr-2" />
            Ideation Board
          </CardTitle>
          <CardDescription className="text-purple-700">
            Brainstorm and capture ideas together
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {IDEATION_TOOLS.map(tool => {
          const Icon = tool.icon;
          const instanceCount = toolInstances.filter(i => i.ide_type === `ideation_${tool.type}`).length;
          const showSavedBadge = instanceCount > 0;
          
          return (
            <div
              key={tool.id}
              onClick={() => handleToolSelect(tool)}
              className={`p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${tool.color} border-dashed hover:border-solid`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 ${tool.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {showSavedBadge && (
                  <Badge variant="secondary" className="text-xs">
                    {instanceCount} saved
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1">{tool.title}</h3>
              <p className="text-sm opacity-80">{tool.description}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      {toolInstances.length > 0 && (
        <Card className="cu-card">
          <CardHeader>
            <CardTitle className="text-base">Recent Ideation Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {toolInstances.slice(0, 5).map(instance => {
                const tool = IDEATION_TOOLS.find(t => `ideation_${t.type}` === instance.ide_type);
                const Icon = tool?.icon || Lightbulb;
                
                return (
                  <div
                    key={instance.id}
                    onClick={() => handleInstanceSelect(instance)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className={`w-8 h-8 ${tool?.iconBg || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 truncate">{instance.title}</h4>
                      <p className="text-xs text-gray-500">
                        {tool?.title} • Updated {new Date(instance.updated_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}