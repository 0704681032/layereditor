import { type ChangeEvent, type FC, useEffect, useRef, useState } from 'react';
import { Button, Card, List, Typography, message, Empty, Spin, Modal, Input, Popconfirm, Checkbox, Select, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, UploadOutlined, DeleteOutlined, FormOutlined, FileImageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listDocuments, createDocument, importDocumentFromFile, updateDocumentTitle, deleteDocument, deleteDocuments } from '@/features/editor/api/document';

const { Title, Text } = Typography;

const CANVAS_PRESETS = [
  { label: 'Social Media Post', value: 'social', width: 1080, height: 1080, bg: '#FFFFFF', icon: '📱' },
  { label: 'Instagram Story', value: 'story', width: 1080, height: 1920, bg: '#FFFFFF', icon: '📸' },
  { label: 'Facebook Cover', value: 'fb', width: 1640, height: 856, bg: '#FFFFFF', icon: '🖥' },
  { label: 'Presentation (16:9)', value: 'slides', width: 1920, height: 1080, bg: '#FFFFFF', icon: '📊' },
  { label: 'A4 Portrait', value: 'a4', width: 794, height: 1123, bg: '#FFFFFF', icon: '📄' },
  { label: 'Banner (728x90)', value: 'banner', width: 728, height: 90, bg: '#FFFFFF', icon: '🖼' },
  { label: 'Custom', value: 'custom', width: 1200, height: 800, bg: '#FFFFFF', icon: '✏' },
];

export const DocumentListPage: FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<{ id: number; title: string } | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('Untitled Document');
  const [selectedPreset, setSelectedPreset] = useState('social');
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(800);

  const fetchDocuments = async () => {
    try { setLoading(true); setDocuments(await listDocuments()); }
    catch (e: any) { message.error(e.message || 'Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleCreate = async () => {
    try {
      const preset = CANVAS_PRESETS.find(p => p.value === selectedPreset) ?? CANVAS_PRESETS[0];
      const width = selectedPreset === 'custom' ? customWidth : preset.width;
      const height = selectedPreset === 'custom' ? customHeight : preset.height;
      const bg = preset.bg;
      const doc = await createDocument({
        title: newTitle || 'Untitled Document', schemaVersion: 1,
        content: { schemaVersion: 1, canvas: { width, height, background: bg }, layers: [] },
      });
      message.success('Document created');
      setCreateModalOpen(false);
      navigate(`/editor/${doc.id}`);
    } catch (e: any) { message.error(e.message || 'Failed to create document'); }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const doc = await importDocumentFromFile(file);
      message.success('Import completed');
      navigate(`/editor/${doc.id}`);
    } catch (e: any) { message.error(e.message || 'Import failed'); }
    finally { setImporting(false); event.target.value = ''; }
  };

  const openEditModal = (doc: { id: number; title: string }, e: React.MouseEvent) => {
    e.stopPropagation(); setEditingDoc(doc); setEditTitle(doc.title); setEditModalOpen(true);
  };

  const handleSaveTitle = async () => {
    if (!editingDoc || !editTitle.trim()) return;
    try { setSaving(true); await updateDocumentTitle(editingDoc.id, editTitle.trim()); message.success('Title updated'); setEditModalOpen(false); fetchDocuments(); }
    catch (e: any) { message.error(e.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await deleteDocument(id); message.success('Deleted'); setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; }); fetchDocuments(); }
    catch (e: any) { message.error(e.message || 'Delete failed'); }
  };

  const toggleSelection = (id: number, checked: boolean) => {
    setSelectedIds(prev => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next; });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(documents.map(d => d.id)) : new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    try { await deleteDocuments(Array.from(selectedIds)); message.success(`Deleted ${selectedIds.size} documents`); setSelectedIds(new Set()); fetchDocuments(); }
    catch (e: any) { message.error(e.message || 'Batch delete failed'); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#fafafa',
      backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(22, 119, 255, 0.03) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(114, 46, 209, 0.03) 0%, transparent 50%)',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
        <input ref={importInputRef} type="file" accept="image/*,.svg,image/svg+xml" style={{ display: 'none' }} onChange={handleImport} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
              Layer Editor
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>Professional design tool for everyone</Text>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedIds.size > 0 && (
              <Popconfirm title={`Delete ${selectedIds.size} selected documents?`} onConfirm={handleBatchDelete} okText="Delete" cancelText="Cancel">
                <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }}>
                  Delete ({selectedIds.size})
                </Button>
              </Popconfirm>
            )}
            <Button icon={<UploadOutlined />} loading={importing} onClick={() => importInputRef.current?.click()}
              style={{ borderRadius: 8 }}>
              Import
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setNewTitle('Untitled Document'); setSelectedPreset('social'); setCreateModalOpen(true); }}
              style={{ borderRadius: 8, fontWeight: 500 }}>
              New Document
            </Button>
          </div>
        </div>

        {/* Document grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
        ) : documents.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: '#fff', borderRadius: 16, border: '1px dashed #d9d9d9',
          }}>
            <FileImageOutlined style={{ fontSize: 48, color: '#d0d0d0', marginBottom: 16 }} />
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 16, color: '#666' }}>No documents yet</Text>
            </div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>Create your first design document to get started</Text>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}
              style={{ borderRadius: 10, height: 44, paddingInline: 28, fontWeight: 500 }}>
              Create Document
            </Button>
          </div>
        ) : (
          <>
            {documents.length > 0 && (
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Checkbox checked={selectedIds.size === documents.length} indeterminate={selectedIds.size > 0 && selectedIds.size < documents.length} onChange={(e) => toggleAll(e.target.checked)}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Select all ({documents.length})</Text>
                </Checkbox>
              </div>
            )}
            <List grid={{ gutter: 20, xs: 1, sm: 2, md: 3, lg: 3 }}
              dataSource={documents}
              renderItem={(doc) => {
                const preset = CANVAS_PRESETS.find(p => `${p.width}x${p.height}` === `${doc.content?.canvas?.width ?? 0}x${doc.content?.canvas?.height ?? 0}`);
                return (
                  <List.Item>
                    <Card
                      hoverable
                      onClick={() => navigate(`/editor/${doc.id}`)}
                      style={{
                        cursor: 'pointer', borderRadius: 12,
                        border: selectedIds.has(doc.id) ? '2px solid #1677ff' : '1px solid #f0f0f0',
                        overflow: 'hidden', transition: 'all 0.2s ease',
                      }}
                      styles={{ body: { padding: 0 } }}
                    >
                      {/* Canvas preview area */}
                      <div style={{
                        background: '#f8f8f8',
                        borderBottom: '1px solid #f0f0f0',
                        height: 140,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{
                          background: doc.content?.canvas?.background ?? '#fff',
                          width: '60%', height: '70%',
                          border: '1px solid #e8e8e8',
                          borderRadius: 4,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}>
                          {(!doc.content?.layers || doc.content.layers.length === 0) ? (
                            <FileImageOutlined style={{ fontSize: 24, color: '#d0d0d0' }} />
                          ) : (
                            <Text type="secondary" style={{ fontSize: 11 }}>{doc.content.layers.length} layers</Text>
                          )}
                        </div>
                        {preset && (
                          <Tag style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 10, margin: 0, borderRadius: 4, background: 'rgba(255,255,255,0.9)' }}>
                            {preset.icon} {preset.width}×{preset.height}
                          </Tag>
                        )}
                        {/* Selection checkbox */}
                        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                          <Checkbox checked={selectedIds.has(doc.id)} onChange={(e) => toggleSelection(doc.id, e.target.checked)} onClick={(e) => e.stopPropagation()} />
                        </div>
                      </div>
                      {/* Info */}
                      <div style={{ padding: '12px 14px 8px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          v{doc.currentVersion} · {formatDate(doc.updatedAt)}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ padding: '4px 14px 12px', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Button size="small" type="text" icon={<FormOutlined />} onClick={(e) => openEditModal(doc, e)}
                          style={{ borderRadius: 6, fontSize: 12, color: '#999' }}>
                          Rename
                        </Button>
                        <Popconfirm title="Delete this document?" onConfirm={(e) => handleDelete(doc.id, e as unknown as React.MouseEvent)} onCancel={(e) => e?.stopPropagation()} okText="Delete" cancelText="Cancel">
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()}
                            style={{ borderRadius: 6, fontSize: 12 }}>
                            Delete
                          </Button>
                        </Popconfirm>
                      </div>
                    </Card>
                  </List.Item>
                );
              }}
            />
          </>
        )}

        {/* Create Dialog */}
        <Modal title="New Document" open={createModalOpen} onOk={handleCreate} onCancel={() => setCreateModalOpen(false)}
          okText="Create" width={480}
          styles={{ content: { borderRadius: 16 } }}
        >
          <div style={{ marginBottom: 20 }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Document Title</Text>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Enter document title" style={{ marginTop: 6, borderRadius: 8 }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Canvas Preset</Text>
            <Select value={selectedPreset} onChange={setSelectedPreset} style={{ width: '100%', marginTop: 6 }}
              options={CANVAS_PRESETS.map(p => ({ label: `${p.icon} ${p.label} (${p.width}×${p.height})`, value: p.value }))} />
          </div>
          {selectedPreset === 'custom' && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Size</Text>
              <Space style={{ marginTop: 6, width: '100%' }} size={12}>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#999' }}>Width</Text>
                  <InputNumber value={customWidth} onChange={(v) => setCustomWidth(v ?? 1200)} style={{ width: '100%' }} min={100} max={4096} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#999' }}>Height</Text>
                  <InputNumber value={customHeight} onChange={(v) => setCustomHeight(v ?? 800)} style={{ width: '100%' }} min={100} max={4096} />
                </div>
              </Space>
            </div>
          )}
        </Modal>

        {/* Rename Dialog */}
        <Modal title="Rename Document" open={editModalOpen} onOk={handleSaveTitle} onCancel={() => setEditModalOpen(false)}
          confirmLoading={saving} okText="Save" cancelText="Cancel"
          styles={{ content: { borderRadius: 16 } }}
        >
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Enter document title" onPressEnter={handleSaveTitle}
            style={{ borderRadius: 8 }} />
        </Modal>
      </div>
    </div>
  );
};
