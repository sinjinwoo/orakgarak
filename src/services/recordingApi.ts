import axios, { AxiosResponse } from 'axios';
import {
  PresignedUrlRequest,
  PresignedUrlResponse,
  CreateRecordingRequest,
  Recording,
  ApiError,
  RecordingFilters
} from '../types/recording';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const recordingApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

recordingApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
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
      message: error.response?.data?.message || error.message || 'An error occurred',
      statusCode: error.response?.status || 500,
      details: error.response?.data,
    };
    return Promise.reject(apiError);
  }
);

export const recordingService = {
  getPresignedUrl: async (request: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
    try {
      const response: AxiosResponse<PresignedUrlResponse> = await recordingApi.post(
        '/api/records/async/presigned-url',
        request
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createRecording: async (request: CreateRecordingRequest): Promise<Recording> => {
    try {
      const response: AxiosResponse<Recording> = await recordingApi.post(
        '/api/records/async',
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
        `/api/records/async/${recordId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMyRecordings: async (filters?: RecordingFilters): Promise<Recording[]> => {
    try {
      const queryParams = new URLSearchParams();

      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.processingStatus) queryParams.append('processingStatus', filters.processingStatus);
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/records/async/me?${queryString}` : '/api/records/async/me';

      const response: AxiosResponse<Recording[]> = await recordingApi.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteRecording: async (recordId: number): Promise<void> => {
    try {
      await recordingApi.delete(`/api/records/async/${recordId}`);
    } catch (error) {
      throw error;
    }
  },

  checkProcessingStatus: async (recordId: number): Promise<Recording> => {
    try {
      const response: AxiosResponse<Recording> = await recordingApi.get(
        `/api/records/async/${recordId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default recordingService;