import apiClient from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  SearchParams,
} from "./types";
import type {
  Album,
  AlbumCreateRequest,
  AlbumUpdateRequest,
  AlbumCoverUploadResponse,
  AlbumCoverGenerateRequest,
  AlbumTrack,
  AlbumTracksResponse,
  AddTrackRequest,
  BulkAddTracksRequest,
  ReorderTrackRequest,
  PlaybackResponse,
} from "../../types/album";
import { normalizeAlbum } from "../../utils/typeHelpers";

export interface AlbumQueryParams extends SearchParams {
  isPublic?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
}

// Album API 서비스
export const albumService = {
  // === 앨범 기본 CRUD ===

  // 앨범 목록 조회
  getAlbums: async (
    params?: AlbumQueryParams
  ): Promise<PaginatedResponse<Album>> => {
    const response = await apiClient.get<PaginatedResponse<Album>>("/albums", {
      params,
    });
    // 앨범 목록 정규화 적용
    const data = response.data;
    return {
      ...data,
      content: (data.content || []).map(normalizeAlbum).filter(Boolean),
    };
  },

  // 특정 앨범 조회
  getAlbum: async (albumId: number): Promise<Album> => {
    const response = await apiClient.get<Album>(`/albums/${albumId}`);
    return normalizeAlbum(response.data);
  },

  // 새 앨범 생성
  createAlbum: async (albumData: AlbumCreateRequest): Promise<Album> => {
    const response = await apiClient.post<Album>("/albums", albumData);
    return response.data;
  },

  // 앨범 정보 수정
  updateAlbum: async (
    albumId: number,
    albumData: AlbumUpdateRequest
  ): Promise<Album> => {
    const response = await apiClient.put<Album>(
      `/albums/${albumId}`,
      albumData
    );
    return response.data;
  },

  // 앨범 삭제
  deleteAlbum: async (albumId: number): Promise<void> => {
    await apiClient.delete(`/albums/${albumId}`);
  },

  // === 앨범 트랙 관리 ===

  // 앨범의 모든 트랙을 순서대로 조회
  getAlbumTracks: async (albumId: number): Promise<AlbumTracksResponse> => {
    const response = await apiClient.get<AlbumTracksResponse>(
      `/albums/${albumId}/tracks`
    );
    return response.data;
  },

  // 앨범의 특정 순서 트랙을 조회
  getTrackByOrder: async (albumId: number, trackOrder: number): Promise<AlbumTrack> => {
    const response = await apiClient.get<AlbumTrack>(
      `/albums/${albumId}/tracks/${trackOrder}`
    );
    return response.data;
  },

  // 앨범에 새로운 트랙을 추가
  addTrack: async (
    albumId: number,
    trackData: { recordId: number; trackOrder: number }
  ): Promise<AlbumTrack> => {
    const response = await apiClient.post<AlbumTrack>(
      `/albums/${albumId}/tracks`,
      trackData
    );
    return response.data;
  },

  // 앨범에 여러 트랙을 한번에 추가
  addTracks: async (
    albumId: number,
    tracksData: { tracks: Array<{ recordId: number; trackOrder: number }> }
  ): Promise<AlbumTrack[]> => {
    const response = await apiClient.post<AlbumTrack[]>(
      `/albums/${albumId}/tracks/bulk`,
      tracksData
    );
    return response.data;
  },

  // 앨범에서 특정 트랙을 삭제
  removeTrack: async (albumId: number, trackOrder: number): Promise<void> => {
    await apiClient.delete(`/albums/${albumId}/tracks/${trackOrder}`);
  },

  // 트랙 순서 변경
  reorderTrack: async (
    albumId: number,
    reorderData: { fromOrder: number; toOrder: number }
  ): Promise<AlbumTracksResponse> => {
    const response = await apiClient.put<AlbumTracksResponse>(
      `/albums/${albumId}/tracks/reorder`,
      reorderData
    );
    return response.data;
  },

  // 현재 트랙의 다음 트랙을 조회
  getNextTrack: async (albumId: number, trackOrder: number): Promise<AlbumTrack> => {
    const response = await apiClient.get<AlbumTrack>(
      `/albums/${albumId}/tracks/${trackOrder}/next`
    );
    return response.data;
  },

  // 현재 트랙의 이전 트랙을 조회
  getPreviousTrack: async (albumId: number, trackOrder: number): Promise<AlbumTrack> => {
    const response = await apiClient.get<AlbumTrack>(
      `/albums/${albumId}/tracks/${trackOrder}/previous`
    );
    return response.data;
  },

  // 셔플 재생 목록 조회
  getShuffleTracks: async (albumId: number): Promise<AlbumTracksResponse> => {
    const response = await apiClient.get<AlbumTracksResponse>(
      `/albums/${albumId}/tracks/shuffle`
    );
    return response.data;
  },

  // === 재생 관련 ===

  // 앨범 재생 정보 조회 (첫 번째 트랙부터)
  getPlaybackInfo: async (albumId: number): Promise<PlaybackResponse> => {
    const response = await apiClient.get<PlaybackResponse>(
      `/albums/${albumId}/tracks/play`
    );
    return response.data;
  },

  // 특정 트랙 재생 정보 조회
  getTrackPlaybackInfo: async (
    albumId: number,
    trackOrder: number
  ): Promise<PlaybackResponse> => {
    const response = await apiClient.get<PlaybackResponse>(
      `/albums/${albumId}/tracks/${trackOrder}/play`
    );
    return response.data;
  },

  // === 앨범 커버 관리 ===

  // 앨범 커버 직접 업로드
  uploadCover: async (file: File): Promise<AlbumCoverUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<AlbumCoverUploadResponse>(
      "/albums/covers/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // AI 앨범 커버 자동 생성
  generateCover: async (
    request: AlbumCoverGenerateRequest
  ): Promise<AlbumCoverUploadResponse> => {
    const response = await apiClient.post<AlbumCoverUploadResponse>(
      "/albums/cover/generate",
      request
    );
    return response.data;
  },

  // 여러 개의 AI 커버 생성 (추가 옵션)
  generateMultipleCovers: async (
    trackIds: string[],
    params: Record<string, unknown>,
    count = 3
  ): Promise<AlbumCoverUploadResponse[]> => {
    const response = await apiClient.post("/albums/covers/generate", {
      trackIds,
      params,
      count,
    });
    return response.data;
  },

  // 커버 이미지 업로드 (레거시 호환)
  uploadCoverImage: async (
    file: File
  ): Promise<{ uploadId: number; imageUrl: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/albums/covers/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // uploadIds로 커버 생성 (레거시 호환)
  generateCoverFromUploads: async (
    uploadIds: number[]
  ): Promise<{ uploadId: number; imageUrl: string }> => {
    const response = await apiClient.post("/albums/covers/generate", {
      uploadIds,
    });
    return response.data;
  },

  // === 소셜 기능 ===

  // 공개 앨범 목록 조회 (소셜 피드용)
  getPublicAlbums: async (
    params?: { page?: number; size?: number; keyword?: string }
  ): Promise<PaginatedResponse<Album>> => {
    const response = await apiClient.get<PaginatedResponse<Album>>("/social/albums", {
      params,
    });
    const data = response.data;
    return {
      ...data,
      content: (data.content || []).map(normalizeAlbum).filter(Boolean),
    };
  },

  // 팔로우한 사용자들의 공개 앨범 조회
  getFollowedUsersAlbums: async (
    params?: { page?: number; size?: number; keyword?: string }
  ): Promise<PaginatedResponse<Album>> => {
    const response = await apiClient.get<PaginatedResponse<Album>>("/social/albums/followed", {
      params,
    });
    const data = response.data;
    return {
      ...data,
      content: (data.content || []).map(normalizeAlbum).filter(Boolean),
    };
  },

  // 앨범 좋아요
  likeAlbum: async (albumId: number) => {
    const response = await apiClient.post(`/albums/${albumId}/like`);
    return response.data;
  },

  // 앨범 좋아요 취소
  unlikeAlbum: async (albumId: number) => {
    const response = await apiClient.delete(`/albums/${albumId}/like`);
    return response.data;
  },
};
