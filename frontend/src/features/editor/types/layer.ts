export type LayerType = 'rect' | 'ellipse' | 'text' | 'image' | 'group' | 'svg' | 'line' | 'star' | 'polygon';

// Gradient fill types
export interface GradientStop {
  offset: number; // 0-1
  color: string;
}

export interface LinearGradient {
  type: 'linear';
  stops: GradientStop[];
  angle?: number; // 0-360 degrees, default 0 (left to right)
}

export interface RadialGradient {
  type: 'radial';
  stops: GradientStop[];
  center?: { x: number; y: number }; // 0-1 relative to shape, default {0.5, 0.5}
}

export type GradientFill = LinearGradient | RadialGradient;

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
  blendMode?: string;
  filters?: LayerFilters;
}

export interface LayerFilters {
  blur?: number;
  brightness?: number;
  contrast?: number;
  grayScale?: number;
  hue?: number;
  saturate?: number;
}

export interface RectLayer extends BaseLayer {
  type: 'rect';
  fill?: string | GradientFill;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface EllipseLayer extends BaseLayer {
  type: 'ellipse';
  fill?: string | GradientFill;
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
  fontWeight?: number; // 100-900
  textDecoration?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  textStroke?: string; // Stroke color
  textStrokeWidth?: number; // Stroke width
  wrap?: 'none' | 'word' | 'char'; // Text wrapping mode
  maxWidth?: number; // Max width for wrapping
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
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
  fill?: string | GradientFill;
  stroke?: string;
  strokeWidth?: number;
  numPoints?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export interface PolygonLayer extends BaseLayer {
  type: 'polygon';
  fill?: string | GradientFill;
  stroke?: string;
  strokeWidth?: number;
  sides?: number;
}

export type EditorLayer = RectLayer | EllipseLayer | TextLayer | ImageLayer | SvgLayer | GroupLayer | LineLayer | StarLayer | PolygonLayer;
