import { type FC, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';
import { LayerRenderer } from './LayerRenderer';
import { SelectionTransformer } from './SelectionTransformer';
import { setExportStage } from '../../hooks/useExportImage';

export const EditorStage: FC = () => {
  const content = useEditorStore((s) => s.content);
  const zoom = useEditorStore((s) => s.zoom);
  const offsetX = useEditorStore((s) => s.offsetX);
  const offsetY = useEditorStore((s) => s.offsetY);
  const setViewport = useEditorStore((s) => s.setViewport);
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    setExportStage(stageRef.current);
    return () => {
      setExportStage(null);
    };
  }, []);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - offsetX) / oldScale,
        y: (pointer.y - offsetY) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.05;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      const newOffsetX = pointer.x - mousePointTo.x * clampedScale;
      const newOffsetY = pointer.y - mousePointTo.y * clampedScale;

      setViewport(clampedScale, newOffsetX, newOffsetY);
    },
    [zoom, offsetX, offsetY, setViewport]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        selectLayers([]);
      }
    },
    [selectLayers]
  );

  if (!content) return null;

  const containerWidth = 800;
  const containerHeight = 600;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stage
        ref={stageRef as never}
        width={containerWidth}
        height={containerHeight}
        scaleX={zoom}
        scaleY={zoom}
        x={offsetX}
        y={offsetY}
        onWheel={handleWheel}
        onClick={handleStageClick}
        draggable
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setViewport(zoom, e.target.x(), e.target.y());
          }
        }}
      >
        <Layer>
          {/* Canvas background */}
          <Rect
            x={0}
            y={0}
            width={content.canvas.width}
            height={content.canvas.height}
            fill={content.canvas.background}
            listening={false}
          />
          {/* Layers */}
          {content.layers.map((layer) => (
            <LayerRenderer key={layer.id} layer={layer} />
          ))}
          {/* Selection transformer */}
          <SelectionTransformer />
        </Layer>
      </Stage>
    </div>
  );
};
