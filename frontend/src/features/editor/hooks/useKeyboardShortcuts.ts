import { useEffect, useCallback, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { undo, redo, canUndo, canRedo } from '../store/history';
import { generateId } from '../utils/layerTree';
import { findLayerById } from '../utils/layerTreeOperations';
import { useShallow } from 'zustand/react/shallow';
import type { EditorLayer } from '../types';

export function useKeyboardShortcuts() {
  const { content, selectedLayerIds, updateContent, removeLayers, addLayersBatch, nudgeLayers, selectLayers, selectAll,
    groupSelectedLayers, ungroupSelectedLayers
  } = useEditorStore(
    useShallow((s) => ({
      content: s.content, selectedLayerIds: s.selectedLayerIds, updateContent: s.updateContent,
      removeLayers: s.removeLayers, addLayersBatch: s.addLayersBatch, nudgeLayers: s.nudgeLayers,
      selectLayers: s.selectLayers, selectAll: s.selectAll,
      groupSelectedLayers: s.groupSelectedLayers, ungroupSelectedLayers: s.ungroupSelectedLayers,
    }))
  );

  const copiedLayersRef = useRef<EditorLayer[]>([]);

  const handleUndo = useCallback(() => {
    if (!canUndo()) return;
    const entry = undo();
    if (entry) { updateContent(entry.content); useEditorStore.getState().selectLayers(entry.selectedLayerIds); }
  }, [updateContent]);

  const handleRedo = useCallback(() => {
    if (!canRedo()) return;
    const entry = redo();
    if (entry) { updateContent(entry.content); useEditorStore.getState().selectLayers(entry.selectedLayerIds); }
  }, [updateContent]);

  const handleDelete = useCallback(() => {
    if (selectedLayerIds.length > 0) removeLayers(selectedLayerIds);
  }, [selectedLayerIds, removeLayers]);

  const handleCopy = useCallback(() => {
    if (!content || selectedLayerIds.length === 0) return;
    copiedLayersRef.current = selectedLayerIds.map((id) => findLayerById(content.layers, id)).filter(Boolean) as EditorLayer[];
  }, [content, selectedLayerIds]);

  const handlePaste = useCallback(() => {
    if (!content || copiedLayersRef.current.length === 0) return;
    const newLayers = copiedLayersRef.current.map((layer) => ({
      ...layer, id: generateId(), name: `${layer.name} (copy)`, x: layer.x + 20, y: layer.y + 20,
    }));
    addLayersBatch(newLayers);
  }, [content, addLayersBatch]);

  const handleDuplicate = useCallback(() => {
    if (!content || selectedLayerIds.length === 0) return;
    const layersToDuplicate = selectedLayerIds.map((id) => findLayerById(content.layers, id)).filter(Boolean) as EditorLayer[];
    if (layersToDuplicate.length === 0) return;
    const newLayers = layersToDuplicate.map((layer) => ({
      ...layer, id: generateId(), name: `${layer.name} (copy)`, x: layer.x + 20, y: layer.y + 20,
    }));
    addLayersBatch(newLayers);
  }, [content, selectedLayerIds, addLayersBatch]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return; }
      if (isCtrlOrMeta && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) { e.preventDefault(); handleRedo(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDelete(); return; }
      if (isCtrlOrMeta && e.key === 'c') { e.preventDefault(); handleCopy(); return; }
      if (isCtrlOrMeta && e.key === 'v') { e.preventDefault(); handlePaste(); return; }
      if (isCtrlOrMeta && e.key === 'd') { e.preventDefault(); handleDuplicate(); return; }
      if (isCtrlOrMeta && e.key === 'a') { e.preventDefault(); selectAll(); return; }
      // Ctrl+G: Group
      if (isCtrlOrMeta && e.key === 'g' && !e.shiftKey) { e.preventDefault(); groupSelectedLayers(); return; }
      // Ctrl+Shift+G: Ungroup
      if (isCtrlOrMeta && e.key === 'g' && e.shiftKey) { e.preventDefault(); ungroupSelectedLayers(); return; }
      if (isCtrlOrMeta && e.key === '0') { e.preventDefault(); useEditorStore.getState().zoomTo100(); return; }
      if (isCtrlOrMeta && e.key === '1') {
        e.preventDefault();
        const container = document.querySelector('[data-canvas-container]');
        if (container) { const rect = container.getBoundingClientRect(); useEditorStore.getState().zoomToFit(rect.width, rect.height); }
        return;
      }
      if (isCtrlOrMeta && (e.key === '=' || e.key === '+')) { e.preventDefault(); useEditorStore.getState().zoomIn(); return; }
      if (isCtrlOrMeta && e.key === '-') { e.preventDefault(); useEditorStore.getState().zoomOut(); return; }
      if (e.key === 'Escape') { selectLayers([]); return; }
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
    [handleUndo, handleRedo, handleDelete, handleCopy, handlePaste, handleDuplicate,
      selectedLayerIds, selectLayers, selectAll, nudgeLayers, groupSelectedLayers, ungroupSelectedLayers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [handleKeyDown]);

  return { canUndo, canRedo };
}
