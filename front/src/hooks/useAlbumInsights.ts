/**
 * 앨범 인사이트 생성 훅
 * 트랙 정보에서 무드, 키, BPM, 가사 톤을 분석
 */

import { useState, useEffect } from 'react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  analysis?: {
    pitchAccuracy: number;
    tempoAccuracy: number;
    vocalRange: { min: number; max: number };
    toneAnalysis: { brightness: number; warmth: number; clarity: number };
    overallScore: number;
    feedback: string[];
  };
}

export interface AlbumInsights {
  mood: string;
  key: string;
  bpm: number;
  lyricTone: string;
  dominantGenre?: string;
  energyLevel?: number;
  danceability?: number;
  acousticness?: number;
}

export const useAlbumInsights = (tracks: Track[]) => {
  const [insights, setInsights] = useState<AlbumInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tracks || tracks.length === 0) {
      setInsights(null);
      return;
    }

    const generateInsights = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 실제 API 호출 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 더미 데이터 생성 로직
        const avgBpm = tracks.length > 0 ? 90 + Math.floor(Math.random() * 40) : 90;

        // 트랙 분석 데이터가 있는 경우 활용
        const avgBrightness = tracks.reduce((sum, track) => {
          return sum + (track.analysis?.toneAnalysis?.brightness || 70);
        }, 0) / tracks.length;

        const avgWarmth = tracks.reduce((sum, track) => {
          return sum + (track.analysis?.toneAnalysis?.warmth || 70);
        }, 0) / tracks.length;

        // 무드 결정 로직
        let mood = 'neutral';
        if (avgBrightness > 80 && avgWarmth > 75) {
          mood = 'joyful';
        } else if (avgBrightness < 60 && avgWarmth < 65) {
          mood = 'melancholic';
        } else if (avgBrightness > 70 && avgWarmth < 70) {
          mood = 'energetic';
        } else if (avgBrightness < 70 && avgWarmth > 70) {
          mood = 'nostalgic';
        }

        // 키 결정 (더미)
        const keys = ['C major', 'G major', 'D major', 'A major', 'E major', 'F major', 'Bb major', 'Am', 'Em', 'Bm', 'F#m'];
        const key = keys[Math.floor(Math.random() * keys.length)];

        // 가사 톤 결정
        let lyricTone = 'neutral';
        if (mood === 'joyful') lyricTone = 'uplifting';
        else if (mood === 'melancholic') lyricTone = 'introspective';
        else if (mood === 'energetic') lyricTone = 'motivational';
        else if (mood === 'nostalgic') lyricTone = 'reminiscent';

        const newInsights: AlbumInsights = {
          mood,
          key,
          bpm: avgBpm,
          lyricTone,
          dominantGenre: detectGenre(tracks),
          energyLevel: Math.floor(avgBrightness),
          danceability: Math.floor((avgBpm - 60) * 1.5),
          acousticness: Math.floor(100 - avgBrightness)
        };

        setInsights(newInsights);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate insights');
      } finally {
        setIsLoading(false);
      }
    };

    generateInsights();
  }, [tracks]);

  return { insights, isLoading, error };
};

// 장르 감지 헬퍼 함수
function detectGenre(tracks: Track[]): string {
  // 실제로는 트랙 제목, 아티스트, 오디오 분석 등을 활용
  const genres = ['Indie Pop', 'Alternative Rock', 'Folk', 'Electronic', 'R&B', 'Jazz', 'Classical'];
  return genres[Math.floor(Math.random() * genres.length)];
}

// 추가 유틸리티 훅들
export const useGenerateCover = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCover = async (payload: {
    prompt: string;
    style: string;
    parameters: Record<string, any>;
  }) => {
    setIsGenerating(true);
    setError(null);

    try {
      // 실제 AI 커버 생성 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 더미 응답
      const variants = Array.from({ length: 4 }, (_, i) => ({
        id: `variant-${Date.now()}-${i}`,
        imageUrl: `https://picsum.photos/400/400?random=${Date.now() + i}`,
        seed: Math.floor(Math.random() * 1000),
        prompt: payload.prompt,
        style: payload.style
      }));

      return variants;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cover');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateCover, isGenerating, error };
};

export const useUploadCover = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadCover = async (file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);

    try {
      // 파일 업로드 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 실제로는 FormData로 서버에 업로드
      const url = URL.createObjectURL(file);
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload cover');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadCover, isUploading, error };
};

// 색상 팔레트 추출 훅
export const useExtractPalette = () => {
  const extractPalette = async (imageUrl: string): Promise<string[]> => {
    try {
      // 실제로는 Canvas API나 외부 라이브러리를 사용하여 색상 추출
      await new Promise(resolve => setTimeout(resolve, 500));

      // 더미 팔레트 반환
      return [
        '#A855F7', // Primary purple
        '#EC4899', // Pink
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Amber
      ];
    } catch (error) {
      console.error('Failed to extract palette:', error);
      return ['#A855F7', '#EC4899']; // 기본 색상
    }
  };

  return { extractPalette };
};