/**
 * 커버 생성 관련 타입 정의
 */

export type Mood = 'retro' | 'emotional' | 'pastel' | 'neon' | 'dark';

export interface CoverParams {
  mood: Mood;
  palette: string;
  brightness: number;
  saturation: number;
  grain: number;
  prompt?: string;
}

export interface GeneratedCover {
  id: string;
  imageUrl: string;
  params: Partial<CoverParams>;
  createdAt: string;
  favorite?: boolean;
  uploadId?: number;
  s3Key?: string;
  originalFileName?: string;
}

export interface Track {
  id: string;
  title: string;
  artist?: string;
  vibe?: Mood;
  duration?: number;
}

export interface MoodConfig {
  mood: Mood;
  label: string;
  description: string;
  thumbnailUrl: string;
  colors: string[];
  defaultPalette: string;
}

export interface PalettePreset {
  id: string;
  name: string;
  color: string;
  mood?: Mood;
}

export interface CoverStoreState {
  params: CoverParams;
  generating: boolean;
  latest: GeneratedCover[];
  history: GeneratedCover[];
  compareBin: string[];
  tracks: Track[];
  selectedCoverId?: string;
}

export interface CoverStoreActions {
  setParams: (params: Partial<CoverParams>) => void;
  generate: (count?: number) => Promise<void>;
  applyCover: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  pushHistory: (covers: GeneratedCover[]) => void;
  undoLastSelect: () => void;
  suggestFromTrackMood: (trackId: string) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export type CoverStore = CoverStoreState & CoverStoreActions;