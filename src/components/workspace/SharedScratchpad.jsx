import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2, Check, RefreshCw, Users, Save } from 'lucide-react';

const MAX_LEN = 10000;

// Retry helper matching IdeationNotes — handles 429 rate-limits with backoff.
const withRetry = async (apiCall, maxRetries = 5, baseDelay = 2000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

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

export default function SharedScratchpad({ project, currentUser, isCollaborator }) {
  const [content, setContent] = useState(project?.scratchpad_content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastSavedBy, setLastSavedBy] = useState(
    project?.scratchpad_metadata?.last_saved_by_name || project?.scratchpad_metadata?.last_saved_by || null
  );
  const [lastSavedAt, setLastSavedAt] = useState(project?.scratchpad_metadata?.last_saved_at || null);

  const contentRef = useRef(content);
  const initialContentRef = useRef(content);
  const isMountedRef = useRef(true);
  const savingRef = useRef(false);
  const projectIdRef = useRef(project?.id);
  const userEmailRef = useRef(currentUser?.email);

  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);
  useEffect(() => { projectIdRef.current = project?.id; }, [project?.id]);
  useEffect(() => { userEmailRef.current = currentUser?.email; }, [currentUser?.email]);

  // Initialize / re-sync when the project changes.
  useEffect(() => {
    const initial = project?.scratchpad_content || '';
    setContent(initial);
    contentRef.current = initial;
    initialContentRef.current = initial;
    setHasUnsavedChanges(false);
    setIsStale(false);
    setLastSavedBy(project?.scratchpad_metadata?.last_saved_by_name || project?.scratchpad_metadata?.last_saved_by || null);
    setLastSavedAt(project?.scratchpad_metadata?.last_saved_at || null);
  }, [project?.id]);

  // Real-time sync: other collaborators' edits appear live. Skipped while a
  // local save is in flight so it never clobbers the saving/saved state.
  useEffect(() => {
    if (!project?.id) return;
    const unsubscribe = base44.entities.Project.subscribe((event) => {
      if (event.type !== 'update') return;
      const data = event.data;
      if (!data || data.id !== projectIdRef.current) return;
      if (savingRef.current) return;
      const remoteBy = data.scratchpad_metadata?.last_saved_by;
      if (remoteBy && remoteBy === userEmailRef.current) return;

      const remoteContent = data.scratchpad_content || '';
      const byName = data.scratchpad_metadata?.last_saved_by_name || data.scratchpad_metadata?.last_saved_by || null;
      const at = data.scratchpad_metadata?.last_saved_at || null;

      // Local user has unsaved edits — flag stale instead of overwriting.
      if (contentRef.current !== initialContentRef.current) {
        setIsStale(true);
        setLastSavedBy(byName);
        setLastSavedAt(at);
        return;
      }
      if (remoteContent !== contentRef.current) {
        setContent(remoteContent);
        contentRef.current = remoteContent;
        initialContentRef.current = remoteContent;
        setHasUnsavedChanges(false);
      }
      setIsStale(false);
      setLastSavedBy(byName);
      setLastSavedAt(at);
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [project?.id]);

  const handleChange = (e) => {
    let val = e.target.value;
    if (val.length > MAX_LEN) val = val.slice(0, MAX_LEN);
    setContent(val);
    contentRef.current = val;
    setHasUnsavedChanges(val !== initialContentRef.current);
  };

  const handleSave = async () => {
    if (!isCollaborator || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      const metadata = {
        last_saved_by: userEmailRef.current,
        last_saved_by_name: currentUser?.full_name || userEmailRef.current,
        last_saved_at: new Date().toISOString(),
      };
      await withRetry(() => base44.entities.Project.update(projectIdRef.current, {
        scratchpad_content: contentRef.current,
        scratchpad_metadata: metadata,
      }));
      initialContentRef.current = contentRef.current;
      setHasUnsavedChanges(false);
      setIsStale(false);
      setLastSavedBy(metadata.last_saved_by_name);
      setLastSavedAt(metadata.last_saved_at);
    } catch (e) {
      console.error("SharedScratchpad save error:", e);
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
        savingRef.current = false;
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const results = await withRetry(() => base44.entities.Project.filter({ id: projectIdRef.current }));
      const fresh = results?.[0];
      if (fresh && isMountedRef.current) {
        const freshContent = fresh.scratchpad_content || '';
        setContent(freshContent);
        contentRef.current = freshContent;
        initialContentRef.current = freshContent;
        setHasUnsavedChanges(false);
        setIsStale(false);
        if (fresh.scratchpad_metadata) {
          setLastSavedBy(fresh.scratchpad_metadata.last_saved_by_name || fresh.scratchpad_metadata.last_saved_by);
          setLastSavedAt(fresh.scratchpad_metadata.last_saved_at);
        }
      }
    } catch (e) {
      console.error("SharedScratchpad refresh error:", e);
    } finally {
      if (isMountedRef.current) setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Users className="w-3.5 h-3.5 text-purple-500" />
          <span>Shared · everyone sees edits live</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isStale ? (
            <button onClick={handleRefresh} className="flex items-center gap-1 text-amber-600 hover:text-amber-700" title="Pull latest">
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Newer version</span>
            </button>
          ) : hasUnsavedChanges ? (
            <span className="text-amber-600">Unsaved changes</span>
          ) : (
            <span className="flex items-center gap-1 text-gray-400">
              <Check className="w-3 h-3 text-green-500" />
              Saved
            </span>
          )}
          {isCollaborator && hasUnsavedChanges && !isStale && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 rounded-md bg-purple-600 px-2 py-0.5 text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      <textarea
        value={content}
        onChange={handleChange}
        readOnly={!isCollaborator}
        placeholder={isCollaborator ? "Quick notes, reminders, links… everyone on this project sees what you type here." : "No scratchpad content yet."}
        className="flex-1 min-h-0 w-full resize-none rounded-lg border border-gray-200 bg-amber-50/30 p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300/60 focus:border-purple-300 leading-relaxed font-mono"
      />

      <div className="flex items-center justify-between px-1 text-[11px] text-gray-400">
        <span>{content.length.toLocaleString()} / {MAX_LEN.toLocaleString()}</span>
        {lastSavedBy && lastSavedAt && (
          <span>Last edit by {lastSavedBy.split('@')[0]} · {formatDate(lastSavedAt)}</span>
        )}
      </div>
    </div>
  );
}