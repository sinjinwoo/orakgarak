import { apiClient } from './api';

export interface MelonTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumImage?: string;
  duration: number; // 초 단위
  genre: string;
  releaseDate: string;
  popularity: number; // 0-100
  lyrics?: string;
  melonUrl?: string;
}

export interface MelonSearchResponse {
  tracks: MelonTrack[];
  total: number;
  page: number;
  limit: number;
}

export interface MelonChartResponse {
  realtime: MelonTrack[];
  daily: MelonTrack[];
  weekly: MelonTrack[];
}

// Kakao API 클라이언트 (Melon 데이터용)
class KakaoAPI {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_KAKAO_API_KEY || '';
  }

  // 곡 검색
  async searchTracks(query: string, limit = 20): Promise<MelonTrack[]> {
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/search/music?query=${encodeURIComponent(query)}&size=${limit}`,
        {
          headers: {
            'Authorization': `KakaoAK ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Kakao API request failed');
      }

      const data = await response.json();
      return data.documents.map((doc: any) => ({
        id: doc.id || Math.random().toString(36).substr(2, 9),
        title: doc.title,
        artist: doc.artist,
        album: doc.album,
        albumImage: doc.thumbnail,
        duration: this.parseDuration(doc.play_time),
        genre: doc.genre || 'Unknown',
        releaseDate: doc.release_date || '',
        popularity: doc.popularity || 0,
        melonUrl: doc.url,
      }));
    } catch (error) {
      console.error('Kakao search error:', error);
      return [];
    }
  }

  // 가사 검색
  async searchLyrics(trackId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/search/music?query=${encodeURIComponent(trackId)}&size=1`,
        {
          headers: {
            'Authorization': `KakaoAK ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Kakao API request failed');
      }

      const data = await response.json();
      return data.documents[0]?.lyrics || null;
    } catch (error) {
      console.error('Kakao lyrics error:', error);
      return null;
    }
  }

  // 차트 정보 가져오기
  async getCharts(): Promise<MelonChartResponse> {
    try {
      // 실제로는 우리 서버에서 Melon 차트 데이터를 가져와야 함
      const response = await apiClient.get('/melon/charts');
      return response.data || {
        realtime: [],
        daily: [],
        weekly: [],
      };
    } catch (error) {
      console.error('Melon charts error:', error);
      return {
        realtime: [],
        daily: [],
        weekly: [],
      };
    }
  }

  // 재생 시간 파싱 (문자열을 초로 변환)
  private parseDuration(durationStr: string): number {
    if (!durationStr) return 0;
    
    const parts = durationStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      return minutes * 60 + seconds;
    }
    
    return parseInt(durationStr, 10) || 0;
  }
}

// 싱글톤 인스턴스
export const kakaoAPI = new KakaoAPI();

// 더미 Kakao/Melon 서비스
export const kakaoService = {
  // 곡 검색 (더미 데이터)
  searchTracks: async (query: string, limit = 20) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const dummyTracks: MelonTrack[] = [
      {
        id: '1',
        title: '좋은 날',
        artist: '아이유',
        album: 'Real',
        albumImage: 'https://via.placeholder.com/300',
        duration: 240,
        genre: 'K-POP',
        releaseDate: '2010-12-09',
        popularity: 95,
        lyrics: '오늘 같은 날이면...',
        melonUrl: 'https://melon.com/track/1'
      }
    ];
    return { data: dummyTracks.slice(0, limit) };
  },

  // 가사 검색 (더미 데이터)
  searchLyrics: async (trackId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: { lyrics: '더미 가사입니다...' } };
  },

  // 차트 정보 (더미 데이터)
  getCharts: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: { realtime: [], daily: [], weekly: [] } };
  },

  // 아티스트 정보 (더미 데이터)
  getArtist: async (artistId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: { id: artistId, name: '더미 아티스트' } };
  },

  // 앨범 정보 (더미 데이터)
  getAlbum: async (albumId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: { id: albumId, title: '더미 앨범' } };
  },
};
