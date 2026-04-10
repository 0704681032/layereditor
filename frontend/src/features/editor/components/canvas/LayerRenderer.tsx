import { type FC, useCallback, useMemo, useState, useEffect, memo } from 'react';
import { Rect, Text, Group, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';
import { useImageAsset } from '../../hooks/useImageAsset';
import type { EditorLayer, RectLayer, TextLayer, ImageLayer, SvgLayer, GroupLayer } from '../../types';
import { useShallow } from 'zustand/react/shallow';
import { snapPosition } from '../../utils/snapping';
import { flattenLayers } from '../../utils/layerTree';

interface LayerRendererProps {
  layer: EditorLayer;
  /** Force re-render key based on layer content hash */
  renderKey?: string;
}

// 缓存的文字测量 canvas
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
  if (typeof document === 'undefined') {
    return 0;
  }

  const ctx = getMeasureContext();
  const fontSize = layer.fontSize ?? 24;
  const fontFamily = layer.fontFamily ?? 'Arial';
  const isItalic = layer.fontStyle?.includes('italic');
  const isBold = layer.fontStyle?.includes('bold');
  ctx.font = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
  return ctx.measureText(layer.text).width;
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

      // 获取其他图层的边界框（排除当前图层）
      const otherLayers = flattenLayers(content.layers)
        .filter((l) => l.layer.id !== layer.id)
        .map((l) => ({
          x: l.layer.x,
          y: l.layer.y,
          width: l.layer.width ?? 100,
          height: l.layer.height ?? 100,
        }));

      // 应用吸附
      const snapped = snapPosition(newX, newY, width, height, otherLayers, true, true);

      updateLayerPatch(layer.id, { x: snapped.x, y: snapped.y });
    },
    [layer.id, layer.width, layer.height, updateLayerPatch]
  );

  return (
    <Rect
      id={layer.id}
      x={layer.x}
      y={layer.y}
      width={layer.width ?? 100}
      height={layer.height ?? 100}
      fill={layer.fill}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth}
      cornerRadius={layer.cornerRadius}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])}
      onTap={() => selectLayers([layer.id])}
      onDragEnd={handleDragEnd}
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
    if (layer.align === 'center') {
      return measureTextWidth(layer) / 2;
    }
    if (layer.align === 'right') {
      return measureTextWidth(layer);
    }
    return 0;
  }, [layer]);

  return (
    <Text
      id={layer.id}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      offsetX={offsetX}
      text={layer.text}
      fontSize={layer.fontSize ?? 24}
      fontFamily={layer.fontFamily ?? 'Arial'}
      fill={layer.fill ?? '#333'}
      fontStyle={layer.fontStyle}
      align={layer.align}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])}
      onTap={() => selectLayers([layer.id])}
      onDragEnd={handleDragEnd}
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
  // Use src directly if available (preset images), otherwise use assetId (uploaded images)
  const { url } = useImageAsset(layer.src ? undefined : layer.assetId);
  const imageUrl = layer.src || url;

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const renderedImage = imageUrl ? image : null;

  useEffect(() => {
    if (!imageUrl) {
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };
    return () => {
      img.onload = null;
    };
  }, [imageUrl]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
    },
    [layer.id, updateLayerPatch]
  );

  if (!renderedImage) {
    return (
      <Rect
        id={layer.id}
        x={layer.x}
        y={layer.y}
        width={layer.width ?? 200}
        height={layer.height ?? 200}
        fill="#e0e0e0"
        stroke="#999"
        strokeWidth={1}
        visible={layer.visible !== false}
        onClick={() => selectLayers([layer.id])}
      />
    );
  }

  return (
    <KonvaImage
      id={layer.id}
      image={renderedImage}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])}
      onTap={() => selectLayers([layer.id])}
      onDragEnd={handleDragEnd}
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
      id={layer.id}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      draggable={!layer.locked}
      onClick={(e) => {
        if (e.target !== e.currentTarget) {
          return;
        }
        e.cancelBubble = true;
        selectLayers([layer.id]);
      }}
      onTap={(e) => {
        if (e.target !== e.currentTarget) {
          return;
        }
        e.cancelBubble = true;
        selectLayers([layer.id]);
      }}
      onDragEnd={handleDragEnd}
    >
      {layer.children.map((child: EditorLayer) => {
        // Generate a key that includes content hash for text layers
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

  // 使用 useMemo 缓存 Blob URL，避免每次渲染都创建
  const imageUrl = useMemo(() => {
    const blob = new Blob([layer.svgData], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  }, [layer.svgData]);

  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };
    return () => {
      img.onload = null;
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
    },
    [layer.id, updateLayerPatch]
  );

  if (!image) {
    return (
      <Rect
        id={layer.id}
        x={layer.x}
        y={layer.y}
        width={layer.width ?? 200}
        height={layer.height ?? 200}
        fill="#e0e0e0"
        stroke="#999"
        strokeWidth={1}
        visible={layer.visible !== false}
        onClick={() => selectLayers([layer.id])}
      />
    );
  }

  return (
    <KonvaImage
      id={layer.id}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width ?? 200}
      height={layer.height ?? 200}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      draggable={!layer.locked}
      onClick={() => selectLayers([layer.id])}
      onTap={() => selectLayers([layer.id])}
      onDragEnd={handleDragEnd}
    />
  );
});

export const LayerRenderer: FC<LayerRendererProps> = memo(({ layer }) => {
  switch (layer.type) {
    case 'rect':
      return <RectComponent layer={layer} />;
    case 'text':
      return <TextComponent layer={layer} />;
    case 'image':
      return <ImageComponent layer={layer} />;
    case 'group':
      return <GroupComponent layer={layer} />;
    case 'svg':
      return <SvgComponent layer={layer} />;
    default:
      return null;
  }
});