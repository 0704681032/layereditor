import api from '@/shared/lib/api';

interface MattingRequest {
  imageData: string;  // Base64 encoded image (with or without data:image prefix)
  width?: number;
  height?: number;
  type?: 'human' | 'general';  // human for portrait, general for objects
}

interface OutpaintingRequest {
  imageData: string;
  direction: 'top' | 'bottom' | 'left' | 'right' | 'all';
  pixels: number;
}

interface InpaintingRequest {
  imageData: string;
  maskData: string;  // Base64 encoded mask (white areas to remove)
}

interface AiImageResponse {
  imageData: string;  // Base64 encoded result image with data:image/png;base64, prefix
  width?: number;
  height?: number;
}

interface AiStatusResponse {
  configured: boolean;
  provider: string;
  features: string[];
  message: string;
}

/**
 * AI Image Processing API Client
 * Calls backend API which proxies to Volcengine (ByteDance) Visual Intelligence services
 */

/**
 * Check AI API status - whether credentials are configured
 */
export async function getAiStatus(): Promise<AiStatusResponse> {
  const response = await api.get<AiStatusResponse>('/ai/image/status');
  return response.data;
}

/**
 * Image matting - remove background and extract subject
 *
 * @param imageData - Base64 encoded image data (can include data:image prefix)
 * @param type - 'human' for human body matting, 'general' for general objects (default)
 * @returns Processed image with transparent background
 */
export async function mattingImage(
  imageData: string,
  type: 'human' | 'general' = 'general'
): Promise<AiImageResponse> {
  const response = await api.post<AiImageResponse>('/ai/image/matting', {
    imageData,
    type,
  });
  return response.data;
}

/**
 * Image matting from URL - alternative method using image URL
 *
 * @param imageUrl - URL of the image to process
 * @param type - 'human' for human body matting, 'general' for general objects
 * @returns Processed image with transparent background
 */
export async function mattingImageFromUrl(
  imageUrl: string,
  type: 'human' | 'general' = 'general'
): Promise<AiImageResponse> {
  // First fetch image as base64
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  return mattingImage(base64, type);
}

/**
 * Image outpainting - expand image boundaries with AI-generated content
 *
 * @param imageData - Base64 encoded image data
 * @param direction - Direction to expand: 'top', 'bottom', 'left', 'right', or 'all'
 * @param pixels - Number of pixels to expand (default 100)
 * @returns Expanded image with AI-generated content in new areas
 */
export async function outpaintingImage(
  imageData: string,
  direction: 'top' | 'bottom' | 'left' | 'right' | 'all' = 'all',
  pixels: number = 100
): Promise<AiImageResponse> {
  const response = await api.post<AiImageResponse>('/ai/image/outpainting', {
    imageData,
    direction,
    pixels,
  });
  return response.data;
}

/**
 * Image inpainting - remove objects/fill areas based on mask
 *
 * @param imageData - Base64 encoded image data
 * @param maskData - Base64 encoded mask (white areas will be removed/inpainted)
 * @returns Image with specified areas removed and filled
 */
export async function inpaintingImage(
  imageData: string,
  maskData: string
): Promise<AiImageResponse> {
  const response = await api.post<AiImageResponse>('/ai/image/inpainting', {
    imageData,
    maskData,
  });
  return response.data;
}

/**
 * Helper: Convert Blob/File to Base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper: Convert canvas to Base64
 */
export function canvasToBase64(canvas: HTMLCanvasElement, format: string = 'image/png'): string {
  return canvas.toDataURL(format);
}

/**
 * Helper: Create a blank canvas of specified size
 */
export function createBlankCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Helper: Create mask canvas from brush strokes data
 * Returns a base64 encoded mask image where drawn areas are white
 */
export function createMaskFromStrokes(
  strokes: { points: { x: number; y: number }[]; brushSize: number }[],
  width: number,
  height: number
): string {
  const canvas = createBlankCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fill with black (areas NOT to inpaint)
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  // Draw strokes as white (areas to inpaint)
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    ctx.lineWidth = stroke.brushSize;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (const point of stroke.points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }

  return canvasToBase64(canvas);
}

/**
 * Image super resolution - enhance image quality/resolution
 *
 * @param imageData - Base64 encoded image data
 * @param scale - Resolution scale factor (2x or 4x, default 2)
 * @returns Enhanced image with higher resolution
 */
export async function superResolutionImage(
  imageData: string,
  scale: number = 2
): Promise<AiImageResponse> {
  const response = await api.post<AiImageResponse>('/ai/image/super-resolution', {
    imageData,
    scale,
  });
  return response.data;
}