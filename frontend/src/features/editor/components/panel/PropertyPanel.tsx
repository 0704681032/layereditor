import { type FC, useCallback, memo } from 'react';
import { InputNumber, Input, ColorPicker, Space, Typography, Divider, Button, Alert, Slider, Select } from 'antd';
import { UngroupOutlined, AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../store/editorStore';
import { findLayerById } from '../../utils/layerTreeOperations';
import { hasEditableTemplateForImage } from '../../data/imageTemplates';
import { useShallow } from 'zustand/react/shallow';
import type { TextLayer, RectLayer, ImageLayer, SvgLayer, GroupLayer, EditorLayer } from '../../types';

const { Text } = Typography;

// Font families available for selection
const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS' },
  { label: 'monospace', value: 'monospace' },
  { label: 'serif', value: 'serif' },
  { label: 'sans-serif', value: 'sans-serif' },
];

// Type guards
function isTextLayer(layer: EditorLayer): layer is TextLayer {
  return layer.type === 'text';
}

function isRectLayer(layer: EditorLayer): layer is RectLayer {
  return layer.type === 'rect';
}

function isImageLayer(layer: EditorLayer): layer is ImageLayer {
  return layer.type === 'image';
}

function isSvgLayer(layer: EditorLayer): layer is SvgLayer {
  return layer.type === 'svg';
}

function isGroupLayer(layer: EditorLayer): layer is GroupLayer {
  return layer.type === 'group';
}

// Common properties panel
const CommonProperties: FC<{
  layer: { name: string; x: number; y: number; rotation?: number; opacity?: number };
  onUpdate: (field: string, value: unknown) => void;
}> = memo(({ layer, onUpdate }) => (
  <>
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Name</Text>
      <Input
        size="small"
        value={layer.name}
        onChange={(e) => onUpdate('name', e.target.value)}
        style={{ marginTop: 4 }}
      />
    </div>

    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Position</Text>
      <Space style={{ marginTop: 4, width: '100%' }} size={8}>
        <div style={{ flex: 1 }}>
          <Text style={{ fontSize: 11 }}>X</Text>
          <InputNumber
            size="small"
            value={layer.x}
            onChange={(v) => onUpdate('x', v ?? 0)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Text style={{ fontSize: 11 }}>Y</Text>
          <InputNumber
            size="small"
            value={layer.y}
            onChange={(v) => onUpdate('y', v ?? 0)}
            style={{ width: '100%' }}
          />
        </div>
      </Space>
    </div>

    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Rotation</Text>
      <InputNumber
        size="small"
        value={layer.rotation ?? 0}
        onChange={(v) => onUpdate('rotation', v ?? 0)}
        style={{ marginTop: 4, width: '100%' }}
        addonAfter="deg"
      />
    </div>

    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Opacity: {Math.round((layer.opacity ?? 1) * 100)}%</Text>
      <Slider
        min={0}
        max={100}
        value={Math.round((layer.opacity ?? 1) * 100)}
        onChange={(v) => onUpdate('opacity', v / 100)}
        size="small"
      />
    </div>
  </>
));

// Size properties panel
const SizeProperties: FC<{
  width?: number; height?: number;
  onUpdate: (field: string, value: unknown) => void;
}> = memo(({ width, height, onUpdate }) => (
  <div style={{ marginBottom: 8 }}>
    <Text type="secondary" style={{ fontSize: 12 }}>Size</Text>
    <Space style={{ marginTop: 4, width: '100%' }} size={8}>
      <div style={{ flex: 1 }}>
        <Text style={{ fontSize: 11 }}>W</Text>
        <InputNumber
          size="small"
          value={width}
          onChange={(v) => onUpdate('width', v ?? 0)}
          style={{ width: '100%' }}
          min={1}
        />
      </div>
      <div style={{ flex: 1 }}>
        <Text style={{ fontSize: 11 }}>H</Text>
        <InputNumber
          size="small"
          value={height}
          onChange={(v) => onUpdate('height', v ?? 0)}
          style={{ width: '100%' }}
          min={1}
        />
      </div>
    </Space>
  </div>
));

// Fill properties panel
const FillProperties: FC<{
  fill: string | undefined;
  onUpdate: (field: string, value: unknown) => void;
}> = memo(({ fill, onUpdate }) => (
  <div style={{ marginBottom: 8 }}>
    <Text type="secondary" style={{ fontSize: 12 }}>Fill</Text>
    <div style={{ marginTop: 4 }}>
      <ColorPicker
        value={fill || '#000000'}
        onChange={(_, hex) => onUpdate('fill', hex)}
      />
    </div>
  </div>
));

// Stroke properties panel for rect
const StrokeProperties: FC<{
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  onUpdate: (field: string, value: unknown) => void;
}> = memo(({ stroke, strokeWidth, cornerRadius, onUpdate }) => (
  <>
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Stroke Color</Text>
      <div style={{ marginTop: 4 }}>
        <ColorPicker
          value={stroke || 'transparent'}
          onChange={(_, hex) => onUpdate('stroke', hex)}
        />
      </div>
    </div>
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Stroke Width</Text>
      <InputNumber
        size="small"
        value={strokeWidth ?? 0}
        onChange={(v) => onUpdate('strokeWidth', v ?? 0)}
        style={{ marginTop: 4, width: '100%' }}
        min={0}
        max={20}
      />
    </div>
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Corner Radius</Text>
      <InputNumber
        size="small"
        value={cornerRadius ?? 0}
        onChange={(v) => onUpdate('cornerRadius', v ?? 0)}
        style={{ marginTop: 4, width: '100%' }}
        min={0}
      />
    </div>
  </>
));

// Text properties panel
const TextProperties: FC<{
  layer: TextLayer;
  onUpdate: (field: string, value: unknown) => void;
}> = memo(({ layer, onUpdate }) => (
  <>
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Text</Text>
      <Input
        size="small"
        value={layer.text}
        onChange={(e) => onUpdate('text', e.target.value)}
        style={{ marginTop: 4 }}
      />
    </div>
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Font Family</Text>
      <Select
        size="small"
        value={layer.fontFamily ?? 'Arial'}
        onChange={(v) => onUpdate('fontFamily', v)}
        style={{ marginTop: 4, width: '100%' }}
        options={FONT_FAMILIES.map((f) => ({
          label: <span style={{ fontFamily: f.value }}>{f.label}</span>,
          value: f.value,
        }))}
      />
    </div>
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Font Size</Text>
      <InputNumber
        size="small"
        value={layer.fontSize ?? 24}
        onChange={(v) => onUpdate('fontSize', v ?? 24)}
        style={{ marginTop: 4, width: '100%' }}
        min={1}
      />
    </div>
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Alignment</Text>
      <Space style={{ marginTop: 4 }}>
        <Button
          size="small"
          type={layer.align === 'left' || !layer.align ? 'primary' : 'default'}
          icon={<AlignLeftOutlined />}
          onClick={() => onUpdate('align', 'left')}
        />
        <Button
          size="small"
          type={layer.align === 'center' ? 'primary' : 'default'}
          icon={<AlignCenterOutlined />}
          onClick={() => onUpdate('align', 'center')}
        />
        <Button
          size="small"
          type={layer.align === 'right' ? 'primary' : 'default'}
          icon={<AlignRightOutlined />}
          onClick={() => onUpdate('align', 'right')}
        />
      </Space>
    </div>
  </>
));

// SVG hint panel
const SvgHint: FC<{ onUngroup: () => void }> = memo(({ onUngroup }) => (
  <div style={{ marginBottom: 16 }}>
    <Alert
      type="info"
      message="SVG Layer"
      description="Click 'Ungroup' to convert this SVG into editable layers (text, shapes)."
      style={{ marginBottom: 8, fontSize: 12 }}
    />
    <Button icon={<UngroupOutlined />} onClick={onUngroup} block>
      Ungroup SVG
    </Button>
  </div>
));

// Image hint panel
const ImageHint: FC<{ onConvert: () => void }> = memo(({ onConvert }) => (
  <div style={{ marginBottom: 16 }}>
    <Alert
      type="info"
      message="Editable Template"
      description="This image can be converted to background + text layers. After conversion, you can edit the title directly."
      style={{ marginBottom: 8, fontSize: 12 }}
    />
    <Button onClick={onConvert} block>
      Convert to Editable Layers
    </Button>
  </div>
));

export const PropertyPanel: FC = () => {
  const { content, selectedLayerIds, updateLayerPatchDebounced, ungroupLayer, convertImageLayerToTemplate } = useEditorStore(
    useShallow((s) => ({
      content: s.content,
      selectedLayerIds: s.selectedLayerIds,
      updateLayerPatchDebounced: s.updateLayerPatchDebounced,
      ungroupLayer: s.ungroupLayer,
      convertImageLayerToTemplate: s.convertImageLayerToTemplate,
    }))
  );

  const selectedLayer = content && selectedLayerIds.length === 1
    ? findLayerById(content.layers, selectedLayerIds[0])
    : null;

  // Use debounced patch for all property updates
  const handleUpdate = useCallback(
    (field: string, value: unknown) => {
      if (selectedLayer) {
        updateLayerPatchDebounced(selectedLayer.id, { [field]: value });
      }
    },
    [selectedLayer, updateLayerPatchDebounced]
  );

  const handleUngroup = useCallback(() => {
    if (selectedLayer && isSvgLayer(selectedLayer)) {
      ungroupLayer(selectedLayer.id);
    }
  }, [selectedLayer, ungroupLayer]);

  const handleConvertImage = useCallback(() => {
    if (selectedLayer && isImageLayer(selectedLayer)) {
      convertImageLayerToTemplate(selectedLayer.id);
    }
  }, [selectedLayer, convertImageLayerToTemplate]);

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

      {/* Common properties (name, position, rotation, opacity) */}
      <CommonProperties layer={selectedLayer} onUpdate={handleUpdate} />

      {/* Size properties (rect, image, svg, group) */}
      {(isRectLayer(selectedLayer) || isImageLayer(selectedLayer) || isSvgLayer(selectedLayer) || isGroupLayer(selectedLayer)) && (
        <SizeProperties width={selectedLayer.width} height={selectedLayer.height} onUpdate={handleUpdate} />
      )}

      {/* Fill color (rect, text) */}
      {(isRectLayer(selectedLayer) || isTextLayer(selectedLayer)) && selectedLayer.fill && (
        <FillProperties fill={selectedLayer.fill} onUpdate={handleUpdate} />
      )}

      {/* Stroke properties (rect only) */}
      {isRectLayer(selectedLayer) && (
        <StrokeProperties
          stroke={selectedLayer.stroke}
          strokeWidth={selectedLayer.strokeWidth}
          cornerRadius={selectedLayer.cornerRadius}
          onUpdate={handleUpdate}
        />
      )}

      {/* Text properties */}
      {isTextLayer(selectedLayer) && (
        <TextProperties layer={selectedLayer} onUpdate={handleUpdate} />
      )}

      {/* SVG hint */}
      {isSvgLayer(selectedLayer) && (
        <SvgHint onUngroup={handleUngroup} />
      )}

      {/* Image hint */}
      {isImageLayer(selectedLayer) && hasEditableTemplateForImage(selectedLayer.src, selectedLayer.name) && (
        <ImageHint onConvert={handleConvertImage} />
      )}
    </div>
  );
};
