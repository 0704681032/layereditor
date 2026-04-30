import type { GuideLine } from '../../components/canvas/SmartGuides';

export interface UiPreferencesState {
  showGrid: boolean;
  snapEnabled: boolean;
  snapThreshold: number;
  theme: 'light' | 'dark';
  guideLines: GuideLine[];
}

export interface UiPreferencesActions {
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleTheme: () => void;
  setSnapThreshold: (threshold: number) => void;
  setGuideLines: (guides: GuideLine[]) => void;
}

export type UiPreferencesSlice = UiPreferencesState & UiPreferencesActions;

const initialTheme = (localStorage.getItem('editor-theme') as 'light' | 'dark') || 'light';
const initialSnapThreshold = parseInt(localStorage.getItem('editor-snap-threshold') || '5', 10);

export const createUiPreferencesSlice = (set: any, _get: any): UiPreferencesSlice => ({
  showGrid: false,
  snapEnabled: true,
  snapThreshold: initialSnapThreshold,
  theme: initialTheme,
  guideLines: [],

  toggleGrid: () => set((s: UiPreferencesState) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s: UiPreferencesState) => ({ snapEnabled: !s.snapEnabled })),
  toggleTheme: () => set((s: UiPreferencesState) => {
    const next = s.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('editor-theme', next);
    return { theme: next };
  }),
  setSnapThreshold: (threshold: number) => {
    const clamped = Math.max(1, Math.min(20, threshold));
    localStorage.setItem('editor-snap-threshold', String(clamped));
    set({ snapThreshold: clamped });
  },
  setGuideLines: (guides: GuideLine[]) => set({ guideLines: guides }),
});