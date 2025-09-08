import apiClient from './apiClient';

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

// 우리 서버를 통한 AI 서비스 호출 (프록시)
export const aiAPI = {
  // 음성 분석
  analyzeVoice: (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    return apiClient.post<VoiceAnalysis>('/ai/voice/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // AI 커버 생성
  generateAICover: (request: AICoverRequest) =>
    apiClient.post<AICoverResponse>('/ai/cover/generate', request),

  // AI 커버 상태 확인
  getAICoverStatus: (coverId: string) =>
    apiClient.get<AICoverResponse>(`/ai/cover/status/${coverId}`),

  // AI 앨범 커버 생성
  generateCoverImage: (request: AICoverImageRequest) =>
    apiClient.post<AICoverImageResponse>('/ai/image/generate', request),

  // 음역대 추천
  getVocalRangeRecommendations: (vocalRange: { min: number; max: number }) =>
    apiClient.post<any[]>('/ai/recommendations/vocal-range', vocalRange),

  // 실시간 피치 분석
  analyzePitch: (audioData: Float32Array) =>
    apiClient.post<{ pitch: number; accuracy: number }>('/ai/pitch/analyze', { audioData }),

  // 박자 분석
  analyzeTempo: (audioData: Float32Array) =>
    apiClient.post<{ tempo: number; accuracy: number }>('/ai/tempo/analyze', { audioData }),
};
