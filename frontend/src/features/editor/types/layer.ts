export type LayerType = 'rect' | 'text' | 'image' | 'group' | 'svg';

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
}

export interface RectLayer extends BaseLayer {
  type: 'rect';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  fontStyle?: string;
  align?: string;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  assetId?: number;
  src?: string;
}

export interface SvgLayer extends BaseLayer {
  type: 'svg';
  svgData: string;
  fill?: string;
  stroke?: string;
}

export interface GroupLayer extends BaseLayer {
  type: 'group';
  children: EditorLayer[];
}

export type EditorLayer = RectLayer | TextLayer | ImageLayer | SvgLayer | GroupLayer;
