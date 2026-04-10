import { create } from 'zustand';
import type { EditorDocumentContent, EditorLayer, Canvas, SvgLayer, ImageLayer } from '../types';
import { buildEditableTemplateFromImageLayer, getPrimaryTemplateTextLayerId } from '../data/imageTemplates';
import { ungroupSvgLayer } from '../utils/svgParser';

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

  setDocument: (payload: { documentId: number; title: string; currentVersion: number; content: EditorDocumentContent }) => void;
  selectLayers: (layerIds: string[]) => void;
  updateContent: (content: EditorDocumentContent) => void;
  updateCanvas: (canvas: Partial<Canvas>) => void;
  addLayer: (layer: EditorLayer, parentId?: string | null, index?: number) => void;
  updateLayerPatch: (layerId: string, patch: Partial<EditorLayer>) => void;
  removeLayer: (layerId: string) => void;
  moveLayer: (layerId: string, parentId: string | null, index: number) => void;
  toggleLayerVisible: (layerId: string) => void;
  toggleLayerLocked: (layerId: string) => void;
  ungroupLayer: (layerId: string) => void;
  convertImageLayerToTemplate: (layerId: string) => void;
  setViewport: (zoom: number, offsetX: number, offsetY: number) => void;
  markSaved: (nextVersion: number) => void;
  markDirty: () => void;
  setSaving: (saving: boolean) => void;
  reset: () => void;
}

function findLayerById(layers: EditorLayer[], id: string): EditorLayer | null {
  for (const layer of layers) {
    if (layer.id === id) return layer;
    if (layer.type === 'group' && layer.children) {
      const found = findLayerById(layer.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateLayerInTree(layers: EditorLayer[], id: string, patch: Partial<EditorLayer>): EditorLayer[] {
  return layers.map((layer) => {
    if (layer.id === id) {
      return { ...layer, ...patch } as EditorLayer;
    }
    if (layer.type === 'group' && layer.children) {
      return { ...layer, children: updateLayerInTree(layer.children, id, patch) } as EditorLayer;
    }
    return layer;
  });
}

function removeLayerFromTree(layers: EditorLayer[], id: string): EditorLayer[] {
  return layers
    .filter((layer) => layer.id !== id)
    .map((layer) => {
      if (layer.type === 'group' && layer.children) {
        return { ...layer, children: removeLayerFromTree(layer.children, id) };
      }
      return layer;
    });
}

function replaceLayerInTree(layers: EditorLayer[], id: string, replacements: EditorLayer[]): EditorLayer[] {
  const targetIndex = layers.findIndex((layer) => layer.id === id);
  if (targetIndex >= 0) {
    return [
      ...layers.slice(0, targetIndex),
      ...replacements,
      ...layers.slice(targetIndex + 1),
    ];
  }

  return layers.map((layer) => {
    if (layer.type === 'group' && layer.children) {
      return { ...layer, children: replaceLayerInTree(layer.children, id, replacements) };
    }
    return layer;
  });
}

function addLayerToTree(layers: EditorLayer[], layer: EditorLayer, parentId: string | null, index?: number): EditorLayer[] {
  if (parentId === null || parentId === undefined) {
    const newLayers = [...layers];
    const insertIndex = index !== undefined ? Math.min(index, newLayers.length) : newLayers.length;
    newLayers.splice(insertIndex, 0, layer);
    return newLayers;
  }
  return layers.map((l) => {
    if (l.id === parentId && l.type === 'group') {
      const children = [...l.children];
      const insertIndex = index !== undefined ? Math.min(index, children.length) : children.length;
      children.splice(insertIndex, 0, layer);
      return { ...l, children };
    }
    if (l.type === 'group' && l.children) {
      return { ...l, children: addLayerToTree(l.children, layer, parentId, index) };
    }
    return l;
  });
}

function toggleLayerInTree(layers: EditorLayer[], id: string, field: 'visible' | 'locked'): EditorLayer[] {
  return layers.map((layer) => {
    if (layer.id === id) {
      return { ...layer, [field]: !layer[field] };
    }
    if (layer.type === 'group' && layer.children) {
      return { ...layer, children: toggleLayerInTree(layer.children, id, field) };
    }
    return layer;
  });
}

export const useEditorStore = create<EditorState>((set) => ({
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

  setDocument: (payload) =>
    set({
      documentId: payload.documentId,
      title: payload.title,
      currentVersion: payload.currentVersion,
      content: payload.content,
      selectedLayerIds: [],
      isDirty: false,
    }),

  selectLayers: (layerIds) => set({ selectedLayerIds: layerIds }),

  updateContent: (content) => set((state) => ({ content, isDirty: state.isDirty || true })),

  updateCanvas: (canvas) =>
    set((state) => {
      if (!state.content) return state;
      return {
        content: { ...state.content, canvas: { ...state.content.canvas, ...canvas } },
        isDirty: true,
      };
    }),

  addLayer: (layer, parentId, index) =>
    set((state) => {
      if (!state.content) return state;
      const newLayers = addLayerToTree(state.content.layers, layer, parentId ?? null, index);
      return {
        content: { ...state.content, layers: newLayers },
        selectedLayerIds: [layer.id],
        isDirty: true,
      };
    }),

  updateLayerPatch: (layerId, patch) =>
    set((state) => {
      if (!state.content) return state;
      return {
        content: { ...state.content, layers: updateLayerInTree(state.content.layers, layerId, patch) },
        isDirty: true,
      };
    }),

  removeLayer: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      return {
        content: { ...state.content, layers: removeLayerFromTree(state.content.layers, layerId) },
        selectedLayerIds: state.selectedLayerIds.filter((id) => id !== layerId),
        isDirty: true,
      };
    }),

  moveLayer: (layerId, parentId, index) =>
    set((state) => {
      if (!state.content) return state;
      const layer = findLayerById(state.content.layers, layerId);
      if (!layer) return state;
      let newLayers = removeLayerFromTree(state.content.layers, layerId);
      newLayers = addLayerToTree(newLayers, layer, parentId, index);
      return {
        content: { ...state.content, layers: newLayers },
        isDirty: true,
      };
    }),

  toggleLayerVisible: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      return {
        content: { ...state.content, layers: toggleLayerInTree(state.content.layers, layerId, 'visible') },
        isDirty: true,
      };
    }),

  toggleLayerLocked: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      return {
        content: { ...state.content, layers: toggleLayerInTree(state.content.layers, layerId, 'locked') },
        isDirty: true,
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

      return {
        content: { ...state.content, layers: replaceLayerInTree(state.content.layers, layerId, [ungrouped]) },
        selectedLayerIds: newSelectedIds,
        isDirty: true,
      };
    }),

  convertImageLayerToTemplate: (layerId) =>
    set((state) => {
      if (!state.content) return state;
      const layer = findLayerById(state.content.layers, layerId);
      if (!layer || layer.type !== 'image') return state;

      const template = buildEditableTemplateFromImageLayer(layer as ImageLayer);
      if (!template) return state;

      return {
        content: { ...state.content, layers: replaceLayerInTree(state.content.layers, layerId, [template]) },
        selectedLayerIds: [getPrimaryTemplateTextLayerId(template)],
        isDirty: true,
      };
    }),

  setViewport: (zoom, offsetX, offsetY) => set({ zoom, offsetX, offsetY }),

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
    }),
}));

export { findLayerById };
