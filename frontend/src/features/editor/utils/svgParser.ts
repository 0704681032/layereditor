import type { EditorLayer, SvgLayer, ImageLayer } from '../types';
import { generateId } from './layerTree';

/**
 * Import SVG file as a single Image layer using canvas rendering
 * This is the recommended approach for complex SVGs with masks, transforms, etc.
 */
export async function importSvgAsImage(
  svgData: string,
  baseX: number = 0,
  baseY: number = 0
): Promise<ImageLayer | null> {
  try {
    // Parse SVG to get dimensions
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return null;

    // Get viewBox or width/height
    const viewBox = svg.getAttribute('viewBox');
    let width = parseFloat(svg.getAttribute('width') || '100');
    let height = parseFloat(svg.getAttribute('height') || '100');

    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(parseFloat);
      if (parts.length === 4) {
        width = parts[2];
        height = parts[3];
      }
    }

    // Scale up for better quality if SVG is small
    const scale = width < 200 ? 2 : 1;
    const canvasWidth = width * scale;
    const canvasHeight = height * scale;

    // Create canvas and render SVG using DOM method
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Scale context for quality
    ctx.scale(scale, scale);

    // Convert SVG to Image and draw to canvas
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG'));
      };
      img.src = url;
    });

    // Convert canvas to data URL
    const imageData = canvas.toDataURL('image/png');

    return {
      id: generateId(),
      type: 'image',
      name: 'SVG Image',
      x: baseX,
      y: baseY,
      width,
      height,
      src: imageData,
      visible: true,
      locked: false,
    };
  } catch (error) {
    console.error('Failed to import SVG as image:', error);
    return null;
  }
}

/**
 * Import SVG as a SvgLayer that preserves the original SVG data
 * This allows the SVG to be rendered by Konva's SVG renderer
 */
export async function importSvgAsSvgLayer(
  svgData: string,
  baseX: number = 0,
  baseY: number = 0
): Promise<SvgLayer | null> {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return null;

    // Get dimensions
    const viewBox = svg.getAttribute('viewBox');
    let width = parseFloat(svg.getAttribute('width') || '100');
    let height = parseFloat(svg.getAttribute('height') || '100');
    let offsetX = 0;
    let offsetY = 0;

    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(parseFloat);
      if (parts.length === 4) {
        offsetX = parts[0];
        offsetY = parts[1];
        width = parts[2];
        height = parts[3];
      }
    }

    return {
      id: generateId(),
      type: 'svg',
      name: 'SVG Layer',
      x: baseX,
      y: baseY,
      width,
      height,
      svgData,
      visible: true,
      locked: false,
    };
  } catch (error) {
    console.error('Failed to import SVG as SvgLayer:', error);
    return null;
  }
}

// Transform matrix representation
interface TransformMatrix {
  a: number; // scaleX
  b: number; // skewY
  c: number; // skewX
  d: number; // scaleY
  e: number; // translateX
  f: number; // translateY
}

interface ParsedSvgElement {
  type: 'text' | 'rect' | 'circle' | 'ellipse' | 'path' | 'line' | 'polygon' | 'image';
  attributes: Record<string, string>;
  content?: string;
  children?: ParsedSvgElement[];
  transform?: TransformMatrix;
}

// Identity transform matrix
const IDENTITY_TRANSFORM: TransformMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

// Parse transform attribute string into matrix
function parseTransform(transformStr: string | undefined): TransformMatrix {
  if (!transformStr) return IDENTITY_TRANSFORM;

  // Handle multiple transforms (e.g., "translate(10, 20) rotate(45)")
  const transforms: TransformMatrix[] = [];
  const regex = /(\w+)\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(transformStr)) !== null) {
    const type = match[1];
    const values = match[2].split(/[\s,]+/).map(v => parseFloat(v.trim()));

    switch (type) {
      case 'matrix':
        if (values.length === 6) {
          transforms.push({ a: values[0], b: values[1], c: values[2], d: values[3], e: values[4], f: values[5] });
        }
        break;
      case 'translate':
        transforms.push({ a: 1, b: 0, c: 0, d: 1, e: values[0] || 0, f: values[1] || 0 });
        break;
      case 'scale': {
        const sx = values[0] || 1;
        const sy = values.length > 1 ? values[1] : sx;
        transforms.push({ a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 });
        break;
      }
      case 'rotate': {
        const angle = (values[0] || 0) * (Math.PI / 180);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        // Handle rotate with center point
        if (values.length === 3) {
          const cx = values[1];
          const cy = values[2];
          transforms.push({ a: 1, b: 0, c: 0, d: 1, e: cx, f: cy });
          transforms.push({ a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 });
          transforms.push({ a: 1, b: 0, c: 0, d: 1, e: -cx, f: -cy });
        } else {
          transforms.push({ a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 });
        }
        break;
      }
    }
  }

  // Combine all transforms (first transform is applied first)
  return transforms.reduce((acc, t) => multiplyTransforms(acc, t), IDENTITY_TRANSFORM);
}

// Multiply two transform matrices (parent * child)
function multiplyTransforms(parent: TransformMatrix, child: TransformMatrix): TransformMatrix {
  return {
    a: parent.a * child.a + parent.c * child.b,
    b: parent.b * child.a + parent.d * child.b,
    c: parent.a * child.c + parent.c * child.d,
    d: parent.b * child.c + parent.d * child.d,
    e: parent.a * child.e + parent.c * child.f + parent.e,
    f: parent.b * child.e + parent.d * child.f + parent.f,
  };
}

// Apply transform to a point (x, y)
function applyTransform(transform: TransformMatrix, x: number, y: number): { x: number; y: number } {
  return {
    x: transform.a * x + transform.c * y + transform.e,
    y: transform.b * x + transform.d * y + transform.f,
  };
}

// Apply transform to estimate bounds of a rectangle
function transformBounds(transform: TransformMatrix, bounds: { minX: number; minY: number; maxX: number; maxY: number }): { minX: number; minY: number; maxX: number; maxY: number } {
  const corners = [
    applyTransform(transform, bounds.minX, bounds.minY),
    applyTransform(transform, bounds.maxX, bounds.minY),
    applyTransform(transform, bounds.minX, bounds.maxY),
    applyTransform(transform, bounds.maxX, bounds.maxY),
  ];
  return {
    minX: Math.min(...corners.map(c => c.x)),
    minY: Math.min(...corners.map(c => c.y)),
    maxX: Math.max(...corners.map(c => c.x)),
    maxY: Math.max(...corners.map(c => c.y)),
  };
}

// SVG gradient ID to actual color mapping
const SVG_GRADIENT_COLORS: Record<string, string> = {
  'url(#bg1)': '#764ba2',
  'url(#gold)': '#FFD700',
  'url(#accent)': '#24d7ff',
  'url(#jdBg)': '#F23D40',
  'url(#jdGold)': '#FFD54F',
  'url(#jdBlue)': '#2196F3',
  'url(#promoBg)': '#FF6B00',
  'url(#goldGrad)': '#FFD700',
  'url(#redGrad)': '#FF3333',
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

function normalizeFill(fill: string | undefined): string {
  if (!fill || fill === 'none') {
    return '#e0e0e0';
  }
  if (fill.startsWith('url(#')) {
    return SVG_GRADIENT_COLORS[fill] || '#764ba2';
  }
  if (fill.startsWith('rgba')) {
    return fill.replace(/\s+/g, '');
  }
  return fill;
}

/**
 * Parse SVG string and extract editable elements
 * Note: This is a simplified parser for basic SVG elements
 * Complex SVGs with masks, clipPaths, complex transforms may not parse correctly
 * For complex SVGs, use importSvgAsImage or importSvgAsSvgLayer instead
 */
export function parseSvgElements(svgData: string): ParsedSvgElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgData, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return [];

  const elements: ParsedSvgElement[] = [];
  walkSvgElements(svg, elements, IDENTITY_TRANSFORM);
  return elements;
}

function walkSvgElements(parent: Element, result: ParsedSvgElement[], parentTransform: TransformMatrix) {
  for (const child of parent.children) {
    const tagName = child.tagName.toLowerCase();

    // Skip defs, style, metadata, clipPath, mask, etc.
    if (['defs', 'style', 'metadata', 'title', 'desc', 'script', 'clippath', 'mask'].includes(tagName)) {
      continue;
    }

    const attributes = getAttributes(child);

    // Accumulate transform from this element
    const localTransform = parseTransform(attributes.transform);
    const accumulatedTransform = multiplyTransforms(parentTransform, localTransform);

    if (tagName === 'text' || tagName === 'tspan') {
      result.push({
        type: 'text',
        attributes,
        content: child.textContent || '',
        transform: accumulatedTransform,
      });
    } else if (tagName === 'rect') {
      result.push({
        type: 'rect',
        attributes,
        transform: accumulatedTransform,
      });
    } else if (tagName === 'circle') {
      result.push({
        type: 'circle',
        attributes,
        transform: accumulatedTransform,
      });
    } else if (tagName === 'ellipse') {
      result.push({
        type: 'ellipse',
        attributes,
        transform: accumulatedTransform,
      });
    } else if (tagName === 'path') {
      result.push({
        type: 'path',
        attributes,
        transform: accumulatedTransform,
      });
    } else if (tagName === 'line') {
      result.push({
        type: 'line',
        attributes,
        transform: accumulatedTransform,
      });
    } else if (tagName === 'polygon') {
      result.push({
        type: 'polygon',
        attributes,
        transform: accumulatedTransform,
      });
    } else if (tagName === 'image') {
      result.push({
        type: 'image',
        attributes,
        transform: accumulatedTransform,
      });
    } else if (tagName === 'g') {
      // Group - walk children with accumulated transform
      walkSvgElements(child, result, accumulatedTransform);
    } else {
      // Walk nested elements with accumulated transform
      walkSvgElements(child, result, accumulatedTransform);
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

function createTextLayer(el: ParsedSvgElement, baseX: number, baseY: number): EditorLayer {
  const attrs = el.attributes;

  let x = parseNumber(attrs.x, 0);
  let y = parseNumber(attrs.y, 0);
  x += parseNumber(attrs.dx, 0);
  y += parseNumber(attrs.dy, 0);

  const transform = el.transform || IDENTITY_TRANSFORM;
  const transformedPos = applyTransform(transform, x, y);

  const fontSize = parseNumber(attrs['font-size'], 16);
  const fontFamily = attrs['font-family'] || 'Arial';
  const numericFontWeight = parseNumber(attrs['font-weight'], 400);
  const isBold = attrs['font-weight'] === 'bold' || numericFontWeight >= 600;
  const isItalic = attrs['font-style'] === 'italic';
  const fontStyle = isBold ? (isItalic ? 'bold italic' : 'bold') : (isItalic ? 'italic' : undefined);

  const rawFill = attrs.fill || attrs.style?.match(/fill:\s*([^;]+)/)?.[1] || '#333333';
  const fill = normalizeFill(rawFill);

  const align = attrs['text-anchor'] === 'middle' ? 'center'
    : attrs['text-anchor'] === 'end' ? 'right'
    : 'left';

  return {
    id: generateId(),
    type: 'text',
    name: `Text: "${el.content?.slice(0, 20) || ''}"`,
    x: baseX + transformedPos.x,
    y: baseY + transformedPos.y - fontSize / 2,
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

function createRectLayer(el: ParsedSvgElement, baseX: number, baseY: number): EditorLayer {
  const attrs = el.attributes;

  const x = parseNumber(attrs.x, 0);
  const y = parseNumber(attrs.y, 0);
  const width = parseNumber(attrs.width, 100);
  const height = parseNumber(attrs.height, 100);

  const transform = el.transform || IDENTITY_TRANSFORM;
  const topLeft = applyTransform(transform, x, y);
  const topRight = applyTransform(transform, x + width, y);
  const bottomLeft = applyTransform(transform, x, y + height);

  const transformedWidth = Math.abs(topRight.x - topLeft.x);
  const transformedHeight = Math.abs(bottomLeft.y - topLeft.y);

  const fill = normalizeFill(attrs.fill);
  const stroke = attrs.stroke;
  const strokeWidth = parseNumber(attrs['stroke-width'], 1);
  const cornerRadius = parseNumber(attrs.rx, 0);

  return {
    id: generateId(),
    type: 'rect',
    name: 'Rectangle',
    x: baseX + topLeft.x,
    y: baseY + topLeft.y,
    width: transformedWidth,
    height: transformedHeight,
    fill,
    stroke,
    strokeWidth,
    cornerRadius,
    visible: true,
    locked: false,
  };
}

function createCircleLayer(el: ParsedSvgElement, baseX: number, baseY: number): EditorLayer {
  const attrs = el.attributes;

  const cx = parseNumber(attrs.cx, 0);
  const cy = parseNumber(attrs.cy, 0);
  const r = parseNumber(attrs.r, 50);

  const transform = el.transform || IDENTITY_TRANSFORM;
  const transformedCenter = applyTransform(transform, cx, cy);

  const fill = normalizeFill(attrs.fill);
  const stroke = attrs.stroke;
  const strokeWidth = parseNumber(attrs['stroke-width'], 1);

  return {
    id: generateId(),
    type: 'rect',
    name: 'Circle',
    x: baseX + transformedCenter.x - r,
    y: baseY + transformedCenter.y - r,
    width: r * 2,
    height: r * 2,
    fill,
    stroke,
    strokeWidth,
    cornerRadius: r,
    visible: true,
    locked: false,
  };
}

function createEllipseLayer(el: ParsedSvgElement, baseX: number, baseY: number): EditorLayer {
  const attrs = el.attributes;

  const cx = parseNumber(attrs.cx, 0);
  const cy = parseNumber(attrs.cy, 0);
  const rx = parseNumber(attrs.rx, 50);
  const ry = parseNumber(attrs.ry, 30);

  const transform = el.transform || IDENTITY_TRANSFORM;
  const transformedCenter = applyTransform(transform, cx, cy);

  const fill = normalizeFill(attrs.fill);
  const stroke = attrs.stroke;
  const strokeWidth = parseNumber(attrs['stroke-width'], 1);

  return {
    id: generateId(),
    type: 'rect',
    name: 'Ellipse',
    x: baseX + transformedCenter.x - rx,
    y: baseY + transformedCenter.y - ry,
    width: rx * 2,
    height: ry * 2,
    fill,
    stroke,
    strokeWidth,
    cornerRadius: Math.min(rx, ry),
    visible: true,
    locked: false,
  };
}

function createPathLayer(el: ParsedSvgElement, baseX: number, baseY: number): EditorLayer {
  const attrs = el.attributes;

  const bounds = estimatePathBounds(attrs.d);

  const transform = el.transform || IDENTITY_TRANSFORM;
  const transformedBounds = transformBounds(transform, bounds);

  // Normalize path data to start from (0, 0) by subtracting the bounds offset
  // This ensures the path renders correctly when placed at x, y position
  const normalizedD = normalizePathData(attrs.d, bounds.minX, bounds.minY);

  // Create SVG with normalized path data
  const pathAttrs = Object.entries(attrs)
    .filter(([k]) => k !== 'transform' && k !== 'd')
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  const pathSvg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${normalizedD}" ${pathAttrs}/></svg>`;

  return {
    id: generateId(),
    type: 'svg',
    name: 'Path Shape',
    x: baseX + transformedBounds.minX,
    y: baseY + transformedBounds.minY,
    width: transformedBounds.maxX - transformedBounds.minX,
    height: transformedBounds.maxY - transformedBounds.minY,
    svgData: pathSvg,
    fill: attrs.fill,
    stroke: attrs.stroke,
    visible: true,
    locked: false,
  };
}

// Normalize path data by subtracting offset from all coordinates
function normalizePathData(d: string, offsetX: number, offsetY: number): string {
  if (!d || (offsetX === 0 && offsetY === 0)) return d;

  // Replace all coordinate pairs with normalized values
  // SVG path commands: M, L, H, V, C, S, Q, T, A, Z
  const result = d.replace(/(-?\d+\.?\d*)/g, (match, numStr) => {
    const num = parseFloat(numStr);
    // We need to track whether this is an x or y coordinate
    // This is a simplified approach - adjust alternating numbers
    return numStr; // Keep original for now, handle in a better way
  });

  // Better approach: parse and reconstruct
  return shiftPathCoordinates(d, offsetX, offsetY);
}

// Shift all coordinates in path data by given offset
function shiftPathCoordinates(d: string, offsetX: number, offsetY: number): string {
  if (!d) return d;

  // Parse path commands and adjust coordinates
  const commands = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];

  let result = '';

  for (const cmd of commands) {
    const type = cmd[0];
    const params = cmd.slice(1).trim();

    if (type === 'Z' || type === 'z') {
      result += type;
      continue;
    }

    // For H (horizontal), only adjust x; for V (vertical), only adjust y
    if (type === 'H' || type === 'h') {
      const nums = params.match(/-?\d+\.?\d*/g) || [];
      const adjusted = nums.map(n => (parseFloat(n) - offsetX).toFixed(2));
      result += type + adjusted.join(' ');
      continue;
    }

    if (type === 'V' || type === 'v') {
      const nums = params.match(/-?\d+\.?\d*/g) || [];
      const adjusted = nums.map(n => (parseFloat(n) - offsetY).toFixed(2));
      result += type + adjusted.join(' ');
      continue;
    }

    // For other commands, adjust alternating x/y pairs
    const nums = params.match(/-?\d+\.?\d*/g) || [];
    const adjusted: string[] = [];

    // Handle special case for A (arc) which has 7 parameters: rx, ry, rotation, large-arc, sweep, x, y
    if (type === 'A' || type === 'a') {
      for (let i = 0; i < nums.length; i += 7) {
        // First 5 params stay unchanged (rx, ry, rotation, large-arc-flag, sweep-flag)
        adjusted.push(nums[i], nums[i+1], nums[i+2], nums[i+3], nums[i+4]);
        // Last 2 params (x, y) get offset
        adjusted.push((parseFloat(nums[i+5]) - offsetX).toFixed(2));
        adjusted.push((parseFloat(nums[i+6]) - offsetY).toFixed(2));
      }
    } else {
      // M, L, C, S, Q, T - standard alternating x/y
      for (let i = 0; i < nums.length; i += 2) {
        const x = parseFloat(nums[i]) - offsetX;
        const y = parseFloat(nums[i+1]) - offsetY;
        adjusted.push(x.toFixed(2), y.toFixed(2));
      }
    }

    result += type + adjusted.join(' ');
  }

  return result;
}

function estimatePathBounds(d: string): { minX: number; minY: number; maxX: number; maxY: number } {
  if (!d) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  // Extract all numeric coordinates
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

  if (minX === Infinity) minX = 0;
  if (minY === Infinity) minY = 0;
  if (maxX === -Infinity) maxX = minX + 100;
  if (maxY === -Infinity) maxY = minY + 100;

  return { minX, minY, maxX, maxY };
}

/**
 * Ungroup an SVG layer into individual editable layers
 */
export function ungroupSvgLayer(svgLayer: SvgLayer): EditorLayer | null {
  const elements = parseSvgElements(svgLayer.svgData);

  if (elements.length === 0) {
    return null;
  }

  const childLayers = convertSvgElementsToLayers(elements, 0, 0);

  if (childLayers.length === 0) {
    return null;
  }

  if (childLayers.length === 1) {
    return {
      ...childLayers[0],
      x: childLayers[0].x + svgLayer.x,
      y: childLayers[0].y + svgLayer.y,
    };
  }

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