import apiClient from './client';
import type { User } from '../../types/user';

export interface FollowStats {
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export interface UserSearchParams {
  query: string;
  limit?: number;
  offset?: number;
}

// User API 서비스 (팔로우/소셜 기능)
export const userService = {
  // === 팔로우 관리 ===
  
  // 사용자 팔로우
  followUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/follow`);
  },

  // 사용자 언팔로우
  unfollowUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/follow`);
  },

  // 팔로워 목록 조회
  getFollowers: async (userId: string): Promise<User[]> => {
    const response = await apiClient.get<User[]>(`/users/${userId}/followers`);
    return response.data;
  },

  // 팔로잉 목록 조회
  getFollowing: async (userId: string): Promise<User[]> => {
    const response = await apiClient.get<User[]>(`/users/${userId}/following`);
    return response.data;
  },

  // 팔로우 통계 조회
  getFollowStats: async (userId: string): Promise<FollowStats> => {
    const response = await apiClient.get<FollowStats>(`/users/${userId}/follow-stats`);
    return response.data;
  },

  // 내가 팔로우하는 사용자인지 확인
  checkFollowStatus: async (userId: string): Promise<boolean> => {
    const response = await apiClient.get<{ isFollowing: boolean }>(`/users/${userId}/follow-status`);
    return response.data.isFollowing;
  },

  // === 사용자 검색 및 발견 ===
  
  // 사용자 검색
  searchUsers: async (params: UserSearchParams): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users/search', {
      params
    });
    return response.data;
  },

  // 추천 사용자 목록 (팔로우 추천)
  getRecommendedUsers: async (limit = 10): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users/recommendations', {
      params: { limit }
    });
    return response.data;
  },

  // 인기 사용자 목록
  getPopularUsers: async (limit = 20, period = 'week'): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users/popular', {
      params: { limit, period }
    });
    return response.data;
  },

  // === 사용자 정보 ===
  
  // 특정 사용자 정보 조회
  getUser: async (userId: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  },

  // 사용자 목록 조회 (관리자용)
  getUsers: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    role?: string;
    status?: 'active' | 'inactive' | 'banned';
  }): Promise<{
    content: User[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  // === 사용자 활동 ===
  
  // 사용자의 공개 앨범 목록
  getUserPublicAlbums: async (userId: string, page = 0, size = 10): Promise<any> => {
    const response = await apiClient.get(`/users/${userId}/albums`, {
      params: { page, size }
    });
    return response.data;
  },

  // 사용자의 최근 활동
  getUserRecentActivity: async (userId: string, limit = 20): Promise<any[]> => {
    const response = await apiClient.get(`/users/${userId}/recent-activity`, {
      params: { limit }
    });
    return response.data;
  },

  // === 차단 및 신고 ===
  
  // 사용자 차단
  blockUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/block`);
  },

  // 사용자 차단 해제
  unblockUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/block`);
  },

  // 차단된 사용자 목록
  getBlockedUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users/blocked');
    return response.data;
  },

  // 사용자 신고
  reportUser: async (userId: string, reason: string, description?: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/report`, {
      reason,
      description
    });
  },

  // === 알림 설정 ===
  
  // 사용자 알림 설정 조회
  getNotificationSettings: async (): Promise<any> => {
    const response = await apiClient.get('/users/me/notification-settings');
    return response.data;
  },

  // 사용자 알림 설정 업데이트
  updateNotificationSettings: async (settings: any): Promise<void> => {
    await apiClient.put('/users/me/notification-settings', settings);
  },
};
