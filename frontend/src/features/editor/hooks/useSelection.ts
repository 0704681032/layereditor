import { useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

export function useSelection() {
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);
  const selectLayers = useEditorStore((s) => s.selectLayers);

  const handleSelect = useCallback(
    (id: string, e?: { shiftKey?: boolean }) => {
      if (e?.shiftKey) {
        const ids = selectedLayerIds.includes(id)
          ? selectedLayerIds.filter((i) => i !== id)
          : [...selectedLayerIds, id];
        selectLayers(ids);
      } else {
        selectLayers([id]);
      }
    },
    [selectedLayerIds, selectLayers]
  );

  const clearSelection = useCallback(() => selectLayers([]), [selectLayers]);

  return { selectedLayerIds, handleSelect, clearSelection };
}
