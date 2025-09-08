import { create } from 'zustand';

interface ReservationQueueItem {
  id: string;
  songId: string;
  song: {
    title: string;
    artist: string;
    duration: number;
  };
  addedAt: string;
}

interface RecordingSession {
  isRecording: boolean;
  currentSong?: {
    id: string;
    title: string;
    artist: string;
    audioUrl: string;
  };
  recordingStartTime?: number;
  volumeLevel: number;
  pitchAccuracy: number;
  tempoAccuracy: number;
}

interface RecordStore {
  // 예약 큐
  reservationQueue: ReservationQueueItem[];
  currentPlayingIndex: number;
  
  // 녹음 세션
  recordingSession: RecordingSession;
  
  // 큐 관리
  addToQueue: (songId: string, song: ReservationQueueItem['song']) => void;
  removeFromQueue: (id: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setCurrentPlayingIndex: (index: number) => void;
  
  // 녹음 관리
  startRecording: (song: RecordingSession['currentSong']) => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  
  // 실시간 데이터 업데이트
  updateVolumeLevel: (level: number) => void;
  updatePitchAccuracy: (accuracy: number) => void;
  updateTempoAccuracy: (accuracy: number) => void;
}

export const useRecordStore = create<RecordStore>((set, get) => ({
  // 초기 상태
  reservationQueue: [],
  currentPlayingIndex: 0,
  recordingSession: {
    isRecording: false,
    volumeLevel: 0,
    pitchAccuracy: 0,
    tempoAccuracy: 0,
  },
  
  // 큐 관리
  addToQueue: (songId, song) => {
    const newItem: ReservationQueueItem = {
      id: Math.random().toString(36).substr(2, 9),
      songId,
      song,
      addedAt: new Date().toISOString(),
    };
    
    set((state) => ({
      reservationQueue: [...state.reservationQueue, newItem]
    }));
  },
  
  removeFromQueue: (id) => {
    set((state) => ({
      reservationQueue: state.reservationQueue.filter(item => item.id !== id)
    }));
  },
  
  reorderQueue: (fromIndex, toIndex) => {
    set((state) => {
      const newQueue = [...state.reservationQueue];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      
      return { reservationQueue: newQueue };
    });
  },
  
  clearQueue: () => {
    set({ reservationQueue: [], currentPlayingIndex: 0 });
  },
  
  setCurrentPlayingIndex: (index) => {
    set({ currentPlayingIndex: index });
  },
  
  // 녹음 관리
  startRecording: (song) => {
    set({
      recordingSession: {
        isRecording: true,
        currentSong: song,
        recordingStartTime: Date.now(),
        volumeLevel: 0,
        pitchAccuracy: 0,
        tempoAccuracy: 0,
      }
    });
  },
  
  stopRecording: () => {
    set((state) => ({
      recordingSession: {
        ...state.recordingSession,
        isRecording: false,
        currentSong: undefined,
        recordingStartTime: undefined,
      }
    }));
  },
  
  pauseRecording: () => {
    set((state) => ({
      recordingSession: {
        ...state.recordingSession,
        isRecording: false,
      }
    }));
  },
  
  resumeRecording: () => {
    set((state) => ({
      recordingSession: {
        ...state.recordingSession,
        isRecording: true,
      }
    }));
  },
  
  // 실시간 데이터 업데이트
  updateVolumeLevel: (level) => {
    set((state) => ({
      recordingSession: {
        ...state.recordingSession,
        volumeLevel: level,
      }
    }));
  },
  
  updatePitchAccuracy: (accuracy) => {
    set((state) => ({
      recordingSession: {
        ...state.recordingSession,
        pitchAccuracy: accuracy,
      }
    }));
  },
  
  updateTempoAccuracy: (accuracy) => {
    set((state) => ({
      recordingSession: {
        ...state.recordingSession,
        tempoAccuracy: accuracy,
      }
    }));
  },
}));
