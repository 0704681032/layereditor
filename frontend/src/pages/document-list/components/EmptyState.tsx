import { type FC } from 'react';
import { Button, Space, Typography } from 'antd';
import { PlusOutlined, LayoutOutlined, RocketOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface EmptyStateProps {
  onCreate: () => void;
  onTemplate: () => void;
}

export const EmptyState: FC<EmptyStateProps> = ({ onCreate, onTemplate }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '60px 40px',
      background: 'rgba(255,255,255,0.98)',
      borderRadius: 20,
      boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
    }}
  >
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: '0 8px 24px rgba(102,126,234,0.3)',
      }}
    >
      <RocketOutlined style={{ fontSize: 36, color: '#fff' }} />
    </div>
    <div style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: 600, color: '#1a1a2e' }}>
        Ready to create?
      </Text>
    </div>
    <Text type="secondary" style={{ display: 'block', marginBottom: 32, fontSize: 15 }}>
      Start with a blank canvas or choose from our templates
    </Text>
    <Space size={16}>
      <Button
        type="primary"
        size="large"
        icon={<PlusOutlined />}
        onClick={onCreate}
        style={{
          borderRadius: 12,
          height: 48,
          paddingInline: 32,
          fontWeight: 600,
          fontSize: 15,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(102,126,234,0.4)',
        }}
      >
        New Document
      </Button>
      <Button
        size="large"
        icon={<LayoutOutlined />}
        onClick={onTemplate}
        style={{
          borderRadius: 12,
          height: 48,
          paddingInline: 32,
          fontWeight: 600,
          fontSize: 15,
          borderColor: '#d9d9d9',
          background: '#fff',
        }}
      >
        Browse Templates
      </Button>
    </Space>
  </div>
);