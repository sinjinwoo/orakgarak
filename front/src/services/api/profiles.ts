import apiClient from './client';
import type {
    Profile,
    ProfileUpdateRequest,
    ProfileImageUpdateRequest
} from '../../types/user';

export interface ProfileStats {
    albumCount: number;
    recordingCount: number;
    followerCount: number;
    followingCount: number;
    totalPlays: number;
    totalLikes: number;
}

export interface MyPageAlbumsResponse {
    content: any[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

// Profile API 서비스
export const profileService = {
    // === 내 프로필 관리 ===

    // 내 프로필 조회
    getMyProfile: async (): Promise<Profile> => {
        const response = await apiClient.get<Profile>('/profiles/me');
        return response.data;
    },

    // 내 프로필 수정 (사진 제외)
    updateMyProfile: async (data: ProfileUpdateRequest): Promise<Profile> => {
        const response = await apiClient.put<Profile>('/profiles/me', data);
        return response.data;
    },

    // 프로필 사진 포함 수정
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

        const response = await apiClient.post<Profile>('/profiles/me/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // 프로필 사진만 업데이트
    updateProfileImage: async (imageFile: File): Promise<Profile> => {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await apiClient.post<Profile>('/profiles/me/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // 프로필 사진 삭제
    deleteProfileImage: async (): Promise<Profile> => {
        const response = await apiClient.delete<Profile>('/profiles/me/image');
        return response.data;
    },

    // 배경화면 업로드
    updateBackgroundImage: async (imageFile: File): Promise<Profile> => {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await apiClient.post<Profile>('/profiles/me/background-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // === 다른 사용자 프로필 ===

    // 특정 사용자 프로필 조회
    getUserProfile: async (userId: number): Promise<Profile> => {
        const response = await apiClient.get<Profile>(`/profiles/${userId}`);
        return response.data;
    },

    // 사용자 프로필 통계
    getUserProfileStats: async (userId: number): Promise<ProfileStats> => {
        const response = await apiClient.get<ProfileStats>(`/profiles/${userId}/stats`);
        return response.data;
    },

    // === 닉네임 관리 ===

    // 닉네임 중복 체크
    checkNicknameDuplicate: async (nickname: string): Promise<boolean> => {
        const response = await apiClient.get<boolean>('/profiles/nickname/check', {
            params: { nickname }
        });
        return response.data; // true: 사용 가능, false: 중복됨
    },

    // 닉네임 추천 (사용 가능한 유사 닉네임들)
    suggestNicknames: async (baseNickname: string, count = 5): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/profiles/nickname/suggest', {
            params: { baseNickname, count }
        });
        return response.data;
    },

    // === 마이페이지 데이터 ===

    // 마이페이지 통계 조회
    getMyPageStats: async (): Promise<ProfileStats> => {
        const response = await apiClient.get<ProfileStats>('/profiles/mypage/stats');
        return response.data;
    },

    // 마이페이지 내 앨범 목록
    getMyPageAlbums: async (page = 0, size = 10): Promise<MyPageAlbumsResponse> => {
        const response = await apiClient.get<MyPageAlbumsResponse>('/profiles/mypage/albums', {
            params: { page, size }
        });
        return response.data;
    },

    // 마이페이지 좋아요한 앨범 목록
    getMyPageLikedAlbums: async (page = 0, size = 10): Promise<MyPageAlbumsResponse> => {
        const response = await apiClient.get<MyPageAlbumsResponse>('/profiles/mypage/liked-albums', {
            params: { page, size }
        });
        return response.data;
    },

    // 마이페이지 내 녹음본 목록
    getMyPageRecordings: async (page = 0, size = 10): Promise<any> => {
        const response = await apiClient.get('/profiles/mypage/recordings', {
            params: { page, size }
        });
        return response.data;
    },

    // 마이페이지 최근 활동
    getMyPageRecentActivity: async (limit = 20): Promise<any[]> => {
        const response = await apiClient.get('/profiles/mypage/recent-activity', {
            params: { limit }
        });
        return response.data;
    },

    // === 프로필 설정 ===

    // 프로필 공개/비공개 설정
    updatePrivacySettings: async (settings: {
        isProfilePublic?: boolean;
        showEmail?: boolean;
        showFollowers?: boolean;
        showFollowing?: boolean;
        showAlbums?: boolean;
    }): Promise<Profile> => {
        const response = await apiClient.put<Profile>('/profiles/me/privacy', settings);
        return response.data;
    },

    // 프로필 테마 설정
    updateThemeSettings: async (theme: {
        primaryColor?: string;
        backgroundColor?: string;
        fontStyle?: string;
    }): Promise<Profile> => {
        const response = await apiClient.put<Profile>('/profiles/me/theme', theme);
        return response.data;
    },

    // === 프로필 검색 ===

    // 프로필 검색 (닉네임, 설명 등으로)
    searchProfiles: async (query: string, limit = 20): Promise<Profile[]> => {
        const response = await apiClient.get<Profile[]>('/profiles/search', {
            params: { query, limit }
        });
        return response.data;
    },

    // 인기 프로필 목록
    getPopularProfiles: async (limit = 20, period = 'week'): Promise<Profile[]> => {
        const response = await apiClient.get<Profile[]>('/profiles/popular', {
            params: { limit, period }
        });
        return response.data;
    },

    // === 프로필 백업/복원 ===

    // 프로필 데이터 백업
    backupProfile: async (): Promise<Blob> => {
        const response = await apiClient.get('/profiles/me/backup', {
            responseType: 'blob'
        });
        return response.data;
    },

    // 프로필 데이터 가져오기 (JSON)
    exportProfileData: async (): Promise<any> => {
        const response = await apiClient.get('/profiles/me/export');
        return response.data;
    },
};
