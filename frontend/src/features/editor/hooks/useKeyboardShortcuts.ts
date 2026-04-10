import { useEffect, useCallback, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { undo, redo, canUndo, canRedo } from '../store/history';
import { generateId } from '../utils/layerTree';
import { findLayerById } from '../utils/layerTreeOperations';
import { useShallow } from 'zustand/react/shallow';
import type { EditorLayer } from '../types';

export function useKeyboardShortcuts() {
  const { content, selectedLayerIds, updateContent, removeLayer, addLayersBatch, nudgeLayers, selectLayers, selectAll } = useEditorStore(
    useShallow((s) => ({
      content: s.content,
      selectedLayerIds: s.selectedLayerIds,
      updateContent: s.updateContent,
      removeLayer: s.removeLayer,
      addLayersBatch: s.addLayersBatch,
      nudgeLayers: s.nudgeLayers,
      selectLayers: s.selectLayers,
      selectAll: s.selectAll,
    }))
  );

  // Use ref for copied layers to persist across renders
  const copiedLayersRef = useRef<EditorLayer[]>([]);

  // Undo
  const handleUndo = useCallback(() => {
    if (!canUndo()) return;
    const entry = undo();
    if (entry) {
      updateContent(entry.content);
      useEditorStore.getState().selectLayers(entry.selectedLayerIds);
    }
  }, [updateContent]);

  // Redo
  const handleRedo = useCallback(() => {
    if (!canRedo()) return;
    const entry = redo();
    if (entry) {
      updateContent(entry.content);
      useEditorStore.getState().selectLayers(entry.selectedLayerIds);
    }
  }, [updateContent]);

  // Delete
  const handleDelete = useCallback(() => {
    if (selectedLayerIds.length > 0) {
      selectedLayerIds.forEach((id) => removeLayer(id));
    }
  }, [selectedLayerIds, removeLayer]);

  // Copy
  const handleCopy = useCallback(() => {
    if (!content || selectedLayerIds.length === 0) return;
    copiedLayersRef.current = selectedLayerIds
      .map((id) => findLayerById(content.layers, id))
      .filter(Boolean) as EditorLayer[];
  }, [content, selectedLayerIds]);

  // Paste (batched into single history entry)
  const handlePaste = useCallback(() => {
    if (!content || copiedLayersRef.current.length === 0) return;

    const newLayers = copiedLayersRef.current.map((layer) => ({
      ...layer,
      id: generateId(),
      name: `${layer.name} (copy)`,
      x: layer.x + 20,
      y: layer.y + 20,
    }));

    addLayersBatch(newLayers);
  }, [content, addLayersBatch]);

  // Duplicate (Ctrl+D)
  const handleDuplicate = useCallback(() => {
    if (!content || selectedLayerIds.length === 0) return;

    const layersToDuplicate = selectedLayerIds
      .map((id) => findLayerById(content.layers, id))
      .filter(Boolean) as EditorLayer[];

    if (layersToDuplicate.length === 0) return;

    const newLayers = layersToDuplicate.map((layer) => ({
      ...layer,
      id: generateId(),
      name: `${layer.name} (copy)`,
      x: layer.x + 20,
      y: layer.y + 20,
    }));

    addLayersBatch(newLayers);
  }, [content, selectedLayerIds, addLayersBatch]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip when in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Ctrl+Z: Undo
      if (isCtrlOrMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y: Redo
      if (isCtrlOrMeta && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete or Backspace: Delete layers
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
        return;
      }

      // Ctrl+C: Copy
      if (isCtrlOrMeta && e.key === 'c') {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Ctrl+V: Paste
      if (isCtrlOrMeta && e.key === 'v') {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Ctrl+D: Duplicate
      if (isCtrlOrMeta && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      // Ctrl+A: Select all
      if (isCtrlOrMeta && e.key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      // Ctrl+0: Reset zoom to 100%
      if (isCtrlOrMeta && e.key === '0') {
        e.preventDefault();
        useEditorStore.getState().zoomTo100();
        return;
      }

      // Ctrl+1: Fit to screen
      if (isCtrlOrMeta && e.key === '1') {
        e.preventDefault();
        const container = document.querySelector('[data-canvas-container]');
        if (container) {
          const rect = container.getBoundingClientRect();
          useEditorStore.getState().zoomToFit(rect.width, rect.height);
        }
        return;
      }

      // Ctrl+=: Zoom in
      if (isCtrlOrMeta && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        useEditorStore.getState().zoomIn();
        return;
      }

      // Ctrl+-: Zoom out
      if (isCtrlOrMeta && e.key === '-') {
        e.preventDefault();
        useEditorStore.getState().zoomOut();
        return;
      }

      // Escape: Deselect all
      if (e.key === 'Escape') {
        selectLayers([]);
        return;
      }

      // Arrow keys: Nudge layers
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedLayerIds.length === 0) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        nudgeLayers(selectedLayerIds, dx, dy);
        return;
      }
    },
    [
      handleUndo, handleRedo, handleDelete, handleCopy, handlePaste,
      handleDuplicate, selectedLayerIds, selectLayers, selectAll, nudgeLayers,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { canUndo, canRedo };
}
