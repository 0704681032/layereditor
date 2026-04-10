import type { EditorLayer } from '../types';

/**
 * 在图层树中查找指定 ID 的图层
 */
export function findLayerById(layers: EditorLayer[], id: string): EditorLayer | null {
  for (const layer of layers) {
    if (layer.id === id) return layer;
    if (layer.type === 'group' && layer.children) {
      const found = findLayerById(layer.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 在图层树中更新指定 ID 的图层属性
 */
export function updateLayerInTree(layers: EditorLayer[], id: string, patch: Partial<EditorLayer>): EditorLayer[] {
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

/**
 * 从图层树中移除指定 ID 的图层
 */
export function removeLayerFromTree(layers: EditorLayer[], id: string): EditorLayer[] {
  return layers
    .filter((layer) => layer.id !== id)
    .map((layer) => {
      if (layer.type === 'group' && layer.children) {
        return { ...layer, children: removeLayerFromTree(layer.children, id) };
      }
      return layer;
    });
}

/**
 * 替换图层树中指定 ID 的图层为新的图层列表
 */
export function replaceLayerInTree(layers: EditorLayer[], id: string, replacements: EditorLayer[]): EditorLayer[] {
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

/**
 * 向图层树中添加新图层
 * @param layers 当前图层列表
 * @param layer 要添加的图层
 * @param parentId 父图层 ID（null 表示添加到根层）
 * @param index 在父图层中的位置索引
 */
export function addLayerToTree(layers: EditorLayer[], layer: EditorLayer, parentId: string | null, index?: number): EditorLayer[] {
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

/**
 * 切换图层树中指定 ID 的图层属性（visible 或 locked）
 */
export function toggleLayerInTree(layers: EditorLayer[], id: string, field: 'visible' | 'locked'): EditorLayer[] {
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

/**
 * 获取图层在图层树中的索引（相对于父图层）
 */
export function getLayerIndex(layers: EditorLayer[], layerId: string, parentId: string | null = null): number {
  if (parentId === null) {
    return layers.findIndex((l) => l.id === layerId);
  }
  const parent = findLayerById(layers, parentId);
  if (parent && parent.type === 'group') {
    return parent.children.findIndex((c) => c.id === layerId);
  }
  return -1;
}

/**
 * 获取图层的父图层 ID
 */
export function getParentId(layers: EditorLayer[], layerId: string): string | null {
  for (const layer of layers) {
    if (layer.type === 'group' && layer.children) {
      if (layer.children.some((c) => c.id === layerId)) {
        return layer.id;
      }
      const found = getParentId(layer.children, layerId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 上移图层（在同一父图层内）
 */
export function moveLayerUp(layers: EditorLayer[], layerId: string): EditorLayer[] {
  const parentId = getParentId(layers, layerId);
  const parentChildren = parentId === null
    ? layers
    : (findLayerById(layers, parentId) as { children: EditorLayer[] }).children;

  const currentIndex = parentChildren.findIndex((l) => l.id === layerId);
  if (currentIndex <= 0) return layers;

  const newChildren = [...parentChildren];
  [newChildren[currentIndex - 1], newChildren[currentIndex]] = [newChildren[currentIndex], newChildren[currentIndex - 1]];

  if (parentId === null) {
    return newChildren;
  }
  return updateLayerInTree(layers, parentId, { children: newChildren } as Partial<EditorLayer>);
}

/**
 * 下移图层（在同一父图层内）
 */
export function moveLayerDown(layers: EditorLayer[], layerId: string): EditorLayer[] {
  const parentId = getParentId(layers, layerId);
  const parentChildren = parentId === null
    ? layers
    : (findLayerById(layers, parentId) as { children: EditorLayer[] }).children;

  const currentIndex = parentChildren.findIndex((l) => l.id === layerId);
  if (currentIndex >= parentChildren.length - 1) return layers;

  const newChildren = [...parentChildren];
  [newChildren[currentIndex], newChildren[currentIndex + 1]] = [newChildren[currentIndex + 1], newChildren[currentIndex]];

  if (parentId === null) {
    return newChildren;
  }
  return updateLayerInTree(layers, parentId, { children: newChildren } as Partial<EditorLayer>);
}

/**
 * 将图层移到最顶层
 */
export function bringToFront(layers: EditorLayer[], layerId: string): EditorLayer[] {
  const parentId = getParentId(layers, layerId);
  const parentChildren = parentId === null
    ? layers
    : (findLayerById(layers, parentId) as { children: EditorLayer[] }).children;

  const currentIndex = parentChildren.findIndex((l) => l.id === layerId);
  if (currentIndex === parentChildren.length - 1) return layers;

  const layer = parentChildren[currentIndex];
  const newChildren = [...parentChildren.filter((l) => l.id !== layerId), layer];

  if (parentId === null) {
    return newChildren;
  }
  return updateLayerInTree(layers, parentId, { children: newChildren } as Partial<EditorLayer>);
}

/**
 * 将图层移到最底层
 */
export function sendToBack(layers: EditorLayer[], layerId: string): EditorLayer[] {
  const parentId = getParentId(layers, layerId);
  const parentChildren = parentId === null
    ? layers
    : (findLayerById(layers, parentId) as { children: EditorLayer[] }).children;

  const currentIndex = parentChildren.findIndex((l) => l.id === layerId);
  if (currentIndex === 0) return layers;

  const layer = parentChildren[currentIndex];
  const newChildren = [layer, ...parentChildren.filter((l) => l.id !== layerId)];

  if (parentId === null) {
    return newChildren;
  }
  return updateLayerInTree(layers, parentId, { children: newChildren } as Partial<EditorLayer>);
}