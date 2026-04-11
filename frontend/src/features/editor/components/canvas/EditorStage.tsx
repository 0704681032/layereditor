import { type FC, useCallback, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';
import { LayerRenderer } from './LayerRenderer';
import { SelectionTransformer } from './SelectionTransformer';
import { GridOverlay } from './GridOverlay';
import { useShallow } from 'zustand/react/shallow';

export const EditorStage: FC = () => {
  const { content, zoom, offsetX, offsetY, setViewport, selectLayers, setStageRef, showGrid, theme } = useEditorStore(
    useShallow((s) => ({
      content: s.content, zoom: s.zoom, offsetX: s.offsetX, offsetY: s.offsetY,
      setViewport: s.setViewport, selectLayers: s.selectLayers, setStageRef: s.setStageRef,
      showGrid: s.showGrid, theme: s.theme,
    }))
  );

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setContainerSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setStageRef(stageRef.current);
    return () => { setStageRef(null); };
  }, [setStageRef]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = { x: (pointer.x - offsetX) / oldScale, y: (pointer.y - offsetY) / oldScale };
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.05;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));
      setViewport(clampedScale, pointer.x - mousePointTo.x * clampedScale, pointer.y - mousePointTo.y * clampedScale);
    },
    [zoom, offsetX, offsetY, setViewport]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) selectLayers([]);
    },
    [selectLayers]
  );

  if (!content) return null;

  const isDark = theme === 'dark';

  return (
    <div ref={containerRef}
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stage
        ref={stageRef as never}
        width={containerSize.width}
        height={containerSize.height}
        scaleX={zoom} scaleY={zoom}
        x={offsetX} y={offsetY}
        onWheel={handleWheel}
        onClick={handleStageClick}
        draggable
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) setViewport(zoom, e.target.x(), e.target.y());
        }}
      >
        <Layer>
          {/* Canvas white area with subtle shadow */}
          <Rect x={0} y={0} width={content.canvas.width} height={content.canvas.height}
            fill={content.canvas.background}
            shadowColor={isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)'}
            shadowBlur={isDark ? 30 : 20}
            shadowOffsetX={0}
            shadowOffsetY={isDark ? 6 : 4}
            shadowEnabled={true}
            listening={false}
          />
          {/* Grid overlay */}
          {showGrid && <GridOverlay width={content.canvas.width} height={content.canvas.height} />}
          {/* Layers */}
          {content.layers.map((layer) => <LayerRenderer key={layer.id} layer={layer} />)}
          {/* Selection transformer */}
          <SelectionTransformer />
        </Layer>
      </Stage>
    </div>
  );
};
