import { useState, useCallback } from 'react';
import { profileService } from '../services/api';
import type { Profile, ProfileUpdateRequest, ProfileImageUpdateRequest } from '../types/user';

export interface UseProfileReturn {
  // 상태
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  
  // 액션
  getMyProfile: () => Promise<Profile | null>;
  getUserProfile: (userId: number) => Promise<Profile | null>;
  updateMyProfile: (data: ProfileUpdateRequest) => Promise<Profile | null>;
  updateMyProfileWithImage: (data: ProfileImageUpdateRequest) => Promise<Profile | null>;
  checkNicknameDuplicate: (nickname: string) => Promise<boolean | null>;
  
  // 유틸리티
  clearError: () => void;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 내 프로필 조회
  const getMyProfile = useCallback(async (): Promise<Profile | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profileData = await profileService.getMyProfile();
      setProfile(profileData);
      return profileData;
    } catch (err: unknown) {
      const errorMessage = (err as any)?.response?.data?.message || '프로필을 불러오는데 실패했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 특정 유저 프로필 조회
  const getUserProfile = useCallback(async (userId: number): Promise<Profile | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profileData = await profileService.getUserProfile(userId);
      setProfile(profileData);
      return profileData;
    } catch (err: unknown) {
      const errorMessage = (err as any)?.response?.data?.message || '프로필을 불러오는데 실패했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 내 프로필 수정 (사진 제외)
  const updateMyProfile = useCallback(async (data: ProfileUpdateRequest): Promise<Profile | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProfile = await profileService.updateMyProfile(data);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '프로필 수정에 실패했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 사진 포함 프로필 수정
  const updateMyProfileWithImage = useCallback(async (data: ProfileImageUpdateRequest): Promise<Profile | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProfile = await profileService.updateMyProfileWithImage(data);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '프로필 수정에 실패했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 닉네임 중복 체크
  const checkNicknameDuplicate = useCallback(async (nickname: string): Promise<boolean | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isAvailable = await profileService.checkNicknameDuplicate(nickname);
      return isAvailable;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '닉네임 중복 체크에 실패했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    profile,
    isLoading,
    error,
    getMyProfile,
    getUserProfile,
    updateMyProfile,
    updateMyProfileWithImage,
    checkNicknameDuplicate,
    clearError,
  };
}

// 내 프로필만 관리하는 간단한 훅
export function useMyProfile() {
  const {
    profile,
    isLoading,
    error,
    getMyProfile,
    updateMyProfile,
    updateMyProfileWithImage,
    checkNicknameDuplicate,
    clearError,
  } = useProfile();

  return {
    myProfile: profile,
    isLoading,
    error,
    getMyProfile,
    updateMyProfile,
    updateMyProfileWithImage,
    checkNicknameDuplicate,
    clearError,
  };
}
