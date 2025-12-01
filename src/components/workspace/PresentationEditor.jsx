import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Presentation, 
  Save, 
  Trash2, 
  ArrowLeft, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Type,
  Square,
  Circle,
  Minus,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Copy,
  X,
  GripVertical
} from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const SLIDE_TEMPLATES = [
  { id: 'blank', label: 'Blank', bg: '#ffffff' },
  { id: 'title', label: 'Title Slide', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'content', label: 'Content', bg: '#f8fafc' },
  { id: 'image', label: 'Image Focus', bg: '#1e293b' },
  { id: 'two-column', label: 'Two Column', bg: '#ffffff' },
];

const THEME_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#667eea', '#764ba2', '#6366f1', '#8b5cf6',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#1e293b'
];

const DEFAULT_SLIDE = {
  id: Date.now(),
  background: '#ffffff',
  elements: []
};

export default function PresentationEditor({ 
  codeProject, 
  project, 
  currentUser,
  onClose,
  onSave,
  isReadOnly = false
}) {
  const [title, setTitle] = useState(codeProject?.title || 'Untitled Presentation');
  const [slides, setSlides] = useState([{ ...DEFAULT_SLIDE }]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(codeProject?.updated_date || null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);

  const slideCanvasRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    if (codeProject?.content) {
      try {
        const parsed = JSON.parse(codeProject.content);
        if (parsed.slides && Array.isArray(parsed.slides)) {
          setSlides(parsed.slides);
        }
      } catch (error) {
        console.error("Error parsing saved presentation:", error);
      }
    }
  }, [codeProject]);

  useEffect(() => {
    if (hasUnsavedChanges && !isReadOnly) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [hasUnsavedChanges, slides, title, isReadOnly]);

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const addSlide = (template = 'blank') => {
    if (isReadOnly) return;
    const templateConfig = SLIDE_TEMPLATES.find(t => t.id === template);
    const newSlide = {
      id: Date.now(),
      background: templateConfig?.bg || '#ffffff',
      elements: template === 'title' ? [
        { id: Date.now(), type: 'text', x: 50, y: 200, width: 700, height: 80, content: 'Presentation Title', fontSize: 48, fontWeight: 'bold', color: '#ffffff', align: 'center' },
        { id: Date.now() + 1, type: 'text', x: 50, y: 300, width: 700, height: 40, content: 'Subtitle goes here', fontSize: 24, color: '#ffffff', align: 'center' }
      ] : []
    };
    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    setCurrentSlideIndex(newSlides.length - 1);
    setHasUnsavedChanges(true);
  };

  const duplicateSlide = () => {
    if (isReadOnly) return;
    const slideCopy = JSON.parse(JSON.stringify(currentSlide));
    slideCopy.id = Date.now();
    slideCopy.elements = slideCopy.elements.map(el => ({ ...el, id: Date.now() + Math.random() }));
    const newSlides = [...slides.slice(0, currentSlideIndex + 1), slideCopy, ...slides.slice(currentSlideIndex + 1)];
    setSlides(newSlides);
    setCurrentSlideIndex(currentSlideIndex + 1);
    setHasUnsavedChanges(true);
  };

  const deleteSlide = () => {
    if (isReadOnly || slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== currentSlideIndex);
    setSlides(newSlides);
    setCurrentSlideIndex(Math.min(currentSlideIndex, newSlides.length - 1));
    setHasUnsavedChanges(true);
  };

  const updateSlideBackground = (color) => {
    if (isReadOnly) return;
    const updated = [...slides];
    updated[currentSlideIndex] = { ...updated[currentSlideIndex], background: color };
    setSlides(updated);
    setHasUnsavedChanges(true);
  };

  const addElement = (type) => {
    if (isReadOnly) return;
    const newElement = {
      id: Date.now(),
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 300 : 200,
      height: type === 'text' ? 60 : 200,
      content: type === 'text' ? 'Click to edit' : '',
      fontSize: 24,
      color: '#1e293b',
      backgroundColor: type === 'shape' ? '#e2e8f0' : 'transparent',
      align: 'left'
    };
    const updated = [...slides];
    updated[currentSlideIndex].elements.push(newElement);
    setSlides(updated);
    setSelectedElementId(newElement.id);
    setHasUnsavedChanges(true);
  };

  const updateElement = (elementId, updates) => {
    if (isReadOnly) return;
    const updated = [...slides];
    const elIndex = updated[currentSlideIndex].elements.findIndex(el => el.id === elementId);
    if (elIndex !== -1) {
      updated[currentSlideIndex].elements[elIndex] = { ...updated[currentSlideIndex].elements[elIndex], ...updates };
      setSlides(updated);
      setHasUnsavedChanges(true);
    }
  };

  const deleteElement = (elementId) => {
    if (isReadOnly) return;
    const updated = [...slides];
    updated[currentSlideIndex].elements = updated[currentSlideIndex].elements.filter(el => el.id !== elementId);
    setSlides(updated);
    setSelectedElementId(null);
    setHasUnsavedChanges(true);
  };

  const handleSave = async (isAutoSave = false) => {
    if (isReadOnly) return;
    if (!title.trim()) {
      toast.error("Please enter a presentation title");
      return;
    }

    setIsSaving(true);
    try {
      const content = JSON.stringify({ slides });
      const data = {
        project_id: project.id,
        ide_type: 'presentation',
        title: title.trim(),
        content,
        last_modified_by: currentUser.email,
        is_active: true
      };

      if (codeProject?.id) {
        await base44.entities.ProjectIDE.update(codeProject.id, data);
      } else {
        const newPresentation = await base44.entities.ProjectIDE.create(data);
        if (onSave) onSave(newPresentation);
      }

      setHasUnsavedChanges(false);
      setLastSaved(new Date().toISOString());
      if (!isAutoSave) toast.success("Saved");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isReadOnly || !codeProject?.id) return;
    setIsDeleting(true);
    try {
      await base44.entities.ProjectIDE.delete(codeProject.id);
      toast.success("Deleted");
      if (onClose) onClose(true);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleClose = () => {
    if (isReadOnly) {
      if (onClose) onClose(true);
      return;
    }
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm("Unsaved changes. Save before closing?");
      if (confirmClose) {
        handleSave().then(() => { if (onClose) onClose(true); });
        return;
      }
    }
    if (onClose) onClose(true);
  };

  const getLastSavedText = () => {
    if (!lastSaved) return '';
    const diffMins = Math.floor((Date.now() - new Date(lastSaved)) / 60000);
    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins}m ago`;
    return `Saved ${Math.floor(diffMins / 60)}h ago`;
  };

  const selectedElement = currentSlide?.elements?.find(el => el.id === selectedElementId);

  const navigateSlide = (direction) => {
    if (direction === 'prev' && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (direction === 'next' && currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  // Presentation Mode
  if (isPresentationMode) {
    return (
      <div 
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onClick={() => navigateSlide('next')}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === ' ') navigateSlide('next');
          if (e.key === 'ArrowLeft') navigateSlide('prev');
          if (e.key === 'Escape') setIsPresentationMode(false);
        }}
        tabIndex={0}
        autoFocus
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
          onClick={(e) => { e.stopPropagation(); setIsPresentationMode(false); }}
        >
          <X className="w-6 h-6" />
        </Button>
        
        <div 
          className="w-full h-full flex items-center justify-center p-8"
          style={{ background: currentSlide.background }}
        >
          {currentSlide.elements.map(el => (
            <div
              key={el.id}
              className="absolute"
              style={{
                left: `${(el.x / 800) * 100}%`,
                top: `${(el.y / 450) * 100}%`,
                width: `${(el.width / 800) * 100}%`,
                fontSize: `${el.fontSize * 2}px`,
                fontWeight: el.fontWeight || 'normal',
                fontStyle: el.fontStyle || 'normal',
                textDecoration: el.textDecoration || 'none',
                color: el.color,
                textAlign: el.align,
                backgroundColor: el.backgroundColor !== 'transparent' ? el.backgroundColor : undefined,
                borderRadius: el.type === 'shape' ? '8px' : undefined
              }}
            >
              {el.content}
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 text-white">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigateSlide('prev'); }} disabled={currentSlideIndex === 0}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <span>{currentSlideIndex + 1} / {slides.length}</span>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigateSlide('next'); }} disabled={currentSlideIndex === slides.length - 1}>
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Presentation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Delete "{title}"? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3 flex-1">
            {!isReadOnly && (
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Presentation className="w-6 h-6 text-orange-600" />
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setHasUnsavedChanges(true); }}
              placeholder="Presentation Title"
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 max-w-md"
              readOnly={isReadOnly}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            {!isReadOnly && lastSaved && <span className="text-xs text-gray-500 hidden md:inline">{getLastSavedText()}</span>}
            {!isReadOnly && hasUnsavedChanges && <Badge variant="outline" className="text-xs">Unsaved</Badge>}
            {isReadOnly && <Badge className="bg-blue-100 text-blue-700">Read Only</Badge>}
            
            <Button variant="outline" size="sm" onClick={() => setIsPresentationMode(true)}>
              <Play className="w-4 h-4 mr-2" />
              Present
            </Button>
            
            {!isReadOnly && codeProject?.id && (
              <Button variant="ghost" size="icon" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            {!isReadOnly && (
              <Button onClick={() => handleSave(false)} disabled={isSaving || !hasUnsavedChanges} size="sm">
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Slide Thumbnails */}
          <div className="w-48 bg-gray-50 border-r overflow-y-auto p-3 space-y-2 flex-shrink-0">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`relative aspect-video bg-white border-2 rounded cursor-pointer hover:border-orange-400 transition-colors ${
                  index === currentSlideIndex ? 'border-orange-500 shadow-md' : 'border-gray-200'
                }`}
                style={{ background: slide.background }}
                onClick={() => setCurrentSlideIndex(index)}
              >
                <span className="absolute bottom-1 left-1 text-xs text-gray-500 bg-white/80 px-1 rounded">{index + 1}</span>
              </div>
            ))}
            
            {!isReadOnly && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => addSlide('blank')}>
                <Plus className="w-4 h-4 mr-1" /> Add Slide
              </Button>
            )}
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            {!isReadOnly && (
              <div className="bg-white border-b px-4 py-2 flex items-center gap-2 flex-wrap flex-shrink-0">
                <div className="flex items-center gap-1 border-r pr-3">
                  <Button variant="ghost" size="sm" onClick={() => addElement('text')} title="Add Text">
                    <Type className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => addElement('shape')} title="Add Shape">
                    <Square className="w-4 h-4" />
                  </Button>
                </div>

                {selectedElement && (
                  <>
                    <div className="flex items-center gap-1 border-r pr-3">
                      <Button 
                        variant={selectedElement.fontWeight === 'bold' ? 'secondary' : 'ghost'} 
                        size="sm"
                        onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={selectedElement.fontStyle === 'italic' ? 'secondary' : 'ghost'} 
                        size="sm"
                        onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1 border-r pr-3">
                      <Button variant={selectedElement.align === 'left' ? 'secondary' : 'ghost'} size="sm" onClick={() => updateElement(selectedElement.id, { align: 'left' })}>
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button variant={selectedElement.align === 'center' ? 'secondary' : 'ghost'} size="sm" onClick={() => updateElement(selectedElement.id, { align: 'center' })}>
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button variant={selectedElement.align === 'right' ? 'secondary' : 'ghost'} size="sm" onClick={() => updateElement(selectedElement.id, { align: 'right' })}>
                        <AlignRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <Select value={selectedElement.fontSize?.toString() || '24'} onValueChange={(val) => updateElement(selectedElement.id, { fontSize: parseInt(val) })}>
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72].map(size => (
                          <SelectItem key={size} value={size.toString()}>{size}px</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button variant="ghost" size="sm" onClick={() => deleteElement(selectedElement.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={duplicateSlide} title="Duplicate Slide">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deleteSlide} disabled={slides.length <= 1} className="text-red-600" title="Delete Slide">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Canvas */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
              <div
                ref={slideCanvasRef}
                className="relative bg-white shadow-xl rounded-lg overflow-hidden"
                style={{
                  width: '800px',
                  height: '450px',
                  background: currentSlide.background
                }}
                onClick={(e) => {
                  if (e.target === slideCanvasRef.current) setSelectedElementId(null);
                }}
              >
                {currentSlide.elements.map(el => (
                  <div
                    key={el.id}
                    className={`absolute cursor-move ${selectedElementId === el.id ? 'ring-2 ring-orange-500' : ''}`}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      minHeight: el.height,
                      backgroundColor: el.backgroundColor !== 'transparent' ? el.backgroundColor : undefined,
                      borderRadius: el.type === 'shape' ? '8px' : undefined
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                  >
                    {el.type === 'text' && (
                      <Textarea
                        value={el.content}
                        onChange={(e) => updateElement(el.id, { content: e.target.value })}
                        className="w-full h-full bg-transparent border-none resize-none focus:ring-0 p-2"
                        style={{
                          fontSize: el.fontSize,
                          fontWeight: el.fontWeight || 'normal',
                          fontStyle: el.fontStyle || 'normal',
                          color: el.color,
                          textAlign: el.align
                        }}
                        readOnly={isReadOnly}
                      />
                    )}
                    {el.type === 'shape' && (
                      <div className="w-full h-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Background Picker */}
            {!isReadOnly && (
              <div className="bg-white border-t px-4 py-2 flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-gray-600">Background:</span>
                <div className="flex gap-1">
                  {THEME_COLORS.slice(0, 10).map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded border-2 ${currentSlide.background === color ? 'border-orange-500' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateSlideBackground(color)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}