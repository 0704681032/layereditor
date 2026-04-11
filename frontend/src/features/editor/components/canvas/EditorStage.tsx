import { type FC, useCallback, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Ellipse } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore, type DrawMode } from '../../store/editorStore';
import { LayerRenderer } from './LayerRenderer';
import { SelectionTransformer } from './SelectionTransformer';
import { GridOverlay } from './GridOverlay';
import { SmartGuides } from './SmartGuides';
import type { GuideLine } from './SmartGuides';
import { useShallow } from 'zustand/react/shallow';
import { generateId } from '../../utils/layerTree';
import { useGoogleFontsLoader, preloadCommonFonts } from '../../hooks/useGoogleFonts';
import type { TextLayer, EditorLayer } from '../../types';

// Extract text layers from all layers (including nested groups)
function extractTextLayers(layers: EditorLayer[]): TextLayer[] {
  const textLayers: TextLayer[] = [];
  for (const layer of layers) {
    if (layer.type === 'text') {
      textLayers.push(layer as TextLayer);
    } else if (layer.type === 'group' && 'children' in layer) {
      textLayers.push(...extractTextLayers((layer as any).children));
    }
  }
  return textLayers;
}

export const EditorStage: FC = () => {
  const { content, zoom, offsetX, offsetY, setViewport, selectLayers, setStageRef, showGrid, theme, guideLines,
    drawMode, drawPreview, setDrawPreview, finishDrawing, setDrawMode } = useEditorStore(
    useShallow((s) => ({
      content: s.content, zoom: s.zoom, offsetX: s.offsetX, offsetY: s.offsetY,
      setViewport: s.setViewport, selectLayers: s.selectLayers, setStageRef: s.setStageRef,
      showGrid: s.showGrid, theme: s.theme, guideLines: s.guideLines,
      drawMode: s.drawMode, drawPreview: s.drawPreview, setDrawPreview: s.setDrawPreview,
      finishDrawing: s.finishDrawing, setDrawMode: s.setDrawMode,
    }))
  );

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

  // Preload common Google Fonts on mount
  useEffect(() => {
    preloadCommonFonts();
  }, []);

  // Load fonts used in text layers
  const textLayers = content ? extractTextLayers(content.layers) : [];
  useGoogleFontsLoader(textLayers);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setContainerSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setStageRef(stageRef.current);
    return () => { setStageRef(null); };
  }, [setStageRef]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = { x: (pointer.x - offsetX) / oldScale, y: (pointer.y - offsetY) / oldScale };
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.05;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));
      setViewport(clampedScale, pointer.x - mousePointTo.x * clampedScale, pointer.y - mousePointTo.y * clampedScale);
    },
    [zoom, offsetX, offsetY, setViewport]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (drawMode !== 'none') return; // Don't deselect while drawing
      if (e.target === e.target.getStage()) selectLayers([]);
    },
    [selectLayers, drawMode]
  );

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - offsetX) / zoom,
        y: (screenY - offsetY) / zoom,
      };
    },
    [zoom, offsetX, offsetY]
  );

  // Handle drawing mouse down
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (drawMode === 'none' || !content) return;
      // Only start drawing on canvas background or empty area
      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const canvasPos = screenToCanvas(pos.x, pos.y);
      // Clamp to canvas bounds
      const x = Math.max(0, Math.min(content.canvas.width, canvasPos.x));
      const y = Math.max(0, Math.min(content.canvas.height, canvasPos.y));

      drawStartRef.current = { x, y };
      setDrawPreview({ x, y, width: 0, height: 0 });
    },
    [drawMode, content, screenToCanvas, setDrawPreview]
  );

  // Handle drawing mouse move
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (drawMode === 'none' || !drawStartRef.current || !content) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const canvasPos = screenToCanvas(pos.x, pos.y);
      // Clamp to canvas bounds
      const endX = Math.max(0, Math.min(content.canvas.width, canvasPos.x));
      const endY = Math.max(0, Math.min(content.canvas.height, canvasPos.y));

      const startX = drawStartRef.current.x;
      const startY = drawStartRef.current.y;

      setDrawPreview({
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
      });
    },
    [drawMode, content, screenToCanvas, setDrawPreview]
  );

  // Handle drawing mouse up - create the layer
  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (drawMode === 'none' || !drawStartRef.current || !drawPreview || !content) {
        drawStartRef.current = null;
        return;
      }

      const { x, y, width, height } = drawPreview;
      // Only create if has reasonable size
      if (width > 5 && height > 5) {
        const id = generateId();
        if (drawMode === 'rect') {
          finishDrawing({
            id,
            type: 'rect',
            name: 'Rectangle',
            x,
            y,
            width,
            height,
            fill: '#4A90D9',
            visible: true,
            locked: false,
          });
        } else if (drawMode === 'ellipse') {
          finishDrawing({
            id,
            type: 'ellipse',
            name: 'Ellipse',
            x,
            y,
            width,
            height,
            fill: '#E86B56',
            visible: true,
            locked: false,
          });
        } else if (drawMode === 'line') {
          finishDrawing({
            id,
            type: 'line',
            name: 'Line',
            x,
            y,
            width,
            height,
            stroke: '#333333',
            strokeWidth: 2,
            points: [0, 0, width, height > width ? height : 0],
            visible: true,
            locked: false,
          });
        }
      }

      drawStartRef.current = null;
      setDrawPreview(null);
    },
    [drawMode, drawPreview, content, finishDrawing, setDrawPreview]
  );

  // Cancel drawing on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawMode !== 'none') {
        drawStartRef.current = null;
        setDrawPreview(null);
        setDrawMode('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawMode, setDrawMode, setDrawPreview]);

  if (!content) return null;

  const isDark = theme === 'dark';

  return (
    <div ref={containerRef}
      style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: drawMode !== 'none' ? 'crosshair' : 'default',
      }}>
      <Stage
        ref={stageRef as never}
        width={containerSize.width}
        height={containerSize.height}
        scaleX={zoom} scaleY={zoom}
        x={offsetX} y={offsetY}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        draggable={drawMode === 'none'}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) setViewport(zoom, e.target.x(), e.target.y());
        }}
      >
        <Layer>
          {/* Canvas white area with subtle shadow */}
          <Rect x={0} y={0} width={content.canvas.width} height={content.canvas.height}
            fill={content.canvas.background}
            shadowColor={isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)'}
            shadowBlur={isDark ? 30 : 20}
            shadowOffsetX={0}
            shadowOffsetY={isDark ? 6 : 4}
            shadowEnabled={true}
            listening={false}
          />
          {/* Grid overlay */}
          {showGrid && <GridOverlay width={content.canvas.width} height={content.canvas.height} />}
          {/* Layers */}
          {content.layers.map((layer) => <LayerRenderer key={layer.id} layer={layer} />)}
          {/* Draw preview shape */}
          {drawPreview && drawMode !== 'none' && (
            drawMode === 'ellipse' ? (
              <Ellipse
                x={drawPreview.x + drawPreview.width / 2}
                y={drawPreview.y + drawPreview.height / 2}
                radiusX={drawPreview.width / 2}
                radiusY={drawPreview.height / 2}
                fill="rgba(232, 107, 86, 0.4)"
                stroke="#E86B56"
                strokeWidth={2}
                listening={false}
              />
            ) : (
              <Rect
                x={drawPreview.x}
                y={drawPreview.y}
                width={drawPreview.width}
                height={drawPreview.height}
                fill="rgba(74, 144, 217, 0.4)"
                stroke="#4A90D9"
                strokeWidth={2}
                listening={false}
              />
            )
          )}
          {/* Selection transformer */}
          <SelectionTransformer />
          {/* Smart guide lines */}
          {guideLines.length > 0 && (
            <SmartGuides guides={guideLines} canvasWidth={content.canvas.width} canvasHeight={content.canvas.height} />
          )}
        </Layer>
      </Stage>
    </div>
  );
};
