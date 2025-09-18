// 실제 백엔드 API 클라이언트
import apiClient from './apiClient';
import type { User, Profile, ProfileUpdateRequest, ProfileImageUpdateRequest } from '../types/user';

// Auth API
export const authAPI = {
  // 일반 로그인 - POST /api/auth/login
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response;
  },
  
  // 회원가입 - POST /api/auth/register
  register: async (email: string, password: string, nickname: string) => {
    const response = await apiClient.post('/auth/register', { email, password, nickname });
    return response;
  },
  
  // 로그아웃 - POST /api/auth/logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response;
  },
  
  // 토큰 갱신 - POST /api/auth/refresh (자동 처리됨)
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response;
  },

  // 현재 로그인 사용자 정보 보기 - GET /api/auth/me
  getUserInfo: async () => {
    const response = await apiClient.get('/auth/me');
    return response;
  },

  // 구글 소셜 로그인 (리다이렉트 방식이므로 직접 사용 안 함)
  loginWithGoogle: async (googleToken: string) => {
    // 실제로는 사용되지 않음 (리다이렉트 방식)
    const response = await apiClient.post('/auth/google', { token: googleToken });
    return response;
  },

  // 카카오 소셜 로그인
  loginWithKakao: async (kakaoToken: string) => {
    const response = await apiClient.post('/auth/kakao', { token: kakaoToken });
    return response;
  },
};

// User API
export const userAPI = {

  // 팔로우
  follow: async (userId: string) => {
    const response = await apiClient.post(`/users/${userId}/follow`);
    return response;
  },

  // 언팔로우
  unfollow: async (userId: string) => {
    const response = await apiClient.delete(`/users/${userId}/follow`);
    return response;
  },

  // 팔로워 목록
  getFollowers: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/followers`);
    return response;
  },

  // 팔로잉 목록
  getFollowing: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/following`);
    return response;
  },
};

// Song API
export const songAPI = {
  // 곡 검색
  search: async (query: string, limit = 20) => {
    const response = await apiClient.get('/songs/search', { 
      params: { query, limit } 
    });
    return response;
  },
  
  // 추천 곡 목록
  getRecommendations: async (filters?: Record<string, unknown>) => {
    const response = await apiClient.get('/songs/recommendations', { 
      params: filters 
    });
    return response;
  },
  
  // 곡 상세 정보
  getSong: async (songId: string) => {
    const response = await apiClient.get(`/songs/${songId}`);
    return response;
  },
};

// Recording API
export const recordingAPI = {
  // 내 녹음본 목록
  getMyRecordings: async () => {
    const response = await apiClient.get('/recordings/me');
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
    return response;
  },
  
  // 녹음본 삭제
  deleteRecording: async (recordingId: string) => {
    const response = await apiClient.delete(`/recordings/${recordingId}`);
    return response;
  },
  
  // 녹음본 분석
  analyzeRecording: async (recordingId: string) => {
    const response = await apiClient.post(`/recordings/${recordingId}/analyze`);
    return response;
  },
};

// Album API
export const albumAPI = {
  // 앨범 목록
  getAlbums: async (filters?: Record<string, unknown>) => {
    const response = await apiClient.get('/albums', { params: filters });
    return response;
  },
  
  // 앨범 상세
  getAlbum: async (albumId: string) => {
    const response = await apiClient.get(`/albums/${albumId}`);
    return response;
  },
  
  // 앨범 생성
  createAlbum: async (albumData: Record<string, unknown>) => {
    const response = await apiClient.post('/albums', albumData);
    return response;
  },
  
  // 앨범 수정
  updateAlbum: async (albumId: string, albumData: Record<string, unknown>) => {
    const response = await apiClient.put(`/albums/${albumId}`, albumData);
    return response;
  },
  
  // 앨범 삭제
  deleteAlbum: async (albumId: string) => {
    const response = await apiClient.delete(`/albums/${albumId}`);
    return response;
  },
  
  // 앨범 좋아요
  likeAlbum: async (albumId: string) => {
    const response = await apiClient.post(`/albums/${albumId}/like`);
    return response;
  },
  
  // 앨범 좋아요 취소
  unlikeAlbum: async (albumId: string) => {
    const response = await apiClient.delete(`/albums/${albumId}/like`);
    return response;
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
};