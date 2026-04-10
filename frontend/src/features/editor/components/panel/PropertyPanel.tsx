import { type FC, useCallback } from 'react';
import { InputNumber, Input, ColorPicker, Space, Typography, Divider, Button, Alert } from 'antd';
import { UngroupOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../store/editorStore';
import { findLayerById } from '../../store/editorStore';
import { pushHistory } from '../../store/history';
import { hasEditableTemplateForImage } from '../../data/imageTemplates';

const { Text } = Typography;

export const PropertyPanel: FC = () => {
  const content = useEditorStore((s) => s.content);
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);
  const updateLayerPatch = useEditorStore((s) => s.updateLayerPatch);
  const ungroupLayer = useEditorStore((s) => s.ungroupLayer);
  const convertImageLayerToTemplate = useEditorStore((s) => s.convertImageLayerToTemplate);

  const selectedLayer = content && selectedLayerIds.length === 1
    ? findLayerById(content.layers, selectedLayerIds[0])
    : null;

  const handleUpdate = useCallback(
    (field: string, value: unknown) => {
      if (selectedLayer) {
        updateLayerPatch(selectedLayer.id, { [field]: value });
      }
    },
    [selectedLayer, updateLayerPatch]
  );

  const handleUngroup = useCallback(() => {
    if (selectedLayer && selectedLayer.type === 'svg') {
      ungroupLayer(selectedLayer.id);
      if (content) {
        pushHistory({ content: { ...content }, selectedLayerIds: [selectedLayer.id] });
      }
    }
  }, [selectedLayer, ungroupLayer, content]);

  const handleConvertImage = useCallback(() => {
    if (selectedLayer && selectedLayer.type === 'image') {
      convertImageLayerToTemplate(selectedLayer.id);
      if (content) {
        pushHistory({ content: { ...content }, selectedLayerIds: [selectedLayer.id] });
      }
    }
  }, [selectedLayer, convertImageLayerToTemplate, content]);

  if (!selectedLayer) {
    return (
      <div style={{ padding: 16, color: '#999', textAlign: 'center', marginTop: 40 }}>
        Select a layer to edit properties
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13, color: '#666' }}>Properties</div>
      <Divider style={{ margin: '8px 0' }} />

      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Name</Text>
        <Input
          size="small"
          value={selectedLayer.name}
          onChange={(e) => handleUpdate('name', e.target.value)}
          style={{ marginTop: 4 }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Position</Text>
        <Space style={{ marginTop: 4, width: '100%' }} size={8}>
          <div>
            <Text style={{ fontSize: 11 }}>X</Text>
            <InputNumber
              size="small"
              value={selectedLayer.x}
              onChange={(v) => handleUpdate('x', v ?? 0)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Text style={{ fontSize: 11 }}>Y</Text>
            <InputNumber
              size="small"
              value={selectedLayer.y}
              onChange={(v) => handleUpdate('y', v ?? 0)}
              style={{ width: '100%' }}
            />
          </div>
        </Space>
      </div>

      {(selectedLayer.type === 'rect' || selectedLayer.type === 'image' || selectedLayer.type === 'group') && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Size</Text>
          <Space style={{ marginTop: 4, width: '100%' }} size={8}>
            <div>
              <Text style={{ fontSize: 11 }}>W</Text>
              <InputNumber
                size="small"
                value={selectedLayer.width}
                onChange={(v) => handleUpdate('width', v ?? 0)}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Text style={{ fontSize: 11 }}>H</Text>
              <InputNumber
                size="small"
                value={selectedLayer.height}
                onChange={(v) => handleUpdate('height', v ?? 0)}
                style={{ width: '100%' }}
              />
            </div>
          </Space>
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Rotation</Text>
        <InputNumber
          size="small"
          value={selectedLayer.rotation ?? 0}
          onChange={(v) => handleUpdate('rotation', v ?? 0)}
          style={{ marginTop: 4, width: '100%' }}
          addonAfter="deg"
        />
      </div>

      {(selectedLayer.type === 'rect' || selectedLayer.type === 'text') && 'fill' in selectedLayer && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Fill</Text>
          <div style={{ marginTop: 4 }}>
            <ColorPicker
              value={selectedLayer.fill as string || '#000000'}
              onChange={(_, hex) => handleUpdate('fill', hex)}
            />
          </div>
        </div>
      )}

      {selectedLayer.type === 'text' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Text</Text>
            <Input
              size="small"
              value={(selectedLayer as { text: string }).text}
              onChange={(e) => handleUpdate('text', e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Font Size</Text>
            <InputNumber
              size="small"
              value={(selectedLayer as { fontSize?: number }).fontSize ?? 24}
              onChange={(v) => handleUpdate('fontSize', v ?? 24)}
              style={{ marginTop: 4, width: '100%' }}
              min={1}
            />
          </div>
        </>
      )}

      {selectedLayer.type === 'svg' && (
        <div style={{ marginBottom: 16 }}>
          <Alert
            type="info"
            message="SVG Layer"
            description="Click 'Ungroup' to convert this SVG into editable layers (text, shapes)."
            style={{ marginBottom: 8, fontSize: 12 }}
          />
          <Button
            icon={<UngroupOutlined />}
            onClick={handleUngroup}
            block
          >
            Ungroup SVG
          </Button>
        </div>
      )}

      {selectedLayer.type === 'image' && hasEditableTemplateForImage(selectedLayer.src, selectedLayer.name) && (
        <div style={{ marginBottom: 16 }}>
          <Alert
            type="info"
            message="可解析海报"
            description="这张预设海报支持转换为背景 + 文本图层。转换后可直接修改主标题，比如把“极致体验”改成“美好体验”。"
            style={{ marginBottom: 8, fontSize: 12 }}
          />
          <Button onClick={handleConvertImage} block>
            解析为可编辑图层
          </Button>
        </div>
      )}
    </div>
  );
};
