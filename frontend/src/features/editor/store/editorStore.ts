import { create } from 'zustand';
import type { EditorDocumentContent, EditorLayer, Canvas } from '../types';
import type Konva from 'konva';
import type { GuideLine } from '../components/canvas/SmartGuides';
import {
  createUiPreferencesSlice,
  createViewportSlice,
  createDrawingSlice,
  createSelectionSlice,
  createClipboardSlice,
  createDocumentSlice,
  createLayerSlice,
  type UiPreferencesSlice,
  type ViewportSlice,
  type DrawingSlice,
  type SelectionSlice,
  type ClipboardSlice,
  type DocumentSlice,
  type LayerSlice,
  type DrawMode,
} from './slices';
import { findLayerById } from '../utils/layerTreeOperations';

// Combined state type
export type EditorState = DocumentSlice & SelectionSlice & ClipboardSlice &
  ViewportSlice & UiPreferencesSlice & DrawingSlice & LayerSlice;

export const useEditorStore = create<EditorState>((set, get) => ({
  ...createDocumentSlice(set, get),
  ...createSelectionSlice(set, get),
  ...createClipboardSlice(set, get),
  ...createViewportSlice(set, get),
  ...createUiPreferencesSlice(set, get),
  ...createDrawingSlice(set, get),
  ...createLayerSlice(set, get),
}));

// Export types
export type { EditorDocumentContent, EditorLayer, Canvas, DrawMode, GuideLine };
export { findLayerById };