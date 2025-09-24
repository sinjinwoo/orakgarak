import apiClient from './client';
import { normalizeSong } from '../../utils/typeHelpers';
import type {
  Song,
  SongSearchResponse,
  SongDetailResponse,
} from '../../types/song';

export interface SongSearchParams {
  keyword: string;
  limit?: number;
  offset?: number;
}

export interface RecommendationFilters {
  genre?: string[];
  mood?: string[];
  tempo?: 'slow' | 'medium' | 'fast';
  decade?: string;
  language?: string;
  [key: string]: any;
}

// Song API 서비스
export const songService = {
  // === 곡 검색 ===
  
  // 실시간 곡 검색
  searchSongs: async (keyword: string, limit = 20): Promise<SongSearchResponse> => {
    const response = await apiClient.get<SongSearchResponse>('/songs/search/realtime', {
      params: { keyword, limit }
    });
    // 검색 결과 정규화 적용
    return (response.data || []).map(normalizeSong).filter(Boolean);
  },

  // 고급 검색 (추가 파라미터 지원)
  searchSongsAdvanced: async (params: SongSearchParams): Promise<SongSearchResponse> => {
    const response = await apiClient.get<SongSearchResponse>('/songs/search', {
      params
    });
    return response.data;
  },

  // === 곡 정보 ===
  
  // 특정 곡의 상세 정보 (MR 및 가사 포함)
  getSongDetail: async (songId: number): Promise<SongDetailResponse> => {
    const response = await apiClient.get<SongDetailResponse>(`/songs/${songId}`);
    return response.data;
  },

  // 곡 기본 정보만 조회
  getSong: async (songId: string): Promise<Song> => {
    const response = await apiClient.get<Song>(`/songs/${songId}`);
    return response.data;
  },

  // === 추천 시스템 ===
  
  // 추천 곡 목록
  getRecommendations: async (filters?: RecommendationFilters): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>('/songs/recommendations', { 
      params: filters 
    });
    return response.data;
  },

  // 사용자 맞춤 추천 (로그인 필요)
  getPersonalizedRecommendations: async (limit = 20): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>('/songs/recommendations/personalized', {
      params: { limit }
    });
    return response.data;
  },

  // 유사한 곡 추천
  getSimilarSongs: async (songId: number, limit = 10): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>(`/songs/${songId}/similar`, {
      params: { limit }
    });
    return response.data;
  },

  // === 인기/트렌딩 ===
  
  // 인기 곡 목록
  getPopularSongs: async (limit = 50, period = 'week'): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>('/songs/popular', {
      params: { limit, period }
    });
    return response.data;
  },

  // 트렌딩 곡 목록
  getTrendingSongs: async (limit = 20): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>('/songs/trending', {
      params: { limit }
    });
    return response.data;
  },

  // === 장르/카테고리 ===
  
  // 장르별 곡 목록
  getSongsByGenre: async (genre: string, limit = 20): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>('/songs/genre', {
      params: { genre, limit }
    });
    return response.data;
  },

  // 사용 가능한 장르 목록
  getGenres: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/songs/genres');
    return response.data;
  },

  // === 최근 활동 ===
  
  // 최근 검색한 곡들
  getRecentSearches: async (limit = 10): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>('/songs/recent-searches', {
      params: { limit }
    });
    return response.data;
  },

  // 최근 재생한 곡들
  getRecentlyPlayed: async (limit = 20): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>('/songs/recently-played', {
      params: { limit }
    });
    return response.data;
  },

  // === 통계 및 분석 ===
  
  // 곡 재생 기록 추가
  recordPlayback: async (songId: number): Promise<void> => {
    await apiClient.post(`/songs/${songId}/play`);
  },

  // 곡 통계 정보
  getSongStats: async (songId: number): Promise<{
    playCount: number;
    likeCount: number;
    recordingCount: number;
  }> => {
    const response = await apiClient.get(`/songs/${songId}/stats`);
    return response.data;
  },

  // === 싫어요 기능 ===
  
  // 싫어요 토글 (추가/취소)
  toggleDislike: async (songId: number): Promise<{
    isDisliked: boolean;
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post('/songs/dislikes/toggle', {
      songId
    });
    return response.data;
  }
};
