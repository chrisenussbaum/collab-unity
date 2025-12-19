import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StickyNote, RefreshCw, AlertTriangle, Save, ArrowLeft, Trash2 } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { ActivityLog } from '@/entities/all';

const withRetry = async (apiCall, maxRetries = 5, baseDelay = 2000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

export default function IdeationNotes({ instance, project, currentUser, isCollaborator, onBack, onSave, onDelete }) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialContentRef = useRef('');
  const contentRef = useRef('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (instance?.content) {
      try {
        const data = JSON.parse(instance.content);
        const noteContent = data.content || '';
        setContent(noteContent);
        contentRef.current = noteContent;
        initialContentRef.current = noteContent;
        setHasUnsavedChanges(false);
      } catch (e) {
        setContent('');
        initialContentRef.current = '';
      }
    }
  }, [instance?.id]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const handleContentChange = (value) => {
    setContent(value);
    contentRef.current = value;
    setHasUnsavedChanges(value !== initialContentRef.current);
  };

  const handleRefresh = async () => {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Refreshing will discard them. Continue?")) return;
    setIsRefreshing(true);
    try {
      const results = await withRetry(() => base44.entities.ProjectIDE.filter({ id: instance.id }));
      const freshInstance = results?.[0];
      if (freshInstance?.content && isMountedRef.current) {
        const data = JSON.parse(freshInstance.content);
        const noteContent = data.content || '';
        setContent(noteContent);
        contentRef.current = noteContent;
        initialContentRef.current = noteContent;
        setHasUnsavedChanges(false);
        toast.success("Notes refreshed!");
      }
    } catch (error) {
      console.error("Error refreshing:", error);
      toast.error("Failed to refresh");
    } finally {
      if (isMountedRef.current) setIsRefreshing(false);
    }
  };

  const handleSave = async () => {
    if (!isCollaborator) {
      toast.error("You don't have permission to edit.");
      return;
    }
    setIsSaving(true);
    try {
      const contentData = JSON.stringify({ content });
      await withRetry(() => base44.entities.ProjectIDE.update(instance.id, { 
        content: contentData,
        last_modified_by: currentUser.email
      }));

      await withRetry(() => ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: 'ideation_updated',
        action_description: `updated notes "${instance.title}"`,
        entity_type: 'ideation',
        entity_id: instance.id
      }));

      initialContentRef.current = content;
      setHasUnsavedChanges(false);
      toast.success("Notes saved!");
      if (onSave) onSave({ ...instance, content: contentData });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(instance.id, 'notes');
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'check',
    'align', 'blockquote', 'code-block', 'link', 'image'
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {isCollaborator && (
            <>
              <Button size="sm" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} className="bg-amber-500 hover:bg-amber-600">
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="cu-card">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>{instance?.title || 'Notes'}</CardTitle>
              <CardDescription>Rich text notes for project planning</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-white">
            <style>{`
              .ql-container.ql-snow { min-height: 350px; font-size: 15px; }
              .ql-editor { min-height: 350px; padding: 16px; }
              .ql-toolbar button:hover .ql-stroke, .ql-toolbar button.ql-active .ql-stroke { stroke: #f59e0b; }
            `}</style>
            <ReactQuill
              value={content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              placeholder={isCollaborator ? "Start capturing your ideas..." : "No notes yet."}
              readOnly={!isCollaborator}
              theme="snow"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}