import { useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import type Konva from 'konva';

export function useExportImage() {
  const { stageRef, content, title } = useEditorStore(
    useShallow((s) => ({
      stageRef: s.stageRef as Konva.Stage | null,
      content: s.content,
      title: s.title,
    }))
  );

  const downloadImage = useCallback(
    async (filename?: string, format: 'png' | 'jpeg' = 'png', quality = 1) => {
      if (!stageRef || !content) {
        console.error('No stage or content available');
        return false;
      }

      const stage = stageRef;
      const layer = stage.children[0] as Konva.Layer;
      if (!layer) {
        console.error('No layer found');
        return false;
      }

      // Find and hide the transformer
      const children = layer.children as Konva.Node[];
      const transformer = children?.find((child) => child.name() === 'transformer') as Konva.Transformer | undefined;
      const wasVisible = transformer?.visible();
      if (transformer) {
        transformer.visible(false);
      }

      // Store current viewport state
      const oldScaleX = stage.scaleX();
      const oldScaleY = stage.scaleY();
      const oldX = stage.x();
      const oldY = stage.y();
      const oldWidth = stage.width();
      const oldHeight = stage.height();

      // Use 2x resolution for crisp output
      const pixelRatio = 2;
      const exportWidth = content.canvas.width;
      const exportHeight = content.canvas.height;

      // Reset to 1:1 scale for export
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
      stage.size({
        width: exportWidth,
        height: exportHeight,
      });

      // Draw
      layer.batchDraw();

      try {
        // Export with high pixel ratio for crisp text
        const blob = await new Promise<Blob | null>((resolve) => {
          stage.toDataURL({
            mimeType: `image/${format}`,
            quality,
            pixelRatio,
          });
          // Konva's toDataURL returns string, need to convert to blob
          const dataUrl = stage.toDataURL({
            mimeType: `image/${format}`,
            quality,
            pixelRatio,
          });
          fetch(dataUrl)
            .then((res) => res.blob())
            .then(resolve)
            .catch(() => resolve(null));
        });

        if (!blob) {
          console.error('Failed to create blob');
          return false;
        }

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename || title || 'canvas'}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
      } finally {
        // Restore viewport state
        stage.scale({ x: oldScaleX, y: oldScaleY });
        stage.position({ x: oldX, y: oldY });
        stage.size({ width: oldWidth, height: oldHeight });

        // Restore transformer visibility
        if (transformer && wasVisible !== undefined) {
          transformer.visible(wasVisible);
        }

        layer.batchDraw();
      }
    },
    [stageRef, content, title]
  );

  return { downloadImage };
}