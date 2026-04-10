import type { EditorDocumentContent } from '../types';

interface HistoryEntry {
  content: EditorDocumentContent;
  selectedLayerIds: string[];
}

const MAX_HISTORY = 50;
let history: HistoryEntry[] = [];
let historyIndex = -1;

export function pushHistory(entry: HistoryEntry) {
  history = history.slice(0, historyIndex + 1);
  history.push(structuredClone(entry));
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
  historyIndex = history.length - 1;
}

export function undo(): HistoryEntry | null {
  if (historyIndex <= 0) return null;
  historyIndex--;
  return structuredClone(history[historyIndex]);
}

export function redo(): HistoryEntry | null {
  if (historyIndex >= history.length - 1) return null;
  historyIndex++;
  return structuredClone(history[historyIndex]);
}

export function canUndo(): boolean {
  return historyIndex > 0;
}

export function canRedo(): boolean {
  return historyIndex < history.length - 1;
}

export function clearHistory() {
  history = [];
  historyIndex = -1;
}
