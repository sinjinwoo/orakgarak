/**
 * 피치 관련 유틸리티 함수들
 */

// 음계와 주파수 변환
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88,
};

// 주파수를 음계로 변환
export function frequencyToNote(frequency: number): { note: string; octave: number; cents: number } {
  if (frequency <= 0) {
    return { note: 'C', octave: 0, cents: 0 };
  }

  // A4 (440Hz)를 기준으로 계산
  const A4_FREQUENCY = 440;
  const A4_MIDI = 69;
  
  // MIDI 번호 계산
  const midiNumber = 12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI;
  
  // 옥타브와 반음 계산
  const octave = Math.floor(midiNumber / 12) - 1;
  const semitone = Math.round(midiNumber % 12);
  
  // 음계 이름 매핑
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const note = noteNames[semitone];
  
  // 센트 계산 (정확도)
  const cents = Math.round((midiNumber % 1) * 100);
  
  return { note, octave, cents };
}

// 음계를 주파수로 변환
export function noteToFrequency(note: string, octave: number): number {
  const baseNote = note.replace(/\d+/, '');
  const baseFrequency = NOTE_FREQUENCIES[baseNote];
  
  if (!baseFrequency) {
    return 0;
  }
  
  // 옥타브에 따른 주파수 조정
  return baseFrequency * Math.pow(2, octave - 4);
}

// 피치 정확도 계산 (0-100%)
export function calculatePitchAccuracy(
  targetFrequency: number,
  actualFrequency: number,
  tolerance: number = 50 // 센트 단위
): number {
  if (targetFrequency <= 0 || actualFrequency <= 0) {
    return 0;
  }
  
  // 센트 차이 계산
  const centsDifference = Math.abs(1200 * Math.log2(actualFrequency / targetFrequency));
  
  // 정확도 계산 (센트 차이가 작을수록 높은 정확도)
  const accuracy = Math.max(0, 100 - (centsDifference / tolerance) * 100);
  
  return Math.round(accuracy);
}

// 음역대 매칭 점수 계산
export function calculateVocalRangeMatch(
  userRange: { min: number; max: number },
  songRange: { min: number; max: number }
): number {
  const userSpan = userRange.max - userRange.min;
  const songSpan = songRange.max - songRange.min;
  
  // 겹치는 범위 계산
  const overlapMin = Math.max(userRange.min, songRange.min);
  const overlapMax = Math.min(userRange.max, songRange.max);
  const overlapSpan = Math.max(0, overlapMax - overlapMin);
  
  // 매칭 점수 계산 (겹치는 범위가 클수록 높은 점수)
  const matchScore = (overlapSpan / Math.max(userSpan, songSpan)) * 100;
  
  return Math.round(matchScore);
}

// 피치 히스토그램 생성 (음정 분석용)
export function generatePitchHistogram(
  frequencies: number[],
  binSize: number = 10
): Array<{ frequency: number; count: number }> {
  const histogram: Record<number, number> = {};
  
  frequencies.forEach(freq => {
    if (freq > 0) {
      const bin = Math.round(freq / binSize) * binSize;
      histogram[bin] = (histogram[bin] || 0) + 1;
    }
  });
  
  return Object.entries(histogram)
    .map(([freq, count]) => ({ frequency: Number(freq), count }))
    .sort((a, b) => a.frequency - b.frequency);
}

// 피치 안정성 계산 (변동 계수)
export function calculatePitchStability(frequencies: number[]): number {
  if (frequencies.length < 2) {
    return 100;
  }
  
  const mean = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
  const variance = frequencies.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) / frequencies.length;
  const standardDeviation = Math.sqrt(variance);
  
  // 변동 계수 (CV) 계산
  const coefficientOfVariation = standardDeviation / mean;
  
  // 안정성 점수 (CV가 낮을수록 높은 안정성)
  const stability = Math.max(0, 100 - coefficientOfVariation * 100);
  
  return Math.round(stability);
}

// 음역대 추천 곡 필터링
export function filterSongsByVocalRange(
  songs: Array<{ vocalRange: { min: number; max: number } }>,
  userRange: { min: number; max: number },
  minMatchScore: number = 70
): Array<{ song: any; matchScore: number }> {
  return songs
    .map(song => ({
      song,
      matchScore: calculateVocalRangeMatch(userRange, song.vocalRange)
    }))
    .filter(item => item.matchScore >= minMatchScore)
    .sort((a, b) => b.matchScore - a.matchScore);
}
