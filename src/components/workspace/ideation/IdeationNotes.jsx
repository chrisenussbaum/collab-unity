import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StickyNote, RefreshCw, AlertTriangle, Save } from 'lucide-react';
import { Project, ActivityLog } from '@/entities/all';
import { toast } from "sonner";

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

export default function IdeationNotes({ project, currentUser, isCollaborator }) {
  const [content, setContent] = useState(project?.project_ideation || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSavedBy, setLastSavedBy] = useState(project?.project_ideation_metadata?.last_saved_by || null);
  const [lastSavedAt, setLastSavedAt] = useState(project?.project_ideation_metadata?.last_saved_at || null);
  const [isStale, setIsStale] = useState(false);
  const [staleInfo, setStaleInfo] = useState(null);
  const initialContentRef = useRef(project?.project_ideation || '');
  const contentRef = useRef(project?.project_ideation || '');
  const isMountedRef = useRef(true);

  useEffect(() => {
    const fetchFreshContent = async () => {
      if (!project?.id) return;
      try {
        const results = await withRetry(() => Project.filter({ id: project.id }));
        const freshProject = results?.[0];
        if (freshProject && isMountedRef.current) {
          const freshContent = freshProject.project_ideation || '';
          setContent(freshContent);
          contentRef.current = freshContent;
          initialContentRef.current = freshContent;
          setHasUnsavedChanges(false);
          if (freshProject.project_ideation_metadata) {
            setLastSavedBy(freshProject.project_ideation_metadata.last_saved_by);
            setLastSavedAt(freshProject.project_ideation_metadata.last_saved_at);
          }
          setIsStale(false);
          setStaleInfo(null);
        }
      } catch (error) {
        console.error("Error fetching fresh ideation content:", error);
      }
    };
    fetchFreshContent();
  }, [project?.id]);

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
      const results = await withRetry(() => Project.filter({ id: project.id }));
      const freshProject = results?.[0];
      if (freshProject && isMountedRef.current) {
        const freshContent = freshProject.project_ideation || '';
        setContent(freshContent);
        contentRef.current = freshContent;
        initialContentRef.current = freshContent;
        setHasUnsavedChanges(false);
        if (freshProject.project_ideation_metadata) {
          setLastSavedBy(freshProject.project_ideation_metadata.last_saved_by);
          setLastSavedAt(freshProject.project_ideation_metadata.last_saved_at);
        }
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
      const metadata = {
        last_saved_by: currentUser.email,
        last_saved_by_name: currentUser.full_name || currentUser.email,
        last_saved_at: new Date().toISOString()
      };
      await withRetry(() => Project.update(project.id, { 
        project_ideation: content,
        project_ideation_metadata: metadata
      }));
      await withRetry(() => ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: 'ideation_updated',
        action_description: 'updated the project ideation notes',
        entity_type: 'ideation'
      }));
      initialContentRef.current = content;
      setHasUnsavedChanges(false);
      setLastSavedBy(currentUser.email);
      setLastSavedAt(metadata.last_saved_at);
      setIsStale(false);
      toast.success("Notes saved!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const diffMins = Math.floor((Date.now() - date) / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="cu-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Rich text notes for project planning</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {isCollaborator && (
              <Button size="sm" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} className="bg-amber-500 hover:bg-amber-600">
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
        {lastSavedBy && lastSavedAt && (
          <div className="text-xs text-gray-500 mt-2">
            Last saved by {lastSavedBy.split('@')[0]} {formatDate(lastSavedAt)}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isStale && staleInfo && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {staleInfo.savedBy?.split('@')[0]} made changes
              </p>
              <p className="text-xs text-amber-600">Your changes may conflict.</p>
            </div>
          </div>
        )}
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
  );
}