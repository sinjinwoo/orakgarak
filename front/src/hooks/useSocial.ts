import { useState, useEffect } from 'react';
import { socialService, type Comment, type Album, type FollowUser, type PaginatedResponse } from '../services/api/social';

// 댓글 관련 훅
export function useComments(albumId: number) {
  const [comments, setComments] = useState<PaginatedResponse<Comment> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await socialService.comments.getAlbumComments(albumId);
      setComments(data);
    } catch (err: any) {
      setError(err.message || '댓글을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async (content: string): Promise<boolean> => {
    setError(null);
    try {
      await socialService.comments.createAlbumComment(albumId, content);
      await fetchComments(); // 댓글 목록 새로고침
      return true;
    } catch (err: any) {
      setError(err.message || '댓글 작성에 실패했습니다.');
      return false;
    }
  };

  const updateComment = async (commentId: number, content: string): Promise<boolean> => {
    setError(null);
    try {
      await socialService.comments.updateComment(commentId, content);
      await fetchComments(); // 댓글 목록 새로고침
      return true;
    } catch (err: any) {
      setError(err.message || '댓글 수정에 실패했습니다.');
      return false;
    }
  };

  const deleteComment = async (commentId: number): Promise<boolean> => {
    setError(null);
    try {
      await socialService.comments.deleteComment(commentId);
      await fetchComments(); // 댓글 목록 새로고침
      return true;
    } catch (err: any) {
      setError(err.message || '댓글 삭제에 실패했습니다.');
      return false;
    }
  };

  useEffect(() => {
    if (albumId) {
      fetchComments();
    }
  }, [albumId]);

  return {
    comments,
    isLoading,
    error,
    refetch: fetchComments,
    addComment,
    updateComment,
    deleteComment,
  };
}

// 대댓글 관련 훅
export function useReplies(commentId: number) {
  const [replies, setReplies] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReplies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await socialService.comments.getReplies(commentId);
      setReplies(data);
    } catch (err: any) {
      setError(err.message || '대댓글을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const addReply = async (content: string): Promise<boolean> => {
    setError(null);
    try {
      await socialService.comments.createReply(commentId, content);
      await fetchReplies(); // 대댓글 목록 새로고침
      return true;
    } catch (err: any) {
      setError(err.message || '대댓글 작성에 실패했습니다.');
      return false;
    }
  };

  const updateReply = async (replyId: number, content: string): Promise<boolean> => {
    setError(null);
    try {
      await socialService.comments.updateReply(commentId, replyId, content);
      await fetchReplies(); // 대댓글 목록 새로고침
      return true;
    } catch (err: any) {
      setError(err.message || '대댓글 수정에 실패했습니다.');
      return false;
    }
  };

  const deleteReply = async (replyId: number): Promise<boolean> => {
    setError(null);
    try {
      await socialService.comments.deleteReply(commentId, replyId);
      await fetchReplies(); // 대댓글 목록 새로고침
      return true;
    } catch (err: any) {
      setError(err.message || '대댓글 삭제에 실패했습니다.');
      return false;
    }
  };

  useEffect(() => {
    if (commentId) {
      fetchReplies();
    }
  }, [commentId]);

  return {
    replies,
    isLoading,
    error,
    refetch: fetchReplies,
    addReply,
    updateReply,
    deleteReply,
  };
}

// 팔로우 관련 훅
export function useFollow() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFollow = async (userId: number): Promise<{ success: boolean; isFollowing: boolean; message?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await socialService.follow.toggleFollow(userId);
      return { success: true, isFollowing: result.isFollowing, message: result.message };
    } catch (err: any) {
      setError(err.message || '팔로우 처리에 실패했습니다.');
      return { success: false, isFollowing: false };
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowStatus = async (userId: number): Promise<{ isFollowing: boolean } | null> => {
    setError(null);
    try {
      const result = await socialService.follow.checkFollowStatus(userId);
      return { isFollowing: result.isFollowing };
    } catch (err: any) {
      setError(err.message || '팔로우 상태 확인에 실패했습니다.');
      return null;
    }
  };

  const getFollowCount = async (userId: number): Promise<{ followerCount: number; followingCount: number } | null> => {
    setError(null);
    try {
      const result = await socialService.follow.getFollowCount(userId);
      return { followerCount: result.followerCount, followingCount: result.followingCount };
    } catch (err: any) {
      setError(err.message || '팔로우 수 조회에 실패했습니다.');
      return null;
    }
  };

  const followUser = async (userId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await socialService.follow.followUser(userId);
      return true;
    } catch (err: any) {
      setError(err.message || '팔로우에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unfollowUser = async (userId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await socialService.follow.unfollowUser(userId);
      return true;
    } catch (err: any) {
      setError(err.message || '언팔로우에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    toggleFollow,
    checkFollowStatus,
    getFollowCount,
    followUser,
    unfollowUser,
  };
}

// 팔로워/팔로잉 목록 훅
export function useFollowList(userId: number, type: 'followers' | 'following') {
  const [data, setData] = useState<PaginatedResponse<FollowUser> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = type === 'followers' 
        ? await socialService.follow.getFollowers(userId)
        : await socialService.follow.getFollowing(userId);
      setData(result);
    } catch (err: any) {
      setError(err.message || `${type === 'followers' ? '팔로워' : '팔로잉'} 목록을 불러오는데 실패했습니다.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, type]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// 공개 앨범 목록 훅
export function usePublicAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await socialService.albums.getPublicAlbums();
      setAlbums(data);
    } catch (err: any) {
      setError(err.message || '앨범 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  return {
    albums,
    isLoading,
    error,
    refetch: fetchAlbums,
  };
}

// 앨범 상세 정보 훅
export function useAlbumDetail(albumId: number) {
  const [album, setAlbum] = useState<PaginatedResponse<Album> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbum = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await socialService.albums.getAlbumDetail(albumId);
      setAlbum(data);
    } catch (err: any) {
      setError(err.message || '앨범 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (albumId) {
      fetchAlbum();
    }
  }, [albumId]);

  return {
    album,
    isLoading,
    error,
    refetch: fetchAlbum,
  };
}

// 앨범 좋아요 관련 훅
export function useAlbumLike() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = async (albumId: number): Promise<{ success: boolean; isLiked: boolean; message?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await socialService.albums.toggleLike(albumId);
      return { success: true, isLiked: result.isLiked, message: result.message };
    } catch (err: any) {
      setError(err.message || '좋아요 처리에 실패했습니다.');
      return { success: false, isLiked: false };
    } finally {
      setIsLoading(false);
    }
  };

  const checkLikeStatus = async (albumId: number): Promise<{ isLiked: boolean } | null> => {
    setError(null);
    try {
      const result = await socialService.albums.checkLikeStatus(albumId);
      return { isLiked: result.isLiked };
    } catch (err: any) {
      setError(err.message || '좋아요 상태 확인에 실패했습니다.');
      return null;
    }
  };

  const getLikeCount = async (albumId: number): Promise<{ count: number } | null> => {
    setError(null);
    try {
      const result = await socialService.albums.getLikeCount(albumId);
      return { count: result.count };
    } catch (err: any) {
      setError(err.message || '좋아요 수 조회에 실패했습니다.');
      return null;
    }
  };

  const likeAlbum = async (albumId: number): Promise<{ success: boolean; status?: { isLiked: boolean; likeCount: number } }> => {
    setIsLoading(true);
    setError(null);
    try {
      await socialService.albums.likeAlbum(albumId);
      // 좋아요 후 최신 상태 확인
      const status = await socialService.albums.checkAlbumLikeStatus(albumId);
      return { success: true, status };
    } catch (err: any) {
      setError(err.message || '좋아요에 실패했습니다.');

      // 에러 발생 시에도 현재 상태를 확인해서 반환
      try {
        const status = await socialService.albums.checkAlbumLikeStatus(albumId);
        return { success: false, status };
      } catch {
        return { success: false };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const unlikeAlbum = async (albumId: number): Promise<{ success: boolean; status?: { isLiked: boolean; likeCount: number } }> => {
    setIsLoading(true);
    setError(null);
    try {
      await socialService.albums.unlikeAlbum(albumId);
      // 좋아요 취소 후 최신 상태 확인
      const status = await socialService.albums.checkAlbumLikeStatus(albumId);
      return { success: true, status };
    } catch (err: any) {
      setError(err.message || '좋아요 취소에 실패했습니다.');

      // 에러 발생 시에도 현재 상태를 확인해서 반환
      try {
        const status = await socialService.albums.checkAlbumLikeStatus(albumId);
        return { success: false, status };
      } catch {
        return { success: false };
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 기존 호환성을 위한 메서드 (deprecated)
  const checkLikeStatusLegacy = async (albumId: number): Promise<{ isLiked: boolean; likeCount: number } | null> => {
    setError(null);
    try {
      const result = await socialService.albums.checkAlbumLikeStatus(albumId);
      return result;
    } catch (err: any) {
      setError(err.message || '좋아요 상태 확인에 실패했습니다.');
      return null;
    }
  };

  return {
    isLoading,
    error,
    toggleLike,
    checkLikeStatus,
    getLikeCount,
    likeAlbum,
    unlikeAlbum,
    checkLikeStatusLegacy, // 기존 호환성 (deprecated)
  };
}

// 팔로잉 사용자의 앨범 목록 훅
export function useFollowingAlbums() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowingAlbums = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await socialService.albums.getFollowingAlbums();
      setAlbums(data || []);
    } catch (err: any) {
      setError(err.message || '팔로잉 앨범을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowingAlbums();
  }, []);

  return {
    albums,
    isLoading,
    error,
    refetch: fetchFollowingAlbums,
  };
}
