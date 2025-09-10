import type { MusicData } from '../data/musicDatabase';
import type { VoiceAnalysis, VoiceTestResult } from '../types/voiceAnalysis';
import type { RecommendedSong } from '../types/recommendation';

// 음성 테스트 결과를 VoiceAnalysis로 변환
export const convertTestResultsToAnalysis = (results: VoiceTestResult[]): VoiceAnalysis => {
  // 테스트 결과에서 음역대 정보 추출
  const rangeResults = results.filter(r => r.data.frequency);
  const frequencies = rangeResults.map(r => r.data.frequency!).filter(f => f > 0);
  
  const minFreq = Math.min(...frequencies);
  const maxFreq = Math.max(...frequencies);
  
  // 편안한 음역대는 전체 음역대의 70-90% 범위
  const comfortableRange = (maxFreq - minFreq) * 0.2;
  const comfortableMin = minFreq + comfortableRange;
  const comfortableMax = maxFreq - comfortableRange;
  
  // 음색 특성 평균 계산
  const characteristicsResults = results.filter(r => r.data.characteristics);
  const avgCharacteristics = characteristicsResults.reduce(
    (acc, result) => {
      const chars = result.data.characteristics!;
      return {
        pitchVariation: acc.pitchVariation + chars.pitchVariation,
        vibrato: acc.vibrato + chars.vibrato,
        breathiness: acc.breathiness + chars.breathiness,
        brightness: acc.brightness + chars.brightness
      };
    },
    { pitchVariation: 0, vibrato: 0, breathiness: 0, brightness: 0 }
  );
  
  const count = characteristicsResults.length || 1;
  
  return {
    vocalRange: {
      min: minFreq,
      max: maxFreq,
      comfortable: {
        min: comfortableMin,
        max: comfortableMax
      }
    },
    vocalCharacteristics: {
      pitchVariation: avgCharacteristics.pitchVariation / count,
      vibrato: avgCharacteristics.vibrato / count,
      breathiness: avgCharacteristics.breathiness / count,
      brightness: avgCharacteristics.brightness / count
    },
    confidence: Math.min(100, results.reduce((sum, r) => sum + r.score, 0) / results.length)
  };
};

// 음역대 매칭 점수 계산
const calculateRangeMatch = (userRange: VoiceAnalysis['vocalRange'], songRange: MusicData['analysis']['vocalRange']): number => {
  // 편안한 음역대와 곡의 편안한 음역대 겹침 정도 계산
  const userComfortMin = userRange.comfortable.min;
  const userComfortMax = userRange.comfortable.max;
  const songComfortMin = songRange.comfortable.min;
  const songComfortMax = songRange.comfortable.max;
  
  // 겹치는 범위 계산
  const overlapMin = Math.max(userComfortMin, songComfortMin);
  const overlapMax = Math.min(userComfortMax, songComfortMax);
  const overlap = Math.max(0, overlapMax - overlapMin);
  
  // 전체 범위
  const totalRange = Math.max(userComfortMax, songComfortMax) - Math.min(userComfortMin, songComfortMin);
  
  if (totalRange === 0) return 0;
  
  return (overlap / totalRange) * 100;
};

// 음색 특성 매칭 점수 계산
const calculateCharacteristicsMatch = (
  userChars: VoiceAnalysis['vocalCharacteristics'],
  songChars: MusicData['analysis']['vocalCharacteristics']
): number => {
  const pitchDiff = Math.abs(userChars.pitchVariation - songChars.pitchVariation);
  const vibratoDiff = Math.abs(userChars.vibrato - songChars.vibrato);
  const breathinessDiff = Math.abs(userChars.breathiness - songChars.breathiness);
  const brightnessDiff = Math.abs(userChars.brightness - songChars.brightness);
  
  // 각 특성의 차이를 0-100 점수로 변환 (차이가 적을수록 높은 점수)
  const pitchScore = Math.max(0, 100 - pitchDiff);
  const vibratoScore = Math.max(0, 100 - vibratoDiff);
  const breathinessScore = Math.max(0, 100 - breathinessDiff);
  const brightnessScore = Math.max(0, 100 - brightnessDiff);
  
  // 가중 평균 (음색 밝기가 가장 중요)
  return (pitchScore * 0.2 + vibratoScore * 0.2 + breathinessScore * 0.2 + brightnessScore * 0.4);
};

// 추천 점수 계산
export const calculateRecommendationScore = (
  userAnalysis: VoiceAnalysis,
  musicData: MusicData,
  userPreferences: {
    genre?: string;
    difficulty?: string;
    mood?: string[];
  } = {}
): number => {
  let score = 0;
  let weightSum = 0;
  
  // 1. 음역대 매칭 (40% 가중치)
  const rangeScore = calculateRangeMatch(userAnalysis.vocalRange, musicData.analysis.vocalRange);
  score += rangeScore * 0.4;
  weightSum += 0.4;
  
  // 2. 음색 특성 매칭 (30% 가중치)
  const characteristicsScore = calculateCharacteristicsMatch(
    userAnalysis.vocalCharacteristics,
    musicData.analysis.vocalCharacteristics
  );
  score += characteristicsScore * 0.3;
  weightSum += 0.3;
  
  // 3. 사용자 선호도 (20% 가중치)
  let preferenceScore = 50; // 기본 점수
  
  if (userPreferences.genre && musicData.genre.toLowerCase() === userPreferences.genre.toLowerCase()) {
    preferenceScore += 30;
  }
  
  if (userPreferences.difficulty && musicData.analysis.difficulty === userPreferences.difficulty) {
    preferenceScore += 20;
  }
  
  if (userPreferences.mood && userPreferences.mood.length > 0) {
    const moodMatches = userPreferences.mood.filter(mood => 
      musicData.analysis.mood.some(songMood => 
        songMood.toLowerCase().includes(mood.toLowerCase())
      )
    ).length;
    preferenceScore += (moodMatches / userPreferences.mood.length) * 20;
  }
  
  score += Math.min(100, preferenceScore) * 0.2;
  weightSum += 0.2;
  
  // 4. 분석 신뢰도 (10% 가중치)
  score += userAnalysis.confidence * 0.1;
  weightSum += 0.1;
  
  return Math.round(score / weightSum);
};

// 추천 이유 생성
export const generateRecommendationReason = (
  userAnalysis: VoiceAnalysis,
  musicData: MusicData,
  score: number
): string => {
  const reasons: string[] = [];
  
  // 음역대 매칭
  const rangeScore = calculateRangeMatch(userAnalysis.vocalRange, musicData.analysis.vocalRange);
  if (rangeScore >= 80) {
    reasons.push('음역대가 완벽하게 맞습니다');
  } else if (rangeScore >= 60) {
    reasons.push('음역대가 잘 맞습니다');
  } else if (rangeScore >= 40) {
    reasons.push('음역대가 어느 정도 맞습니다');
  }
  
  // 음색 특성
  const characteristicsScore = calculateCharacteristicsMatch(
    userAnalysis.vocalCharacteristics,
    musicData.analysis.vocalCharacteristics
  );
  if (characteristicsScore >= 80) {
    reasons.push('음색이 잘 어울립니다');
  } else if (characteristicsScore >= 60) {
    reasons.push('음색이 어느 정도 어울립니다');
  }
  
  // 난이도
  if (musicData.analysis.difficulty === 'easy') {
    reasons.push('쉬운 난이도로 부르기 편합니다');
  } else if (musicData.analysis.difficulty === 'medium') {
    reasons.push('적당한 난이도로 도전해볼 만합니다');
  } else {
    reasons.push('도전적인 곡으로 실력 향상에 도움이 됩니다');
  }
  
  // 기본 이유
  if (reasons.length === 0) {
    if (score >= 80) {
      reasons.push('전반적으로 잘 맞는 곡입니다');
    } else if (score >= 60) {
      reasons.push('괜찮은 매칭을 보여줍니다');
    } else {
      reasons.push('연습해볼 만한 곡입니다');
    }
  }
  
  return reasons.join(', ');
};

// 음악 데이터를 추천 곡 형태로 변환
export const convertToRecommendedSong = (
  musicData: MusicData,
  score: number,
  reason: string
): RecommendedSong => {
  return {
    id: musicData.id,
    title: musicData.title,
    artist: musicData.artist,
    genre: musicData.genre,
    duration: `${Math.floor(musicData.duration / 60)}:${(musicData.duration % 60).toString().padStart(2, '0')}`,
    coverImage: musicData.coverImage,
    matchScore: score,
    reason,
    difficulty: musicData.analysis.difficulty,
    key: musicData.analysis.key,
    tempo: musicData.analysis.tempo,
    vocalRange: musicData.analysis.vocalRange
  };
};
