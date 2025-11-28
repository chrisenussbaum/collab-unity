import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Code, 
  FileText, 
  Video, 
  Music, 
  Shirt, 
  Palette, 
  Box, 
  Presentation, 
  Table,
  Plus,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import DocumentEditor from './DocumentEditor';
import CodePlayground from './CodePlayground';

const ideTypes = [
  {
    type: 'code_playground',
    label: 'Code Playground',
    icon: Code,
    color: 'bg-blue-100 text-blue-700',
    description: 'Write and test HTML, CSS, and JavaScript code'
  },
  {
    type: 'document_editor',
    label: 'Document Editor',
    icon: FileText,
    color: 'bg-purple-100 text-purple-700',
    description: 'Create and edit rich text documents'
  },
  {
    type: 'video_editor',
    label: 'Video Editor',
    icon: Video,
    color: 'bg-red-100 text-red-700',
    description: 'Edit and produce video content'
  },
  {
    type: 'audio_editor',
    label: 'Audio Editor',
    icon: Music,
    color: 'bg-green-100 text-green-700',
    description: 'Mix and edit audio tracks'
  },
  {
    type: 'apparel_design',
    label: 'Apparel Design',
    icon: Shirt,
    color: 'bg-pink-100 text-pink-700',
    description: 'Design custom clothing and merchandise'
  },
  {
    type: 'graphic_design',
    label: 'Graphic Design',
    icon: Palette,
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Create graphics and visual designs'
  },
  {
    type: '3d_modeling',
    label: '3D Modeling',
    icon: Box,
    color: 'bg-indigo-100 text-indigo-700',
    description: 'Build and render 3D models'
  },
  {
    type: 'presentation',
    label: 'Presentation',
    icon: Presentation,
    color: 'bg-orange-100 text-orange-700',
    description: 'Create slides and presentations'
  },
  {
    type: 'spreadsheet',
    label: 'Spreadsheet',
    icon: Table,
    color: 'bg-teal-100 text-teal-700',
    description: 'Work with data in spreadsheets'
  }
];

export default function IdeationToolsTab({ 
  project, 
  currentUser, 
  isCollaborator, 
  isProjectOwner,
  projectOwnerName 
}) {
  const [ideInstances, setIdeInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedIdeType, setSelectedIdeType] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeCodeProject, setActiveCodeProject] = useState(null);

  // Utility function to handle rate limits with exponential backoff
  const withRetry = async (apiCall, maxRetries = 5, baseDelay = 2000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.response?.status === 429 && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000;
          console.warn(`Rate limit hit, retrying in ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  useEffect(() => {
    loadIdeInstances();
  }, [project.id]);

  const loadIdeInstances = async () => {
    setIsLoading(true);
    try {
      // Add initial delay to prevent hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const instances = await withRetry(() => base44.entities.ProjectIDE.filter({
        project_id: project.id,
        is_active: true
      }, '-created_date', 50));
      setIdeInstances(instances || []);
    } catch (error) {
      console.error("Error loading IDE instances:", error);
      if (error.response?.status !== 429) {
        toast.error("Failed to load IDE instances");
      }
      setIdeInstances([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getIdeTypeInfo = (ideType) => {
    return ideTypes.find(t => t.type === ideType) || ideTypes[0];
  };

  const handleCreateClick = (ideType) => {
    setSelectedIdeType(ideType);
    if (ideType.type === 'document_editor' || ideType.type === 'code_playground') {
      setShowCreateDialog(true);
    } else {
      toast.info(`${ideType.label} coming soon!`);
    }
  };

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsCreating(true);
    try {
      const newItem = await base44.entities.ProjectIDE.create({
        project_id: project.id,
        ide_type: selectedIdeType.type,
        title: newDocTitle.trim(),
        content: selectedIdeType.type === 'document_editor' ? '' : JSON.stringify({ html: '', css: '', js: '' }),
        last_modified_by: currentUser.email,
        is_active: true
      });

      setIdeInstances(prev => [newItem, ...prev]);
      setShowCreateDialog(false);
      setNewDocTitle('');
      
      if (selectedIdeType.type === 'document_editor') {
        setActiveDocument(newItem);
      } else if (selectedIdeType.type === 'code_playground') {
        setActiveCodeProject(newItem);
      }
      
      toast.success(`${selectedIdeType.label} created successfully`);
    } catch (error) {
      console.error("Error creating IDE instance:", error);
      toast.error(`Failed to create ${selectedIdeType.label}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleItemClick = (item) => {
    if (item.ide_type === 'document_editor') {
      setActiveDocument(item);
    } else if (item.ide_type === 'code_playground') {
      setActiveCodeProject(item);
    } else {
      toast.info(`${getIdeTypeInfo(item.ide_type).label} viewer coming soon!`);
    }
  };

  const handleCloseDocument = (shouldRefresh) => {
    setActiveDocument(null);
    if (shouldRefresh) {
      loadIdeInstances();
    }
  };

  const handleCloseCodeProject = (shouldRefresh) => {
    setActiveCodeProject(null);
    if (shouldRefresh) {
      loadIdeInstances();
    }
  };

  const handleDocumentSave = (savedDoc) => {
    // Update the document in the list if it's new
    setIdeInstances(prev => {
      const exists = prev.find(d => d.id === savedDoc.id);
      if (exists) return prev; // If it exists, it means we're editing an existing one, which is already reflected in the list by reference. No need to add.
      return [savedDoc, ...prev]; // If it was a newly created one which then got saved for the first time
    });
  };

  const handleCodeProjectSave = (savedCode) => {
    // Update the code project in the list if it's new
    setIdeInstances(prev => {
      const exists = prev.find(d => d.id === savedCode.id);
      if (exists) return prev; // If it exists, it means we're editing an existing one, which is already reflected in the list by reference. No need to add.
      return [savedCode, ...prev]; // If it was a newly created one which then got saved for the first time
    });
  };

  if (!isCollaborator) {
    return (
      <Card className="cu-card">
        <CardContent className="p-8 text-center">
          <Code className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            IDEs & Development Tools
          </h3>
          <p className="text-gray-600">
            Join this project to access integrated development environments and creative tools.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If a document is active, show the full-screen editor
  if (activeDocument) {
    return (
      <DocumentEditor
        document={activeDocument}
        project={project}
        currentUser={currentUser}
        onClose={handleCloseDocument}
        onSave={handleDocumentSave}
      />
    );
  }

  // If a code project is active, show the full-screen code playground
  if (activeCodeProject) {
    return (
      <CodePlayground
        codeProject={activeCodeProject}
        project={project}
        currentUser={currentUser}
        onClose={handleCloseCodeProject}
        onSave={handleCodeProjectSave}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <>
      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedIdeType && (
                <>
                  {React.createElement(selectedIdeType.icon, { className: "w-5 h-5 mr-2 text-purple-600" })}
                  Create New {selectedIdeType.label}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Title
            </label>
            <Input
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder={`e.g., ${selectedIdeType?.type === 'code_playground' ? 'React Component, Landing Page...' : 'Project Proposal, Meeting Notes...'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  handleCreateDocument();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setNewDocTitle('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDocument}
              disabled={isCreating || !newDocTitle.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${selectedIdeType?.label || 'Item'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Header */}
        <Card className="cu-card bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-900">
              <Code className="w-6 h-6 mr-2" />
              Integrated Development Environments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Access a library of specialized tools and IDEs to build, design, and create. 
              Choose the right environment for your project needs.
            </p>
          </CardContent>
        </Card>

        {/* Existing IDE Instances */}
        {ideInstances.length > 0 && (
          <Card className="cu-card">
            <CardHeader>
              <CardTitle>Your Active IDEs ({ideInstances.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ideInstances.map(instance => {
                  const ideInfo = getIdeTypeInfo(instance.ide_type);
                  const Icon = ideInfo.icon;
                  
                  return (
                    <div 
                      key={instance.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => handleItemClick(instance)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 rounded-lg ${ideInfo.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {ideInfo.label}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors line-clamp-2">
                        {instance.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Last modified: {new Date(instance.updated_date).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available IDE Types */}
        <Card className="cu-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Available IDEs</span>
              <Badge variant="secondary">
                {ideTypes.length} Tools
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideTypes.map(ideType => {
                const Icon = ideType.icon;
                const isImplemented = ideType.type === 'document_editor' || ideType.type === 'code_playground';
                
                return (
                  <div 
                    key={ideType.type}
                    className="p-6 border rounded-lg hover:shadow-md transition-all cursor-pointer group border-dashed hover:border-solid hover:border-purple-300"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-xl ${ideType.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {ideType.label}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {ideType.description}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCreateClick(ideType)}
                        className={`w-full ${isImplemented ? 'group-hover:bg-purple-50 group-hover:text-purple-700 group-hover:border-purple-300' : ''}`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New
                      </Button>
                      {!isImplemented && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Empty State for No IDEs */}
        {ideInstances.length === 0 && (
          <Card className="cu-card border-dashed border-2 border-gray-300">
            <CardContent className="p-12 text-center">
              <Code className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No IDEs Created Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get started by choosing an IDE from the available options above. 
                Create specialized workspaces for coding, design, video editing, and more.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}