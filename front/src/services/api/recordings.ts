import apiClient from './client';
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
    const params = new URLSearchParams({
      originalFilename: request.originalFilename,
      fileSize: request.fileSize.toString(),
      contentType: request.contentType,
      durationSeconds: request.durationSeconds.toString(),
    });

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
    return response.data;
  },

  // 내 녹음본 목록 조회
  getMyRecordings: async (filters?: RecordingFilters): Promise<Recording[]> => {
    const response = await apiClient.get<Recording[]>('/records/async/me', {
      params: filters
    });
    return response.data;
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
