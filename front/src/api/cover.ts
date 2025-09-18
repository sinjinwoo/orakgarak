/**
 * 커버 생성 API 모듈
 * 실제 백엔드 연동 전까지는 mock 데이터 사용
 */

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
  count: number = 3
): Promise<GeneratedCover[]> {
  // 600ms ~ 1200ms 랜덤 지연으로 실제 API 느낌 시뮬레이션
  const delay = Math.random() * 600 + 600;
  await new Promise(resolve => setTimeout(resolve, delay));

  // 5% 확률로 에러 시뮬레이션
  if (Math.random() < 0.05) {
    throw new Error('AI 커버 생성에 실패했습니다. 다시 시도해주세요.');
  }

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

export async function uploadCover(file: File): Promise<string> {
  // 파일 업로드 시뮬레이션
  const delay = Math.random() * 800 + 400;
  await new Promise(resolve => setTimeout(resolve, delay));

  // 실제로는 서버에 업로드하고 URL 받아옴
  return URL.createObjectURL(file);
}