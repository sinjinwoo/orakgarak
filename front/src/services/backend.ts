// 실제 백엔드 API 클라이언트
import apiClient from './apiClient';
import type { User, Profile, ProfileUpdateRequest, ProfileImageUpdateRequest } from '../types/user';
import type { 
  Album, 
  AlbumCreateRequest, 
  AlbumUpdateRequest, 
  AlbumCoverUploadResponse, 
  AlbumCoverGenerateRequest, 
  AlbumListResponse 
} from '../types/album';

// Auth API
export const authAPI = {
  // 일반 로그인 - POST /api/auth/login
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  
  // 회원가입 - POST /api/auth/register
  register: async (email: string, password: string, nickname: string) => {
    const response = await apiClient.post('/auth/register', { email, password, nickname });
    return response.data;
  },
  
  // 로그아웃 - POST /api/auth/logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  
  // 토큰 갱신 - POST /api/auth/refresh (자동 처리됨)
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  // 현재 로그인 사용자 정보 보기 - GET /api/auth/me
  getUserInfo: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // 구글 소셜 로그인 (리다이렉트 방식이므로 직접 사용 안 함)
  loginWithGoogle: async (googleToken: string) => {
    // 실제로는 사용되지 않음 (리다이렉트 방식)
    const response = await apiClient.post('/auth/google', { token: googleToken });
    return response.data;
  },

  // 카카오 소셜 로그인
  loginWithKakao: async (kakaoToken: string) => {
    const response = await apiClient.post('/auth/kakao', { token: kakaoToken });
    return response.data;
  },
};

// User API
export const userAPI = {

  // 팔로우
  follow: async (userId: string) => {
    const response = await apiClient.post(`/users/${userId}/follow`);
    return response.data;
  },

  // 언팔로우
  unfollow: async (userId: string) => {
    const response = await apiClient.delete(`/users/${userId}/follow`);
    return response.data;
  },

  // 팔로워 목록
  getFollowers: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/followers`);
    return response.data;
  },

  // 팔로잉 목록
  getFollowing: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/following`);
    return response.data;
  },
};

// Song API
export const songAPI = {
  // 곡 검색
  search: async (query: string, limit = 20) => {
    const response = await apiClient.get('/songs/search', { 
      params: { query, limit } 
    });
    return response.data;
  },
  
  // 추천 곡 목록
  getRecommendations: async (filters?: Record<string, unknown>) => {
    const response = await apiClient.get('/songs/recommendations', { 
      params: filters 
    });
    return response.data;
  },
  
  // 곡 상세 정보
  getSong: async (songId: string) => {
    const response = await apiClient.get(`/songs/${songId}`);
    return response.data;
  },
};

// Recording API
export const recordingAPI = {
  // 내 녹음본 목록
  getMyRecordings: async () => {
    const response = await apiClient.get('/records/me');
    return response;
  },
  
  // 녹음본 업로드
  uploadRecording: async (file: File, songId: string, metadata?: Record<string, unknown>) => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('songId', songId);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    const response = await apiClient.post('/recordings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // 녹음본 삭제
  deleteRecording: async (recordingId: string) => {
    const response = await apiClient.delete(`/recordings/${recordingId}`);
    return response.data;
  },
  
  // 녹음본 분석
  analyzeRecording: async (recordingId: string) => {
    const response = await apiClient.post(`/recordings/${recordingId}/analyze`);
    return response.data;
  },
};

// Album API
export const albumAPI = {
  // 사용자 앨범 목록 조회 - GET /albums
  getAlbums: async (params?: { page?: number; size?: number; sort?: string }): Promise<AlbumListResponse> => {
    const response = await apiClient.get<AlbumListResponse>('/albums', { params });
    return response.data;
  },
  
  // 특정 앨범 조회 - GET /albums/{albumId}
  getAlbum: async (albumId: number): Promise<Album> => {
    const response = await apiClient.get<Album>(`/albums/${albumId}`);
    return response.data;
  },
  
  // 새 앨범 생성 - POST /albums
  createAlbum: async (albumData: AlbumCreateRequest): Promise<Album> => {
    const response = await apiClient.post<Album>('/albums', albumData);
    return response.data;
  },
  
  // 앨범 정보 수정 - PUT /albums/{albumId}
  updateAlbum: async (albumId: number, albumData: AlbumUpdateRequest): Promise<Album> => {
    const response = await apiClient.put<Album>(`/albums/${albumId}`, albumData);
    return response.data;
  },
  
  // 앨범 삭제 - DELETE /albums/{albumId}
  deleteAlbum: async (albumId: number): Promise<void> => {
    await apiClient.delete(`/albums/${albumId}`);
  },
  
  // 앨범 커버 직접 업로드 - POST /albums/cover/upload
  uploadCover: async (file: File): Promise<AlbumCoverUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<AlbumCoverUploadResponse>('/albums/cover/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // AI 앨범 커버 자동 생성 - POST /albums/cover/generate
  generateCover: async (request: AlbumCoverGenerateRequest): Promise<AlbumCoverUploadResponse> => {
    const response = await apiClient.post<AlbumCoverUploadResponse>('/albums/cover/generate', request);
    return response.data;
  },
  
  // 앨범 좋아요 (기존 기능 유지 - 나중에 엔드포인트 추가 시 사용)
  likeAlbum: async (albumId: number) => {
    const response = await apiClient.post(`/albums/${albumId}/like`);
    return response.data;
  },
  
  // 앨범 좋아요 취소 (기존 기능 유지 - 나중에 엔드포인트 추가 시 사용)
  unlikeAlbum: async (albumId: number) => {
    const response = await apiClient.delete(`/albums/${albumId}/like`);
    return response.data;
  },

  // AI 앨범 커버 생성
  generateAICover: async (trackIds: string[], params: Record<string, unknown>, count = 3) => {
    const response = await apiClient.post('/albums/covers/generate', {
      trackIds,
      params,
      count
    });
    return response;
  },

  // 앨범 커버 이미지 업로드
  uploadCoverImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/albums/covers/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },
};

// Profile API
export const profileAPI = {
  // 내 프로필 보기 - GET /profiles/me
  getMyProfile: async (): Promise<Profile> => {
    const response = await apiClient.get('/profiles/me');
    return response.data;
  },

  // 내 프로필 수정 (사진 제외) - PUT /profiles/me
  updateMyProfile: async (data: ProfileUpdateRequest): Promise<Profile> => {
    const response = await apiClient.put('/profiles/me', data);
    return response.data;
  },

  // 특정 유저 프로필 보기 - GET /profiles/{userId}
  getUserProfile: async (userId: number): Promise<Profile> => {
    const response = await apiClient.get(`/profiles/${userId}`);
    return response.data;
  },

  // 사진 포함 프로필 수정 - POST /profiles/me/image
  updateMyProfileWithImage: async (data: ProfileImageUpdateRequest): Promise<Profile> => {
    const formData = new FormData();
    formData.append('image', data.image);
    
    // 선택적 필드들 추가
    if (data.nickname) {
      formData.append('nickname', data.nickname);
    }
    if (data.gender) {
      formData.append('gender', data.gender);
    }
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiClient.post('/profiles/me/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 닉네임 중복 체크 - GET /profiles/nickname/check
  checkNicknameDuplicate: async (nickname: string): Promise<boolean> => {
    const response = await apiClient.get('/profiles/nickname/check', {
      params: { nickname }
    });
    return response.data; // true: 사용 가능, false: 중복됨
  },

  // 마이페이지 통계 조회 - GET /profiles/mypage/stats
  getMyPageStats: async () => {
    const response = await apiClient.get('/profiles/mypage/stats');
    return response.data;
  },

  // 마이페이지 내 앨범 목록 - GET /profiles/mypage/albums
  getMyPageAlbums: async (page: number = 0, size: number = 10) => {
    const response = await apiClient.get('/profiles/mypage/albums', {
      params: { page, size }
    });
    return response.data;
  },

  // 마이페이지 좋아요한 앨범 목록 - GET /profiles/mypage/liked-albums
  getMyPageLikedAlbums: async (page: number = 0, size: number = 10) => {
    const response = await apiClient.get('/profiles/mypage/liked-albums', {
      params: { page, size }
    });
    return response.data;
  },
};