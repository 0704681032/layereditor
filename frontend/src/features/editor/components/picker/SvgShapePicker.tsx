import { memo, useCallback, useMemo, useState } from 'react';
import { Button, Dropdown, Tag, Typography } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../store/editorStore';
import { generateId } from '../../utils/layerTree';
import { presetShapes } from '../../data/presetShapes';
import DOMPurify from 'dompurify';

const { Text } = Typography;

// Determine if shape is a template (large dimensions) vs simple shape
const isTemplate = (shape: typeof presetShapes[0]) =>
  shape.defaultWidth > 400 || shape.defaultHeight > 400;

export const SvgShapePicker = memo(() => {
  const addLayer = useEditorStore((s) => s.addLayer);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleAddSvg = useCallback(
    (shape: typeof presetShapes[0]) => {
      addLayer({
        id: generateId(),
        type: 'svg',
        name: shape.name,
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 100,
        width: shape.defaultWidth,
        height: shape.defaultHeight,
        svgData: shape.svgData,
        visible: true,
        locked: false,
      });
      setDropdownOpen(false);
    },
    [addLayer]
  );

  const categories = useMemo(() => [...new Set(presetShapes.map((s) => s.category))], []);

  const menuItems = useMemo(
    () =>
      categories.map((cat) => ({
        key: cat,
        type: 'group' as const,
        label: <Tag style={{ fontSize: 11, borderRadius: 4 }}>{cat}</Tag>,
        children: presetShapes
          .filter((s) => s.category === cat)
          .map((shape) => ({
            key: shape.name,
            label: (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(shape.svgData) }}
                  style={{
                    width: 40,
                    height: isTemplate(shape) ? 40 : 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: 4,
                    background: isTemplate(shape) ? 'var(--bg-canvas)' : 'transparent',
                    flexShrink: 0,
                  }}
                />
                <Text style={{ fontSize: 12, color: 'var(--text-primary)' }}>{shape.name}</Text>
              </div>
            ),
          })),
      })),
    [categories]
  );

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: ({ key }) => {
          const shape = presetShapes.find((s) => s.name === key);
          if (shape) handleAddSvg(shape);
        },
        style: { maxHeight: 400, overflowY: 'auto', width: 280 },
      }}
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      trigger={['click']}
      placement="bottomLeft"
    >
      <Button
        icon={<StarOutlined />}
        size="small"
        type="text"
        title="SVG Shapes"
        style={{
          width: 32,
          height: 32,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          border: 'none',
          color: 'var(--icon-color)',
          background: 'transparent',
        }}
      />
    </Dropdown>
  );
});