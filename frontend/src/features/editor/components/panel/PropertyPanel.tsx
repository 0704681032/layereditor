import { type FC, useCallback, memo } from 'react';
import { InputNumber, Input, ColorPicker, Space, Typography, Divider, Button, Alert, Slider, Select, Switch, Tooltip, Dropdown } from 'antd';
import { UngroupOutlined, AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined, PlusOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../store/editorStore';
import { findLayerById } from '../../utils/layerTreeOperations';
import { hasEditableTemplateForImage } from '../../data/imageTemplates';
import { useShallow } from 'zustand/react/shallow';
import type { TextLayer, RectLayer, ImageLayer, SvgLayer, GroupLayer, EditorLayer, EllipseLayer, LineLayer, StarLayer, PolygonLayer, ShadowEffect, LayerFilters, GradientFill } from '../../types';

const { Text } = Typography;

const BLEND_MODES = [
  { label: 'Normal', value: 'normal' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Screen', value: 'screen' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Darken', value: 'darken' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Color Dodge', value: 'color-dodge' },
  { label: 'Color Burn', value: 'color-burn' },
  { label: 'Hard Light', value: 'hard-light' },
  { label: 'Soft Light', value: 'soft-light' },
  { label: 'Difference', value: 'difference' },
  { label: 'Exclusion', value: 'exclusion' },
  { label: 'Hue', value: 'hue' },
  { label: 'Saturation', value: 'saturation' },
  { label: 'Color', value: 'color' },
  { label: 'Luminosity', value: 'luminosity' },
];

// Google Fonts categories
const FONT_FAMILIES = [
  // System fonts
  { label: 'Arial', value: 'Arial', category: 'system' },
  { label: 'Helvetica', value: 'Helvetica', category: 'system' },
  { label: 'Times New Roman', value: 'Times New Roman', category: 'system' },
  { label: 'Georgia', value: 'Georgia', category: 'system' },
  { label: 'Courier New', value: 'Courier New', category: 'system' },
  { label: 'Verdana', value: 'Verdana', category: 'system' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS', category: 'system' },
  { label: 'Impact', value: 'Impact', category: 'system' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS', category: 'system' },
  // Sans-serif Google Fonts
  { label: 'Roboto', value: 'Roboto', category: 'sans-serif' },
  { label: 'Open Sans', value: 'Open Sans', category: 'sans-serif' },
  { label: 'Lato', value: 'Lato', category: 'sans-serif' },
  { label: 'Montserrat', value: 'Montserrat', category: 'sans-serif' },
  { label: 'Oswald', value: 'Oswald', category: 'sans-serif' },
  { label: 'Raleway', value: 'Raleway', category: 'sans-serif' },
  { label: 'Poppins', value: 'Poppins', category: 'sans-serif' },
  { label: 'Source Sans Pro', value: 'Source Sans Pro', category: 'sans-serif' },
  { label: 'Nunito', value: 'Nunito', category: 'sans-serif' },
  { label: 'Ubuntu', value: 'Ubuntu', category: 'sans-serif' },
  { label: 'Inter', value: 'Inter', category: 'sans-serif' },
  // Serif Google Fonts
  { label: 'Playfair Display', value: 'Playfair Display', category: 'serif' },
  { label: 'Merriweather', value: 'Merriweather', category: 'serif' },
  { label: 'Lora', value: 'Lora', category: 'serif' },
  { label: 'Bitter', value: 'Bitter', category: 'serif' },
  { label: 'Libre Baskerville', value: 'Libre Baskerville', category: 'serif' },
  // Display Google Fonts
  { label: 'Bebas Neue', value: 'Bebas Neue', category: 'display' },
  { label: 'Lobster', value: 'Lobster', category: 'display' },
  { label: 'Pacifico', value: 'Pacifico', category: 'display' },
  { label: 'Abril Fatface', value: 'Abril Fatface', category: 'display' },
  { label: 'Righteous', value: 'Righteous', category: 'display' },
  { label: 'Caveat', value: 'Caveat', category: 'display' },
  // Monospace
  { label: 'Fira Code', value: 'Fira Code', category: 'monospace' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono', category: 'monospace' },
  { label: 'Source Code Pro', value: 'Source Code Pro', category: 'monospace' },
  { label: 'monospace', value: 'monospace', category: 'system' },
  { label: 'serif', value: 'serif', category: 'system' },
  { label: 'sans-serif', value: 'sans-serif', category: 'system' },
];

// Text templates
const TEXT_TEMPLATES = [
  { label: 'Heading 1', value: { fontSize: 48, fontWeight: 700, fontFamily: 'Montserrat' } },
  { label: 'Heading 2', value: { fontSize: 36, fontWeight: 600, fontFamily: 'Montserrat' } },
  { label: 'Heading 3', value: { fontSize: 28, fontWeight: 600, fontFamily: 'Roboto' } },
  { label: 'Body Text', value: { fontSize: 16, fontWeight: 400, fontFamily: 'Open Sans', lineHeight: 1.6 } },
  { label: 'Caption', value: { fontSize: 12, fontWeight: 400, fontFamily: 'Roboto' } },
  { label: 'Button', value: { fontSize: 14, fontWeight: 500, fontFamily: 'Inter', align: 'center' } },
  { label: 'Quote', value: { fontSize: 20, fontWeight: 400, fontFamily: 'Playfair Display', fontStyle: 'italic' } },
  { label: 'Signature', value: { fontSize: 24, fontWeight: 400, fontFamily: 'Caveat' } },
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
function hasFillProp(layer: EditorLayer): boolean { return ['rect', 'ellipse', 'star', 'polygon'].includes(layer.type); }
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
const InlineRow: FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: 'flex', gap: 8, ...style }}>
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
      <InlineRow>
        <InputNumber size="small" value={layer.rotation ?? 0} onChange={(v) => onUpdate('rotation', v ?? 0)} style={{ width: '100%' }} />
        <Text style={{ fontSize: 12, color: 'var(--text-tertiary)', alignSelf: 'center' }}>°</Text>
      </InlineRow>
    </Row>
    <Row label={`Opacity ${Math.round((layer.opacity ?? 1) * 100)}%`}>
      <Slider min={0} max={100} value={Math.round((layer.opacity ?? 1) * 100)}
        onChange={(v) => onUpdate('opacity', v / 100)} />
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
  fill: string | GradientFill | undefined; onUpdate: (field: string, value: unknown) => void;
}> = memo(({ fill, onUpdate }) => {
  const isGradient = fill && typeof fill === 'object';
  const gradientFill = isGradient ? fill as GradientFill : null;

  const handleGradientChange = (type: 'linear' | 'radial') => {
    const currentColor = typeof fill === 'string' ? fill : '#4A90D9';
    onUpdate('fill', {
      type,
      stops: [{ offset: 0, color: currentColor }, { offset: 1, color: '#E86B56' }],
      angle: type === 'linear' ? 90 : undefined,
    });
  };

  const handleSolidColor = () => {
    const firstColor = gradientFill?.stops?.[0]?.color ?? '#4A90D9';
    onUpdate('fill', firstColor);
  };

  const handleStopColorChange = (index: number, color: string) => {
    if (!gradientFill) return;
    const newStops = [...gradientFill.stops];
    newStops[index] = { ...newStops[index], color };
    onUpdate('fill', { ...gradientFill, stops: newStops });
  };

  const handleAngleChange = (angle: number) => {
    if (!gradientFill || gradientFill.type !== 'linear') return;
    onUpdate('fill', { ...gradientFill, angle });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        <Button size="small" type={!isGradient ? 'primary' : 'default'} onClick={handleSolidColor}
          style={{ borderRadius: 6, fontSize: 11 }}>Solid</Button>
        <Button size="small" type={gradientFill?.type === 'linear' ? 'primary' : 'default'} onClick={() => handleGradientChange('linear')}
          style={{ borderRadius: 6, fontSize: 11 }}>Linear</Button>
        <Button size="small" type={gradientFill?.type === 'radial' ? 'primary' : 'default'} onClick={() => handleGradientChange('radial')}
          style={{ borderRadius: 6, fontSize: 11 }}>Radial</Button>
      </div>
      {!isGradient ? (
        <ColorPicker value={fill as string || '#000000'} onChange={(_, hex) => onUpdate('fill', hex)}
          style={{ borderRadius: 6 }} />
      ) : (
        <div style={{ marginTop: 8 }}>
          {gradientFill?.stops?.map((stop, index) => (
            <InlineRow key={index} style={{ marginBottom: 4 }}>
              <Field label={`${Math.round(stop.offset * 100)}%`} flex={1}>
                <ColorPicker value={stop.color} onChange={(_, hex) => handleStopColorChange(index, hex)}
                  style={{ borderRadius: 6 }} />
              </Field>
            </InlineRow>
          ))}
          {gradientFill?.type === 'linear' && (
            <Row label="Angle">
              <InputNumber size="small" value={gradientFill.angle ?? 90}
                onChange={(v) => handleAngleChange(v ?? 90)} min={0} max={360}
                style={{ width: '100%' }} />
            </Row>
          )}
        </div>
      )}
    </div>
  );
});

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

const FilterProperties: FC<{
  filters?: LayerFilters; onUpdate: (field: string, value: unknown) => void;
}> = memo(({ filters, onUpdate }) => {
  const handleFilterUpdate = (field: keyof LayerFilters, value: number | undefined) => {
    onUpdate('filters', { ...filters, [field]: value } as LayerFilters);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <Row label={`Blur: ${filters?.blur ?? 0}px`}>
        <Slider min={0} max={20} step={0.5} value={filters?.blur ?? 0}
          onChange={(v) => handleFilterUpdate('blur', v || undefined)} />
      </Row>
      <Row label={`Brightness: ${Math.round((filters?.brightness ?? 0) * 100)}%`}>
        <Slider min={-1} max={1} step={0.05} value={filters?.brightness ?? 0}
          onChange={(v) => handleFilterUpdate('brightness', v || undefined)} />
      </Row>
      <Row label={`Contrast: ${Math.round((filters?.contrast ?? 0) * 100)}%`}>
        <Slider min={-1} max={1} step={0.05} value={filters?.contrast ?? 0}
          onChange={(v) => handleFilterUpdate('contrast', v || undefined)} />
      </Row>
      <Row label={`Grayscale: ${Math.round((filters?.grayScale ?? 0) * 100)}%`}>
        <Slider min={0} max={1} step={0.05} value={filters?.grayScale ?? 0}
          onChange={(v) => handleFilterUpdate('grayScale', v || undefined)} />
      </Row>
      <Button size="small" onClick={() => onUpdate('filters', undefined)} style={{ borderRadius: 6, marginTop: 4 }}>
        Reset Filters
      </Button>
    </div>
  );
});

const TextProperties: FC<{
  layer: TextLayer; onUpdate: (field: string, value: unknown) => void;
}> = memo(({ layer, onUpdate }) => {
  const isBold = layer.fontStyle?.includes('bold') ?? false;
  const isItalic = layer.fontStyle?.includes('italic') ?? false;

  // Text statistics
  const charCount = layer.text.length;
  const wordCount = layer.text.trim() ? layer.text.trim().split(/\s+/).length : 0;
  const lineCount = layer.text.split('\n').length;

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
  const toggleStrikethrough = () => {
    if (layer.textDecoration === 'line-through') {
      onUpdate('textDecoration', '');
    } else if (layer.textDecoration === 'underline line-through') {
      onUpdate('textDecoration', 'underline');
    } else if (layer.textDecoration === 'underline') {
      onUpdate('textDecoration', 'underline line-through');
    } else {
      onUpdate('textDecoration', 'line-through');
    }
  };

  // Apply text template
  const applyTemplate = (template: typeof TEXT_TEMPLATES[0]['value']) => {
    Object.entries(template).forEach(([key, value]) => {
      onUpdate(key, value);
    });
  };

  // Font options grouped by category
  const fontOptions = [
    {
      label: 'System Fonts',
      options: FONT_FAMILIES.filter(f => f.category === 'system').map(f => ({
        label: <span style={{ fontFamily: f.value, fontSize: 12 }}>{f.label}</span>,
        value: f.value,
      })),
    },
    {
      label: 'Sans-Serif',
      options: FONT_FAMILIES.filter(f => f.category === 'sans-serif').map(f => ({
        label: <span style={{ fontFamily: f.value, fontSize: 12 }}>{f.label}</span>,
        value: f.value,
      })),
    },
    {
      label: 'Serif',
      options: FONT_FAMILIES.filter(f => f.category === 'serif').map(f => ({
        label: <span style={{ fontFamily: f.value, fontSize: 12 }}>{f.label}</span>,
        value: f.value,
      })),
    },
    {
      label: 'Display',
      options: FONT_FAMILIES.filter(f => f.category === 'display').map(f => ({
        label: <span style={{ fontFamily: f.value, fontSize: 12 }}>{f.label}</span>,
        value: f.value,
      })),
    },
    {
      label: 'Monospace',
      options: FONT_FAMILIES.filter(f => f.category === 'monospace').map(f => ({
        label: <span style={{ fontFamily: f.value, fontSize: 12 }}>{f.label}</span>,
        value: f.value,
      })),
    },
  ];

  return (
    <>
      {/* Text Statistics */}
      <div style={{ marginBottom: 8, fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', gap: 12 }}>
        <span>{charCount} chars</span>
        <span>{wordCount} words</span>
        <span>{lineCount} lines</span>
      </div>

      {/* Text Templates */}
      <Row label="Text Style">
        <Dropdown
          menu={{
            items: TEXT_TEMPLATES.map(t => ({
              key: t.label,
              label: <span style={{ fontFamily: t.value.fontFamily, fontSize: Math.min(t.value.fontSize, 16), fontWeight: t.value.fontWeight }}>{t.label}</span>,
              onClick: () => applyTemplate(t.value),
            })),
          }}
          trigger={['click']}
        >
          <Button size="small" icon={<PlusOutlined />} style={{ borderRadius: 6 }}>
            Apply Template
          </Button>
        </Dropdown>
      </Row>

      <Row label="Text">
        <Input.TextArea size="small" value={layer.text} onChange={(e) => onUpdate('text', e.target.value)}
          autoSize={{ minRows: 1, maxRows: 6 }} style={{ borderRadius: 6 }} />
      </Row>

      <Row label="Font">
        <Select size="small" value={layer.fontFamily ?? 'Arial'} onChange={(v) => onUpdate('fontFamily', v)}
          style={{ width: '100%' }}
          options={fontOptions}
          showSearch
          filterOption={(input, option) =>
            (option?.value as string)?.toLowerCase().includes(input.toLowerCase()) ||
            (option?.label as any)?.props?.children?.toLowerCase().includes(input.toLowerCase())
          } />
      </Row>

      <Row label="Size">
        <InlineRow>
          <Field label="Font" flex={1}>
            <InputNumber size="small" value={layer.fontSize ?? 24} onChange={(v) => onUpdate('fontSize', v ?? 24)} style={{ width: '100%' }} min={1} max={200} />
          </Field>
          <Field label="Weight" flex={1}>
            <Select size="small" value={layer.fontWeight ?? (isBold ? 700 : 400)} onChange={(v) => onUpdate('fontWeight', v)}
              style={{ width: '100%' }}
              options={[
                { label: 'Light (300)', value: 300 },
                { label: 'Normal (400)', value: 400 },
                { label: 'Medium (500)', value: 500 },
                { label: 'Semi Bold (600)', value: 600 },
                { label: 'Bold (700)', value: 700 },
                { label: 'Extra Bold (800)', value: 800 },
              ]} />
          </Field>
        </InlineRow>
      </Row>

      <Row label="Style">
        <Space size={4}>
          <Tooltip title="Bold">
            <Button size="small" type={isBold || (layer.fontWeight ?? 400) >= 600 ? 'primary' : 'default'} icon={<BoldOutlined />} onClick={toggleBold}
              style={{ width: 32, height: 28, borderRadius: 6 }} />
          </Tooltip>
          <Tooltip title="Italic">
            <Button size="small" type={isItalic ? 'primary' : 'default'} icon={<ItalicOutlined />} onClick={toggleItalic}
              style={{ width: 32, height: 28, borderRadius: 6 }} />
          </Tooltip>
          <Tooltip title="Underline">
            <Button size="small" type={layer.textDecoration?.includes('underline') ? 'primary' : 'default'} icon={<UnderlineOutlined />} onClick={toggleUnderline}
              style={{ width: 32, height: 28, borderRadius: 6 }} />
          </Tooltip>
          <Tooltip title="Strikethrough">
            <Button size="small" type={layer.textDecoration?.includes('line-through') ? 'primary' : 'default'} onClick={toggleStrikethrough}
              style={{ width: 32, height: 28, borderRadius: 6, fontSize: 12 }}>S</Button>
          </Tooltip>
        </Space>
      </Row>

      <Row label="Horizontal Align">
        <Space size={4}>
          <Button size="small" type={layer.align === 'left' || !layer.align ? 'primary' : 'default'} icon={<AlignLeftOutlined />} onClick={() => onUpdate('align', 'left')}
            style={{ width: 32, height: 28, borderRadius: 6 }} />
          <Button size="small" type={layer.align === 'center' ? 'primary' : 'default'} icon={<AlignCenterOutlined />} onClick={() => onUpdate('align', 'center')}
            style={{ width: 32, height: 28, borderRadius: 6 }} />
          <Button size="small" type={layer.align === 'right' ? 'primary' : 'default'} icon={<AlignRightOutlined />} onClick={() => onUpdate('align', 'right')}
            style={{ width: 32, height: 28, borderRadius: 6 }} />
          <Button size="small" type={layer.align === 'justify' ? 'primary' : 'default'} onClick={() => onUpdate('align', 'justify')}
            style={{ width: 32, height: 28, borderRadius: 6, fontSize: 11 }}>⟷</Button>
        </Space>
      </Row>

      <Row label="Text Transform">
        <Select size="small" value={layer.textTransform ?? 'none'} onChange={(v) => onUpdate('textTransform', v)}
          style={{ width: '100%' }}
          options={[
            { label: 'None', value: 'none' },
            { label: 'UPPERCASE', value: 'uppercase' },
            { label: 'lowercase', value: 'lowercase' },
            { label: 'Capitalize', value: 'capitalize' },
          ]} />
      </Row>

      <Row label="Spacing">
        <InlineRow>
          <Field label="Line Height" flex={1}>
            <InputNumber size="small" value={layer.lineHeight ?? 1.2} onChange={(v) => onUpdate('lineHeight', v ?? 1.2)} style={{ width: '100%' }} min={0.5} max={5} step={0.1} />
          </Field>
          <Field label="Letter" flex={1}>
            <InputNumber size="small" value={layer.letterSpacing ?? 0} onChange={(v) => onUpdate('letterSpacing', v ?? 0)} style={{ width: '100%' }} min={-10} max={50} step={0.5} />
          </Field>
        </InlineRow>
      </Row>

      <Row label="Text Stroke">
        <InlineRow>
          <Field label="Color" flex={0}>
            <ColorPicker value={layer.textStroke ?? 'transparent'} onChange={(_, hex) => onUpdate('textStroke', hex === '#000000' ? undefined : hex)} />
          </Field>
          <Field label="Width" flex={1}>
            <InputNumber size="small" value={layer.textStrokeWidth ?? 0} onChange={(v) => onUpdate('textStrokeWidth', v ?? 0)} style={{ width: '100%' }} min={0} max={10} step={0.5} />
          </Field>
        </InlineRow>
      </Row>

      <Row label="Wrap Mode">
        <Select size="small" value={layer.wrap ?? 'word'} onChange={(v) => onUpdate('wrap', v)}
          style={{ width: '100%' }}
          options={[
            { label: 'None (Single line)', value: 'none' },
            { label: 'Word wrap', value: 'word' },
            { label: 'Character wrap', value: 'char' },
          ]} />
      </Row>

      {layer.wrap !== 'none' && (
        <Row label="Max Width">
          <InputNumber size="small" value={layer.maxWidth ?? layer.width ?? 200} onChange={(v) => onUpdate('maxWidth', v ?? 200)} style={{ width: '100%' }} min={50} />
        </Row>
      )}
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
  const { content, selectedLayerIds, updateLayerPatchDebounced, ungroupLayer, convertImageLayerToTemplate, updateCanvas, snapEnabled, snapThreshold, toggleSnap, setSnapThreshold } = useEditorStore(
    useShallow((s) => ({
      content: s.content, selectedLayerIds: s.selectedLayerIds,
      updateLayerPatchDebounced: s.updateLayerPatchDebounced,
      ungroupLayer: s.ungroupLayer, convertImageLayerToTemplate: s.convertImageLayerToTemplate,
      updateCanvas: s.updateCanvas,
      snapEnabled: s.snapEnabled,
      snapThreshold: s.snapThreshold,
      toggleSnap: s.toggleSnap,
      setSnapThreshold: s.setSnapThreshold,
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
          <Divider style={{ margin: '12px 0' }} />
          <SectionHeader title="Snap Settings" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>Enable Snap</span>
            <Switch size="small" checked={snapEnabled} onChange={toggleSnap} />
          </div>
          {snapEnabled && (
            <Row label={`Snap Threshold: ${snapThreshold}px`}>
              <Slider min={1} max={20} value={snapThreshold} onChange={(v) => setSnapThreshold(v)} />
            </Row>
          )}
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
        <Row label="Blend Mode">
          <Select size="small" value={selectedLayer.blendMode ?? 'normal'} onChange={(v) => handleUpdate('blendMode', v)}
            style={{ width: '100%' }}
            options={BLEND_MODES.map((m) => ({ label: m.label, value: m.value }))} />
        </Row>
        <ShadowProperties shadow={selectedLayer.shadow} onUpdate={handleUpdate} />
        <FilterProperties filters={selectedLayer.filters} onUpdate={handleUpdate} />

        {/* Special hints */}
        {isSvgLayer(selectedLayer) && <SvgHint onUngroup={handleUngroup} />}
        {isImageLayer(selectedLayer) && hasEditableTemplateForImage(selectedLayer.src, selectedLayer.name) && (
          <ImageHint onConvert={handleConvertImage} />
        )}
      </div>
    </div>
  );
};
