import type { Canvas, EditorLayer, ImageLayer } from '../types';
import { createPosterTemplateFromSource, getPrimaryTemplateTextLayerId } from '../data/imageTemplates';
import { generateId } from './layerTree';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('无法读取本地图片'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('无法读取本地图片'));
    reader.readAsDataURL(file);
  });
}

function readImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = () => reject(new Error('无法解析图片尺寸'));
    image.src = src;
  });
}

export async function createLayerFromLocalImage(
  file: File,
  canvas: Canvas
): Promise<{ layer: EditorLayer; selectedLayerIds: string[] }> {
  const dataUrl = await readFileAsDataUrl(file);
  const { width, height } = await readImageSize(dataUrl);
  const maxWidth = Math.max(canvas.width - 100, 1);
  const maxHeight = Math.max(canvas.height - 100, 1);
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);

  const imageLayer: ImageLayer = {
    id: generateId(),
    type: 'image',
    name: file.name,
    x: 50,
    y: 50,
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    src: dataUrl,
    visible: true,
    locked: false,
  };

  const posterTemplate = createPosterTemplateFromSource({ src: dataUrl, name: file.name }, imageLayer);
  if (posterTemplate) {
    return {
      layer: posterTemplate,
      selectedLayerIds: [getPrimaryTemplateTextLayerId(posterTemplate)],
    };
  }

  return {
    layer: imageLayer,
    selectedLayerIds: [imageLayer.id],
  };
}
