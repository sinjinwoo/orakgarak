import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { albumService } from '../services/albumApi';
import {
  Album,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  AlbumListResponse,
  AlbumQueryParams,
  AlbumTrack,
  AddTrackRequest,
  BulkAddTracksRequest,
  AlbumTracksResponse,
  PlaybackResponse,
  ApiError
} from '../types/album';
import { toast } from 'react-toastify';

export const ALBUM_QUERY_KEYS = {
  all: ['albums'] as const,
  lists: () => [...ALBUM_QUERY_KEYS.all, 'list'] as const,
  list: (params?: AlbumQueryParams) => [...ALBUM_QUERY_KEYS.lists(), params] as const,
  details: () => [...ALBUM_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...ALBUM_QUERY_KEYS.details(), id] as const,
  tracks: (albumId: number) => [...ALBUM_QUERY_KEYS.detail(albumId), 'tracks'] as const,
  playback: (albumId: number, trackOrder?: number) =>
    [...ALBUM_QUERY_KEYS.detail(albumId), 'playback', trackOrder] as const,
};

// 앨범 목록 조회
export const useAlbums = (params?: AlbumQueryParams) => {
  return useQuery({
    queryKey: ALBUM_QUERY_KEYS.list(params),
    queryFn: () => albumService.getAlbums(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.statusCode === 404 || error?.statusCode === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// 특정 앨범 조회
export const useAlbum = (albumId: number, enabled: boolean = true) => {
  return useQuery<Album, ApiError>({
    queryKey: ALBUM_QUERY_KEYS.detail(albumId),
    queryFn: () => albumService.getAlbumById(albumId),
    enabled: enabled && !!albumId,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.statusCode === 404 || error.statusCode === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// 앨범 트랙 조회
export const useAlbumTracks = (albumId: number, enabled: boolean = true) => {
  return useQuery<AlbumTracksResponse, ApiError>({
    queryKey: ALBUM_QUERY_KEYS.tracks(albumId),
    queryFn: () => albumService.getAlbumTracks(albumId),
    enabled: enabled && !!albumId,
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.statusCode === 404 || error.statusCode === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// 재생 정보 조회
export const usePlaybackInfo = (albumId: number, trackOrder?: number, enabled: boolean = true) => {
  return useQuery<PlaybackResponse, ApiError>({
    queryKey: ALBUM_QUERY_KEYS.playback(albumId, trackOrder),
    queryFn: () => albumService.getPlaybackInfo(albumId, trackOrder),
    enabled: enabled && !!albumId,
    staleTime: 1 * 60 * 1000,
    retry: false,
  });
};

// 앨범 생성
export const useCreateAlbum = () => {
  const queryClient = useQueryClient();

  return useMutation<Album, ApiError, CreateAlbumRequest>({
    mutationFn: albumService.createAlbum,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.lists() });
      toast.success('앨범이 성공적으로 생성되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || '앨범 생성에 실패했습니다.');
    },
  });
};

// 앨범 수정
export const useUpdateAlbum = () => {
  const queryClient = useQueryClient();

  return useMutation<Album, ApiError, { albumId: number; data: UpdateAlbumRequest }>({
    mutationFn: ({ albumId, data }) => albumService.updateAlbum(albumId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.lists() });
      queryClient.setQueryData(ALBUM_QUERY_KEYS.detail(variables.albumId), data);
      toast.success('앨범이 성공적으로 수정되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || '앨범 수정에 실패했습니다.');
    },
  });
};

// 앨범 삭제
export const useDeleteAlbum = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: albumService.deleteAlbum,
    onSuccess: (_, albumId) => {
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: ALBUM_QUERY_KEYS.detail(albumId) });
      toast.success('앨범이 성공적으로 삭제되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || '앨범 삭제에 실패했습니다.');
    },
  });
};

// 트랙 추가
export const useAddTrack = () => {
  const queryClient = useQueryClient();

  return useMutation<AlbumTrack, ApiError, { albumId: number; trackData: AddTrackRequest }>({
    mutationFn: ({ albumId, trackData }) => albumService.addTrack(albumId, trackData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.tracks(variables.albumId) });
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.detail(variables.albumId) });
      toast.success('트랙이 성공적으로 추가되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || '트랙 추가에 실패했습니다.');
    },
  });
};

// 여러 트랙 일괄 추가
export const useAddTracks = () => {
  const queryClient = useQueryClient();

  return useMutation<AlbumTrack[], ApiError, { albumId: number; tracksData: BulkAddTracksRequest }>({
    mutationFn: ({ albumId, tracksData }) => albumService.addTracks(albumId, tracksData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.tracks(variables.albumId) });
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.detail(variables.albumId) });
      toast.success('트랙들이 성공적으로 추가되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || '트랙 추가에 실패했습니다.');
    },
  });
};

// 트랙 삭제
export const useRemoveTrack = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { albumId: number; trackOrder: number }>({
    mutationFn: ({ albumId, trackOrder }) => albumService.removeTrack(albumId, trackOrder),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.tracks(variables.albumId) });
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.detail(variables.albumId) });
      toast.success('트랙이 성공적으로 삭제되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || '트랙 삭제에 실패했습니다.');
    },
  });
};

// 앨범 커버 업로드
export const useUploadCover = () => {
  return useMutation<{ uploadId: number; imageUrl: string }, ApiError, File>({
    mutationFn: albumService.uploadCover,
    onSuccess: () => {
      toast.success('앨범 커버가 성공적으로 업로드되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || '앨범 커버 업로드에 실패했습니다.');
    },
  });
};

// AI 앨범 커버 생성
export const useGenerateCover = () => {
  return useMutation<{ uploadId: number; imageUrl: string }, ApiError, number[]>({
    mutationFn: albumService.generateCover,
    onSuccess: () => {
      toast.success('AI 앨범 커버가 성공적으로 생성되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || 'AI 앨범 커버 생성에 실패했습니다.');
    },
  });
};

// 완전한 앨범 생성 (앨범 + 트랙들)
export const useCreateCompleteAlbum = () => {
  const queryClient = useQueryClient();
  const createAlbum = useCreateAlbum();
  const addTracks = useAddTracks();

  return useMutation<Album, ApiError, {
    albumData: CreateAlbumRequest;
    recordIds: number[]
  }>({
    mutationFn: async ({ albumData, recordIds }) => {
      // 1. 앨범 생성
      const album = await albumService.createAlbum(albumData);

      // 2. 트랙들 추가
      if (recordIds.length > 0) {
        const tracksData: BulkAddTracksRequest = {
          tracks: recordIds.map((recordId, index) => ({
            recordId,
            trackOrder: index + 1,
          })),
        };
        await albumService.addTracks(album.id, tracksData);

        // 최신 앨범 정보 다시 가져오기
        const updatedAlbum = await albumService.getAlbumById(album.id);
        return updatedAlbum;
      }

      return album;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ALBUM_QUERY_KEYS.tracks(data.id) });
      toast.success('앨범이 성공적으로 생성되었습니다.');
    },
    onError: (error) => {
      toast.error(error.message || '앨범 생성에 실패했습니다.');
    },
  });
};

// Prefetch 함수들
export const usePrefetchAlbum = () => {
  const queryClient = useQueryClient();

  return (albumId: number) => {
    queryClient.prefetchQuery({
      queryKey: ALBUM_QUERY_KEYS.detail(albumId),
      queryFn: () => albumService.getAlbumById(albumId),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// 통합 Mutations 훅
export const useAlbumMutations = () => {
  const createAlbum = useCreateAlbum();
  const createCompleteAlbum = useCreateCompleteAlbum();
  const updateAlbum = useUpdateAlbum();
  const deleteAlbum = useDeleteAlbum();
  const addTrack = useAddTrack();
  const addTracks = useAddTracks();
  const removeTrack = useRemoveTrack();
  const uploadCover = useUploadCover();
  const generateCover = useGenerateCover();

  return {
    createAlbum,
    createCompleteAlbum,
    updateAlbum,
    deleteAlbum,
    addTrack,
    addTracks,
    removeTrack,
    uploadCover,
    generateCover,
    isLoading:
      createAlbum.isPending ||
      createCompleteAlbum.isPending ||
      updateAlbum.isPending ||
      deleteAlbum.isPending ||
      addTrack.isPending ||
      addTracks.isPending ||
      removeTrack.isPending ||
      uploadCover.isPending ||
      generateCover.isPending,
  };
};