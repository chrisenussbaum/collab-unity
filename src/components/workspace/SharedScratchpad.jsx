import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2, Check, RefreshCw, Users } from 'lucide-react';

const SAVE_DEBOUNCE_MS = 1200;
const MAX_LEN = 10000;

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
  const [status, setStatus] = useState('saved'); // 'saved' | 'saving' | 'stale'
  const [lastSavedBy, setLastSavedBy] = useState(project?.scratchpad_metadata?.last_saved_by_name || project?.scratchpad_metadata?.last_saved_by || null);
  const [lastSavedAt, setLastSavedAt] = useState(project?.scratchpad_metadata?.last_saved_at || null);

  const contentRef = useRef(content);
  const savedRef = useRef(content);
  const saveTimer = useRef(null);
  const projectIdRef = useRef(project?.id);
  const userEmailRef = useRef(currentUser?.email);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { savedRef.current = project?.scratchpad_content || ''; }, [project?.scratchpad_content]);
  useEffect(() => { projectIdRef.current = project?.id; }, [project?.id]);
  useEffect(() => { userEmailRef.current = currentUser?.email; }, [currentUser?.email]);

  // Initialize from project + keep in sync when project id changes
  useEffect(() => {
    const initial = project?.scratchpad_content || '';
    setContent(initial);
    savedRef.current = initial;
    setStatus('saved');
    setLastSavedBy(project?.scratchpad_metadata?.last_saved_by_name || project?.scratchpad_metadata?.last_saved_by || null);
    setLastSavedAt(project?.scratchpad_metadata?.last_saved_at || null);
  }, [project?.id]);

  const persist = useCallback(async (text) => {
    const pid = projectIdRef.current;
    if (!pid) return;
    setStatus('saving');
    try {
      const metadata = {
        last_saved_by: userEmailRef.current,
        last_saved_by_name: currentUser?.full_name || userEmailRef.current,
        last_saved_at: new Date().toISOString(),
      };
      await base44.entities.Project.update(pid, {
        scratchpad_content: text,
        scratchpad_metadata: metadata,
      });
      savedRef.current = text;
      setStatus('saved');
      setLastSavedBy(metadata.last_saved_by_name);
      setLastSavedAt(metadata.last_saved_at);
    } catch (e) {
      console.error("SharedScratchpad save error:", e);
      setStatus('stale');
    }
  }, [currentUser?.full_name]);

  // Real-time sync: subscribe to Project updates so other collaborators' edits appear instantly.
  useEffect(() => {
    if (!project?.id) return;
    const unsubscribe = base44.entities.Project.subscribe((event) => {
      if (event.type !== 'update') return;
      const data = event.data;
      if (!data || data.id !== projectIdRef.current) return;
      // Ignore our own saves (they echo back)
      const remoteBy = data.scratchpad_metadata?.last_saved_by;
      if (remoteBy && remoteBy === userEmailRef.current) return;

      const remoteContent = data.scratchpad_content || '';
      const local = contentRef.current;
      const saved = savedRef.current;

      // If the local user has unsaved edits, don't clobber them — flag as stale.
      if (local !== saved) {
        setStatus('stale');
        setLastSavedBy(data.scratchpad_metadata?.last_saved_by_name || data.scratchpad_metadata?.last_saved_by || null);
        setLastSavedAt(data.scratchpad_metadata?.last_saved_at || null);
        return;
      }
      // No pending local edits — apply the remote content directly.
      if (remoteContent !== local) {
        setContent(remoteContent);
        savedRef.current = remoteContent;
      }
      setStatus('saved');
      setLastSavedBy(data.scratchpad_metadata?.last_saved_by_name || data.scratchpad_metadata?.last_saved_by || null);
      setLastSavedAt(data.scratchpad_metadata?.last_saved_at || null);
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [project?.id]);

  const handleChange = (e) => {
    let val = e.target.value;
    if (val.length > MAX_LEN) val = val.slice(0, MAX_LEN);
    setContent(val);
    if (!isCollaborator) return;
    setStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(val), SAVE_DEBOUNCE_MS);
  };

  const handleRefresh = () => {
    // Pull the latest from the saved server value (accept remote version, discard local)
    const latest = project?.scratchpad_content || '';
    setContent(latest);
    savedRef.current = latest;
    setStatus('saved');
    setLastSavedBy(project?.scratchpad_metadata?.last_saved_by_name || project?.scratchpad_metadata?.last_saved_by || null);
    setLastSavedAt(project?.scratchpad_metadata?.last_saved_at || null);
  };

  const handleBlur = () => {
    if (!isCollaborator) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (contentRef.current !== savedRef.current) {
      persist(contentRef.current);
    }
  };

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const statusLabel = () => {
    if (status === 'saving') return 'Saving…';
    if (status === 'stale') return 'Newer version available';
    return 'Saved';
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Users className="w-3.5 h-3.5 text-purple-500" />
          <span>Shared · everyone sees edits live</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {status === 'saving' && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
          {status === 'saved' && <Check className="w-3 h-3 text-green-500" />}
          {status === 'stale' && (
            <button onClick={handleRefresh} className="flex items-center gap-1 text-amber-600 hover:text-amber-700" title="Pull latest">
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
          <span className={status === 'stale' ? 'text-amber-600' : 'text-gray-400'}>
            {statusLabel()}
          </span>
        </div>
      </div>

      <textarea
        value={content}
        onChange={handleChange}
        onBlur={handleBlur}
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