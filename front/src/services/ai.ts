import { apiClient } from './api';

export interface VoiceAnalysis {
  pitchAccuracy: number; // 0-100
  tempoAccuracy: number; // 0-100
  vocalRange: {
    min: number; // Hz
    max: number; // Hz
  };
  toneAnalysis: {
    brightness: number; // 0-100
    warmth: number; // 0-100
    clarity: number; // 0-100
  };
  overallScore: number; // 0-100
  feedback: string[];
}

export interface AICoverRequest {
  originalAudioUrl: string;
  targetArtist: string;
  style?: 'pop' | 'rock' | 'ballad' | 'rnb' | 'hiphop';
  quality?: 'standard' | 'high' | 'premium';
}

export interface AICoverResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  resultAudioUrl?: string;
  processingTime?: number;
  error?: string;
}

export interface AICoverImageRequest {
  prompt: string;
  style?: 'realistic' | 'artistic' | 'minimal' | 'vintage';
  size?: 'square' | 'landscape' | 'portrait';
}

export interface AICoverImageResponse {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
}

// AI 서비스 클라이언트
class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api';
  }

  // 음성 분석
  async analyzeVoice(audioFile: File): Promise<VoiceAnalysis> {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);

      const response = await fetch(`${this.baseUrl}/voice/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Voice analysis failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Voice analysis error:', error);
      throw error;
    }
  }

  // AI 커버 생성
  async generateAICover(request: AICoverRequest): Promise<AICoverResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/cover/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('AI cover generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('AI cover generation error:', error);
      throw error;
    }
  }

  // AI 커버 상태 확인
  async getAICoverStatus(coverId: string): Promise<AICoverResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/cover/status/${coverId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get cover status');
      }

      return await response.json();
    } catch (error) {
      console.error('AI cover status error:', error);
      throw error;
    }
  }

  // AI 앨범 커버 생성
  async generateCoverImage(request: AICoverImageRequest): Promise<AICoverImageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/image/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Cover image generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Cover image generation error:', error);
      throw error;
    }
  }

  // 음역대 추천
  async getVocalRangeRecommendations(vocalRange: { min: number; max: number }): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/vocal-range`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vocalRange),
      });

      if (!response.ok) {
        throw new Error('Vocal range recommendations failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Vocal range recommendations error:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스
export const aiService = new AIService();

// 더미 AI 서비스
export const aiAPI = {
  // 음성 분석 (더미 데이터)
  analyzeVoice: async (audioFile: File) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const dummyAnalysis: VoiceAnalysis = {
      pitchAccuracy: 85,
      tempoAccuracy: 90,
      vocalRange: { min: 80, max: 400 },
      toneAnalysis: {
        brightness: 70,
        warmth: 80,
        clarity: 75
      },
      overallScore: 82,
      feedback: ['음정이 정확합니다', '박자를 더 정확히 맞춰보세요']
    };
    return { data: dummyAnalysis };
  },

  // AI 커버 생성 (더미 데이터)
  generateAICover: async (request: AICoverRequest) => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return { 
      data: { 
        id: 'cover-1', 
        status: 'completed' as const,
        resultAudioUrl: 'dummy-cover-audio-url'
      } 
    };
  },

  // AI 커버 상태 확인 (더미 데이터)
  getAICoverStatus: async (coverId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { 
      data: { 
        id: coverId, 
        status: 'completed' as const,
        resultAudioUrl: 'dummy-cover-audio-url'
      } 
    };
  },

  // AI 앨범 커버 생성 (더미 데이터)
  generateCoverImage: async (request: AICoverImageRequest) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { 
      data: { 
        id: 'image-1', 
        imageUrl: 'https://via.placeholder.com/400x400',
        prompt: request.prompt,
        createdAt: new Date().toISOString()
      } 
    };
  },

  // 음역대 추천 (더미 데이터)
  getVocalRangeRecommendations: async (vocalRange: { min: number; max: number }) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: [] };
  },

  // 실시간 피치 분석 (더미 데이터)
  analyzePitch: async (audioData: Float32Array) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { pitch: 440, accuracy: 85 } };
  },

  // 박자 분석 (더미 데이터)
  analyzeTempo: async (audioData: Float32Array) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { tempo: 120, accuracy: 90 } };
  },
};
