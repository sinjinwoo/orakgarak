/**
 * 앨범 메타데이터 전용 Zustand 스토어
 * 스토리 기반 폼과 브랜드 잠금 기능 지원
 */

import { create } from 'zustand';

// 브랜드 잠금 설정
export interface BrandLock {
  logo?: string;
  font: 'modern' | 'classic' | 'handwrite';
  palette: {
    primary: string;
    secondary: string;
    locked: boolean;
  };
}

// 커버 설정
export interface CoverConfig {
  mode: 'ai' | 'upload';
  variantId?: string;
  seed?: number;
  params: {
    style: 'poster' | 'filmgrain' | 'lineart' | 'collage';
    emphasizeColor: string;
    noise: number;
    texture: number;
    focusSubject: string;
    marginRatio: number;
    typoRatio: number;
  };
  uploadedUrl?: string;
  variants: Array<{
    id: string;
    imageUrl: string;
    seed: number;
  }>;
  history: Array<{
    id: string;
    imageUrl: string;
    params: any;
    timestamp: number;
  }>;
  referenceBoard: Array<{
    id: string;
    url: string;
    type: 'image' | 'url';
    palette: string[];
  }>;
}

// 트랙 인사이트
export interface TrackInsights {
  mood: string;
  key: string;
  bpm: number;
  lyricTone: string;
  enabled: {
    mood: boolean;
    key: boolean;
    bpm: boolean;
    lyricTone: boolean;
  };
}

// 앨범 메타데이터 상태
interface AlbumMetaState {
  // 스토리 기반 폼 필드
  coreKeywords: string[];
  tagline: string; // 짧은 문장(한 줄 소개)
  description: string; // 확장 설명

  // 자동 생성된 콘텍스트 칩
  autoChips: Array<{
    id: string;
    text: string;
    category: 'mood' | 'genre' | 'tempo' | 'keyword';
    weight: number;
  }>;

  // 브랜드 잠금
  brandLock: BrandLock | null;

  // 커버 설정
  cover: CoverConfig;

  // 트랙 인사이트
  insights: TrackInsights | null;

  // 기존 필드
  isPublic: boolean;
  tags: string[];

  // UI 상태
  isLoading: boolean;
  lastSaved: string | null;
  comparisonMode: boolean; // A/B 비교 모드
}

interface AlbumMetaActions {
  // 스토리 폼 액션
  setCoreKeywords: (keywords: string[]) => void;
  setTagline: (tagline: string) => void;
  setDescription: (description: string) => void;
  addAutoChip: (chip: AlbumMetaState['autoChips'][0]) => void;
  removeAutoChip: (chipId: string) => void;
  insertChipToField: (chipId: string, field: 'tagline' | 'description', position: number) => void;

  // 브랜드 잠금 액션
  setBrandLock: (brandLock: BrandLock | null) => void;
  updateBrandFont: (font: BrandLock['font']) => void;
  updateBrandPalette: (palette: BrandLock['palette']) => void;
  uploadBrandLogo: (logo: string) => void;

  // 커버 액션
  setCoverMode: (mode: CoverConfig['mode']) => void;
  updateCoverParams: (params: Partial<CoverConfig['params']>) => void;
  addCoverVariant: (variant: CoverConfig['variants'][0]) => void;
  selectCoverVariant: (variantId: string) => void;
  addToReferenceBoard: (reference: CoverConfig['referenceBoard'][0]) => void;
  removeFromReferenceBoard: (referenceId: string) => void;
  setCoverUpload: (url: string) => void;

  // 인사이트 액션
  setInsights: (insights: TrackInsights) => void;
  toggleInsightEnabled: (field: keyof TrackInsights['enabled']) => void;

  // 유틸리티 액션
  setIsPublic: (isPublic: boolean) => void;
  setTags: (tags: string[]) => void;
  setComparisonMode: (enabled: boolean) => void;

  // 상태 관리
  saveToStorage: () => void;
  loadFromStorage: () => void;
  reset: () => void;

  // 프롬프트 생성 (AI 커버 생성용)
  generatePrompt: () => {
    text: string;
    weights: { auto: number; user: number };
  };
}

type AlbumMetaStore = AlbumMetaState & AlbumMetaActions;

// 상수 정의
const PROMPT_WEIGHTS = {
  AUTO_CHIP: 0.6,
  USER_INPUT: 0.4,
} as const;

const FONT_PRESETS = {
  modern: { name: 'Inter', weight: [400, 600, 700] },
  classic: { name: 'Playfair Display', weight: [400, 600, 700] },
  handwrite: { name: 'Caveat', weight: [400, 600, 700] },
} as const;

const initialCoverConfig: CoverConfig = {
  mode: 'ai',
  params: {
    style: 'poster',
    emphasizeColor: '#A855F7',
    noise: 0.1,
    texture: 0.2,
    focusSubject: '',
    marginRatio: 0.1,
    typoRatio: 0.3,
  },
  variants: [],
  history: [],
  referenceBoard: [],
};

const initialState: AlbumMetaState = {
  coreKeywords: [],
  tagline: '',
  description: '',
  autoChips: [],
  brandLock: null,
  cover: initialCoverConfig,
  insights: null,
  isPublic: false,
  tags: [],
  isLoading: false,
  lastSaved: null,
  comparisonMode: false,
};

export const useAlbumMetaStore = create<AlbumMetaStore>((set, get) => ({
  ...initialState,

  // 스토리 폼 액션
  setCoreKeywords: (keywords) => set({ coreKeywords: keywords }),
  setTagline: (tagline) => set({ tagline }),
  setDescription: (description) => set({ description }),

  addAutoChip: (chip) => set((state) => ({
    autoChips: [...state.autoChips, chip],
  })),

  removeAutoChip: (chipId) => set((state) => ({
    autoChips: state.autoChips.filter(chip => chip.id !== chipId),
  })),

  insertChipToField: (chipId, field, position) => {
    const state = get();
    const chip = state.autoChips.find(c => c.id === chipId);
    if (!chip) return;

    const currentValue = state[field];
    const newValue =
      currentValue.slice(0, position) +
      `#${chip.text}` +
      currentValue.slice(position);

    set({ [field]: newValue });
  },

  // 브랜드 잠금 액션
  setBrandLock: (brandLock) => set({ brandLock }),

  updateBrandFont: (font) => set((state) => ({
    brandLock: state.brandLock
      ? { ...state.brandLock, font }
      : { font, palette: { primary: '#A855F7', secondary: '#EC4899', locked: false } }
  })),

  updateBrandPalette: (palette) => set((state) => ({
    brandLock: state.brandLock
      ? { ...state.brandLock, palette }
      : { font: 'modern', palette }
  })),

  uploadBrandLogo: (logo) => set((state) => ({
    brandLock: state.brandLock
      ? { ...state.brandLock, logo }
      : { font: 'modern', logo, palette: { primary: '#A855F7', secondary: '#EC4899', locked: false } }
  })),

  // 커버 액션
  setCoverMode: (mode) => set((state) => ({
    cover: { ...state.cover, mode }
  })),

  updateCoverParams: (params) => set((state) => ({
    cover: {
      ...state.cover,
      params: { ...state.cover.params, ...params }
    }
  })),

  addCoverVariant: (variant) => set((state) => ({
    cover: {
      ...state.cover,
      variants: [variant, ...state.cover.variants].slice(0, 4)
    }
  })),

  selectCoverVariant: (variantId) => set((state) => {
    const variant = state.cover.variants.find(v => v.id === variantId);
    return variant ? {
      cover: {
        ...state.cover,
        variantId,
        seed: variant.seed
      }
    } : {};
  }),

  addToReferenceBoard: (reference) => set((state) => ({
    cover: {
      ...state.cover,
      referenceBoard: [...state.cover.referenceBoard, reference]
    }
  })),

  removeFromReferenceBoard: (referenceId) => set((state) => ({
    cover: {
      ...state.cover,
      referenceBoard: state.cover.referenceBoard.filter(ref => ref.id !== referenceId)
    }
  })),

  setCoverUpload: (url) => set((state) => ({
    cover: { ...state.cover, uploadedUrl: url }
  })),

  // 인사이트 액션
  setInsights: (insights) => set({ insights }),

  toggleInsightEnabled: (field) => set((state) => ({
    insights: state.insights ? {
      ...state.insights,
      enabled: {
        ...state.insights.enabled,
        [field]: !state.insights.enabled[field]
      }
    } : null
  })),

  // 유틸리티 액션
  setIsPublic: (isPublic) => set({ isPublic }),
  setTags: (tags) => set({ tags }),
  setComparisonMode: (comparisonMode) => set({ comparisonMode }),

  // 상태 관리
  saveToStorage: () => {
    const state = get();
    try {
      localStorage.setItem('album.meta.v2', JSON.stringify({
        coreKeywords: state.coreKeywords,
        tagline: state.tagline,
        description: state.description,
        brandLock: state.brandLock,
        cover: state.cover,
        insights: state.insights,
        isPublic: state.isPublic,
        tags: state.tags,
      }));
      set({ lastSaved: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to save album meta to storage:', error);
    }
  },

  loadFromStorage: () => {
    try {
      const saved = localStorage.getItem('album.meta.v2');
      if (saved) {
        const data = JSON.parse(saved);
        set({
          coreKeywords: data.coreKeywords || [],
          tagline: data.tagline || '',
          description: data.description || '',
          brandLock: data.brandLock || null,
          cover: { ...initialCoverConfig, ...data.cover },
          insights: data.insights || null,
          isPublic: data.isPublic || false,
          tags: data.tags || [],
          lastSaved: data.lastSaved,
        });
      }
    } catch (error) {
      console.error('Failed to load album meta from storage:', error);
    }
  },

  reset: () => set(initialState),

  // 프롬프트 생성
  generatePrompt: () => {
    const state = get();

    // 자동 칩에서 활성화된 인사이트 기반 텍스트 생성
    let autoText = '';
    if (state.insights) {
      const { enabled, mood, key, bpm, lyricTone } = state.insights;
      const autoChips = [];

      if (enabled.mood) autoChips.push(mood);
      if (enabled.key) autoChips.push(`${key} key`);
      if (enabled.bpm) autoChips.push(`${bpm} BPM`);
      if (enabled.lyricTone) autoChips.push(lyricTone);

      autoText = autoChips.join(', ');
    }

    // 사용자 입력 텍스트
    const userText = [
      state.coreKeywords.join(' '),
      state.tagline,
      state.description
    ].filter(Boolean).join('. ');

    return {
      text: `${autoText}. ${userText}`.trim(),
      weights: PROMPT_WEIGHTS,
    };
  },
}));

// 폰트 프리셋 export
export { FONT_PRESETS };