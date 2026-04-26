import type { Canvas, EditorLayer } from '../types';
import { parseSvgElements, convertSvgElementsToLayers } from './svgParser';
import { parseSketchFile } from './sketchParser';
import { createLayerFromLocalImage } from './localImageImport';
import { generateId } from './layerTree';

export type SupportedFileType = 'image' | 'svg' | 'sketch';

/**
 * Detect file type from file extension
 */
export function detectFileType(file: File): SupportedFileType {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  const mimeType = file.type;

  // Check by extension
  if (ext === 'svg' || mimeType === 'image/svg+xml') {
    return 'svg';
  }
  if (ext === 'sketch') {
    return 'sketch';
  }

  // Check by mime type for images
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  // Default to image for common image extensions
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
    return 'image';
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

/**
 * Parse an SVG file and convert to EditorLayers
 */
export async function parseSvgFile(
  file: File,
  canvas: Canvas
): Promise<{ layers: EditorLayer[]; selectedLayerIds: string[] }> {
  const svgData = await readFileAsText(file);

  // Parse SVG elements
  const elements = parseSvgElements(svgData);

  if (elements.length === 0) {
    // If no elements parsed, create an SVG layer with the raw data
    const svgLayer = {
      id: generateId(),
      type: 'svg' as const,
      name: file.name,
      x: 50,
      y: 50,
      width: Math.min(canvas.width - 100, 400),
      height: Math.min(canvas.height - 100, 300),
      svgData: svgData,
      visible: true,
      locked: false,
    };

    return {
      layers: [svgLayer],
      selectedLayerIds: [svgLayer.id],
    };
  }

  // Convert elements to layers
  const layers = convertSvgElementsToLayers(elements, 50, 50);

  // Scale to fit canvas if needed
  if (layers.length > 0) {
    const maxWidth = Math.max(canvas.width - 100, 1);
    const maxHeight = Math.max(canvas.height - 100, 1);

    // Calculate bounds of all layers
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const layer of layers) {
      const x = layer.x;
      const y = layer.y;
      const w = layer.width ?? (layer.type === 'text' ? 200 : 100);
      const h = layer.height ?? (layer.type === 'text' ? 40 : 100);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    }

    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;
    const scale = Math.min(maxWidth / totalWidth, maxHeight / totalHeight, 1);

    if (scale < 1) {
      for (const layer of layers) {
        layer.x = Math.round((layer.x - minX) * scale + 50);
        layer.y = Math.round((layer.y - minY) * scale + 50);
        if (layer.width) layer.width = Math.round(layer.width * scale);
        if (layer.height) layer.height = Math.round(layer.height * scale);
        if (layer.type === 'text' && layer.fontSize) {
          layer.fontSize = Math.max(8, Math.round(layer.fontSize * scale));
        }
      }
    }
  }

  const selectedLayerIds = layers.length > 0 ? [layers[0].id] : [];

  return { layers, selectedLayerIds };
}

/**
 * Unified file parser - handles all supported file types
 */
export async function parseDesignFile(
  file: File,
  canvas: Canvas
): Promise<{ layers: EditorLayer[]; selectedLayerIds: string[] }> {
  const fileType = detectFileType(file);

  switch (fileType) {
    case 'svg':
      return parseSvgFile(file, canvas);

    case 'sketch':
      return parseSketchFile(file, canvas);

    case 'image':
      const imageResult = await createLayerFromLocalImage(file, canvas);
      return { layers: [imageResult.layer], selectedLayerIds: imageResult.selectedLayerIds };

    default:
      throw new Error(`Unsupported file type: ${file.name}`);
  }
}

/**
 * Read file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Get human-readable file type name
 */
export function getFileTypeName(fileType: SupportedFileType): string {
  switch (fileType) {
    case 'svg':
      return 'SVG';
    case 'sketch':
      return 'Sketch';
    case 'image':
      return 'Image';
    default:
      return 'Unknown';
  }
}