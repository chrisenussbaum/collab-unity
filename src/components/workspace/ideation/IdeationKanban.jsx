import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Plus, 
  X,
  Lightbulb,
  Target,
  CheckSquare,
  HelpCircle,
  Trash2,
  GripVertical
} from 'lucide-react';
import { ActivityLog } from '@/entities/all';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const CARD_TYPES = [
  { id: 'idea', label: 'Feature Idea', icon: '💡', color: 'bg-yellow-50 border-yellow-300' },
  { id: 'goal', label: 'Goal', icon: '🎯', color: 'bg-blue-50 border-blue-300' },
  { id: 'decision', label: 'Decision', icon: '✅', color: 'bg-green-50 border-green-300' },
  { id: 'question', label: 'Question', icon: '❓', color: 'bg-purple-50 border-purple-300' },
];

export default function IdeationKanban({ instance, project, currentUser, isCollaborator, onBack, onSave, onDelete }) {
  const [cards, setCards] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCard, setNewCard] = useState({ type: 'idea', title: '', description: '' });
  const [editingCard, setEditingCard] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (instance?.content) {
      try {
        const data = JSON.parse(instance.content);
        setCards(data.cards || []);
      } catch (e) {
        setCards([]);
      }
    }
  }, [instance?.id]);

  const handleRefresh = async () => {
    if (hasUnsavedChanges && !window.confirm("Discard unsaved changes?")) return;
    setIsRefreshing(true);
    try {
      const results = await base44.entities.ProjectIDE.filter({ id: instance.id });
      const fresh = results?.[0];
      if (fresh?.content) {
        const data = JSON.parse(fresh.content);
        setCards(data.cards || []);
        setHasUnsavedChanges(false);
        toast.success("Refreshed!");
      }
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const content = JSON.stringify({ cards });
      await base44.entities.ProjectIDE.update(instance.id, {
        content,
        last_modified_by: currentUser.email
      });

      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: 'ideation_updated',
        action_description: `updated idea board "${instance.title}"`,
        entity_type: 'ideation',
        entity_id: instance.id
      });

      setHasUnsavedChanges(false);
      toast.success("Saved!");
      if (onSave) onSave({ ...instance, content });
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBoard = () => {
    if (onDelete) {
      onDelete(instance.id, 'kanban');
    }
  };

  const handleAddCard = () => {
    if (!newCard.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    const card = {
      id: `card-${Date.now()}`,
      type: newCard.type,
      title: newCard.title.trim(),
      description: newCard.description.trim(),
      createdBy: currentUser.email,
      createdAt: new Date().toISOString()
    };
    
    setCards(prev => [...prev, card]);
    setNewCard({ type: 'idea', title: '', description: '' });
    setShowAddDialog(false);
    setHasUnsavedChanges(true);
  };

  const handleUpdateCard = () => {
    if (!editingCard?.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    setCards(prev => prev.map(c => 
      c.id === editingCard.id ? { ...editingCard, title: editingCard.title.trim(), description: editingCard.description.trim() } : c
    ));
    setEditingCard(null);
    setHasUnsavedChanges(true);
  };

  const handleDeleteCard = (cardId) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(cards);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    setCards(items);
    setHasUnsavedChanges(true);
  };

  const getCardTypeInfo = (typeId) => {
    return CARD_TYPES.find(t => t.id === typeId) || CARD_TYPES[0];
  };

  return (
    <div className="space-y-4">
      {/* Edit Card Dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-2">
              {CARD_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setEditingCard(prev => ({ ...prev, type: type.id }))}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    editingCard?.type === type.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <p className="text-xs mt-1">{type.label}</p>
                </button>
              ))}
            </div>
            <Input
              placeholder="Card title"
              value={editingCard?.title || ''}
              onChange={(e) => setEditingCard(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Description (optional)"
              value={editingCard?.description || ''}
              onChange={(e) => setEditingCard(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>Cancel</Button>
            <Button onClick={handleUpdateCard}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-2">
              {CARD_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setNewCard(prev => ({ ...prev, type: type.id }))}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    newCard.type === type.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <p className="text-xs mt-1">{type.label}</p>
                </button>
              ))}
            </div>
            <Input
              placeholder="Card title"
              value={newCard.title}
              onChange={(e) => setNewCard(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newCard.description}
              onChange={(e) => setNewCard(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCard}>Add Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && <Badge variant="outline" className="text-amber-600">Unsaved</Badge>}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {isCollaborator && (
            <>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteBoard}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="cu-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{instance?.title || 'Idea Board'}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Brainstorm and capture ideas together</p>
            </div>
            {isCollaborator && (
              <Button onClick={() => setShowAddDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-1" /> Add Card
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No ideas yet. Click "Add Card" to get started!</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="ideation-board" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  >
                    {cards.map((card, index) => {
                      const typeInfo = getCardTypeInfo(card.type);
                      return (
                        <Draggable 
                          key={card.id} 
                          draggableId={card.id} 
                          index={index}
                          isDragDisabled={!isCollaborator}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-4 rounded-xl border-2 ${typeInfo.color} ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              } transition-shadow group`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{typeInfo.icon}</span>
                                  <span className="text-xs font-medium text-gray-600">{typeInfo.label}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isCollaborator && (
                                    <>
                                      <div {...provided.dragHandleProps} className="cursor-grab">
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setEditingCard(card)}
                                      >
                                        <Lightbulb className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500 hover:text-red-700"
                                        onClick={() => handleDeleteCard(card.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-1">{card.title}</h4>
                              {card.description && (
                                <p className="text-sm text-gray-600 line-clamp-3">{card.description}</p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    
                    {/* Add Card Placeholder */}
                    {isCollaborator && (
                      <div
                        onClick={() => setShowAddDialog(true)}
                        className="p-4 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                      >
                        <Plus className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}