import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StickyNote, Save, RefreshCw, Pencil, Check, X } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { ActivityLog } from '@/entities/all';
import { toast } from "sonner";

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

const IdeationNotes = ({ instance, project, currentUser, isCollaborator, onBack, onSave }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSavedBy, setLastSavedBy] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const initialContentRef = useRef('');
  const initialTitleRef = useRef('');
  const contentRef = useRef('');
  const isMountedRef = useRef(true);

  // Load instance content on mount
  useEffect(() => {
    if (instance) {
      const noteContent = instance.content || '';
      const noteTitle = instance.title || 'Untitled Note';
      
      setContent(noteContent);
      setTitle(noteTitle);
      contentRef.current = noteContent;
      initialContentRef.current = noteContent;
      initialTitleRef.current = noteTitle;
      setLastSavedBy(instance.last_modified_by);
      setLastSavedAt(instance.updated_date);
      setHasUnsavedChanges(false);
    }
  }, [instance?.id]);

  const handleContentChange = (value) => {
    setContent(value);
    contentRef.current = value;
    setHasUnsavedChanges(
      value !== initialContentRef.current || 
      title !== initialTitleRef.current
    );
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    setHasUnsavedChanges(
      newTitle !== initialTitleRef.current || 
      contentRef.current !== initialContentRef.current
    );
  };

  const handleRefresh = async () => {
    if (hasUnsavedChanges) {
      const confirmRefresh = window.confirm(
        "You have unsaved changes. Refreshing will discard them. Continue?"
      );
      if (!confirmRefresh) return;
    }

    setIsRefreshing(true);
    try {
      const freshInstance = await withRetry(() => 
        base44.entities.ProjectIDE.filter({ id: instance.id })
      );
      
      if (freshInstance?.[0] && isMountedRef.current) {
        const fresh = freshInstance[0];
        const freshContent = fresh.content || '';
        const freshTitle = fresh.title || 'Untitled Note';
        
        setContent(freshContent);
        setTitle(freshTitle);
        contentRef.current = freshContent;
        initialContentRef.current = freshContent;
        initialTitleRef.current = freshTitle;
        setLastSavedBy(fresh.last_modified_by);
        setLastSavedAt(fresh.updated_date);
        setHasUnsavedChanges(false);
        
        toast.success("Notes refreshed!");
      }
    } catch (error) {
      console.error("Error refreshing notes:", error);
      toast.error("Failed to refresh. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!isCollaborator) {
      toast.error("You don't have permission to edit these notes.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedInstance = await withRetry(() => 
        base44.entities.ProjectIDE.update(instance.id, {
          title: title,
          content: content,
          last_modified_by: currentUser.email
        })
      );

      await withRetry(() => ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: 'ideation_updated',
        action_description: `updated notes: ${title}`,
        entity_type: 'ideation_notes',
        entity_id: instance.id
      }));

      initialContentRef.current = content;
      initialTitleRef.current = title;
      setHasUnsavedChanges(false);
      setLastSavedBy(currentUser.email);
      setLastSavedAt(new Date().toISOString());
      
      if (onSave) {
        onSave(updatedInstance);
      }

      toast.success("Notes saved!");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'check', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card className="cu-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="max-w-md"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingTitle(false);
                        if (e.key === 'Escape') {
                          setTitle(initialTitleRef.current);
                          setIsEditingTitle(false);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingTitle(false)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setTitle(initialTitleRef.current);
                        setIsEditingTitle(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CardTitle className="truncate">{title}</CardTitle>
                    {isCollaborator && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingTitle(true)}
                        className="flex-shrink-0"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
                <CardDescription className="mt-1">
                  {isCollaborator 
                    ? "Capture ideas, plans, and thoughts" 
                    : "View the note"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && isCollaborator && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {lastSavedBy && lastSavedAt && (
            <div className="text-xs text-gray-500 mt-2">
              Last saved by {lastSavedBy.split('@')[0]} {formatDate(lastSavedAt)}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <style>{`
              .ql-toolbar.ql-snow {
                background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
                border-bottom: 2px solid #e5e7eb;
              }
              .ql-container.ql-snow {
                min-height: 400px;
                font-size: 15px;
                line-height: 1.6;
              }
              .ql-editor {
                min-height: 400px;
                padding: 20px;
              }
              .ql-editor.ql-blank::before {
                font-style: normal;
                color: #9ca3af;
              }
              .ql-toolbar .ql-stroke {
                stroke: #4b5563;
              }
              .ql-toolbar .ql-fill {
                fill: #4b5563;
              }
              .ql-toolbar button:hover .ql-stroke,
              .ql-toolbar button:focus .ql-stroke,
              .ql-toolbar button.ql-active .ql-stroke {
                stroke: #7c3aed;
              }
              .ql-toolbar button:hover .ql-fill,
              .ql-toolbar button:focus .ql-fill,
              .ql-toolbar button.ql-active .ql-fill {
                fill: #7c3aed;
              }
              .ql-editor img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 10px 0;
              }
              .ql-editor blockquote {
                border-left: 4px solid #7c3aed;
                padding-left: 16px;
                margin: 16px 0;
                color: #4b5563;
              }
              .ql-editor pre.ql-syntax {
                background-color: #1f2937;
                color: #f3f4f6;
                border-radius: 8px;
                padding: 16px;
                overflow-x: auto;
              }
              .ql-snow .ql-picker {
                color: #4b5563;
              }
            `}</style>
            <ReactQuill
              value={content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              placeholder={
                isCollaborator
                  ? "Start writing your notes..."
                  : "No notes have been added yet."
              }
              readOnly={!isCollaborator}
              theme="snow"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IdeationNotes;