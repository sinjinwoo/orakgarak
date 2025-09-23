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

  console.log('=== S3 업로드 시작 ===');
  console.log('Upload ID:', uploadId);
  console.log('File size:', file.size, 'bytes');
  console.log('Content-Type:', contentType);
  console.log('Presigned URL:', presignedUrl);
  console.log('URL Origin:', new URL(presignedUrl).origin);
  console.log('Current Origin:', window.location.origin);

  try {
    // 첫 번째 시도: fetch API 사용
    console.log('Fetch 요청 시작...');
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
      // CORS 설정
      mode: 'cors',
      credentials: 'omit', // S3에서는 credentials 불필요
    });
    
    console.log('Fetch 응답 상태:', response.status, response.statusText);
    console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      console.log('✅ S3 업로드 성공 (fetch)');
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
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new FileUploadError(
        `Upload failed with status: ${response.status} - ${errorText}`,
        response.status,
        uploadId
      );
    }
  } catch (error) {
    console.error('=== S3 업로드 오류 ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error:', error);
    
    // CORS 관련 오류 체크
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🚨 CORS 오류 또는 네트워크 오류 발생');
      console.error('가능한 원인:');
      console.error('1. S3 버킷 CORS 설정에 localhost:5173이 없음');
      console.error('2. Presigned URL이 만료됨');
      console.error('3. 네트워크 연결 문제');
    }

    const errorMessage = error instanceof Error ? error.message : 'Upload failed';

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

    throw new FileUploadError(errorMessage, undefined, uploadId);
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

/**
 * WebM 오디오 Blob을 WAV 형식으로 변환
 */
export const convertWebMToWAV = async (webmBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // WAV 헤더 생성
          const numberOfChannels = audioBuffer.numberOfChannels;
          const sampleRate = audioBuffer.sampleRate;
          const length = audioBuffer.length;
          const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
          const view = new DataView(buffer);
          
          // WAV 헤더 작성
          const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
            }
          };

          // RIFF chunk descriptor
          writeString(0, 'RIFF');
          view.setUint32(4, 36 + length * numberOfChannels * 2, true);
          writeString(8, 'WAVE');

          // FMT sub-chunk
          writeString(12, 'fmt ');
          view.setUint32(16, 16, true); // SubChunk1Size (PCM)
          view.setUint16(20, 1, true); // AudioFormat (PCM)
          view.setUint16(22, numberOfChannels, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * numberOfChannels * 2, true); // ByteRate
          view.setUint16(32, numberOfChannels * 2, true); // BlockAlign
          view.setUint16(34, 16, true); // BitsPerSample

          // Data sub-chunk
          writeString(36, 'data');
          view.setUint32(40, length * numberOfChannels * 2, true);

          // 오디오 데이터 작성
          let offset = 44;
          for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
              const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
              view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
              offset += 2;
            }
          }

          const wavBlob = new Blob([buffer], { type: 'audio/wav' });
          resolve(wavBlob);
        } catch (error) {
          reject(new Error(`오디오 변환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`));
        }
      };

      fileReader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };

      fileReader.readAsArrayBuffer(webmBlob);
    } catch (error) {
      reject(new Error(`WAV 변환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`));
    }
  });
};