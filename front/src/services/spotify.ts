import apiClient from './apiClient';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
  duration_ms: number;
  popularity: number;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

export interface SpotifyRecommendationsResponse {
  tracks: SpotifyTrack[];
}

// Spotify API 클라이언트
class SpotifyAPI {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;

  constructor() {
    this.clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';
  }

  // 액세스 토큰 가져오기
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  // 곡 검색
  async searchTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data: SpotifySearchResponse = await response.json();
      return data.tracks.items;
    } catch (error) {
      console.error('Spotify search error:', error);
      return [];
    }
  }

  // 추천 곡 가져오기
  async getRecommendations(seedTracks: string[], limit = 20): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      const seedTracksParam = seedTracks.join(',');
      
      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?seed_tracks=${seedTracksParam}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data: SpotifyRecommendationsResponse = await response.json();
      return data.tracks;
    } catch (error) {
      console.error('Spotify recommendations error:', error);
      return [];
    }
  }

  // 곡 상세 정보 가져오기
  async getTrack(trackId: string): Promise<SpotifyTrack | null> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Track not found');
      }

      return await response.json();
    } catch (error) {
      console.error('Spotify track error:', error);
      return null;
    }
  }

  // 아티스트의 인기 곡 가져오기
  async getArtistTopTracks(artistId: string, limit = 10): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=KR`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return data.tracks.slice(0, limit);
    } catch (error) {
      console.error('Spotify artist top tracks error:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스
export const spotifyAPI = new SpotifyAPI();

// 우리 서버를 통한 Spotify 데이터 가져오기 (프록시)
export const spotifyService = {
  // 곡 검색
  searchTracks: (query: string, limit = 20) =>
    apiClient.get<SpotifyTrack[]>('/spotify/search', { 
      params: { q: query, limit } 
    }),

  // 추천 곡
  getRecommendations: (seedTracks: string[], limit = 20) =>
    apiClient.get<SpotifyTrack[]>('/spotify/recommendations', { 
      params: { seed_tracks: seedTracks.join(','), limit } 
    }),

  // 곡 상세 정보
  getTrack: (trackId: string) =>
    apiClient.get<SpotifyTrack>(`/spotify/tracks/${trackId}`),

  // 아티스트 인기 곡
  getArtistTopTracks: (artistId: string, limit = 10) =>
    apiClient.get<SpotifyTrack[]>(`/spotify/artists/${artistId}/top-tracks`, { 
      params: { limit } 
    }),
};
