// 더미 데이터를 위한 타입들
import type { User } from '../types/user';
import type { Album } from '../types/album';
import type { Recording } from '../types/recording';
import type { Song } from '../types/song';

// 더미 데이터
const dummyUser: User = {
  id: '1',
  email: 'user@example.com',
  nickname: '테스트유저',
  profileImage: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const dummySongs: Song[] = [
  {
    id: 1,
    title: '좋은 날',
    artist: '아이유',
    duration: '4:00',
    genre: 'K-POP',
  },
  {
    id: 2,
    title: '너를 사랑해',
    artist: '김범수',
    duration: '4:40',
    genre: 'Ballad',
  },
];

// Auth API (더미 데이터)
export const authAPI = {
  login: async (email: string, password: string) => {
    // 더미 로그인 로직
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
    return {
      data: {
        user: dummyUser,
        token: 'dummy-token-123'
      }
    };
  },
  
  register: async (email: string, password: string, nickname: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        user: { ...dummyUser, email, nickname },
        token: 'dummy-token-123'
      }
    };
  },
  
  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { message: '로그아웃 성공' } };
  },
  
  refreshToken: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { token: 'new-dummy-token-456' } };
  },

  // 구글 소셜 로그인
  loginWithGoogle: async (googleToken: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        user: { ...dummyUser, email: 'google-user@example.com', nickname: '구글유저' },
        token: 'google-dummy-token-123'
      }
    };
  },

  // 카카오 소셜 로그인
  loginWithKakao: async (kakaoToken: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        user: { ...dummyUser, email: 'kakao-user@example.com', nickname: '카카오유저' },
        token: 'kakao-dummy-token-123'
      }
    };
  },
};

// User API (더미 데이터)
export const userAPI = {
  getProfile: async (userId?: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: dummyUser };
  },
  
  updateProfile: async (data: Partial<User>) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: { ...dummyUser, ...data } };
  },
  
  uploadProfileImage: async (file: File) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { data: { imageUrl: 'https://via.placeholder.com/150' } };
  },
};

// Song API (더미 데이터)
export const songAPI = {
  search: async (query: string, limit = 20) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const filteredSongs = dummySongs.filter(song => 
      song.title.includes(query) || song.artist.includes(query)
    );
    return { data: filteredSongs.slice(0, limit) };
  },
  
  getRecommendations: async (filters?: any) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return { data: dummySongs };
  },
  
  getSong: async (songId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const song = dummySongs.find(s => s.id === songId);
    return { data: song || dummySongs[0] };
  },
};

// Recording API (더미 데이터)
export const recordingAPI = {
  getMyRecordings: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: [] };
  },
  
  uploadRecording: async (file: File, songId: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { data: { id: 'recording-1', songId, audioUrl: 'dummy-audio-url' } };
  },
  
  deleteRecording: async (recordingId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: { message: '녹음 삭제 완료' } };
  },
  
  getRecording: async (recordingId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: { id: recordingId, audioUrl: 'dummy-audio-url' } };
  },
};

// Album API (더미 데이터)
export const albumAPI = {
  getAlbums: async (filters?: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: [] };
  },
  
  getAlbum: async (albumId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: { id: albumId, title: '더미 앨범' } };
  },
  
  createAlbum: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { data: { id: 'album-1', ...data } };
  },
  
  updateAlbum: async (albumId: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: { id: albumId, ...data } };
  },
  
  deleteAlbum: async (albumId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: { message: '앨범 삭제 완료' } };
  },
  
  likeAlbum: async (albumId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { message: '좋아요 추가' } };
  },
  
  unlikeAlbum: async (albumId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { message: '좋아요 취소' } };
  },
};
