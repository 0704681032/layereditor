import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FC } from 'react';
import { Button, Popover, Spin, Tooltip, Upload, message, Typography } from 'antd';
import { AppstoreOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons';
import { listAssets, uploadAsset } from '../../api/asset';
import { useEditorStore } from '../../store/editorStore';
import { generateId } from '../../utils/layerTree';
import { hasEditableTemplateForImage, buildEditableTemplateFromImageLayer, getPrimaryTemplateTextLayerId } from '../../data/imageTemplates';
import type { AssetResponse, EditorLayer, ImageLayer } from '../../types';
import { AssetCard } from './AssetCard';

const { Text } = Typography;

interface AssetPickerProps {
  documentId?: number;
}

export const AssetPicker: FC<AssetPickerProps> = ({ documentId }) => {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const content = useEditorStore((s) => s.content);
  const addLayer = useEditorStore((s) => s.addLayer);
  const selectLayers = useEditorStore((s) => s.selectLayers);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAssets({ documentId, kind: 'image', page: 0, size: 50 });
      setAssets(res.items);
    } catch (e) {
      console.error('Failed to load assets:', e);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (open) {
      loadAssets();
    }
  }, [open, loadAssets]);

  const handleAssetSelect = useCallback(
    (asset: AssetResponse) => {
      if (!content) return;

      const maxWidth = Math.max(content.canvas.width - 100, 1);
      const maxHeight = Math.max(content.canvas.height - 100, 1);
      const assetWidth = asset.width || 200;
      const assetHeight = asset.height || 200;
      const scale = Math.min(maxWidth / assetWidth, maxHeight / assetHeight, 1);

      const baseImageLayer: ImageLayer = {
        id: generateId(),
        type: 'image',
        name: asset.filename,
        x: 50,
        y: 50,
        width: Math.round(assetWidth * scale),
        height: Math.round(assetHeight * scale),
        assetId: asset.id,
        visible: true,
        locked: false,
      };

      // 如果是可解析的海报图片，自动创建可编辑图层组
      let layer: EditorLayer;
      let selectedIds: string[];
      if (hasEditableTemplateForImage(asset.url, asset.filename)) {
        const groupLayer = buildEditableTemplateFromImageLayer(baseImageLayer);
        if (groupLayer) {
          layer = groupLayer;
          selectedIds = [getPrimaryTemplateTextLayerId(groupLayer)];
        } else {
          layer = baseImageLayer;
          selectedIds = [layer.id];
        }
      } else {
        layer = baseImageLayer;
        selectedIds = [layer.id];
      }

      addLayer(layer);
      selectLayers(selectedIds);
      setOpen(false);
    },
    [content, addLayer, selectLayers]
  );

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const asset = await uploadAsset(file, documentId, 'image');
        setAssets((prev) => [asset, ...prev]);
        message.success('上传成功');
      } catch (e) {
        console.error('Upload failed:', e);
        message.error('上传失败');
      } finally {
        setUploading(false);
      }
      return false;
    },
    [documentId]
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      trigger="click"
      content={
        <div style={{ width: 480 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: 600, fontSize: 13 }}>素材库</Text>
            <div style={{ display: 'flex', gap: 8 }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleUpload}
              >
                <Button size="small" icon={<UploadOutlined />} loading={uploading}>
                  上传
                </Button>
              </Upload>
              <Button size="small" icon={<ReloadOutlined />} onClick={loadAssets} loading={loading}>
                刷新
              </Button>
            </div>
          </div>

          {loading && assets.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin />
            </div>
          ) : assets.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              暂无素材，请上传图片
            </div>
          ) : (
            <div
              style={{
                maxHeight: 320,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              {assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onClick={() => handleAssetSelect(asset)} />
              ))}
            </div>
          )}
        </div>
      }
    >
      <Tooltip title="素材库">
        <Button icon={<AppstoreOutlined />} size="small" />
      </Tooltip>
    </Popover>
  );
};