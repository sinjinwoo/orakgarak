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
    // 사용자 팔로우
    followUser: async (userId: number): Promise<void> => {
      await apiClient.post(`/social/follow/${userId}`);
    },

    // 사용자 언팔로우
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
      const response = await apiClient.get<Album[]>('/social/albums');
      return response.data;
    },

    // 공개 앨범 상세 조회
    getAlbumDetail: async (albumId: number): Promise<PaginatedResponse<Album>> => {
      const response = await apiClient.get<PaginatedResponse<Album>>(`/social/albums/${albumId}`);
      return response.data;
    },

    // 팔로잉한 멤버의 공개 앨범 조회
    getFollowingAlbums: async (): Promise<any> => {
      const response = await apiClient.get('/social/albums/follow');
      return response.data;
    },

    // 앨범 좋아요
    likeAlbum: async (albumId: number): Promise<void> => {
      await apiClient.post(`/social/albums/${albumId}/like`);
    },

    // 앨범 좋아요 취소
    unlikeAlbum: async (albumId: number): Promise<void> => {
      await apiClient.delete(`/social/albums/${albumId}/like`);
    },
  },
};
