import { type FC } from 'react';
import { Button, Card, Checkbox, Popconfirm, Tag } from 'antd';
import { DeleteOutlined, FormOutlined, FileImageOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { CANVAS_PRESETS, type CanvasPreset } from '../data';
import { formatDate } from '../utils/formatDate';

interface DocumentItem {
  id: number;
  title: string;
  currentVersion: number;
  updatedAt: string;
  content?: {
    canvas?: { width?: number; height?: number; background?: string };
    thumbnail?: string;
  };
}

interface DocumentCardProps {
  document: DocumentItem;
  selected: boolean;
  onSelect: (id: number, checked: boolean) => void;
  onEdit: (doc: DocumentItem, e: React.MouseEvent) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
  onClick: () => void;
}

export const DocumentCard: FC<DocumentCardProps> = ({
  document,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onClick,
}) => {
  const preset = CANVAS_PRESETS.find(
    (p: CanvasPreset) => `${p.width}x${p.height}` === `${document.content?.canvas?.width ?? 0}x${document.content?.canvas?.height ?? 0}`
  );

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderRadius: 16,
        border: selected ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.8)',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        boxShadow: selected
          ? '0 8px 32px rgba(102,126,234,0.25)'
          : '0 4px 16px rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.98)',
      }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Canvas preview area */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {document.content?.thumbnail ? (
          <img
            src={document.content.thumbnail}
            alt={document.title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 6,
            }}
          />
        ) : (
          <div
            style={{
              background: document.content?.canvas?.background ?? '#fff',
              width: '55%',
              height: '65%',
              border: '1px solid #e8e8e8',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <FileImageOutlined style={{ fontSize: 28, color: '#b0b0b0' }} />
          </div>
        )}
        {preset && (
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
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            }}
          >
            {preset.icon} {preset.width}×{preset.height}
          </Tag>
        )}
        {/* Selection checkbox */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 8,
            padding: '4px 8px',
          }}
        >
          <Checkbox
            checked={selected}
            onChange={(e) => onSelect(document.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '16px 18px 10px' }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 6,
            color: '#1a1a2e',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {document.title}
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          {formatDate(document.updatedAt)}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '4px 18px 14px',
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
          borderTop: '1px solid rgba(0,0,0,0.04)',
        }}
      >
        <Button
          size="small"
          type="text"
          icon={<FormOutlined />}
          onClick={(e) => onEdit(document, e)}
          style={{ borderRadius: 8, fontSize: 13, color: '#666', fontWeight: 500 }}
        >
          Rename
        </Button>
        <Popconfirm
          title="Delete this document?"
          onConfirm={(e) => onDelete(document.id, e as unknown as React.MouseEvent)}
          onCancel={(e) => e?.stopPropagation()}
          okText="Delete"
          cancelText="Cancel"
        >
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: 8, fontSize: 13, fontWeight: 500 }}
          >
            Delete
          </Button>
        </Popconfirm>
      </div>
    </Card>
  );
};