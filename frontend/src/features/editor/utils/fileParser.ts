import type { Canvas, EditorLayer } from '../types';
import { parseSvgElements, convertSvgElementsToLayers, importSvgAsImage, importSvgAsSvgLayer } from './svgParser';
import { parseSketchFile } from './sketchParser';
import { createLayerFromLocalImage } from './localImageImport';
import { generateId } from './layerTree';

export type SupportedFileType = 'image' | 'svg' | 'sketch';

export type SvgImportMode = 'auto' | 'image' | 'svg-layer' | 'editable-layers';

/**
 * Detect file type from file extension
 */
export function detectFileType(file: File): SupportedFileType {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  const mimeType = file.type;

  if (ext === 'svg' || mimeType === 'image/svg+xml') {
    return 'svg';
  }
  if (ext === 'sketch') {
    return 'sketch';
  }

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
    return 'image';
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

/**
 * Parse an SVG file - choose import mode based on complexity
 * For complex SVGs (with masks, transforms, large files), use image mode
 * For simple SVGs, try to parse as editable layers
 */
export async function parseSvgFile(
  file: File,
  canvas: Canvas,
  mode: SvgImportMode = 'auto'
): Promise<{ layers: EditorLayer[]; selectedLayerIds: string[] }> {
  const svgData = await readFileAsText(file);

  // Auto-detect best import mode based on SVG complexity
  let importMode = mode;
  if (mode === 'auto') {
    importMode = detectBestSvgImportMode(svgData);
  }

  switch (importMode) {
    case 'image':
      // Import as single image layer (best for complex SVGs)
      const imageLayer = await importSvgAsImage(svgData, 50, 50);
      if (imageLayer && imageLayer.width && imageLayer.height) {
        // Scale to fit canvas if needed
        const scale = Math.min(
          (canvas.width - 100) / imageLayer.width,
          (canvas.height - 100) / imageLayer.height,
          1
        );
        if (scale < 1) {
          imageLayer.width *= scale;
          imageLayer.height *= scale;
        }
        return { layers: [imageLayer], selectedLayerIds: [imageLayer.id] };
      }
      // Fallback to svg-layer if image import fails
      break;

    case 'svg-layer':
      // Import as SVG layer that preserves original SVG data
      const svgLayer = await importSvgAsSvgLayer(svgData, 50, 50);
      if (svgLayer && svgLayer.width && svgLayer.height) {
        const scale = Math.min(
          (canvas.width - 100) / svgLayer.width,
          (canvas.height - 100) / svgLayer.height,
          1
        );
        if (scale < 1) {
          svgLayer.width *= scale;
          svgLayer.height *= scale;
        }
        return { layers: [svgLayer], selectedLayerIds: [svgLayer.id] };
      }
      break;

    case 'editable-layers':
      // Parse as individual editable layers
      return parseSvgAsEditableLayers(svgData, canvas);
  }

  // Default fallback: try editable layers
  return parseSvgAsEditableLayers(svgData, canvas);
}

/**
 * Detect the best import mode for an SVG based on its characteristics
 */
function detectBestSvgImportMode(svgData: string): SvgImportMode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgData, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return 'image';

  // Check for complexity indicators
  const defs = svg.querySelector('defs');
  const hasDefs = defs && defs.children.length > 0;

  // Count elements
  const allElements = svg.querySelectorAll('*');
  const elementCount = allElements.length;

  // Check for masks, clipPaths, complex transforms
  const masks = svg.querySelectorAll('mask');
  const clipPaths = svg.querySelectorAll('clipPath');
  const hasComplexFeatures = masks.length > 0 || clipPaths.length > 0;

  // Check for transform matrices (indicates complex positioning)
  const transformElements = svg.querySelectorAll('[transform]');
  const hasMatrixTransforms = Array.from(transformElements).some(el => {
    const transform = el.getAttribute('transform') || '';
    return transform.includes('matrix') || transform.includes('rotate');
  });

  // If SVG is large or has complex features, use image mode
  if (elementCount > 100 || hasComplexFeatures || hasMatrixTransforms) {
    return 'image';
  }

  // If has defs but not too complex, try svg-layer
  if (hasDefs) {
    return 'svg-layer';
  }

  // Simple SVG: try editable layers
  return 'editable-layers';
}

/**
 * Parse SVG as individual editable layers
 */
async function parseSvgAsEditableLayers(
  svgData: string,
  canvas: Canvas
): Promise<{ layers: EditorLayer[]; selectedLayerIds: string[] }> {
  const elements = parseSvgElements(svgData);

  if (elements.length === 0) {
    // Fallback: create svg layer with raw data
    const svgLayer = {
      id: generateId(),
      type: 'svg' as const,
      name: 'SVG Layer',
      x: 50,
      y: 50,
      width: Math.min(canvas.width - 100, 400),
      height: Math.min(canvas.height - 100, 300),
      svgData: svgData,
      visible: true,
      locked: false,
    };

    return { layers: [svgLayer], selectedLayerIds: [svgLayer.id] };
  }

  const layers = convertSvgElementsToLayers(elements, 50, 50);

  // Scale to fit canvas if needed
  if (layers.length > 0) {
    const maxWidth = Math.max(canvas.width - 100, 1);
    const maxHeight = Math.max(canvas.height - 100, 1);

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