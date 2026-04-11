import type { EditorLayer } from './layer';

export interface Canvas {
  width: number;
  height: number;
  background: string;
}

export interface EditorDocumentContent {
  schemaVersion: number;
  canvas: Canvas;
  viewport?: { zoom: number; offsetX: number; offsetY: number };
  layers: EditorLayer[];
  selection?: string[];
  guides?: unknown[];
  meta?: Record<string, unknown>;
  thumbnail?: string;
}

export interface EditorDocumentDetail {
  id: number;
  title: string;
  schemaVersion: number;
  currentVersion: number;
  content: EditorDocumentContent;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentListItem {
  id: number;
  title: string;
  status: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  content?: {
    canvas?: { width: number; height: number; background: string };
    layerCount?: number;
    thumbnail?: string;
  };
}

export interface DocumentUpdateResponse {
  id: number;
  currentVersion: number;
  updatedAt: string;
}
