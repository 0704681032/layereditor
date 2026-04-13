import { type FC, useCallback, useEffect, useState } from 'react';
import { Drawer, Typography, Button, Space, Tag, Spin, Modal, App, Input } from 'antd';
import { HistoryOutlined, UndoOutlined, ClockCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { createRevision, listRevisions, restoreRevision, type RevisionItem } from '../../api/revision';
import { getDocument } from '../../api/document';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';

const { Text } = Typography;

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export const HistoryPanel: FC<HistoryPanelProps> = ({ open, onClose }) => {
  const { message } = App.useApp();
  const { documentId, setDocument, updateContent } = useEditorStore(
    useShallow((s) => ({
      documentId: s.documentId,
      setDocument: s.setDocument,
      updateContent: s.updateContent,
    }))
  );

  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');

  const loadRevisions = useCallback(() => {
    if (!documentId) return;
    setLoading(true);
    listRevisions(documentId)
      .then(setRevisions)
      .catch((err) => {
        console.error('Failed to load revisions:', err);
        message.error('Failed to load revision history');
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  useEffect(() => {
    if (open) loadRevisions();
  }, [open, loadRevisions]);

  const handleCreateRevision = useCallback(async () => {
    if (!documentId) return;
    setSaving(true);
    try {
      await createRevision(documentId, revisionMessage || undefined);
      message.success('Version saved');
      setRevisionMessage('');
      setSaveModalOpen(false);
      loadRevisions();
    } catch (err) {
      console.error('Failed to create revision:', err);
      message.error('Failed to save version');
    } finally {
      setSaving(false);
    }
  }, [documentId, revisionMessage, loadRevisions]);

  const handleRestore = useCallback(
    (versionNo: number) => {
      if (!documentId) return;

      Modal.confirm({
        title: 'Restore Version',
        content: `Are you sure you want to restore to version ${versionNo}? This will replace the current content.`,
        okText: 'Restore',
        cancelText: 'Cancel',
        onOk: async () => {
          setRestoring(versionNo);
          try {
            await restoreRevision(documentId, versionNo);
            // Reload document from server to get the restored content
            const doc = await getDocument(documentId);
            updateContent(doc.content);
            message.success('Version restored');
            loadRevisions();
          } catch (err) {
            console.error('Failed to restore:', err);
            message.error('Failed to restore version');
          } finally {
            setRestoring(null);
          }
        },
      });
    },
    [documentId, updateContent, loadRevisions]
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>Version History</span>
        </Space>
      }
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          size="small"
          onClick={() => setSaveModalOpen(true)}
          style={{ borderRadius: 6 }}
        >
          Save Version
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : revisions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <ClockCircleOutlined style={{ fontSize: 48, color: 'var(--text-tertiary)' }} />
          <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
            No version history yet
          </Text>
          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            Click "Save Version" to create your first version snapshot
          </Text>
        </div>
      ) : (
        revisions.map((rev) => (
          <div
            key={rev.id}
            style={{
              padding: '12px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color="blue">v{rev.versionNo}</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {formatDate(rev.createdAt)}
              </Text>
            </div>
            {rev.message && (
              <Text style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                {rev.message}
              </Text>
            )}
            <div style={{ marginTop: 8 }}>
              <Button
                size="small"
                icon={<UndoOutlined />}
                onClick={() => handleRestore(rev.versionNo)}
                loading={restoring === rev.versionNo}
                style={{ borderRadius: 6 }}
              >
                Restore
              </Button>
            </div>
          </div>
        ))
      )}

      <Modal
        title="Save Version"
        open={saveModalOpen}
        onOk={handleCreateRevision}
        onCancel={() => { setSaveModalOpen(false); setRevisionMessage(''); }}
        okText="Save"
        confirmLoading={saving}
        width={400}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Save a snapshot of the current document. You can restore to this version later.
          </Text>
        </div>
        <Input
          placeholder="Add a note for this version (optional)"
          value={revisionMessage}
          onChange={(e) => setRevisionMessage(e.target.value)}
          maxLength={200}
          showCount
          onPressEnter={handleCreateRevision}
        />
      </Modal>
    </Drawer>
  );
};
