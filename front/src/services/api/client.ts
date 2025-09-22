import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from './types';

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://j13c103.p.ssafy.io/api';

// 토큰 만료 시간 설정 (기본값: 1시간)
const TOKEN_EXPIRY_TIME = parseInt(import.meta.env.VITE_TOKEN_EXPIRY_HOURS || '1') * 60 * 60 * 1000;

// 통합 Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // refreshToken 쿠키를 위해 필요
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 갱신 중인지 확인하는 플래그
let isRefreshing = false;
// 토큰 갱신 대기 중인 요청들을 저장하는 배열
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

// 대기 중인 요청들을 처리하는 함수
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// 토큰 관리 유틸리티
export const tokenManager = {
  getToken: () => localStorage.getItem('auth-token'),
  setToken: (token: string) => {
    localStorage.setItem('auth-token', token);
    localStorage.setItem('token-created-time', Date.now().toString());
  },
  removeToken: () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('token-created-time');
    localStorage.removeItem('userId'); // 기존 호환성을 위해
    localStorage.removeItem('accessToken'); // 기존 호환성을 위해
  },
  isTokenExpired: () => {
    const token = localStorage.getItem('auth-token');
    const createdTime = localStorage.getItem('token-created-time');
    
    if (!token || !createdTime) return true;
    
    // 설정된 시간 이상 지났으면 만료로 간주
    const now = Date.now();
    const created = parseInt(createdTime);
    return (now - created) > TOKEN_EXPIRY_TIME;
  }
};

// 요청 인터셉터: 모든 요청에 Authorization 헤더 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 시 자동 토큰 갱신
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 녹음본 API 응답 로깅
    if (response.config.url?.includes('/records/async/me')) {
      console.log('🌐 API 클라이언트 응답:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // 401 에러이고 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 이미 토큰 갱신 중인 경우, 대기열에 추가
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;

      try {
        // 토큰 갱신 시도 - POST /api/auth/refresh
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {}, // 요청 바디 없음
          { 
            withCredentials: true, // refreshToken 쿠키 포함
            timeout: 5000
          }
        );

        const { accessToken } = refreshResponse.data;
        
        if (accessToken) {
          // 새 토큰 저장
          tokenManager.setToken(accessToken);
          
          // 대기 중인 요청들에 새 토큰 전달
          processQueue(null, accessToken);
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error('새 액세스 토큰을 받지 못했습니다.');
        }
      } catch (refreshError: any) {
        console.error('토큰 갱신 실패:', refreshError);
        
        // 에러 상태에 따른 처리
        const status = refreshError.response?.status;
        const errorCode = refreshError.response?.data?.code;
        
        if (status === 400 && errorCode === 'MISSING_REFRESH_TOKEN') {
          console.log('리프레시 토큰이 없습니다. 로그인이 필요합니다.');
        } else if (status === 401 && errorCode === 'INVALID_REFRESH_TOKEN') {
          console.log('리프레시 토큰이 만료되었습니다. 다시 로그인해주세요.');
        } else {
          console.log('토큰 갱신 중 알 수 없는 오류가 발생했습니다.');
        }
        
        // 모든 경우에 저장된 토큰 정보 삭제
        tokenManager.removeToken();
        
        // 대기 중인 요청들에 에러 전달
        processQueue(refreshError, null);
        
        // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 관련이 아닌 경우)
        if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
          console.log('인증 실패로 인한 로그아웃 처리 - 홈페이지로 이동');
          
          // 사용자에게 알림 (선택사항)
          if (status === 400 && errorCode === 'MISSING_REFRESH_TOKEN') {
            alert('로그인이 필요합니다.');
          } else if (status === 401 && errorCode === 'INVALID_REFRESH_TOKEN') {
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          }
          
          window.location.href = '/';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // API 에러 객체 생성
    const apiError: ApiError = {
      message: (error.response?.data as any)?.message || error.message || '알 수 없는 오류가 발생했습니다.',
      statusCode: error.response?.status || 500,
      details: error.response?.data,
    };

    // 401이 아닌 다른 에러는 그대로 전달
    return Promise.reject(apiError);
  }
);

export default apiClient;
