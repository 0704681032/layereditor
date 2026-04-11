import { type FC, useCallback, useState } from 'react';
import { Tree, Button, Space, Divider, Input } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';
import {
  EyeOutlined, EyeInvisibleOutlined, LockOutlined, UnlockOutlined,
  ArrowUpOutlined, ArrowDownOutlined, VerticalAlignTopOutlined, VerticalAlignBottomOutlined,
  BorderOutlined, FontSizeOutlined, PictureOutlined, StarOutlined, FolderOutlined,
  SearchOutlined, LineOutlined, BorderOuterOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import type { EditorLayer } from '../../types';

const layerTypeIcons: Record<string, React.ReactNode> = {
  rect: <BorderOutlined style={{ fontSize: 11 }} />,
  ellipse: <BorderOuterOutlined style={{ fontSize: 11 }} />,
  text: <FontSizeOutlined style={{ fontSize: 11 }} />,
  image: <PictureOutlined style={{ fontSize: 11 }} />,
  svg: <StarOutlined style={{ fontSize: 11 }} />,
  group: <FolderOutlined style={{ fontSize: 11, color: '#f5a623' }} />,
  line: <LineOutlined style={{ fontSize: 11 }} />,
  star: <StarOutlined style={{ fontSize: 11, color: '#f5a623' }} />,
  polygon: <BorderOuterOutlined style={{ fontSize: 11 }} />,
};

const layerTypeLabels: Record<string, string> = {
  rect: 'Rect', ellipse: 'Ellipse', text: 'Text', image: 'Image',
  svg: 'SVG', group: 'Group', line: 'Line', star: 'Star', polygon: 'Polygon',
};

export const LayerTreePanel: FC = () => {
  const {
    content, selectedLayerIds, selectLayers,
    toggleLayerVisible, toggleLayerLocked,
    moveLayerUp, moveLayerDown, bringToFront, sendToBack, moveLayer,
    removeLayers,
  } = useEditorStore(
    useShallow((s) => ({
      content: s.content, selectedLayerIds: s.selectedLayerIds, selectLayers: s.selectLayers,
      toggleLayerVisible: s.toggleLayerVisible, toggleLayerLocked: s.toggleLayerLocked,
      moveLayerUp: s.moveLayerUp, moveLayerDown: s.moveLayerDown,
      bringToFront: s.bringToFront, sendToBack: s.sendToBack, moveLayer: s.moveLayer,
      removeLayers: s.removeLayers,
    }))
  );

  const [searchText, setSearchText] = useState('');

  const handleSelect = useCallback((keys: React.Key[]) => { selectLayers(keys.map(String)); }, [selectLayers]);
  const handleMoveUp = useCallback(() => { if (selectedLayerIds.length === 1) moveLayerUp(selectedLayerIds[0]); }, [selectedLayerIds, moveLayerUp]);
  const handleMoveDown = useCallback(() => { if (selectedLayerIds.length === 1) moveLayerDown(selectedLayerIds[0]); }, [selectedLayerIds, moveLayerDown]);
  const handleBringToFront = useCallback(() => { if (selectedLayerIds.length === 1) bringToFront(selectedLayerIds[0]); }, [selectedLayerIds, bringToFront]);
  const handleSendToBack = useCallback(() => { if (selectedLayerIds.length === 1) sendToBack(selectedLayerIds[0]); }, [selectedLayerIds, sendToBack]);

  const handleDrop: TreeProps['onDrop'] = useCallback(
    (info) => {
      const dragKey = info.dragNode.key as string;
      const dropKey = info.node.key as string;
      const dropPosition = info.dropPosition;
      const dropToGap = info.dropToGap;
      if (!content) return;

      let parentId: string | null = null;
      let index: number;

      if (dropToGap) { parentId = null; index = dropPosition; }
      else {
        const dropLayer = (function findLayer(layers: EditorLayer[]): EditorLayer | null {
          for (const l of layers) {
            if (l.id === dropKey) return l;
            if (l.type === 'group' && l.children) { const found = findLayer(l.children); if (found) return found; }
          }
          return null;
        })(content.layers);

        if (dropLayer && dropLayer.type === 'group') { parentId = dropKey; index = dropLayer.children?.length ?? 0; }
        else return;
      }
      moveLayer(dragKey, parentId, index);
    },
    [content, moveLayer]
  );

  if (!content) return null;

  const buildTreeData = (layers: EditorLayer[]): TreeDataNode[] => {
    const search = searchText.toLowerCase();
    return layers
      .filter((layer) => !search || layer.name.toLowerCase().includes(search) || (layerTypeLabels[layer.type] ?? '').toLowerCase().includes(search))
      .map((layer) => {
        const typeIcon = layerTypeIcons[layer.type] || null;
        const hasFill = ['rect', 'ellipse', 'text', 'star', 'polygon'].includes(layer.type);
        const fill = hasFill ? (layer as any).fill : null;
        const colorDot = fill
          ? <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: fill, border: '1px solid var(--border)', flexShrink: 0 }} />
          : null;

        return {
          key: layer.id,
          title: (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
              padding: '1px 0', height: 28, userSelect: 'none',
            }}>
              <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>{typeIcon}</span>
              {colorDot}
              <span style={{
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: layer.visible === false ? 'var(--text-disabled)' : 'var(--text-primary)',
                textDecoration: layer.locked ? 'line-through' : 'none',
                opacity: layer.locked ? 0.6 : 1,
              }}>
                {layer.name}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-tertiary)', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {layerTypeLabels[layer.type] || layer.type}
              </span>
              <Button type="text" size="small"
                icon={layer.visible !== false ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={(e) => { e.stopPropagation(); toggleLayerVisible(layer.id); }}
                style={{ padding: 0, minWidth: 20, height: 20, color: layer.visible === false ? 'var(--text-disabled)' : 'var(--text-tertiary)', fontSize: 11 }}
              />
              <Button type="text" size="small"
                icon={layer.locked ? <LockOutlined /> : <UnlockOutlined />}
                onClick={(e) => { e.stopPropagation(); toggleLayerLocked(layer.id); }}
                style={{ padding: 0, minWidth: 20, height: 20, color: layer.locked ? 'var(--accent)' : 'var(--text-tertiary)', fontSize: 11 }}
              />
            </div>
          ),
          children: layer.type === 'group' && layer.children ? buildTreeData(layer.children) : undefined,
        };
      });
  };

  const hasSelection = selectedLayerIds.length === 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px 8px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel-header)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
            Layers
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            {content.layers.length}
          </span>
        </div>
        <Input size="small" placeholder="Search layers..." prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)', fontSize: 11 }} />}
          value={searchText} onChange={(e) => setSearchText(e.target.value)}
          style={{ borderRadius: 6, fontSize: 12 }}
          allowClear
        />
      </div>

      {/* Quick actions */}
      <div style={{
        padding: '6px 12px', borderBottom: '1px solid var(--border)',
        display: 'flex', gap: 2, flexWrap: 'wrap',
      }}>
        <Button size="small" type="text" icon={<ArrowUpOutlined />} onClick={handleMoveUp} disabled={!hasSelection} title="Move Up"
          style={{ borderRadius: 4, fontSize: 11, color: hasSelection ? 'var(--icon-color)' : undefined }} />
        <Button size="small" type="text" icon={<ArrowDownOutlined />} onClick={handleMoveDown} disabled={!hasSelection} title="Move Down"
          style={{ borderRadius: 4, fontSize: 11, color: hasSelection ? 'var(--icon-color)' : undefined }} />
        <Button size="small" type="text" icon={<VerticalAlignTopOutlined />} onClick={handleBringToFront} disabled={!hasSelection} title="Bring to Front"
          style={{ borderRadius: 4, fontSize: 11, color: hasSelection ? 'var(--icon-color)' : undefined }} />
        <Button size="small" type="text" icon={<VerticalAlignBottomOutlined />} onClick={handleSendToBack} disabled={!hasSelection} title="Send to Back"
          style={{ borderRadius: 4, fontSize: 11, color: hasSelection ? 'var(--icon-color)' : undefined }} />
        <div style={{ flex: 1 }} />
        {selectedLayerIds.length > 0 && (
          <Button size="small" type="text" icon={<DeleteOutlined />} onClick={() => removeLayers(selectedLayerIds)} title="Delete Selected"
            style={{ borderRadius: 4, fontSize: 11, color: '#ff4d4f' }} danger />
        )}
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 4px' }}>
        <Tree
          treeData={buildTreeData(content.layers)}
          selectedKeys={selectedLayerIds}
          onSelect={handleSelect}
          defaultExpandAll
          blockNode
          draggable
          onDrop={handleDrop}
          style={{ background: 'transparent' }}
        />
      </div>
    </div>
  );
};
