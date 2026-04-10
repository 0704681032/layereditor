import type { EditorLayer } from '../types';

export function generateId(): string {
  return 'layer_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

export function flattenLayers(layers: EditorLayer[]): { layer: EditorLayer; parentId: string | null; depth: number }[] {
  const result: { layer: EditorLayer; parentId: string | null; depth: number }[] = [];
  function walk(items: EditorLayer[], parentId: string | null, depth: number) {
    for (const layer of items) {
      result.push({ layer, parentId, depth });
      if (layer.type === 'group' && layer.children) {
        walk(layer.children, layer.id, depth + 1);
      }
    }
  }
  walk(layers, null, 0);
  return result;
}

export function getLayerDepth(layers: EditorLayer[], targetId: string): number {
  const flat = flattenLayers(layers);
  return flat.find((f) => f.layer.id === targetId)?.depth ?? 0;
}
