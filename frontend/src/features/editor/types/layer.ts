export type LayerType = 'rect' | 'ellipse' | 'text' | 'image' | 'group' | 'svg' | 'line' | 'star' | 'polygon';

export interface ShadowEffect {
  enabled: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

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
  shadow?: ShadowEffect;
}

export interface RectLayer extends BaseLayer {
  type: 'rect';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface EllipseLayer extends BaseLayer {
  type: 'ellipse';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  fontStyle?: string;
  textDecoration?: string;
  align?: string;
  lineHeight?: number;
  letterSpacing?: number;
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

export interface LineLayer extends BaseLayer {
  type: 'line';
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
}

export interface StarLayer extends BaseLayer {
  type: 'star';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  numPoints?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export interface PolygonLayer extends BaseLayer {
  type: 'polygon';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  sides?: number;
}

export type EditorLayer = RectLayer | EllipseLayer | TextLayer | ImageLayer | SvgLayer | GroupLayer | LineLayer | StarLayer | PolygonLayer;
