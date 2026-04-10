import { type FC, useCallback } from 'react';
import { Tree, Button } from 'antd';
import type { TreeDataNode } from 'antd';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../store/editorStore';
import type { EditorLayer } from '../../types';

export const LayerTreePanel: FC = () => {
  const content = useEditorStore((s) => s.content);
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const toggleLayerVisible = useEditorStore((s) => s.toggleLayerVisible);
  const toggleLayerLocked = useEditorStore((s) => s.toggleLayerLocked);

  const handleSelect = useCallback(
    (keys: React.Key[]) => {
      selectLayers(keys.map(String));
    },
    [selectLayers]
  );

  if (!content) return null;

  const buildTreeData = (layers: EditorLayer[]): TreeDataNode[] => {
    return layers.map((layer) => ({
      key: layer.id,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <span>{layer.name}</span>
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
    }));
  };

  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, color: '#666' }}>Layers</div>
      <Tree
        treeData={buildTreeData(content.layers)}
        selectedKeys={selectedLayerIds}
        onSelect={handleSelect}
        defaultExpandAll
        blockNode
      />
    </div>
  );
};
