/**
 * 吸附和对其工具函数
 */

// 默认吸附网格大小
const DEFAULT_GRID_SIZE = 10;

// 默认吸附阈值（距离多少像素内开始吸附）
const DEFAULT_SNAP_THRESHOLD = 5;

interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
}

interface BoundingBox {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Spacing guide for equal spacing detection
export interface SpacingGuide {
  type: 'horizontal' | 'vertical';
  targetPosition: number;
  spacing: number;
  snapped: boolean;
}

/**
 * 吸附到网格
 */
export function snapToGrid(value: number, gridSize: number = DEFAULT_GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * 检查是否应该吸附到网格
 */
export function shouldSnapToGrid(value: number, gridSize: number = DEFAULT_GRID_SIZE, threshold: number = DEFAULT_SNAP_THRESHOLD): boolean {
  const snapped = snapToGrid(value, gridSize);
  return Math.abs(value - snapped) < threshold;
}

/**
 * 对图层位置进行网格吸附
 */
export function snapLayerToGrid(x: number, y: number, gridSize: number = DEFAULT_GRID_SIZE, threshold: number = DEFAULT_SNAP_THRESHOLD): SnapResult {
  const snappedX = shouldSnapToGrid(x, gridSize, threshold);
  const snappedY = shouldSnapToGrid(y, gridSize, threshold);

  return {
    x: snappedX ? snapToGrid(x, gridSize) : x,
    y: snappedY ? snapToGrid(y, gridSize) : y,
    snappedX,
    snappedY,
  };
}

/**
 * 计算图层的边界框
 */
export function getBoundingBox(layer: { x: number; y: number; width?: number; height?: number }): BoundingBox {
  return {
    x: layer.x,
    y: layer.y,
    width: layer.width ?? 100,
    height: layer.height ?? 100,
  };
}

/**
 * 对齐到其他图层
 * 返回最近的吸附位置
 */
export function snapToLayers(
  currentX: number,
  currentY: number,
  currentWidth: number,
  currentHeight: number,
  otherLayers: BoundingBox[],
  threshold: number = DEFAULT_SNAP_THRESHOLD
): SnapResult {
  let bestX = currentX;
  let bestY = currentY;
  let snappedX = false;
  let snappedY = false;
  // 追踪最近距离，确保始终吸附到最近的边缘而非最后遍历到的边缘
  let bestDistX = threshold;
  let bestDistY = threshold;

  // 当前图层的各边缘
  const currentLeft = currentX;
  const currentRight = currentX + currentWidth;
  const currentTop = currentY;
  const currentBottom = currentY + currentHeight;
  const currentCenterX = currentX + currentWidth / 2;
  const currentCenterY = currentY + currentHeight / 2;

  for (const other of otherLayers) {
    const otherLeft = other.x;
    const otherRight = other.x + other.width;
    const otherTop = other.y;
    const otherBottom = other.y + other.height;
    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;

    // X轴吸附候选：收集当前图层与目标图层的5种对齐方式及其距离
    const xPairs: Array<{ dist: number; snapX: number }> = [
      { dist: Math.abs(currentLeft - otherRight), snapX: otherRight },       // 左对齐右
      { dist: Math.abs(currentRight - otherLeft), snapX: otherLeft - currentWidth }, // 右对齐左
      { dist: Math.abs(currentLeft - otherLeft), snapX: otherLeft },          // 左对齐左
      { dist: Math.abs(currentRight - otherRight), snapX: otherRight - currentWidth }, // 右对齐右
      { dist: Math.abs(currentCenterX - otherCenterX), snapX: otherCenterX - currentWidth / 2 }, // 中心对齐
    ];
    // 仅在距离小于当前最近距离时更新，保证吸附到最近边缘
    for (const p of xPairs) {
      if (p.dist < bestDistX) {
        bestDistX = p.dist;
        bestX = p.snapX;
        snappedX = true;
      }
    }

    // Y轴吸附候选：同X轴逻辑，5种对齐方式
    const yPairs: Array<{ dist: number; snapY: number }> = [
      { dist: Math.abs(currentTop - otherBottom), snapY: otherBottom },       // 顶对齐底
      { dist: Math.abs(currentBottom - otherTop), snapY: otherTop - currentHeight }, // 底对齐顶
      { dist: Math.abs(currentTop - otherTop), snapY: otherTop },             // 顶对齐顶
      { dist: Math.abs(currentBottom - otherBottom), snapY: otherBottom - currentHeight }, // 底对齐底
      { dist: Math.abs(currentCenterY - otherCenterY), snapY: otherCenterY - currentHeight / 2 }, // 中心对齐
    ];
    for (const p of yPairs) {
      if (p.dist < bestDistY) {
        bestDistY = p.dist;
        bestY = p.snapY;
        snappedY = true;
      }
    }
  }

  return {
    x: bestX,
    y: bestY,
    snappedX,
    snappedY,
  };
}

/**
 * 综合吸附（网格 + 图层）
 */
export function snapPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  otherLayers: BoundingBox[],
  snapToGridEnabled: boolean = true,
  snapToLayersEnabled: boolean = true,
  threshold: number = DEFAULT_SNAP_THRESHOLD
): SnapResult {
  const result: SnapResult = { x, y, snappedX: false, snappedY: false };

  // 先进行图层吸附（优先级更高）
  if (snapToLayersEnabled && otherLayers.length > 0) {
    const layerSnap = snapToLayers(x, y, width, height, otherLayers, threshold);
    if (layerSnap.snappedX) {
      result.x = layerSnap.x;
      result.snappedX = true;
    }
    if (layerSnap.snappedY) {
      result.y = layerSnap.y;
      result.snappedY = true;
    }
  }

  // 如果没有吸附到图层，再进行网格吸附
  if (snapToGridEnabled) {
    if (!result.snappedX) {
      const gridX = snapToGrid(x);
      if (shouldSnapToGrid(x, DEFAULT_GRID_SIZE, threshold)) {
        result.x = gridX;
        result.snappedX = true;
      }
    }
    if (!result.snappedY) {
      const gridY = snapToGrid(y);
      if (shouldSnapToGrid(y, DEFAULT_GRID_SIZE, threshold)) {
        result.y = gridY;
        result.snappedY = true;
      }
    }
  }

  return result;
}

/**
 * 等间距吸附 - 当图层间距与其他图层间距相等时吸附
 */
export function snapToEqualSpacing(
  currentX: number,
  currentY: number,
  currentWidth: number,
  currentHeight: number,
  otherLayers: BoundingBox[],
  threshold: number = DEFAULT_SNAP_THRESHOLD,
): { x: number; y: number; spacingGuides: SpacingGuide[] } {
  let resultX = currentX;
  let resultY = currentY;
  const spacingGuides: SpacingGuide[] = [];

  if (otherLayers.length < 2) {
    return { x: resultX, y: resultY, spacingGuides };
  }

  // Current layer bounds
  const curLeft = currentX;
  const curRight = currentX + currentWidth;
  const curTop = currentY;
  const curBottom = currentY + currentHeight;

  // Collect all gaps from other layers
  const leftGaps: Array<{ layerId: string; gap: number; targetRight: number }> = [];
  const rightGaps: Array<{ layerId: string; gap: number; targetLeft: number }> = [];
  const topGaps: Array<{ layerId: string; gap: number; targetBottom: number }> = [];
  const bottomGaps: Array<{ layerId: string; gap: number; targetTop: number }> = [];

  for (const other of otherLayers) {
    // Gap on left side (distance from current left to other right)
    const gapLeft = curLeft - (other.x + other.width);
    if (gapLeft > -50 && gapLeft < 200) {
      leftGaps.push({
        layerId: other.id || 'other',
        gap: gapLeft > 0 ? gapLeft : 0,
        targetRight: other.x + other.width,
      });
    }

    // Gap on right side (distance from other left to current right)
    const gapRight = other.x - curRight;
    if (gapRight > -50 && gapRight < 200) {
      rightGaps.push({
        layerId: other.id || 'other',
        gap: gapRight > 0 ? gapRight : 0,
        targetLeft: other.x,
      });
    }

    // Gap on top side
    const gapTop = curTop - (other.y + other.height);
    if (gapTop > -50 && gapTop < 200) {
      topGaps.push({
        layerId: other.id || 'other',
        gap: gapTop > 0 ? gapTop : 0,
        targetBottom: other.y + other.height,
      });
    }

    // Gap on bottom side
    const gapBottom = other.y - curBottom;
    if (gapBottom > -50 && gapBottom < 200) {
      bottomGaps.push({
        layerId: other.id || 'other',
        gap: gapBottom > 0 ? gapBottom : 0,
        targetTop: other.y,
      });
    }
  }

  // Check for equal horizontal spacing (left side)
  if (leftGaps.length >= 2) {
    const positiveGaps = leftGaps.filter(g => g.gap > 0);
    if (positiveGaps.length >= 2) {
      positiveGaps.sort((a, b) => a.gap - b.gap);
      for (let i = 0; i < positiveGaps.length - 1; i++) {
        const diff = Math.abs(positiveGaps[i].gap - positiveGaps[i + 1].gap);
        if (diff < threshold) {
          const avgGap = (positiveGaps[i].gap + positiveGaps[i + 1].gap) / 2;
          const targetX = positiveGaps[i].targetRight + avgGap;
          if (Math.abs(currentX - targetX) < threshold) {
            resultX = targetX;
            spacingGuides.push({
              type: 'horizontal',
              targetPosition: currentY + currentHeight / 2,
              spacing: Math.round(avgGap),
              snapped: true,
            });
          }
        }
      }
    }
  }

  // Check for equal vertical spacing (top side)
  if (topGaps.length >= 2) {
    const positiveGaps = topGaps.filter(g => g.gap > 0);
    if (positiveGaps.length >= 2) {
      positiveGaps.sort((a, b) => a.gap - b.gap);
      for (let i = 0; i < positiveGaps.length - 1; i++) {
        const diff = Math.abs(positiveGaps[i].gap - positiveGaps[i + 1].gap);
        if (diff < threshold) {
          const avgGap = (positiveGaps[i].gap + positiveGaps[i + 1].gap) / 2;
          const targetY = positiveGaps[i].targetBottom + avgGap;
          if (Math.abs(currentY - targetY) < threshold) {
            resultY = targetY;
            spacingGuides.push({
              type: 'vertical',
              targetPosition: currentX + currentWidth / 2,
              spacing: Math.round(avgGap),
              snapped: true,
            });
          }
        }
      }
    }
  }

  return { x: resultX, y: resultY, spacingGuides };
}

/**
 * 计算图层的边界框（带ID）
 */
export function getBoundingBoxWithId(
  layer: { id?: string; x: number; y: number; width?: number; height?: number },
): BoundingBox & { id: string } {
  return {
    id: layer.id || 'unknown',
    x: layer.x,
    y: layer.y,
    width: layer.width ?? 100,
    height: layer.height ?? 100,
  };
}

/**
 * 导出默认阈值供其他模块使用
 */
export { DEFAULT_SNAP_THRESHOLD as SNAP_THRESHOLD, DEFAULT_GRID_SIZE as GRID_SIZE };