import { type FC, useEffect, useState } from 'react';
import { Button, Checkbox, Pagination, Popconfirm, Typography, App, Spin } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, LayoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from './hooks/useDocuments';
import { useDocumentSelection } from './hooks/useDocumentSelection';
import { useDocumentActions } from './hooks/useDocumentActions';
import { DocumentCard, EmptyState, CreateDocumentModal, RenameDocumentModal, TemplateBrowserModal } from './components';
import type { DocumentTemplate } from './data';

const { Title, Text } = Typography;

interface EditingDoc {
  id: number;
  title: string;
}

export const DocumentListPage: FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();

  // Documents data
  const { documents, loading, total, page, pageSize, fetchDocuments } = useDocuments();

  // Selection state
  const { selectedIds, toggleSelection, toggleAll, clearSelection, hasSelection } = useDocumentSelection();

  // Actions
  const {
    importing,
    importInputRef,
    saving,
    handleImport,
    handleCreate,
    handleCreateFromTemplate,
    handleRename,
    handleDelete,
    handleBatchDelete,
  } = useDocumentActions(() => {
    fetchDocuments(page, pageSize);
    clearSelection();
  });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('Untitled Document');
  const [selectedPreset, setSelectedPreset] = useState('social');
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(800);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<EditingDoc | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  // Initial load
  useEffect(() => {
    fetchDocuments(0, pageSize);
  }, []);

  // Pagination handler
  const handlePageChange = (newPage: number, newSize: number) => {
    fetchDocuments(newPage - 1, newSize);
  };

  // Edit modal handlers
  const openEditModal = (doc: EditingDoc, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditModalOpen(true);
  };

  const handleSaveTitle = async () => {
    if (!editingDoc || !editTitle.trim()) return;
    await handleRename(editingDoc.id, editTitle);
    setEditModalOpen(false);
  };

  // Delete handler wrapper
  const handleDeleteWrapper = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await handleDelete(id);
    toggleSelection(id, false);
  };

  // Batch delete handler
  const onBatchDelete = async () => {
    await handleBatchDelete(Array.from(selectedIds));
  };

  // Template creation
  const onSelectTemplate = async (template: DocumentTemplate) => {
    setCreatingTemplate(true);
    await handleCreateFromTemplate(template);
    setCreatingTemplate(false);
    setTemplateModalOpen(false);
  };

  // Create document
  const onCreate = async () => {
    await handleCreate(newTitle, selectedPreset, customWidth, customHeight);
    setCreateModalOpen(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        <input
          ref={importInputRef}
          type="file"
          accept="image/*,.svg,image/svg+xml"
          style={{ display: 'none' }}
          onChange={handleImport}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 40,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 16,
            padding: '20px 28px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              织
            </div>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#1a1a2e' }}>
                织梦平台
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                专业设计工具，人人可用
              </Text>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {hasSelection && (
              <Popconfirm
                title={`Delete ${selectedIds.size} selected documents?`}
                onConfirm={onBatchDelete}
                okText="Delete"
                cancelText="Cancel"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  style={{ borderRadius: 10, height: 40, fontWeight: 500 }}
                >
                  Delete ({selectedIds.size})
                </Button>
              </Popconfirm>
            )}
            <Button
              icon={<UploadOutlined />}
              loading={importing}
              onClick={() => importInputRef.current?.click()}
              style={{ borderRadius: 10, height: 40, fontWeight: 500, borderColor: '#d9d9d9' }}
            >
              Import
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setNewTitle('Untitled Document');
                setSelectedPreset('social');
                setCreateModalOpen(true);
              }}
              style={{
                borderRadius: 10,
                height: 40,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              New Document
            </Button>
            <Button
              icon={<LayoutOutlined />}
              onClick={() => setTemplateModalOpen(true)}
              style={{ borderRadius: 10, height: 40, fontWeight: 500, borderColor: '#d9d9d9' }}
            >
              Templates
            </Button>
          </div>
        </div>

        {/* Document grid */}
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: 80,
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 16,
            }}
          >
            <Spin size="large" />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState onCreate={() => setCreateModalOpen(true)} onTemplate={() => setTemplateModalOpen(true)} />
        ) : (
          <>
            {documents.length > 0 && (
              <div
                style={{
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: 12,
                  padding: '12px 20px',
                }}
              >
                <Checkbox
                  checked={selectedIds.size === documents.length && documents.length > 0}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < documents.length}
                  onChange={(e) => toggleAll(e.target.checked, documents.map((d) => d.id))}
                >
                  <Text style={{ fontSize: 14, fontWeight: 500 }}>Select all ({documents.length})</Text>
                </Checkbox>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  · {total} total documents
                </Text>
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 24,
              }}
            >
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  selected={selectedIds.has(doc.id)}
                  onSelect={toggleSelection}
                  onEdit={openEditModal}
                  onDelete={handleDeleteWrapper}
                  onClick={() => navigate(`/editor/${doc.id}`)}
                />
              ))}
            </div>
            {total > pageSize && (
              <div
                style={{
                  marginTop: 32,
                  display: 'flex',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <Pagination
                  current={page + 1}
                  pageSize={pageSize}
                  total={total}
                  onChange={handlePageChange}
                  showSizeChanger
                  pageSizeOptions={['10', '20', '50', '100']}
                  showTotal={(t, range) => `${range[0]}-${range[1]} of ${t}`}
                />
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <CreateDocumentModal
          open={createModalOpen}
          title={newTitle}
          preset={selectedPreset}
          customWidth={customWidth}
          customHeight={customHeight}
          onTitleChange={setNewTitle}
          onPresetChange={setSelectedPreset}
          onCustomWidthChange={setCustomWidth}
          onCustomHeightChange={setCustomHeight}
          onCreate={onCreate}
          onClose={() => setCreateModalOpen(false)}
        />

        <RenameDocumentModal
          open={editModalOpen}
          title={editTitle}
          saving={saving}
          onTitleChange={setEditTitle}
          onSave={handleSaveTitle}
          onClose={() => setEditModalOpen(false)}
        />

        <TemplateBrowserModal
          open={templateModalOpen}
          creating={creatingTemplate}
          onClose={() => setTemplateModalOpen(false)}
          onSelect={onSelectTemplate}
        />

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
              © 2026 织梦平台 · 让设计触手可及
            </Text>
          </div>
          <div>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              Powered by React + Konva + Spring Boot
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};