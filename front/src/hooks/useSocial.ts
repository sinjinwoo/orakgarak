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

  const likeAlbum = async (albumId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await socialService.albums.likeAlbum(albumId);
      return true;
    } catch (err: any) {
      setError(err.message || '좋아요에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unlikeAlbum = async (albumId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await socialService.albums.unlikeAlbum(albumId);
      return true;
    } catch (err: any) {
      setError(err.message || '좋아요 취소에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    likeAlbum,
    unlikeAlbum,
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
