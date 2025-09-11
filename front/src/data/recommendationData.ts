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

// 추천 곡 더미 데이터 - 미래지향적이고 펑크한 느낌의 곡들
export const recommendedSongs: RecommendedSong[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    artist: 'CyberVox',
    genre: 'Electronic',
    duration: '3:45',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    matchScore: 95,
    reason: '당신의 음역대와 완벽하게 매칭됩니다',
    difficulty: 'easy',
    key: 'C',
    tempo: 128,
    vocalRange: {
      min: 90,
      max: 380
    }
  },
  {
    id: '2',
    title: 'Digital Pulse',
    artist: 'SynthWave',
    genre: 'Synthwave',
    duration: '4:12',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    matchScore: 88,
    reason: '편안한 음역대에서 부를 수 있는 미래적 멜로디',
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
    title: 'Electric Storm',
    artist: 'NeonPunk',
    genre: 'Cyberpunk',
    duration: '3:28',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=300&fit=crop',
    matchScore: 75,
    reason: '고음 부분이 도전적이지만 펑크한 에너지가 매력적',
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
    title: 'Holographic Love',
    artist: 'FutureVibes',
    genre: 'Future Bass',
    duration: '4:35',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    matchScore: 82,
    reason: '중간 음역대에서 안정적으로 부를 수 있는 미래적 사운드',
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
    title: 'Quantum Leap',
    artist: 'SpaceOpera',
    genre: 'Space Rock',
    duration: '3:55',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    matchScore: 90,
    reason: '당신의 음역대와 매우 잘 맞는 우주적 사운드',
    difficulty: 'easy',
    key: 'D',
    tempo: 110,
    vocalRange: {
      min: 100,
      max: 380
    }
  },
  {
    id: '6',
    title: 'Cyberpunk City',
    artist: 'NeonRiot',
    genre: 'Industrial',
    duration: '4:20',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop',
    matchScore: 78,
    reason: '도시적이고 펑크한 느낌의 강렬한 비트',
    difficulty: 'hard',
    key: 'E',
    tempo: 160,
    vocalRange: {
      min: 80,
      max: 450
    }
  },
  {
    id: '7',
    title: 'Hologram Heart',
    artist: 'VirtualSoul',
    genre: 'Ambient',
    duration: '5:15',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop',
    matchScore: 85,
    reason: '몽환적이고 미래적인 분위기의 감성적 곡',
    difficulty: 'medium',
    key: 'B',
    tempo: 75,
    vocalRange: {
      min: 95,
      max: 360
    }
  },
  {
    id: '8',
    title: 'Neon Nights',
    artist: 'RetroFuture',
    genre: 'Retrowave',
    duration: '3:40',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop',
    matchScore: 92,
    reason: '레트로 퓨처리즘의 매력적인 사운드',
    difficulty: 'easy',
    key: 'C#',
    tempo: 115,
    vocalRange: {
      min: 105,
      max: 390
    }
  },
  {
    id: '9',
    title: 'Digital Revolution',
    artist: 'TechRebel',
    genre: 'Electronic Rock',
    duration: '4:05',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop',
    matchScore: 73,
    reason: '기술과 록의 만남, 강렬한 에너지',
    difficulty: 'hard',
    key: 'F#',
    tempo: 135,
    vocalRange: {
      min: 90,
      max: 480
    }
  },
  {
    id: '10',
    title: 'Virtual Reality',
    artist: 'MetaVerse',
    genre: 'Progressive',
    duration: '6:30',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop',
    matchScore: 80,
    reason: '복잡한 구조의 프로그레시브 사운드',
    difficulty: 'hard',
    key: 'G#',
    tempo: 95,
    vocalRange: {
      min: 85,
      max: 420
    }
  }
];
