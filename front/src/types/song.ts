export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // 초 단위
  genre: string;
  key?: string; // 음계 (C, D, E, F, G, A, B)
  tempo?: number; // BPM
  difficulty: 'easy' | 'medium' | 'hard';
  popularity: number; // 0-100
  spotifyId?: string;
  melonId?: string;
}

export interface SongRecommendation extends Song {
  reason: string; // 추천 이유
  matchScore: number; // 매칭 점수 (0-100)
  vocalRangeMatch: {
    userMin: number;
    userMax: number;
    songMin: number;
    songMax: number;
  };
}
