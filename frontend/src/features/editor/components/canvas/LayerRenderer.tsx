import { type FC, useCallback, useMemo, useState, useEffect } from 'react';
import { Rect, Text, Group, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';
import { useImageAsset } from '../../hooks/useImageAsset';
import type { EditorLayer, RectLayer, TextLayer, ImageLayer, SvgLayer, GroupLayer } from '../../types';
import { pushHistory } from '../../store/history';

interface LayerRendererProps {
  layer: EditorLayer;
  /** Force re-render key based on layer content hash */
  renderKey?: string;
}

function measureTextWidth(layer: TextLayer): number {
  if (typeof document === 'undefined') {
    return 0;
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return 0;
  }

  const fontSize = layer.fontSize ?? 24;
  const fontFamily = layer.fontFamily ?? 'Arial';
  const isItalic = layer.fontStyle?.includes('italic');
  const isBold = layer.fontStyle?.includes('bold');
  context.font = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
  return context.measureText(layer.text).width;
}

const RectComponent: FC<{ layer: RectLayer }> = ({ layer }) => {
  const updateLayerPatch = useEditorStore((s) => s.updateLayerPatch);
  const content = useEditorStore((s) => s.content);
  const selectLayers = useEditorStore((s) => s.selectLayers);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
      if (content) pushHistory({ content: { ...content }, selectedLayerIds: [layer.id] });
    },
    [layer.id, updateLayerPatch, content]
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
};

const TextComponent: FC<{ layer: TextLayer }> = ({ layer }) => {
  const updateLayerPatch = useEditorStore((s) => s.updateLayerPatch);
  const content = useEditorStore((s) => s.content);
  const selectLayers = useEditorStore((s) => s.selectLayers);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
      if (content) pushHistory({ content: { ...content }, selectedLayerIds: [layer.id] });
    },
    [layer.id, updateLayerPatch, content]
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
};

const ImageComponent: FC<{ layer: ImageLayer }> = ({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const updateLayerPatch = useEditorStore((s) => s.updateLayerPatch);
  const content = useEditorStore((s) => s.content);
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
      if (content) pushHistory({ content: { ...content }, selectedLayerIds: [layer.id] });
    },
    [layer.id, updateLayerPatch, content]
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
};

const GroupComponent: FC<{ layer: GroupLayer }> = ({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const updateLayerPatch = useEditorStore((s) => s.updateLayerPatch);
  const content = useEditorStore((s) => s.content);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
      if (content) pushHistory({ content: { ...content }, selectedLayerIds: [layer.id] });
    },
    [layer.id, updateLayerPatch, content]
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
      {layer.children.map((child) => {
        // Generate a key that includes content hash for text layers
        const childKey = child.type === 'text'
          ? `${child.id}-${child.text}`
          : child.id;
        return <LayerRenderer key={childKey} layer={child} />;
      })}
    </Group>
  );
};

const SvgComponent: FC<{ layer: SvgLayer }> = ({ layer }) => {
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const updateLayerPatch = useEditorStore((s) => s.updateLayerPatch);
  const content = useEditorStore((s) => s.content);

  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const blob = new Blob([layer.svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImage(img);
    };
    return () => {
      img.onload = null;
      URL.revokeObjectURL(url);
    };
  }, [layer.svgData]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      updateLayerPatch(layer.id, { x: e.target.x(), y: e.target.y() });
      if (content) pushHistory({ content: { ...content }, selectedLayerIds: [layer.id] });
    },
    [layer.id, updateLayerPatch, content]
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
};

export const LayerRenderer: FC<LayerRendererProps> = ({ layer }) => {
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
};
