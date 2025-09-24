// 전역 에러 처리 유틸리티

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}

// API 에러 타입 체크
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error.message === 'string';
};

// 에러 메시지 생성
export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        return '잘못된 요청입니다.';
      case 401:
        return '인증이 필요합니다.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 데이터를 찾을 수 없습니다.';
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return `서버 오류가 발생했습니다. (${error.response.status})`;
    }
  }
  
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return '네트워크 연결을 확인해주세요.';
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
};

// 에러 로깅
export const logError = (error: any, context?: string) => {
  const errorMessage = getErrorMessage(error);
  const logMessage = context ? `[${context}] ${errorMessage}` : errorMessage;
  
  console.error(logMessage, error);
  
  // 개발 환경에서만 상세 에러 정보 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: error?.message,
      statusCode: error?.response?.status,
      data: error?.response?.data,
      stack: error?.stack
    });
  }
};

// 에러 복구 가능성 체크
export const isRecoverableError = (error: any): boolean => {
  if (error?.response?.status) {
    // 4xx 에러는 대부분 복구 불가능
    if (error.response.status >= 400 && error.response.status < 500) {
      return false;
    }
    // 5xx 에러는 서버 문제로 복구 가능
    return error.response.status >= 500;
  }
  
  // 네트워크 에러는 복구 가능
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return true;
  }
  
  return false;
};

// 재시도 가능한 에러인지 체크
export const isRetryableError = (error: any): boolean => {
  if (error?.response?.status) {
    // 5xx 에러와 일부 4xx 에러는 재시도 가능
    return error.response.status >= 500 || error.response.status === 429;
  }
  
  // 네트워크 에러는 재시도 가능
  return error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error');
};

// 에러 타입 분류
export const getErrorType = (error: any): 'network' | 'server' | 'client' | 'unknown' => {
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return 'network';
  }
  
  if (error?.response?.status) {
    if (error.response.status >= 500) {
      return 'server';
    }
    if (error.response.status >= 400) {
      return 'client';
    }
  }
  
  return 'unknown';
};
