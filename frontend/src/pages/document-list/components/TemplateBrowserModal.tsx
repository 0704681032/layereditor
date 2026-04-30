import { type FC } from 'react';
import { Card, Modal, Spin, Tag, Typography } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { DOCUMENT_TEMPLATES, type DocumentTemplate } from '../data';

const { Text } = Typography;

interface TemplateBrowserModalProps {
  open: boolean;
  creating: boolean;
  onClose: () => void;
  onSelect: (template: DocumentTemplate) => void;
}

export const TemplateBrowserModal: FC<TemplateBrowserModalProps> = ({
  open,
  creating,
  onClose,
  onSelect,
}) => (
  <Modal
    title={
      <span style={{ fontWeight: 600 }}>
        <AppstoreOutlined style={{ marginRight: 8, color: '#667eea' }} />
        Choose a Template
      </span>
    }
    open={open}
    onCancel={onClose}
    footer={null}
    width={800}
  >
    <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14 }}>
      Start quickly with pre-designed layouts and styles
    </Text>
    {creating && (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
        <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
          Creating your document...
        </Text>
      </div>
    )}
    {!creating && (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 20,
        }}
      >
        {DOCUMENT_TEMPLATES.map((tpl) => (
          <Card
            key={tpl.id}
            hoverable
            onClick={() => onSelect(tpl)}
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid #f0f0f0',
              transition: 'all 0.2s ease',
            }}
            styles={{ body: { padding: 0 } }}
          >
            {/* Thumbnail preview */}
            <div
              style={{
                height: 140,
                background: tpl.thumbnailGradient ?? tpl.thumbnailColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative elements */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '12px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 4,
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: 70,
                    height: 5,
                    background: 'rgba(255,255,255,0.85)',
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: 60,
                    height: 4,
                    background: 'rgba(255,255,255,0.6)',
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: 40,
                    height: 16,
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: 8,
                    marginTop: 6,
                  }}
                />
              </div>
              <Tag
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  fontSize: 11,
                  margin: 0,
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.95)',
                  fontWeight: 500,
                }}
              >
                {tpl.canvas.width}×{tpl.canvas.height}
              </Tag>
            </div>
            {/* Info */}
            <div style={{ padding: '12px 14px 14px' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1a1a2e',
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {tpl.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#888',
                  marginBottom: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {tpl.description}
              </div>
              <Tag
                color="purple"
                style={{
                  fontSize: 11,
                  margin: 0,
                  borderRadius: 6,
                  fontWeight: 500,
                }}
              >
                {tpl.category}
              </Tag>
            </div>
          </Card>
        ))}
      </div>
    )}
  </Modal>
);