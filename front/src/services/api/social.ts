import apiClient from './client';

// 타입 정의
export interface Comment {
  id: number;
  userId: number;
  albumId: number;
  parentCommentId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
  // 사용자 정보 추가
  userNickname?: string;
  userProfileImageUrl?: string;
}

export interface Album {
  id: number;
  userId: number;
  title: string;
  description: string;
  uploadId: number;
  isPublic: boolean;
  trackCount: number;
  totalDuration: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUser {
  userId: number;
  nickname: string;
  email: string;
  followedAt: string;
  followingBack: boolean;
}

export interface PaginatedResponse<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  content: T[];
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  last: boolean;
  numberOfElements: number;
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
  };
  empty: boolean;
}

export interface CommentRequest {
  content: string;
}

// Social API 서비스
export const socialService = {
  // 댓글 관련 API
  comments: {
    // 앨범 댓글 조회
    getAlbumComments: async (albumId: number): Promise<PaginatedResponse<Comment>> => {
      const response = await apiClient.get<PaginatedResponse<Comment>>(`/social/albums/${albumId}/comments`);
      return response.data;
    },

    // 앨범에 댓글 작성
    createAlbumComment: async (albumId: number, content: string): Promise<void> => {
      await apiClient.post(`/social/albums/${albumId}/comments`, { content });
    },

    // 댓글 수정
    updateComment: async (commentId: number, content: string): Promise<void> => {
      await apiClient.put(`/social/comments/${commentId}`, { content });
    },

    // 댓글 삭제
    deleteComment: async (commentId: number): Promise<void> => {
      await apiClient.delete(`/social/comments/${commentId}`);
    },

    // 대댓글 조회
    getReplies: async (commentId: number): Promise<Comment[]> => {
      const response = await apiClient.get<Comment[]>(`/social/comments/${commentId}/reply`);
      return response.data;
    },

    // 대댓글 작성
    createReply: async (commentId: number, content: string): Promise<void> => {
      await apiClient.post(`/social/comments/${commentId}/reply`, { content });
    },

    // 대댓글 수정
    updateReply: async (commentId: number, replyId: number, content: string): Promise<void> => {
      await apiClient.put(`/social/comments/${commentId}/reply/${replyId}`, { content });
    },

    // 대댓글 삭제
    deleteReply: async (commentId: number, replyId: number): Promise<void> => {
      await apiClient.delete(`/social/comments/${commentId}/reply/${replyId}`);
    },
  },

  // 팔로우 관련 API
  follow: {
    // 팔로우 토글 (새로운)
    toggleFollow: async (userId: number): Promise<{ success: boolean; isFollowing: boolean; message: string }> => {
      const response = await apiClient.post(`/social/follow/${userId}/toggle`);
      return response.data;
    },

    // 팔로우 여부 확인
    checkFollowStatus: async (userId: number): Promise<{ success: boolean; isFollowing: boolean }> => {
      const response = await apiClient.get(`/social/follow/${userId}/check`);
      return response.data;
    },

    // 팔로우 수 조회
    getFollowCount: async (userId: number): Promise<{ success: boolean; followerCount: number; followingCount: number }> => {
      const response = await apiClient.get(`/social/follow/${userId}/count`);
      return response.data;
    },

    // 사용자 팔로우 (기존)
    followUser: async (userId: number): Promise<void> => {
      await apiClient.post(`/social/follow/${userId}`);
    },

    // 사용자 언팔로우 (기존)
    unfollowUser: async (userId: number): Promise<void> => {
      await apiClient.delete(`/social/follow/${userId}`);
    },

    // 팔로워 목록 조회
    getFollowers: async (userId: number): Promise<PaginatedResponse<FollowUser>> => {
      const response = await apiClient.get<PaginatedResponse<FollowUser>>(`/social/followers/${userId}`);
      return response.data;
    },

    // 팔로잉 목록 조회
    getFollowing: async (userId: number): Promise<PaginatedResponse<FollowUser>> => {
      const response = await apiClient.get<PaginatedResponse<FollowUser>>(`/social/following/${userId}`);
      return response.data;
    },
  },

  // 앨범 관련 API
  albums: {
    // 공개 앨범 목록 조회
    getPublicAlbums: async (): Promise<Album[]> => {
      const response = await apiClient.get('/social/albums');
      // API 응답이 단일 객체일 수 있으므로 배열로 변환
      const data = response.data;
      return Array.isArray(data) ? data : (data ? [data] : []);
    },

    // 공개 앨범 상세 조회
    getAlbumDetail: async (albumId: number): Promise<PaginatedResponse<Album>> => {
      const response = await apiClient.get<PaginatedResponse<Album>>(`/social/albums/${albumId}`);
      return response.data;
    },

    // 팔로잉한 멤버의 공개 앨범 조회
    getFollowingAlbums: async (): Promise<Album[]> => {
      const response = await apiClient.get('/social/albums/follow');
      // API 응답이 다양한 형태일 수 있으므로 안전하게 처리
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // 단일 객체인 경우 배열로 변환
        return [data];
      } else {
        return [];
      }
    },

    // 좋아요 토글 (새로운)
    toggleLike: async (albumId: number): Promise<{ success: boolean; isLiked: boolean; message: string }> => {
      const response = await apiClient.post(`/social/albums/${albumId}/like/toggle`);
      return response.data;
    },

    // 좋아요 여부 확인
    checkLikeStatus: async (albumId: number): Promise<{ success: boolean; isLiked: boolean }> => {
      const response = await apiClient.get(`/social/albums/${albumId}/like/check`);
      return response.data;
    },

    // 좋아요 수 조회
    getLikeCount: async (albumId: number): Promise<{ success: boolean; count: number }> => {
      const response = await apiClient.get(`/social/albums/${albumId}/like/count`);
      return response.data;
    },

    // 앨범 좋아요 (기존)
    likeAlbum: async (albumId: number): Promise<void> => {
      await apiClient.post(`/social/albums/${albumId}/like`);
    },

    // 앨범 좋아요 취소 (기존)
    unlikeAlbum: async (albumId: number): Promise<void> => {
      await apiClient.delete(`/social/albums/${albumId}/like`);
    },

    // 앨범 좋아요 상태 확인 (기존 호환용)
    checkAlbumLikeStatus: async (albumId: number): Promise<{ isLiked: boolean; likeCount: number }> => {
      const [likeStatus, likeCount] = await Promise.all([
        apiClient.get(`/social/albums/${albumId}/like/check`),
        apiClient.get(`/social/albums/${albumId}/like/count`)
      ]);
      return {
        isLiked: likeStatus.data.isLiked,
        likeCount: likeCount.data.count
      };
    },
  },
};
