import { produceWithPatches, applyPatches, enablePatches } from 'immer';
import type { EditorDocumentContent } from '../types';

// 启用 Immer patches 功能
enablePatches();

interface HistoryEntry {
  content: EditorDocumentContent;
  selectedLayerIds: string[];
}

interface PatchHistoryEntry {
  patches: unknown[];
  inversePatches: unknown[];
  selectedLayerIds: string[];
}

const MAX_HISTORY = 50;
let history: HistoryEntry[] = [];      // 存储完整快照
let patchHistory: PatchHistoryEntry[] = []; // 存储 patches
let historyIndex = -1;
let currentContent: EditorDocumentContent | null = null;
let usePatchesMode = true;  // 使用 patches 模式以节省内存

// 记录当前状态并生成 patches
export function pushHistory(entry: HistoryEntry) {
  if (usePatchesMode && currentContent) {
    // 使用 patches 模式：只存储变化
    const [, patches, inversePatches] = produceWithPatches(currentContent, (draft) => {
      // 不需要实际修改，只是记录当前状态
      Object.assign(draft, entry.content);
    });

    patchHistory = patchHistory.slice(0, historyIndex + 1);
    patchHistory.push({
      patches: patches,
      inversePatches: inversePatches,
      selectedLayerIds: entry.selectedLayerIds,
    });

    if (patchHistory.length > MAX_HISTORY) {
      patchHistory.shift();
    }

    historyIndex = patchHistory.length - 1;
    currentContent = entry.content;
  } else {
    // 传统模式：存储完整快照
    history = history.slice(0, historyIndex + 1);
    history.push(structuredClone(entry));
    if (history.length > MAX_HISTORY) {
      history.shift();
    }
    historyIndex = history.length - 1;
  }
}

// 初始化当前内容（文档加载时调用）
export function initHistory(content: EditorDocumentContent, selectedLayerIds: string[]) {
  currentContent = content;
  history = [];
  patchHistory = [];
  historyIndex = -1;
  pushHistory({ content, selectedLayerIds });
}

export function undo(): HistoryEntry | null {
  if (historyIndex <= 0) return null;

  historyIndex--;

  if (usePatchesMode && currentContent && patchHistory.length > 0) {
    // 使用 patches 撤销
    const entry = patchHistory[historyIndex];
    currentContent = applyPatches(currentContent, entry.inversePatches as never);
    return {
      content: currentContent,
      selectedLayerIds: entry.selectedLayerIds,
    };
  } else {
    // 传统模式
    return structuredClone(history[historyIndex]);
  }
}

export function redo(): HistoryEntry | null {
  if (usePatchesMode && historyIndex >= patchHistory.length - 1) return null;
  if (!usePatchesMode && historyIndex >= history.length - 1) return null;

  historyIndex++;

  if (usePatchesMode && currentContent && patchHistory.length > 0) {
    // 使用 patches 重做
    const entry = patchHistory[historyIndex];
    currentContent = applyPatches(currentContent, entry.patches as never);
    return {
      content: currentContent,
      selectedLayerIds: entry.selectedLayerIds,
    };
  } else {
    // 传统模式
    return structuredClone(history[historyIndex]);
  }
}

export function canUndo(): boolean {
  return historyIndex > 0;
}

export function canRedo(): boolean {
  if (usePatchesMode) {
    return historyIndex < patchHistory.length - 1;
  }
  return historyIndex < history.length - 1;
}

export function clearHistory() {
  history = [];
  patchHistory = [];
  historyIndex = -1;
  currentContent = null;
}