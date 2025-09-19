import axios, { AxiosResponse } from "axios";
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
  ApiError,
} from "../types/album";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080/api";

const albumApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

albumApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

albumApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      message:
        error.response?.data?.message || error.message || "An error occurred",
      statusCode: error.response?.status || 500,
      details: error.response?.data,
    };
    return Promise.reject(apiError);
  }
);

export const albumService = {
  // 앨범 관련 API
  createAlbum: async (albumData: CreateAlbumRequest): Promise<Album> => {
    try {
      const response: AxiosResponse<Album> = await albumApi.post(
        "/albums",
        albumData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAlbums: async (
    params?: AlbumQueryParams
  ): Promise<{
    content: Album[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page !== undefined)
        queryParams.append("page", params.page.toString());
      if (params?.pageSize !== undefined)
        queryParams.append("size", params.pageSize.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.isPublic !== undefined)
        queryParams.append("isPublic", params.isPublic.toString());
      if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const queryString = queryParams.toString();
      const url = queryString ? `/albums?${queryString}` : "/albums";

      const response = await albumApi.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAlbumById: async (albumId: number): Promise<Album> => {
    try {
      const response: AxiosResponse<Album> = await albumApi.get(
        `/albums/${albumId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateAlbum: async (
    albumId: number,
    albumData: UpdateAlbumRequest
  ): Promise<Album> => {
    try {
      const response: AxiosResponse<Album> = await albumApi.put(
        `/albums/${albumId}`,
        albumData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteAlbum: async (albumId: number): Promise<void> => {
    try {
      await albumApi.delete(`/albums/${albumId}`);
    } catch (error) {
      throw error;
    }
  },

  // 앨범 트랙 관련 API
  getAlbumTracks: async (albumId: number): Promise<AlbumTracksResponse> => {
    try {
      const response: AxiosResponse<AlbumTracksResponse> = await albumApi.get(
        `/albums/${albumId}/tracks`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addTrack: async (
    albumId: number,
    trackData: AddTrackRequest
  ): Promise<AlbumTrack> => {
    try {
      const response: AxiosResponse<AlbumTrack> = await albumApi.post(
        `/albums/${albumId}/tracks`,
        trackData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addTracks: async (
    albumId: number,
    tracksData: BulkAddTracksRequest
  ): Promise<AlbumTrack[]> => {
    try {
      const response: AxiosResponse<AlbumTrack[]> = await albumApi.post(
        `/albums/${albumId}/tracks/bulk`,
        tracksData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  removeTrack: async (albumId: number, trackOrder: number): Promise<void> => {
    try {
      await albumApi.delete(`/albums/${albumId}/tracks/${trackOrder}`);
    } catch (error) {
      throw error;
    }
  },

  reorderTrack: async (
    albumId: number,
    reorderData: { fromOrder: number; toOrder: number }
  ): Promise<AlbumTracksResponse> => {
    try {
      const response: AxiosResponse<AlbumTracksResponse> = await albumApi.put(
        `/albums/${albumId}/tracks/reorder`,
        reorderData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 재생 관련 API
  getPlaybackInfo: async (
    albumId: number,
    trackOrder?: number
  ): Promise<PlaybackResponse> => {
    try {
      const url = trackOrder
        ? `/albums/${albumId}/tracks/${trackOrder}/play`
        : `/albums/${albumId}/tracks/play`;
      const response: AxiosResponse<PlaybackResponse> = await albumApi.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 앨범 커버 관련 API
  uploadCover: async (
    file: File
  ): Promise<{ uploadId: number; imageUrl: string }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await albumApi.post("/albums/covers/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  generateCover: async (
    uploadIds: number[]
  ): Promise<{ uploadId: number; imageUrl: string }> => {
    try {
      const response = await albumApi.post("/albums/covers/generate", {
        uploadIds,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default albumService;
