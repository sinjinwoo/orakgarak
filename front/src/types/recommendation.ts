// 추천 관련 타입 정의
export interface RecommendedSong {
  id: string;
  title: string;
  artist: string;
  album?: string; // 앨범명
  genre: string;
  duration: string;
  coverImage?: string;
  matchScore: number; // 0-100 사이의 매칭 점수
  reason: string; // 추천 이유
  difficulty: 'easy' | 'medium' | 'hard';
  key: string; // 음계 (예: 'C', 'D', 'F#')
  tempo: number; // BPM
  vocalRange: {
    min: number; // 최저 음 (Hz)
    max: number; // 최고 음 (Hz)
  };
  mood?: string[]; // 감정/분위기
  score?: number; // 점수 필드 추가
  audioUrl?: string; // 오디오 URL 필드 추가
}

export interface UserVocalRange {
  min: number; // 최저 음 (Hz)
  max: number; // 최고 음 (Hz)
  comfortable: {
    min: number;
    max: number;
  };
}

export interface RecommendationFilter {
  genre: string;
  difficulty: string;
  mood: string[];
  vocalRange: {
    min: number;
    max: number;
  };
}
