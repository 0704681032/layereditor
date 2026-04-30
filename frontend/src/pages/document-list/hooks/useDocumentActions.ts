import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  createDocument,
  importDocumentFromFile,
  updateDocumentTitle,
  deleteDocument,
  deleteDocuments,
} from '@/features/editor/api/document';
import { CANVAS_PRESETS, DOCUMENT_TEMPLATES, type DocumentTemplate } from '../data';

interface UseDocumentActionsReturn {
  importing: boolean;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  saving: boolean;
  handleImport: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleCreate: (title: string, preset: string, customWidth: number, customHeight: number) => Promise<void>;
  handleCreateFromTemplate: (template: DocumentTemplate) => Promise<void>;
  handleRename: (id: number, title: string) => Promise<void>;
  handleDelete: (id: number) => Promise<void>;
  handleBatchDelete: (ids: number[]) => Promise<void>;
}

export function useDocumentActions(onRefresh: () => void): UseDocumentActionsReturn {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  function tid(): string {
    return 'layer_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  const handleImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        setImporting(true);
        const doc = await importDocumentFromFile(file);
        message.success('Import completed');
        navigate(`/editor/${doc.id}`);
      } catch (e: any) {
        message.error(e.message || 'Import failed');
      } finally {
        setImporting(false);
        event.target.value = '';
      }
    },
    [navigate, message]
  );

  const handleCreate = useCallback(
    async (title: string, preset: string, customWidth: number, customHeight: number) => {
      try {
        const presetData = CANVAS_PRESETS.find((p) => p.value === preset) ?? CANVAS_PRESETS[0];
        const width = preset === 'custom' ? customWidth : presetData.width;
        const height = preset === 'custom' ? customHeight : presetData.height;
        const bg = presetData.bg;
        const doc = await createDocument({
          title: title || 'Untitled Document',
          schemaVersion: 1,
          content: { schemaVersion: 1, canvas: { width, height, background: bg }, layers: [] },
        });
        message.success('Document created');
        navigate(`/editor/${doc.id}`);
      } catch (e: any) {
        message.error(e.message || 'Failed to create document');
      }
    },
    [navigate, message]
  );

  const handleCreateFromTemplate = useCallback(
    async (template: DocumentTemplate) => {
      try {
        const doc = await createDocument({
          title: template.name,
          schemaVersion: 1,
          content: {
            schemaVersion: 1,
            canvas: { ...template.canvas },
            layers: template.layers.map((l) => ({ ...l, id: tid() })),
          },
        });
        message.success(`Created from "${template.name}" template`);
        navigate(`/editor/${doc.id}`);
      } catch (e: any) {
        message.error(e.message || 'Failed to create document from template');
      }
    },
    [navigate, message]
  );

  const handleRename = useCallback(
    async (id: number, title: string) => {
      if (!title.trim()) return;
      try {
        setSaving(true);
        await updateDocumentTitle(id, title.trim());
        message.success('Title updated');
        onRefresh();
      } catch (e: any) {
        message.error(e.message || 'Update failed');
      } finally {
        setSaving(false);
      }
    },
    [onRefresh, message]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteDocument(id);
        message.success('Deleted');
        onRefresh();
      } catch (e: any) {
        message.error(e.message || 'Delete failed');
      }
    },
    [onRefresh, message]
  );

  const handleBatchDelete = useCallback(
    async (ids: number[]) => {
      if (ids.length === 0) return;
      try {
        await deleteDocuments(ids);
        message.success(`Deleted ${ids.length} documents`);
        onRefresh();
      } catch (e: any) {
        message.error(e.message || 'Batch delete failed');
      }
    },
    [onRefresh, message]
  );

  return {
    importing,
    importInputRef,
    saving,
    handleImport,
    handleCreate,
    handleCreateFromTemplate,
    handleRename,
    handleDelete,
    handleBatchDelete,
  };
}