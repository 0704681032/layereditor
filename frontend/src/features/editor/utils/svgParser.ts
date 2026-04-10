import type { EditorLayer, TextLayer, RectLayer, SvgLayer } from '../types';
import { generateId } from './layerTree';

interface ParsedSvgElement {
  type: 'text' | 'rect' | 'circle' | 'ellipse' | 'path' | 'line' | 'polygon';
  attributes: Record<string, string>;
  content?: string;
  children?: ParsedSvgElement[];
}

// SVG gradient ID to actual color mapping
const SVG_GRADIENT_COLORS: Record<string, string> = {
  // 高端品牌海报
  'url(#bg1)': '#764ba2',
  'url(#gold)': '#FFD700',
  'url(#accent)': '#24d7ff',
  // 京东618海报
  'url(#jdBg)': '#F23D40',
  'url(#jdGold)': '#FFD54F',
  'url(#jdBlue)': '#2196F3',
  // 淘宝双十一海报
  'url(#promoBg)': '#FF6B00',
  'url(#goldGrad)': '#FFD700',
  'url(#redGrad)': '#FF3333',
  // 通用渐变
  'url(#medalGrad)': '#FFA500',
  'url(#ribbonGrad)': '#E74C3C',
  'url(#bgGrad)': '#1a1a2e',
  'url(#bar1)': '#3a7bd5',
  'url(#bar2)': '#ff5858',
  'url(#bar3)': '#96c93d',
  'url(#lineGrad)': '#ee0979',
  'url(#igBg)': '#F56040',
  'url(#g1)': '#764ba2',
  'url(#g2)': '#f5576c',
  'url(#g3)': '#00f2fe',
  'url(#g4)': '#38f9d7',
  'url(#starGlow)': '#FFD700',
  'url(#starFill)': '#FFC107',
};

// Convert SVG fill value to Konva-compatible color
function normalizeFill(fill: string | undefined): string {
  if (!fill || fill === 'none') {
    return '#e0e0e0';
  }
  // Check for gradient references
  if (fill.startsWith('url(#')) {
    return SVG_GRADIENT_COLORS[fill] || '#764ba2';
  }
  // Handle rgba with spaces
  if (fill.startsWith('rgba')) {
    return fill.replace(/\s+/g, '');
  }
  return fill;
}

/**
 * Parse SVG string and extract editable elements
 */
export function parseSvgElements(svgData: string): ParsedSvgElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgData, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return [];

  const elements: ParsedSvgElement[] = [];
  walkSvgElements(svg, elements);
  return elements;
}

function walkSvgElements(parent: Element, result: ParsedSvgElement[]) {
  for (const child of parent.children) {
    const tagName = child.tagName.toLowerCase();

    // Skip defs, style, metadata, etc.
    if (['defs', 'style', 'metadata', 'title', 'desc', 'script'].includes(tagName)) {
      continue;
    }

    const attributes = getAttributes(child);

    if (tagName === 'text' || tagName === 'tspan') {
      result.push({
        type: 'text',
        attributes,
        content: child.textContent || '',
      });
    } else if (tagName === 'rect') {
      result.push({
        type: 'rect',
        attributes,
      });
    } else if (tagName === 'circle') {
      result.push({
        type: 'circle',
        attributes,
      });
    } else if (tagName === 'ellipse') {
      result.push({
        type: 'ellipse',
        attributes,
      });
    } else if (tagName === 'path') {
      result.push({
        type: 'path',
        attributes,
      });
    } else if (tagName === 'line') {
      result.push({
        type: 'line',
        attributes,
      });
    } else if (tagName === 'polygon') {
      result.push({
        type: 'polygon',
        attributes,
      });
    } else if (tagName === 'g') {
      // Group - walk children
      walkSvgElements(child, result);
    } else {
      // Walk nested elements
      walkSvgElements(child, result);
    }
  }
}

function getAttributes(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const attr of el.attributes) {
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

/**
 * Convert parsed SVG elements to EditorLayers
 */
export function convertSvgElementsToLayers(
  elements: ParsedSvgElement[],
  baseX: number,
  baseY: number
): EditorLayer[] {
  const layers: EditorLayer[] = [];

  for (const el of elements) {
    const layer = convertElementToLayer(el, baseX, baseY);
    if (layer) {
      layers.push(layer);
    }
  }

  return layers;
}

function convertElementToLayer(
  el: ParsedSvgElement,
  baseX: number,
  baseY: number
): EditorLayer | null {
  if (el.type === 'text') {
    return createTextLayer(el, baseX, baseY);
  }
  if (el.type === 'rect') {
    return createRectLayer(el, baseX, baseY);
  }
  if (el.type === 'circle') {
    return createCircleLayer(el, baseX, baseY);
  }
  if (el.type === 'ellipse') {
    return createEllipseLayer(el, baseX, baseY);
  }
  if (el.type === 'path') {
    return createPathLayer(el, baseX, baseY);
  }
  return null;
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

function createTextLayer(el: ParsedSvgElement, baseX: number, baseY: number): TextLayer {
  const attrs = el.attributes;

  // Parse position
  let x = parseNumber(attrs.x, 0);
  let y = parseNumber(attrs.y, 0);

  // Handle relative coordinates (dx, dy)
  x += parseNumber(attrs.dx, 0);
  y += parseNumber(attrs.dy, 0);

  // Parse font properties
  const fontSize = parseNumber(attrs['font-size'], 16);
  const fontFamily = attrs['font-family'] || 'Arial';
  const numericFontWeight = parseNumber(attrs['font-weight'], 400);
  const isBold = attrs['font-weight'] === 'bold' || numericFontWeight >= 600;
  const isItalic = attrs['font-style'] === 'italic';
  const fontStyle = isBold
    ? (isItalic ? 'bold italic' : 'bold')
    : (isItalic ? 'italic' : undefined);

  // Parse fill color
  const rawFill = attrs.fill || attrs.style?.match(/fill:\s*([^;]+)/)?.[1] || '#333333';
  const fill = normalizeFill(rawFill);

  // Parse text-anchor (alignment)
  const align = attrs['text-anchor'] === 'middle' ? 'center'
    : attrs['text-anchor'] === 'end' ? 'right'
    : 'left';

  return {
    id: generateId(),
    type: 'text',
    name: `Text: "${el.content?.slice(0, 20) || ''}"`,
    x: baseX + x,
    y: baseY + y - fontSize / 2, // Adjust y for baseline
    text: el.content || '',
    fontSize,
    fontFamily: fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
    fill,
    fontStyle,
    align,
    visible: true,
    locked: false,
  };
}

function createRectLayer(el: ParsedSvgElement, baseX: number, baseY: number): RectLayer {
  const attrs = el.attributes;

  const x = parseNumber(attrs.x, 0);
  const y = parseNumber(attrs.y, 0);
  const width = parseNumber(attrs.width, 100);
  const height = parseNumber(attrs.height, 100);

  const fill = normalizeFill(attrs.fill);
  const stroke = attrs.stroke;
  const strokeWidth = parseNumber(attrs['stroke-width'], 1);
  const cornerRadius = parseNumber(attrs.rx, 0);

  return {
    id: generateId(),
    type: 'rect',
    name: 'Rectangle',
    x: baseX + x,
    y: baseY + y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    cornerRadius,
    visible: true,
    locked: false,
  };
}

function createCircleLayer(el: ParsedSvgElement, baseX: number, baseY: number): RectLayer {
  const attrs = el.attributes;

  const cx = parseNumber(attrs.cx, 0);
  const cy = parseNumber(attrs.cy, 0);
  const r = parseNumber(attrs.r, 50);

  const fill = normalizeFill(attrs.fill);
  const stroke = attrs.stroke;
  const strokeWidth = parseNumber(attrs['stroke-width'], 1);

  // Convert circle to rect (approximation)
  return {
    id: generateId(),
    type: 'rect',
    name: 'Circle',
    x: baseX + cx - r,
    y: baseY + cy - r,
    width: r * 2,
    height: r * 2,
    fill,
    stroke,
    strokeWidth,
    cornerRadius: r, // Use cornerRadius to approximate circle
    visible: true,
    locked: false,
  };
}

function createEllipseLayer(el: ParsedSvgElement, baseX: number, baseY: number): RectLayer {
  const attrs = el.attributes;

  const cx = parseNumber(attrs.cx, 0);
  const cy = parseNumber(attrs.cy, 0);
  const rx = parseNumber(attrs.rx, 50);
  const ry = parseNumber(attrs.ry, 30);

  const fill = attrs.fill || '#e0e0e0';
  const stroke = attrs.stroke;
  const strokeWidth = parseNumber(attrs['stroke-width'], 1);

  return {
    id: generateId(),
    type: 'rect',
    name: 'Ellipse',
    x: baseX + cx - rx,
    y: baseY + cy - ry,
    width: rx * 2,
    height: ry * 2,
    fill: fill === 'none' ? undefined : fill,
    stroke,
    strokeWidth,
    cornerRadius: Math.min(rx, ry), // Approximate ellipse
    visible: true,
    locked: false,
  };
}

function createPathLayer(el: ParsedSvgElement, baseX: number, baseY: number): SvgLayer {
  const attrs = el.attributes;

  // Keep path as SVG layer (can't easily convert to rect)
  const pathSvg = `<svg xmlns="http://www.w3.org/2000/svg"><path ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/></svg>`;

  // Estimate bounds from path data
  const bounds = estimatePathBounds(attrs.d);

  return {
    id: generateId(),
    type: 'svg',
    name: 'Path Shape',
    x: baseX + bounds.minX,
    y: baseY + bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    svgData: pathSvg,
    fill: attrs.fill,
    stroke: attrs.stroke,
    visible: true,
    locked: false,
  };
}

function estimatePathBounds(d: string): { minX: number; minY: number; maxX: number; maxY: number } {
  if (!d) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  // Simple parsing - extract all numeric coordinates
  const numbers = d.match(/-?\d+\.?\d*/g) || [];
  const coords = numbers.map(parseFloat);

  if (coords.length < 2) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < coords.length; i += 2) {
    if (coords[i] < minX) minX = coords[i];
    if (coords[i] > maxX) maxX = coords[i];
    if (coords[i + 1] < minY) minY = coords[i + 1];
    if (coords[i + 1] > maxY) maxY = coords[i + 1];
  }

  // Handle single coordinate case
  if (minX === Infinity) minX = 0;
  if (minY === Infinity) minY = 0;
  if (maxX === -Infinity) maxX = minX + 100;
  if (maxY === -Infinity) maxY = minY + 100;

  return { minX, minY, maxX, maxY };
}

/**
 * Ungroup an SVG layer into individual editable layers
 * Returns a GroupLayer containing the converted child layers
 */
export function ungroupSvgLayer(svgLayer: SvgLayer): EditorLayer | null {
  const elements = parseSvgElements(svgLayer.svgData);

  if (elements.length === 0) {
    return null;
  }

  const childLayers = convertSvgElementsToLayers(
    elements,
    0,
    0
  );

  if (childLayers.length === 0) {
    return null;
  }

  // If only one layer, return it directly (no need for group)
  if (childLayers.length === 1) {
    return {
      ...childLayers[0],
      x: childLayers[0].x + svgLayer.x,
      y: childLayers[0].y + svgLayer.y,
    };
  }

  // Return as group
  return {
    id: generateId(),
    type: 'group',
    name: `${svgLayer.name} (Ungrouped)`,
    x: svgLayer.x,
    y: svgLayer.y,
    width: svgLayer.width,
    height: svgLayer.height,
    visible: svgLayer.visible,
    locked: false,
    children: childLayers,
  };
}
