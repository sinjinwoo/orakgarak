import axios, { AxiosResponse } from "axios";
import {
  Song,
  SongSearchRequest,
  SongSearchResponse,
  SongDetailResponse,
} from "../types/song";
import { ApiError } from "../types/recording";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080/api";

const songApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 - 토큰 추가
songApi.interceptors.request.use(
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

// 응답 인터셉터 - 에러 처리
songApi.interceptors.response.use(
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

export const songService = {
  /**
   * 실시간 곡 검색
   * GET /songs/search/realtime?keyword={keyword}
   */
  searchSongs: async (keyword: string): Promise<SongSearchResponse> => {
    try {
      const response: AxiosResponse<SongSearchResponse> = await songApi.get(
        "/songs/search/realtime",
        {
          params: { keyword },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 특정 곡의 MR 및 가사 조회
   * GET /songs/{songId}
   */
  getSongDetail: async (songId: number): Promise<SongDetailResponse> => {
    try {
      const response: AxiosResponse<SongDetailResponse> = await songApi.get(
        `/songs/${songId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default songService;
