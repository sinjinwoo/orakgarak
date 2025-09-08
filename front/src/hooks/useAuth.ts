import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../services/backend';
import type { User } from '../types/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nickname: string;
}

export interface UseAuthReturn {
  // 상태
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 액션
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  
  // 유틸리티
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated, login: loginStore, logout: logoutStore, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로그인
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(credentials.email, credentials.password);
      const { user: userData, token } = response.data;
      
      // 토큰 저장
      localStorage.setItem('auth-token', token);
      
      // 스토어 업데이트
      loginStore(userData);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '로그인에 실패했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입
  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(data.email, data.password, data.nickname);
      const { user: userData, token } = response.data;
      
      // 토큰 저장
      localStorage.setItem('auth-token', token);
      
      // 스토어 업데이트
      loginStore(userData);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '회원가입에 실패했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('로그아웃 API 호출 실패:', err);
    } finally {
      // 토큰 제거
      localStorage.removeItem('auth-token');
      
      // 스토어 초기화
      logoutStore();
      
      setIsLoading(false);
    }
  };

  // 프로필 업데이트
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data;
      
      // 스토어 업데이트
      updateUser(updatedUser);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '프로필 업데이트에 실패했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 토큰 갱신
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await authAPI.refreshToken();
      const { token } = response.data;
      
      // 새 토큰 저장
      localStorage.setItem('auth-token', token);
      
      return true;
    } catch (err) {
      console.error('토큰 갱신 실패:', err);
      
      // 토큰 갱신 실패 시 로그아웃
      await logout();
      
      return false;
    }
  };

  // 에러 클리어
  const clearError = () => {
    setError(null);
  };

  // 앱 시작 시 토큰 검증
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token && !isAuthenticated) {
      // 토큰이 있지만 사용자 정보가 없는 경우 토큰 검증
      refreshToken();
    }
  }, [isAuthenticated]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    clearError,
  };
}

// 인증이 필요한 페이지를 위한 훅
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);
  
  return { isAuthenticated, isLoading };
}

// 소셜 로그인을 위한 훅
export function useSocialAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: loginStore } = useAuthStore();

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Google OAuth 로그인 로직
      // 실제 구현에서는 Google OAuth 라이브러리를 사용
      const response = await authAPI.login('google', 'social');
      const { user, token } = response.data;
      
      localStorage.setItem('auth-token', token);
      loginStore(user);
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google 로그인에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithKakao = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Kakao OAuth 로그인 로직
      const response = await authAPI.login('kakao', 'social');
      const { user, token } = response.data;
      
      localStorage.setItem('auth-token', token);
      loginStore(user);
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kakao 로그인에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    loginWithGoogle,
    loginWithKakao,
  };
}

// 비밀번호 재설정을 위한 훅
export function usePasswordReset() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const sendResetEmail = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authAPI.sendPasswordResetEmail(email);
      setIsEmailSent(true);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || '이메일 전송에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authAPI.resetPassword(token, newPassword);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || '비밀번호 재설정에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    isEmailSent,
    sendResetEmail,
    resetPassword,
  };
}
