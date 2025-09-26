/**
 * 커버 생성 API 모듈
 * AI 기반 앨범 커버 생성 및 업로드 기능
 */

import apiClient from "./client";
import type { CoverParams, GeneratedCover } from "../../types/cover";

interface GenerateCoverRequest {
  uploadIds: number[];
  aspectRatio: string;
  safetyFilterLevel: string;
  personGeneration: string;
}

interface GenerateCoverResponse {
  uploadId: number;
  presignedUrl: string;
  s3Key: string;
  originalFileName: string;
}

export async function generateCovers(
  uploadIds: number[]
): Promise<GeneratedCover> {
  try {
    const requestData: GenerateCoverRequest = {
      uploadIds,
      aspectRatio: "1:1",
      safetyFilterLevel: "block_most",
      personGeneration: "dont_allow",
    };

    const response = await apiClient.post<GenerateCoverResponse>(
      "/albums/covers/generate",
      requestData
    );

    return {
      id: `cover_${response.data.uploadId}_${Date.now()}`,
      imageUrl: response.data.presignedUrl,
      params: {},
      createdAt: new Date().toISOString(),
      favorite: false,
      uploadId: response.data.uploadId,
      s3Key: response.data.s3Key,
      originalFileName: response.data.originalFileName,
    };
  } catch (error) {
    console.error("AI 커버 생성 실패:", error);
    throw error;
  }
}

export async function uploadCover(file: File): Promise<{
  uploadId: number;
  imageUrl: string;
}> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/albums/covers/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60초로 연장 (이미지 업로드는 시간이 더 걸릴 수 있음)
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          console.log(`업로드 진행률: ${Math.round(progress)}%`);
        }
      },
    });

    return {
      uploadId: response.data.uploadId,
      imageUrl: response.data.presignedUrl,
    };
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    throw error;
  }
}
