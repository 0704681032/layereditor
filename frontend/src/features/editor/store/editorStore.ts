import { create } from 'zustand';
import type { EditorDocumentContent, EditorLayer, Canvas, SvgLayer, ImageLayer } from '../types';
import { buildEditableTemplateFromImageLayer, getPrimaryTemplateTextLayerId } from '../data/imageTemplates';
import { ungroupSvgLayer } from '../utils/svgParser';
import {
  findLayerById,
  updateLayerInTree,
  removeLayerFromTree,
  replaceLayerInTree,
  addLayerToTree,
  toggleLayerInTree,
  moveLayerUp,
  moveLayerDown,
  bringToFront,
  sendToBack,
} from '../utils/layerTreeOperations';
import { pushHistory, canUndo as historyCanUndo, canRedo as historyCanRedo } from './history';
import type Konva from 'konva';

interface EditorState {
  documentId: number | null;
  title: string;
  currentVersion: number;
  content: EditorDocumentContent | null;
  selectedLayerIds: string[];
  isDirty: boolean;
  saving: boolean;
  zoom: number;
  offsetX: number;
  offsetY: number;
  stageRef: Konva.Stage | null;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  snapEnabled: boolean;

  setDocument: (payload: { documentId: number; title: string; currentVersion: number; content: EditorDocumentContent }) => void;
  selectLayers: (layerIds: string[]) => void;
  selectAll: () => void;
  updateContent: (content: EditorDocumentContent) => void;
  updateCanvas: (canvas: Partial<Canvas>) => void;
  addLayer: (layer: EditorLayer, parentId?: string | null, index?: number) => void;
  addLayersBatch: (layers: EditorLayer[]) => void;
  updateLayerPatch: (layerId: string, patch: Partial<EditorLayer>) => void;
  updateLayerPatchDebounced: (layerId: string, patch: Partial<EditorLayer>) => void;
  removeLayer: (layerId: string) => void;
  moveLayer: (layerId: string, parentId: string | null, index: number) => void;
  moveLayerUp: (layerId: string) => void;
  moveLayerDown: (layerId: string) => void;
  bringToFront: (layerId: string) => void;
  sendToBack: (layerId: string) => void;
  toggleLayerVisible: (layerId: string) => void;
  toggleLayerLocked: (layerId: string) => void;
  ungroupLayer: (layerId: string) => void;
  convertImageLayerToTemplate: (layerId: string) => void;
  nudgeLayers: (layerIds: string[], dx: number, dy: number) => void;
  setViewport: (zoom: number, offsetX: number, offsetY: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (containerWidth: number, containerHeight: number) => void;
  zoomTo100: () => void;
  setStageRef: (stage: Konva.Stage | null) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  markSaved: (nextVersion: number) => void;
  markDirty: () => void;
  setSaving: (saving: boolean) => void;
  reset: () => void;
}

// Debounce timer for patch history
let patchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Helper to sync history reactivity
function syncHistoryState(): Partial<EditorState> {
  return {
    canUndo: historyCanUndo(),
    canRedo: historyCanRedo(),
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  documentId: null,
  title: '',
  currentVersion: 0,
  content: null,
  selectedLayerIds: [],
  isDirty: false,
  saving: false,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  stageRef: null,
  canUndo: false,
  canRedo: false,
  showGrid: false,
  snapEnabled: true,

  setDocument: (payload) =>
    set({
      documentId: payload.documentId,
      title: payload.title,
      currentVersion: payload.currentVersion,
      content: payload.content,
      selectedLayerIds: [],
      isDirty: false,
      canUndo: false,
      canRedo: false,
    }),

  selectLayers: (layerIds) => set({ selectedLayerIds: layerIds }),

  selectAll: () => {
    const { content } = get();
    if (!content) return;
    const allIds = content.layers.map((l) => l.id);
    set({ selectedLayerIds: allIds });
  },

  updateContent: (content) => {
    const prevContent = get().content;
    if (prevContent) {
      pushHistory({ content: { ...prevContent }, selectedLayerIds: get().selectedLayerIds });
    }
    set({ content, isDirty: true, ...syncHistoryState() });
  },

  updateCanvas: (canvas) =>
    set((state) => {
      if (!state.content) return state;
      const newContent = { ...state.content, canvas: { ...state.content.canvas, ...canvas } };
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  addLayer: (layer, parentId, index) =>
    set((state) => {
      if (!state.content) return state;
      const newLayers = addLayerToTree(state.content.layers, layer, parentId ?? null, index);
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: { ...state.content, layers: newLayers },
        selectedLayerIds: [layer.id],
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  addLayersBatch: (layers) =>
    set((state) => {
      if (!state.content) return state;
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      let newLayers = state.content.layers;
      const newIds: string[] = [];
      for (const layer of layers) {
        newLayers = addLayerToTree(newLayers, layer, null);
        newIds.push(layer.id);
      }
      return {
        content: { ...state.content, layers: newLayers },
        selectedLayerIds: newIds,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  updateLayerPatch: (layerId, patch) =>
    set((state) => {
      if (!state.content) return state;
      const newContent = { ...state.content, layers: updateLayerInTree(state.content.layers, layerId, patch) };
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  updateLayerPatchDebounced: (layerId, patch) => {
    // Update state immediately for responsive UI
    set((state) => {
      if (!state.content) return state;
      return {
        content: { ...state.content, layers: updateLayerInTree(state.content.layers, layerId, patch) },
        isDirty: true,
      };
    });
    // Debounce the history push
    if (patchDebounceTimer) clearTimeout(patchDebounceTimer);
    patchDebounceTimer = setTimeout(() => {
      const currentContent = get().content;
      if (currentContent) {
        pushHistory({ content: { ...currentContent }, selectedLayerIds: get().selectedLayerIds });
        set(syncHistoryState());
      }
    }, 300);
  },

  removeLayer: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: { ...state.content, layers: removeLayerFromTree(state.content.layers, layerId) },
        selectedLayerIds: state.selectedLayerIds.filter((id) => id !== layerId),
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  moveLayer: (layerId, parentId, index) =>
    set((state) => {
      if (!state.content) return state;
      const layer = findLayerById(state.content.layers, layerId);
      if (!layer) return state;
      let newLayers = removeLayerFromTree(state.content.layers, layerId);
      newLayers = addLayerToTree(newLayers, layer, parentId, index);
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: { ...state.content, layers: newLayers },
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  moveLayerUp: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      const newLayers = moveLayerUp(state.content.layers, layerId);
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: { ...state.content, layers: newLayers },
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  moveLayerDown: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      const newLayers = moveLayerDown(state.content.layers, layerId);
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: { ...state.content, layers: newLayers },
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  bringToFront: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      const newLayers = bringToFront(state.content.layers, layerId);
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: { ...state.content, layers: newLayers },
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  sendToBack: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      const newLayers = sendToBack(state.content.layers, layerId);
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: { ...state.content, layers: newLayers },
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  toggleLayerVisible: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: { ...state.content, layers: toggleLayerInTree(state.content.layers, layerId, 'visible') },
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  toggleLayerLocked: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      return {
        content: { ...state.content, layers: toggleLayerInTree(state.content.layers, layerId, 'locked') },
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  ungroupLayer: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      const layer = findLayerById(state.content.layers, layerId);
      if (!layer || layer.type !== 'svg') return state;

      const ungrouped = ungroupSvgLayer(layer as SvgLayer);
      if (!ungrouped) return state;

      const newSelectedIds = ungrouped.type === 'group'
        ? ungrouped.children.map(c => c.id)
        : [ungrouped.id];

      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });

      return {
        content: { ...state.content, layers: replaceLayerInTree(state.content.layers, layerId, [ungrouped]) },
        selectedLayerIds: newSelectedIds,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  convertImageLayerToTemplate: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      const layer = findLayerById(state.content.layers, layerId);
      if (!layer || layer.type !== 'image') return state;

      const template = buildEditableTemplateFromImageLayer(layer as ImageLayer);
      if (!template) return state;

      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });

      return {
        content: { ...state.content, layers: replaceLayerInTree(state.content.layers, layerId, [template]) },
        selectedLayerIds: [getPrimaryTemplateTextLayerId(template)],
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  nudgeLayers: (layerIds, dx, dy) =>
    set((state) => {
      if (!state.content) return state;
      pushHistory({ content: { ...state.content }, selectedLayerIds: state.selectedLayerIds });
      let newLayers = state.content.layers;
      for (const id of layerIds) {
        const layer = findLayerById(newLayers, id);
        if (layer && !layer.locked) {
          newLayers = updateLayerInTree(newLayers, id, {
            x: (layer.x ?? 0) + dx,
            y: (layer.y ?? 0) + dy,
          });
        }
      }
      return {
        content: { ...state.content, layers: newLayers },
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  setViewport: (zoom, offsetX, offsetY) => set({ zoom, offsetX, offsetY }),

  zoomIn: () => {
    const { zoom, offsetX, offsetY } = get();
    const newZoom = Math.min(5, zoom * 1.2);
    set({ zoom: newZoom });
  },

  zoomOut: () => {
    const { zoom } = get();
    const newZoom = Math.max(0.1, zoom / 1.2);
    set({ zoom: newZoom });
  },

  zoomToFit: (containerWidth, containerHeight) => {
    const { content } = get();
    if (!content) return;
    const padding = 60;
    const scaleX = (containerWidth - padding * 2) / content.canvas.width;
    const scaleY = (containerHeight - padding * 2) / content.canvas.height;
    const newZoom = Math.min(scaleX, scaleY, 2);
    const newOffsetX = (containerWidth - content.canvas.width * newZoom) / 2;
    const newOffsetY = (containerHeight - content.canvas.height * newZoom) / 2;
    set({ zoom: newZoom, offsetX: newOffsetX, offsetY: newOffsetY });
  },

  zoomTo100: () => {
    set({ zoom: 1, offsetX: 0, offsetY: 0 });
  },

  setStageRef: (stage) => set({ stageRef: stage }),

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  markSaved: (nextVersion) => set({ currentVersion: nextVersion, isDirty: false }),

  markDirty: () => set({ isDirty: true }),

  setSaving: (saving) => set({ saving }),

  reset: () =>
    set({
      documentId: null,
      title: '',
      currentVersion: 0,
      content: null,
      selectedLayerIds: [],
      isDirty: false,
      saving: false,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      stageRef: null,
      canUndo: false,
      canRedo: false,
      showGrid: false,
      snapEnabled: true,
    }),
}));

// Export findLayerById for other modules
export { findLayerById };
