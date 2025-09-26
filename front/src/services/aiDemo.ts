import apiClient from './api/client';

// AI 데모 신청 타입 정의
export interface AIDemoApplication {
  id: number;
  userId: number;
  recordIds: number[];
  youtubeLinks: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  statusDescription: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  records: AIDemoRecording[];
}

export interface AIDemoRecording {
  id: number;
  title: string;
  durationSeconds: number;
  url: string;
  createdAt: string;
  userId?: number;
}

export interface AIDemoRecord {
  id: number;
  userId: number;
  title: string;
  durationSeconds: number;
  url: string;
  urlStatus: string;
  extension: string;
  content_type: string;
  file_size: string;
  createdAt: string;
  updatedAt: string;
  uploadId: number;
}

export interface CreateAIDemoApplicationRequest {
  recordIds: number[];
  youtubeLinks: string[];
}

export interface UploadAIDemoFileRequest {
  audioFile: File;
  title: string;
  targetUserId: number;
  fileSizeBytes: number;
  durationSeconds: number;
}

// AI 데모 서비스 클래스
class AIDemoService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  }

  // AI 데모 신청 생성
  async createApplication(request: CreateAIDemoApplicationRequest): Promise<AIDemoApplication> {
    try {
      console.log('🎵 AI 데모 신청 요청:', request);
      const response = await apiClient.post<AIDemoApplication>('/ai-demo/applications', request);
      console.log('🎵 AI 데모 신청 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('AI 데모 신청 오류:', error);
      throw error;
    }
  }

  // 내 AI 데모 신청 목록 조회
  async getMyApplications(): Promise<AIDemoApplication[]> {
    try {
      console.log('🎵 내 AI 데모 신청 목록 조회 요청');
      const response = await apiClient.get<AIDemoApplication[]>('/ai-demo/applications/me');
      console.log('🎵 내 AI 데모 신청 목록 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('내 AI 데모 신청 목록 조회 오류:', error);
      throw error;
    }
  }

  // 특정 AI 데모 신청 조회
  async getApplication(applicationId: number): Promise<AIDemoApplication> {
    try {
      console.log('🎵 AI 데모 신청 조회 요청:', applicationId);
      const response = await apiClient.get<AIDemoApplication>(`/ai-demo/applications/${applicationId}`);
      console.log('🎵 AI 데모 신청 조회 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('AI 데모 신청 조회 오류:', error);
      throw error;
    }
  }

  // 상태별 신청 목록 조회
  async getApplicationsByStatus(status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'): Promise<AIDemoApplication[]> {
    try {
      console.log('🎵 상태별 AI 데모 신청 목록 조회 요청:', status);
      const params = status ? { status } : {};
      const response = await apiClient.get<AIDemoApplication[]>('/ai-demo/applications', { params });
      console.log('🎵 상태별 AI 데모 신청 목록 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('상태별 AI 데모 신청 목록 조회 오류:', error);
      throw error;
    }
  }

  // 내 AI 데모 파일 조회
  async getMyDemoRecords(): Promise<AIDemoRecord[]> {
    try {
      console.log('🎵 내 AI 데모 파일 조회 요청');
      const response = await apiClient.get<AIDemoRecord[]>('/ai-demo/records/me');
      console.log('🎵 내 AI 데모 파일 조회 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('내 AI 데모 파일 조회 오류:', error);
      throw error;
    }
  }

  // AI 데모 파일 업로드
  async uploadDemoFile(request: UploadAIDemoFileRequest): Promise<any> {
    try {
      console.log('🎵 AI 데모 파일 업로드 요청:', {
        title: request.title,
        targetUserId: request.targetUserId,
        fileSizeBytes: request.fileSizeBytes,
        durationSeconds: request.durationSeconds
      });

      const formData = new FormData();
      formData.append('audioFile', request.audioFile);
      formData.append('title', request.title);
      formData.append('targetUserId', request.targetUserId.toString());
      formData.append('fileSizeBytes', request.fileSizeBytes.toString());
      formData.append('durationSeconds', request.durationSeconds.toString());

      const response = await apiClient.post('/ai-demo/records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('🎵 AI 데모 파일 업로드 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('AI 데모 파일 업로드 오류:', error);
      throw error;
    }
  }

  // 전체 AI 데모 파일 조회
  async getAllDemoRecords(): Promise<AIDemoRecord[]> {
    try {
      console.log('🎵 전체 AI 데모 파일 조회 요청');
      const response = await apiClient.get<AIDemoRecord[]>('/ai-demo/records');
      console.log('🎵 전체 AI 데모 파일 조회 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('전체 AI 데모 파일 조회 오류:', error);
      throw error;
    }
  }

  // 특정 사용자 AI 데모 파일 조회
  async getUserDemoRecords(userId: number): Promise<AIDemoRecord[]> {
    try {
      console.log('🎵 사용자 AI 데모 파일 조회 요청:', userId);
      const response = await apiClient.get<AIDemoRecord[]>(`/ai-demo/records/users/${userId}`);
      console.log('🎵 사용자 AI 데모 파일 조회 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('사용자 AI 데모 파일 조회 오류:', error);
      throw error;
    }
  }

  // 사용자별 상태별 신청 개수 조회
  async getUserApplicationCount(userId: number, status?: string): Promise<{ count: number }> {
    try {
      console.log('🎵 사용자별 상태별 신청 개수 조회 요청:', { userId, status });
      const params = status ? { status } : {};
      const response = await apiClient.get<{ count: number }>(`/ai-demo/applications/users/${userId}/count`, { params });
      console.log('🎵 사용자별 상태별 신청 개수 조회 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('사용자별 상태별 신청 개수 조회 오류:', error);
      throw error;
    }
  }

  // YouTube 링크 유효성 검증
  isValidYouTubeLink(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  }

  // 녹음본 총 시간 계산
  calculateTotalDuration(recordings: AIDemoRecording[]): number {
    return recordings.reduce((total, recording) => total + recording.durationSeconds, 0);
  }

  // 최소 시간 검증 (30분 = 1800초)
  validateMinimumDuration(totalSeconds: number): boolean {
    return totalSeconds >= 1800; // 30분
  }
}

// 싱글톤 인스턴스
export const aiDemoService = new AIDemoService();

// 더미 AI 데모 서비스 (개발용)
export const aiDemoAPI = {
  // AI 데모 신청 생성 (더미 데이터)
  createApplication: async (request: CreateAIDemoApplicationRequest) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const dummyApplication: AIDemoApplication = {
      id: Math.floor(Math.random() * 1000) + 1,
      userId: 789,
      recordIds: request.recordIds,
      youtubeLinks: request.youtubeLinks,
      status: 'PENDING',
      statusDescription: '대기 중',
      adminNote: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      processedAt: null,
      records: []
    };
    return { data: dummyApplication };
  },

  // 내 AI 데모 신청 목록 조회 (더미 데이터)
  getMyApplications: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const dummyApplications: AIDemoApplication[] = [
      {
        id: 456,
        userId: 789,
        recordIds: [123, 456, 789],
        youtubeLinks: ['https://youtube.com/watch?v=example1'],
        status: 'APPROVED',
        statusDescription: '승인됨',
        adminNote: '훌륭한 목소리들입니다! AI 데모 제작 진행합니다.',
        createdAt: '2024-01-15T10:30:00',
        updatedAt: '2024-01-16T09:15:00',
        processedAt: '2024-01-16T09:15:00',
        records: [
          {
            id: 123,
            title: 'My Recording 1',
            durationSeconds: 180,
            url: 'https://s3.../recordings/file1.wav',
            createdAt: '2024-01-10T15:20:00'
          },
          {
            id: 456,
            title: 'My Recording 2',
            durationSeconds: 200,
            url: 'https://s3.../recordings/file2.wav',
            createdAt: '2024-01-12T10:15:00'
          },
          {
            id: 789,
            title: 'My Recording 3',
            durationSeconds: 150,
            url: 'https://s3.../recordings/file3.wav',
            createdAt: '2024-01-14T14:30:00'
          }
        ]
      }
    ];
    return { data: dummyApplications };
  },

  // 내 AI 데모 파일 조회 (더미 데이터)
  getMyDemoRecords: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const dummyRecords: AIDemoRecord[] = [
      {
        id: 999,
        userId: 789,
        title: 'AI Cover Demo - User789 (Multi-Record)',
        durationSeconds: 200,
        url: 'https://s3.../ai-cover/demo-file.wav',
        urlStatus: 'SUCCESS',
        extension: 'wav',
        content_type: 'audio/wav',
        file_size: '5242880',
        createdAt: '2024-01-20T14:30:00',
        updatedAt: '2024-01-20T14:30:00',
        uploadId: 1001
      }
    ];
    return { data: dummyRecords };
  }
};
