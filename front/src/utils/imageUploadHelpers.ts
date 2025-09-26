/**
 * 이미지 업로드 관련 헬퍼 유틸리티
 */

export interface UploadRetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

/**
 * 지수 백오프를 사용한 재시도 로직
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: UploadRetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`업로드 시도 ${attempt}/${maxRetries} 실패:`, error);

      if (attempt < maxRetries) {
        console.log(`${delay}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }

  throw lastError!;
}

/**
 * 이미지 파일 압축
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8 } = options;

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // 비율 유지하며 크기 조정
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // 고품질 렌더링 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      console.warn('이미지 압축 실패, 원본 파일 사용');
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 파일 유효성 검사
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // MIME 타입 검사
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: 'JPG, PNG, WebP 형식만 지원됩니다.',
    };
  }

  // 파일 크기 검사 (50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: '파일 크기는 50MB 이하여야 합니다.',
    };
  }

  // 파일 확장자 검사 (추가 보안)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: '허용되지 않는 파일 형식입니다.',
    };
  }

  return { isValid: true };
}

/**
 * 업로드 진행률 추적을 위한 Progress 이벤트 핸들러
 */
export function createProgressHandler(
  onProgress?: (progress: number) => void
) {
  return (progressEvent: ProgressEvent) => {
    if (progressEvent.lengthComputable && onProgress) {
      const progress = (progressEvent.loaded / progressEvent.total) * 100;
      onProgress(Math.round(progress));
    }
  };
}

/**
 * 에러 메시지 개선
 */
export function getUploadErrorMessage(error: any): string {
  if (error.response?.status === 413) {
    return '파일이 너무 큽니다. 더 작은 이미지를 선택해주세요.';
  }

  if (error.response?.status === 415) {
    return '지원하지 않는 이미지 형식입니다.';
  }

  if (error.response?.status === 429) {
    return '업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  }

  if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
    return '업로드 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.';
  }

  if (error.message?.includes('Network Error')) {
    return '네트워크 연결을 확인해주세요.';
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return '이미지 업로드에 실패했습니다. 다시 시도해주세요.';
}