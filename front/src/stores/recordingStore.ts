import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Recording,
  RecordingQueueItem,
  UploadProgress,
  RecordingFilters,
  AudioRecorderConfig
} from '../types/recording';

interface RecordingStore {
  selectedRecording: Recording | null;
  selectedRecordingIds: number[];
  filters: RecordingFilters;
  queue: RecordingQueueItem[];
  uploadProgress: Record<string, UploadProgress>;
  recorderConfig: AudioRecorderConfig;
  isRecorderInitialized: boolean;

  setSelectedRecording: (recording: Recording | null) => void;
  setSelectedRecordingIds: (ids: number[]) => void;
  addSelectedRecordingId: (id: number) => void;
  removeSelectedRecordingId: (id: number) => void;
  toggleSelectedRecordingId: (id: number) => void;
  clearSelectedRecordingIds: () => void;

  setFilters: (filters: Partial<RecordingFilters>) => void;
  resetFilters: () => void;

  addToQueue: (item: RecordingQueueItem) => void;
  updateQueueItem: (id: string, updates: Partial<RecordingQueueItem>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  getQueueItem: (id: string) => RecordingQueueItem | undefined;

  setUploadProgress: (queueId: string, progress: UploadProgress) => void;
  clearUploadProgress: (queueId: string) => void;

  setRecorderConfig: (config: Partial<AudioRecorderConfig>) => void;
  resetRecorderConfig: () => void;
  setRecorderInitialized: (initialized: boolean) => void;

  clearAll: () => void;
}

const defaultFilters: RecordingFilters = {
  search: '',
  processingStatus: undefined,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const defaultRecorderConfig: AudioRecorderConfig = {
  sampleRate: 44100,
  channelCount: 1,
  bitRate: 128000,
  mimeType: 'audio/webm;codecs=opus',
};

export const useRecordingStore = create<RecordingStore>()(
  devtools(
    persist(
      (set, get) => ({
        selectedRecording: null,
        selectedRecordingIds: [],
        filters: defaultFilters,
        queue: [],
        uploadProgress: {},
        recorderConfig: defaultRecorderConfig,
        isRecorderInitialized: false,

        setSelectedRecording: (recording) => set({ selectedRecording: recording }),

        setSelectedRecordingIds: (ids) => set({ selectedRecordingIds: ids }),

        addSelectedRecordingId: (id) =>
          set((state) => ({
            selectedRecordingIds: state.selectedRecordingIds.includes(id)
              ? state.selectedRecordingIds
              : [...state.selectedRecordingIds, id],
          })),

        removeSelectedRecordingId: (id) =>
          set((state) => ({
            selectedRecordingIds: state.selectedRecordingIds.filter((recordingId) => recordingId !== id),
          })),

        toggleSelectedRecordingId: (id) =>
          set((state) => ({
            selectedRecordingIds: state.selectedRecordingIds.includes(id)
              ? state.selectedRecordingIds.filter((recordingId) => recordingId !== id)
              : [...state.selectedRecordingIds, id],
          })),

        clearSelectedRecordingIds: () => set({ selectedRecordingIds: [] }),

        setFilters: (newFilters) =>
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
          })),

        resetFilters: () => set({ filters: defaultFilters }),

        addToQueue: (item) =>
          set((state) => ({
            queue: [...state.queue, item],
          })),

        updateQueueItem: (id, updates) =>
          set((state) => ({
            queue: state.queue.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          })),

        removeFromQueue: (id) =>
          set((state) => ({
            queue: state.queue.filter((item) => item.id !== id),
            uploadProgress: (() => {
              const { [id]: removed, ...rest } = state.uploadProgress;
              return rest;
            })(),
          })),

        clearQueue: () => set({ queue: [], uploadProgress: {} }),

        getQueueItem: (id) => {
          const state = get();
          return state.queue.find((item) => item.id === id);
        },

        setUploadProgress: (queueId, progress) =>
          set((state) => ({
            uploadProgress: {
              ...state.uploadProgress,
              [queueId]: progress,
            },
            queue: state.queue.map((item) =>
              item.id === queueId ? { ...item, uploadProgress: progress } : item
            ),
          })),

        clearUploadProgress: (queueId) =>
          set((state) => {
            const { [queueId]: removed, ...rest } = state.uploadProgress;
            return { uploadProgress: rest };
          }),

        setRecorderConfig: (config) =>
          set((state) => ({
            recorderConfig: { ...state.recorderConfig, ...config },
          })),

        resetRecorderConfig: () => set({ recorderConfig: defaultRecorderConfig }),

        setRecorderInitialized: (initialized) => set({ isRecorderInitialized: initialized }),

        clearAll: () =>
          set({
            selectedRecording: null,
            selectedRecordingIds: [],
            filters: defaultFilters,
            queue: [],
            uploadProgress: {},
            recorderConfig: defaultRecorderConfig,
            isRecorderInitialized: false,
          }),
      }),
      {
        name: 'recording-store',
        partialize: (state) => ({
          filters: state.filters,
          recorderConfig: state.recorderConfig,
        }),
      }
    ),
    {
      name: 'recording-store',
    }
  )
);

export const useRecordingActions = () => {
  const store = useRecordingStore();
  return {
    setSelectedRecording: store.setSelectedRecording,
    setSelectedRecordingIds: store.setSelectedRecordingIds,
    addSelectedRecordingId: store.addSelectedRecordingId,
    removeSelectedRecordingId: store.removeSelectedRecordingId,
    toggleSelectedRecordingId: store.toggleSelectedRecordingId,
    clearSelectedRecordingIds: store.clearSelectedRecordingIds,
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
    addToQueue: store.addToQueue,
    updateQueueItem: store.updateQueueItem,
    removeFromQueue: store.removeFromQueue,
    clearQueue: store.clearQueue,
    setUploadProgress: store.setUploadProgress,
    clearUploadProgress: store.clearUploadProgress,
    setRecorderConfig: store.setRecorderConfig,
    resetRecorderConfig: store.resetRecorderConfig,
    setRecorderInitialized: store.setRecorderInitialized,
    clearAll: store.clearAll,
  };
};

export const useRecordingSelectors = () => {
  const store = useRecordingStore();
  return {
    selectedRecording: store.selectedRecording,
    selectedRecordingIds: store.selectedRecordingIds,
    filters: store.filters,
    queue: store.queue,
    uploadProgress: store.uploadProgress,
    recorderConfig: store.recorderConfig,
    isRecorderInitialized: store.isRecorderInitialized,
    hasSelectedRecordings: store.selectedRecordingIds.length > 0,
    selectedCount: store.selectedRecordingIds.length,
    pendingUploads: store.queue.filter(item =>
      item.status === 'pending' || item.status === 'uploading'
    ),
    completedUploads: store.queue.filter(item =>
      item.status === 'completed'
    ),
    failedUploads: store.queue.filter(item =>
      item.status === 'failed'
    ),
    activeUploads: store.queue.filter(item =>
      item.status === 'uploading' || item.status === 'processing'
    ),
    queueLength: store.queue.length,
  };
};

export const useQueueManagement = () => {
  const actions = useRecordingActions();
  const selectors = useRecordingSelectors();

  const retryFailedUpload = (queueId: string) => {
    const item = useRecordingStore.getState().getQueueItem(queueId);
    if (item && item.status === 'failed') {
      actions.updateQueueItem(queueId, {
        status: 'pending',
        error: undefined
      });
    }
  };

  const cancelUpload = (queueId: string) => {
    actions.removeFromQueue(queueId);
  };

  const clearCompleted = () => {
    const { queue } = useRecordingStore.getState();
    queue.forEach(item => {
      if (item.status === 'completed') {
        actions.removeFromQueue(item.id);
      }
    });
  };

  const clearFailed = () => {
    const { queue } = useRecordingStore.getState();
    queue.forEach(item => {
      if (item.status === 'failed') {
        actions.removeFromQueue(item.id);
      }
    });
  };

  return {
    ...actions,
    ...selectors,
    retryFailedUpload,
    cancelUpload,
    clearCompleted,
    clearFailed,
  };
};