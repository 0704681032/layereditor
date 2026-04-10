import { type FC, useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';

export const SelectionTransformer: FC = () => {
  const trRef = useRef<Konva.Transformer>(null);
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);

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
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedLayerIds]);

  return (
    <Transformer
      ref={trRef as never}
      name="transformer"
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      }}
    />
  );
};
