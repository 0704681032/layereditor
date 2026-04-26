import JSZip from 'jszip';
import type { EditorLayer, RectLayer, TextLayer, ImageLayer, GroupLayer, EllipseLayer, SvgLayer, Canvas } from '../types';
import { generateId } from './layerTree';

// Sketch file structure types
interface SketchDocument {
  pages: Array<{ _ref: string }>;
}

interface SketchPage {
  layers: SketchLayer[];
}

interface SketchLayer {
  _class: string;
  do_objectID: string;
  name: string;
  frame: SketchFrame;
  isVisible?: boolean;
  isLocked?: boolean;
  style?: SketchStyle;
  attributedString?: SketchAttributedString;
  layers?: SketchLayer[];
  image?: SketchImage;
  points?: SketchPathPoint[];
  path?: string;
  booleanOperation?: number;
}

interface SketchFrame {
  _class: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SketchStyle {
  fills?: SketchFill[];
  borders?: SketchBorder[];
}

interface SketchFill {
  _class: 'fill';
  fillType: number; // 0=color, 1=gradient, 4=image
  color?: SketchColor;
  gradient?: SketchGradient;
}

interface SketchBorder {
  _class: 'border';
  fillType: number;
  color?: SketchColor;
  thickness?: number;
}

interface SketchColor {
  _class: 'color';
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

interface SketchGradient {
  _class: 'gradient';
  gradientType: number; // 0=linear, 1=radial
  from: { x: number; y: number };
  to: { x: number; y: number };
  stops: SketchGradientStop[];
}

interface SketchGradientStop {
  _class: 'gradientStop';
  position: number;
  color: SketchColor;
}

interface SketchAttributedString {
  string: string;
  attributes: Array<{
    location: number;
    length: number;
    attributes: {
      MSAttributedStringFontAttribute?: { family: string; size: number };
      textColor?: SketchColor;
      fontWeight?: number;
      italics?: boolean;
    };
  }>;
}

interface SketchImage {
  _class: 'MSJSONFileReference';
  _ref: string;
}

interface SketchPathPoint {
  _class: 'curvePoint';
  cornerRadius?: number;
  point: string; // "{x, y}"
  curveFrom?: string;
  curveTo?: string;
  curveMode?: number;
}

// Convert Sketch color (0-1 float) to CSS hex/rgba
function sketchColorToCss(color: SketchColor | undefined): string | undefined {
  if (!color) return undefined;
  const r = Math.round(color.red * 255);
  const g = Math.round(color.green * 255);
  const b = Math.round(color.blue * 255);
  const a = color.alpha;
  if (a === 1) {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return `rgba(${r},${g},${b},${a})`;
}

// Convert Sketch gradient to Editor gradient
function sketchGradientToEditorGradient(gradient: SketchGradient): import('../types').GradientFill {
  const stops = gradient.stops.map(stop => ({
    offset: stop.position,
    color: sketchColorToCss(stop.color) || '#000000',
  }));

  // Calculate angle from gradient direction
  const dx = gradient.to.x - gradient.from.x;
  const dy = gradient.to.y - gradient.from.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  if (gradient.gradientType === 0) { // Linear
    return {
      type: 'linear',
      stops,
      angle,
    };
  } else { // Radial
    return {
      type: 'radial',
      stops,
      center: { x: gradient.from.x, y: gradient.from.y },
    };
  }
}

// Convert Sketch fill to Editor fill
function sketchFillToEditorFill(fills: SketchFill[] | undefined): string | import('../types').GradientFill | undefined {
  if (!fills || fills.length === 0) return undefined;

  const fill = fills[0]; // Use first fill
  if (fill.fillType === 0) { // Solid color
    return sketchColorToCss(fill.color);
  } else if (fill.fillType === 1 && fill.gradient) { // Gradient
    return sketchGradientToEditorGradient(fill.gradient);
  }
  return undefined;
}

// Get stroke from Sketch style
function sketchBorderToStroke(borders: SketchBorder[] | undefined): { stroke?: string; strokeWidth?: number } {
  if (!borders || borders.length === 0) return {};
  const border = borders[0];
  return {
    stroke: sketchColorToCss(border.color),
    strokeWidth: border.thickness ?? 1,
  };
}

// Parse text attributes
function parseTextAttributes(attrString: SketchAttributedString): {
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: number;
  fontStyle?: string;
} {
  const text = attrString.string || '';
  const attrs = attrString.attributes?.[0]?.attributes || {};

  const fontFamily = attrs.MSAttributedStringFontAttribute?.family || 'Arial';
  const fontSize = attrs.MSAttributedStringFontAttribute?.size || 16;
  const fontWeight = attrs.fontWeight || 400;
  const fill = sketchColorToCss(attrs.textColor) || '#333333';
  const fontStyle = attrs.italics ? 'italic' : undefined;

  return { text, fontFamily, fontSize, fill, fontWeight, fontStyle };
}

// Convert a single Sketch layer to Editor layer
function convertSketchLayer(
  layer: SketchLayer,
  baseX: number,
  baseY: number,
  imageData: Map<string, string>
): EditorLayer | null {
  const frame = layer.frame;
  const x = baseX + frame.x;
  const y = baseY + frame.y;
  const width = Math.max(1, frame.width);
  const height = Math.max(1, frame.height);
  const visible = layer.isVisible !== false;
  const locked = layer.isLocked === true;

  const style = layer.style;
  const fill = sketchFillToEditorFill(style?.fills);
  const { stroke, strokeWidth } = sketchBorderToStroke(style?.borders);

  switch (layer._class) {
    case 'rectangle': {
      const rectLayer: RectLayer = {
        id: generateId(),
        type: 'rect',
        name: layer.name || 'Rectangle',
        x,
        y,
        width,
        height,
        fill,
        stroke,
        strokeWidth,
        visible,
        locked,
      };
      return rectLayer;
    }

    case 'oval': {
      const ellipseLayer: EllipseLayer = {
        id: generateId(),
        type: 'ellipse',
        name: layer.name || 'Ellipse',
        x,
        y,
        width,
        height,
        fill,
        stroke,
        strokeWidth,
        visible,
        locked,
      };
      return ellipseLayer;
    }

    case 'text': {
      if (!layer.attributedString) return null;
      const textAttrs = parseTextAttributes(layer.attributedString);

      const textLayer: TextLayer = {
        id: generateId(),
        type: 'text',
        name: layer.name || 'Text',
        x,
        y,
        text: textAttrs.text,
        fontFamily: textAttrs.fontFamily,
        fontSize: textAttrs.fontSize,
        fill: textAttrs.fill,
        fontWeight: textAttrs.fontWeight,
        fontStyle: textAttrs.fontStyle,
        visible,
        locked,
      };
      return textLayer;
    }

    case 'bitmap': {
      if (!layer.image?._ref) return null;
      const imageDataUrl = imageData.get(layer.image._ref);
      if (!imageDataUrl) return null;

      const imageLayer: ImageLayer = {
        id: generateId(),
        type: 'image',
        name: layer.name || 'Image',
        x,
        y,
        width,
        height,
        src: imageDataUrl,
        visible,
        locked,
      };
      return imageLayer;
    }

    case 'group':
    case 'shapeGroup': {
      if (!layer.layers || layer.layers.length === 0) return null;

      const children: EditorLayer[] = [];
      for (const child of layer.layers) {
        const converted = convertSketchLayer(child, 0, 0, imageData);
        if (converted) children.push(converted);
      }

      if (children.length === 0) return null;
      if (children.length === 1) {
        return {
          ...children[0],
          x: x + children[0].x,
          y: y + children[0].y,
        };
      }

      const groupLayer: GroupLayer = {
        id: generateId(),
        type: 'group',
        name: layer.name || 'Group',
        x,
        y,
        width,
        height,
        visible,
        locked,
        children,
      };
      return groupLayer;
    }

    case 'shapePath': {
      // Complex path - convert to SVG layer
      const pathData = buildPathFromPoints(layer.points, layer.path);
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="${pathData}" fill="${fill || 'none'}" stroke="${stroke || 'none'}" stroke-width="${strokeWidth || 1}"/></svg>`;

      const svgLayer: SvgLayer = {
        id: generateId(),
        type: 'svg',
        name: layer.name || 'Path',
        x,
        y,
        width,
        height,
        svgData,
        fill: fill as string,
        stroke,
        visible,
        locked,
      };
      return svgLayer;
    }

    case 'triangle': {
      // Triangle is a polygon with 3 points
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><polygon points="0,${height} ${width},${height} ${width/2},0" fill="${fill || 'none'}" stroke="${stroke || 'none'}" stroke-width="${strokeWidth || 1}"/></svg>`;

      const svgLayer: SvgLayer = {
        id: generateId(),
        type: 'svg',
        name: layer.name || 'Triangle',
        x,
        y,
        width,
        height,
        svgData,
        fill: fill as string,
        stroke,
        visible,
        locked,
      };
      return svgLayer;
    }

    case 'polygon': {
      // Regular polygon
      const sides = layer.points?.length || 6;
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) / 2;
      const points = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }

      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><polygon points="${points.join(' ')}" fill="${fill || 'none'}" stroke="${stroke || 'none'}" stroke-width="${strokeWidth || 1}"/></svg>`;

      const svgLayer: SvgLayer = {
        id: generateId(),
        type: 'svg',
        name: layer.name || 'Polygon',
        x,
        y,
        width,
        height,
        svgData,
        fill: fill as string,
        stroke,
        visible,
        locked,
      };
      return svgLayer;
    }

    case 'star': {
      // Star shape
      const numPoints = layer.points?.length || 5;
      const cx = width / 2;
      const cy = height / 2;
      const outerR = Math.min(width, height) / 2;
      const innerR = outerR * 0.4;
      const points = [];
      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i * Math.PI / numPoints) - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }

      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><polygon points="${points.join(' ')}" fill="${fill || 'none'}" stroke="${stroke || 'none'}" stroke-width="${strokeWidth || 1}"/></svg>`;

      const svgLayer: SvgLayer = {
        id: generateId(),
        type: 'svg',
        name: layer.name || 'Star',
        x,
        y,
        width,
        height,
        svgData,
        fill: fill as string,
        stroke,
        visible,
        locked,
      };
      return svgLayer;
    }

    case 'artboard':
    case 'symbolMaster': {
      // Artboard/symbol - treat as group containing all layers
      if (!layer.layers || layer.layers.length === 0) return null;

      const children: EditorLayer[] = [];
      for (const child of layer.layers) {
        const converted = convertSketchLayer(child, 0, 0, imageData);
        if (converted) children.push(converted);
      }

      if (children.length === 0) return null;

      const groupLayer: GroupLayer = {
        id: generateId(),
        type: 'group',
        name: layer.name || 'Artboard',
        x,
        y,
        width,
        height,
        visible,
        locked,
        children,
      };
      return groupLayer;
    }

    default:
      // Skip unsupported layer types
      return null;
  }
}

// Build SVG path from Sketch points
function buildPathFromPoints(points: SketchPathPoint[] | undefined, path: string | undefined): string {
  if (path) return path;
  if (!points || points.length === 0) return '';

  let pathData = '';
  for (const pt of points) {
    const [x, y] = parseSketchPoint(pt.point);

    if (pathData === '') {
      pathData = `M ${x} ${y}`;
    } else {
      const curveFrom = pt.curveFrom ? parseSketchPoint(pt.curveFrom) : null;
      const curveTo = pt.curveTo ? parseSketchPoint(pt.curveTo) : null;

      if (curveFrom && curveTo && pt.curveMode !== 1) {
        // Bezier curve
        const [cfx, cfy] = curveFrom;
        const [ctx, cty] = curveTo;
        pathData += ` C ${ctx} ${cty} ${cfx} ${cfy} ${x} ${y}`;
      } else {
        // Straight line
        pathData += ` L ${x} ${y}`;
      }
    }
  }
  pathData += ' Z';
  return pathData;
}

// Parse Sketch point string "{x, y}"
function parseSketchPoint(pointStr: string): [number, number] {
  const match = pointStr.match(/\{([^,]+),\s*([^}]+)\}/);
  if (!match) return [0, 0];
  return [parseFloat(match[1]), parseFloat(match[2])];
}

/**
 * Parse a Sketch file and convert to EditorLayers
 */
export async function parseSketchFile(
  file: File,
  canvas: Canvas
): Promise<{ layers: EditorLayer[]; selectedLayerIds: string[] }> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);

  // Read document.json to get page references
  const documentJson = await contents.file('document.json')?.async('string');
  if (!documentJson) {
    throw new Error('Invalid Sketch file: missing document.json');
  }
  const document: SketchDocument = JSON.parse(documentJson);

  // Read all pages
  const allLayers: EditorLayer[] = [];
  const imageData = new Map<string, string>();

  // Extract embedded images
  const imageFiles = contents.filter((relativePath) => relativePath.startsWith('images/'));
  for (const [path, imgFile] of Object.entries(imageFiles)) {
    if (imgFile) {
      const blob = await imgFile.async('blob');
      const dataUrl = await blobToDataUrl(blob);
      imageData.set(path.replace('images/', ''), dataUrl);
    }
  }

  // Parse each page
  for (const pageRef of document.pages) {
    const pagePath = pageRef._ref;
    const pageJson = await contents.file(pagePath)?.async('string');
    if (!pageJson) continue;

    const page: SketchPage = JSON.parse(pageJson);
    if (!page.layers) continue;

    // Convert page layers
    for (const layer of page.layers) {
      // Skip hidden pages or symbol masters if they're not visible
      if (layer.isVisible === false) continue;

      const converted = convertSketchLayer(layer, 50, 50, imageData);
      if (converted) {
        // Scale layer to fit canvas if needed
        const maxWidth = Math.max(canvas.width - 100, 1);
        const maxHeight = Math.max(canvas.height - 100, 1);
        const scale = Math.min(
          maxWidth / (converted.width ?? 100),
          maxHeight / (converted.height ?? 100),
          1
        );

        if (scale < 1) {
          converted.x = Math.round(converted.x * scale);
          converted.y = Math.round(converted.y * scale);
          converted.width = Math.round((converted.width ?? 100) * scale);
          converted.height = Math.round((converted.height ?? 100) * scale);
        }

        allLayers.push(converted);
      }
    }
  }

  // If no layers were parsed, try to find any visible layers
  if (allLayers.length === 0) {
    throw new Error('No editable layers found in Sketch file');
  }

  const selectedLayerIds = allLayers.length > 0 ? [allLayers[0].id] : [];

  return { layers: allLayers, selectedLayerIds };
}

// Convert blob to data URL
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}