// 추천 관련 타입 정의
export interface RecommendedSong {
  id: string;
  title: string;
  artist: string;
  album?: string; // 앨범명
  imageUrl?: string; // 앨범 커버 이미지 URL
  spotifyUrl?: string; // Spotify URL
  youtubeUrl?: string; // YouTube URL
  duration: number; // 초 단위
  popularity?: number; // 인기도
  lyrics?: any; // 가사 데이터
  
  // 추천 관련 메타데이터
  recommendationScore?: number; // 추천 점수
  matchReason?: string; // 추천 이유
  genre?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  mood?: string[]; // 감정/분위기
  vocalRange?: {
    min: number; // 최저 음 (Hz)
    max: number; // 최고 음 (Hz)
  };
  
  // 메타데이터
  addedAt?: string;
  playCount?: number;
  liked?: boolean;
  
  // 기존 호환성
  coverImage?: string; // imageUrl의 별칭
  matchScore?: number; // recommendationScore의 별칭
  reason?: string; // matchReason의 별칭
  key?: string; // 음계
  tempo?: number; // BPM
  score?: number; // 점수 필드
  audioUrl?: string; // 오디오 URL 필드
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
