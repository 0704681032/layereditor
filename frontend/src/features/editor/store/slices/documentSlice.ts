import type { EditorDocumentContent, Canvas } from '../../types';
import { pushHistory, initHistory, canUndo, canRedo } from '../history';
import { cancelPendingLayerPatch } from './layerSlice';

export interface DocumentState {
  documentId: number | null;
  title: string;
  currentVersion: number;
  content: EditorDocumentContent | null;
  isDirty: boolean;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export interface DocumentActions {
  setDocument: (payload: { documentId: number; title: string; currentVersion: number; content: EditorDocumentContent }) => void;
  setContentSilent: (content: EditorDocumentContent, selectedLayerIds?: string[]) => void;
  updateContent: (content: EditorDocumentContent) => void;
  updateCanvas: (canvas: Partial<Canvas>) => void;
  markSaved: (nextVersion: number) => void;
  markDirty: () => void;
  setSaving: (saving: boolean) => void;
  reset: () => void;
}

export type DocumentSlice = DocumentState & DocumentActions;

const syncHistoryState = () => ({
  canUndo: canUndo(),
  canRedo: canRedo(),
});

export const createDocumentSlice = (set: any, get: any): DocumentSlice => ({
  documentId: null,
  title: '',
  currentVersion: 0,
  content: null,
  isDirty: false,
  saving: false,
  canUndo: false,
  canRedo: false,

  // 加载新文档：必须先取消pending的图层补丁防抖，防止旧文档的timer破坏新文档历史
  setDocument: (payload) => {
    cancelPendingLayerPatch();
    initHistory(payload.content, []);
    set({
      documentId: payload.documentId,
      title: payload.title,
      currentVersion: payload.currentVersion,
      content: payload.content,
      selectedLayerIds: [],
      isDirty: false,
      canUndo: false,
      canRedo: false,
    });
  },

  setContentSilent: (content, selectedLayerIds) =>
    set({
      content,
      selectedLayerIds: selectedLayerIds ?? get().selectedLayerIds,
      isDirty: true,
      ...syncHistoryState(),
    }),

  updateContent: (content) => {
    pushHistory({ content, selectedLayerIds: get().selectedLayerIds });
    set({ content, isDirty: true, ...syncHistoryState() });
  },

  updateCanvas: (canvas) =>
    set((state: any) => {
      if (!state.content) return state;
      const newContent = { ...state.content, canvas: { ...state.content.canvas, ...canvas } };
      pushHistory({ content: newContent, selectedLayerIds: state.selectedLayerIds });
      return {
        content: newContent,
        isDirty: true,
        ...syncHistoryState(),
      };
    }),

  markSaved: (nextVersion) => set({ currentVersion: nextVersion, isDirty: false }),
  markDirty: () => set({ isDirty: true }),
  setSaving: (saving) => set({ saving }),

  // 重置状态：同样需要取消pending的防抖操作
  reset: () => {
    cancelPendingLayerPatch();
    return set({
      documentId: null,
      title: '',
      currentVersion: 0,
      content: null,
      selectedLayerIds: [],
      isDirty: false,
      saving: false,
      canUndo: false,
      canRedo: false,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      showGrid: false,
      snapEnabled: true,
      guideLines: [],
      drawMode: 'none',
      drawPreview: null,
    });
  },