import { type FC, useCallback, useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';

export const SelectionTransformer: FC = () => {
  const trRef = useRef<Konva.Transformer>(null);
  const { selectedLayerIds, updateLayerPatch } = useEditorStore(
    useShallow((s) => ({
      selectedLayerIds: s.selectedLayerIds,
      updateLayerPatch: s.updateLayerPatch,
    }))
  );

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const stage = tr.getStage();
    if (!stage) return;

    if (selectedLayerIds.length === 0) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    const nodes = selectedLayerIds
      .map((id: string) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedLayerIds]);

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const layerId = node.id();
      if (!layerId) return;

      // Get the new dimensions (scale is baked into width/height)
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const newWidth = Math.max(5, (node.width() ?? 100) * scaleX);
      const newHeight = Math.max(5, (node.height() ?? 100) * scaleY);

      updateLayerPatch(layerId, {
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      });

      // Reset scale since we've baked it into width/height
      node.scaleX(1);
      node.scaleY(1);
    },
    [updateLayerPatch]
  );

  return (
    <Transformer
      ref={trRef as never}
      name="transformer"
      rotateEnabled={true}
      keepRatio={false}
      onTransformEnd={handleTransformEnd}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      }}
    />
  );
};
