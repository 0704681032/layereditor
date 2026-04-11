import { type FC, memo } from 'react';
import { Line, Text } from 'react-konva';
import type { EditorLayer } from '../../types';
import { flattenLayers } from '../../utils/layerTree';

// Guide types for visual differentiation
export type GuideType = 'edge' | 'center' | 'spacing' | 'equal';

export interface GuideLine {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  guideType: GuideType;
  spacingValue?: number; // Distance value in pixels (for spacing guides)
  relatedLayerId?: string; // The layer this guide relates to
}

// Colors for different guide types
const GUIDE_COLORS: Record<GuideType, string> = {
  edge: '#FF0066',     // Pink - edge alignment
  center: '#00A8FF',   // Blue - center alignment
  spacing: '#4CAF50',  // Green - equal spacing
  equal: '#9C27B0',    // Purple - equal distribution
};

const GUIDE_WIDTH = 1;
const THRESHOLD = 3;

/**
 * Get layer dimensions with defaults
 */
function getLayerDimensions(layer: EditorLayer): { w: number; h: number } {
  const w = layer.width ?? (layer.type === 'text' ? 200 : 100);
  const h = layer.height ?? (layer.type === 'text' ? 40 : 100);
  return { w, h };
}

/**
 * Calculate smart guide lines based on the dragged layer's position relative to other layers.
 * Includes edge alignment, center alignment, and equal spacing detection.
 */
export function calculateGuideLines(
  draggedLayer: EditorLayer,
  allLayers: EditorLayer[],
  canvasWidth: number,
  canvasHeight: number,
  threshold: number = THRESHOLD,
): GuideLine[] {
  const guides: GuideLine[] = [];
  const { w, h } = getLayerDimensions(draggedLayer);

  const cur = {
    left: draggedLayer.x,
    right: draggedLayer.x + w,
    top: draggedLayer.y,
    bottom: draggedLayer.y + h,
    centerX: draggedLayer.x + w / 2,
    centerY: draggedLayer.y + h / 2,
  };

  // Canvas center guides
  const canvasCX = canvasWidth / 2;
  const canvasCY = canvasHeight / 2;
  if (Math.abs(cur.centerX - canvasCX) < threshold) {
    guides.push({ id: 'vc-canvas', type: 'vertical', position: canvasCX, guideType: 'center' });
  }
  if (Math.abs(cur.centerY - canvasCY) < threshold) {
    guides.push({ id: 'hc-canvas', type: 'horizontal', position: canvasCY, guideType: 'center' });
  }

  // Flatten all layers including group children
  const flatLayers = flattenLayers(allLayers)
    .filter((l) => l.layer.id !== draggedLayer.id);

  // Collect all layer bounds for spacing detection
  const allBounds: Array<{ id: string; left: number; right: number; top: number; bottom: number; centerX: number; centerY: number }> = [];

  for (const { layer } of flatLayers) {
    const { w: lw, h: lh } = getLayerDimensions(layer);

    const other = {
      left: layer.x,
      right: layer.x + lw,
      top: layer.y,
      bottom: layer.y + lh,
      centerX: layer.x + lw / 2,
      centerY: layer.y + lh / 2,
    };
    allBounds.push({ id: layer.id, ...other });

    // Edge alignment guides (vertical)
    if (Math.abs(cur.left - other.left) < threshold) {
      guides.push({ id: `vl-vl-${layer.id}`, type: 'vertical', position: other.left, guideType: 'edge', relatedLayerId: layer.id });
    }
    if (Math.abs(cur.right - other.right) < threshold) {
      guides.push({ id: `vr-vr-${layer.id}`, type: 'vertical', position: other.right, guideType: 'edge', relatedLayerId: layer.id });
    }
    if (Math.abs(cur.left - other.right) < threshold) {
      guides.push({ id: `vl-vr-${layer.id}`, type: 'vertical', position: other.right, guideType: 'edge', relatedLayerId: layer.id });
    }
    if (Math.abs(cur.right - other.left) < threshold) {
      guides.push({ id: `vr-vl-${layer.id}`, type: 'vertical', position: other.left, guideType: 'edge', relatedLayerId: layer.id });
    }

    // Center alignment guides (vertical)
    if (Math.abs(cur.centerX - other.centerX) < threshold) {
      guides.push({ id: `vcx-${layer.id}`, type: 'vertical', position: other.centerX, guideType: 'center', relatedLayerId: layer.id });
    }

    // Edge alignment guides (horizontal)
    if (Math.abs(cur.top - other.top) < threshold) {
      guides.push({ id: `ht-ht-${layer.id}`, type: 'horizontal', position: other.top, guideType: 'edge', relatedLayerId: layer.id });
    }
    if (Math.abs(cur.bottom - other.bottom) < threshold) {
      guides.push({ id: `hb-hb-${layer.id}`, type: 'horizontal', position: other.bottom, guideType: 'edge', relatedLayerId: layer.id });
    }
    if (Math.abs(cur.top - other.bottom) < threshold) {
      guides.push({ id: `ht-hb-${layer.id}`, type: 'horizontal', position: other.bottom, guideType: 'edge', relatedLayerId: layer.id });
    }
    if (Math.abs(cur.bottom - other.top) < threshold) {
      guides.push({ id: `hb-ht-${layer.id}`, type: 'horizontal', position: other.top, guideType: 'edge', relatedLayerId: layer.id });
    }

    // Center alignment guides (horizontal)
    if (Math.abs(cur.centerY - other.centerY) < threshold) {
      guides.push({ id: `hcy-${layer.id}`, type: 'horizontal', position: other.centerY, guideType: 'center', relatedLayerId: layer.id });
    }
  }

  // Detect equal spacing guides
  const spacingGuides = detectEqualSpacing(cur, allBounds, threshold);
  guides.push(...spacingGuides);

  return guides;
}

/**
 * Detect when layer spacing is equal to other layer spacings
 * Returns guides showing the equal spacing relationship
 */
function detectEqualSpacing(
  current: { left: number; right: number; top: number; bottom: number; centerX: number; centerY: number },
  others: Array<{ id: string; left: number; right: number; top: number; bottom: number; centerX: number; centerY: number }>,
  threshold: number,
): GuideLine[] {
  const guides: GuideLine[] = [];

  if (others.length < 2) return guides;

  // Check horizontal spacing (left side gaps)
  const leftGaps: Array<{ layerId: string; gap: number }> = [];
  for (const other of others) {
    // Gap between current left edge and other right edge
    const gapLeft = current.left - other.right;
    if (gapLeft > 0 && gapLeft < 200) {
      leftGaps.push({ layerId: other.id, gap: gapLeft });
    }
  }

  // Check if left gaps are equal
  if (leftGaps.length >= 2) {
    const sortedGaps = leftGaps.sort((a, b) => a.gap - b.gap);
    for (let i = 0; i < sortedGaps.length - 1; i++) {
      if (Math.abs(sortedGaps[i].gap - sortedGaps[i + 1].gap) < threshold) {
        const avgGap = (sortedGaps[i].gap + sortedGaps[i + 1].gap) / 2;
        // Add spacing guide showing the gap
        guides.push({
          id: `hgap-left-${sortedGaps[i].layerId}`,
          type: 'horizontal',
          position: current.top,
          guideType: 'spacing',
          spacingValue: Math.round(avgGap),
          relatedLayerId: sortedGaps[i].layerId,
        });
      }
    }
  }

  // Check vertical spacing (top side gaps)
  const topGaps: Array<{ layerId: string; gap: number }> = [];
  for (const other of others) {
    const gapTop = current.top - other.bottom;
    if (gapTop > 0 && gapTop < 200) {
      topGaps.push({ layerId: other.id, gap: gapTop });
    }
  }

  // Check if top gaps are equal
  if (topGaps.length >= 2) {
    const sortedGaps = topGaps.sort((a, b) => a.gap - b.gap);
    for (let i = 0; i < sortedGaps.length - 1; i++) {
      if (Math.abs(sortedGaps[i].gap - sortedGaps[i + 1].gap) < threshold) {
        const avgGap = (sortedGaps[i].gap + sortedGaps[i + 1].gap) / 2;
        guides.push({
          id: `vgap-top-${sortedGaps[i].layerId}`,
          type: 'vertical',
          position: current.left,
          guideType: 'spacing',
          spacingValue: Math.round(avgGap),
          relatedLayerId: sortedGaps[i].layerId,
        });
      }
    }
  }

  // Check equal distribution for 3+ layers
  if (others.length >= 2) {
    // Horizontal distribution
    const sortedX = [...others, { id: 'current', left: current.left, right: current.right, top: current.top, bottom: current.bottom, centerX: current.centerX, centerY: current.centerY }]
      .sort((a, b) => a.centerX - b.centerX);

    // Check if spacing between consecutive layers is roughly equal
    const hSpacings: number[] = [];
    for (let i = 0; i < sortedX.length - 1; i++) {
      hSpacings.push(sortedX[i + 1].left - sortedX[i].right);
    }

    if (hSpacings.length >= 2) {
      const avgSpacing = hSpacings.reduce((a, b) => a + b, 0) / hSpacings.length;
      const allEqual = hSpacings.every(s => Math.abs(s - avgSpacing) < threshold * 3);
      if (allEqual && avgSpacing > 5) {
        guides.push({
          id: `hdist-equal`,
          type: 'horizontal',
          position: current.centerY,
          guideType: 'equal',
          spacingValue: Math.round(avgSpacing),
        });
      }
    }

    // Vertical distribution
    const sortedY = [...others, { id: 'current', left: current.left, right: current.right, top: current.top, bottom: current.bottom, centerX: current.centerX, centerY: current.centerY }]
      .sort((a, b) => a.centerY - b.centerY);

    const vSpacings: number[] = [];
    for (let i = 0; i < sortedY.length - 1; i++) {
      vSpacings.push(sortedY[i + 1].top - sortedY[i].bottom);
    }

    if (vSpacings.length >= 2) {
      const avgSpacing = vSpacings.reduce((a, b) => a + b, 0) / vSpacings.length;
      const allEqual = vSpacings.every(s => Math.abs(s - avgSpacing) < threshold * 3);
      if (allEqual && avgSpacing > 5) {
        guides.push({
          id: `vdist-equal`,
          type: 'vertical',
          position: current.centerX,
          guideType: 'equal',
          spacingValue: Math.round(avgSpacing),
        });
      }
    }
  }

  return guides;
}

interface SmartGuidesProps {
  guides: GuideLine[];
  canvasWidth: number;
  canvasHeight: number;
  zoom?: number;
}

export const SmartGuides: FC<SmartGuidesProps> = memo(({ guides, canvasWidth, canvasHeight, zoom = 1 }) => {
  if (guides.length === 0) return null;

  const fontSize = Math.max(10, 12 / zoom);

  return (
    <>
      {guides.map((guide) => {
        const color = GUIDE_COLORS[guide.guideType];
        const isHorizontal = guide.type === 'horizontal';

        // Draw the guide line
        const line = isHorizontal ? (
          <Line
            key={guide.id + '-line'}
            points={[0, guide.position, canvasWidth, guide.position]}
            stroke={color}
            strokeWidth={GUIDE_WIDTH}
            dash={guide.guideType === 'spacing' || guide.guideType === 'equal' ? [6, 3] : [4, 4]}
            listening={false}
            perfectDrawEnabled={false}
          />
        ) : (
          <Line
            key={guide.id + '-line'}
            points={[guide.position, 0, guide.position, canvasHeight]}
            stroke={color}
            strokeWidth={GUIDE_WIDTH}
            dash={guide.guideType === 'spacing' || guide.guideType === 'equal' ? [6, 3] : [4, 4]}
            listening={false}
            perfectDrawEnabled={false}
          />
        );

        // Draw spacing value text if present
        const text = guide.spacingValue !== undefined ? (
          isHorizontal ? (
            <Text
              key={guide.id + '-text'}
              x={canvasWidth - 50}
              y={guide.position - fontSize - 2}
              text={`${guide.spacingValue}px`}
              fontSize={fontSize}
              fill={color}
              listening={false}
            />
          ) : (
            <Text
              key={guide.id + '-text'}
              x={guide.position + 4}
              y={10}
              text={`${guide.spacingValue}px`}
              fontSize={fontSize}
              fill={color}
              listening={false}
            />
          )
        ) : null;

        return (
          <>
            {line}
            {text}
          </>
        );
      })}
    </>
  );
});