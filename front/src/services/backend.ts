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
    const song = dummySongs.find(s => s.id === parseInt(songId));
    return { data: song || dummySongs[0] };
  },
};

// Recording API (더미 데이터)
export const recordingAPI = {
  getMyRecordings: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // localStorage에서 실제 녹음본 데이터 가져오기
    const savedRecordings = localStorage.getItem('myRecordings');
    if (savedRecordings) {
      return { data: JSON.parse(savedRecordings) };
    }
    
    // 기본 더미 데이터
    const defaultRecordings = [
      {
        id: 'rec_1',
        userId: 'user_1',
        songId: 'song_1',
        song: { title: 'Perfect', artist: 'Ed Sheeran' },
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 180,
        createdAt: '2024-01-15T10:30:00Z',
        analysis: {
          pitchAccuracy: 85,
          tempoAccuracy: 90,
          vocalRange: { min: 80, max: 400 },
          toneAnalysis: { brightness: 70, warmth: 80, clarity: 75 },
          overallScore: 82,
          feedback: ['음정이 정확합니다', '감정 표현이 좋습니다']
        }
      },
      {
        id: 'rec_2',
        userId: 'user_1',
        songId: 'song_2',
        song: { title: 'All of Me', artist: 'John Legend' },
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 240,
        createdAt: '2024-01-10T14:20:00Z',
        analysis: {
          pitchAccuracy: 88,
          tempoAccuracy: 85,
          vocalRange: { min: 90, max: 380 },
          toneAnalysis: { brightness: 75, warmth: 85, clarity: 80 },
          overallScore: 85,
          feedback: ['음색이 아름답습니다', '리듬감이 좋습니다']
        }
      },
      {
        id: 'rec_3',
        userId: 'user_1',
        songId: 'song_3',
        song: { title: 'Someone You Loved', artist: 'Lewis Capaldi' },
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 200,
        createdAt: '2024-01-05T16:45:00Z',
        analysis: {
          pitchAccuracy: 82,
          tempoAccuracy: 88,
          vocalRange: { min: 85, max: 350 },
          toneAnalysis: { brightness: 65, warmth: 90, clarity: 70 },
          overallScore: 80,
          feedback: ['감정이 잘 전달됩니다', '고음 처리가 좋습니다']
        }
      }
    ];
    
    // localStorage에 저장
    localStorage.setItem('myRecordings', JSON.stringify(defaultRecordings));
    return { data: defaultRecordings };
  },
  
  uploadRecording: async (file: File, songId: string, song: { title: string; artist: string }) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newRecording = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user_1',
      songId,
      song,
      audioUrl: URL.createObjectURL(file),
      duration: Math.floor(Math.random() * 300) + 120, // 2-7분 랜덤
      createdAt: new Date().toISOString(),
      analysis: {
        pitchAccuracy: Math.floor(Math.random() * 20) + 70, // 70-90
        tempoAccuracy: Math.floor(Math.random() * 20) + 70, // 70-90
        vocalRange: { 
          min: Math.floor(Math.random() * 50) + 80, // 80-130
          max: Math.floor(Math.random() * 100) + 300 // 300-400
        },
        toneAnalysis: { 
          brightness: Math.floor(Math.random() * 40) + 60, // 60-100
          warmth: Math.floor(Math.random() * 40) + 60, // 60-100
          clarity: Math.floor(Math.random() * 40) + 60 // 60-100
        },
        overallScore: Math.floor(Math.random() * 20) + 70, // 70-90
        feedback: ['새로운 녹음입니다', '음성 품질이 좋습니다']
      }
    };
    
    // 기존 녹음본 목록에 추가
    const existingRecordings = localStorage.getItem('myRecordings');
    const recordings = existingRecordings ? JSON.parse(existingRecordings) : [];
    const updatedRecordings = [newRecording, ...recordings];
    localStorage.setItem('myRecordings', JSON.stringify(updatedRecordings));
    
    return { data: newRecording };
  },
  
  deleteRecording: async (recordingId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // localStorage에서 녹음본 삭제
    const existingRecordings = localStorage.getItem('myRecordings');
    if (existingRecordings) {
      const recordings = JSON.parse(existingRecordings);
      const updatedRecordings = recordings.filter((rec: any) => rec.id !== recordingId);
      localStorage.setItem('myRecordings', JSON.stringify(updatedRecordings));
    }
    
    return { data: { message: '녹음 삭제 완료' } };
  },
  
  getRecording: async (recordingId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const existingRecordings = localStorage.getItem('myRecordings');
    if (existingRecordings) {
      const recordings = JSON.parse(existingRecordings);
      const recording = recordings.find((rec: any) => rec.id === recordingId);
      if (recording) {
        return { data: recording };
      }
    }
    
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
