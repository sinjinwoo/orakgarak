import axios, { AxiosResponse } from "axios";
import {
  PresignedUrlRequest,
  PresignedUrlResponse,
  CreateRecordingRequest,
  Recording,
  ApiError,
  RecordingFilters,
  ProcessingStatus,
  ProcessingStatusResponse,
} from "../types/recording";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080/api";

const recordingApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

recordingApi.interceptors.request.use(
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

recordingApi.interceptors.response.use(
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

export const recordingService = {
  /**
   * Presigned URL 생성
   * POST /records/async/presigned-url
   */
  getPresignedUrl: async (
    request: PresignedUrlRequest
  ): Promise<PresignedUrlResponse> => {
    try {
      // 백엔드가 @RequestParam으로 받으므로 query parameter로 전송
      const params = new URLSearchParams();
      params.append("originalFilename", request.originalFilename);
      params.append("fileSize", request.fileSize.toString());
      params.append("contentType", request.contentType);
      params.append("durationSeconds", request.durationSeconds.toString());

      const response: AxiosResponse<PresignedUrlResponse> =
        await recordingApi.post(
          `/records/async/presigned-url?${params.toString()}`
        );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createRecording: async (
    request: CreateRecordingRequest
  ): Promise<Recording> => {
    try {
      const response: AxiosResponse<Recording> = await recordingApi.post(
        "/records/async",
        request
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getRecording: async (recordId: number): Promise<Recording> => {
    try {
      const response: AxiosResponse<Recording> = await recordingApi.get(
        `/records/async/${recordId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMyRecordings: async (filters?: RecordingFilters): Promise<Recording[]> => {
    try {
      const queryParams = new URLSearchParams();

      if (filters?.search) queryParams.append("search", filters.search);
      if (filters?.processingStatus)
        queryParams.append("processingStatus", filters.processingStatus);
      if (filters?.sortBy) queryParams.append("sortBy", filters.sortBy);
      if (filters?.sortOrder)
        queryParams.append("sortOrder", filters.sortOrder);

      const queryString = queryParams.toString();
      const url = queryString
        ? `/records/async/me?${queryString}`
        : "/records/async/me";

      const response: AxiosResponse<Recording[]> = await recordingApi.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteRecording: async (recordId: number): Promise<void> => {
    try {
      await recordingApi.delete(`/records/async/${recordId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * 처리 상태 폴링 (uploadId 기반)
   * GET /processing/status/{uploadId}
   */
  getProcessingStatus: async (
    uploadId: number
  ): Promise<ProcessingStatusResponse> => {
    try {
      const response: AxiosResponse<ProcessingStatusResponse> =
        await recordingApi.get(`/processing/status/${uploadId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 내가 업로드한 모든 파일의 처리 상태 확인
   * GET /processing/my-files?status={status}
   */
  getMyProcessingFiles: async (
    status?: string
  ): Promise<ProcessingStatus[]> => {
    try {
      const params = status ? { status } : undefined;
      // 백엔드에서 User-Id 헤더를 요구하므로 임시로 추가
      // TODO: 백엔드에서 JWT 토큰 사용하도록 수정 요청 필요
      const userId = localStorage.getItem("userId"); // 로그인 시 저장된 사용자 ID
      const headers = userId ? { "User-Id": userId } : {};

      const response: AxiosResponse<ProcessingStatus[]> =
        await recordingApi.get("/processing/my-files", {
          params,
          headers: { ...recordingApi.defaults.headers, ...headers },
        });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * SSE로 처리 상태 스트림 구독
   * GET /processing/status/{uploadId}/stream
   */
  subscribeToProcessingStatus: (
    uploadId: number,
    onMessage: (data: ProcessingStatusResponse) => void,
    onError?: (error: Event) => void
  ): EventSource => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/processing/status/${uploadId}/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    if (onError) {
      eventSource.onerror = onError;
    }

    return eventSource;
  },

  /**
   * 레거시 호환성을 위한 메서드 (recordId 기반)
   */
  checkProcessingStatus: async (recordId: number): Promise<Recording> => {
    try {
      const response: AxiosResponse<Recording> = await recordingApi.get(
        `/records/async/${recordId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default recordingService;
