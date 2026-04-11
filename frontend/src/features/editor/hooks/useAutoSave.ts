import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { updateDocument } from '../api/document';

// Generate a small thumbnail directly from the canvas DOM element
function generateThumbnail(): string | undefined {
  try {
    const canvas = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement | null;
    if (!canvas) return undefined;
    const size = 200;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.6);
  } catch {
    return undefined;
  }
}

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
      const thumbnail = generateThumbnail();
      const result = await updateDocument(documentId, {
        title,
        schemaVersion: content.schemaVersion,
        currentVersion,
        content: { ...content, thumbnail },
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
