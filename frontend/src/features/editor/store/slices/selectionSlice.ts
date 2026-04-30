import { findLayerById } from '../../utils/layerTreeOperations';

export interface SelectionState {
  selectedLayerIds: string[];
}

export interface SelectionActions {
  selectLayers: (layerIds: string[]) => void;
  selectAll: () => void;
}

export type SelectionSlice = SelectionState & SelectionActions;

export const createSelectionSlice = (set: any, get: any): SelectionSlice => ({
  selectedLayerIds: [],

  selectLayers: (layerIds: string[]) => set({ selectedLayerIds: layerIds }),
  selectAll: () => {
    const content = get().content;
    if (!content) return;
    const allIds: string[] = [];
    const collectIds = (layers: any[]) => {
      for (const layer of layers) {
        allIds.push(layer.id);
        if (layer.type === 'group' && layer.children) {
          collectIds(layer.children);
        }
      }
    };
    collectIds(content.layers);
    set({ selectedLayerIds: allIds });
  },
});