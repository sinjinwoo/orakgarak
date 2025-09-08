import { create } from 'zustand';
import { AlbumCreateData, AlbumTrack } from '../types/album';

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
  nextStep: () => void;
  prevStep: () => void;
  
  // 초기화 및 저장
  resetAlbum: () => void;
  saveDraft: () => void;
  loadDraft: () => void;
  
  // 앨범 생성 데이터 가져오기
  getAlbumData: () => AlbumCreateData;
}

const initialData: AlbumCreationState = {
  title: '',
  description: '',
  isPublic: true,
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
    localStorage.setItem('album-draft', JSON.stringify(data));
    set({ 
      isDraft: true, 
      lastSaved: new Date().toISOString() 
    });
  },
  
  loadDraft: () => {
    const draft = localStorage.getItem('album-draft');
    if (draft) {
      const data = JSON.parse(draft);
      set({
        title: data.title || '',
        description: data.description || '',
        coverImage: data.coverImage,
        isPublic: data.isPublic ?? true,
        tags: data.tags || [],
        selectedRecordings: data.recordingIds || [],
        isDraft: true,
      });
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
}));
