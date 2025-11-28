
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Project, ActivityLog, User } from "@/entities/all"; // Added User entity

export default function EditProjectInstructionsModal({ project, isOpen, onClose, onSuccess }) {
  const [currentUser, setCurrentUser] = useState(null); // Local state for currentUser
  const [isSaving, setIsSaving] = useState(false);
  const [instructions, setInstructions] = useState(project?.project_instructions || {
    overview: "",
    planning_phase: { title: "Planning Phase", description: "", steps: [], deliverables: [] },
    execution_phase: { title: "Execution Phase", description: "", steps: [], deliverables: [] },
    delivery_phase: { title: "Delivery Phase", description: "", steps: [], deliverables: [] },
    success_criteria: [],
    common_challenges: []
  });

  const [newInputs, setNewInputs] = useState({
    planningStep: "",
    planningDeliverable: "",
    executionStep: "",
    executionDeliverable: "",
    deliveryStep: "",
    deliveryDeliverable: "",
    successCriteria: "",
    challenge: { challenge: "", solution: "" }
  });

  // Effect to load currentUser when the modal opens
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
        toast.error("Failed to load user information.");
      }
    };
    
    if (isOpen) {
      loadUser();
    } else {
      // Optionally clear currentUser when modal closes
      setCurrentUser(null); 
    }
  }, [isOpen]);

  const handlePhaseChange = (phase, field, value) => {
    setInstructions(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [field]: value
      }
    }));
  };

  const addToPhaseArray = (phase, field, value) => {
    if (value && value.trim()) {
      setInstructions(prev => ({
        ...prev,
        [phase]: {
          ...prev[phase],
          [field]: [...prev[phase][field], value.trim()]
        }
      }));
      return true;
    }
    return false;
  };

  const removeFromPhaseArray = (phase, field, index) => {
    setInstructions(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [field]: prev[phase][field].filter((_, i) => i !== index)
      }
    }));
  };

  const addToArray = (field, value) => {
    if (value && value.trim()) {
      setInstructions(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      return true;
    }
    return false;
  };

  const removeFromArray = (field, index) => {
    setInstructions(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addChallenge = () => {
    if (newInputs.challenge.challenge.trim() && newInputs.challenge.solution.trim()) {
      setInstructions(prev => ({
        ...prev,
        common_challenges: [...prev.common_challenges, {
          challenge: newInputs.challenge.challenge.trim(),
          solution: newInputs.challenge.solution.trim()
        }]
      }));
      setNewInputs(prev => ({ ...prev, challenge: { challenge: "", solution: "" } }));
      return true;
    }
    return false;
  };

  const handleSave = async () => {
    if (!instructions.overview?.trim()) {
      toast.error("Project overview is required.");
      return;
    }

    if (!instructions.planning_phase?.title?.trim() || !instructions.execution_phase?.title?.trim() || !instructions.delivery_phase?.title?.trim()) {
      toast.error("All phase titles are required.");
      return;
    }

    // Check if currentUser is loaded before proceeding
    if (!currentUser) {
      toast.error("Unable to save - user not authenticated.");
      return;
    }

    setIsSaving(true);
    try {
      await Project.update(project.id, {
        project_instructions: instructions
      });
      
      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: "ideation_updated",
        action_description: "updated project instructions",
        entity_type: "project_instructions"
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving instructions:", error);
      toast.error("Failed to save instructions.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project Instructions</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label>Project Overview *</Label>
            <Textarea
              value={instructions.overview}
              onChange={(e) => setInstructions(prev => ({ ...prev, overview: e.target.value }))}
              placeholder="High-level overview of what this project accomplishes..."
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900">Planning Phase</h3>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={instructions.planning_phase.description}
                onChange={(e) => handlePhaseChange('planning_phase', 'description', e.target.value)}
                placeholder="Describe the planning phase..."
                rows={2}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Steps</Label>
              {instructions.planning_phase.steps.length > 0 && (
                <div className="space-y-1 mt-2 mb-2">
                  {instructions.planning_phase.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border">
                      <span className="flex-1 text-sm">{step}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromPhaseArray('planning_phase', 'steps', idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Input
                  value={newInputs.planningStep}
                  onChange={(e) => setNewInputs(prev => ({ ...prev, planningStep: e.target.value }))}
                  placeholder="Add a step..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (addToPhaseArray('planning_phase', 'steps', newInputs.planningStep)) {
                        setNewInputs(prev => ({ ...prev, planningStep: "" }));
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => {
                    if (addToPhaseArray('planning_phase', 'steps', newInputs.planningStep)) {
                      setNewInputs(prev => ({ ...prev, planningStep: "" }));
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Deliverables</Label>
              {instructions.planning_phase.deliverables.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {instructions.planning_phase.deliverables.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      {item}
                      <button type="button" onClick={() => removeFromPhaseArray('planning_phase', 'deliverables', idx)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Input
                  value={newInputs.planningDeliverable}
                  onChange={(e) => setNewInputs(prev => ({ ...prev, planningDeliverable: e.target.value }))}
                  placeholder="Add a deliverable..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (addToPhaseArray('planning_phase', 'deliverables', newInputs.planningDeliverable)) {
                        setNewInputs(prev => ({ ...prev, planningDeliverable: "" }));
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => {
                    if (addToPhaseArray('planning_phase', 'deliverables', newInputs.planningDeliverable)) {
                      setNewInputs(prev => ({ ...prev, planningDeliverable: "" }));
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900">Execution Phase</h3>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={instructions.execution_phase.description}
                onChange={(e) => handlePhaseChange('execution_phase', 'description', e.target.value)}
                placeholder="Describe the execution phase..."
                rows={2}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Steps</Label>
              {instructions.execution_phase.steps.length > 0 && (
                <div className="space-y-1 mt-2 mb-2">
                  {instructions.execution_phase.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border">
                      <span className="flex-1 text-sm">{step}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromPhaseArray('execution_phase', 'steps', idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Input
                  value={newInputs.devStep}
                  onChange={(e) => setNewInputs(prev => ({ ...prev, devStep: e.target.value }))}
                  placeholder="Add a step..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (addToPhaseArray('execution_phase', 'steps', newInputs.devStep)) {
                        setNewInputs(prev => ({ ...prev, devStep: "" }));
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => {
                    if (addToPhaseArray('execution_phase', 'steps', newInputs.devStep)) {
                      setNewInputs(prev => ({ ...prev, devStep: "" }));
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Deliverables</Label>
              {instructions.execution_phase.deliverables.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {instructions.execution_phase.deliverables.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      {item}
                      <button type="button" onClick={() => removeFromPhaseArray('execution_phase', 'deliverables', idx)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Input
                  value={newInputs.devDeliverable}
                  onChange={(e) => setNewInputs(prev => ({ ...prev, devDeliverable: e.target.value }))}
                  placeholder="Add a deliverable..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (addToPhaseArray('execution_phase', 'deliverables', newInputs.devDeliverable)) {
                        setNewInputs(prev => ({ ...prev, devDeliverable: "" }));
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => {
                    if (addToPhaseArray('execution_phase', 'deliverables', newInputs.devDeliverable)) {
                      setNewInputs(prev => ({ ...prev, devDeliverable: "" }));
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900">Delivery Phase</h3>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={instructions.delivery_phase.description}
                onChange={(e) => handlePhaseChange('delivery_phase', 'description', e.target.value)}
                placeholder="Describe the delivery phase..."
                rows={2}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Steps</Label>
              {instructions.delivery_phase.steps.length > 0 && (
                <div className="space-y-1 mt-2 mb-2">
                  {instructions.delivery_phase.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border">
                      <span className="flex-1 text-sm">{step}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromPhaseArray('delivery_phase', 'steps', idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Input
                  value={newInputs.deliveryStep}
                  onChange={(e) => setNewInputs(prev => ({ ...prev, deliveryStep: e.target.value }))}
                  placeholder="Add a step..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (addToPhaseArray('delivery_phase', 'steps', newInputs.deliveryStep)) {
                        setNewInputs(prev => ({ ...prev, deliveryStep: "" }));
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => {
                    if (addToPhaseArray('delivery_phase', 'steps', newInputs.deliveryStep)) {
                      setNewInputs(prev => ({ ...prev, deliveryStep: "" }));
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Deliverables</Label>
              {instructions.delivery_phase.deliverables.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {instructions.delivery_phase.deliverables.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      {item}
                      <button type="button" onClick={() => removeFromPhaseArray('delivery_phase', 'deliverables', idx)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Input
                  value={newInputs.deliveryDeliverable}
                  onChange={(e) => setNewInputs(prev => ({ ...prev, deliveryDeliverable: e.target.value }))}
                  placeholder="Add a deliverable..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (addToPhaseArray('delivery_phase', 'deliverables', newInputs.deliveryDeliverable)) {
                        setNewInputs(prev => ({ ...prev, deliveryDeliverable: "" }));
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => {
                    if (addToPhaseArray('delivery_phase', 'deliverables', newInputs.deliveryDeliverable)) {
                      setNewInputs(prev => ({ ...prev, deliveryDeliverable: "" }));
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Success Criteria</Label>
            {instructions.success_criteria.length > 0 && (
              <div className="space-y-1 mt-2 mb-2">
                {instructions.success_criteria.map((criteria, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                    <span className="flex-1 text-sm">{criteria}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromArray('success_criteria', idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Input
                value={newInputs.successCriteria}
                onChange={(e) => setNewInputs(prev => ({ ...prev, successCriteria: e.target.value }))}
                placeholder="Add success criteria..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (addToArray('success_criteria', newInputs.successCriteria)) {
                      setNewInputs(prev => ({ ...prev, successCriteria: "" }));
                    }
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                onClick={() => {
                  if (addToArray('success_criteria', newInputs.successCriteria)) {
                    setNewInputs(prev => ({ ...prev, successCriteria: "" }));
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Common Challenges & Solutions</Label>
            {instructions.common_challenges.length > 0 && (
              <div className="space-y-2 mt-2 mb-2">
                {instructions.common_challenges.map((item, idx) => (
                  <div key={idx} className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <div className="flex items-start justify-between mb-1">
                      <strong className="text-sm text-yellow-900">{item.challenge}</strong>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromArray('common_challenges', idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-yellow-800">{item.solution}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2 mt-2">
              <Input
                value={newInputs.challenge.challenge}
                onChange={(e) => setNewInputs(prev => ({ 
                  ...prev, 
                  challenge: { ...prev.challenge, challenge: e.target.value } 
                }))}
                placeholder="Challenge description..."
              />
              <Textarea
                value={newInputs.challenge.solution}
                onChange={(e) => setNewInputs(prev => ({ 
                  ...prev, 
                  challenge: { ...prev.challenge, solution: e.target.value } 
                }))}
                placeholder="Solution..."
                rows={2}
              />
              <Button
                type="button"
                onClick={() => {
                  if (addChallenge()) {
                    // Challenge added successfully
                  }
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Challenge & Solution
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="cu-button">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Instructions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
