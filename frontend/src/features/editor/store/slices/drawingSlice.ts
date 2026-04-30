import type { EditorLayer } from '../../types';
import type { GuideLine } from '../../components/canvas/SmartGuides';
import { pushHistory } from '../history';

// pushHistory is used in finishDrawing below

export type DrawMode = 'none' | 'rect' | 'ellipse' | 'line';

export interface DrawingState {
  drawMode: DrawMode;
  drawPreview: { x: number; y: number; width: number; height: number } | null;
}

export interface DrawingActions {
  setDrawMode: (mode: DrawMode) => void;
  setDrawPreview: (preview: { x: number; y: number; width: number; height: number } | null) => void;
  finishDrawing: (layer: EditorLayer) => void;
}

export type DrawingSlice = DrawingState & DrawingActions;

interface SyncHistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

const syncHistoryState = (): SyncHistoryState => ({
  canUndo: true,
  canRedo: false,
});

export const createDrawingSlice = (set: any, get: any): DrawingSlice => ({
  drawMode: 'none',
  drawPreview: null,

  setDrawMode: (mode: DrawMode) => set({ drawMode: mode, drawPreview: null }),
  setDrawPreview: (preview: { x: number; y: number; width: number; height: number } | null) => set({ drawPreview: preview }),
  finishDrawing: (layer: EditorLayer) => {
    const content = get().content;
    if (!content) return;
    const newLayers = [...content.layers, layer];
    const newContent = { ...content, layers: newLayers };
    pushHistory({ content: newContent, selectedLayerIds: [layer.id] });
    set({
      content: newContent,
      selectedLayerIds: [layer.id],
      drawMode: 'none',
      drawPreview: null,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },
});