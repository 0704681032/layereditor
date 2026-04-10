import { useCallback, useRef, useState, type ChangeEvent, type FC } from 'react';
import { Button, Space, Tooltip, Popover, Card, Typography, Tag, message } from 'antd';
import {
  PlusSquareOutlined,
  FontSizeOutlined,
  PictureOutlined,
  UndoOutlined,
  RedoOutlined,
  SaveOutlined,
  FolderOutlined,
  StarOutlined,
  DownloadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../store/editorStore';
import { generateId } from '../../utils/layerTree';
import type { EditorLayer } from '../../types';
import { EditorStage } from '../canvas/EditorStage';
import { LayerTreePanel } from '../panel/LayerTreePanel';
import { PropertyPanel } from '../panel/PropertyPanel';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useExportImage } from '../../hooks/useExportImage';
import { undo, redo, canUndo, canRedo, pushHistory } from '../../store/history';
import { presetShapes } from '../../data/presetShapes';
import { createLayerFromLocalImage } from '../../utils/localImageImport';
import { AssetPicker } from '../picker/AssetPicker';

const { Text } = Typography;

const SvgShapePicker: FC = () => {
  const content = useEditorStore((s) => s.content);
  const addLayer = useEditorStore((s) => s.addLayer);
  const [open, setOpen] = useState(false);

  const handleAddSvg = useCallback(
    (shape: typeof presetShapes[0]) => {
      if (!content) return;
      const layer: EditorLayer = {
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
      };
      addLayer(layer);
      pushHistory({ content: { ...content }, selectedLayerIds: [layer.id] });
      setOpen(false);
    },
    [content, addLayer]
  );

  const categories = [...new Set(presetShapes.map((s) => s.category))];

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      trigger="click"
      content={
        <div style={{ width: 420, maxHeight: 400, overflowY: 'auto' }}>
          {categories.map((cat) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <Tag color="blue" style={{ marginBottom: 8 }}>{cat}</Tag>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {presetShapes
                  .filter((s) => s.category === cat)
                  .map((shape) => (
                    <Card
                      key={shape.name}
                      hoverable
                      size="small"
                      style={{ cursor: 'pointer', padding: 4 }}
                      bodyStyle={{ padding: 4 }}
                      onClick={() => handleAddSvg(shape)}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: shape.svgData }}
                        style={{
                          width: '100%',
                          height: 70,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      />
                      <Text style={{ fontSize: 10, display: 'block', textAlign: 'center', marginTop: 2 }}>
                        {shape.name}
                      </Text>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      }
    >
      <Tooltip title="选择服务器 SVG">
        <Button icon={<StarOutlined />} size="small" />
      </Tooltip>
    </Popover>
  );
};

const LocalImagePicker: FC = () => {
  const content = useEditorStore((s) => s.content);
  const addLayer = useEditorStore((s) => s.addLayer);
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!content) return;
      if (!file) return;

      try {
        const parsed = await createLayerFromLocalImage(file, content.canvas);
        addLayer(parsed.layer);
        selectLayers(parsed.selectedLayerIds);
        pushHistory({ content: { ...content }, selectedLayerIds: parsed.selectedLayerIds });
      } catch (error) {
        console.error('Failed to parse local image:', error);
        message.error(error instanceof Error ? error.message : '本地图片解析失败');
      } finally {
        event.target.value = '';
      }
    },
    [content, addLayer, selectLayers]
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Tooltip title="打开本地图片">
        <Button icon={<PictureOutlined />} size="small" onClick={() => inputRef.current?.click()} />
      </Tooltip>
    </>
  );
};

export const EditorLayout: FC = () => {
  const content = useEditorStore((s) => s.content);
  const addLayer = useEditorStore((s) => s.addLayer);
  const { save } = useAutoSave();
  const { downloadImage } = useExportImage();
  const [exporting, setExporting] = useState(false);

  const handleAddRect = useCallback(() => {
    if (!content) return;
    const layer: EditorLayer = {
      id: generateId(),
      type: 'rect',
      name: 'Rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fill: '#4A90D9',
      visible: true,
      locked: false,
    };
    addLayer(layer);
    pushHistory({ content: { ...content }, selectedLayerIds: [layer.id] });
  }, [content, addLayer]);

  const handleAddText = useCallback(() => {
    if (!content) return;
    const layer: EditorLayer = {
      id: generateId(),
      type: 'text',
      name: 'Text',
      x: 100,
      y: 100,
      text: 'Hello',
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#333333',
      visible: true,
      locked: false,
    };
    addLayer(layer);
    pushHistory({ content: { ...content }, selectedLayerIds: [layer.id] });
  }, [content, addLayer]);

  const handleAddGroup = useCallback(() => {
    if (!content) return;
    const layer: EditorLayer = {
      id: generateId(),
      type: 'group',
      name: 'Group',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      visible: true,
      locked: false,
      children: [],
    };
    addLayer(layer);
    pushHistory({ content: { ...content }, selectedLayerIds: [layer.id] });
  }, [content, addLayer]);

  const handleUndo = useCallback(() => {
    const entry = undo();
    if (entry) {
      useEditorStore.getState().updateContent(entry.content);
      useEditorStore.getState().selectLayers(entry.selectedLayerIds);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const entry = redo();
    if (entry) {
      useEditorStore.getState().updateContent(entry.content);
      useEditorStore.getState().selectLayers(entry.selectedLayerIds);
    }
  }, []);

  const handleSave = useCallback(() => {
    save();
  }, [save]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const success = await downloadImage();
      if (success) {
        message.success('导出成功');
      } else {
        message.error('导出失败');
      }
    } catch (e) {
      console.error('Export failed:', e);
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  }, [downloadImage]);

  const saving = useEditorStore((s) => s.saving);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div
        style={{
          height: 48,
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 8,
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <Space>
          <Tooltip title="Add Rectangle">
            <Button icon={<PlusSquareOutlined />} size="small" onClick={handleAddRect} />
          </Tooltip>
          <Tooltip title="Add Text">
            <Button icon={<FontSizeOutlined />} size="small" onClick={handleAddText} />
          </Tooltip>
          <LocalImagePicker />
          <AssetPicker />
          <SvgShapePicker />
          <Tooltip title="Add Group">
            <Button icon={<FolderOutlined />} size="small" onClick={handleAddGroup} />
          </Tooltip>
          <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />
          <Tooltip title="Undo">
            <Button icon={<UndoOutlined />} size="small" onClick={handleUndo} disabled={!canUndo()} />
          </Tooltip>
          <Tooltip title="Redo">
            <Button icon={<RedoOutlined />} size="small" onClick={handleRedo} disabled={!canRedo()} />
          </Tooltip>
          <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />
          <Tooltip title="Save">
            <Button icon={<SaveOutlined />} size="small" onClick={handleSave} loading={saving} />
          </Tooltip>
          <Tooltip title="Export as PNG">
            <Button icon={<DownloadOutlined />} size="small" onClick={handleExport} loading={exporting} />
          </Tooltip>
        </Space>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 240, borderRight: '1px solid #e8e8e8', overflowY: 'auto', flexShrink: 0 }}>
          <LayerTreePanel />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', background: '#f0f0f0' }}>
          <EditorStage />
        </div>
        <div style={{ width: 280, borderLeft: '1px solid #e8e8e8', overflowY: 'auto', flexShrink: 0 }}>
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
};
