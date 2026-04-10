import { type FC, useCallback } from 'react';
import { Tree, Button, Space, Divider } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  BorderOutlined,
  FontSizeOutlined,
  PictureOutlined,
  StarOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import type { EditorLayer } from '../../types';

// Map layer types to icons
const layerTypeIcons: Record<string, React.ReactNode> = {
  rect: <BorderOutlined style={{ fontSize: 12, color: '#999' }} />,
  text: <FontSizeOutlined style={{ fontSize: 12, color: '#999' }} />,
  image: <PictureOutlined style={{ fontSize: 12, color: '#999' }} />,
  svg: <StarOutlined style={{ fontSize: 12, color: '#999' }} />,
  group: <FolderOutlined style={{ fontSize: 12, color: '#f5a623' }} />,
};

export const LayerTreePanel: FC = () => {
  const {
    content, selectedLayerIds, selectLayers,
    toggleLayerVisible, toggleLayerLocked,
    moveLayerUp, moveLayerDown, bringToFront, sendToBack,
    moveLayer,
  } = useEditorStore(
    useShallow((s) => ({
      content: s.content,
      selectedLayerIds: s.selectedLayerIds,
      selectLayers: s.selectLayers,
      toggleLayerVisible: s.toggleLayerVisible,
      toggleLayerLocked: s.toggleLayerLocked,
      moveLayerUp: s.moveLayerUp,
      moveLayerDown: s.moveLayerDown,
      bringToFront: s.bringToFront,
      sendToBack: s.sendToBack,
      moveLayer: s.moveLayer,
    }))
  );

  const handleSelect = useCallback(
    (keys: React.Key[]) => {
      selectLayers(keys.map(String));
    },
    [selectLayers]
  );

  const handleMoveUp = useCallback(() => {
    if (selectedLayerIds.length === 1) {
      moveLayerUp(selectedLayerIds[0]);
    }
  }, [selectedLayerIds, moveLayerUp]);

  const handleMoveDown = useCallback(() => {
    if (selectedLayerIds.length === 1) {
      moveLayerDown(selectedLayerIds[0]);
    }
  }, [selectedLayerIds, moveLayerDown]);

  const handleBringToFront = useCallback(() => {
    if (selectedLayerIds.length === 1) {
      bringToFront(selectedLayerIds[0]);
    }
  }, [selectedLayerIds, bringToFront]);

  const handleSendToBack = useCallback(() => {
    if (selectedLayerIds.length === 1) {
      sendToBack(selectedLayerIds[0]);
    }
  }, [selectedLayerIds, sendToBack]);

  const handleDrop: TreeProps['onDrop'] = useCallback(
    (info) => {
      const dragKey = info.dragNode.key as string;
      const dropKey = info.node.key as string;
      const dropPosition = info.dropPosition;
      const dropToGap = info.dropToGap;

      if (!content) return;

      // Determine parent and index
      let parentId: string | null = null;
      let index: number;

      if (dropToGap) {
        // Dropped between nodes
        parentId = null; // Simplified: always root level for now
        index = dropPosition;
      } else {
        // Dropped onto a node (make it a child of group)
        const dropLayer = (function findLayer(layers: EditorLayer[]): EditorLayer | null {
          for (const l of layers) {
            if (l.id === dropKey) return l;
            if (l.type === 'group' && l.children) {
              const found = findLayer(l.children);
              if (found) return found;
            }
          }
          return null;
        })(content.layers);

        if (dropLayer && dropLayer.type === 'group') {
          parentId = dropKey;
          index = dropLayer.children?.length ?? 0;
        } else {
          return; // Can't drop into non-group
        }
      }

      moveLayer(dragKey, parentId, index);
    },
    [content, moveLayer]
  );

  if (!content) return null;

  const buildTreeData = (layers: EditorLayer[]): TreeDataNode[] => {
    return layers.map((layer) => {
      const typeIcon = layerTypeIcons[layer.type] || null;
      // Color indicator for layers with fill
      const colorDot = (layer.type === 'rect' || layer.type === 'text') && (layer as { fill?: string }).fill
        ? (
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: (layer as { fill: string }).fill,
              border: '1px solid #ddd',
              flexShrink: 0,
            }}
          />
        )
        : null;

      return {
        key: layer.id,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            {typeIcon}
            {colorDot}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {layer.name}
            </span>
            <Button
              type="text"
              size="small"
              icon={layer.visible !== false ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerVisible(layer.id);
              }}
              style={{ padding: '0 2px', minWidth: 20, height: 20 }}
            />
            <Button
              type="text"
              size="small"
              icon={layer.locked ? <LockOutlined /> : <UnlockOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerLocked(layer.id);
              }}
              style={{ padding: '0 2px', minWidth: 20, height: 20 }}
            />
          </div>
        ),
        children: layer.type === 'group' && layer.children ? buildTreeData(layer.children) : undefined,
      };
    });
  };

  const hasSelection = selectedLayerIds.length === 1;

  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, color: '#666' }}>Layers</div>

      {/* Layer ordering buttons */}
      <Space style={{ marginBottom: 8 }}>
        <Button
          size="small"
          icon={<ArrowUpOutlined />}
          onClick={handleMoveUp}
          disabled={!hasSelection}
          title="Move Up"
        />
        <Button
          size="small"
          icon={<ArrowDownOutlined />}
          onClick={handleMoveDown}
          disabled={!hasSelection}
          title="Move Down"
        />
        <Button
          size="small"
          icon={<VerticalAlignTopOutlined />}
          onClick={handleBringToFront}
          disabled={!hasSelection}
          title="Bring to Front"
        />
        <Button
          size="small"
          icon={<VerticalAlignBottomOutlined />}
          onClick={handleSendToBack}
          disabled={!hasSelection}
          title="Send to Back"
        />
      </Space>

      <Divider style={{ margin: '8px 0' }} />

      <Tree
        treeData={buildTreeData(content.layers)}
        selectedKeys={selectedLayerIds}
        onSelect={handleSelect}
        defaultExpandAll
        blockNode
        draggable
        onDrop={handleDrop}
      />
    </div>
  );
};
