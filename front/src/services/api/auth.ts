import apiClient, { tokenManager } from './client';
import type { User } from '../../types/user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

// Auth API 서비스
export const authService = {
  // 일반 로그인
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    // 토큰 저장
    if (response.data.accessToken) {
      tokenManager.setToken(response.data.accessToken);
    }
    
    return response.data;
  },
  
  // 회원가입
  register: async (userData: RegisterRequest) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  // 로그아웃
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // 요청 성공/실패와 관계없이 로컬 토큰 삭제
      tokenManager.removeToken();
    }
  },
  
  // 토큰 갱신 (자동으로 처리되지만 수동 호출 가능)
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    
    if (response.data.accessToken) {
      tokenManager.setToken(response.data.accessToken);
    }
    
    return response.data;
  },

  // 현재 로그인 사용자 정보
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // 구글 소셜 로그인 (토큰 기반)
  loginWithGoogle: async (googleToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/google', { 
      token: googleToken 
    });
    
    if (response.data.accessToken) {
      tokenManager.setToken(response.data.accessToken);
    }
    
    return response.data;
  },

  // 카카오 소셜 로그인
  loginWithKakao: async (kakaoToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/kakao', { 
      token: kakaoToken 
    });
    
    if (response.data.accessToken) {
      tokenManager.setToken(response.data.accessToken);
    }
    
    return response.data;
  },

  // 토큰 유효성 검사
  validateToken: async (): Promise<boolean> => {
    try {
      await apiClient.get('/auth/validate');
      return true;
    } catch (error) {
      return false;
    }
  },

  // 로그인 상태 확인
  isAuthenticated: (): boolean => {
    const token = tokenManager.getToken();
    return !!token && !tokenManager.isTokenExpired();
  }
};
