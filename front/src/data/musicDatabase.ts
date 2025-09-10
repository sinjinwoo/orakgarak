// 기존 음악 데이터베이스 (더미 데이터)
export interface MusicData {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number; // 초 단위
  coverImage?: string;
  audioUrl?: string;
  // 음악 분석 데이터
  analysis: {
    vocalRange: {
      min: number; // Hz
      max: number; // Hz
      comfortable: {
        min: number;
        max: number;
      };
    };
    key: string; // 음계 (C, D, E, F, G, A, B)
    tempo: number; // BPM
    difficulty: 'easy' | 'medium' | 'hard';
    mood: string[]; // 기분/상황 태그
    vocalCharacteristics: {
      pitchVariation: number; // 0-100, 음높이 변화 정도
      vibrato: number; // 0-100, 비브라토 정도
      breathiness: number; // 0-100, 숨소리 정도
      brightness: number; // 0-100, 음색 밝기
    };
  };
}

// 더미 음악 데이터베이스
export const musicDatabase: MusicData[] = [
  {
    id: 'music_001',
    title: '사랑해요',
    artist: '김철수',
    genre: '발라드',
    duration: 225, // 3:45
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    analysis: {
      vocalRange: {
        min: 90,
        max: 380,
        comfortable: {
          min: 100,
          max: 350
        }
      },
      key: 'C',
      tempo: 70,
      difficulty: 'easy',
      mood: ['사랑', '로맨틱', '감성'],
      vocalCharacteristics: {
        pitchVariation: 60,
        vibrato: 40,
        breathiness: 30,
        brightness: 70
      }
    }
  },
  {
    id: 'music_002',
    title: '추억의 거리',
    artist: '이영희',
    genre: '팝',
    duration: 252, // 4:12
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    analysis: {
      vocalRange: {
        min: 110,
        max: 420,
        comfortable: {
          min: 120,
          max: 400
        }
      },
      key: 'G',
      tempo: 120,
      difficulty: 'medium',
      mood: ['추억', '그리움', '감성'],
      vocalCharacteristics: {
        pitchVariation: 80,
        vibrato: 60,
        breathiness: 20,
        brightness: 85
      }
    }
  },
  {
    id: 'music_003',
    title: '밤하늘의 별',
    artist: '박민수',
    genre: '록',
    duration: 208, // 3:28
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=300&fit=crop',
    analysis: {
      vocalRange: {
        min: 85,
        max: 500,
        comfortable: {
          min: 100,
          max: 450
        }
      },
      key: 'A',
      tempo: 140,
      difficulty: 'hard',
      mood: ['에너지', '열정', '자유'],
      vocalCharacteristics: {
        pitchVariation: 90,
        vibrato: 30,
        breathiness: 10,
        brightness: 95
      }
    }
  },
  {
    id: 'music_004',
    title: '봄날의 기억',
    artist: '최지영',
    genre: '재즈',
    duration: 275, // 4:35
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    analysis: {
      vocalRange: {
        min: 95,
        max: 400,
        comfortable: {
          min: 110,
          max: 380
        }
      },
      key: 'F',
      tempo: 90,
      difficulty: 'medium',
      mood: ['평온', '자연', '봄'],
      vocalCharacteristics: {
        pitchVariation: 70,
        vibrato: 80,
        breathiness: 40,
        brightness: 60
      }
    }
  },
  {
    id: 'music_005',
    title: '여행의 시작',
    artist: '정수현',
    genre: '인디',
    duration: 235, // 3:55
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    analysis: {
      vocalRange: {
        min: 100,
        max: 380,
        comfortable: {
          min: 120,
          max: 360
        }
      },
      key: 'D',
      tempo: 110,
      difficulty: 'easy',
      mood: ['여행', '모험', '희망'],
      vocalCharacteristics: {
        pitchVariation: 65,
        vibrato: 35,
        breathiness: 25,
        brightness: 80
      }
    }
  },
  {
    id: 'music_006',
    title: '비 오는 날',
    artist: '한소영',
    genre: '발라드',
    duration: 240, // 4:00
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    analysis: {
      vocalRange: {
        min: 80,
        max: 350,
        comfortable: {
          min: 90,
          max: 320
        }
      },
      key: 'E',
      tempo: 65,
      difficulty: 'easy',
      mood: ['우울', '비', '감성'],
      vocalCharacteristics: {
        pitchVariation: 50,
        vibrato: 45,
        breathiness: 50,
        brightness: 40
      }
    }
  },
  {
    id: 'music_007',
    title: '파티 타임',
    artist: '김대현',
    genre: '팝',
    duration: 200, // 3:20
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    analysis: {
      vocalRange: {
        min: 120,
        max: 450,
        comfortable: {
          min: 140,
          max: 420
        }
      },
      key: 'B',
      tempo: 130,
      difficulty: 'medium',
      mood: ['파티', '즐거움', '에너지'],
      vocalCharacteristics: {
        pitchVariation: 85,
        vibrato: 25,
        breathiness: 15,
        brightness: 90
      }
    }
  },
  {
    id: 'music_008',
    title: '고요한 밤',
    artist: '박서연',
    genre: '재즈',
    duration: 280, // 4:40
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=300&fit=crop',
    analysis: {
      vocalRange: {
        min: 85,
        max: 320,
        comfortable: {
          min: 95,
          max: 300
        }
      },
      key: 'C',
      tempo: 75,
      difficulty: 'medium',
      mood: ['고요', '밤', '평온'],
      vocalCharacteristics: {
        pitchVariation: 40,
        vibrato: 70,
        breathiness: 60,
        brightness: 35
      }
    }
  }
];
