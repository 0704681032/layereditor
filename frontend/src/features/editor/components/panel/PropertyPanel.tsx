import { type FC, useCallback, memo } from 'react';
import { InputNumber, Input, ColorPicker, Space, Typography, Divider, Button, Alert, Slider, Select, Switch } from 'antd';
import { UngroupOutlined, AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../store/editorStore';
import { findLayerById } from '../../utils/layerTreeOperations';
import { hasEditableTemplateForImage } from '../../data/imageTemplates';
import { useShallow } from 'zustand/react/shallow';
import type { TextLayer, RectLayer, ImageLayer, SvgLayer, GroupLayer, EditorLayer, EllipseLayer, LineLayer, StarLayer, PolygonLayer, ShadowEffect } from '../../types';

const { Text } = Typography;

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

const LAYER_TYPE_LABELS: Record<string, string> = {
  rect: 'Rectangle', ellipse: 'Ellipse', text: 'Text', image: 'Image',
  svg: 'SVG', group: 'Group', line: 'Line', star: 'Star', polygon: 'Polygon',
};

// Type guards
function isTextLayer(layer: EditorLayer): layer is TextLayer { return layer.type === 'text'; }
function isRectLayer(layer: EditorLayer): layer is RectLayer { return layer.type === 'rect'; }
function isImageLayer(layer: EditorLayer): layer is ImageLayer { return layer.type === 'image'; }
function isSvgLayer(layer: EditorLayer): layer is SvgLayer { return layer.type === 'svg'; }
function isGroupLayer(layer: EditorLayer): layer is GroupLayer { return layer.type === 'group'; }
function isEllipseLayer(layer: EditorLayer): layer is EllipseLayer { return layer.type === 'ellipse'; }
function isLineLayer(layer: EditorLayer): layer is LineLayer { return layer.type === 'line'; }
function isStarLayer(layer: EditorLayer): layer is StarLayer { return layer.type === 'star'; }
function isPolygonLayer(layer: EditorLayer): layer is PolygonLayer { return layer.type === 'polygon'; }
function hasFillProp(layer: EditorLayer): boolean { return ['rect', 'ellipse', 'star', 'polygon', 'text'].includes(layer.type); }
function hasStrokeProp(layer: EditorLayer): boolean { return ['rect', 'ellipse', 'star', 'polygon', 'line'].includes(layer.type); }

// Section header
const SectionHeader: FC<{ title: string }> = ({ title }) => (
  <div style={{
    fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--text-tertiary)', marginBottom: 8, marginTop: 12,
  }}>
    {title}
  </div>
);

// Row helper
const Row: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
    {children}
  </div>
);

// Inline row for two fields
const InlineRow: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    {children}
  </div>
);

const Field: FC<{ label: string; children: React.ReactNode; flex?: number }> = ({ label, children, flex = 1 }) => (
  <div style={{ flex }}>
    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>{label}</div>
    {children}
  </div>
);

// Common properties panel
const CommonProperties: FC<{
  layer: { name: string; x: number; y: number; rotation?: number; opacity?: number };
  onUpdate: (field: string, value: unknown) => void;
}> = memo(({ layer, onUpdate }) => (
  <>
    <Row label="Name">
      <Input size="small" value={layer.name} onChange={(e) => onUpdate('name', e.target.value)}
        style={{ borderRadius: 6 }} />
    </Row>
    <Row label="Position">
      <InlineRow>
        <Field label="X">
          <InputNumber size="small" value={layer.x} onChange={(v) => onUpdate('x', v ?? 0)} style={{ width: '100%' }} />
        </Field>
        <Field label="Y">
          <InputNumber size="small" value={layer.y} onChange={(v) => onUpdate('y', v ?? 0)} style={{ width: '100%' }} />
        </Field>
      </InlineRow>
    </Row>
    <Row label="Rotation">
      <InputNumber size="small" value={layer.rotation ?? 0} onChange={(v) => onUpdate('rotation', v ?? 0)}
        style={{ width: '100%' }} addonAfter="°" />
    </Row>
    <Row label={`Opacity ${Math.round((layer.opacity ?? 1) * 100)}%`}>
      <Slider min={0} max={100} value={Math.round((layer.opacity ?? 1) * 100)}
        onChange={(v) => onUpdate('opacity', v / 100)} size="small" />
    </Row>
  </>
));

const SizeProperties: FC<{
  width?: number; height?: number; onUpdate: (field: string, value: unknown) => void;
}> = memo(({ width, height, onUpdate }) => (
  <Row label="Size">
    <InlineRow>
      <Field label="W">
        <InputNumber size="small" value={width} onChange={(v) => onUpdate('width', v ?? 0)} style={{ width: '100%' }} min={1} />
      </Field>
      <Field label="H">
        <InputNumber size="small" value={height} onChange={(v) => onUpdate('height', v ?? 0)} style={{ width: '100%' }} min={1} />
      </Field>
    </InlineRow>
  </Row>
));

const FillProperties: FC<{
  fill: string | undefined; onUpdate: (field: string, value: unknown) => void;
}> = memo(({ fill, onUpdate }) => (
  <Row label="Fill">
    <ColorPicker value={fill || '#000000'} onChange={(_, hex) => onUpdate('fill', hex)}
      style={{ borderRadius: 6 }} />
  </Row>
));

const StrokeProperties: FC<{
  stroke?: string; strokeWidth?: number; cornerRadius?: number;
  showCornerRadius?: boolean; onUpdate: (field: string, value: unknown) => void;
}> = memo(({ stroke, strokeWidth, cornerRadius, showCornerRadius, onUpdate }) => (
  <>
    <Row label="Stroke">
      <InlineRow>
        <Field label="Color" flex={0}>
          <ColorPicker value={stroke || 'transparent'} onChange={(_, hex) => onUpdate('stroke', hex)} />
        </Field>
        <Field label="Width">
          <InputNumber size="small" value={strokeWidth ?? 0} onChange={(v) => onUpdate('strokeWidth', v ?? 0)} min={0} max={20} style={{ width: '100%' }} />
        </Field>
      </InlineRow>
    </Row>
    {showCornerRadius && (
      <Row label="Corner Radius">
        <InputNumber size="small" value={cornerRadius ?? 0} onChange={(v) => onUpdate('cornerRadius', v ?? 0)} style={{ width: '100%' }} min={0} />
      </Row>
    )}
  </>
));

const ShadowProperties: FC<{
  shadow?: ShadowEffect; onUpdate: (field: string, value: unknown) => void;
}> = memo(({ shadow, onUpdate }) => {
  const enabled = shadow?.enabled ?? false;
  const handleShadowUpdate = (field: keyof ShadowEffect, value: unknown) => {
    onUpdate('shadow', {
      ...shadow, enabled: shadow?.enabled ?? false,
      offsetX: shadow?.offsetX ?? 4, offsetY: shadow?.offsetY ?? 4,
      blur: shadow?.blur ?? 12, color: shadow?.color ?? 'rgba(0,0,0,0.2)',
      [field]: value,
    } as ShadowEffect);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>Drop Shadow</span>
        <Switch size="small" checked={enabled} onChange={(v) => handleShadowUpdate('enabled', v)} />
      </div>
      {enabled && (
        <>
          <InlineRow>
            <Field label="Color">
              <ColorPicker value={shadow?.color ?? 'rgba(0,0,0,0.2)'} onChange={(_, hex) => handleShadowUpdate('color', hex)} />
            </Field>
            <Field label="Blur">
              <InputNumber size="small" value={shadow?.blur ?? 12} onChange={(v) => handleShadowUpdate('blur', v ?? 0)} style={{ width: '100%' }} min={0} />
            </Field>
          </InlineRow>
          <div style={{ height: 6 }} />
          <InlineRow>
            <Field label="X">
              <InputNumber size="small" value={shadow?.offsetX ?? 4} onChange={(v) => handleShadowUpdate('offsetX', v ?? 0)} style={{ width: '100%' }} />
            </Field>
            <Field label="Y">
              <InputNumber size="small" value={shadow?.offsetY ?? 4} onChange={(v) => handleShadowUpdate('offsetY', v ?? 0)} style={{ width: '100%' }} />
            </Field>
          </InlineRow>
        </>
      )}
    </div>
  );
});

const TextProperties: FC<{
  layer: TextLayer; onUpdate: (field: string, value: unknown) => void;
}> = memo(({ layer, onUpdate }) => {
  const isBold = layer.fontStyle?.includes('bold') ?? false;
  const isItalic = layer.fontStyle?.includes('italic') ?? false;

  const toggleBold = () => {
    let style = layer.fontStyle || 'normal';
    if (style === 'normal') style = 'bold';
    else if (style.includes('bold')) style = style.replace('bold', '').trim() || 'normal';
    else style = `bold ${style}`.trim();
    onUpdate('fontStyle', style);
  };
  const toggleItalic = () => {
    let style = layer.fontStyle || 'normal';
    if (style === 'normal') style = 'italic';
    else if (style.includes('italic')) style = style.replace('italic', '').trim() || 'normal';
    else style = `italic ${style}`.trim();
    onUpdate('fontStyle', style);
  };
  const toggleUnderline = () => {
    onUpdate('textDecoration', layer.textDecoration === 'underline' ? '' : 'underline');
  };

  return (
    <>
      <Row label="Text">
        <Input.TextArea size="small" value={layer.text} onChange={(e) => onUpdate('text', e.target.value)}
          autoSize={{ minRows: 1, maxRows: 4 }} style={{ borderRadius: 6 }} />
      </Row>
      <Row label="Font">
        <Select size="small" value={layer.fontFamily ?? 'Arial'} onChange={(v) => onUpdate('fontFamily', v)}
          style={{ width: '100%' }}
          options={FONT_FAMILIES.map((f) => ({ label: <span style={{ fontFamily: f.value, fontSize: 12 }}>{f.label}</span>, value: f.value }))} />
      </Row>
      <Row label="Size">
        <InputNumber size="small" value={layer.fontSize ?? 24} onChange={(v) => onUpdate('fontSize', v ?? 24)} style={{ width: '100%' }} min={1} />
      </Row>
      <Row label="Style">
        <Space size={4}>
          <Button size="small" type={isBold ? 'primary' : 'default'} icon={<BoldOutlined />} onClick={toggleBold}
            style={{ width: 32, height: 28, borderRadius: 6 }} />
          <Button size="small" type={isItalic ? 'primary' : 'default'} icon={<ItalicOutlined />} onClick={toggleItalic}
            style={{ width: 32, height: 28, borderRadius: 6 }} />
          <Button size="small" type={layer.textDecoration === 'underline' ? 'primary' : 'default'} icon={<UnderlineOutlined />} onClick={toggleUnderline}
            style={{ width: 32, height: 28, borderRadius: 6 }} />
        </Space>
      </Row>
      <Row label="Align">
        <Space size={4}>
          <Button size="small" type={layer.align === 'left' || !layer.align ? 'primary' : 'default'} icon={<AlignLeftOutlined />} onClick={() => onUpdate('align', 'left')}
            style={{ width: 32, height: 28, borderRadius: 6 }} />
          <Button size="small" type={layer.align === 'center' ? 'primary' : 'default'} icon={<AlignCenterOutlined />} onClick={() => onUpdate('align', 'center')}
            style={{ width: 32, height: 28, borderRadius: 6 }} />
          <Button size="small" type={layer.align === 'right' ? 'primary' : 'default'} icon={<AlignRightOutlined />} onClick={() => onUpdate('align', 'right')}
            style={{ width: 32, height: 28, borderRadius: 6 }} />
        </Space>
      </Row>
      <Row label="Line Height">
        <InputNumber size="small" value={layer.lineHeight ?? 1.2} onChange={(v) => onUpdate('lineHeight', v ?? 1.2)} style={{ width: '100%' }} min={0.5} max={5} step={0.1} />
      </Row>
      <Row label="Letter Spacing">
        <InputNumber size="small" value={layer.letterSpacing ?? 0} onChange={(v) => onUpdate('letterSpacing', v ?? 0)} style={{ width: '100%' }} min={-10} max={50} step={0.5} />
      </Row>
    </>
  );
});

const StarProperties: FC<{ layer: StarLayer; onUpdate: (field: string, value: unknown) => void; }> = memo(({ layer, onUpdate }) => (
  <>
    <Row label="Points">
      <InputNumber size="small" value={layer.numPoints ?? 5} onChange={(v) => onUpdate('numPoints', v ?? 5)} style={{ width: '100%' }} min={3} max={20} />
    </Row>
    <Row label="Inner Radius">
      <Slider min={0.1} max={0.9} step={0.05} value={layer.innerRadius ?? 0.4} onChange={(v) => onUpdate('innerRadius', v)} />
    </Row>
  </>
));

const PolygonProperties: FC<{ layer: PolygonLayer; onUpdate: (field: string, value: unknown) => void; }> = memo(({ layer, onUpdate }) => (
  <Row label="Sides">
    <InputNumber size="small" value={layer.sides ?? 6} onChange={(v) => onUpdate('sides', v ?? 6)} style={{ width: '100%' }} min={3} max={20} />
  </Row>
));

const SvgHint: FC<{ onUngroup: () => void }> = memo(({ onUngroup }) => (
  <div style={{ marginTop: 12 }}>
    <Alert type="info" message="SVG Layer" description="Click 'Ungroup' to convert into editable shapes."
      style={{ marginBottom: 8, fontSize: 12, borderRadius: 6 }} />
    <Button icon={<UngroupOutlined />} onClick={onUngroup} block style={{ borderRadius: 6 }}>Ungroup SVG</Button>
  </div>
));

const ImageHint: FC<{ onConvert: () => void }> = memo(({ onConvert }) => (
  <div style={{ marginTop: 12 }}>
    <Alert type="info" message="Editable Template" description="Convert to editable background + text layers."
      style={{ marginBottom: 8, fontSize: 12, borderRadius: 6 }} />
    <Button onClick={onConvert} block style={{ borderRadius: 6 }}>Convert to Editable</Button>
  </div>
));

export const PropertyPanel: FC = () => {
  const { content, selectedLayerIds, updateLayerPatchDebounced, ungroupLayer, convertImageLayerToTemplate, updateCanvas } = useEditorStore(
    useShallow((s) => ({
      content: s.content, selectedLayerIds: s.selectedLayerIds,
      updateLayerPatchDebounced: s.updateLayerPatchDebounced,
      ungroupLayer: s.ungroupLayer, convertImageLayerToTemplate: s.convertImageLayerToTemplate,
      updateCanvas: s.updateCanvas,
    }))
  );

  const selectedLayer = content && selectedLayerIds.length === 1
    ? findLayerById(content.layers, selectedLayerIds[0]) : null;

  const handleUpdate = useCallback(
    (field: string, value: unknown) => {
      if (selectedLayer) updateLayerPatchDebounced(selectedLayer.id, { [field]: value });
    },
    [selectedLayer, updateLayerPatchDebounced]
  );

  const handleUngroup = useCallback(() => {
    if (selectedLayer && isSvgLayer(selectedLayer)) ungroupLayer(selectedLayer.id);
  }, [selectedLayer, ungroupLayer]);

  const handleConvertImage = useCallback(() => {
    if (selectedLayer && isImageLayer(selectedLayer)) convertImageLayerToTemplate(selectedLayer.id);
  }, [selectedLayer, convertImageLayerToTemplate]);

  if (!content) return null;

  // Canvas properties when nothing selected
  if (!selectedLayer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          padding: '10px 12px 8px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-panel-header)',
        }}>
          <span style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
            Canvas
          </span>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <Row label="Background">
            <ColorPicker value={content.canvas.background} onChange={(_, hex) => updateCanvas({ background: hex })} />
          </Row>
          <Row label="Canvas Size">
            <InlineRow>
              <Field label="Width">
                <InputNumber size="small" value={content.canvas.width} onChange={(v) => updateCanvas({ width: v ?? 1200 })} style={{ width: '100%' }} min={100} />
              </Field>
              <Field label="Height">
                <InputNumber size="small" value={content.canvas.height} onChange={(v) => updateCanvas({ height: v ?? 800 })} style={{ width: '100%' }} min={100} />
              </Field>
            </InlineRow>
          </Row>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px 8px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel-header)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
          Properties
        </span>
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 4,
          background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 500,
        }}>
          {LAYER_TYPE_LABELS[selectedLayer.type] || selectedLayer.type}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}>
        <SectionHeader title="Transform" />
        <CommonProperties layer={selectedLayer} onUpdate={handleUpdate} />

        {!isTextLayer(selectedLayer) && (
          <SizeProperties width={selectedLayer.width} height={selectedLayer.height} onUpdate={handleUpdate} />
        )}

        {/* Appearance */}
        {(hasFillProp(selectedLayer) || hasStrokeProp(selectedLayer)) && (
          <>
            <Divider style={{ margin: '4px 0' }} />
            <SectionHeader title="Appearance" />
            {hasFillProp(selectedLayer) && 'fill' in selectedLayer && (
              <FillProperties fill={(selectedLayer as any).fill} onUpdate={handleUpdate} />
            )}
            {hasStrokeProp(selectedLayer) && (
              <StrokeProperties
                stroke={(selectedLayer as any).stroke}
                strokeWidth={(selectedLayer as any).strokeWidth}
                cornerRadius={(selectedLayer as RectLayer).cornerRadius}
                showCornerRadius={isRectLayer(selectedLayer)}
                onUpdate={handleUpdate}
              />
            )}
          </>
        )}

        {/* Text */}
        {isTextLayer(selectedLayer) && (
          <>
            <Divider style={{ margin: '4px 0' }} />
            <SectionHeader title="Typography" />
            <TextProperties layer={selectedLayer} onUpdate={handleUpdate} />
          </>
        )}

        {/* Shape-specific */}
        {isStarLayer(selectedLayer) && (
          <>
            <Divider style={{ margin: '4px 0' }} />
            <SectionHeader title="Star" />
            <StarProperties layer={selectedLayer} onUpdate={handleUpdate} />
          </>
        )}
        {isPolygonLayer(selectedLayer) && (
          <>
            <Divider style={{ margin: '4px 0' }} />
            <SectionHeader title="Polygon" />
            <PolygonProperties layer={selectedLayer} onUpdate={handleUpdate} />
          </>
        )}

        {/* Effects */}
        <Divider style={{ margin: '4px 0' }} />
        <SectionHeader title="Effects" />
        <ShadowProperties shadow={selectedLayer.shadow} onUpdate={handleUpdate} />

        {/* Special hints */}
        {isSvgLayer(selectedLayer) && <SvgHint onUngroup={handleUngroup} />}
        {isImageLayer(selectedLayer) && hasEditableTemplateForImage(selectedLayer.src, selectedLayer.name) && (
          <ImageHint onConvert={handleConvertImage} />
        )}
      </div>
    </div>
  );
};
