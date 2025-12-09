import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw, AlertTriangle } from 'lucide-react';
import { Project, ActivityLog } from '@/entities/all';
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

const IdeateTab = ({ project, currentUser, isCollaborator, isProjectOwner }) => {
  const [content, setContent] = useState(project?.project_ideation || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSavedBy, setLastSavedBy] = useState(project?.project_ideation_metadata?.last_saved_by || null);
  const [lastSavedAt, setLastSavedAt] = useState(project?.project_ideation_metadata?.last_saved_at || null);
  const [isStale, setIsStale] = useState(false);
  const [staleInfo, setStaleInfo] = useState(null);
  const initialContentRef = useRef(project?.project_ideation || '');
  const contentRef = useRef(project?.project_ideation || ''); // Track current content for unmount save
  const lastRefreshTimeRef = useRef(Date.now());
  const lastKnownSaveTimeRef = useRef(project?.project_ideation_metadata?.last_saved_at || null);
  const isMountedRef = useRef(true);
  const backgroundRefreshIntervalRef = useRef(null);

  // Fetch fresh content on mount (when switching back to this tab)
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
          lastRefreshTimeRef.current = Date.now();
          
          if (freshProject.project_ideation_metadata) {
            setLastSavedBy(freshProject.project_ideation_metadata.last_saved_by);
            setLastSavedAt(freshProject.project_ideation_metadata.last_saved_at);
            lastKnownSaveTimeRef.current = freshProject.project_ideation_metadata.last_saved_at;
          }
          
          setIsStale(false);
          setStaleInfo(null);
        }
      } catch (error) {
        console.error("Error fetching fresh ideation content:", error);
        // Fall back to prop data on error
        const projectContent = project?.project_ideation || '';
        setContent(projectContent);
        contentRef.current = projectContent;
        initialContentRef.current = projectContent;
      }
    };

    fetchFreshContent();
  }, [project?.id]); // Runs on mount and when project ID changes

  const handleContentChange = (value) => {
    setContent(value);
    contentRef.current = value; // Keep ref in sync for unmount save
    setHasUnsavedChanges(value !== initialContentRef.current);
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
      // Fetch fresh project data with retry logic
      const results = await withRetry(() => Project.filter({ id: project.id }));
      const freshProject = results?.[0];
      if (freshProject && isMountedRef.current) {
        const freshContent = freshProject.project_ideation || '';
        setContent(freshContent);
        contentRef.current = freshContent;
        initialContentRef.current = freshContent;
        setHasUnsavedChanges(false);
        lastRefreshTimeRef.current = Date.now();
        
        if (freshProject.project_ideation_metadata) {
          setLastSavedBy(freshProject.project_ideation_metadata.last_saved_by);
          setLastSavedAt(freshProject.project_ideation_metadata.last_saved_at);
        }
        
        toast.success("Ideation content refreshed!");
      }
    } catch (error) {
      console.error("Error refreshing ideation content:", error);
      if (error.response?.status !== 429) {
        toast.error("Failed to refresh content. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!isCollaborator) {
      toast.error("You don't have permission to edit this project's ideation.");
      return;
    }

    setIsSaving(true);
    try {
      const metadata = {
        last_saved_by: currentUser.email,
        last_saved_by_name: currentUser.full_name || currentUser.email,
        last_saved_at: new Date().toISOString()
      };

      await Project.update(project.id, { 
        project_ideation: content,
        project_ideation_metadata: metadata
      });

      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: 'ideation_updated',
        action_description: 'updated the project ideation notes',
        entity_type: 'ideation'
      });

      initialContentRef.current = content;
      setHasUnsavedChanges(false);
      setLastSavedBy(currentUser.email);
      setLastSavedAt(metadata.last_saved_at);
      lastKnownSaveTimeRef.current = metadata.last_saved_at;
      setIsStale(false);
      setStaleInfo(null);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('projectUpdated', { 
        detail: { projectId: project.id } 
      }));

    } catch (error) {
      console.error("Error saving ideation:", error);
      toast.error("Failed to save ideation. Please try again.");
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

  // Shared save function that can be used synchronously
  const saveContentSync = (contentToSave) => {
    if (!isCollaborator || !currentUser?.email || !project?.id) return;
    if (contentToSave === initialContentRef.current) return; // No changes to save
    
    const metadata = {
      last_saved_by: currentUser.email,
      last_saved_by_name: currentUser.full_name || currentUser.email,
      last_saved_at: new Date().toISOString()
    };
    
    // Fire and forget - don't await
    Project.update(project.id, { 
      project_ideation: contentToSave,
      project_ideation_metadata: metadata
    }).then(() => {
      initialContentRef.current = contentToSave;
      if (isMountedRef.current) {
        setHasUnsavedChanges(false);
        setLastSavedBy(currentUser.email);
        setLastSavedAt(metadata.last_saved_at);
      }
    }).catch(err => {
      console.error("Auto-save failed:", err);
    });
  };

  // Store refs for cleanup function access
  const isCollaboratorRef = useRef(isCollaborator);
  const currentUserRef = useRef(currentUser);
  const projectIdRef2 = useRef(project?.id);
  
  useEffect(() => {
    isCollaboratorRef.current = isCollaborator;
    currentUserRef.current = currentUser;
    projectIdRef2.current = project?.id;
  }, [isCollaborator, currentUser, project?.id]);

  // Auto-save when leaving the tab (visibility change or unmount)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && contentRef.current !== initialContentRef.current) {
        saveContentSync(contentRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Save on unmount using refs (not stale state) - this fires when switching tabs
      if (contentRef.current !== initialContentRef.current && isCollaboratorRef.current && currentUserRef.current?.email && projectIdRef2.current) {
        const metadata = {
          last_saved_by: currentUserRef.current.email,
          last_saved_by_name: currentUserRef.current.full_name || currentUserRef.current.email,
          last_saved_at: new Date().toISOString()
        };
        
        // Fire synchronously on unmount
        Project.update(projectIdRef2.current, { 
          project_ideation: contentRef.current,
          project_ideation_metadata: metadata
        }).then(() => {
          initialContentRef.current = contentRef.current;
        }).catch(err => console.error("Auto-save on unmount failed:", err));
      }
    };
  }, []); // Empty deps - cleanup uses refs

  // Background refresh every 45 seconds to detect changes from other collaborators
  useEffect(() => {
    const checkForUpdates = async () => {
      if (!project?.id || !isMountedRef.current) return;
      
      try {
        const results = await withRetry(() => Project.filter({ id: project.id }));
        const freshProject = results?.[0];
        
        if (!freshProject || !isMountedRef.current) return;
        
        const freshMetadata = freshProject.project_ideation_metadata;
        const freshSaveTime = freshMetadata?.last_saved_at;
        
        // Check if someone else saved since our last known save
        if (freshSaveTime && freshSaveTime !== lastKnownSaveTimeRef.current) {
          const savedByOther = freshMetadata?.last_saved_by !== currentUser?.email;
          
          if (savedByOther) {
            // Someone else made changes
            if (contentRef.current !== initialContentRef.current) {
              // User has unsaved changes - show stale warning
              setIsStale(true);
              setStaleInfo({
                savedBy: freshMetadata?.last_saved_by_name || freshMetadata?.last_saved_by,
                savedAt: freshMetadata?.last_saved_at
              });
            } else {
              // No local changes - auto-update content
              const freshContent = freshProject.project_ideation || '';
              setContent(freshContent);
              contentRef.current = freshContent;
              initialContentRef.current = freshContent;
              setLastSavedBy(freshMetadata?.last_saved_by);
              setLastSavedAt(freshMetadata?.last_saved_at);
              lastKnownSaveTimeRef.current = freshSaveTime;
              setIsStale(false);
              setStaleInfo(null);
            }
          } else {
            // We saved it ourselves - update our tracking
            lastKnownSaveTimeRef.current = freshSaveTime;
          }
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      }
    };

    // Start background refresh interval
    backgroundRefreshIntervalRef.current = setInterval(checkForUpdates, 45000);
    
    // Also check on browser focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (backgroundRefreshIntervalRef.current) {
        clearInterval(backgroundRefreshIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [project?.id, currentUser?.email]);

  // Handle accepting remote changes (discard local)
  const handleAcceptRemoteChanges = async () => {
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
        lastRefreshTimeRef.current = Date.now();
        
        if (freshProject.project_ideation_metadata) {
          setLastSavedBy(freshProject.project_ideation_metadata.last_saved_by);
          setLastSavedAt(freshProject.project_ideation_metadata.last_saved_at);
          lastKnownSaveTimeRef.current = freshProject.project_ideation_metadata.last_saved_at;
        }
        
        setIsStale(false);
        setStaleInfo(null);
        toast.success("Loaded latest changes");
      }
    } catch (error) {
      console.error("Error loading remote changes:", error);
      toast.error("Failed to load changes");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle keeping local changes (will overwrite remote on next save)
  const handleKeepLocalChanges = () => {
    setIsStale(false);
    setStaleInfo(null);
    toast.info("Your changes will overwrite when you save");
  };

  return (
    <div className="space-y-4">
      <Card className="cu-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Project Ideation & Planning</CardTitle>
                <CardDescription>
                  {isCollaborator 
                    ? "Brainstorm ideas, outline plans, and organize thoughts with your team" 
                    : `View the project's ideation notes`}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
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
          {isStale && staleInfo && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {staleInfo.savedBy?.split('@')[0] || 'Someone'} made changes while you were editing
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Your unsaved changes may conflict with theirs. Choose an action:
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAcceptRemoteChanges}
                    disabled={isRefreshing}
                    className="text-xs"
                  >
                    {isRefreshing ? 'Loading...' : 'Load their changes (discard mine)'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleKeepLocalChanges}
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Keep my changes
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                  ? "Start brainstorming... What are the project goals? What steps need to be taken?"
                  : "No ideation notes have been added yet."
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

export default IdeateTab;