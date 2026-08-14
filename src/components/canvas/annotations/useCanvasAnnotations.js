import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Loads, creates, updates and deletes canvas annotations for a project,
// kept in sync across collaborators via entity subscriptions.
export function useCanvasAnnotations(projectId, currentUser, readOnly) {
  const [annotations, setAnnotations] = useState([]);
  const pendingUpdates = useRef({});

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const list = await base44.entities.CanvasAnnotation.filter(
          { project_id: projectId },
          "-created_date",
          500
        );
        if (!cancelled && Array.isArray(list)) setAnnotations(list);
      } catch (e) {
        console.warn("Failed to load canvas annotations", e);
      }
    };
    load();

    let unsub = null;
    try {
      unsub = base44.entities.CanvasAnnotation.subscribe((event) => {
        const a = event && event.data;
        if (!a || a.project_id !== projectId) return;
        setAnnotations((prev) => {
          if (event.type === "create") {
            if (prev.some((x) => x.id === a.id)) return prev;
            return [...prev, a];
          }
          if (event.type === "update") {
            return prev.map((x) => (x.id === a.id ? { ...x, ...a } : x));
          }
          if (event.type === "delete") {
            return prev.filter((x) => x.id !== a.id);
          }
          return prev;
        });
      });
    } catch (e) {
      /* subscription optional */
    }

    return () => {
      cancelled = true;
      try { unsub && unsub(); } catch (e) { /* ignore */ }
    };
  }, [projectId]);

  const createAnno = useCallback(async (payload) => {
    if (!projectId || readOnly) return null;
    const record = {
      project_id: projectId,
      type: payload.type,
      data: payload.data,
      x: payload.x,
      y: payload.y,
      width: payload.width,
      height: payload.height,
      z: payload.z ?? Date.now(),
      created_by_email: currentUser?.email || "",
      created_by_name: currentUser?.full_name || "",
    };
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const temp = { ...record, id: tempId };
    setAnnotations((prev) => [...prev, temp]);
    try {
      const created = await base44.entities.CanvasAnnotation.create(record);
      setAnnotations((prev) => {
        const without = prev.filter((a) => a.id !== tempId);
        return without.some((a) => a.id === created.id) ? without : [...without, created];
      });
      return created;
    } catch (e) {
      setAnnotations((prev) => prev.filter((a) => a.id !== tempId));
      console.warn("Failed to create canvas annotation", e);
      return null;
    }
  }, [projectId, readOnly, currentUser]);

  const updateAnno = useCallback((id, patch) => {
    if (readOnly || !id || String(id).startsWith("tmp_")) return;
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    const existing = pendingUpdates.current[id];
    if (existing) clearTimeout(existing);
    pendingUpdates.current[id] = setTimeout(async () => {
      try {
        await base44.entities.CanvasAnnotation.update(id, patch);
      } catch (e) { /* ignore */ }
      delete pendingUpdates.current[id];
    }, 400);
  }, [readOnly]);

  const deleteAnno = useCallback((id) => {
    if (readOnly || !id) return;
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    try { base44.entities.CanvasAnnotation.delete(id); } catch (e) { /* ignore */ }
  }, [readOnly]);

  return { annotations, createAnno, updateAnno, deleteAnno };
}