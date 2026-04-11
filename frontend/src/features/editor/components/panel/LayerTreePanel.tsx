import { type FC, useCallback, useState, useRef } from 'react';
import { Tree, Button, Space, Divider, Input, Dropdown, message } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';
import {
  EyeOutlined, EyeInvisibleOutlined, LockOutlined, UnlockOutlined,
  ArrowUpOutlined, ArrowDownOutlined, VerticalAlignTopOutlined, VerticalAlignBottomOutlined,
  BorderOutlined, FontSizeOutlined, PictureOutlined, StarOutlined, FolderOutlined,
  SearchOutlined, LineOutlined, BorderOuterOutlined,
  DeleteOutlined, CopyOutlined, ScissorOutlined, SnippetsOutlined, EditOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import type { EditorLayer, RectLayer, EllipseLayer, TextLayer, StarLayer as StarLayerType, PolygonLayer } from '../../types';
import { generateId } from '../../utils/layerTree';

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

// Generate a simple SVG thumbnail for a layer
function generateLayerThumbnail(layer: EditorLayer, size: number = 20): string | null {
  const scale = size / 100;
  const w = (layer.width ?? 100) * scale;
  const h = (layer.height ?? 40) * scale;

  switch (layer.type) {
    case 'rect': {
      const fill = typeof (layer as RectLayer).fill === 'string' ? (layer as RectLayer).fill : '#4A90D9';
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect x="2" y="2" width="${w-4}" height="${h-4}" fill="${fill}" rx="2"/></svg>`)}`;
    }
    case 'ellipse': {
      const fill = typeof (layer as EllipseLayer).fill === 'string' ? (layer as EllipseLayer).fill : '#E86B56';
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><ellipse cx="${size/2}" cy="${size/2}" rx="${w/2-2}" ry="${h/2-2}" fill="${fill}"/></svg>`)}`;
    }
    case 'star': {
      const fill = typeof (layer as StarLayerType).fill === 'string' ? (layer as StarLayerType).fill : '#F5A623';
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><polygon points="${generateStarPointsSVG(size/2, size/2, 5, size/2-2, size/4-1)}" fill="${fill}"/></svg>`)}`;
    }
    case 'polygon': {
      const fill = typeof (layer as PolygonLayer).fill === 'string' ? (layer as PolygonLayer).fill : '#7B68EE';
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><polygon points="${generatePolygonPointsSVG(size/2, size/2, 6, size/2-2)}" fill="${fill}"/></svg>`)}`;
    }
    case 'text': {
      const fill = (layer as TextLayer).fill ?? '#333333';
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><text x="4" y="${size-4}" font-size="${size-8}" font-family="Arial" fill="${fill}">T</text></svg>`)}`;
    }
    case 'line': {
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><line x1="2" y1="${size-4}" x2="${size-2}" y2="4" stroke="#333" stroke-width="2"/></svg>`)}`;
    }
    case 'group': {
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect x="2" y="2" width="${size-4}" height="${size-4}" fill="#f5a623" rx="2" opacity="0.3"/><rect x="4" y="4" width="${size-8}" height="${size-8}" fill="#f5a623" rx="2" opacity="0.5"/></svg>`)}`;
    }
    default:
      return null;
  }
}

function generateStarPointsSVG(cx: number, cy: number, numPoints: number, outerRadius: number, innerRadius: number): string {
  const points: string[] = [];
  const angleStep = Math.PI / numPoints;
  for (let i = 0; i < 2 * numPoints; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * angleStep - Math.PI / 2;
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return points.join(' ');
}

function generatePolygonPointsSVG(cx: number, cy: number, sides: number, radius: number): string {
  const points: string[] = [];
  const angleStep = (2 * Math.PI) / sides;
  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2;
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return points.join(' ');
}

export const LayerTreePanel: FC = () => {
  const {
    content, selectedLayerIds, selectLayers,
    toggleLayerVisible, toggleLayerLocked,
    moveLayerUp, moveLayerDown, bringToFront, sendToBack, moveLayer,
    removeLayers, copySelectedLayers, cutSelectedLayers, pasteLayers, updateLayerPatch,
    addLayersBatch,
  } = useEditorStore(
    useShallow((s) => ({
      content: s.content, selectedLayerIds: s.selectedLayerIds, selectLayers: s.selectLayers,
      toggleLayerVisible: s.toggleLayerVisible, toggleLayerLocked: s.toggleLayerLocked,
      moveLayerUp: s.moveLayerUp, moveLayerDown: s.moveLayerDown,
      bringToFront: s.bringToFront, sendToBack: s.sendToBack, moveLayer: s.moveLayer,
      removeLayers: s.removeLayers,
      copySelectedLayers: s.copySelectedLayers,
      cutSelectedLayers: s.cutSelectedLayers,
      pasteLayers: s.pasteLayers,
      updateLayerPatch: s.updateLayerPatch,
      addLayersBatch: s.addLayersBatch,
    }))
  );

  const [searchText, setSearchText] = useState('');
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number; layerId: string } | null>(null);
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Multi-select with Ctrl+Click
  const handleSelect = useCallback(
    (keys: React.Key[], info: { nativeEvent: MouseEvent }) => {
      // Check if Ctrl/Cmd key was pressed
      const isCtrlClick = info.nativeEvent?.ctrlKey || info.nativeEvent?.metaKey;
      if (isCtrlClick) {
        // Toggle selection - if already selected, remove it; otherwise add it
        const newSelection = [...selectedLayerIds];
        for (const key of keys) {
          const keyStr = String(key);
          const index = newSelection.indexOf(keyStr);
          if (index >= 0) {
            newSelection.splice(index, 1);
          } else {
            newSelection.push(keyStr);
          }
        }
        selectLayers(newSelection);
      } else {
        // Normal click - replace selection
        selectLayers(keys.map(String));
      }
    },
    [selectLayers, selectedLayerIds]
  );

  const handleMoveUp = useCallback(() => { if (selectedLayerIds.length === 1) moveLayerUp(selectedLayerIds[0]); }, [selectedLayerIds, moveLayerUp]);
  const handleMoveDown = useCallback(() => { if (selectedLayerIds.length === 1) moveLayerDown(selectedLayerIds[0]); }, [selectedLayerIds, moveLayerDown]);
  const handleBringToFront = useCallback(() => { if (selectedLayerIds.length === 1) bringToFront(selectedLayerIds[0]); }, [selectedLayerIds, bringToFront]);
  const handleSendToBack = useCallback(() => { if (selectedLayerIds.length === 1) sendToBack(selectedLayerIds[0]); }, [selectedLayerIds, sendToBack]);

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, layerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY, layerId });
    // Select the layer if not already selected
    if (!selectedLayerIds.includes(layerId)) {
      selectLayers([layerId]);
    }
  }, [selectedLayerIds, selectLayers]);

  const handleRename = useCallback((layerId: string) => {
    if (!content) return;
    const layer = content.layers.find(l => l.id === layerId);
    if (!layer) return;
    setRenamingLayerId(layerId);
    setRenameValue(layer.name);
    setContextMenuPos(null);
  }, [content]);

  const handleRenameSubmit = useCallback(() => {
    if (renamingLayerId && renameValue.trim()) {
      updateLayerPatch(renamingLayerId, { name: renameValue.trim() });
    }
    setRenamingLayerId(null);
    setRenameValue('');
  }, [renamingLayerId, renameValue, updateLayerPatch]);

  const handleDuplicateLayer = useCallback((layerId: string) => {
    if (!content) return;
    const layer = content.layers.find(l => l.id === layerId);
    if (!layer) return;
    const newLayer = {
      ...layer,
      id: generateId(),
      name: `${layer.name} (copy)`,
      x: layer.x + 20,
      y: layer.y + 20,
    };
    addLayersBatch([newLayer]);
    setContextMenuPos(null);
  }, [content, addLayersBatch]);

  // Drag and drop handler
  const handleDrop: TreeProps['onDrop'] = useCallback(
    (info) => {
      const dragKey = info.dragNode.key as string;
      const dropKey = info.node.key as string;
      const dropPosition = info.dropPosition;
      const dropToGap = info.dropToGap;
      if (!content) return;

      // Find the dragged layer
      const dragLayer = content.layers.find(l => l.id === dragKey);
      if (!dragLayer) return;

      let parentId: string | null = null;
      let index: number;

      if (dropToGap) {
        // Drop to gap means reordering at root level
        parentId = null;
        // Find the drop target layer and its position
        const dropTargetIndex = content.layers.findIndex(l => l.id === dropKey);
        // Adjust index based on whether we're dragging up or down
        const dragIndex = content.layers.findIndex(l => l.id === dragKey);
        if (dragIndex < dropTargetIndex) {
          // Dragging down: insert after the target
          index = dropTargetIndex;
        } else {
          // Dragging up: insert at the target position
          index = dropTargetIndex;
        }
      } else {
        // Drop on a node: if it's a group, move into it
        const dropLayer = content.layers.find(l => l.id === dropKey);
        if (dropLayer && dropLayer.type === 'group') {
          parentId = dropKey;
          index = dropLayer.children?.length ?? 0;
        } else {
          // Not a group, ignore
          return;
        }
      }

      moveLayer(dragKey, parentId, index);
    },
    [content, moveLayer]
  );

  // Context menu items
  const contextMenuItems = [
    { key: 'copy', label: 'Copy (Ctrl+C)', icon: <CopyOutlined /> },
    { key: 'cut', label: 'Cut (Ctrl+X)', icon: <ScissorOutlined /> },
    { key: 'duplicate', label: 'Duplicate', icon: <CopyOutlined /> },
    { key: 'rename', label: 'Rename', icon: <EditOutlined /> },
    { type: 'divider' as const, key: 'd1' },
    { key: 'bringFront', label: 'Bring to Front', icon: <VerticalAlignTopOutlined /> },
    { key: 'sendBack', label: 'Send to Back', icon: <VerticalAlignBottomOutlined /> },
    { type: 'divider' as const, key: 'd2' },
    { key: 'lock', label: 'Lock', icon: <LockOutlined /> },
    { key: 'unlock', label: 'Unlock', icon: <UnlockOutlined /> },
    { key: 'hide', label: 'Hide', icon: <EyeInvisibleOutlined /> },
    { key: 'show', label: 'Show', icon: <EyeOutlined /> },
    { type: 'divider' as const, key: 'd3' },
    { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true },
  ];

  const handleContextMenuClick = useCallback(({ key }: { key: string }) => {
    if (!contextMenuPos) return;
    const layerId = contextMenuPos.layerId;
    const layer = content?.layers.find(l => l.id === layerId);

    switch (key) {
      case 'copy': copySelectedLayers(); break;
      case 'cut': cutSelectedLayers(); break;
      case 'duplicate': handleDuplicateLayer(layerId); break;
      case 'rename': handleRename(layerId); break;
      case 'bringFront': bringToFront(layerId); break;
      case 'sendBack': sendToBack(layerId); break;
      case 'lock': if (layer && !layer.locked) toggleLayerLocked(layerId); break;
      case 'unlock': if (layer?.locked) toggleLayerLocked(layerId); break;
      case 'hide': if (layer && layer.visible !== false) toggleLayerVisible(layerId); break;
      case 'show': if (layer?.visible === false) toggleLayerVisible(layerId); break;
      case 'delete': removeLayers([layerId]); break;
    }
    setContextMenuPos(null);
  }, [contextMenuPos, content, copySelectedLayers, cutSelectedLayers, handleDuplicateLayer, handleRename, bringToFront, sendToBack, toggleLayerLocked, toggleLayerVisible, removeLayers]);

  if (!content) return null;

  const buildTreeData = (layers: EditorLayer[]): TreeDataNode[] => {
    const search = searchText.toLowerCase();
    return layers
      .filter((layer) => !search || layer.name.toLowerCase().includes(search) || (layerTypeLabels[layer.type] ?? '').toLowerCase().includes(search))
      .map((layer) => {
        const typeIcon = layerTypeIcons[layer.type] || null;
        const thumbnail = generateLayerThumbnail(layer, 20);

        const isSelected = selectedLayerIds.includes(layer.id);

        return {
          key: layer.id,
          title: renamingLayerId === layer.id ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') { setRenamingLayerId(null); setRenameValue(''); }
                }}
                autoFocus
                style={{
                  width: '100%',
                  fontSize: 12,
                  padding: '2px 4px',
                  border: '1px solid var(--accent)',
                  borderRadius: 4,
                  background: 'var(--bg-panel)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                padding: '1px 0', height: 28, userSelect: 'none',
                background: isSelected ? 'var(--accent-light)' : 'transparent',
                borderRadius: 4,
              }}
              onContextMenu={(e) => handleContextMenu(e, layer.id)}
            >
              {thumbnail && (
                <img
                  src={thumbnail}
                  alt=""
                  style={{ width: 20, height: 20, borderRadius: 2, border: '1px solid var(--border)', objectFit: 'contain', background: 'var(--bg-panel)' }}
                />
              )}
              <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', opacity: thumbnail ? 0.5 : 1 }}>{!thumbnail && typeIcon}</span>
              <span style={{
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: layer.visible === false ? 'var(--text-disabled)' : 'var(--text-primary)',
                textDecoration: layer.locked ? 'line-through' : 'none',
                opacity: layer.locked ? 0.6 : 1,
                fontWeight: isSelected ? 500 : 400,
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
  const multiSelection = selectedLayerIds.length > 1;

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
            {content.layers.length} {multiSelection && `· ${selectedLayerIds.length} selected`}
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
        <Divider orientation="vertical" style={{ height: 20, margin: '0 4px' }} />
        <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copySelectedLayers()} disabled={selectedLayerIds.length === 0} title="Copy (Ctrl+C)"
          style={{ borderRadius: 4, fontSize: 11, color: selectedLayerIds.length > 0 ? 'var(--icon-color)' : undefined }} />
        <Button size="small" type="text" icon={<SnippetsOutlined />} onClick={() => pasteLayers()} disabled={!useEditorStore.getState().hasClipboardContent} title="Paste (Ctrl+V)"
          style={{ borderRadius: 4, fontSize: 11, color: useEditorStore.getState().hasClipboardContent ? 'var(--icon-color)' : undefined }} />
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
          multiple
        />
      </div>

      {/* Context Menu */}
      {contextMenuPos && (
        <Dropdown
          menu={{ items: contextMenuItems, onClick: handleContextMenuClick }}
          open
          trigger={['contextMenu']}
          overlayStyle={{ position: 'fixed', left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          <div style={{ position: 'fixed', left: contextMenuPos.x, top: contextMenuPos.y, width: 0, height: 0 }} />
        </Dropdown>
      )}
    </div>
  );
};