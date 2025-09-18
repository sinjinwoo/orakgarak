/**
 * 커버 생성 관련 유틸리티 함수들
 * 테스트 가능한 순수 함수들로 구성
 */

import type { CoverParams, GeneratedCover } from '../types/cover';

// 파라미터 병합 함수
export function mergeParams(base: CoverParams, updates: Partial<CoverParams>): CoverParams {
  return {
    ...base,
    ...updates,
  };
}

// 히스토리 최대 개수 유지
export function maintainMaxHistory<T>(items: T[], maxCount: number): T[] {
  return items.slice(0, maxCount);
}

// 파라미터 유효성 검증
export function validateParams(params: CoverParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 필수 필드 검증
  if (!params.mood) {
    errors.push('무드를 선택해주세요.');
  }

  if (!params.palette) {
    errors.push('팔레트 색상을 선택해주세요.');
  }

  // 색상 형식 검증
  if (params.palette && !/^#[0-9A-F]{6}$/i.test(params.palette)) {
    errors.push('올바른 색상 형식이 아닙니다. (#RRGGBB)');
  }

  // 범위 검증
  if (params.brightness < -0.5 || params.brightness > 0.5) {
    errors.push('밝기는 -50%에서 50% 사이여야 합니다.');
  }

  if (params.saturation < -0.3 || params.saturation > 0.5) {
    errors.push('채도는 -30%에서 50% 사이여야 합니다.');
  }

  if (params.grain < 0 || params.grain > 0.3) {
    errors.push('그레인은 0%에서 30% 사이여야 합니다.');
  }

  // 프롬프트 길이 검증
  if (params.prompt && params.prompt.length > 200) {
    errors.push('프롬프트는 200자 이내로 입력해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 커버 필터링 함수들
export function filterFavoriteCovers(covers: GeneratedCover[]): GeneratedCover[] {
  return covers.filter(cover => cover.favorite);
}

export function filterCoversByMood(covers: GeneratedCover[], mood: string): GeneratedCover[] {
  return covers.filter(cover => cover.params.mood === mood);
}

export function sortCoversByDate(covers: GeneratedCover[], order: 'asc' | 'desc' = 'desc'): GeneratedCover[] {
  return [...covers].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

// 파라미터 차이 계산 (변경 사항 감지용)
export function calculateParamsDiff(prev: CoverParams, current: CoverParams): Partial<CoverParams> {
  const diff: Partial<CoverParams> = {};

  Object.keys(current).forEach(key => {
    const k = key as keyof CoverParams;
    if (prev[k] !== current[k]) {
      diff[k] = current[k] as any;
    }
  });

  return diff;
}

// 커버 ID 목록에서 중복 제거
export function deduplicateCoverIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

// 커버 검색 함수
export function searchCovers(covers: GeneratedCover[], query: string): GeneratedCover[] {
  if (!query.trim()) return covers;

  const lowerQuery = query.toLowerCase();

  return covers.filter(cover => {
    // 무드, 팔레트, 프롬프트에서 검색
    return (
      cover.params.mood.toLowerCase().includes(lowerQuery) ||
      cover.params.palette.toLowerCase().includes(lowerQuery) ||
      (cover.params.prompt && cover.params.prompt.toLowerCase().includes(lowerQuery))
    );
  });
}

// CSS 필터 문자열 생성
export function generateCSSFilters(params: CoverParams): string {
  const filters: string[] = [];

  if (params.brightness !== 0) {
    filters.push(`brightness(${1 + params.brightness})`);
  }

  if (params.saturation !== 0) {
    filters.push(`saturate(${1 + params.saturation})`);
  }

  return filters.join(' ') || 'none';
}

// 테스트용 모의 데이터 생성
export function generateMockCover(overrides: Partial<GeneratedCover> = {}): GeneratedCover {
  return {
    id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    params: {
      mood: 'neon',
      palette: '#A55CFF',
      brightness: 0,
      saturation: 0,
      grain: 0,
      prompt: '',
    },
    createdAt: new Date().toISOString(),
    favorite: false,
    ...overrides,
  };
}