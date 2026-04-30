import { type FC } from 'react';
import { Input, Modal, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface RenameDocumentModalProps {
  open: boolean;
  title: string;
  saving: boolean;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const RenameDocumentModal: FC<RenameDocumentModalProps> = ({
  open,
  title,
  saving,
  onTitleChange,
  onSave,
  onClose,
}) => (
  <Modal
    title={
      <span style={{ fontWeight: 600 }}>
        <EditOutlined style={{ marginRight: 8, color: '#667eea' }} />
        Rename Document
      </span>
    }
    open={open}
    onOk={onSave}
    onCancel={onClose}
    confirmLoading={saving}
    okText="Save"
    cancelText="Cancel"
    okButtonProps={{
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: 10,
        fontWeight: 600,
      },
    }}
    cancelButtonProps={{ style: { borderRadius: 10 } }}
  >
    <Text style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginBottom: 8, display: 'block' }}>
      New Title
    </Text>
    <Input
      value={title}
      onChange={(e) => onTitleChange(e.target.value)}
      placeholder="Enter document title"
      onPressEnter={onSave}
      style={{ borderRadius: 10, height: 44 }}
    />
  </Modal>
);