import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Briefcase } from "lucide-react";
import ArrayInputWithSearch from "../ArrayInputWithSearch";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function EditPortfolioItemDialog({ isOpen, onClose, item, onSave }) {
  const [currentItem, setCurrentItem] = useState({
    title: '',
    description: '',
    role: '',
    outcomes: [],
    technologies: [],
    project_url: '',
    completion_date: '',
    related_project_id: ''
  });
  const [userProjects, setUserProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (item) {
      setCurrentItem({
        ...item,
        outcomes: item.outcomes || [],
        technologies: item.technologies || [],
      });
      
      if (item.related_project_id) {
        setSelectedProject({ id: item.related_project_id });
      }
    } else {
      setCurrentItem({
        title: '',
        description: '',
        role: '',
        outcomes: [],
        technologies: [],
        project_url: '',
        completion_date: '',
        related_project_id: ''
      });
      setSelectedProject(null);
    }
  }, [item]);

  useEffect(() => {
    const loadUserProjects = async () => {
      if (!isOpen) return;
      
      setIsLoadingProjects(true);
      try {
        const currentUser = await base44.auth.me();
        
        const createdProjects = await base44.entities.Project.filter({ 
          created_by: currentUser.email 
        });
        
        const collaboratingProjects = await base44.entities.Project.filter({
          collaborator_emails: { $in: [currentUser.email] }
        });

        const allProjects = [...createdProjects, ...collaboratingProjects];
        const uniqueProjects = allProjects.reduce((acc, current) => {
          if (!acc.find(item => item.id === current.id)) {
            acc.push(current);
          }
          return acc;
        }, []);

        uniqueProjects.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setUserProjects(uniqueProjects);

        // If editing and has related_project_id, find and set the selected project
        if (item?.related_project_id) {
          const found = uniqueProjects.find(p => p.id === item.related_project_id);
          if (found) {
            setSelectedProject(found);
          }
        }
      } catch (error) {
        console.error("Error loading user projects:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadUserProjects();
  }, [isOpen, item]);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setCurrentItem(prev => ({
      ...prev,
      related_project_id: project.id,
      title: prev.title || project.title,
      technologies: prev.technologies.length > 0 ? prev.technologies : (project.skills_needed || [])
    }));
  };

  const handleSave = () => {
    if (!currentItem.title || !currentItem.description) {
      toast.error("Title and description are required.");
      return;
    }
    onSave(currentItem);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit' : 'Add'} Portfolio Item</DialogTitle>
          <DialogDescription>
            Showcase your work by linking it to a project or adding custom details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Project Selection */}
          <div>
            <Label className="mb-2 block">Link to Project (Optional)</Label>
            <p className="text-xs text-gray-500 mb-2">Choose from your projects to auto-fill details</p>
            
            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-4 border rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-sm text-gray-500">Loading projects...</span>
              </div>
            ) : (
              <>
                {selectedProject ? (
                  <div className="border-2 border-purple-300 rounded-lg p-3 bg-purple-50">
                    <div className="flex items-start space-x-3">
                      {selectedProject.logo_url && (
                        <div className="w-14 h-14 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-purple-200">
                          <img src={selectedProject.logo_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-purple-700 mb-0.5">Linked Project</p>
                            <h4 className="font-semibold text-gray-900">{selectedProject.title}</h4>
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">{selectedProject.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedProject(null);
                              setCurrentItem(prev => ({ ...prev, related_project_id: '' }));
                            }}
                            className="ml-2 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                    {userProjects.length > 0 ? (
                      userProjects.map(project => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleProjectSelect(project)}
                          className="w-full text-left p-2.5 rounded hover:bg-white border border-transparent hover:border-purple-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            {project.logo_url && (
                              <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                <img src={project.logo_url} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{project.title}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">{project.description}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No projects found</p>
                        <p className="text-xs text-gray-400 mt-1">Create a project first to link it here</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input
                value={currentItem.title}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="My Awesome Project"
              />
            </div>
            <div>
              <Label>Your Role</Label>
              <Input
                value={currentItem.role}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, role: e.target.value }))}
                placeholder="Lead Developer, Designer..."
              />
            </div>
            <div>
              <Label>Completion Date</Label>
              <Input
                value={currentItem.completion_date}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, completion_date: e.target.value }))}
                placeholder="January 2024"
              />
            </div>
          </div>
          
          <div>
            <Label>Description *</Label>
            <Textarea
              value={currentItem.description}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your contributions, the impact, and what you learned..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <Label>External URL (Optional)</Label>
            <Input
              value={currentItem.project_url}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, project_url: e.target.value }))}
              placeholder="https://demo.com or https://github.com/..."
            />
            <p className="text-xs text-gray-500 mt-1">Live demo, GitHub repo, or other external link</p>
          </div>

          <div>
            <Label>Technologies Used</Label>
            <ArrayInputWithSearch
              title=""
              items={currentItem.technologies || []}
              onAdd={(tech) => setCurrentItem(prev => ({ 
                ...prev, 
                technologies: [...(prev.technologies || []), tech] 
              }))}
              onRemove={(tech) => setCurrentItem(prev => ({ 
                ...prev, 
                technologies: (prev.technologies || []).filter(t => t !== tech) 
              }))}
              placeholder="Add technologies..."
              type="tools"
            />
          </div>

          <div>
            <Label>Key Outcomes</Label>
            <Textarea
              value={(currentItem.outcomes || []).join('\n')}
              onChange={(e) => setCurrentItem(prev => ({ 
                ...prev, 
                outcomes: e.target.value.split('\n').filter(o => o.trim()) 
              }))}
              placeholder="Increased user engagement by 40%&#10;Reduced load time by 60%&#10;Implemented new feature X..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">One outcome per line</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="cu-button">
            {item ? 'Update' : 'Add'} Portfolio Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}