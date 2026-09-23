import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, ChevronLeft, Trash2, StickyNote, Check } from 'lucide-react';

const MAX_LEN = 10000;
const AUTOSAVE_DELAY = 1200;

// Retry helper — handles 429 rate-limits with backoff.
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

const stripHtml = (html = '') => html
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
  .replace(/<[^>]*>/g, '')
  .trim();

export default function SharedScratchpad({ project, currentUser, isCollaborator }) {
  const [notes, setNotes] = useState(null); // null = still loading
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null); // { title, content } of the open note
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const projectIdRef = useRef(project?.id);
  const draftRef = useRef(draft);         // latest local edits for the open note
  const baselineRef = useRef(null);       // last synced remote state of the open note
  const saveDraftRef = useRef(null);

  useEffect(() => { projectIdRef.current = project?.id; }, [project?.id]);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  // ── Load notes + one-time import of legacy note content ────────────────────
  useEffect(() => {
    if (!project?.id) return;
    let cancelled = false;
    setNotes(null);
    setSelectedId(null);
    setDraft(null);
    draftRef.current = null;
    baselineRef.current = null;

    (async () => {
      try {
        let fetched = await withRetry(() =>
          base44.entities.ProjectNote.filter({ project_id: project.id }, '-updated_date', 100)
        );
        fetched = Array.isArray(fetched) ? fetched : [];

        // One-time import: turn the retired shared scratchpad / thoughts / ideation
        // content into real individual notes. The flag is set on the project first so
        // two viewers loading at the same time don't duplicate the import.
        if (fetched.length === 0 && !project.scratchpad_metadata?.notes_migrated) {
          const scratch = (project.scratchpad_content || '').trim();
          const ideation = stripHtml(project.project_ideation || '');
          let thoughts = [];
          try {
            const r = await base44.entities.Thought.filter({ project_id: project.id });
            thoughts = Array.isArray(r) ? r : [];
          } catch (e) { /* legacy thoughts are optional */ }

          const legacy = [];
          if (scratch) legacy.push({ project_id: project.id, title: 'Quick notes', content: scratch });
          if (ideation) legacy.push({ project_id: project.id, title: 'Planning & ideation', content: ideation });
          thoughts.forEach((t) => legacy.push({
            project_id: project.id,
            title: t.title || 'Note',
            content: t.content || '',
          }));

          try {
            await base44.entities.Project.update(project.id, {
              scratchpad_metadata: { ...(project.scratchpad_metadata || {}), notes_migrated: true },
            });
          } catch (e) { /* non-fatal: import won't repeat once notes exist */ }

          if (legacy.length > 0) {
            const created = await base44.entities.ProjectNote.bulkCreate(legacy);
            if (Array.isArray(created) && created.length > 0) fetched = created;
          }
        }

        if (!cancelled) setNotes(fetched);
      } catch (e) {
        console.error('Notes load error:', e);
        if (!cancelled) setNotes([]);
      }
    })();

    return () => { cancelled = true; };
  }, [project?.id]);

  // ── Real-time sync: collaborators' note changes appear live ─────────────────
  useEffect(() => {
    const unsubscribe = base44.entities.ProjectNote.subscribe((event) => {
      const d = event.data;
      if (!d || d.project_id !== projectIdRef.current) return;
      setNotes((prev) => {
        if (!prev) return prev;
        if (event.type === 'create' && !prev.some((n) => n.id === d.id)) return [d, ...prev];
        if (event.type === 'update') return prev.map((n) => (n.id === d.id ? { ...n, ...d } : n));
        if (event.type === 'delete') return prev.filter((n) => n.id !== d.id);
        return prev;
      });
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  const selected = notes?.find((n) => n.id === selectedId) || null;
  const isDirty = !!selected
    && !!draft
    && (draft.title !== baselineRef.current?.title || draft.content !== baselineRef.current?.content);

  // Keep the open note in sync with remote edits when there are no local changes.
  useEffect(() => {
    if (!selected || !draft) return;
    const remote = { title: selected.title || '', content: selected.content || '' };
    const dirty = draft.title !== baselineRef.current?.title
      || draft.content !== baselineRef.current?.content;
    if (!dirty && (remote.title !== draft.title || remote.content !== draft.content)) {
      draftRef.current = remote;
      baselineRef.current = remote;
      setDraft(remote);
    }
  }, [selected]);

  // ── Save the open note ──────────────────────────────────────────────────────
  const saveDraft = useCallback(async () => {
    const noteId = selectedId;
    const d = draftRef.current;
    if (!noteId || !d || !isCollaborator) return;
    if (d.title === baselineRef.current?.title && d.content === baselineRef.current?.content) return;
    setIsSaving(true);
    try {
      await withRetry(() => base44.entities.ProjectNote.update(noteId, {
        title: d.title,
        content: d.content,
        updated_by_name: currentUser?.full_name || currentUser?.email,
      }));
      baselineRef.current = { ...d };
      setNotes((prev) => prev
        ? prev.map((n) => (n.id === noteId ? { ...n, title: d.title, content: d.content } : n))
        : prev);
    } catch (e) {
      console.error('Note save error:', e);
    } finally {
      setIsSaving(false);
    }
  }, [selectedId, isCollaborator, currentUser]);

  useEffect(() => { saveDraftRef.current = saveDraft; }, [saveDraft]);
  useEffect(() => () => { saveDraftRef.current?.(); }, []);

  // Debounced autosave — like Apple Notes, edits save on their own.
  useEffect(() => {
    if (!selected || !draft || !isCollaborator || !isDirty) return;
    const t = setTimeout(() => { saveDraft(); }, AUTOSAVE_DELAY);
    return () => clearTimeout(t);
  }, [draft, selected, isCollaborator, isDirty, saveDraft]);

  const openNote = (note) => {
    saveDraftRef.current?.();
    setSelectedId(note.id);
    const d = { title: note.title || '', content: note.content || '' };
    draftRef.current = d;
    baselineRef.current = d;
    setDraft(d);
  };

  const closeNote = () => {
    saveDraftRef.current?.();
    setSelectedId(null);
    setDraft(null);
    draftRef.current = null;
    baselineRef.current = null;
  };

  const setDraftField = (field, value) => {
    setDraft((prev) => {
      const next = { ...(prev || { title: '', content: '' }), [field]: value };
      draftRef.current = next;
      return next;
    });
  };

  const createNote = async () => {
    if (!isCollaborator) return;
    try {
      saveDraftRef.current?.();
      const created = await base44.entities.ProjectNote.create({
        project_id: project.id,
        title: '',
        content: '',
        created_by_email: currentUser?.email,
        created_by_name: currentUser?.full_name || currentUser?.email,
      });
      setNotes((prev) => (prev ? [created, ...prev] : [created]));
      openNote(created);
    } catch (e) {
      console.error('Create note error:', e);
    }
  };

  const deleteNote = async (id) => {
    if (!isCollaborator) return;
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((cur) => (cur === id ? null : cur)), 2500);
      return;
    }
    setConfirmDeleteId(null);
    try {
      await base44.entities.ProjectNote.delete(id);
      if (selectedId === id) closeNote();
      setNotes((prev) => (prev ? prev.filter((n) => n.id !== id) : prev));
    } catch (e) {
      console.error('Delete note error:', e);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (!notes) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
      </div>
    );
  }

  // ── Editor (one open note) ──────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="flex flex-col h-full min-h-0 gap-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <button
            onClick={closeNote}
            className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Notes
          </button>
          <div className="flex items-center gap-2">
            {isSaving ? (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving…
              </span>
            ) : isDirty ? (
              <span className="text-xs text-amber-600">Unsaved</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Check className="w-3 h-3 text-green-500" /> Saved
              </span>
            )}
            {isCollaborator && (
              <button
                onClick={() => deleteNote(selected.id)}
                className={confirmDeleteId === selected.id
                  ? 'flex items-center gap-1 text-xs font-semibold text-red-600'
                  : 'text-gray-400 hover:text-red-500'}
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmDeleteId === selected.id && 'Confirm'}
              </button>
            )}
          </div>
        </div>

        <input
          value={draft?.title || ''}
          readOnly={!isCollaborator}
          onChange={(e) => setDraftField('title', e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300/60 focus:border-purple-300"
        />
        <textarea
          value={draft?.content || ''}
          readOnly={!isCollaborator}
          onChange={(e) => setDraftField('content', e.target.value.slice(0, MAX_LEN))}
          placeholder="Start writing…"
          className="flex-1 min-h-0 w-full resize-none rounded-lg border border-gray-200 bg-amber-50/30 p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300/60 focus:border-purple-300 leading-relaxed"
        />

        <div className="flex items-center justify-between px-1 text-[11px] text-gray-400">
          <span>Edited {formatDate(selected.updated_date)}</span>
          <span>Everyone on the project sees edits live</span>
        </div>
      </div>
    );
  }

  // ── Note list ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-gray-600">
          {notes.length} note{notes.length === 1 ? '' : 's'}
        </span>
        {isCollaborator && (
          <button
            onClick={createNote}
            className="flex items-center gap-1 rounded-md bg-purple-600 px-2 py-1 text-xs font-medium text-white hover:bg-purple-700"
          >
            <Plus className="w-3.5 h-3.5" /> New Note
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
          <StickyNote className="w-8 h-8 text-purple-300" />
          <p className="text-xs">
            {isCollaborator ? 'No notes yet — create your first note.' : 'No notes yet.'}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
          {notes.map((n) => (
            <div key={n.id} className="flex items-center">
              <button
                onClick={() => openNote(n)}
                className="flex-1 min-w-0 text-left px-3 py-2.5 hover:bg-purple-50/50"
              >
                <p className="text-sm font-medium text-gray-800 truncate">
                  {n.title || 'Untitled'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {(n.content || 'No additional text').replace(/\s+/g, ' ').slice(0, 80)}
                </p>
              </button>
              <div className="pr-2.5 flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-gray-400">{formatDate(n.updated_date)}</span>
                {isCollaborator && (
                  <button
                    onClick={() => deleteNote(n.id)}
                    className={confirmDeleteId === n.id
                      ? 'text-red-600'
                      : 'text-gray-300 hover:text-red-500'}
                    title="Delete note"
                  >
                    {confirmDeleteId === n.id
                      ? <span className="text-[10px] font-semibold">Confirm</span>
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}