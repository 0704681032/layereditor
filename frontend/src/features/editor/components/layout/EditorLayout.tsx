import { SvgShapePicker } from '../picker/SvgShapePicker';
import { useCallback, useMemo, useRef, useState, type ChangeEvent, type FC } from 'react';
import { Button, Space, Tooltip, Popover, Card, Typography, Tag, Divider, App, Dropdown, Modal, Radio, Slider, Alert } from 'antd';
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
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  BorderOutlined,
  AimOutlined,
  GroupOutlined,
  UngroupOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  BulbOutlined,
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
  SnippetsOutlined,
  LockOutlined,
  UnlockOutlined,
  ToTopOutlined,
  LineOutlined,
  BorderOuterOutlined,
  ColumnWidthOutlined,
  BorderBottomOutlined,
  HomeOutlined,
  HighlightOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useEditorStore, type DrawMode } from '../../store/editorStore';
import { generateId } from '../../utils/layerTree';
import type { EditorLayer } from '../../types';
import { EditorStage } from '../canvas/EditorStage';
import { LayerTreePanel } from '../panel/LayerTreePanel';
import { PropertyPanel } from '../panel/PropertyPanel';
import { HistoryPanel } from '../panel/HistoryPanel';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useExportImage } from '../../hooks/useExportImage';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { undo, redo } from '../../store/history';
import { createLayerFromLocalImage } from '../../utils/localImageImport';
import { AssetPicker } from '../picker/AssetPicker';
import { useShallow } from 'zustand/react/shallow';
import { findLayerById } from '../../utils/layerTreeOperations';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

// Toolbar button with consistent styling
const ToolBtn: FC<{ icon: React.ReactNode; title: string; onClick?: () => void; disabled?: boolean; active?: boolean }> = ({ icon, title, onClick, disabled, active }) => (
  <Tooltip title={title} mouseEnterDelay={0.4}>
    <Button
      icon={icon}
      size="small"
      type={active ? 'primary' : 'text'}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, border: 'none', color: active ? '#fff' : 'var(--icon-color)',
        background: active ? 'var(--accent)' : 'transparent',
      }}
    />
  </Tooltip>
);

// Toolbar separator
const Sep = () => <div style={{ width: 1, height: 20, background: 'var(--divider)', margin: '0 6px', flexShrink: 0 }} />;

const LocalImagePicker: FC = () => {
  const { content, addLayer, selectLayers } = useEditorStore(useShallow((s) => ({ content: s.content, addLayer: s.addLayer, selectLayers: s.selectLayers })));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!content || !file) return;
      try {
        const parsed = await createLayerFromLocalImage(file, content.canvas);
        addLayer(parsed.layer);
        selectLayers(parsed.selectedLayerIds);
      } catch (error) {
        console.error('Failed to parse local image:', error);
        message.error(error instanceof Error ? error.message : 'Failed to import image');
      } finally { event.target.value = ''; }
    },
    [content, addLayer, selectLayers]
  );

  return (
    <>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: 'none' }} onChange={handleFileChange} />
      <ToolBtn icon={<PictureOutlined />} title="Import Image" onClick={() => inputRef.current?.click()} />
    </>
  );
};

// Export Dialog
const ExportDialog: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { downloadImage, downloadPDF, downloadSVG, downloadSelectedLayers, downloadAllLayersSeparately } = useExportImage();
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'pdf' | 'svg'>('png');
  const [quality, setQuality] = useState(100);
  const [resolution, setResolution] = useState<1 | 2 | 3 | 4>(2);
  const [exportMode, setExportMode] = useState<'canvas' | 'selected' | 'layers'>('canvas');
  const [cropToContent, setCropToContent] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      let success: boolean;

      if (exportMode === 'selected' && selectedLayerIds.length > 0) {
        success = await downloadSelectedLayers(undefined, format as 'png' | 'jpeg' | 'webp', quality / 100, resolution) ?? false;
      } else if (exportMode === 'layers') {
        success = await downloadAllLayersSeparately(format as 'png' | 'jpeg' | 'webp', quality / 100, resolution) ?? false;
      } else if (format === 'svg') {
        success = await downloadSVG() ?? false;
      } else if (format === 'pdf') {
        success = await downloadPDF(undefined, resolution, cropToContent) ?? false;
      } else {
        success = await downloadImage(undefined, format as 'png' | 'jpeg' | 'webp', quality / 100, resolution, cropToContent) ?? false;
      }

      if (success) message.success('Export successful');
      else message.error('Export failed');
    } catch { message.error('Export failed'); }
    finally { setExporting(false); onClose(); }
  };

  const hasSelection = selectedLayerIds.length > 0;
  const imageFormats = ['png', 'jpeg', 'webp'] as const;

  return (
    <Modal title="Export" open={open} onOk={handleExport} onCancel={onClose} okText="Export" confirmLoading={exporting} width={500}>
      {/* Export Mode */}
      <div style={{ marginBottom: 20 }}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>Export Mode</Text>
        <Radio.Group value={exportMode} onChange={(e) => setExportMode(e.target.value)} style={{ display: 'block', marginTop: 8 }}>
          <Radio value="canvas">Full Canvas</Radio>
          <Radio value="selected" disabled={!hasSelection}>Selected Layers ({hasSelection ? selectedLayerIds.length : 0})</Radio>
          <Radio value="layers">All Layers Separately</Radio>
        </Radio.Group>
      </div>

      {/* Crop option */}
      {exportMode === 'canvas' && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={cropToContent} onChange={(e) => setCropToContent(e.target.checked)} style={{ width: 16, height: 16 }} />
            <Text style={{ fontSize: 13 }}>Crop to content (trim blank space)</Text>
          </label>
        </div>
      )}

      {/* Format Selection */}
      {exportMode !== 'layers' && (
        <div style={{ marginBottom: 20 }}>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>Format</Text>
          <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)} style={{ display: 'block', marginTop: 8 }}>
            <Radio value="png">PNG (Lossless, transparency)</Radio>
            <Radio value="jpeg">JPEG (Smaller size)</Radio>
            <Radio value="webp">WebP (Modern, efficient)</Radio>
            <Radio value="pdf">PDF (Document)</Radio>
            {exportMode === 'canvas' && <Radio value="svg">SVG (Vector)</Radio>}
          </Radio.Group>
        </div>
      )}

      {/* Resolution */}
      {imageFormats.includes(format as typeof imageFormats[number]) && (
        <div style={{ marginBottom: 20 }}>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>Resolution</Text>
          <Radio.Group value={resolution} onChange={(e) => setResolution(e.target.value)} style={{ display: 'block', marginTop: 8 }}>
            <Radio value={1}>1x (Standard)</Radio>
            <Radio value={2}>2x (High Quality)</Radio>
            <Radio value={3}>3x (Ultra)</Radio>
            <Radio value={4}>4x (Maximum)</Radio>
          </Radio.Group>
        </div>
      )}

      {/* JPEG/WebP Quality */}
      {(format === 'jpeg' || format === 'webp') && (
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>Quality: {quality}%</Text>
          <Slider min={10} max={100} value={quality} onChange={setQuality} style={{ marginTop: 8 }} />
        </div>
      )}

      {/* Info */}
      {exportMode === 'layers' && (
        <div style={{ marginTop: 8 }}>
          <Alert type="info" message="Each layer will be exported as a separate file" style={{ fontSize: 12 }} />
        </div>
      )}
    </Modal>
  );
};

export const EditorLayout: FC = () => {
  useKeyboardShortcuts();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const {
    content, addLayer, saving, canUndo, canRedo, zoom,
    zoomIn, zoomOut, zoomToFit, zoomTo100, showGrid, snapEnabled, toggleGrid, toggleSnap,
    selectedLayerIds, removeLayers, toggleLayerLocked, bringToFront, sendToBack,
    groupSelectedLayers, ungroupSelectedLayers, alignLayers, distributeLayers,
    theme, toggleTheme, title, isDirty,
    drawMode, setDrawMode,
    hasClipboardContent, copySelectedLayers, cutSelectedLayers, pasteLayers,
  } = useEditorStore(
    useShallow((s) => ({
      content: s.content, addLayer: s.addLayer, saving: s.saving,
      canUndo: s.canUndo, canRedo: s.canRedo, zoom: s.zoom,
      zoomIn: s.zoomIn, zoomOut: s.zoomOut, zoomToFit: s.zoomToFit, zoomTo100: s.zoomTo100,
      showGrid: s.showGrid, snapEnabled: s.snapEnabled, toggleGrid: s.toggleGrid, toggleSnap: s.toggleSnap,
      selectedLayerIds: s.selectedLayerIds, removeLayers: s.removeLayers,
      toggleLayerLocked: s.toggleLayerLocked, bringToFront: s.bringToFront, sendToBack: s.sendToBack,
      groupSelectedLayers: s.groupSelectedLayers, ungroupSelectedLayers: s.ungroupSelectedLayers,
      alignLayers: s.alignLayers, distributeLayers: s.distributeLayers,
      theme: s.theme, toggleTheme: s.toggleTheme,
      title: s.title, isDirty: s.isDirty,
      drawMode: s.drawMode, setDrawMode: s.setDrawMode,
      hasClipboardContent: s.hasClipboardContent,
      copySelectedLayers: s.copySelectedLayers,
      cutSelectedLayers: s.cutSelectedLayers,
      pasteLayers: s.pasteLayers,
    }))
  );

  const { save } = useAutoSave();
  const [exportOpen, setExportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [pastePosition, setPastePosition] = useState<{ x: number; y: number } | null>(null);

  // Close context menu on any click
  const handleCanvasAreaClick = useCallback(() => { setContextMenu(null); }, []);

  // External file drag & drop
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!content) return;
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('text/svg')) continue;
        try {
          const parsed = await createLayerFromLocalImage(file, content.canvas);
          addLayer(parsed.layer);
        } catch (err) {
          message.error(`Failed to import ${file.name}`);
        }
      }
    },
    [content, addLayer]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleAddText = useCallback(() => { if (!content) return; addLayer({ id: generateId(), type: 'text', name: 'Text', x: 100, y: 100, text: 'Hello', fontSize: 24, fontFamily: 'Arial', fill: '#333333', visible: true, locked: false }); }, [content, addLayer]);
  const handleAddStar = useCallback(() => { if (!content) return; addLayer({ id: generateId(), type: 'star', name: 'Star', x: 100, y: 100, width: 120, height: 120, fill: '#F5A623', numPoints: 5, innerRadius: 0.4, visible: true, locked: false }); }, [content, addLayer]);
  const handleAddPolygon = useCallback(() => { if (!content) return; addLayer({ id: generateId(), type: 'polygon', name: 'Polygon', x: 100, y: 100, width: 120, height: 120, fill: '#7B68EE', sides: 6, visible: true, locked: false }); }, [content, addLayer]);

  // Drawing mode handlers
  const handleDrawRect = useCallback(() => {
    setDrawMode(drawMode === 'rect' ? 'none' : 'rect');
  }, [drawMode, setDrawMode]);
  const handleDrawEllipse = useCallback(() => {
    setDrawMode(drawMode === 'ellipse' ? 'none' : 'ellipse');
  }, [drawMode, setDrawMode]);
  const handleDrawLine = useCallback(() => {
    setDrawMode(drawMode === 'line' ? 'none' : 'line');
  }, [drawMode, setDrawMode]);

  const handleUndo = useCallback(() => { const entry = undo(); if (entry) { useEditorStore.getState().setContentSilent(entry.content, entry.selectedLayerIds); } }, []);
  const handleRedo = useCallback(() => { const entry = redo(); if (entry) { useEditorStore.getState().setContentSilent(entry.content, entry.selectedLayerIds); } }, []);
  const handleSave = useCallback(() => { save(); }, [save]);

  const zoomPercent = Math.round(zoom * 100);
  const hasSelection = selectedLayerIds.length > 0;
  const multiSelect = selectedLayerIds.length >= 2;
  const isDark = theme === 'dark';
  const layerCount = useMemo(() => {
    if (!content) return 0;
    const countAll = (layers: EditorLayer[]): number =>
      layers.reduce((sum, l) => sum + 1 + (l.type === 'group' && l.children ? countAll(l.children) : 0), 0);
    return countAll(content.layers);
  }, [content]);

  // Context menu items
  const contextMenuItems = [
    { key: 'copy', label: 'Copy (Ctrl+C)', icon: <CopyOutlined />, disabled: !hasSelection },
    { key: 'cut', label: 'Cut (Ctrl+X)', icon: <ScissorOutlined />, disabled: !hasSelection },
    { key: 'paste', label: 'Paste (Ctrl+V)', icon: <SnippetsOutlined />, disabled: !hasClipboardContent },
    { key: 'pasteHere', label: 'Paste Here', icon: <SnippetsOutlined />, disabled: !hasClipboardContent },
    { key: 'duplicate', label: 'Duplicate (Ctrl+D)', disabled: !hasSelection },
    { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, disabled: !hasSelection },
    { type: 'divider' as const, key: 'd1' },
    { key: 'bringFront', label: 'Bring to Front', icon: <ToTopOutlined />, disabled: selectedLayerIds.length !== 1 },
    { key: 'sendBack', label: 'Send to Back', icon: <VerticalAlignBottomOutlined />, disabled: selectedLayerIds.length !== 1 },
    { type: 'divider' as const, key: 'd2' },
    { key: 'group', label: 'Group (Ctrl+G)', icon: <GroupOutlined />, disabled: !multiSelect },
    { key: 'ungroup', label: 'Ungroup (Ctrl+Shift+G)', icon: <UngroupOutlined />, disabled: !hasSelection },
    { type: 'divider' as const, key: 'd3' },
    { key: 'lock', label: 'Lock', icon: <LockOutlined />, disabled: !hasSelection },
    { key: 'unlock', label: 'Unlock', icon: <UnlockOutlined />, disabled: !hasSelection },
  ];

  const handleContextMenuClick = useCallback(({ key }: { key: string }) => {
    const store = useEditorStore.getState();
    const layers = store.content?.layers ?? [];
    switch (key) {
      case 'delete': store.removeLayers(selectedLayerIds); break;
      case 'copy': store.copySelectedLayers(); break;
      case 'cut': store.cutSelectedLayers(); break;
      case 'paste': store.pasteLayers(); break;
      case 'pasteHere': {
        if (pastePosition) {
          store.pasteLayers(pastePosition);
        } else {
          store.pasteLayers();
        }
        break;
      }
      case 'duplicate': {
        const dups = selectedLayerIds.map(id => findLayerById(layers, id)).filter(Boolean) as EditorLayer[];
        if (dups.length > 0) {
          store.addLayersBatch(dups.map(l => ({ ...l, id: generateId(), name: `${l.name} (copy)`, x: l.x + 20, y: l.y + 20 })));
        }
        break;
      }
      case 'bringFront': if (selectedLayerIds[0]) store.bringToFront(selectedLayerIds[0]); break;
      case 'sendBack': if (selectedLayerIds[0]) store.sendToBack(selectedLayerIds[0]); break;
      case 'group': store.groupSelectedLayers(); break;
      case 'ungroup': store.ungroupSelectedLayers(); break;
      case 'lock': selectedLayerIds.forEach(id => { const l = findLayerById(layers, id); if (l && !l.locked) store.toggleLayerLocked(id); }); break;
      case 'unlock': selectedLayerIds.forEach(id => { const l = findLayerById(layers, id); if (l?.locked) store.toggleLayerLocked(id); }); break;
    }
    setContextMenu(null);
  }, [selectedLayerIds, pastePosition]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}>

      {/* ========== TOP BAR ========== */}
      <div style={{
        height: 44, borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 0,
        background: 'var(--bg-toolbar)', flexShrink: 0,
      }}>
        {/* Left: Home + Document title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
          <Tooltip title="Back to Documents">
            <Button type="text" icon={<HomeOutlined />} size="small" onClick={() => navigate('/')}
              style={{ color: 'var(--icon-color)', borderRadius: 6 }} />
          </Tooltip>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
              {title || 'Untitled'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: '14px' }}>
              {isDirty ? 'Unsaved' : 'Saved'} · {content?.canvas.width ?? 0} x {content?.canvas.height ?? 0}
            </div>
          </div>
        </div>

        {/* Center: Tools */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {/* Drawing tools */}
          <ToolBtn icon={<PlusSquareOutlined />} title="Draw Rectangle (R)" onClick={handleDrawRect} active={drawMode === 'rect'} />
          <ToolBtn icon={<BorderOuterOutlined />} title="Draw Ellipse (O)" onClick={handleDrawEllipse} active={drawMode === 'ellipse'} />
          <ToolBtn icon={<LineOutlined />} title="Draw Line (L)" onClick={handleDrawLine} active={drawMode === 'line'} />
          {/* Add shapes (instant) */}
          <ToolBtn icon={<FontSizeOutlined />} title="Add Text (T)" onClick={handleAddText} />
          <ToolBtn icon={<StarOutlined />} title="Add Star" onClick={handleAddStar} />
          <ToolBtn icon={<BorderOuterOutlined />} title="Add Polygon" onClick={handleAddPolygon} />
          <LocalImagePicker />
          <AssetPicker />
          <SvgShapePicker />

          <Sep />

          {/* Undo/Redo */}
          <ToolBtn icon={<UndoOutlined />} title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={!canUndo} />
          <ToolBtn icon={<RedoOutlined />} title="Redo (Ctrl+Shift+Z)" onClick={handleRedo} disabled={!canRedo} />

          <Sep />

          {/* Alignment */}
          <ToolBtn icon={<AlignLeftOutlined />} title="Align Left" disabled={!multiSelect} onClick={() => alignLayers('left')} />
          <ToolBtn icon={<AlignCenterOutlined />} title="Align Center" disabled={!multiSelect} onClick={() => alignLayers('centerH')} />
          <ToolBtn icon={<AlignRightOutlined />} title="Align Right" disabled={!multiSelect} onClick={() => alignLayers('right')} />
          <ToolBtn icon={<VerticalAlignTopOutlined />} title="Align Top" disabled={!multiSelect} onClick={() => alignLayers('top')} />
          <ToolBtn icon={<VerticalAlignMiddleOutlined />} title="Align Middle" disabled={!multiSelect} onClick={() => alignLayers('centerV')} />
          <ToolBtn icon={<VerticalAlignBottomOutlined />} title="Align Bottom" disabled={!multiSelect} onClick={() => alignLayers('bottom')} />

          <Sep />

          {/* Group */}
          <ToolBtn icon={<GroupOutlined />} title="Group (Ctrl+G)" disabled={!multiSelect} onClick={groupSelectedLayers} />
          <ToolBtn icon={<UngroupOutlined />} title="Ungroup (Ctrl+Shift+G)" disabled={!hasSelection} onClick={ungroupSelectedLayers} />
        </div>

        {/* Right: Zoom + Toggles + Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 240, justifyContent: 'flex-end' }}>
          <ToolBtn icon={<ZoomOutOutlined />} title="Zoom Out" onClick={zoomOut} />
          <Button size="small" onClick={zoomTo100}
            style={{ minWidth: 48, fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', color: 'var(--text-secondary)', background: 'transparent' }}>
            {zoomPercent}%
          </Button>
          <ToolBtn icon={<ZoomInOutlined />} title="Zoom In" onClick={zoomIn} />
          <ToolBtn icon={<ExpandOutlined />} title="Fit to Screen (Ctrl+1)" onClick={() => {
            const container = document.querySelector('[data-canvas-container]');
            if (container) { const rect = container.getBoundingClientRect(); zoomToFit(rect.width, rect.height); }
          }} />

          <Sep />

          <ToolBtn icon={<BorderOutlined />} title={showGrid ? 'Hide Grid' : 'Show Grid'} onClick={toggleGrid} active={showGrid} />
          <ToolBtn icon={<AimOutlined />} title={snapEnabled ? 'Disable Snap' : 'Enable Snap'} onClick={toggleSnap} active={snapEnabled} />
          <ToolBtn icon={<BulbOutlined />} title={isDark ? 'Light Mode' : 'Dark Mode'} onClick={toggleTheme} active={isDark} />

          <Sep />

          <ToolBtn icon={<SaveOutlined />} title="Save (Ctrl+S)" onClick={handleSave} />
          <ToolBtn icon={<HistoryOutlined />} title="Version History" onClick={() => setHistoryOpen(true)} />
          <ToolBtn icon={<DownloadOutlined />} title="Export..." onClick={() => setExportOpen(true)} />
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel: Layers */}
        <div style={{
          width: 250, borderRight: '1px solid var(--border)', overflowY: 'auto',
          flexShrink: 0, background: 'var(--bg-panel)',
        }}>
          <LayerTreePanel />
        </div>

        {/* Canvas Area */}
        <div
          data-canvas-container
          className="canvas-bg-pattern"
          style={{
            flex: 1, overflow: 'hidden', position: 'relative',
            background: 'var(--bg-canvas)',
          }}
          onClick={handleCanvasAreaClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onContextMenu={(e) => {
            e.preventDefault();
            // Calculate paste position from mouse position
            const container = e.currentTarget.getBoundingClientRect();
            const state = useEditorStore.getState();
            const canvasX = (e.clientX - container.left - state.offsetX) / state.zoom;
            const canvasY = (e.clientY - container.top - state.offsetY) / state.zoom;
            setPastePosition({ x: canvasX, y: canvasY });
            setContextMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          <EditorStage />
          {/* Context Menu */}
          {contextMenu && (
            <Dropdown menu={{ items: contextMenuItems, onClick: handleContextMenuClick }} open trigger={['contextMenu']}
              overlayStyle={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}>
              <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, width: 0, height: 0 }} />
            </Dropdown>
          )}
        </div>

        {/* Right Panel: Properties */}
        <div style={{
          width: 280, borderLeft: '1px solid var(--border)', overflowY: 'auto',
          flexShrink: 0, background: 'var(--bg-panel)',
        }}>
          <PropertyPanel />
        </div>
      </div>

      {/* ========== STATUS BAR ========== */}
      <div style={{
        height: 26, borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 12px',
        background: 'var(--bg-panel-header)', flexShrink: 0,
        fontSize: 11, color: 'var(--text-tertiary)', gap: 16,
      }}>
        <span>{layerCount} layer{layerCount !== 1 ? 's' : ''}</span>
        <span>{content?.canvas.width ?? 0} x {content?.canvas.height ?? 0}</span>
        <span>Zoom: {zoomPercent}%</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: isDirty ? 'var(--accent)' : 'var(--text-tertiary)' }}>
          {isDirty ? '● Unsaved changes' : '✓ Saved'}
        </span>
      </div>

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
};
