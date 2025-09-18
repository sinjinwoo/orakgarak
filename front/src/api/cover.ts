/**
 * 커버 생성 API 모듈
 * AI 기반 앨범 커버 생성 및 업로드 기능
 */

import apiClient from '../services/apiClient';
import type { CoverParams, GeneratedCover } from '../types/cover';

const mockImages = [
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1511379938547-c1f198198718?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&bg=purple',
  'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&sat=30',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&hue=180',
];

export async function generateCovers(
  params: CoverParams,
  trackIds: string[],
  count: number = 3
): Promise<GeneratedCover[]> {
  try {
    // 백엔드 API로 AI 커버 생성 요청
    const response = await apiClient.post('/albums/covers/generate', {
      trackIds,
      params,
      count
    });

    return response.data.covers;
  } catch (error) {
    console.error('AI 커버 생성 실패:', error);

    // 백엔드 연동 실패 시 fallback으로 mock 데이터 사용
    const delay = Math.random() * 600 + 600;
    await new Promise(resolve => setTimeout(resolve, delay));

    const covers: GeneratedCover[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < count; i++) {
      const imageIndex = Math.floor(Math.random() * mockImages.length);
      covers.push({
        id: `cover_${Date.now()}_${i}`,
        imageUrl: mockImages[imageIndex],
        params: { ...params },
        createdAt: now,
        favorite: false,
      });
    }

    return covers;
  }
}

export async function uploadCover(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/albums/covers/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.imageUrl;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);

    // 백엔드 연동 실패 시 fallback으로 로컬 URL 사용
    const delay = Math.random() * 800 + 400;
    await new Promise(resolve => setTimeout(resolve, delay));

    return URL.createObjectURL(file);
  }
}