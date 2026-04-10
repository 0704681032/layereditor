import type { EditorLayer, GroupLayer, ImageLayer, SvgLayer, TextLayer } from '../types';
import { generateId } from '../utils/layerTree';

const PREMIUM_POSTER_IMAGE_PATH = '/ad-images/高端品牌海报-原始高清.png';
const PREMIUM_POSTER_BASE_WIDTH = 1200;
const PREMIUM_POSTER_BASE_HEIGHT = 800;

const premiumPosterBackgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="50%" style="stop-color:#764ba2"/>
      <stop offset="100%" style="stop-color:#f093fb"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFE566"/>
      <stop offset="50%" style="stop-color:#FFD700"/>
      <stop offset="100%" style="stop-color:#FFA500"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="20" stdDeviation="40" flood-color="#00000040"/>
    </filter>
  </defs>
  <rect width="1200" height="800" fill="url(#bg1)"/>
  <circle cx="1100" cy="100" r="200" fill="#ffffff10"/>
  <circle cx="100" cy="700" r="250" fill="#ffffff08"/>
  <circle cx="600" cy="400" r="300" fill="#ffffff05"/>
  <g opacity="0.1" stroke="#ffffff" stroke-width="0.5">
    <line x1="0" y1="200" x2="1200" y2="200"/>
    <line x1="0" y1="400" x2="1200" y2="400"/>
    <line x1="0" y1="600" x2="1200" y2="600"/>
    <line x1="300" y1="0" x2="300" y2="800"/>
    <line x1="600" y1="0" x2="600" y2="800"/>
    <line x1="900" y1="0" x2="900" y2="800"/>
  </g>
  <rect x="80" y="80" width="1040" height="640" rx="32" fill="#ffffff15" filter="url(#shadow)"/>
  <rect x="120" y="400" width="280" height="200" rx="16" fill="#ffffff20"/>
  <rect x="460" y="400" width="280" height="200" rx="16" fill="#ffffff20"/>
  <rect x="800" y="400" width="280" height="200" rx="16" fill="#ffffff20"/>
  <rect x="400" y="640" width="400" height="60" rx="30" fill="url(#gold)"/>
  <circle cx="1050" cy="180" r="60" fill="url(#gold)"/>
</svg>`;

interface PosterTextSpec {
  name: string;
  text: string;
  x: number;
  baselineY: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontStyle?: string;
  align?: 'left' | 'center' | 'right';
}

interface ImageTemplateSource {
  src?: string;
  name?: string;
}

const premiumPosterTextSpecs: PosterTextSpec[] = [
  {
    name: '顶部英文',
    text: 'PREMIUM COLLECTION',
    x: 600,
    baselineY: 160,
    fontSize: 24,
    fontFamily: 'Microsoft YaHei',
    fill: '#ffffff90',
    align: 'center',
  },
  {
    name: '主标题',
    text: '极致体验',
    x: 600,
    baselineY: 260,
    fontSize: 72,
    fontFamily: 'Microsoft YaHei',
    fill: '#ffffff',
    fontStyle: 'bold',
    align: 'center',
  },
  {
    name: '副标题',
    text: '探索无限可能',
    x: 600,
    baselineY: 340,
    fontSize: 32,
    fontFamily: 'Microsoft YaHei',
    fill: '#ffffffcc',
    align: 'center',
  },
  {
    name: '特性序号 01',
    text: '01',
    x: 260,
    baselineY: 450,
    fontSize: 48,
    fontFamily: 'Arial',
    fill: '#24d7ff',
    fontStyle: 'bold',
    align: 'center',
  },
  {
    name: '特性标题 01',
    text: '创新设计',
    x: 260,
    baselineY: 500,
    fontSize: 18,
    fontFamily: 'Microsoft YaHei',
    fill: '#ffffff',
    fontStyle: 'bold',
    align: 'center',
  },
  {
    name: '特性描述 01',
    text: '突破传统边界',
    x: 260,
    baselineY: 530,
    fontSize: 14,
    fontFamily: 'Microsoft YaHei',
    fill: '#ffffff80',
    align: 'center',
  },
  {
    name: '特性序号 02',
    text: '02',
    x: 600,
    baselineY: 450,
    fontSize: 48,
    fontFamily: 'Arial',
    fill: '#24d7ff',
    fontStyle: 'bold',
    align: 'center',
  },
  {
    name: '特性标题 02',
    text: '卓越品质',
    x: 600,
    baselineY: 500,
    fontSize: 18,
    fontFamily: 'Microsoft YaHei',
    fill: '#ffffff',
    fontStyle: 'bold',
    align: 'center',
  },
  {
    name: '特性描述 02',
    text: '精工细作',
    x: 600,
    baselineY: 530,
    fontSize: 14,
    fontFamily: 'Microsoft YaHei',
    fill: '#ffffff80',
    align: 'center',
  },
  {
    name: '特性序号 03',
    text: '03',
    x: 940,
    baselineY: 450,
    fontSize: 48,
    fontFamily: 'Arial',
    fill: '#24d7ff',
    fontStyle: 'bold',
    align: 'center',
  },
  {
    name: '特性标题 03',
    text: '尊享服务',
    x: 940,
    baselineY: 500,
    fontSize: 18,
    fontFamily: 'Microsoft YaHei',
    fill: '#ffffff',
    fontStyle: 'bold',
    align: 'center',
  },
  {
    name: '特性描述 03',
    text: 'VIP专属体验',
    x: 940,
    baselineY: 530,
    fontSize: 14,
    fontFamily: 'Microsoft YaHei',
    fill: '#ffffff80',
    align: 'center',
  },
  {
    name: '按钮文案',
    text: '立即探索 →',
    x: 600,
    baselineY: 680,
    fontSize: 22,
    fontFamily: 'Microsoft YaHei',
    fill: '#333333',
    fontStyle: 'bold',
    align: 'center',
  },
  {
    name: '价格标签标题',
    text: '限时',
    x: 1050,
    baselineY: 170,
    fontSize: 16,
    fontFamily: 'Arial',
    fill: '#333333',
    fontStyle: 'bold',
    align: 'center',
  },
  {
    name: '价格标签金额',
    text: '¥999',
    x: 1050,
    baselineY: 200,
    fontSize: 24,
    fontFamily: 'Arial',
    fill: '#333333',
    fontStyle: 'bold',
    align: 'center',
  },
];

function scaleValue(value: number, scale: number): number {
  return Math.round(value * scale * 100) / 100;
}

function createScaledTextLayer(spec: PosterTextSpec, scaleX: number, scaleY: number): TextLayer {
  const fontScale = Math.min(scaleX, scaleY);
  const scaledFontSize = Math.max(1, scaleValue(spec.fontSize, fontScale));

  return {
    id: generateId(),
    type: 'text',
    name: spec.name,
    x: scaleValue(spec.x, scaleX),
    y: scaleValue(spec.baselineY - spec.fontSize, scaleY),
    text: spec.text,
    fontSize: scaledFontSize,
    fontFamily: spec.fontFamily,
    fill: spec.fill,
    fontStyle: spec.fontStyle,
    align: spec.align,
    visible: true,
    locked: false,
  };
}

function isPremiumPosterName(name: string | undefined): boolean {
  if (!name) {
    return false;
  }
  return name.includes('高端品牌海报') || name.includes('高端品牌海报-原始高清');
}

export function hasEditableTemplateForImage(src: string | undefined, name?: string): boolean {
  return (src?.endsWith(PREMIUM_POSTER_IMAGE_PATH) ?? false) || isPremiumPosterName(name);
}

export function buildEditableTemplateFromImageLayer(layer: ImageLayer): GroupLayer | null {
  if (!hasEditableTemplateForImage(layer.src, layer.name)) {
    return null;
  }

  const width = layer.width ?? PREMIUM_POSTER_BASE_WIDTH;
  const height = layer.height ?? PREMIUM_POSTER_BASE_HEIGHT;
  const scaleX = width / PREMIUM_POSTER_BASE_WIDTH;
  const scaleY = height / PREMIUM_POSTER_BASE_HEIGHT;

  const backgroundLayer: SvgLayer = {
    id: generateId(),
    type: 'svg',
    name: '海报背景',
    x: 0,
    y: 0,
    width,
    height,
    svgData: premiumPosterBackgroundSvg,
    visible: true,
    locked: false,
  };

  const children = [backgroundLayer, ...premiumPosterTextSpecs.map((spec) => createScaledTextLayer(spec, scaleX, scaleY))];

  return {
    id: generateId(),
    type: 'group',
    name: '高端品牌海报（可编辑）',
    x: layer.x,
    y: layer.y,
    width,
    height,
    visible: layer.visible,
    locked: layer.locked,
    children,
  };
}

export function getPrimaryTemplateTextLayerId(groupLayer: GroupLayer): string {
  const primaryLayer = groupLayer.children.find((layer) => layer.type === 'text' && layer.name === '主标题');
  return primaryLayer?.id ?? groupLayer.id;
}

function withPrimaryTitle(groupLayer: GroupLayer, text: string): GroupLayer {
  return {
    ...groupLayer,
    children: groupLayer.children.map((layer) => {
      if (layer.type === 'text' && layer.name === '主标题') {
        return { ...layer, name: text, text };
      }
      return layer;
    }),
  };
}

function isEditablePosterGroup(layer: EditorLayer): layer is GroupLayer {
  return layer.type === 'group' && layer.name === '高端品牌海报（可编辑）';
}

function isClose(a: number | undefined, b: number | undefined, tolerance = 1): boolean {
  if (a === undefined || b === undefined) {
    return false;
  }
  return Math.abs(a - b) <= tolerance;
}

function getPrimaryTitleLayer(groupLayer: GroupLayer): TextLayer | null {
  return groupLayer.children.find((layer) => layer.type === 'text' && layer.name === '主标题') as TextLayer | undefined ?? null;
}

function isLegacyPosterImageLayer(layer: EditorLayer): layer is ImageLayer {
  return layer.type === 'image' && hasEditableTemplateForImage(layer.src, layer.name);
}

function isLegacyPosterMaskLayer(layer: EditorLayer): boolean {
  return layer.type === 'rect' && layer.name === '遮罩矩形';
}

function isLegacyPosterTitleLayer(layer: EditorLayer, imageLayer: ImageLayer): layer is TextLayer {
  if (layer.type !== 'text') {
    return false;
  }

  const width = imageLayer.width ?? PREMIUM_POSTER_BASE_WIDTH;
  const height = imageLayer.height ?? PREMIUM_POSTER_BASE_HEIGHT;
  const expectedX = imageLayer.x + width / 2;
  const expectedY = imageLayer.y + height * 0.24;

  return (layer.fontSize ?? 0) >= 48
    && Math.abs(layer.x - expectedX) <= Math.max(width * 0.18, 80)
    && Math.abs(layer.y - expectedY) <= Math.max(height * 0.12, 60);
}

function isLegacyPosterSibling(layer: EditorLayer, groupLayer: GroupLayer): boolean {
  if (layer.id === groupLayer.id) {
    return false;
  }

  if (layer.type === 'image') {
    return hasEditableTemplateForImage(layer.src, layer.name)
      && isClose(layer.x, groupLayer.x)
      && isClose(layer.y, groupLayer.y)
      && isClose(layer.width, groupLayer.width)
      && isClose(layer.height, groupLayer.height);
  }

  if (layer.type === 'rect') {
    return layer.name === '遮罩矩形';
  }

  if (layer.type !== 'text') {
    return false;
  }

  const titleLayer = getPrimaryTitleLayer(groupLayer);
  if (!titleLayer) {
    return false;
  }

  const expectedX = groupLayer.x + titleLayer.x;
  const expectedY = groupLayer.y + titleLayer.y;
  const toleranceX = Math.max((groupLayer.width ?? 0) * 0.12, 40);
  const toleranceY = Math.max((titleLayer.fontSize ?? 0) * 1.5, 30);

  return layer.text === titleLayer.text
    && Math.abs(layer.x - expectedX) <= toleranceX
    && Math.abs(layer.y - expectedY) <= toleranceY;
}

function upgradeLegacyPosterTriples(layers: EditorLayer[]): { layers: EditorLayer[]; changed: boolean } {
  const consumedIds = new Set<string>();
  const nextLayers: EditorLayer[] = [];
  let changed = false;

  for (const layer of layers) {
    if (consumedIds.has(layer.id)) {
      continue;
    }

    if (!isLegacyPosterImageLayer(layer)) {
      nextLayers.push(layer);
      continue;
    }

    const editableGroup = buildEditableTemplateFromImageLayer(layer);
    if (!editableGroup) {
      nextLayers.push(layer);
      continue;
    }

    const legacyTitle = layers.find(
      (candidate): candidate is TextLayer => !consumedIds.has(candidate.id) && isLegacyPosterTitleLayer(candidate, layer)
    );
    const upgradedGroup = legacyTitle ? withPrimaryTitle(editableGroup, legacyTitle.text) : editableGroup;

    consumedIds.add(layer.id);
    const relatedMask = layers.find((candidate) => !consumedIds.has(candidate.id) && isLegacyPosterMaskLayer(candidate));
    if (relatedMask) {
      consumedIds.add(relatedMask.id);
    }
    if (legacyTitle) {
      consumedIds.add(legacyTitle.id);
    }

    nextLayers.push(upgradedGroup);
    changed = true;
  }

  return { layers: nextLayers, changed };
}

export function normalizePosterLayers(layers: EditorLayer[]): { layers: EditorLayer[]; changed: boolean } {
  const upgraded = upgradeLegacyPosterTriples(layers);
  const editablePosterGroups = upgraded.layers.filter(isEditablePosterGroup);
  if (editablePosterGroups.length === 0) {
    return upgraded;
  }

  const nextLayers = upgraded.layers.filter((layer) => !editablePosterGroups.some((groupLayer) => isLegacyPosterSibling(layer, groupLayer)));
  return {
    layers: nextLayers,
    changed: upgraded.changed || nextLayers.length !== upgraded.layers.length,
  };
}

export function createPosterTemplateFromSource(source: ImageTemplateSource, layer: ImageLayer): GroupLayer | null {
  if (!hasEditableTemplateForImage(source.src, source.name)) {
    return null;
  }

  return buildEditableTemplateFromImageLayer({
    ...layer,
    src: source.src ?? layer.src,
    name: source.name ?? layer.name,
  });
}
