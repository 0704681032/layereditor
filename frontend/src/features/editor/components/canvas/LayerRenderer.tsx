import { type FC, useCallback, useMemo, useState, useEffect, memo } from 'react';
import { Rect, Text, Group, Image as KonvaImage, Ellipse, Line, Star, RegularPolygon } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';
import { useImageAsset } from '../../hooks/useImageAsset';
import type { EditorLayer, RectLayer, TextLayer, ImageLayer, SvgLayer, GroupLayer, EllipseLayer, LineLayer, StarLayer as StarLayerType, PolygonLayer, ShadowEffect } from '../../types';
import { useShallow } from 'zustand/react/shallow';
import { snapPosition } from '../../utils/snapping';
import { flattenLayers } from '../../utils/layerTree';

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
  const isBold = layer.fontStyle?.includes('bold');
  ctx.font = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
  return ctx.measureText(layer.text).width;
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

const RectComponent: FC<{ layer: RectLayer }> = memo(({ layer }) => {
  const { updateLayerPatch, selectLayers } = useEditorStore(
    useShallow((s) => ({
      updateLayerPatch: s.updateLayerPatch,
      selectLayers: s.selectLayers,
    }))
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const content = useEditorStore.getState().content;
      if (!content) return;
      const newX = e.target.x();
      const newY = e.target.y();
      const width = layer.width ?? 100;
      const height = layer.height ?? 100;
      const otherLayers = flattenLayers(content.layers)
        .filter((l) => l.layer.id !== layer.id)
        .map((l) => ({
          x: l.layer.x, y: l.layer.y,
          width: l.layer.width ?? 100, height: l.layer.height ?? 100,
        }));
      const snapped = snapPosition(newX, newY, width, height, otherLayers, true, true);
      updateLayerPatch(layer.id, { x: snapped.x, y: snapped.y });
    },
    [layer.id, layer.width, layer.height, updateLayerPatch]
  );

  return (
    <Rect
      id={layer.id}
      x={layer.x} y={layer.y}
      width={layer.width ?? 100} height={layer.height ?? 100}
      fill={layer.fill} stroke={layer.stroke} strokeWidth={layer.strokeWidth}
      cornerRadius={layer.cornerRadius}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragEnd={handleDragEnd}
      {...toShadowProps(layer.shadow)}
    />
  );
});

const EllipseComponent: FC<{ layer: EllipseLayer }> = memo(({ layer }) => {
  const { updateLayerPatch, selectLayers } = useEditorStore(
    useShallow((s) => ({
      updateLayerPatch: s.updateLayerPatch,
      selectLayers: s.selectLayers,
    }))
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
    },
    [layer.id, updateLayerPatch]
  );

  const w = layer.width ?? 100;
  const h = layer.height ?? 100;

  return (
    <Ellipse
      id={layer.id}
      x={layer.x + w / 2} y={layer.y + h / 2}
      radiusX={w / 2} radiusY={h / 2}
      fill={layer.fill} stroke={layer.stroke} strokeWidth={layer.strokeWidth}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragEnd={handleDragEnd}
      offsetX={0} offsetY={0}
      {...toShadowProps(layer.shadow)}
    />
  );
});

const LineComponent: FC<{ layer: LineLayer }> = memo(({ layer }) => {
  const { updateLayerPatch, selectLayers } = useEditorStore(
    useShallow((s) => ({
      updateLayerPatch: s.updateLayerPatch,
      selectLayers: s.selectLayers,
    }))
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
    },
    [layer.id, updateLayerPatch]
  );

  // Default: horizontal line across the layer's width
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
      onDragEnd={handleDragEnd}
      {...toShadowProps(layer.shadow)}
    />
  );
});

const StarComponent: FC<{ layer: StarLayerType }> = memo(({ layer }) => {
  const { updateLayerPatch, selectLayers } = useEditorStore(
    useShallow((s) => ({
      updateLayerPatch: s.updateLayerPatch,
      selectLayers: s.selectLayers,
    }))
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
    },
    [layer.id, updateLayerPatch]
  );

  const w = layer.width ?? 100;
  const h = layer.height ?? 100;
  const outerR = Math.min(w, h) / 2;
  const innerR = outerR * (layer.innerRadius ?? 0.4);

  return (
    <Star
      id={layer.id}
      x={layer.x + w / 2} y={layer.y + h / 2}
      numPoints={layer.numPoints ?? 5}
      innerRadius={innerR}
      outerRadius={outerR}
      fill={layer.fill ?? '#F5A623'}
      stroke={layer.stroke} strokeWidth={layer.strokeWidth}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragEnd={handleDragEnd}
      {...toShadowProps(layer.shadow)}
    />
  );
});

const PolygonComponent: FC<{ layer: PolygonLayer }> = memo(({ layer }) => {
  const { updateLayerPatch, selectLayers } = useEditorStore(
    useShallow((s) => ({
      updateLayerPatch: s.updateLayerPatch,
      selectLayers: s.selectLayers,
    }))
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
    },
    [layer.id, updateLayerPatch]
  );

  const w = layer.width ?? 100;
  const h = layer.height ?? 100;
  const radius = Math.min(w, h) / 2;

  return (
    <RegularPolygon
      id={layer.id}
      x={layer.x + w / 2} y={layer.y + h / 2}
      sides={layer.sides ?? 6}
      radius={radius}
      fill={layer.fill ?? '#4A90D9'}
      stroke={layer.stroke} strokeWidth={layer.strokeWidth}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragEnd={handleDragEnd}
      {...toShadowProps(layer.shadow)}
    />
  );
});

const TextComponent: FC<{ layer: TextLayer }> = memo(({ layer }) => {
  const { updateLayerPatch, selectLayers } = useEditorStore(
    useShallow((s) => ({
      updateLayerPatch: s.updateLayerPatch,
      selectLayers: s.selectLayers,
    }))
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
    },
    [layer.id, updateLayerPatch]
  );

  const offsetX = useMemo(() => {
    if (layer.align === 'center') return measureTextWidth(layer) / 2;
    if (layer.align === 'right') return measureTextWidth(layer);
    return 0;
  }, [layer]);

  return (
    <Text
      id={layer.id}
      x={layer.x} y={layer.y}
      width={layer.width}
      offsetX={offsetX}
      text={layer.text}
      fontSize={layer.fontSize ?? 24}
      fontFamily={layer.fontFamily ?? 'Arial'}
      fill={layer.fill ?? '#333'}
      fontStyle={layer.fontStyle}
      textDecoration={layer.textDecoration}
      align={layer.align}
      lineHeight={layer.lineHeight}
      letterSpacing={layer.letterSpacing}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
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
        input.style.fontWeight = layer.fontStyle?.includes('bold') ? 'bold' : 'normal';
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

        const finishEdit = () => {
          const newText = input.value;
          input.remove();
          if (newText !== layer.text) {
            useEditorStore.getState().updateLayerPatch(layer.id, { text: newText });
          }
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); finishEdit(); }
          if (e.key === 'Escape') { input.remove(); }
          e.stopPropagation();
        });
      }}
      {...toShadowProps(layer.shadow)}
    />
  );
});

const ImageComponent: FC<{ layer: ImageLayer }> = memo(({ layer }) => {
  const { selectLayers, updateLayerPatch } = useEditorStore(
    useShallow((s) => ({
      selectLayers: s.selectLayers,
      updateLayerPatch: s.updateLayerPatch,
    }))
  );
  const { url } = useImageAsset(layer.src ? undefined : layer.assetId);
  const imageUrl = layer.src || url;

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const renderedImage = imageUrl ? image : null;

  useEffect(() => {
    if (!imageUrl) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => { setImage(img); };
    return () => { img.onload = null; };
  }, [imageUrl]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
    },
    [layer.id, updateLayerPatch]
  );

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
      id={layer.id} image={renderedImage}
      x={layer.x} y={layer.y}
      width={layer.width} height={layer.height}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragEnd={handleDragEnd}
      {...toShadowProps(layer.shadow)}
    />
  );
});

const GroupComponent: FC<{ layer: GroupLayer }> = memo(({ layer }) => {
  const { selectLayers, updateLayerPatch } = useEditorStore(
    useShallow((s) => ({
      selectLayers: s.selectLayers,
      updateLayerPatch: s.updateLayerPatch,
    }))
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
    },
    [layer.id, updateLayerPatch]
  );

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

const SvgComponent: FC<{ layer: SvgLayer }> = memo(({ layer }) => {
  const { selectLayers, updateLayerPatch } = useEditorStore(
    useShallow((s) => ({
      selectLayers: s.selectLayers,
      updateLayerPatch: s.updateLayerPatch,
    }))
  );

  const imageUrl = useMemo(() => {
    const blob = new Blob([layer.svgData], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  }, [layer.svgData]);

  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => { setImage(img); };
    return () => { img.onload = null; URL.revokeObjectURL(imageUrl); };
  }, [imageUrl]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
    },
    [layer.id, updateLayerPatch]
  );

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
      id={layer.id} image={image}
      x={layer.x} y={layer.y}
      width={layer.width ?? 200} height={layer.height ?? 200}
      rotation={layer.rotation ?? 0} opacity={layer.opacity ?? 1}
      visible={layer.visible !== false} draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])} onTap={() => selectLayers([layer.id])}
      onDragEnd={handleDragEnd}
      {...toShadowProps(layer.shadow)}
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
