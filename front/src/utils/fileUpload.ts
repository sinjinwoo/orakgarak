import axios, { AxiosProgressEvent } from 'axios';
import { UploadProgress } from '../types/recording';

export interface S3UploadOptions {
  presignedUrl: string;
  file: Blob;
  contentType: string;
  onProgress?: (progress: UploadProgress) => void;
  uploadId: string;
}

export interface UploadResult {
  success: boolean;
  uploadId: string;
  error?: string;
}

export class FileUploadError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public uploadId?: string
  ) {
    super(message);
    this.name = 'FileUploadError';
  }
}

export const uploadToS3 = async (options: S3UploadOptions): Promise<UploadResult> => {
  const { presignedUrl, file, contentType, onProgress, uploadId } = options;

  try {
    const response = await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': contentType,
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress: UploadProgress = {
            uploadId,
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
            status: 'uploading',
          };
          onProgress(progress);
        }
      },
      timeout: 10 * 60 * 1000, // 10분 타임아웃
    });

    if (response.status === 200) {
      if (onProgress) {
        const completedProgress: UploadProgress = {
          uploadId,
          loaded: file.size,
          total: file.size,
          percentage: 100,
          status: 'completed',
        };
        onProgress(completedProgress);
      }

      return {
        success: true,
        uploadId,
      };
    } else {
      throw new FileUploadError(
        `Upload failed with status: ${response.status}`,
        response.status,
        uploadId
      );
    }
  } catch (error) {
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error instanceof Error
      ? error.message
      : 'Upload failed';

    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;

    if (onProgress) {
      const errorProgress: UploadProgress = {
        uploadId,
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'error',
        error: errorMessage,
      };
      onProgress(errorProgress);
    }

    throw new FileUploadError(errorMessage, statusCode, uploadId);
  }
};

export const validateAudioFile = (file: Blob, maxSizeInMB: number = 100): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    throw new Error(`파일 크기가 너무 큽니다. 최대 ${maxSizeInMB}MB까지 허용됩니다.`);
  }

  const supportedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm'];
  if (!supportedTypes.includes(file.type)) {
    throw new Error('지원되지 않는 파일 형식입니다. WAV, MP3, MP4, WebM 파일만 업로드 가능합니다.');
  }

  return true;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const retryUpload = async (
  uploadFn: () => Promise<UploadResult>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<UploadResult> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed');

      if (attempt === maxRetries) {
        throw lastError;
      }

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

export const createAudioBlobFromBuffer = (
  audioBuffer: AudioBuffer,
  mimeType: string = 'audio/wav'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start(0);

      offlineContext.startRendering().then((renderedBuffer) => {
        const audioData = new Float32Array(renderedBuffer.length * renderedBuffer.numberOfChannels);

        for (let channel = 0; channel < renderedBuffer.numberOfChannels; channel++) {
          const channelData = renderedBuffer.getChannelData(channel);
          for (let i = 0; i < channelData.length; i++) {
            audioData[i * renderedBuffer.numberOfChannels + channel] = channelData[i];
          }
        }

        const blob = new Blob([audioData], { type: mimeType });
        resolve(blob);
      }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};