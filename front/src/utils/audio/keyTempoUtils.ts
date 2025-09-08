/**
 * 음계와 템포 관련 유틸리티 함수들
 */

// 음계 정보
export interface KeyInfo {
  key: string;
  mode: 'major' | 'minor';
  scale: string[];
  relativeKey: string;
}

// 주요 음계 정보
export const MAJOR_KEYS: Record<string, KeyInfo> = {
  'C': {
    key: 'C',
    mode: 'major',
    scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    relativeKey: 'A'
  },
  'G': {
    key: 'G',
    mode: 'major',
    scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    relativeKey: 'E'
  },
  'D': {
    key: 'D',
    mode: 'major',
    scale: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    relativeKey: 'B'
  },
  'A': {
    key: 'A',
    mode: 'major',
    scale: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    relativeKey: 'F#'
  },
  'E': {
    key: 'E',
    mode: 'major',
    scale: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    relativeKey: 'C#'
  },
  'B': {
    key: 'B',
    mode: 'major',
    scale: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
    relativeKey: 'G#'
  },
  'F#': {
    key: 'F#',
    mode: 'major',
    scale: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
    relativeKey: 'D#'
  },
  'F': {
    key: 'F',
    mode: 'major',
    scale: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    relativeKey: 'D'
  },
  'Bb': {
    key: 'Bb',
    mode: 'major',
    scale: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    relativeKey: 'G'
  },
  'Eb': {
    key: 'Eb',
    mode: 'major',
    scale: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
    relativeKey: 'C'
  },
  'Ab': {
    key: 'Ab',
    mode: 'major',
    scale: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
    relativeKey: 'F'
  },
  'Db': {
    key: 'Db',
    mode: 'major',
    scale: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    relativeKey: 'Bb'
  }
};

// 단조 음계 정보
export const MINOR_KEYS: Record<string, KeyInfo> = {
  'A': {
    key: 'A',
    mode: 'minor',
    scale: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    relativeKey: 'C'
  },
  'E': {
    key: 'E',
    mode: 'minor',
    scale: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    relativeKey: 'G'
  },
  'B': {
    key: 'B',
    mode: 'minor',
    scale: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
    relativeKey: 'D'
  },
  'F#': {
    key: 'F#',
    mode: 'minor',
    scale: ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
    relativeKey: 'A'
  },
  'C#': {
    key: 'C#',
    mode: 'minor',
    scale: ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
    relativeKey: 'E'
  },
  'G#': {
    key: 'G#',
    mode: 'minor',
    scale: ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
    relativeKey: 'B'
  },
  'D#': {
    key: 'D#',
    mode: 'minor',
    scale: ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'],
    relativeKey: 'F#'
  },
  'D': {
    key: 'D',
    mode: 'minor',
    scale: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
    relativeKey: 'F'
  },
  'G': {
    key: 'G',
    mode: 'minor',
    scale: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
    relativeKey: 'Bb'
  },
  'C': {
    key: 'C',
    mode: 'minor',
    scale: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    relativeKey: 'Eb'
  },
  'F': {
    key: 'F',
    mode: 'minor',
    scale: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
    relativeKey: 'Ab'
  },
  'Bb': {
    key: 'Bb',
    mode: 'minor',
    scale: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
    relativeKey: 'Db'
  }
};

// 템포 범위 정의
export const TEMPO_RANGES = {
  'very_slow': { min: 40, max: 60, label: '매우 느림' },
  'slow': { min: 60, max: 80, label: '느림' },
  'moderate': { min: 80, max: 100, label: '보통' },
  'fast': { min: 100, max: 120, label: '빠름' },
  'very_fast': { min: 120, max: 200, label: '매우 빠름' }
} as const;

// 음계 감지 (간단한 버전)
export function detectKey(notes: string[]): KeyInfo | null {
  if (!notes || notes.length === 0) {
    return null;
  }

  // 각 음계별로 매칭 점수 계산
  let bestMatch: KeyInfo | null = null;
  let bestScore = 0;

  // 주요 음계 검사
  Object.values(MAJOR_KEYS).forEach(keyInfo => {
    const score = calculateKeyMatch(notes, keyInfo.scale);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = keyInfo;
    }
  });

  // 단조 음계 검사
  Object.values(MINOR_KEYS).forEach(keyInfo => {
    const score = calculateKeyMatch(notes, keyInfo.scale);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = keyInfo;
    }
  });

  return bestMatch;
}

// 음계 매칭 점수 계산
function calculateKeyMatch(notes: string[], scale: string[]): number {
  let matchCount = 0;
  const noteCount = notes.length;

  notes.forEach(note => {
    // 샵/플랫 처리
    const baseNote = note.replace(/[#b]/, '');
    if (scale.includes(baseNote)) {
      matchCount++;
    }
  });

  return (matchCount / noteCount) * 100;
}

// 템포 범위 분류
export function classifyTempo(bpm: number): { range: string; label: string } {
  for (const [range, info] of Object.entries(TEMPO_RANGES)) {
    if (bpm >= info.min && bpm < info.max) {
      return { range, label: info.label };
    }
  }
  
  // 범위를 벗어난 경우
  if (bpm < 40) {
    return { range: 'very_slow', label: '매우 느림' };
  } else {
    return { range: 'very_fast', label: '매우 빠름' };
  }
}

// 템포 매칭 점수 계산
export function calculateTempoMatch(
  userPreference: number,
  songTempo: number,
  tolerance: number = 10
): number {
  const difference = Math.abs(userPreference - songTempo);
  const matchScore = Math.max(0, 100 - (difference / tolerance) * 100);
  return Math.round(matchScore);
}

// 음계 호환성 계산
export function calculateKeyCompatibility(
  songKey: string,
  userPreferredKeys: string[]
): number {
  if (userPreferredKeys.includes(songKey)) {
    return 100;
  }

  // 상대조 계산
  const songKeyInfo = MAJOR_KEYS[songKey] || MINOR_KEYS[songKey];
  if (songKeyInfo && userPreferredKeys.includes(songKeyInfo.relativeKey)) {
    return 80;
  }

  // 같은 모드 (장조/단조)인지 확인
  const isSameMode = userPreferredKeys.some(key => {
    const userKeyInfo = MAJOR_KEYS[key] || MINOR_KEYS[key];
    return userKeyInfo && userKeyInfo.mode === songKeyInfo?.mode;
  });

  return isSameMode ? 60 : 30;
}

// 곡 추천을 위한 음계/템포 필터링
export function filterSongsByKeyAndTempo(
  songs: Array<{ key: string; tempo: number }>,
  userPreferences: {
    preferredKeys: string[];
    preferredTempo: number;
    tempoTolerance: number;
  }
): Array<{ song: any; keyScore: number; tempoScore: number; totalScore: number }> {
  return songs.map(song => {
    const keyScore = calculateKeyCompatibility(song.key, userPreferences.preferredKeys);
    const tempoScore = calculateTempoMatch(userPreferences.preferredTempo, song.tempo, userPreferences.tempoTolerance);
    const totalScore = (keyScore + tempoScore) / 2;

    return {
      song,
      keyScore,
      tempoScore,
      totalScore: Math.round(totalScore)
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

// 음계 변환 (트랜스포즈)
export function transposeKey(key: string, semitones: number): string {
  const allKeys = [...Object.keys(MAJOR_KEYS), ...Object.keys(MINOR_KEYS)];
  const currentIndex = allKeys.indexOf(key);
  
  if (currentIndex === -1) {
    return key;
  }

  const newIndex = (currentIndex + semitones + allKeys.length) % allKeys.length;
  return allKeys[newIndex];
}
