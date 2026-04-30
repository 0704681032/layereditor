import type { EditorLayer } from '../../types';
import { findLayerById, removeLayerFromTree } from '../../utils/layerTreeOperations';
import { generateId } from '../../utils/layerTree';
import { pushHistory } from '../history';

export interface ClipboardState {
  clipboard: EditorLayer[];
  hasClipboardContent: boolean;
}

export interface ClipboardActions {
  copySelectedLayers: () => void;
  cutSelectedLayers: () => void;
  pasteLayers: (position?: { x: number; y: number }) => void;
}

export type ClipboardSlice = ClipboardState & ClipboardActions;

interface SyncHistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

const syncHistoryState = (): SyncHistoryState => ({
  canUndo: true,
  canRedo: false,
});

export const createClipboardSlice = (set: any, get: any): ClipboardSlice => ({
  clipboard: [],
  hasClipboardContent: false,

  copySelectedLayers: () =>
    set((state: any) => {
      if (!state.content || state.selectedLayerIds.length === 0) return state;
      const layersToCopy = state.selectedLayerIds
        .map((id: string) => findLayerById(state.content!.layers, id))
        .filter(Boolean) as EditorLayer[];
      return {
        clipboard: layersToCopy,
        hasClipboardContent: layersToCopy.length > 0,
      };
    }),

  cutSelectedLayers: () =>
    set((state: any) => {
      if (!state.content || state.selectedLayerIds.length === 0) return state;
      const contentLayers = state.content.layers;
      const layersToCopy = state.selectedLayerIds
        .map((id: string) => findLayerById(contentLayers, id))
        .filter(Boolean) as EditorLayer[];
      let newLayers = contentLayers;
      for (const id of state.selectedLayerIds) {
        newLayers = removeLayerFromTree(newLayers, id);
      }
      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: [] });
      return {
        content: newContent,
        clipboard: layersToCopy,
        hasClipboardContent: layersToCopy.length > 0,
        selectedLayerIds: [],
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  pasteLayers: (position?: { x: number; y: number }) =>
    set((state: any) => {
      if (!state.content || state.clipboard.length === 0) return state;

      let offsetX = 20;
      let offsetY = 20;

      if (position) {
        const refLayer = state.clipboard[0];
        offsetX = position.x - refLayer.x;
        offsetY = position.y - refLayer.y;
      }

      const newLayers = state.clipboard.map((layer: EditorLayer) => ({
        ...layer,
        id: generateId(),
        name: `${layer.name} (copy)`,
        x: layer.x + offsetX,
        y: layer.y + offsetY,
        ...(layer.type === 'group' && layer.children ? {
          children: layer.children.map(child => ({
            ...child,
            id: generateId(),
            name: child.name,
            x: child.x + offsetX,
            y: child.y + offsetY,
          })),
        } : {}),
      }));

      const allLayers = [...state.content.layers, ...newLayers];
      const newSelectedIds = newLayers.map((l: EditorLayer) => l.id);
      const newContent = { ...state.content, layers: allLayers };
      pushHistory({ content: newContent, selectedLayerIds: newSelectedIds });

      return {
        content: newContent,
        selectedLayerIds: newSelectedIds,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),
});