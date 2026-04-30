import { type FC } from 'react';
import { Input, InputNumber, Modal, Select, Space, Typography } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import { CANVAS_PRESETS } from '../data';

const { Text } = Typography;

interface CreateDocumentModalProps {
  open: boolean;
  title: string;
  preset: string;
  customWidth: number;
  customHeight: number;
  onTitleChange: (title: string) => void;
  onPresetChange: (preset: string) => void;
  onCustomWidthChange: (width: number) => void;
  onCustomHeightChange: (height: number) => void;
  onCreate: () => void;
  onClose: () => void;
}

export const CreateDocumentModal: FC<CreateDocumentModalProps> = ({
  open,
  title,
  preset,
  customWidth,
  customHeight,
  onTitleChange,
  onPresetChange,
  onCustomWidthChange,
  onCustomHeightChange,
  onCreate,
  onClose,
}) => (
  <Modal
    title={
      <span style={{ fontWeight: 600 }}>
        <FileAddOutlined style={{ marginRight: 8, color: '#667eea' }} />
        New Document
      </span>
    }
    open={open}
    onOk={onCreate}
    onCancel={onClose}
    okText="Create"
    width={480}
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
    <div style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#1a1a2e',
        }}
      >
        Document Title
      </Text>
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Enter document title"
        style={{ marginTop: 8, borderRadius: 10, height: 44 }}
      />
    </div>
    <div style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#1a1a2e',
        }}
      >
        Canvas Preset
      </Text>
      <Select
        value={preset}
        onChange={onPresetChange}
        style={{ width: '100%', marginTop: 8 }}
        options={CANVAS_PRESETS.map((p) => ({
          label: `${p.icon} ${p.label} (${p.width}×${p.height})`,
          value: p.value,
        }))}
      />
    </div>
    {preset === 'custom' && (
      <div>
        <Text
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#1a1a2e',
          }}
        >
          Custom Size (pixels)
        </Text>
        <Space style={{ marginTop: 8, width: '100%' }} size={16}>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>Width</Text>
            <InputNumber
              value={customWidth}
              onChange={(v) => onCustomWidthChange(v ?? 1200)}
              style={{ width: '100%', marginTop: 6, borderRadius: 8 }}
              min={100}
              max={4096}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>Height</Text>
            <InputNumber
              value={customHeight}
              onChange={(v) => onCustomHeightChange(v ?? 800)}
              style={{ width: '100%', marginTop: 6, borderRadius: 8 }}
              min={100}
              max={4096}
            />
          </div>
        </Space>
      </div>
    )}
  </Modal>
);