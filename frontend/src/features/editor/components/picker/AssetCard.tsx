import { type FC } from 'react';
import { Card, Typography } from 'antd';
import type { AssetResponse } from '../../types';

const { Text } = Typography;

interface AssetCardProps {
  asset: AssetResponse;
  onClick: () => void;
}

export const AssetCard: FC<AssetCardProps> = ({ asset, onClick }) => {
  return (
    <Card
      hoverable
      size="small"
      style={{ cursor: 'pointer' }}
      styles={{ body: { padding: 8 } }}
      onClick={onClick}
    >
      <div
        style={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: '#f5f5f5',
          borderRadius: 4,
        }}
      >
        <img
          src={asset.url}
          alt={asset.filename}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
      <Text ellipsis style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
        {asset.filename}
      </Text>
      {asset.width && asset.height && (
        <Text type="secondary" style={{ fontSize: 10 }}>
          {asset.width} × {asset.height}
        </Text>
      )}
    </Card>
  );
};