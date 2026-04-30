import type { EditorLayer } from '../../types';
import type { GuideLine } from '../../components/canvas/SmartGuides';
import { pushHistory } from '../history';

// pushHistory is used in finishDrawing below

/**
 * 绘图模式状态管理
 * drawMode: 当前绘图工具（none/rect/ellipse/line）
 * drawPreview: 绘制过程中的实时预览区域
 */

export type DrawMode = 'none' | 'rect' | 'ellipse' | 'line';

export interface DrawingState {
  drawMode: DrawMode;
  drawPreview: { x: number; y: number; width: number; height: number } | null;
}

export interface DrawingActions {
  setDrawMode: (mode: DrawMode) => void;
  setDrawPreview: (preview: { x: number; y: number; width: number; height: number } | null) => void;
  finishDrawing: (layer: EditorLayer) => void;
}

export type DrawingSlice = DrawingState & DrawingActions;

interface SyncHistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

// 绘制完成后新操作已入栈，可撤销、不可重做
const syncHistoryState = (): SyncHistoryState => ({
  canUndo: true,
  canRedo: false,
});

export const createDrawingSlice = (set: any, get: any): DrawingSlice => ({
  drawMode: 'none',
  drawPreview: null,

  setDrawMode: (mode: DrawMode) => set({ drawMode: mode, drawPreview: null }),
  setDrawPreview: (preview: { x: number; y: number; width: number; height: number } | null) => set({ drawPreview: preview }),
  // 完成绘制：将新形状图层加入文档，推入撤销历史，切换回选择模式
  finishDrawing: (layer: EditorLayer) => {
    const content = get().content;
    if (!content) return;
    const newLayers = [...content.layers, layer];
    const newContent = { ...content, layers: newLayers };
    pushHistory({ content: newContent, selectedLayerIds: [layer.id] });
    set({
      content: newContent,
      selectedLayerIds: [layer.id],
      drawMode: 'none',
      drawPreview: null,
      isDirty: true,
      canUndo: true,
      canRedo: false,
    });
  },
});