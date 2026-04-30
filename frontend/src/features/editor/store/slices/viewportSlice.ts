import type Konva from 'konva';

export interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  stageRef: Konva.Stage | null;
}

export interface ViewportActions {
  setViewport: (zoom: number, offsetX: number, offsetY: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (containerWidth: number, containerHeight: number) => void;
  zoomTo100: () => void;
  setStageRef: (stage: Konva.Stage | null) => void;
}

export type ViewportSlice = ViewportState & ViewportActions;

export const createViewportSlice = (set: any, get: any): ViewportSlice => ({
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  stageRef: null,

  setViewport: (zoom: number, offsetX: number, offsetY: number) => set({ zoom, offsetX, offsetY }),
  zoomIn: () => set((s: ViewportState) => ({ zoom: Math.min(s.zoom * 1.2, 5) })),
  zoomOut: () => set((s: ViewportState) => ({ zoom: Math.max(s.zoom / 1.2, 0.1) })),
  zoomToFit: (containerWidth: number, containerHeight: number) => {
    const content = get().content;
    if (!content) return;
    const { width, height } = content.canvas;
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const scale = Math.min(scaleX, scaleY, 1);
    const offsetX = (containerWidth - width * scale) / 2;
    const offsetY = (containerHeight - height * scale) / 2;
    set({ zoom: scale, offsetX, offsetY });
  },
  zoomTo100: () => set({ zoom: 1, offsetX: 0, offsetY: 0 }),
  setStageRef: (stage: Konva.Stage | null) => set({ stageRef: stage }),
});