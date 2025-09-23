import { useState, useEffect } from 'react';
import { profileService } from '../services/api/profiles';
import type { Profile, ProfileUpdateRequest, ProfileImageUpdateRequest } from '../types/user';
import { useAuthStore } from '../stores/authStore';

export function useProfile() {
    const { user, updateUser } = useAuthStore();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 내 프로필 조회
    const fetchMyProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await profileService.getMyProfile();
            setProfile(data);
            // authStore도 업데이트
            updateUser(data);
            return data;
        } catch (err: any) {
            setError(err.message || '프로필을 불러오는데 실패했습니다.');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // 프로필 업데이트 (사진 제외)
    const updateProfile = async (data: ProfileUpdateRequest): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const updatedProfile = await profileService.updateMyProfile(data);
            setProfile(updatedProfile);
            // authStore 업데이트 (헤더 동기화)
            updateUser({
                ...user,
                nickname: updatedProfile.nickname,
                description: updatedProfile.description,
                profileImageUrl: updatedProfile.profileImageUrl,
                backgroundImageUrl: updatedProfile.backgroundImageUrl
            });
            return true;
        } catch (err: any) {
            setError(err.message || '프로필 수정에 실패했습니다.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 프로필 사진 업데이트
    const updateProfileImage = async (imageFile: File): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const updatedProfile = await profileService.updateProfileImage(imageFile);
            setProfile(updatedProfile);
            // authStore 업데이트 (헤더 동기화를 위해)
            updateUser({
                ...user,
                profileImageUrl: updatedProfile.profileImageUrl,
                nickname: updatedProfile.nickname,
                description: updatedProfile.description
            });
            return true;
        } catch (err: any) {
            setError(err.message || '프로필 사진 업데이트에 실패했습니다.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 배경화면 업데이트
    const updateBackgroundImage = async (imageFile: File): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const updatedProfile = await profileService.updateBackgroundImage(imageFile);
            setProfile(updatedProfile);
            // authStore 업데이트
            updateUser({
                ...user,
                backgroundImageUrl: updatedProfile.backgroundImageUrl,
                profileImageUrl: updatedProfile.profileImageUrl,
                nickname: updatedProfile.nickname,
                description: updatedProfile.description
            });
            return true;
        } catch (err: any) {
            setError(err.message || '배경화면 업데이트에 실패했습니다.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 프로필 사진 삭제
    const deleteProfileImage = async (): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const updatedProfile = await profileService.deleteProfileImage();
            setProfile(updatedProfile);
            // authStore 업데이트 (헤더 동기화)
            updateUser({
                ...user,
                profileImageUrl: '',
                nickname: updatedProfile.nickname,
                description: updatedProfile.description
            });
            return true;
        } catch (err: any) {
            setError(err.message || '프로필 사진 삭제에 실패했습니다.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 프로필 사진과 함께 정보 업데이트
    const updateProfileWithImage = async (data: ProfileImageUpdateRequest): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const updatedProfile = await profileService.updateMyProfileWithImage(data);
            setProfile(updatedProfile);
            updateUser(updatedProfile);
            return true;
        } catch (err: any) {
            setError(err.message || '프로필 업데이트에 실패했습니다.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 컴포넌트 마운트 시 프로필 로드
    useEffect(() => {
        if (user && !profile) {
            fetchMyProfile();
        }
    }, [user]);

    return {
        profile: profile || user,
        isLoading,
        error,
        fetchMyProfile,
        updateProfile,
        updateProfileImage,
        updateBackgroundImage,
        deleteProfileImage,
        updateProfileWithImage,
    };
}

// 다른 사용자 프로필 조회 훅
export function useUserProfile(userId: number) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserProfile = async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await profileService.getUserProfile(userId);
            setProfile(data);
        } catch (err: any) {
            setError(err.message || '사용자 프로필을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, [userId]);

    return {
        profile,
        isLoading,
        error,
        refetch: fetchUserProfile,
    };
}

// 닉네임 중복 체크 훅
export function useNicknameCheck() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkNickname = async (nickname: string): Promise<boolean | null> => {
        if (!nickname.trim()) return null;

        setIsLoading(true);
        setError(null);
        try {
            const isAvailable = await profileService.checkNicknameDuplicate(nickname);
            return isAvailable;
        } catch (err: any) {
            setError(err.message || '닉네임 중복 체크에 실패했습니다.');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const suggestNicknames = async (baseNickname: string): Promise<string[]> => {
        setIsLoading(true);
        setError(null);
        try {
            const suggestions = await profileService.suggestNicknames(baseNickname);
            return suggestions;
        } catch (err: any) {
            setError(err.message || '닉네임 추천에 실패했습니다.');
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        checkNickname,
        suggestNicknames,
    };
}