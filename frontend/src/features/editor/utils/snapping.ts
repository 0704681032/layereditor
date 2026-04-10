/**
 * 吸附和对其工具函数
 */

// 吸附网格大小
const GRID_SIZE = 10;

// 吸附阈值（距离多少像素内开始吸附）
const SNAP_THRESHOLD = 5;

interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 吸附到网格
 */
export function snapToGrid(value: number, gridSize: number = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * 检查是否应该吸附到网格
 */
export function shouldSnapToGrid(value: number, gridSize: number = GRID_SIZE, threshold: number = SNAP_THRESHOLD): boolean {
  const snapped = snapToGrid(value, gridSize);
  return Math.abs(value - snapped) < threshold;
}

/**
 * 对图层位置进行网格吸附
 */
export function snapLayerToGrid(x: number, y: number): SnapResult {
  const snappedX = shouldSnapToGrid(x);
  const snappedY = shouldSnapToGrid(y);

  return {
    x: snappedX ? snapToGrid(x) : x,
    y: snappedY ? snapToGrid(y) : y,
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
  threshold: number = SNAP_THRESHOLD
): SnapResult {
  let bestX = currentX;
  let bestY = currentY;
  let snappedX = false;
  let snappedY = false;

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

    // X 轴吸附检查
    // 左边对齐右边
    if (Math.abs(currentLeft - otherRight) < threshold) {
      bestX = otherRight;
      snappedX = true;
    }
    // 右边对齐左边
    if (Math.abs(currentRight - otherLeft) < threshold) {
      bestX = otherLeft - currentWidth;
      snappedX = true;
    }
    // 左边对齐左边
    if (Math.abs(currentLeft - otherLeft) < threshold) {
      bestX = otherLeft;
      snappedX = true;
    }
    // 右边对齐右边
    if (Math.abs(currentRight - otherRight) < threshold) {
      bestX = otherRight - currentWidth;
      snappedX = true;
    }
    // 中心对齐
    if (Math.abs(currentCenterX - otherCenterX) < threshold) {
      bestX = otherCenterX - currentWidth / 2;
      snappedX = true;
    }

    // Y 轴吸附检查
    // 顶边对齐底边
    if (Math.abs(currentTop - otherBottom) < threshold) {
      bestY = otherBottom;
      snappedY = true;
    }
    // 底边对齐顶边
    if (Math.abs(currentBottom - otherTop) < threshold) {
      bestY = otherTop - currentHeight;
      snappedY = true;
    }
    // 顶边对齐顶边
    if (Math.abs(currentTop - otherTop) < threshold) {
      bestY = otherTop;
      snappedY = true;
    }
    // 底边对齐底边
    if (Math.abs(currentBottom - otherBottom) < threshold) {
      bestY = otherBottom - currentHeight;
      snappedY = true;
    }
    // 中心对齐
    if (Math.abs(currentCenterY - otherCenterY) < threshold) {
      bestY = otherCenterY - currentHeight / 2;
      snappedY = true;
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
  snapToLayersEnabled: boolean = true
): SnapResult {
  let result: SnapResult = { x, y, snappedX: false, snappedY: false };

  // 先进行图层吸附（优先级更高）
  if (snapToLayersEnabled && otherLayers.length > 0) {
    const layerSnap = snapToLayers(x, y, width, height, otherLayers);
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
      if (shouldSnapToGrid(x)) {
        result.x = gridX;
        result.snappedX = true;
      }
    }
    if (!result.snappedY) {
      const gridY = snapToGrid(y);
      if (shouldSnapToGrid(y)) {
        result.y = gridY;
        result.snappedY = true;
      }
    }
  }

  return result;
}