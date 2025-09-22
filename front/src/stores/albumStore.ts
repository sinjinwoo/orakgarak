import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Album, AlbumQueryParams, AlbumTrack, CreateAlbumRequest } from '../types/album';

interface AlbumFilters {
  search: string;
  isPublic?: boolean;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'likeCount';
  sortOrder: 'asc' | 'desc';
}

interface AlbumPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// 앨범 생성 과정의 상태
interface AlbumCreationState {
  step: number;
  selectedRecordIds: number[];
  selectedCoverUploadId?: number;
  albumInfo: Partial<CreateAlbumRequest>;
  isComplete: boolean;
}

interface AlbumStore {
  // 기본 앨범 관리
  selectedAlbum: Album | null;
  selectedAlbumIds: number[];
  filters: AlbumFilters;
  pagination: AlbumPagination;

  // 앨범 생성 플로우
  creationState: AlbumCreationState;

  // 로딩 및 에러 상태
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  lastError: string | null;

  // 기본 앨범 관리 액션
  setSelectedAlbum: (album: Album | null) => void;
  setSelectedAlbumIds: (ids: number[]) => void;
  addSelectedAlbumId: (id: number) => void;
  removeSelectedAlbumId: (id: number) => void;
  toggleSelectedAlbumId: (id: number) => void;
  clearSelectedAlbumIds: () => void;

  // 필터 및 페이지네이션 액션
  setFilters: (filters: Partial<AlbumFilters>) => void;
  resetFilters: () => void;
  getQueryParams: () => AlbumQueryParams;

  setPagination: (pagination: Partial<AlbumPagination>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetPagination: () => void;

  // 앨범 생성 플로우 액션
  setCreationStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSelectedRecordIds: (ids: number[]) => void;
  addSelectedRecordId: (id: number) => void;
  removeSelectedRecordId: (id: number) => void;
  toggleSelectedRecordId: (id: number) => void;
  setSelectedCoverUploadId: (uploadId?: number) => void;
  setAlbumInfo: (info: Partial<CreateAlbumRequest>) => void;
  updateAlbumInfo: (updates: Partial<CreateAlbumRequest>) => void;
  resetCreationState: () => void;
  getCompleteAlbumData: () => CreateAlbumRequest | null;

  // 상태 관리 액션
  setCreating: (isCreating: boolean) => void;
  setUpdating: (isUpdating: boolean) => void;
  setDeleting: (isDeleting: boolean) => void;
  setError: (error: string | null) => void;

  clearAll: () => void;
}

const defaultFilters: AlbumFilters = {
  search: '',
  isPublic: undefined,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const defaultPagination: AlbumPagination = {
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
};

const defaultCreationState: AlbumCreationState = {
  step: 1,
  selectedRecordIds: [],
  selectedCoverUploadId: undefined,
  albumInfo: {},
  isComplete: false,
};

export const useAlbumStore = create<AlbumStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        selectedAlbum: null,
        selectedAlbumIds: [],
        filters: defaultFilters,
        pagination: defaultPagination,
        creationState: defaultCreationState,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        lastError: null,

        // 기본 앨범 관리 액션
        setSelectedAlbum: (album) => set({ selectedAlbum: album }),

        setSelectedAlbumIds: (ids) => set({ selectedAlbumIds: ids }),

        addSelectedAlbumId: (id) =>
          set((state) => ({
            selectedAlbumIds: state.selectedAlbumIds.includes(id)
              ? state.selectedAlbumIds
              : [...state.selectedAlbumIds, id],
          })),

        removeSelectedAlbumId: (id) =>
          set((state) => ({
            selectedAlbumIds: state.selectedAlbumIds.filter((albumId) => albumId !== id),
          })),

        toggleSelectedAlbumId: (id) =>
          set((state) => ({
            selectedAlbumIds: state.selectedAlbumIds.includes(id)
              ? state.selectedAlbumIds.filter((albumId) => albumId !== id)
              : [...state.selectedAlbumIds, id],
          })),

        clearSelectedAlbumIds: () => set({ selectedAlbumIds: [] }),

        // 필터 및 페이지네이션 액션
        setFilters: (newFilters) =>
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
            pagination: { ...state.pagination, page: 1 },
          })),

        resetFilters: () =>
          set({
            filters: defaultFilters,
            pagination: { ...defaultPagination, page: 1 },
          }),

        getQueryParams: () => {
          const { filters, pagination } = get();
          return {
            page: pagination.page,
            pageSize: pagination.pageSize,
            search: filters.search || undefined,
            isPublic: filters.isPublic,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          };
        },

        setPagination: (newPagination) =>
          set((state) => ({
            pagination: { ...state.pagination, ...newPagination },
          })),

        setPage: (page) =>
          set((state) => ({
            pagination: { ...state.pagination, page },
          })),

        setPageSize: (pageSize) =>
          set((state) => ({
            pagination: { ...state.pagination, pageSize, page: 1 },
          })),

        resetPagination: () => set({ pagination: defaultPagination }),

        // 앨범 생성 플로우 액션
        setCreationStep: (step) =>
          set((state) => ({
            creationState: { ...state.creationState, step },
          })),

        nextStep: () =>
          set((state) => ({
            creationState: { ...state.creationState, step: Math.min(state.creationState.step + 1, 4) },
          })),

        prevStep: () =>
          set((state) => ({
            creationState: { ...state.creationState, step: Math.max(state.creationState.step - 1, 1) },
          })),

        setSelectedRecordIds: (ids) =>
          set((state) => ({
            creationState: { ...state.creationState, selectedRecordIds: ids },
          })),

        addSelectedRecordId: (id) =>
          set((state) => ({
            creationState: {
              ...state.creationState,
              selectedRecordIds: state.creationState.selectedRecordIds.includes(id)
                ? state.creationState.selectedRecordIds
                : [...state.creationState.selectedRecordIds, id],
            },
          })),

        removeSelectedRecordId: (id) =>
          set((state) => ({
            creationState: {
              ...state.creationState,
              selectedRecordIds: state.creationState.selectedRecordIds.filter((recordId) => recordId !== id),
            },
          })),

        toggleSelectedRecordId: (id) =>
          set((state) => ({
            creationState: {
              ...state.creationState,
              selectedRecordIds: state.creationState.selectedRecordIds.includes(id)
                ? state.creationState.selectedRecordIds.filter((recordId) => recordId !== id)
                : [...state.creationState.selectedRecordIds, id],
            },
          })),

        setSelectedCoverUploadId: (uploadId) =>
          set((state) => ({
            creationState: { ...state.creationState, selectedCoverUploadId: uploadId },
          })),

        setAlbumInfo: (info) =>
          set((state) => ({
            creationState: { ...state.creationState, albumInfo: info },
          })),

        updateAlbumInfo: (updates) =>
          set((state) => ({
            creationState: {
              ...state.creationState,
              albumInfo: { ...state.creationState.albumInfo, ...updates },
            },
          })),

        resetCreationState: () =>
          set({
            creationState: defaultCreationState,
          }),

        getCompleteAlbumData: () => {
          const { creationState } = get();
          const { albumInfo, selectedCoverUploadId } = creationState;

          if (!albumInfo.title || albumInfo.isPublic === undefined) {
            return null;
          }

          return {
            title: albumInfo.title,
            description: albumInfo.description || '',
            uploadId: selectedCoverUploadId,
            isPublic: albumInfo.isPublic,
          };
        },

        // 상태 관리 액션
        setCreating: (isCreating) => set({ isCreating }),
        setUpdating: (isUpdating) => set({ isUpdating }),
        setDeleting: (isDeleting) => set({ isDeleting }),
        setError: (error) => set({ lastError: error }),

        clearAll: () =>
          set({
            selectedAlbum: null,
            selectedAlbumIds: [],
            filters: defaultFilters,
            pagination: defaultPagination,
            creationState: defaultCreationState,
            isCreating: false,
            isUpdating: false,
            isDeleting: false,
            lastError: null,
          }),
      }),
      {
        name: 'album-store',
        partialize: (state) => ({
          filters: state.filters,
          pagination: {
            ...state.pagination,
            page: 1,
          },
          creationState: state.creationState,
        }),
      }
    ),
    {
      name: 'album-store',
    }
  )
);

// 액션 훅들
export const useAlbumActions = () => {
  const store = useAlbumStore();
  return {
    setSelectedAlbum: store.setSelectedAlbum,
    setSelectedAlbumIds: store.setSelectedAlbumIds,
    addSelectedAlbumId: store.addSelectedAlbumId,
    removeSelectedAlbumId: store.removeSelectedAlbumId,
    toggleSelectedAlbumId: store.toggleSelectedAlbumId,
    clearSelectedAlbumIds: store.clearSelectedAlbumIds,
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
    setPagination: store.setPagination,
    setPage: store.setPage,
    setPageSize: store.setPageSize,
    resetPagination: store.resetPagination,
    setCreating: store.setCreating,
    setUpdating: store.setUpdating,
    setDeleting: store.setDeleting,
    setError: store.setError,
    clearAll: store.clearAll,
  };
};

export const useAlbumCreationActions = () => {
  const store = useAlbumStore();
  return {
    setCreationStep: store.setCreationStep,
    nextStep: store.nextStep,
    prevStep: store.prevStep,
    setSelectedRecordIds: store.setSelectedRecordIds,
    addSelectedRecordId: store.addSelectedRecordId,
    removeSelectedRecordId: store.removeSelectedRecordId,
    toggleSelectedRecordId: store.toggleSelectedRecordId,
    setSelectedCoverUploadId: store.setSelectedCoverUploadId,
    setAlbumInfo: store.setAlbumInfo,
    updateAlbumInfo: store.updateAlbumInfo,
    resetCreationState: store.resetCreationState,
    getCompleteAlbumData: store.getCompleteAlbumData,
  };
};

// 셀렉터 훅들
export const useAlbumSelectors = () => {
  const store = useAlbumStore();
  return {
    selectedAlbum: store.selectedAlbum,
    selectedAlbumIds: store.selectedAlbumIds,
    filters: store.filters,
    pagination: store.pagination,
    isCreating: store.isCreating,
    isUpdating: store.isUpdating,
    isDeleting: store.isDeleting,
    lastError: store.lastError,
    queryParams: store.getQueryParams(),
    hasSelectedAlbums: store.selectedAlbumIds.length > 0,
    selectedCount: store.selectedAlbumIds.length,
  };
};

export const useAlbumCreationSelectors = () => {
  const store = useAlbumStore();
  return {
    creationState: store.creationState,
    currentStep: store.creationState.step,
    selectedRecordIds: store.creationState.selectedRecordIds,
    selectedCoverUploadId: store.creationState.selectedCoverUploadId,
    albumInfo: store.creationState.albumInfo,
    isComplete: store.creationState.isComplete,
    hasSelectedRecords: store.creationState.selectedRecordIds.length > 0,
    selectedRecordCount: store.creationState.selectedRecordIds.length,
    isValidForCreation: () => {
      const { albumInfo, selectedRecordIds } = store.creationState;
      return !!(albumInfo.title && albumInfo.isPublic !== undefined && selectedRecordIds.length > 0);
    },
  };
};