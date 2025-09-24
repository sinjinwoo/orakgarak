// FeedPage 관련 유틸리티 함수들

import type { Album } from '../types/album';

// FeedAlbum 타입 정의
export interface FeedAlbum extends Album {
  user?: {
    nickname: string;
    avatar?: string;
  };
  tags?: string[];
  playCount?: number;
  commentCount?: number;
}

// 로컬스토리지 관련 함수들
export const saveFollowingUsers = (followingUsers: string[]) => {
  localStorage.setItem('followingUsers', JSON.stringify(followingUsers));
};

export const getFollowingUsers = (): string[] => {
  const saved = localStorage.getItem('followingUsers');
  return saved ? JSON.parse(saved) : [];
};

export const saveMyAlbums = (albums: FeedAlbum[]) => {
  localStorage.setItem('myAlbums', JSON.stringify(albums));
};

export const getMyAlbums = (): FeedAlbum[] => {
  const saved = localStorage.getItem('myAlbums');
  return saved ? JSON.parse(saved) : [];
};

export const saveFeedAlbums = (albums: FeedAlbum[]) => {
  localStorage.setItem('feedAlbums', JSON.stringify(albums));
};

export const getFeedAlbums = (): FeedAlbum[] => {
  const savedFeedAlbums = localStorage.getItem('feedAlbums');
  if (savedFeedAlbums) {
    const feedAlbums = JSON.parse(savedFeedAlbums);
    
    // 존재하는 앨범만 필터링
    const validFeedAlbums = feedAlbums.filter((album: FeedAlbum) => 
      album && album.id && album.title
    );
    
    if (validFeedAlbums.length !== feedAlbums.length) {
      localStorage.setItem('feedAlbums', JSON.stringify(validFeedAlbums));
    }
    
    return validFeedAlbums;
  }
  return [];
};

// 더미 데이터 제거 함수들
export const clearDummyAlbums = () => {
  localStorage.removeItem('myAlbums');
  localStorage.removeItem('feedAlbums');
  localStorage.removeItem('followingUsers');
  console.log('더미 앨범 데이터가 제거되었습니다.');
};

export const clearAllDummyData = () => {
  // 모든 더미 데이터 제거
  localStorage.removeItem('myAlbums');
  localStorage.removeItem('feedAlbums');
  localStorage.removeItem('followingUsers');
  localStorage.removeItem('album.cover.params.v1');
  localStorage.removeItem('album.cover.history.v1');
  localStorage.removeItem('album.meta.v2');
  console.log('모든 더미 데이터가 제거되었습니다.');
};

// 개발자 도구에서 사용할 수 있는 전역 함수
if (typeof window !== 'undefined') {
  (window as any).clearDummyData = clearAllDummyData;
  (window as any).clearDummyAlbums = clearDummyAlbums;
}

// 팔로잉 데이터 초기화 함수
export const initializeFollowing = () => {
  const existingFollowing = getFollowingUsers();
  return existingFollowing;
};

// 날짜 포맷팅 함수
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '1일 전';
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
};

// 앨범 데이터 검증 함수
export const validateAlbumData = (album: any): album is FeedAlbum => {
  return (
    album &&
    typeof album.id === 'number' &&
    typeof album.title === 'string' &&
    album.user &&
    typeof album.user.nickname === 'string'
  );
};

// 에러 메시지 생성 함수
export const getErrorMessage = (error: any): string => {
  if (error?.response?.status === 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  if (error?.response?.status === 404) {
    return '요청한 데이터를 찾을 수 없습니다.';
  }
  if (error?.code === 'NETWORK_ERROR') {
    return '네트워크 연결을 확인해주세요.';
  }
  return '알 수 없는 오류가 발생했습니다.';
};
