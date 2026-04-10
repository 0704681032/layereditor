import { type ChangeEvent, type FC, useEffect, useRef, useState } from 'react';
import { Button, Card, List, Typography, message, Empty, Spin, Modal, Input, Popconfirm, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, UploadOutlined, DeleteOutlined, FormOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listDocuments, createDocument, importDocumentFromFile, updateDocumentTitle, deleteDocument, deleteDocuments } from '@/features/editor/api/document';

const { Title, Text } = Typography;

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

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const list = await listDocuments();
      setDocuments(list);
    } catch (e: any) {
      message.error(e.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreate = async () => {
    try {
      const doc = await createDocument({
        title: 'Untitled Document',
        schemaVersion: 1,
        content: {
          schemaVersion: 1,
          canvas: { width: 1200, height: 800, background: '#FFFFFF' },
          layers: [],
        },
      });
      message.success('Document created');
      navigate(`/editor/${doc.id}`);
    } catch (e: any) {
      message.error(e.message || 'Failed to create document');
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const doc = await importDocumentFromFile(file);
      message.success('解析完成，已创建文档');
      navigate(`/editor/${doc.id}`);
    } catch (e: any) {
      message.error(e.message || '上传解析失败');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const openEditModal = (doc: { id: number; title: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditModalOpen(true);
  };

  const handleSaveTitle = async () => {
    if (!editingDoc || !editTitle.trim()) return;
    try {
      setSaving(true);
      await updateDocumentTitle(editingDoc.id, editTitle.trim());
      message.success('标题已更新');
      setEditModalOpen(false);
      fetchDocuments();
    } catch (e: any) {
      message.error(e.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDocument(id);
      message.success('文档已删除');
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchDocuments();
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  };

  const toggleSelection = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(documents.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await deleteDocuments(Array.from(selectedIds));
      message.success(`已删除 ${selectedIds.size} 个文档`);
      setSelectedIds(new Set());
      fetchDocuments();
    } catch (e: any) {
      message.error(e.message || '批量删除失败');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <input
        ref={importInputRef}
        type="file"
        accept="image/*,.svg,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Layer Editor</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedIds.size > 0 && (
            <Popconfirm
              title={`确定删除选中的 ${selectedIds.size} 个文档吗？`}
              onConfirm={handleBatchDelete}
              okText="删除"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />}>
                删除选中 ({selectedIds.size})
              </Button>
            </Popconfirm>
          )}
          <Button
            icon={<UploadOutlined />}
            loading={importing}
            onClick={() => importInputRef.current?.click()}
          >
            上传解析
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New Document
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : documents.length === 0 ? (
        <Empty description="No documents yet. Create one to get started!" />
      ) : (
        <>
          {documents.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Checkbox
                checked={selectedIds.size === documents.length}
                indeterminate={selectedIds.size > 0 && selectedIds.size < documents.length}
                onChange={(e) => toggleAll(e.target.checked)}
              >
                全选 ({documents.length})
              </Checkbox>
            </div>
          )}
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
            dataSource={documents}
            renderItem={(doc) => (
              <List.Item>
                <Card
                  hoverable
                  onClick={() => navigate(`/editor/${doc.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                    <Checkbox
                      checked={selectedIds.has(doc.id)}
                      onChange={(e) => toggleSelection(doc.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <Card.Meta
                    title={doc.title}
                    description={
                      <div>
                        <Text type="secondary">v{doc.currentVersion}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(doc.updatedAt).toLocaleString()}
                        </Text>
                      </div>
                    }
                  />
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      icon={<FormOutlined />}
                      onClick={(e) => openEditModal(doc, e)}
                    >
                      重命名
                    </Button>
                    <Popconfirm
                      title="确定删除此文档吗？"
                      onConfirm={(e) => handleDelete(doc.id, e as unknown as React.MouseEvent)}
                      onCancel={(e) => e?.stopPropagation()}
                      okText="删除"
                      cancelText="取消"
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </>
      )}

      <Modal
        title="修改文档标题"
        open={editModalOpen}
        onOk={handleSaveTitle}
        onCancel={() => setEditModalOpen(false)}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="请输入文档标题"
          onPressEnter={handleSaveTitle}
        />
      </Modal>
    </div>
  );
};