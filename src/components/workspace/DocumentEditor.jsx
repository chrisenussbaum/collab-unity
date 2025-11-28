import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Save, X, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
  ]
};

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'list', 'bullet',
  'indent',
  'align',
  'blockquote', 'code-block',
  'link', 'image'
];

export default function DocumentEditor({ 
  document, 
  project, 
  currentUser,
  onClose,
  onSave 
}) {
  const [title, setTitle] = useState(document?.title || '');
  const [content, setContent] = useState(document?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(document?.updated_date || null);
  
  const quillRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    // Auto-save every 30 seconds if there are unsaved changes
    if (hasUnsavedChanges) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, content, title]);

  const handleContentChange = (value) => {
    setContent(value);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSave = async (isAutoSave = false) => {
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setIsSaving(true);
    try {
      const documentData = {
        project_id: project.id,
        ide_type: 'document_editor',
        title: title.trim(),
        content: content,
        last_modified_by: currentUser.email,
        is_active: true
      };

      if (document?.id) {
        // Update existing document
        await base44.entities.ProjectIDE.update(document.id, documentData);
      } else {
        // Create new document
        const newDoc = await base44.entities.ProjectIDE.create(documentData);
        if (onSave) {
          onSave(newDoc);
        }
      }

      setHasUnsavedChanges(false);
      setLastSaved(new Date().toISOString());
      
      if (!isAutoSave) {
        toast.success("Document saved successfully");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!document?.id) return;

    setIsDeleting(true);
    try {
      await base44.entities.ProjectIDE.delete(document.id);
      toast.success("Document deleted successfully");
      if (onClose) {
        onClose(true); // Pass true to indicate refresh needed
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm("You have unsaved changes. Do you want to save before closing?");
      if (confirmClose) {
        handleSave().then(() => {
          if (onClose) onClose(true);
        });
        return;
      }
    }
    if (onClose) onClose(true);
  };

  const getLastSavedText = () => {
    if (!lastSaved) return '';
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Saved ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    return `Saved on ${date.toLocaleDateString()}`;
  };

  return (
    <>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete "{title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <Input
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Untitled Document"
                  className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-2"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              {lastSaved && (
                <span className="text-xs text-gray-500 mr-2 hidden sm:inline">
                  {getLastSavedText()}
                </span>
              )}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs">
                  Unsaved
                </Badge>
              )}
              {document?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={() => handleSave(false)}
                disabled={isSaving || !hasUnsavedChanges}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden p-4">
          <Card className="h-full overflow-hidden">
            <CardContent className="p-0 h-full">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={handleContentChange}
                modules={modules}
                formats={formats}
                placeholder="Start writing your document..."
                className="h-full document-editor"
                style={{ height: '100%' }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        .document-editor .ql-container {
          font-size: 16px;
          min-height: calc(100% - 42px);
        }
        
        .document-editor .ql-editor {
          min-height: 500px;
          padding: 2rem;
        }
        
        .document-editor .ql-toolbar {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        @media (max-width: 640px) {
          .document-editor .ql-editor {
            padding: 1rem;
            min-height: 400px;
          }
        }
      `}</style>
    </>
  );
}