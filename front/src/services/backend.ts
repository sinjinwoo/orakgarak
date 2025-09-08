import apiClient from './apiClient';
import { User, Album, Recording, Song } from '../types';

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, nickname: string) =>
    apiClient.post('/auth/register', { email, password, nickname }),
  
  logout: () => apiClient.post('/auth/logout'),
  
  refreshToken: () => apiClient.post('/auth/refresh'),
};

// User API
export const userAPI = {
  getProfile: (userId?: string) =>
    apiClient.get<User>(`/users/${userId || 'me'}`),
  
  updateProfile: (data: Partial<User>) =>
    apiClient.put('/users/me', data),
  
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post('/users/me/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Song API
export const songAPI = {
  search: (query: string, limit = 20) =>
    apiClient.get<Song[]>('/songs/search', { params: { q: query, limit } }),
  
  getRecommendations: (filters?: any) =>
    apiClient.get<Song[]>('/songs/recommendations', { params: filters }),
  
  getSong: (songId: string) =>
    apiClient.get<Song>(`/songs/${songId}`),
};

// Recording API
export const recordingAPI = {
  getMyRecordings: () =>
    apiClient.get<Recording[]>('/recordings/me'),
  
  uploadRecording: (file: File, songId: string) => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('songId', songId);
    return apiClient.post<Recording>('/recordings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  deleteRecording: (recordingId: string) =>
    apiClient.delete(`/recordings/${recordingId}`),
  
  getRecording: (recordingId: string) =>
    apiClient.get<Recording>(`/recordings/${recordingId}`),
};

// Album API
export const albumAPI = {
  getAlbums: (filters?: any) =>
    apiClient.get<Album[]>('/albums', { params: filters }),
  
  getAlbum: (albumId: string) =>
    apiClient.get<Album>(`/albums/${albumId}`),
  
  createAlbum: (data: any) =>
    apiClient.post<Album>('/albums', data),
  
  updateAlbum: (albumId: string, data: any) =>
    apiClient.put<Album>(`/albums/${albumId}`, data),
  
  deleteAlbum: (albumId: string) =>
    apiClient.delete(`/albums/${albumId}`),
  
  likeAlbum: (albumId: string) =>
    apiClient.post(`/albums/${albumId}/like`),
  
  unlikeAlbum: (albumId: string) =>
    apiClient.delete(`/albums/${albumId}/like`),
};
