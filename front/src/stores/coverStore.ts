/**
 * 커버 생성 단계 전용 Zustand 스토어
 */

import { create } from 'zustand';
import type { CoverStore, CoverParams, GeneratedCover, Track, Mood } from '../types/cover';

// 접근성 및 키보드 지원을 위한 헬퍼 함수들
export const coverStoreHelpers = {
    // 키보드 이벤트 핸들링
    handleKeyboardNavigation: (event: KeyboardEvent, currentFocus: string, options: string[]) => {
        const currentIndex = options.indexOf(currentFocus);

        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                event.preventDefault();
                return options[Math.max(0, currentIndex - 1)];
            case 'ArrowDown':
            case 'ArrowRight':
                event.preventDefault();
                return options[Math.min(options.length - 1, currentIndex + 1)];
            case 'Home':
                event.preventDefault();
                return options[0];
            case 'End':
                event.preventDefault();
                return options[options.length - 1];
            default:
                return currentFocus;
        }
    },

    // 파라미터 변경 내역 추적 (히스토리/되돌리기용)
    createParamsSnapshot: (params: CoverParams) => ({
        ...params,
        timestamp: Date.now(),
    }),

    // 히스토리 정리 (최대 개수 유지)
    trimHistory: <T>(items: T[], maxCount: number): T[] => {
        return items.slice(0, maxCount);
    },

    // 접근성 메시지 생성
    generateAriaMessage: (action: string, count?: number): string => {
        switch (action) {
            case 'generated':
                return `${count}개의 새로운 커버가 생성되었습니다.`;
            case 'applied':
                return '커버가 앨범에 적용되었습니다.';
            case 'favorited':
                return '커버를 즐겨찾기에 추가했습니다.';
            case 'unfavorited':
                return '커버를 즐겨찾기에서 제거했습니다.';
            case 'compared':
                return '커버를 비교 목록에 추가했습니다.';
            case 'suggested':
                return '트랙 분위기에 맞는 설정이 적용되었습니다.';
            default:
                return '';
        }
    },
};

const initialParams: CoverParams = {
    mood: 'neon',
    palette: '#A55CFF',
    brightness: 0.1,
    saturation: 0.2,
    grain: 0.1,
    prompt: '',
};

const MAX_HISTORY = 20;

export const useCoverStore = create<CoverStore>((set, get) => ({
    // State
    params: initialParams,
    generating: false,
    latest: [],
    history: [],
    compareBin: [],
    tracks: [],
    selectedCoverId: undefined,

    // Actions
    setParams: (newParams) => {
        set((state) => ({
            params: { ...state.params, ...newParams },
        }));

        // 파라미터 변경 시 자동 저장 (디바운스)
        setTimeout(() => get().saveToStorage(), 300);
    },

    generate: async (count = 3, trackIds?: string[]) => {
        const state = get();
        if (state.generating) return;

        set({ generating: true });

        try {
            // 선택된 트랙 ID들 사용 (없으면 빈 배열)
            const selectedTrackIds = trackIds || state.tracks.map(track => track.id);

            const { generateCovers } = await import('../services/api/cover');
            const newCovers = await generateCovers(state.params, selectedTrackIds, count);

            set((state) => {
                const updatedHistory = [...newCovers, ...state.history].slice(0, MAX_HISTORY);
                return {
                    latest: newCovers,
                    history: updatedHistory,
                    generating: false,
                };
            });

            // localStorage에 저장
            get().saveToStorage();
        } catch (error) {
            console.error('Failed to generate covers:', error);
            set({ generating: false });
        }
    },

    applyCover: (id) => {
        const state = get();
        const cover = [...state.latest, ...state.history].find(c => c.id === id);
        if (cover) {
            set({ selectedCoverId: id });
            // 메인 앨범 스토어에 커버 적용
            const { useAlbumStore } = require('./albumStore');
            useAlbumStore.getState().setCoverImage(cover.imageUrl);
        }
    },

    toggleFavorite: (id) =>
        set((state) => ({
            latest: state.latest.map(cover =>
                cover.id === id ? { ...cover, favorite: !cover.favorite } : cover
            ),
            history: state.history.map(cover =>
                cover.id === id ? { ...cover, favorite: !cover.favorite } : cover
            ),
        })),

    addToCompare: (id) =>
        set((state) => {
            if (state.compareBin.length >= 4 || state.compareBin.includes(id)) {
                return state;
            }
            return { compareBin: [...state.compareBin, id] };
        }),

    removeFromCompare: (id) =>
        set((state) => ({
            compareBin: state.compareBin.filter(compareId => compareId !== id),
        })),

    clearCompare: () => set({ compareBin: [] }),

    pushHistory: (covers) =>
        set((state) => {
            const newHistory = [...covers, ...state.history].slice(0, MAX_HISTORY);
            return { history: newHistory };
        }),

    undoLastSelect: () =>
        set({ selectedCoverId: undefined }),

    suggestFromTrackMood: (trackId) => {
        const state = get();
        const track = state.tracks.find(t => t.id === trackId);
        if (track?.vibe) {
            const moodSuggestions = getMoodSuggestions(track.vibe);
            set((state) => ({
                params: { ...state.params, ...moodSuggestions },
            }));

            // 변경 후 저장
            setTimeout(() => get().saveToStorage(), 100);
        }
    },

    loadFromStorage: () => {
        try {
            const savedParams = localStorage.getItem('album.cover.params.v1');
            const savedHistory = localStorage.getItem('album.cover.history.v1');

            if (savedParams) {
                const params = JSON.parse(savedParams);
                set({ params: { ...initialParams, ...params } });
            }

            if (savedHistory) {
                const history = JSON.parse(savedHistory);
                set({ history: history.slice(0, MAX_HISTORY) });
            }
        } catch (error) {
            console.error('Failed to load cover data from storage:', error);
        }
    },

    saveToStorage: () => {
        const state = get();
        try {
            localStorage.setItem('album.cover.params.v1', JSON.stringify(state.params));
            localStorage.setItem('album.cover.history.v1', JSON.stringify(state.history));
        } catch (error) {
            console.error('Failed to save cover data to storage:', error);
        }
    },
}));

// 무드별 추천 설정
function getMoodSuggestions(mood: Mood): Partial<CoverParams> {
    const suggestions: Record<Mood, Partial<CoverParams>> = {
        retro: {
            mood: 'retro',
            palette: '#FF8C42',
            brightness: -0.1,
            saturation: 0.3,
            grain: 0.2,
        },
        emotional: {
            mood: 'emotional',
            palette: '#6B73FF',
            brightness: -0.2,
            saturation: 0.1,
            grain: 0.1,
        },
        pastel: {
            mood: 'pastel',
            palette: '#FFB3D1',
            brightness: 0.3,
            saturation: -0.1,
            grain: 0.05,
        },
        neon: {
            mood: 'neon',
            palette: '#A55CFF',
            brightness: 0.2,
            saturation: 0.4,
            grain: 0.0,
        },
        dark: {
            mood: 'dark',
            palette: '#2D1B69',
            brightness: -0.3,
            saturation: 0.2,
            grain: 0.15,
        },
    };

    return suggestions[mood] || suggestions.neon;
}