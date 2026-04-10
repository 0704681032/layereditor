import { useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

// Will be set by EditorStage
let stageInstance: any = null;

export function setExportStage(stage: any) {
  stageInstance = stage;
}

export function useExportImage() {
  const content = useEditorStore((s) => s.content);
  const title = useEditorStore((s) => s.title);

  const downloadImage = useCallback(
    async (filename?: string, format: 'png' | 'jpeg' = 'png', quality = 1) => {
      if (!stageInstance || !content) {
        console.error('No stage or content available');
        return false;
      }

      const stage = stageInstance;
      const layer = stage.children?.[0];
      if (!layer) {
        console.error('No layer found');
        return false;
      }

      // Find and hide the transformer
      const transformer = layer.children?.find((child: any) => child.name() === 'transformer');
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
          stage.toBlob({
            mimeType: `image/${format}`,
            quality,
            pixelRatio,
            callback: (blob: Blob | null) => resolve(blob),
          });
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
    [content, title]
  );

  return { downloadImage };
}