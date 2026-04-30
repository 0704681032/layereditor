import { useState, useCallback } from 'react';

interface UseDocumentSelectionReturn {
  selectedIds: Set<number>;
  toggleSelection: (id: number, checked: boolean) => void;
  toggleAll: (checked: boolean, allIds: number[]) => void;
  clearSelection: () => void;
  hasSelection: boolean;
}

export function useDocumentSelection(): UseDocumentSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelection = useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((checked: boolean, allIds: number[]) => {
    setSelectedIds(checked ? new Set(allIds) : new Set());
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    hasSelection: selectedIds.size > 0,
  };
}