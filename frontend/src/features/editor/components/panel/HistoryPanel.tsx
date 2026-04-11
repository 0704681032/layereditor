import { type FC, useCallback, useEffect, useState } from 'react';
import { Drawer, List, Typography, Button, Space, Tag, Spin, Modal, message } from 'antd';
import { HistoryOutlined, UndoOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { listRevisions, restoreRevision, type RevisionItem } from '../../api/revision';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';

const { Text } = Typography;

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export const HistoryPanel: FC<HistoryPanelProps> = ({ open, onClose }) => {
  const { documentId, setDocument } = useEditorStore(
    useShallow((s) => ({
      documentId: s.documentId,
      setDocument: s.setDocument,
    }))
  );

  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (open && documentId) {
      setLoading(true);
      listRevisions(documentId)
        .then(setRevisions)
        .catch((err) => {
          console.error('Failed to load revisions:', err);
          message.error('Failed to load revision history');
        })
        .finally(() => setLoading(false));
    }
  }, [open, documentId]);

  const handleRestore = useCallback(
    (versionNo: number) => {
      if (!documentId) return;

      Modal.confirm({
        title: 'Restore Version',
        content: `Are you sure you want to restore to version ${versionNo}? This will replace the current content.`,
        okText: 'Restore',
        cancelText: 'Cancel',
        onOk: async () => {
          setRestoring(true);
          try {
            await restoreRevision(documentId, versionNo);
            message.success('Version restored successfully');
            // Refresh the document - we need to reload from server
            // In a real app, we'd fetch the latest content here
            onClose();
          } catch (err) {
            console.error('Failed to restore:', err);
            message.error('Failed to restore version');
          } finally {
            setRestoring(false);
          }
        },
      });
    },
    [documentId, onClose]
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
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : revisions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <ClockCircleOutlined style={{ fontSize: 48, color: 'var(--text-tertiary)' }} />
          <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
            No revision history available
          </Text>
        </div>
      ) : (
        <List
          dataSource={revisions}
          renderItem={(rev) => (
            <List.Item
              style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ width: '100%' }}>
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
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Button
                    size="small"
                    icon={<UndoOutlined />}
                    onClick={() => handleRestore(rev.versionNo)}
                    loading={restoring}
                    style={{ borderRadius: 6 }}
                  >
                    Restore
                  </Button>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};