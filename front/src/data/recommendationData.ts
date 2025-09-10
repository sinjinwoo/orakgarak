import type { RecommendedSong, UserVocalRange } from '../types/recommendation';

// 사용자 음역대 더미 데이터
export const userVocalRange: UserVocalRange = {
  min: 80, // Hz
  max: 400, // Hz
  comfortable: {
    min: 100,
    max: 350
  }
};

// 추천 곡 더미 데이터
export const recommendedSongs: RecommendedSong[] = [
  {
    id: '1',
    title: '사랑해요',
    artist: '김철수',
    genre: '발라드',
    duration: '3:45',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    matchScore: 95,
    reason: '음역대가 완벽하게 맞습니다',
    difficulty: 'easy',
    key: 'C',
    tempo: 70,
    vocalRange: {
      min: 90,
      max: 380
    }
  },
  {
    id: '2',
    title: '추억의 거리',
    artist: '이영희',
    genre: '팝',
    duration: '4:12',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    matchScore: 88,
    reason: '편안한 음역대에서 부를 수 있습니다',
    difficulty: 'medium',
    key: 'G',
    tempo: 120,
    vocalRange: {
      min: 110,
      max: 420
    }
  },
  {
    id: '3',
    title: '밤하늘의 별',
    artist: '박민수',
    genre: '록',
    duration: '3:28',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=300&fit=crop',
    matchScore: 75,
    reason: '고음 부분이 도전적이지만 연습하면 가능합니다',
    difficulty: 'hard',
    key: 'A',
    tempo: 140,
    vocalRange: {
      min: 85,
      max: 500
    }
  },
  {
    id: '4',
    title: '봄날의 기억',
    artist: '최지영',
    genre: '재즈',
    duration: '4:35',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    matchScore: 82,
    reason: '중간 음역대에서 안정적으로 부를 수 있습니다',
    difficulty: 'medium',
    key: 'F',
    tempo: 90,
    vocalRange: {
      min: 95,
      max: 400
    }
  },
  {
    id: '5',
    title: '여행의 시작',
    artist: '정수현',
    genre: '인디',
    duration: '3:55',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    matchScore: 90,
    reason: '당신의 음역대와 매우 잘 맞습니다',
    difficulty: 'easy',
    key: 'D',
    tempo: 110,
    vocalRange: {
      min: 100,
      max: 380
    }
  }
];
