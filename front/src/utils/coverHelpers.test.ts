/**
 * 커버 헬퍼 함수들의 단위 테스트
 */

import {
  mergeParams,
  maintainMaxHistory,
  validateParams,
  filterFavoriteCovers,
  filterCoversByMood,
  sortCoversByDate,
  calculateParamsDiff,
  deduplicateCoverIds,
  searchCovers,
  generateCSSFilters,
  generateMockCover,
} from './coverHelpers';
import type { CoverParams } from '../types/cover';

// 기본 파라미터
const defaultParams: CoverParams = {
  mood: 'neon',
  palette: '#A55CFF',
  brightness: 0,
  saturation: 0,
  grain: 0,
  prompt: '',
};

describe('coverHelpers', () => {
  describe('mergeParams', () => {
    it('should merge parameters correctly', () => {
      const updates = { mood: 'retro' as const, brightness: 0.2 };
      const result = mergeParams(defaultParams, updates);

      expect(result.mood).toBe('retro');
      expect(result.brightness).toBe(0.2);
      expect(result.palette).toBe('#A55CFF'); // 기존 값 유지
    });

    it('should handle empty updates', () => {
      const result = mergeParams(defaultParams, {});
      expect(result).toEqual(defaultParams);
    });
  });

  describe('maintainMaxHistory', () => {
    it('should maintain max count', () => {
      const items = [1, 2, 3, 4, 5];
      const result = maintainMaxHistory(items, 3);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return all items if under max', () => {
      const items = [1, 2];
      const result = maintainMaxHistory(items, 5);
      expect(result).toEqual([1, 2]);
    });
  });

  describe('validateParams', () => {
    it('should validate correct parameters', () => {
      const result = validateParams(defaultParams);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch invalid color format', () => {
      const params = { ...defaultParams, palette: 'invalid-color' };
      const result = validateParams(params);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('올바른 색상 형식이 아닙니다. (#RRGGBB)');
    });

    it('should catch out-of-range brightness', () => {
      const params = { ...defaultParams, brightness: 1.0 };
      const result = validateParams(params);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('밝기는 -50%에서 50% 사이여야 합니다.');
    });

    it('should catch long prompt', () => {
      const longPrompt = 'a'.repeat(201);
      const params = { ...defaultParams, prompt: longPrompt };
      const result = validateParams(params);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('프롬프트는 200자 이내로 입력해주세요.');
    });
  });

  describe('filterFavoriteCovers', () => {
    it('should filter favorite covers', () => {
      const covers = [
        generateMockCover({ favorite: true }),
        generateMockCover({ favorite: false }),
        generateMockCover({ favorite: true }),
      ];

      const result = filterFavoriteCovers(covers);
      expect(result).toHaveLength(2);
      expect(result.every(cover => cover.favorite)).toBe(true);
    });
  });

  describe('filterCoversByMood', () => {
    it('should filter covers by mood', () => {
      const covers = [
        generateMockCover({ params: { ...defaultParams, mood: 'retro' } }),
        generateMockCover({ params: { ...defaultParams, mood: 'neon' } }),
        generateMockCover({ params: { ...defaultParams, mood: 'retro' } }),
      ];

      const result = filterCoversByMood(covers, 'retro');
      expect(result).toHaveLength(2);
      expect(result.every(cover => cover.params.mood === 'retro')).toBe(true);
    });
  });

  describe('sortCoversByDate', () => {
    it('should sort covers by date descending by default', () => {
      const now = Date.now();
      const covers = [
        generateMockCover({ createdAt: new Date(now - 1000).toISOString() }),
        generateMockCover({ createdAt: new Date(now).toISOString() }),
        generateMockCover({ createdAt: new Date(now - 2000).toISOString() }),
      ];

      const result = sortCoversByDate(covers);
      expect(new Date(result[0].createdAt).getTime()).toBeGreaterThan(
        new Date(result[1].createdAt).getTime()
      );
    });
  });

  describe('calculateParamsDiff', () => {
    it('should calculate parameter differences', () => {
      const prev = defaultParams;
      const current = { ...defaultParams, mood: 'retro' as const, brightness: 0.3 };

      const diff = calculateParamsDiff(prev, current);
      expect(diff.mood).toBe('retro');
      expect(diff.brightness).toBe(0.3);
      expect(diff.palette).toBeUndefined(); // 변경되지 않음
    });
  });

  describe('deduplicateCoverIds', () => {
    it('should remove duplicate IDs', () => {
      const ids = ['a', 'b', 'a', 'c', 'b'];
      const result = deduplicateCoverIds(ids);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('searchCovers', () => {
    it('should search covers by mood', () => {
      const covers = [
        generateMockCover({ params: { ...defaultParams, mood: 'retro' } }),
        generateMockCover({ params: { ...defaultParams, mood: 'neon' } }),
      ];

      const result = searchCovers(covers, 'retro');
      expect(result).toHaveLength(1);
      expect(result[0].params.mood).toBe('retro');
    });

    it('should search covers by prompt', () => {
      const covers = [
        generateMockCover({ params: { ...defaultParams, prompt: 'vintage style' } }),
        generateMockCover({ params: { ...defaultParams, prompt: 'modern design' } }),
      ];

      const result = searchCovers(covers, 'vintage');
      expect(result).toHaveLength(1);
      expect(result[0].params.prompt).toBe('vintage style');
    });

    it('should return all covers for empty query', () => {
      const covers = [generateMockCover(), generateMockCover()];
      const result = searchCovers(covers, '');
      expect(result).toHaveLength(2);
    });
  });

  describe('generateCSSFilters', () => {
    it('should generate CSS filters for brightness', () => {
      const params = { ...defaultParams, brightness: 0.2 };
      const result = generateCSSFilters(params);
      expect(result).toBe('brightness(1.2)');
    });

    it('should generate CSS filters for multiple properties', () => {
      const params = { ...defaultParams, brightness: 0.1, saturation: 0.3 };
      const result = generateCSSFilters(params);
      expect(result).toBe('brightness(1.1) saturate(1.3)');
    });

    it('should return none for default parameters', () => {
      const result = generateCSSFilters(defaultParams);
      expect(result).toBe('none');
    });
  });

  describe('generateMockCover', () => {
    it('should generate mock cover with defaults', () => {
      const cover = generateMockCover();
      expect(cover.id).toBeDefined();
      expect(cover.imageUrl).toBeDefined();
      expect(cover.params.mood).toBe('neon');
      expect(cover.favorite).toBe(false);
    });

    it('should apply overrides', () => {
      const cover = generateMockCover({ favorite: true });
      expect(cover.favorite).toBe(true);
    });
  });
});