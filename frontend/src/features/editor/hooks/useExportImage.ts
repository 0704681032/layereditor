import { useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import type Konva from 'konva';
import type { EditorLayer, RectLayer, EllipseLayer, TextLayer, StarLayer as StarLayerType, PolygonLayer, LineLayer, GroupLayer } from '../types';

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'pdf' | 'svg';
export type ExportResolution = 1 | 2 | 3 | 4;

// Safe download helper - delays URL revocation to ensure download starts
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Delay revocation so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Calculate bounding box of all visible layers
function calculateContentBounds(layers: EditorLayer[]): { x: number; y: number; width: number; height: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const processLayer = (layer: EditorLayer) => {
    if (layer.visible === false) return;
    const w = layer.width ?? 0;
    const h = layer.height ?? 0;
    if (w <= 0 && h <= 0) return;
    minX = Math.min(minX, layer.x);
    minY = Math.min(minY, layer.y);
    maxX = Math.max(maxX, layer.x + w);
    maxY = Math.max(maxY, layer.y + h);
  };

  for (const layer of layers) {
    if (layer.type === 'group' && layer.children) {
      for (const child of layer.children) {
        if (child.visible === false) continue;
        processLayer({ ...child, x: layer.x + child.x, y: layer.y + child.y });
      }
    } else {
      processLayer(layer);
    }
  }

  if (minX === Infinity) return null;

  const padding = 20;
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

export function useExportImage() {
  const { stageRef, content, title } = useEditorStore(
    useShallow((s) => ({
      stageRef: s.stageRef as Konva.Stage | null,
      content: s.content,
      title: s.title,
    }))
  );

  // Helper to hide transformer during export
  const hideTransformer = (layer: Konva.Layer): (() => void) => {
    const children = layer.children as Konva.Node[];
    const transformer = children?.find((child) => child.name() === 'transformer') as Konva.Transformer | undefined;
    const wasVisible = transformer?.visible();
    if (transformer) transformer.visible(false);
    return () => {
      if (transformer && wasVisible !== undefined) transformer.visible(wasVisible);
    };
  };

  // Helper to manage stage state during export
  const setupStageForExport = (
    stage: Konva.Stage,
    exportWidth: number,
    exportHeight: number
  ): (() => void) => {
    const oldScaleX = stage.scaleX();
    const oldScaleY = stage.scaleY();
    const oldX = stage.x();
    const oldY = stage.y();
    const oldWidth = stage.width();
    const oldHeight = stage.height();

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.size({ width: exportWidth, height: exportHeight });

    return () => {
      stage.scale({ x: oldScaleX, y: oldScaleY });
      stage.position({ x: oldX, y: oldY });
      stage.size({ width: oldWidth, height: oldHeight });
    };
  };

  // Export as image (PNG, JPEG, WebP)
  const downloadImage = useCallback(
    async (
      filename?: string,
      format: 'png' | 'jpeg' | 'webp' = 'png',
      quality = 1,
      resolution: ExportResolution = 2,
      cropToContent = false
    ) => {
      if (!stageRef || !content) {
        console.error('No stage or content available');
        return false;
      }

      const stage = stageRef;
      const layer = stage.children[0] as Konva.Layer;
      if (!layer) {
        console.error('No layer found');
        return false;
      }

      // Determine export region
      let exportX = 0, exportY = 0, exportW = content.canvas.width, exportH = content.canvas.height;
      if (cropToContent) {
        const bounds = calculateContentBounds(content.layers);
        if (bounds) {
          exportX = bounds.x;
          exportY = bounds.y;
          exportW = bounds.width;
          exportH = bounds.height;
        }
      }

      const restoreTransformer = hideTransformer(layer);
      const restoreStage = setupStageForExport(stage, content.canvas.width, content.canvas.height);
      layer.batchDraw();

      try {
        const dataUrl = stage.toDataURL({
          mimeType: format === 'webp' ? 'image/webp' : `image/${format}`,
          quality,
          pixelRatio: resolution,
          x: exportX,
          y: exportY,
          width: exportW,
          height: exportH,
        });

        const blob = await fetch(dataUrl).then((res) => res.blob()).catch(() => null);
        if (!blob) {
          console.error('Failed to create blob');
          return false;
        }

        // Download
        downloadBlob(blob, `${filename || title || 'canvas'}.${format}`);
        return true;
      } finally {
        restoreStage();
        restoreTransformer();
        layer.batchDraw();
      }
    },
    [stageRef, content, title]
  );

  // Export as PDF
  const downloadPDF = useCallback(
    async (filename?: string, resolution: ExportResolution = 2, cropToContent = false) => {
      if (!stageRef || !content) {
        console.error('No stage or content available');
        return false;
      }

      const stage = stageRef;
      const layer = stage.children[0] as Konva.Layer;
      if (!layer) {
        console.error('No layer found');
        return false;
      }

      // Determine export region
      let exportX = 0, exportY = 0, exportW = content.canvas.width, exportH = content.canvas.height;
      if (cropToContent) {
        const bounds = calculateContentBounds(content.layers);
        if (bounds) {
          exportX = bounds.x;
          exportY = bounds.y;
          exportW = bounds.width;
          exportH = bounds.height;
        }
      }

      const restoreTransformer = hideTransformer(layer);
      const restoreStage = setupStageForExport(stage, content.canvas.width, content.canvas.height);
      layer.batchDraw();

      try {
        // Get canvas image as PNG data URL
        const dataUrl = stage.toDataURL({
          mimeType: 'image/png',
          quality: 1,
          pixelRatio: resolution,
          x: exportX,
          y: exportY,
          width: exportW,
          height: exportH,
        });

        // Create PDF matching export dimensions (pixels to mm: 1px ≈ 0.264583mm at 96dpi)
        const pxToMm = 25.4 / 96;
        const pdfWidth = exportW * pxToMm;
        const pdfHeight = exportH * pxToMm;

        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
          orientation: exportW > exportH ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${filename || title || 'canvas'}.pdf`);
        return true;
      } finally {
        restoreStage();
        restoreTransformer();
        layer.batchDraw();
      }
    },
    [stageRef, content, title]
  );

  // Export as SVG
  const downloadSVG = useCallback(
    async (filename?: string) => {
      if (!content) {
        console.error('No content available');
        return false;
      }

      // Build SVG from layer data
      const svgContent = buildSVGFromLayers(content.layers, content.canvas);

      // Create blob and download
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      downloadBlob(blob, `${filename || title || 'canvas'}.svg`);
      return true;
    },
    [content, title]
  );

  // Export selected layers only
  const downloadSelectedLayers = useCallback(
    async (
      filename?: string,
      format: 'png' | 'jpeg' | 'webp' = 'png',
      quality = 1,
      resolution: ExportResolution = 2
    ) => {
      if (!stageRef || !content) {
        console.error('No stage or content available');
        return false;
      }

      const selectedLayerIds = useEditorStore.getState().selectedLayerIds;
      if (selectedLayerIds.length === 0) {
        console.error('No layers selected');
        return false;
      }

      // Calculate bounding box of selected layers
      const bounds = calculateSelectedBounds(content.layers, selectedLayerIds);
      if (!bounds) {
        console.error('Could not calculate bounds');
        return false;
      }

      const stage = stageRef;
      const layer = stage.children[0] as Konva.Layer;
      if (!layer) return false;

      // Hide all non-selected layers temporarily
      const visibilityStates: Map<string, boolean> = new Map();
      layer.children?.forEach((child) => {
        if (child.id() && !selectedLayerIds.includes(child.id()) && child.name() !== 'transformer' && child.name() !== 'grid') {
          visibilityStates.set(child.id(), child.visible());
          child.visible(false);
        }
      });

      const restoreTransformer = hideTransformer(layer);

      // Set stage to export only the selected region
      const oldScaleX = stage.scaleX();
      const oldScaleY = stage.scaleY();
      const oldX = stage.x();
      const oldY = stage.y();
      const oldWidth = stage.width();
      const oldHeight = stage.height();

      stage.scale({ x: 1, y: 1 });
      stage.position({ x: -bounds.x, y: -bounds.y });
      stage.size({ width: bounds.width, height: bounds.height });
      layer.batchDraw();

      try {
        const dataUrl = stage.toDataURL({
          mimeType: format === 'webp' ? 'image/webp' : `image/${format}`,
          quality,
          pixelRatio: resolution,
          x: 0,
          y: 0,
          width: bounds.width,
          height: bounds.height,
        });

        const blob = await fetch(dataUrl).then((res) => res.blob()).catch(() => null);
        if (!blob) return false;

        downloadBlob(blob, `${filename || 'selected'}.${format}`);
        return true;
      } finally {
        // Restore all visibility
        layer.children?.forEach((child) => {
          const state = visibilityStates.get(child.id());
          if (state !== undefined) child.visible(state);
        });

        stage.scale({ x: oldScaleX, y: oldScaleY });
        stage.position({ x: oldX, y: oldY });
        stage.size({ width: oldWidth, height: oldHeight });
        restoreTransformer();
        layer.batchDraw();
      }
    },
    [stageRef, content]
  );

  // Export all layers as separate files
  const downloadAllLayersSeparately = useCallback(
    async (
      format: 'png' | 'jpeg' | 'webp' = 'png',
      quality = 1,
      resolution: ExportResolution = 1
    ) => {
      if (!stageRef || !content) {
        console.error('No stage or content available');
        return false;
      }

      const stage = stageRef;
      const layer = stage.children[0] as Konva.Layer;
      if (!layer) return false;

      // Get all layer IDs (excluding groups for simplicity)
      const flatLayers = content.layers.flatMap(l =>
        l.type === 'group' ? (l.children || []) : [l]
      );

      // Export each layer
      for (const editorLayer of flatLayers) {
        // Hide all other layers
        const visibilityStates: Map<string, boolean> = new Map();
        layer.children?.forEach((child) => {
          if (child.id() && child.id() !== editorLayer.id && child.name() !== 'transformer' && child.name() !== 'grid') {
            visibilityStates.set(child.id(), child.visible());
            child.visible(false);
          }
        });

        const restoreTransformer = hideTransformer(layer);
        const restoreStage = setupStageForExport(stage, content.canvas.width, content.canvas.height);
        layer.batchDraw();

        try {
          const dataUrl = stage.toDataURL({
            mimeType: format === 'webp' ? 'image/webp' : `image/${format}`,
            quality,
            pixelRatio: resolution,
          });

          const blob = await fetch(dataUrl).then((res) => res.blob()).catch(() => null);
          if (blob) {
            downloadBlob(blob, `${editorLayer.name.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`);
          }
        } finally {
          // Restore visibility
          layer.children?.forEach((child) => {
            const state = visibilityStates.get(child.id());
            if (state !== undefined) child.visible(state);
          });
          restoreStage();
          restoreTransformer();
          layer.batchDraw();
        }

        // Small delay between exports
        await new Promise(r => setTimeout(r, 100));
      }

      return true;
    },
    [stageRef, content]
  );

  return {
    downloadImage,
    downloadPDF,
    downloadSVG,
    downloadSelectedLayers,
    downloadAllLayersSeparately,
  };
}

// Helper function to build SVG from layers
function buildSVGFromLayers(layers: EditorLayer[], canvas: { width: number; height: number; background: string }): string {
  const svgElements: string[] = [];

  // Add background rect
  svgElements.push(`<rect x="0" y="0" width="${canvas.width}" height="${canvas.height}" fill="${canvas.background}"/>`);

  // Process each layer
  for (const layer of layers) {
    const el = layerToSVG(layer);
    if (el) svgElements.push(el);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <g id="layers">
    ${svgElements.join('\n    ')}
  </g>
</svg>`;
}

// Convert a layer to SVG element
function layerToSVG(layer: EditorLayer): string | null {
  if (!layer.visible) return null;

  const opacity = layer.opacity ?? 1;
  const rotation = layer.rotation ?? 0;
  const transform = rotation !== 0 ? `transform="rotate(${rotation} ${layer.x + (layer.width ?? 100) / 2} ${layer.y + (layer.height ?? 100) / 2})"` : '';
  const style = opacity !== 1 ? `opacity="${opacity}"` : '';

  switch (layer.type) {
    case 'rect': {
      const rect = layer as RectLayer;
      const w = rect.width ?? 100;
      const h = rect.height ?? 100;
      const fill = typeof rect.fill === 'string' ? rect.fill : '#000000';
      const stroke = rect.stroke ?? 'none';
      const strokeWidth = rect.strokeWidth ?? 0;
      const cornerRadius = rect.cornerRadius ?? 0;
      return `<rect x="${rect.x}" y="${rect.y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="${cornerRadius}" ${transform} ${style}/>`;
    }
    case 'ellipse': {
      const ellipse = layer as EllipseLayer;
      const w = ellipse.width ?? 100;
      const h = ellipse.height ?? 100;
      const rx = w / 2;
      const ry = h / 2;
      const cx = ellipse.x + rx;
      const cy = ellipse.y + ry;
      const fill = typeof ellipse.fill === 'string' ? ellipse.fill : '#000000';
      const stroke = ellipse.stroke ?? 'none';
      const strokeWidth = ellipse.strokeWidth ?? 0;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${transform} ${style}/>`;
    }
    case 'text': {
      const text = layer as TextLayer;
      const fontSize = text.fontSize ?? 24;
      const fontFamily = text.fontFamily ?? 'Arial';
      const fontWeight = text.fontWeight ?? (text.fontStyle?.includes('bold') ? 700 : 400);
      const fontStyle = text.fontStyle?.includes('italic') ? 'italic' : 'normal';
      const textDecoration = text.textDecoration ?? 'none';
      const fill = text.fill ?? '#333333';
      // Apply text transform
      let displayText = text.text;
      if (text.textTransform === 'uppercase') displayText = displayText.toUpperCase();
      else if (text.textTransform === 'lowercase') displayText = displayText.toLowerCase();
      else if (text.textTransform === 'capitalize') displayText = displayText.replace(/\b\w/g, c => c.toUpperCase());
      // Build text stroke attributes
      const textStrokeAttr = text.textStroke ? ` stroke="${text.textStroke}" stroke-width="${text.textStrokeWidth ?? 1}"` : '';
      // Build wrap attributes
      const wrapAttr = text.wrap && text.wrap !== 'none' && text.maxWidth ? ` width="${text.maxWidth}"` : '';
      return `<text x="${text.x}" y="${text.y + fontSize}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDecoration}" fill="${fill}"${textStrokeAttr}${wrapAttr} ${transform} ${style}>${escapeXML(displayText)}</text>`;
    }
    case 'line': {
      const line = layer as LineLayer;
      const w = line.width ?? 200;
      const points = line.points ?? [0, 0, w, 0];
      const stroke = line.stroke ?? '#333333';
      const strokeWidth = line.strokeWidth ?? 2;
      const absPoints = points.map((p, i) => i % 2 === 0 ? line.x + p : line.y + p);
      return `<polyline points="${absPoints.join(',')}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" ${transform} ${style}/>`;
    }
    case 'star': {
      const star = layer as StarLayerType;
      const w = star.width ?? 100;
      const h = star.height ?? 100;
      const cx = star.x + w / 2;
      const cy = star.y + h / 2;
      const numPoints = star.numPoints ?? 5;
      const outerRadius = Math.min(w, h) / 2;
      const innerRadius = outerRadius * (star.innerRadius ?? 0.4);
      const fill = typeof star.fill === 'string' ? star.fill : '#F5A623';
      const stroke = star.stroke ?? 'none';
      const strokeWidth = star.strokeWidth ?? 0;
      const points = generateStarPoints(cx, cy, numPoints, outerRadius, innerRadius);
      return `<polygon points="${points.join(',')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${transform} ${style}/>`;
    }
    case 'polygon': {
      const polygon = layer as PolygonLayer;
      const w = polygon.width ?? 100;
      const h = polygon.height ?? 100;
      const cx = polygon.x + w / 2;
      const cy = polygon.y + h / 2;
      const radius = Math.min(w, h) / 2;
      const sides = polygon.sides ?? 6;
      const fill = typeof polygon.fill === 'string' ? polygon.fill : '#4A90D9';
      const stroke = polygon.stroke ?? 'none';
      const strokeWidth = polygon.strokeWidth ?? 0;
      const points = generatePolygonPoints(cx, cy, sides, radius);
      return `<polygon points="${points.join(',')}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${transform} ${style}/>`;
    }
    case 'group': {
      const group = layer as GroupLayer;
      const childSVGs = (group.children || [])
        .map(child => {
          // Adjust child positions relative to group
          const adjustedChild = { ...child, x: child.x + group.x, y: child.y + group.y };
          return layerToSVG(adjustedChild);
        })
        .filter(Boolean)
        .join('\n    ');
      return `<g id="${layer.id}" ${transform} ${style}>\n    ${childSVGs}\n  </g>`;
    }
    case 'image': {
      // Images are complex - skip for now or embed as base64
      return null;
    }
    case 'svg': {
      // SVG layers could be embedded directly
      return null;
    }
    default:
      return null;
  }
}

// Helper to escape XML special characters
function escapeXML(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Generate star polygon points
function generateStarPoints(cx: number, cy: number, numPoints: number, outerRadius: number, innerRadius: number): number[] {
  const points: number[] = [];
  const angleStep = Math.PI / numPoints;
  for (let i = 0; i < 2 * numPoints; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * angleStep - Math.PI / 2;
    points.push(cx + radius * Math.cos(angle));
    points.push(cy + radius * Math.sin(angle));
  }
  return points;
}

// Generate regular polygon points
function generatePolygonPoints(cx: number, cy: number, sides: number, radius: number): number[] {
  const points: number[] = [];
  const angleStep = (2 * Math.PI) / sides;
  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2;
    points.push(cx + radius * Math.cos(angle));
    points.push(cy + radius * Math.sin(angle));
  }
  return points;
}

// Calculate bounding box of selected layers
function calculateSelectedBounds(layers: EditorLayer[], selectedIds: string[]): { x: number; y: number; width: number; height: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const processLayer = (layer: EditorLayer) => {
    if (!selectedIds.includes(layer.id)) return;
    const w = layer.width ?? (layer.type === 'text' ? 200 : 100);
    const h = layer.height ?? (layer.type === 'text' ? 40 : 100);
    minX = Math.min(minX, layer.x);
    minY = Math.min(minY, layer.y);
    maxX = Math.max(maxX, layer.x + w);
    maxY = Math.max(maxY, layer.y + h);
  };

  for (const layer of layers) {
    if (layer.type === 'group' && layer.children) {
      for (const child of layer.children) {
        processLayer({ ...child, x: layer.x + child.x, y: layer.y + child.y });
      }
    } else {
      processLayer(layer);
    }
  }

  if (minX === Infinity) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}