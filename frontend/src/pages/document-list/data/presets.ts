export interface CanvasPreset {
  label: string;
  value: string;
  width: number;
  height: number;
  bg: string;
  icon: string;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { label: 'Social Media Post', value: 'social', width: 1080, height: 1080, bg: '#FFFFFF', icon: '📱' },
  { label: 'Instagram Story', value: 'story', width: 1080, height: 1920, bg: '#FFFFFF', icon: '📸' },
  { label: 'Facebook Cover', value: 'fb', width: 1640, height: 856, bg: '#FFFFFF', icon: '🖥' },
  { label: 'Presentation (16:9)', value: 'slides', width: 1920, height: 1080, bg: '#FFFFFF', icon: '📊' },
  { label: 'A4 Portrait', value: 'a4', width: 794, height: 1123, bg: '#FFFFFF', icon: '📄' },
  { label: 'Banner (728x90)', value: 'banner', width: 728, height: 90, bg: '#FFFFFF', icon: '🖼' },
  { label: 'Custom', value: 'custom', width: 1200, height: 800, bg: '#FFFFFF', icon: '✏' },
];