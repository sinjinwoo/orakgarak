import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService, profileService } from '../services/api';
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
  fetchUserWithProfile: () => Promise<User | null>;
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
      const response = await authService.login(credentials);
      const { user: userData } = response;
      
      // 토큰은 이미 authService에서 저장됨
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
      const response = await authService.register(data);
      const { user: userData } = response;
      
      // 토큰은 이미 authService에서 저장됨
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
      await authService.logout();
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

  // 프로필 업데이트 (로컬 상태만 업데이트)
  // ⚠️ 실제 프로필 업데이트는 useProfile 훅을 사용하세요
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 로컬 스토어만 업데이트 (서버 동기화 없음)
      if (user) {
        const updatedUser = { ...user, ...data };
        updateUser(updatedUser);
      }
      
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
      const response = await authService.refreshToken();
      const { accessToken } = response;
      
      // 토큰은 이미 authService에서 저장됨
      
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

  // 사용자 정보와 프로필 정보를 함께 가져오는 함수
  const fetchUserWithProfile = async (): Promise<User | null> => {
    try {
      const userData = await authService.getCurrentUser();
      
      // 프로필 정보도 함께 가져오기
      try {
        const profileData = await profileService.getMyProfile();
        
        // 프로필 정보를 사용자 정보에 병합
        const enrichedUser: User = {
          ...userData,
          nickname: profileData.nickname || userData.nickname,
          profileImageUrl: profileData.profileImageUrl || userData.profileImageUrl,
          backgroundImageUrl: profileData.backgroundImageUrl || userData.backgroundImageUrl,
          description: profileData.description || userData.description,
        };
        
        return enrichedUser;
      } catch (profileError) {
        console.warn('프로필 정보 가져오기 실패, 기본 사용자 정보만 사용:', profileError);
        return userData;
      }
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      return null;
    }
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
    fetchUserWithProfile,
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
  const { login: loginStore } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 구글 OAuth2 리다이렉트 시작
      const { GoogleAuthService } = await import('../services/googleAuth');
      GoogleAuthService.initiateGoogleLogin();
      
      // 리다이렉트가 시작되므로 이 함수는 여기서 끝남
      return true;
    } catch (err: any) {
      setError(err.message || 'Google 로그인에 실패했습니다.');
      setIsLoading(false);
      return false;
    }
  };

  const loginWithKakao = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 카카오 로그인 로직 (구현 예정)
      const response = await authService.loginWithKakao('kakao-token');
      const { user: userData, accessToken } = response;
      
      // 토큰은 이미 authService에서 저장됨
      loginStore(userData);
      
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
      // await authAPI.sendPasswordResetEmail(email);
      console.log('Password reset email sent to:', email);
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
      // await authAPI.resetPassword(token, newPassword);
      console.log('Password reset with token:', token);
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
