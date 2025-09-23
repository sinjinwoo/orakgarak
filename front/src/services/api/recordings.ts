import apiClient from './client';
import { normalizeRecording } from '../../utils/typeHelpers';
import type {
  Recording,
  PresignedUrlRequest,
  PresignedUrlResponse,
  CreateRecordingRequest,
  ProcessingStatus,
  ProcessingStatusResponse,
} from '../../types/recording';

export interface RecordingFilters {
  search?: string;
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface UploadMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}

// Recording API 서비스
export const recordingService = {
  // === 비동기 업로드 시스템 ===
  
  // Presigned URL 생성 (대용량 파일 업로드용)
  getPresignedUrl: async (request: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
    // 백엔드는 POST 요청에서 @RequestParam으로 query parameter를 받음
    const params = new URLSearchParams({
      originalFilename: request.originalFilename,
      fileSize: request.fileSize.toString(),
      contentType: request.contentType,
      durationSeconds: request.durationSeconds.toString(),
    });

    console.log('Presigned URL 요청 (POST with query params):', params.toString());

    const response = await apiClient.post<PresignedUrlResponse>(
      `/records/async/presigned-url?${params.toString()}`
    );
    return response.data;
  },

  // 녹음본 메타데이터 생성 (파일 업로드 후)
  createRecording: async (request: CreateRecordingRequest): Promise<Recording> => {
    const response = await apiClient.post<Recording>('/records/async', request);
    return response.data;
  },

  // === 녹음본 관리 ===
  
  // 특정 녹음본 조회
  getRecording: async (recordId: number): Promise<Recording> => {
    const response = await apiClient.get<Recording>(`/records/async/${recordId}`);
    return normalizeRecording(response.data);
  },

  // 녹음본 상세 정보 조회 (presignedUrl 포함)
  getRecordingDetail: async (recordId: number): Promise<{
    uploadId: number;
    presignedUrl: string;
    s3Key: string;
    expirationTime: string;
  }> => {
    console.log('🌐 API 요청: GET /records/async/' + recordId);
    const response = await apiClient.get(`/records/async/${recordId}`);
    console.log('🌐 API 응답:', response.data);
    return response.data;
  },

  // 녹음본 기반 노래 추천 API
  getRecommendations: async (uploadId: number): Promise<{
    status: string;
    message: string;
    recommendations: Array<{
      id: number;
      songId: number;
      songName: string;
      artistName: string;
      albumName: string;
      musicUrl: string;
      lyrics: string;
      albumCoverUrl: string;
      spotifyTrackId: string;
      durationMs: number;
      popularity: number;
      status: string;
    }>;
    voiceAnalysis: string;
  }> => {
    console.log('🌐 API 요청: POST /recommendations/song', { uploadId });
    const response = await apiClient.post('/recommendations/song', { uploadId });
    console.log('🌐 API 응답:', response.data);
    return response.data;
  },

  // 내 녹음본 목록 조회 (URL 포함된 정상 엔드포인트 사용)
  getMyRecordings: async (filters?: RecordingFilters): Promise<Recording[]> => {
    console.log('🌐 API 요청: GET /records/me', { filters });
    
    const response = await apiClient.get<Recording[]>('/records/me', {
      params: filters
    });
    
    console.log('🌐 API 응답 상태:', response.status);
    console.log('🌐 API 원본 응답 데이터:', response.data);
    
    if (response.data && Array.isArray(response.data)) {
      console.log('📊 응답 배열 길이:', response.data.length);
      response.data.forEach((item, index) => {
        console.log(`원본 녹음본 ${index + 1}:`, {
          id: item.id,
          title: item.title,
          url: item.url,                    // 백엔드 실제 URL 필드
          urlStatus: item.urlStatus,        // 백엔드 URL 상태
          extension: item.extension,
          content_type: item.content_type,
          durationSeconds: item.durationSeconds,
          '전체 객체': item
        });
      });
    }
    
    // 백엔드 응답을 그대로 사용 (정규화 없이)
    return response.data || [];
  },

  // 녹음본 삭제
  deleteRecording: async (recordId: number): Promise<void> => {
    await apiClient.delete(`/records/async/${recordId}`);
  },

  // === 직접 업로드 (간단한 파일용) ===
  
  // 녹음본 직접 업로드 (FormData)
  uploadRecording: async (
    file: File, 
    songId: string, 
    metadata?: UploadMetadata
  ): Promise<Recording> => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('songId', songId);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });
    }
    
    const response = await apiClient.post<Recording>('/recordings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 백엔드 프록시를 통한 직접 업로드 (CORS 회피)
  uploadRecordingDirect: async (
    title: string,
    audioBlob: Blob,
    songId?: number,
    durationSeconds?: number
  ): Promise<Recording> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, `${title}.wav`);
    formData.append('title', title);
    if (songId) formData.append('songId', songId.toString());
    if (durationSeconds) formData.append('durationSeconds', durationSeconds.toString());
    
    const response = await apiClient.post<Recording>('/records/direct', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // === 처리 상태 관리 ===
  
  // 처리 상태 조회 (uploadId 기반)
  getProcessingStatus: async (uploadId: number): Promise<ProcessingStatusResponse> => {
    const response = await apiClient.get<ProcessingStatusResponse>(
      `/processing/status/${uploadId}`
    );
    return response.data;
  },

  // 내가 업로드한 파일들의 처리 상태 확인
  getMyProcessingFiles: async (status?: string): Promise<ProcessingStatus[]> => {
    const response = await apiClient.get<ProcessingStatus[]>('/processing/my-files', {
      params: status ? { status } : undefined
    });
    return response.data;
  },

  // 처리 상태 실시간 구독 (Server-Sent Events)
  subscribeToProcessingStatus: (
    uploadId: number,
    onMessage: (data: ProcessingStatusResponse) => void,
    onError?: (error: Event) => void,
    onOpen?: () => void
  ): EventSource => {
    const eventSource = new EventSource(
      `${apiClient.defaults.baseURL}/processing/status/${uploadId}/stream`
    );

    eventSource.onopen = () => {
      console.log('Processing status stream connected');
      onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProcessingStatusResponse;
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Processing status stream error:', error);
      onError?.(error);
    };

    return eventSource;
  },

  // === 분석 및 처리 ===
  
  // 녹음본 분석 요청
  analyzeRecording: async (recordingId: string): Promise<any> => {
    const response = await apiClient.post(`/recordings/${recordingId}/analyze`);
    return response.data;
  },

  // 음성 분석 결과 조회
  getAnalysisResult: async (recordingId: number): Promise<any> => {
    const response = await apiClient.get(`/recordings/${recordingId}/analysis`);
    return response.data;
  },

  // === 레거시 호환성 메서드 ===
  
  // recordId 기반 처리 상태 확인 (레거시)
  checkProcessingStatus: async (recordId: number): Promise<Recording> => {
    const response = await apiClient.get<Recording>(`/records/async/${recordId}`);
    return response.data;
  },

  // === 유틸리티 메서드 ===
  
  // 파일 업로드 진행률 추적을 위한 업로드
  uploadWithProgress: async (
    file: File,
    songId: string,
    metadata?: UploadMetadata,
    onProgress?: (progressEvent: ProgressEvent) => void
  ): Promise<Recording> => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('songId', songId);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });
    }
    
    const response = await apiClient.post<Recording>('/recordings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  },

  // 여러 녹음본 일괄 삭제
  deleteMultipleRecordings: async (recordIds: number[]): Promise<void> => {
    await apiClient.delete('/records/async/bulk', {
      data: { recordIds }
    });
  },
};
