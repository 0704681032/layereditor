import { type FC, useCallback, useMemo, useState, useEffect, memo, useRef } from 'react';
import { Rect, Text, Group, Image as KonvaImage, Ellipse, Line, Star, RegularPolygon, Path } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';
import { useImageAsset } from '../../hooks/useImageAsset';
import type { EditorLayer, RectLayer, TextLayer, ImageLayer, SvgLayer, GroupLayer, EllipseLayer, LineLayer, StarLayer as StarLayerType, PolygonLayer, ShadowEffect, LayerFilters, GradientFill } from '../../types';
import { snapPosition, snapToEqualSpacing } from '../../utils/snapping';
import { flattenLayers } from '../../utils/layerTree';
import { calculateGuideLines } from './SmartGuides';

// Shared drag handlers with smart guide lines and snap support
function useSmartGuideDrag(layer: EditorLayer) {
  const updateLayerPatch = useEditorStore((s) => s.updateLayerPatch);

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const state = useEditorStore.getState();
      const content = state.content;
      if (!content) return;
      const snapEnabled = state.snapEnabled;
      if (!snapEnabled) { state.setGuideLines([]); return; }
      const snapThreshold = state.snapThreshold;
      const tempLayer = { ...layer, x: e.target.x(), y: e.target.y() };
      // Pass the user-configurable threshold to guide calculation
      const guides = calculateGuideLines(tempLayer, content.layers, content.canvas.width, content.canvas.height, snapThreshold);
      state.setGuideLines(guides);
    },
    [layer]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const state = useEditorStore.getState();
      const content = state.content;
      if (!content) return;
      const snapEnabled = state.snapEnabled;
      const snapThreshold = state.snapThreshold;
      if (snapEnabled) {
        const otherLayers = flattenLayers(content.layers)
          .filter((l) => l.layer.id !== layer.id)
          .map((l) => ({
            id: l.layer.id,
            x: l.layer.x, y: l.layer.y,
            width: l.layer.width ?? 100, height: l.layer.height ?? 100,
          }));
        // First apply standard snapping
        let snapped = snapPosition(e.target.x(), e.target.y(), layer.width ?? 100, layer.height ?? 100, otherLayers, true, true, snapThreshold);
        // Then try equal spacing snapping if not already snapped
        if (!snapped.snappedX || !snapped.snappedY) {
          const spacingSnap = snapToEqualSpacing(
            snapped.x, snapped.y,
            layer.width ?? 100, layer.height ?? 100,
            otherLayers, snapThreshold
          );
          if (spacingSnap.spacingGuides.some(g => g.snapped)) {
            snapped = { x: spacingSnap.x, y: spacingSnap.y, snappedX: true, snappedY: true };
          }
        }
        updateLayerPatch(layer.id, { x: snapped.x, y: snapped.y });
      } else {
        updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
      }
      state.setGuideLines([]);
    },
    [layer, updateLayerPatch]
  );

  return { handleDragMove, handleDragEnd };
}

// Hook to apply Konva filters from layer data
function useKonvaFilters(nodeRef: React.RefObject<Konva.Node | null>, filters?: LayerFilters) {
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (!filters || (Object.values(filters).every(v => !v || v === 0))) {
      node.filters([]);
      try { node.clearCache(); } catch {}
      node.getLayer()?.batchDraw();
      return;
    }
    applyFiltersToNode(node, filters);
    node.getLayer()?.batchDraw();
  }, [nodeRef, filters, filters?.blur, filters?.brightness, filters?.contrast, filters?.grayScale, filters?.hue, filters?.saturate]);
}

interface LayerRendererProps {
  layer: EditorLayer;
  renderKey?: string;
}

// Cached text measurement canvas
let measureCanvas: HTMLCanvasElement | null = null;
let measureContext: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
    measureContext = measureCanvas.getContext('2d');
  }
  return measureContext!;
}

function measureTextWidth(layer: TextLayer): number {
  if (typeof document === 'undefined') return 0;
  const ctx = getMeasureContext();
  const fontSize = layer.fontSize ?? 24;
  const fontFamily = layer.fontFamily ?? 'Arial';
  const isItalic = layer.fontStyle?.includes('italic');
  // Use fontWeight numeric value if available, otherwise check fontStyle string
  const fontWeight = layer.fontWeight ?? (layer.fontStyle?.includes('bold') ? 700 : 400);
  ctx.font = `${isItalic ? 'italic ' : ''}${fontWeight} ${fontSize}px ${fontFamily}`;
  // Transform text for measurement if textTransform is set
  const transformedText = applyTextTransform(layer.text, layer.textTransform);
  return ctx.measureText(transformedText).width;
}

function applyTextTransform(text: string, transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'): string {
  if (!transform || transform === 'none') return text;
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  if (transform === 'capitalize') return text.replace(/\b\w/g, c => c.toUpperCase());
  return text;
}

function toShadowProps(shadow?: ShadowEffect) {
  if (!shadow || !shadow.enabled) return {};
  return {
    shadowColor: shadow.color,
    shadowBlur: shadow.blur,
    shadowOffsetX: shadow.offsetX,
    shadowOffsetY: shadow.offsetY,
    shadowEnabled: true,
  };
}

function toBlendMode(blendMode?: string): Record<string, string> {
  if (!blendMode || blendMode === 'normal') return {};
  return { globalCompositeOperation: blendMode };
}

// Convert gradient fill to Konva gradient props
function toGradientProps(fill: string | GradientFill | undefined, width: number, height: number): Record<string, any> {
  if (!fill) return { fill: '#000000' };
  if (typeof fill === 'string') return { fill };

  // Convert stops to Konva format: [offset1, color1, offset2, color2, ...]
  const colorStops = fill.stops.flatMap((stop) => [stop.offset, stop.color]);

  if (fill.type === 'linear') {
    const angle = (fill.angle ?? 0) * (Math.PI / 180); // Convert to radians
    // Calculate start/end points based on angle
    const centerX = width / 2;
    const centerY = height / 2;
    const len = Math.max(width, height) / 2;
    return {
      fillLinearGradientStartPoint: {
        x: centerX - Math.cos(angle) * len,
        y: centerY + Math.sin(angle) * len,
      },
      fillLinearGradientEndPoint: {
        x: centerX + Math.cos(angle) * len,
        y: centerY - Math.sin(angle) * len,
      },
      fillLinearGradientColorStops: colorStops,
    };
  } else if (fill.type === 'radial') {
    const center = fill.center ?? { x: 0.5, y: 0.5 };
    const endRadius = Math.max(width, height) / 2;
    return {
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius: endRadius,
      fillRadialGradientStartPoint: {
        x: center.x * width,
        y: center.y * height,
      },
      fillRadialGradientEndPoint: {
        x: center.x * width,
        y: center.y * height,
      },
      fillRadialGradientColorStops: colorStops,
    };
  }

  return { fill: '#000000' };
}

function applyFiltersToNode(node: Konva.Node, filters?: LayerFilters) {
  if (!filters) return;
  const activeFilters: any[] = [];

  if (filters.blur && filters.blur > 0) activeFilters.push(Konva.Filters.Blur);
  if (filters.brightness !== undefined && filters.brightness !== 0) activeFilters.push(Konva.Filters.Brighten);
  if (filters.contrast !== undefined && filters.contrast !== 0) activeFilters.push(Konva.Filters.Contrast);
  if (filters.grayScale && filters.grayScale > 0) activeFilters.push(Konva.Filters.Grayscale);
  if (filters.hue && filters.hue !== 0) activeFilters.push(Konva.Filters.HSL);
  if (filters.saturate !== undefined && filters.saturate !== 0) activeFilters.push(Konva.Filters.HSL);

  if (activeFilters.length > 0) {
    node.filters(activeFilters);
    if (filters.blur) node.blurRadius(filters.blur);
    if (filters.brightness !== undefined) node.brightness(filters.brightness);
    if (filters.contrast !== undefined) node.contrast(filters.contrast);
    if (filters.grayScale && filters.grayScale > 0) (node as any).grayscale(1);
    if (filters.hue) node.hue(filters.hue);
    if (filters.saturate) node.saturation(filters.saturate);
    try { node.cache(); } catch {}
  }
}

const RectComponent: FC<{ layer: RectLayer }> = memo(({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const { handleDragMove, handleDragEnd } = useSmartGuideDrag(layer);
  const rectRef = useRef<Konva.Rect>(null);
  useKonvaFilters(rectRef, layer.filters);

  const w = layer.width ?? 100;
  const h = layer.height ?? 100;
  const gradientProps = useMemo(() => toGradientProps(layer.fill, w, h), [layer.fill, w, h]);

  return (
    <Rect
      ref={rectRef as never}
      id={layer.id}
      x={layer.x} y={layer.y}
      width={w} height={h}
      stroke={layer.stroke} strokeWidth={layer.strokeWidth}
      cornerRadius={layer.cornerRadius}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      {...gradientProps}
      {...toShadowProps(layer.shadow)}
      {...toBlendMode(layer.blendMode)}
    />
  );
});

const EllipseComponent: FC<{ layer: EllipseLayer }> = memo(({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const { handleDragMove, handleDragEnd } = useSmartGuideDrag(layer);
  const ellipseRef = useRef<Konva.Ellipse>(null);
  useKonvaFilters(ellipseRef, layer.filters);

  const w = layer.width ?? 100;
  const h = layer.height ?? 100;
  const gradientProps = useMemo(() => toGradientProps(layer.fill, w, h), [layer.fill, w, h]);

  return (
    <Ellipse
      ref={ellipseRef as never}
      id={layer.id}
      x={layer.x + w / 2} y={layer.y + h / 2}
      radiusX={w / 2} radiusY={h / 2}
      stroke={layer.stroke} strokeWidth={layer.strokeWidth}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      offsetX={0} offsetY={0}
      {...gradientProps}
      {...toShadowProps(layer.shadow)}
      {...toBlendMode(layer.blendMode)}
    />
  );
});

const LineComponent: FC<{ layer: LineLayer }> = memo(({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const { handleDragMove, handleDragEnd } = useSmartGuideDrag(layer);

  const w = layer.width ?? 200;
  const points = layer.points ?? [0, 0, w, 0];

  return (
    <Line
      id={layer.id}
      x={layer.x} y={layer.y}
      points={points}
      stroke={layer.stroke ?? '#333333'}
      strokeWidth={layer.strokeWidth ?? 2}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      {...toShadowProps(layer.shadow)}
      {...toBlendMode(layer.blendMode)}
    />
  );
});

const StarComponent: FC<{ layer: StarLayerType }> = memo(({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const { handleDragMove, handleDragEnd } = useSmartGuideDrag(layer);

  const w = layer.width ?? 100;
  const h = layer.height ?? 100;
  const outerR = Math.min(w, h) / 2;
  const innerR = outerR * (layer.innerRadius ?? 0.4);

  const gradientProps = useMemo(() => toGradientProps(layer.fill ?? '#F5A623', w, h), [layer.fill, w, h]);

  return (
    <Star
      id={layer.id}
      x={layer.x + w / 2} y={layer.y + h / 2}
      numPoints={layer.numPoints ?? 5}
      innerRadius={innerR}
      outerRadius={outerR}
      stroke={layer.stroke} strokeWidth={layer.strokeWidth}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      {...gradientProps}
      {...toShadowProps(layer.shadow)}
      {...toBlendMode(layer.blendMode)}
    />
  );
});

const PolygonComponent: FC<{ layer: PolygonLayer }> = memo(({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const { handleDragMove, handleDragEnd } = useSmartGuideDrag(layer);

  const w = layer.width ?? 100;
  const h = layer.height ?? 100;
  const radius = Math.min(w, h) / 2;

  const gradientProps = useMemo(() => toGradientProps(layer.fill ?? '#4A90D9', w, h), [layer.fill, w, h]);

  return (
    <RegularPolygon
      id={layer.id}
      x={layer.x + w / 2} y={layer.y + h / 2}
      sides={layer.sides ?? 6}
      radius={radius}
      stroke={layer.stroke} strokeWidth={layer.strokeWidth}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      {...gradientProps}
      {...toShadowProps(layer.shadow)}
      {...toBlendMode(layer.blendMode)}
    />
  );
});

const TextComponent: FC<{ layer: TextLayer }> = memo(({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const { handleDragMove, handleDragEnd } = useSmartGuideDrag(layer);
  const textRef = useRef<Konva.Text>(null);
  useKonvaFilters(textRef, layer.filters);

  // Transform text based on textTransform property
  const displayText = useMemo(() => applyTextTransform(layer.text, layer.textTransform), [layer.text, layer.textTransform]);

  // Build fontStyle string including fontWeight
  const fontStyleString = useMemo(() => {
    const parts: string[] = [];
    if (layer.fontStyle?.includes('italic')) parts.push('italic');
    if (layer.fontWeight) {
      // Konva requires 'bold' keyword for weights >= 700, otherwise numeric weight
      if (layer.fontWeight >= 700) parts.push('bold');
      else parts.push(String(layer.fontWeight));
    } else if (layer.fontStyle?.includes('bold')) {
      parts.push('bold');
    }
    return parts.length > 0 ? parts.join(' ') : undefined;
  }, [layer.fontStyle, layer.fontWeight]);

  // Calculate text width for alignment offset
  const textWidth = useMemo(() => measureTextWidth(layer), [layer]);
  const offsetX = useMemo(() => {
    if (layer.align === 'center') return textWidth / 2;
    if (layer.align === 'right') return textWidth;
    return 0;
  }, [layer.align, textWidth]);

  // Build textDecoration including strikethrough
  const textDecorationString = useMemo(() => {
    const decorations: string[] = [];
    if (layer.textDecoration?.includes('underline')) decorations.push('underline');
    if (layer.textDecoration?.includes('line-through')) decorations.push('line-through');
    return decorations.length > 0 ? decorations.join(' ') : layer.textDecoration;
  }, [layer.textDecoration]);

  // Use maxWidth if wrap is enabled
  const textWidthProp = useMemo(() => {
    if (layer.wrap && layer.wrap !== 'none' && layer.maxWidth) {
      return layer.maxWidth;
    }
    return layer.width;
  }, [layer.wrap, layer.maxWidth, layer.width]);

  return (
    <Text
      ref={textRef as never}
      id={layer.id}
      x={layer.x} y={layer.y}
      width={textWidthProp}
      offsetX={offsetX}
      text={displayText}
      fontSize={layer.fontSize ?? 24}
      fontFamily={layer.fontFamily ?? 'Arial'}
      fill={layer.fill ?? '#333'}
      fontStyle={fontStyleString}
      textDecoration={textDecorationString}
      align={layer.align}
      lineHeight={layer.lineHeight}
      letterSpacing={layer.letterSpacing}
      // Text stroke properties
      stroke={layer.textStroke}
      strokeWidth={layer.textStrokeWidth ?? 0}
      // Wrap mode - Konva supports word wrapping
      wrap={layer.wrap === 'char' ? 'none' : (layer.wrap === 'word' ? 'word' : 'none')}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDblClick={() => {
        const stage = useEditorStore.getState().stageRef;
        if (!stage) return;
        const textNode = stage.findOne(`#${layer.id}`);
        if (!textNode) return;

        // Hide text node and create HTML input overlay
        const textPosition = textNode.getClientRect();
        const container = document.querySelector('[data-canvas-container]');
        if (!container) return;

        const input = document.createElement('input');
        input.value = layer.text;
        input.style.position = 'absolute';
        input.style.left = `${textPosition.x}px`;
        input.style.top = `${textPosition.y - 4}px`;
        input.style.width = `${Math.max(textPosition.width + 20, 100)}px`;
        input.style.fontSize = `${(layer.fontSize ?? 24)}px`;
        input.style.fontFamily = layer.fontFamily ?? 'Arial';
        input.style.fontStyle = layer.fontStyle?.includes('italic') ? 'italic' : 'normal';
        const fontWeight = layer.fontWeight ?? (layer.fontStyle?.includes('bold') ? 700 : 400);
        input.style.fontWeight = String(fontWeight);
        input.style.border = '2px solid #4A90D9';
        input.style.borderRadius = '4px';
        input.style.padding = '2px 4px';
        input.style.outline = 'none';
        input.style.zIndex = '1000';
        input.style.background = 'white';
        input.style.color = layer.fill ?? '#333';

        container.appendChild(input);
        input.focus();
        input.select();

        let editing = true;
        const finishEdit = () => {
          if (!editing) return;
          editing = false;
          const newText = input.value;
          input.removeEventListener('blur', finishEdit);
          input.remove();
          if (newText !== layer.text) {
            useEditorStore.getState().updateLayerPatch(layer.id, { text: newText });
          }
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); finishEdit(); }
          if (e.key === 'Escape') { finishEdit(); }
          e.stopPropagation();
        });
      }}
      {...toShadowProps(layer.shadow)}
      {...toBlendMode(layer.blendMode)}
    />
  );
});

const ImageComponent: FC<{ layer: ImageLayer }> = memo(({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const { handleDragMove, handleDragEnd } = useSmartGuideDrag(layer);
  const imgRef = useRef<Konva.Image>(null);
  useKonvaFilters(imgRef, layer.filters);
  const { url } = useImageAsset(layer.src ? undefined : layer.assetId);
  const imageUrl = layer.src || url;

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const renderedImage = imageUrl ? image : null;

  useEffect(() => {
    if (!imageUrl) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { setImage(img); };
    img.onerror = () => { setImage(null); };
    img.src = imageUrl;
    return () => { img.onload = null; img.onerror = null; img.src = ''; };
  }, [imageUrl]);

  if (!renderedImage) {
    return (
      <Rect id={layer.id} x={layer.x} y={layer.y}
        width={layer.width ?? 200} height={layer.height ?? 200}
        fill="#e0e0e0" stroke="#999" strokeWidth={1}
        visible={layer.visible !== false}
        onClick={() => selectLayers([layer.id])}
      />
    );
  }

  return (
    <KonvaImage
      ref={imgRef as never}
      id={layer.id} image={renderedImage}
      x={layer.x} y={layer.y}
      width={layer.width} height={layer.height}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      {...toShadowProps(layer.shadow)}
      {...toBlendMode(layer.blendMode)}
    />
  );
});

const GroupComponent: FC<{ layer: GroupLayer }> = memo(({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const { handleDragMove, handleDragEnd } = useSmartGuideDrag(layer);

  return (
    <Group
      id={layer.id} x={layer.x} y={layer.y}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        e.cancelBubble = true;
        selectLayers([layer.id]);
      }}
      onTap={(e) => {
        if (e.target !== e.currentTarget) return;
        e.cancelBubble = true;
        selectLayers([layer.id]);
      }}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {layer.children.map((child: EditorLayer) => {
        const childKey = child.type === 'text'
          ? `${child.id}-${(child as TextLayer).text}`
          : child.id;
        return <LayerRenderer key={childKey} layer={child} />;
      })}
    </Group>
  );
});

// Complex SVG rendered as Image (extracted to fix hook rules)
const ComplexSvgImage: FC<{
  layer: SvgLayer;
  selectLayers: (ids: string[]) => void;
  handleDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  svgRef: React.RefObject<Konva.Node | null>;
}> = memo(({ layer, selectLayers, handleDragMove, handleDragEnd, svgRef }) => {
  const imageUrl = useMemo(() => {
    const blob = new Blob([layer.svgData], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  }, [layer.svgData]);

  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => { setImage(img); };
    img.onerror = () => { setImage(null); };
    img.src = imageUrl;
    return () => { img.onload = null; img.onerror = null; img.src = ''; URL.revokeObjectURL(imageUrl); };
  }, [imageUrl]);

  if (!image) {
    return (
      <Rect id={layer.id} x={layer.x} y={layer.y}
        width={layer.width ?? 200} height={layer.height ?? 200}
        fill="#e0e0e0" stroke="#999" strokeWidth={1}
        visible={layer.visible !== false}
        onClick={() => selectLayers([layer.id])}
      />
    );
  }

  return (
    <KonvaImage
      ref={svgRef as never}
      id={layer.id} image={image}
      x={layer.x} y={layer.y}
      width={layer.width ?? 200} height={layer.height ?? 200}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      {...toShadowProps(layer.shadow)}
      {...toBlendMode(layer.blendMode)}
    />
  );
});

const SvgComponent: FC<{ layer: SvgLayer }> = memo(({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const { handleDragMove, handleDragEnd } = useSmartGuideDrag(layer);
  const svgRef = useRef<Konva.Node>(null);
  useKonvaFilters(svgRef, layer.filters);

  // Parse SVG data to extract path information for direct rendering
  const pathData = useMemo(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(layer.svgData, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return null;

      // Find the first path element
      const path = svg.querySelector('path');
      if (!path) return null;

      return {
        d: path.getAttribute('d') || '',
        fill: path.getAttribute('fill') || layer.fill || '#e0e0e0',
        stroke: path.getAttribute('stroke') || layer.stroke,
        strokeWidth: parseFloat(path.getAttribute('stroke-width') || '1'),
        // Check if it's a single path (can render directly) or complex SVG (need image)
        isSimplePath: svg.querySelectorAll('path, rect, circle, ellipse, text, g').length === 1
      };
    } catch {
      return null;
    }
  }, [layer.svgData, layer.fill, layer.stroke]);

  // If it's a simple path, render directly with Konva.Path (editable)
  if (pathData && pathData.isSimplePath && pathData.d) {
    return (
      <Path
        ref={svgRef as React.RefObject<Konva.Path>}
        id={layer.id}
        x={layer.x}
        y={layer.y}
        data={pathData.d}
        fill={pathData.fill === 'none' ? undefined : pathData.fill}
        stroke={pathData.stroke}
        strokeWidth={pathData.strokeWidth}
        rotation={layer.rotation ?? 0}
        opacity={layer.opacity ?? 1}
        visible={layer.visible !== false}
        draggable={!layer.locked}
        onClick={() => selectLayers([layer.id])}
        onTap={() => selectLayers([layer.id])}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        {...toShadowProps(layer.shadow)}
        {...toBlendMode(layer.blendMode)}
      />
    );
  }

  // Complex SVG: render as Image via separate component (hooks at top level)
  return (
    <ComplexSvgImage
      layer={layer}
      selectLayers={selectLayers}
      handleDragMove={handleDragMove}
      handleDragEnd={handleDragEnd}
      svgRef={svgRef}
    />
  );
});

export const LayerRenderer: FC<LayerRendererProps> = memo(({ layer }) => {
  switch (layer.type) {
    case 'rect': return <RectComponent layer={layer} />;
    case 'ellipse': return <EllipseComponent layer={layer as EllipseLayer} />;
    case 'line': return <LineComponent layer={layer as LineLayer} />;
    case 'star': return <StarComponent layer={layer as StarLayerType} />;
    case 'polygon': return <PolygonComponent layer={layer as PolygonLayer} />;
    case 'text': return <TextComponent layer={layer} />;
    case 'image': return <ImageComponent layer={layer} />;
    case 'group': return <GroupComponent layer={layer} />;
    case 'svg': return <SvgComponent layer={layer} />;
    default: return null;
  }
});
