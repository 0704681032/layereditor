import type { EditorLayer, SvgLayer, ImageLayer } from '../../types';
import {
  findLayerById,
  updateLayerInTree,
  removeLayerFromTree,
  replaceLayerInTree,
  addLayerToTree,
  toggleLayerInTree,
  moveLayerUp as moveLayerUpOp,
  moveLayerDown as moveLayerDownOp,
  bringToFront as bringToFrontOp,
  sendToBack as sendToBackOp,
} from '../../utils/layerTreeOperations';
import { ungroupSvgLayer } from '../../utils/svgParser';
import { buildEditableTemplateFromImageLayer, getPrimaryTemplateTextLayerId } from '../../data/imageTemplates';
import { pushHistory } from '../history';

export interface LayerActions {
  addLayer: (layer: EditorLayer, parentId?: string | null, index?: number) => void;
  addLayersBatch: (layers: EditorLayer[]) => void;
  updateLayerPatch: (layerId: string, patch: Partial<EditorLayer>) => void;
  updateLayerPatchDebounced: (layerId: string, patch: Partial<EditorLayer>) => void;
  removeLayer: (layerId: string) => void;
  removeLayers: (layerIds: string[]) => void;
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
  groupSelectedLayers: () => void;
  ungroupSelectedLayers: () => void;
  alignLayers: (alignment: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => void;
  distributeLayers: (direction: 'horizontal' | 'vertical') => void;
}

export type LayerSlice = LayerActions;

const syncHistoryState = () => ({
  canUndo: true,
  canRedo: false,
});

let patchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const createLayerSlice = (set: any, get: any): LayerSlice => ({
  addLayer: (layer: EditorLayer, parentId?: string | null, index?: number) =>
    set((state: any) => {
      if (!state.content) return state;
      const newLayers = addLayerToTree(state.content.layers, layer, parentId ?? null, index);
      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: [layer.id] });
      return {
        content: newContent,
        selectedLayerIds: [layer.id],
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  addLayersBatch: (layers: EditorLayer[]) =>
    set((state: any) => {
      if (!state.content) return state;
      let newLayers = state.content.layers;
      const newIds: string[] = [];
      for (const layer of layers) {
        newLayers = addLayerToTree(newLayers, layer, null);
        newIds.push(layer.id);
      }
      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: newIds });
      return {
        content: newContent,
        selectedLayerIds: newIds,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  updateLayerPatch: (layerId: string, patch: Partial<EditorLayer>) =>
    set((state: any) => {
      if (!state.content) return state;
      const newContent = { ...state.content, layers: updateLayerInTree(state.content.layers, layerId, patch) };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  updateLayerPatchDebounced: (layerId: string, patch: Partial<EditorLayer>) => {
    set((state: any) => {
      if (!state.content) return state;
      return {
        content: { ...state.content, layers: updateLayerInTree(state.content.layers, layerId, patch) },
        isDirty: true,
      };
    });
    if (patchDebounceTimer) clearTimeout(patchDebounceTimer);
    patchDebounceTimer = setTimeout(() => {
      const currentContent = get().content;
      if (currentContent) {
        pushHistory({ content: { ...currentContent }, selectedLayerIds: get().selectedLayerIds });
        set(syncHistoryState());
      }
    }, 300);
  },

  removeLayer: (layerId: string) =>
    set((state: any) => {
      if (!state.content) return state;
      const newSelectedIds = state.selectedLayerIds.filter((id: string) => id !== layerId);
      const newContent = { ...state.content, layers: removeLayerFromTree(state.content.layers, layerId) };
      pushHistory({ content: newContent, selectedLayerIds: newSelectedIds });
      return {
        content: newContent,
        selectedLayerIds: newSelectedIds,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  removeLayers: (layerIds: string[]) =>
    set((state: any) => {
      if (!state.content) return state;
      let newLayers = state.content.layers;
      for (const id of layerIds) {
        newLayers = removeLayerFromTree(newLayers, id);
      }
      const newSelectedIds = state.selectedLayerIds.filter((id: string) => !layerIds.includes(id));
      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: newSelectedIds });
      return {
        content: newContent,
        selectedLayerIds: newSelectedIds,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  moveLayer: (layerId: string, parentId: string | null, index: number) =>
    set((state: any) => {
      if (!state.content) return state;
      const layer = findLayerById(state.content.layers, layerId);
      if (!layer) return state;
      let newLayers = removeLayerFromTree(state.content.layers, layerId);
      newLayers = addLayerToTree(newLayers, layer, parentId, index);
      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  moveLayerUp: (layerId: string) =>
    set((state: any) => {
      if (!state.content) return state;
      const newLayers = moveLayerUpOp(state.content.layers, layerId);
      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  moveLayerDown: (layerId: string) =>
    set((state: any) => {
      if (!state.content) return state;
      const newLayers = moveLayerDownOp(state.content.layers, layerId);
      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  bringToFront: (layerId: string) =>
    set((state: any) => {
      if (!state.content) return state;
      const newLayers = bringToFrontOp(state.content.layers, layerId);
      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  sendToBack: (layerId: string) =>
    set((state: any) => {
      if (!state.content) return state;
      const newLayers = sendToBackOp(state.content.layers, layerId);
      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  toggleLayerVisible: (layerId: string) =>
    set((state: any) => {
      if (!state.content) return state;
      const newContent = { ...state.content, layers: toggleLayerInTree(state.content.layers, layerId, 'visible') };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  toggleLayerLocked: (layerId: string) =>
    set((state: any) => {
      if (!state.content) return state;
      const newContent = { ...state.content, layers: toggleLayerInTree(state.content.layers, layerId, 'locked') };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  ungroupLayer: (layerId: string) =>
    set((state: any) => {
      if (!state.content) return state;
      const layer = findLayerById(state.content.layers, layerId);
      if (!layer || layer.type !== 'svg') return state;

      const ungrouped = ungroupSvgLayer(layer as SvgLayer);
      if (!ungrouped) return state;

      const newSelectedIds = ungrouped.type === 'group'
        ? ungrouped.children.map(c => c.id)
        : [ungrouped.id];

      const newContent = { ...state.content, layers: replaceLayerInTree(state.content.layers, layerId, [ungrouped]) };
      pushHistory({ content: newContent, selectedLayerIds: newSelectedIds });

      return {
        content: newContent,
        selectedLayerIds: newSelectedIds,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  convertImageLayerToTemplate: (layerId: string) =>
    set((state: any) => {
      if (!state.content) return state;
      const layer = findLayerById(state.content.layers, layerId);
      if (!layer || layer.type !== 'image') return state;

      const template = buildEditableTemplateFromImageLayer(layer as ImageLayer);
      if (!template) return state;

      const newSelIds = [getPrimaryTemplateTextLayerId(template)];
      const newContent = { ...state.content, layers: replaceLayerInTree(state.content.layers, layerId, [template]) };
      pushHistory({ content: newContent, selectedLayerIds: newSelIds });

      return {
        content: newContent,
        selectedLayerIds: newSelIds,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  nudgeLayers: (layerIds: string[], dx: number, dy: number) =>
    set((state: any) => {
      if (!state.content) return state;
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
      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  groupSelectedLayers: () =>
    set((state: any) => {
      if (!state.content || state.selectedLayerIds.length < 2) return state;

      const layers = state.content.layers;
      const selectedIds = new Set(state.selectedLayerIds);

      const selectedLayers = layers.filter((l: EditorLayer) => selectedIds.has(l.id));
      const remainingLayers = layers.filter((l: EditorLayer) => !selectedIds.has(l.id));

      if (selectedLayers.length === 0) return state;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const l of selectedLayers) {
        const x = l.x;
        const y = l.y;
        const w = l.width ?? (l.type === 'text' ? 200 : 100);
        const h = l.height ?? (l.type === 'text' ? 40 : 100);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }

      const groupId = 'grp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
      const groupLayer: EditorLayer = {
        id: groupId,
        type: 'group',
        name: 'Group',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        visible: true,
        locked: false,
        children: selectedLayers.map((l: EditorLayer) => ({
          ...l,
          x: l.x - minX,
          y: l.y - minY,
        })),
      };

      const newContent = { ...state.content, layers: [...remainingLayers, groupLayer] };
      pushHistory({ content: newContent, selectedLayerIds: [groupId] });

      return {
        content: newContent,
        selectedLayerIds: [groupId],
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  ungroupSelectedLayers: () =>
    set((state: any) => {
      if (!state.content) return state;
      const groupIds = state.selectedLayerIds.filter((id: string) => {
        const layer = findLayerById(state.content!.layers, id);
        return layer?.type === 'group';
      });
      if (groupIds.length === 0) return state;

      let newLayers = state.content.layers;
      const newSelectedIds: string[] = [];

      for (const gid of groupIds) {
        const group = findLayerById(newLayers, gid);
        if (!group || group.type !== 'group') continue;

        const children = group.children!.map((child: EditorLayer) => ({
          ...child,
          x: child.x + group.x,
          y: child.y + group.y,
        }));
        newSelectedIds.push(...children.map((c: EditorLayer) => c.id));
        newLayers = replaceLayerInTree(newLayers, gid, children);
      }

      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: newSelectedIds });

      return {
        content: newContent,
        selectedLayerIds: newSelectedIds,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  alignLayers: (alignment: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') =>
    set((state: any) => {
      if (!state.content || state.selectedLayerIds.length < 2) return state;

      const layers = state.selectedLayerIds
        .map((id: string) => findLayerById(state.content!.layers, id))
        .filter(Boolean) as EditorLayer[];

      if (layers.length < 2) return state;

      let newLayers = state.content.layers;
      const bounds = layers.map((l: EditorLayer) => ({
        id: l.id,
        x: l.x,
        y: l.y,
        w: l.width ?? (l.type === 'text' ? 200 : 100),
        h: l.height ?? (l.type === 'text' ? 40 : 100),
      }));

      switch (alignment) {
        case 'left': {
          const minX = Math.min(...bounds.map((b) => b.x));
          for (const b of bounds) {
            newLayers = updateLayerInTree(newLayers, b.id, { x: minX });
          }
          break;
        }
        case 'centerH': {
          const avgCenterX = bounds.reduce((s, b) => s + b.x + b.w / 2, 0) / bounds.length;
          for (const b of bounds) {
            newLayers = updateLayerInTree(newLayers, b.id, { x: avgCenterX - b.w / 2 });
          }
          break;
        }
        case 'right': {
          const maxRight = Math.max(...bounds.map((b) => b.x + b.w));
          for (const b of bounds) {
            newLayers = updateLayerInTree(newLayers, b.id, { x: maxRight - b.w });
          }
          break;
        }
        case 'top': {
          const minY = Math.min(...bounds.map((b) => b.y));
          for (const b of bounds) {
            newLayers = updateLayerInTree(newLayers, b.id, { y: minY });
          }
          break;
        }
        case 'centerV': {
          const avgCenterY = bounds.reduce((s, b) => s + b.y + b.h / 2, 0) / bounds.length;
          for (const b of bounds) {
            newLayers = updateLayerInTree(newLayers, b.id, { y: avgCenterY - b.h / 2 });
          }
          break;
        }
        case 'bottom': {
          const maxBottom = Math.max(...bounds.map((b) => b.y + b.h));
          for (const b of bounds) {
            newLayers = updateLayerInTree(newLayers, b.id, { y: maxBottom - b.h });
          }
          break;
        }
      }

      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  distributeLayers: (direction: 'horizontal' | 'vertical') =>
    set((state: any) => {
      if (!state.content || state.selectedLayerIds.length < 3) return state;

      const layers = state.selectedLayerIds
        .map((id: string) => findLayerById(state.content!.layers, id))
        .filter(Boolean) as EditorLayer[];

      if (layers.length < 3) return state;

      let newLayers = state.content.layers;
      const bounds = layers.map((l: EditorLayer) => ({
        id: l.id,
        x: l.x,
        y: l.y,
        w: l.width ?? (l.type === 'text' ? 200 : 100),
        h: l.height ?? (l.type === 'text' ? 40 : 100),
      }));

      if (direction === 'horizontal') {
        bounds.sort((a, b) => a.x - b.x);
        const totalWidth = bounds[bounds.length - 1].x - bounds[0].x;
        const step = totalWidth / (bounds.length - 1);
        for (let i = 1; i < bounds.length - 1; i++) {
          newLayers = updateLayerInTree(newLayers, bounds[i].id, { x: bounds[0].x + step * i });
        }
      } else {
        bounds.sort((a, b) => a.y - b.y);
        const totalHeight = bounds[bounds.length - 1].y - bounds[0].y;
        const step = totalHeight / (bounds.length - 1);
        for (let i = 1; i < bounds.length - 1; i++) {
          newLayers = updateLayerInTree(newLayers, bounds[i].id, { y: bounds[0].y + step * i });
        }
      }

      const newContent = { ...state.content, layers: newLayers };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),
});