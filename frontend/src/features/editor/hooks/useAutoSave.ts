import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { updateDocument } from '../api/document';

export function useAutoSave(delayMs = 3000) {
  const isDirty = useEditorStore((s) => s.isDirty);
  const saving = useEditorStore((s) => s.saving);
  const setSaving = useEditorStore((s) => s.setSaving);
  const markSaved = useEditorStore((s) => s.markSaved);
  const documentId = useEditorStore((s) => s.documentId);
  const currentVersion = useEditorStore((s) => s.currentVersion);
  const title = useEditorStore((s) => s.title);
  const content = useEditorStore((s) => s.content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(async () => {
    if (!documentId || !content || !isDirty || saving) return;
    setSaving(true);
    try {
      const result = await updateDocument(documentId, {
        title,
        schemaVersion: content.schemaVersion,
        currentVersion,
        content,
      });
      markSaved(result.currentVersion);
    } catch (e) {
      console.error('Auto-save failed:', e);
    } finally {
      setSaving(false);
    }
  }, [documentId, content, isDirty, saving, currentVersion, title, setSaving, markSaved]);

  useEffect(() => {
    if (!isDirty || !documentId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, doSave, delayMs, documentId]);

  return { save: doSave };
}
