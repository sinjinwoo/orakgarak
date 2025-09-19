import { create } from 'zustand';
import type { AlbumCreateData, AlbumTrack } from '../types/album';
import type { Recording } from '../types/recording';

interface AlbumCreationState {
  // 앨범 메타데이터
  title: string;
  description: string;
  coverImage?: string;
  isPublic: boolean;
  tags: string[];
  
  // 선택된 녹음들
  selectedRecordings: string[];
  
  // 트랙 순서
  tracks: AlbumTrack[];
  
  // 생성 단계
  currentStep: 'recordings' | 'cover' | 'metadata' | 'preview' | 'completed';
  
  // 임시 저장된 데이터
  isDraft: boolean;
  lastSaved: string;
}

interface AlbumStore extends AlbumCreationState {
  // 앨범 메타데이터 관리
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setCoverImage: (imageUrl: string) => void;
  setIsPublic: (isPublic: boolean) => void;
  setTags: (tags: string[]) => void;

  // 녹음 선택 관리
  addRecording: (recordingId: string) => void;
  removeRecording: (recordingId: string) => void;
  setSelectedRecordings: (recordingIds: string[]) => void;

  // 트랙 관리
  setTracks: (tracks: AlbumTrack[]) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  updateTrackTitle: (trackId: string, title: string) => void;

  // 단계 관리
  setCurrentStep: (step: AlbumCreationState['currentStep']) => void;
  goToStep: (stepName: string) => void;
  nextStep: () => void;
  prevStep: () => void;

  // 초기화 및 저장
  resetAlbum: () => void;
  saveDraft: () => void;
  loadDraft: () => void;

  // 앨범 생성 데이터 가져오기
  getAlbumData: () => AlbumCreateData;

  // 새 앨범 생성
  createAlbum: (albumData: AlbumCreateData, recordings: Recording[]) => string;

  // 앨범 상세 정보 가져오기
  getAlbumById: (albumId: string) => AlbumCreateData | null;
}

const initialData: AlbumCreationState = {
  title: '',
  description: '',
  isPublic: false, // 기본값을 비공개로 변경
  tags: [],
  selectedRecordings: [],
  tracks: [],
  currentStep: 'recordings',
  isDraft: false,
  lastSaved: '',
};

export const useAlbumStore = create<AlbumStore>((set, get) => ({
  ...initialData,
  
  // 앨범 메타데이터 관리
  setTitle: (title) => set({ title }),
  
  setDescription: (description) => set({ description }),
  
  setCoverImage: (coverImage) => set({ coverImage }),
  
  setIsPublic: (isPublic) => set({ isPublic }),
  
  setTags: (tags) => set({ tags }),
  
  // 녹음 선택 관리
  addRecording: (recordingId) => {
    set((state) => ({
      selectedRecordings: [...state.selectedRecordings, recordingId]
    }));
  },
  
  removeRecording: (recordingId) => {
    set((state) => ({
      selectedRecordings: state.selectedRecordings.filter(id => id !== recordingId)
    }));
  },
  
  setSelectedRecordings: (selectedRecordings) => set({ selectedRecordings }),
  
  // 트랙 관리
  setTracks: (tracks) => set({ tracks }),
  
  reorderTracks: (fromIndex, toIndex) => {
    set((state) => {
      const newTracks = [...state.tracks];
      const [removed] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, removed);
      
      // 트랙 번호 재정렬
      const reorderedTracks = newTracks.map((track, index) => ({
        ...track,
        trackNumber: index + 1,
      }));
      
      return { tracks: reorderedTracks };
    });
  },
  
  updateTrackTitle: (trackId, title) => {
    set((state) => ({
      tracks: state.tracks.map(track =>
        track.id === trackId ? { ...track, title } : track
      )
    }));
  },
  
  // 단계 관리
  setCurrentStep: (currentStep) => set({ currentStep }),

  goToStep: (stepName: string) => {
    const stepMap: Record<string, AlbumCreationState['currentStep']> = {
      'recordings': 'recordings',
      'cover': 'cover',
      'metadata': 'metadata',
      'preview': 'preview',
    };
    const targetStep = stepMap[stepName];
    if (targetStep) {
      set({ currentStep: targetStep });
    }
  },
  
  nextStep: () => {
    const steps: AlbumCreationState['currentStep'][] = ['recordings', 'cover', 'metadata', 'preview', 'completed'];
    const currentIndex = steps.indexOf(get().currentStep);
    if (currentIndex < steps.length - 1) {
      set({ currentStep: steps[currentIndex + 1] });
    }
  },
  
  prevStep: () => {
    const steps: AlbumCreationState['currentStep'][] = ['recordings', 'cover', 'metadata', 'preview', 'completed'];
    const currentIndex = steps.indexOf(get().currentStep);
    if (currentIndex > 0) {
      set({ currentStep: steps[currentIndex - 1] });
    }
  },
  
  // 초기화 및 저장
  resetAlbum: () => set(initialData),

  saveDraft: () => {
    const data = get().getAlbumData();
    const draftData = {
      ...data,
      selectedRecordings: get().selectedRecordings,
      currentStep: get().currentStep,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem('album.create.draft.v1', JSON.stringify(draftData));
    set({
      isDraft: true,
      lastSaved: new Date().toISOString()
    });
  },
  
  loadDraft: () => {
    const draft = localStorage.getItem('album.create.draft.v1');
    if (draft) {
      try {
        const data = JSON.parse(draft);
        set({
          title: data.title || '',
          description: data.description || '',
          coverImage: data.coverImage,
          isPublic: data.isPublic ?? false,
          tags: data.tags || [],
          selectedRecordings: data.selectedRecordings || data.recordingIds || [],
          currentStep: data.currentStep || 'recordings',
          isDraft: true,
          lastSaved: data.lastSaved,
        });
      } catch (error) {
        console.error('Failed to load draft:', error);
        // Clear corrupted draft
        localStorage.removeItem('album.create.draft.v1');
      }
    }
  },
  
  // 앨범 생성 데이터 가져오기
  getAlbumData: () => {
    const state = get();
    return {
      title: state.title,
      description: state.description,
      coverImage: state.coverImage,
      recordingIds: state.selectedRecordings,
      isPublic: state.isPublic,
      tags: state.tags,
    };
  },
  
  // 새 앨범 생성
  createAlbum: (albumData: AlbumCreateData, recordings: Recording[]) => {
    // 선택된 녹음들로 트랙 데이터 생성
    const tracks = recordings
      .filter(recording => albumData.recordingIds.includes(recording.id))
      .map(recording => ({
        id: recording.id,
        title: recording.song.title,
        artist: recording.song.artist,
        score: recording.analysis?.overallScore || 0,
        duration: `${Math.floor(recording.duration / 60)}:${(recording.duration % 60).toString().padStart(2, '0')}`,
        audioUrl: recording.audioUrl,
      }));

    // 총 재생 시간 계산
    const totalSeconds = tracks.reduce((total, track) => {
      const [minutes, seconds] = track.duration.split(':').map(Number);
      return total + minutes * 60 + seconds;
    }, 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const duration = `${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;

    const newAlbum = {
      id: Date.now().toString(),
      title: albumData.title,
      description: albumData.description || '',
      coverImage: albumData.coverImage || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      isPublic: albumData.isPublic,
      trackCount: albumData.recordingIds.length,
      duration: duration,
      likeCount: 0,
      playCount: 0,
      tracks: tracks, // 실제 선택된 녹음 데이터 저장
      createdAt: new Date().toISOString(),
    };
    
    // localStorage에 저장
    const existingAlbums = JSON.parse(localStorage.getItem('myAlbums') || '[]');
    existingAlbums.unshift(newAlbum); // 최신 앨범이 맨 위에 오도록
    localStorage.setItem('myAlbums', JSON.stringify(existingAlbums));
    
    return newAlbum.id;
  },
  
  // 앨범 상세 정보 가져오기
  getAlbumById: (albumId: string) => {
    const savedAlbums = localStorage.getItem('myAlbums');
    if (savedAlbums) {
      const albums = JSON.parse(savedAlbums) as AlbumCreateData[];
      return albums.find((a) => a.recordingIds.includes(albumId)) || null;
    }
    return null;
  },
}));
