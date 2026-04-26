import { useEffect, useCallback, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { undo, redo, canUndo, canRedo } from '../store/history';
import { generateId } from '../utils/layerTree';
import { findLayerById } from '../utils/layerTreeOperations';
import { useShallow } from 'zustand/react/shallow';
import type { EditorLayer } from '../types';

// Clipboard data format for cross-document copy/paste
const CLIPBOARD_MIME_TYPE = 'application/x-layereditor-layers';

interface ClipboardData {
  layers: EditorLayer[];
  sourceCanvasWidth: number;
  sourceCanvasHeight: number;
}

export function useKeyboardShortcuts() {
  const { content, selectedLayerIds, removeLayers, addLayersBatch, nudgeLayers, selectLayers, selectAll,
    groupSelectedLayers, ungroupSelectedLayers, drawMode, setDrawMode
  } = useEditorStore(
    useShallow((s) => ({
      content: s.content, selectedLayerIds: s.selectedLayerIds,
      removeLayers: s.removeLayers, addLayersBatch: s.addLayersBatch, nudgeLayers: s.nudgeLayers,
      selectLayers: s.selectLayers, selectAll: s.selectAll,
      groupSelectedLayers: s.groupSelectedLayers, ungroupSelectedLayers: s.ungroupSelectedLayers,
      drawMode: s.drawMode, setDrawMode: s.setDrawMode,
    }))
  );

  // Internal clipboard for fallback when system clipboard is not available
  const internalClipboardRef = useRef<EditorLayer[]>([]);
  // Last mouse position on canvas for paste-at-position
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);

  // Track mouse position on canvas
  useEffect(() => {
    const canvasContainer = document.querySelector('[data-canvas-container]');
    if (!canvasContainer) return;

    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const rect = canvasContainer.getBoundingClientRect();
      lastMousePositionRef.current = {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top,
      };
    };

    canvasContainer.addEventListener('mousemove', handleMouseMove as EventListener);
    return () => canvasContainer.removeEventListener('mousemove', handleMouseMove as EventListener);
  }, []);

  const handleUndo = useCallback(() => {
    if (!canUndo()) return;
    const entry = undo();
    if (entry) { useEditorStore.getState().setContentSilent(entry.content, entry.selectedLayerIds); }
  }, []);

  const handleRedo = useCallback(() => {
    if (!canRedo()) return;
    const entry = redo();
    if (entry) { useEditorStore.getState().setContentSilent(entry.content, entry.selectedLayerIds); }
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedLayerIds.length > 0) removeLayers(selectedLayerIds);
  }, [selectedLayerIds, removeLayers]);

  // Copy layers to system clipboard (if available) and internal clipboard
  const handleCopy = useCallback(async () => {
    if (!content || selectedLayerIds.length === 0) return;
    const layersToCopy = selectedLayerIds.map((id) => findLayerById(content.layers, id)).filter(Boolean) as EditorLayer[];
    if (layersToCopy.length === 0) return;

    // Store in internal clipboard
    internalClipboardRef.current = layersToCopy;

    // Try to use system clipboard
    const clipboardData: ClipboardData = {
      layers: layersToCopy,
      sourceCanvasWidth: content.canvas.width,
      sourceCanvasHeight: content.canvas.height,
    };

    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        const blob = new Blob([JSON.stringify(clipboardData)], { type: CLIPBOARD_MIME_TYPE });
        await navigator.clipboard.write([
          new ClipboardItem({
            [CLIPBOARD_MIME_TYPE]: blob,
            'text/plain': blob, // Fallback as text
          }),
        ]);
      }
    } catch (err) {
      // System clipboard not available, internal clipboard will be used
      console.log('System clipboard not available, using internal clipboard');
    }
  }, [content, selectedLayerIds]);

  // Cut layers (copy then delete)
  const handleCut = useCallback(async () => {
    if (!content || selectedLayerIds.length === 0) return;
    await handleCopy();
    removeLayers(selectedLayerIds);
  }, [handleCopy, removeLayers, selectedLayerIds]);

  // Paste layers from clipboard
  const handlePaste = useCallback(async (pasteAtMouse?: boolean) => {
    if (!content) return;

    let layersToPaste: EditorLayer[] = [];

    // Try to read from system clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes(CLIPBOARD_MIME_TYPE)) {
            const blob = await item.getType(CLIPBOARD_MIME_TYPE);
            const text = await blob.text();
            const data: ClipboardData = JSON.parse(text);
            layersToPaste = data.layers;
            break;
          } else if (item.types.includes('text/plain')) {
            // Try to parse as JSON (fallback)
            const blob = await item.getType('text/plain');
            const text = await blob.text();
            try {
              const data: ClipboardData = JSON.parse(text);
              if (data.layers && Array.isArray(data.layers)) {
                layersToPaste = data.layers;
              }
            } catch {
              // Not our format, ignore
            }
            break;
          }
        }
      }
    } catch (err) {
      // System clipboard read failed, use internal clipboard
    }

    // Fall back to internal clipboard if system clipboard didn't work
    if (layersToPaste.length === 0) {
      layersToPaste = internalClipboardRef.current;
    }

    if (layersToPaste.length === 0) return;

    // Calculate paste position
    let offsetX = 20;
    let offsetY = 20;

    if (pasteAtMouse && lastMousePositionRef.current) {
      // Convert screen position to canvas position
      const state = useEditorStore.getState();
      const canvasX = (lastMousePositionRef.current.x - state.offsetX) / state.zoom;
      const canvasY = (lastMousePositionRef.current.y - state.offsetY) / state.zoom;
      // Use first layer's position as reference
      const refLayer = layersToPaste[0];
      offsetX = canvasX - refLayer.x;
      offsetY = canvasY - refLayer.y;
    }

    // Create new layers with new IDs
    const newLayers = layersToPaste.map((layer) => ({
      ...layer,
      id: generateId(),
      name: `${layer.name} (copy)`,
      x: layer.x + offsetX,
      y: layer.y + offsetY,
      // If it's a group, also regenerate child IDs
      ...(layer.type === 'group' && layer.children ? {
        children: layer.children.map(child => ({
          ...child,
          id: generateId(),
          name: child.name, // Keep original name for children
          x: child.x + offsetX,
          y: child.y + offsetY,
        })),
      } : {}),
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
      if (isCtrlOrMeta && e.key === 'x') { e.preventDefault(); handleCut(); return; }
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
      // Drawing mode shortcuts (only when not in text input)
      if (!isCtrlOrMeta && e.key === 'r') { setDrawMode(drawMode === 'rect' ? 'none' : 'rect'); return; }
      if (!isCtrlOrMeta && e.key === 'o') { setDrawMode(drawMode === 'ellipse' ? 'none' : 'ellipse'); return; }
      if (!isCtrlOrMeta && e.key === 'l') { setDrawMode(drawMode === 'line' ? 'none' : 'line'); return; }
      // Escape: cancel drawing mode first, then deselect
      if (e.key === 'Escape') {
        if (drawMode !== 'none') { setDrawMode('none'); return; }
        selectLayers([]);
        return;
      }
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
    [handleUndo, handleRedo, handleDelete, handleCopy, handleCut, handlePaste, handleDuplicate,
      selectedLayerIds, selectLayers, selectAll, nudgeLayers, groupSelectedLayers, ungroupSelectedLayers,
      drawMode, setDrawMode]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [handleKeyDown]);

  return { canUndo, canRedo };
}
