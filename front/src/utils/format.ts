/**
 * 포맷팅 유틸리티 함수들
 */

// 시간 포맷팅 (초를 mm:ss 형식으로)
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 시간 포맷팅 (밀리초를 mm:ss.xx 형식으로)
export function formatTimeMs(milliseconds: number): string {
  if (isNaN(milliseconds) || milliseconds < 0) {
    return '00:00.00';
  }
  
  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((milliseconds % 1000) / 10);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

// 날짜 포맷팅 (상대적 시간)
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '방금 전';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}개월 전`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years}년 전`;
  }
}

// 날짜 포맷팅 (YYYY-MM-DD)
export function formatDate(date: string | Date): string {
  const targetDate = new Date(date);
  const year = targetDate.getFullYear();
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// 날짜 포맷팅 (YYYY년 MM월 DD일)
export function formatDateKorean(date: string | Date): string {
  const targetDate = new Date(date);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
}

// 숫자 포맷팅 (천 단위 콤마)
export function formatNumber(num: number): string {
  if (isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString('ko-KR');
}

// 큰 숫자 포맷팅 (K, M 단위)
export function formatLargeNumber(num: number): string {
  if (isNaN(num)) {
    return '0';
  }
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
}

// 파일 크기 포맷팅
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 퍼센트 포맷팅
export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value)) {
    return '0%';
  }
  
  return `${value.toFixed(decimals)}%`;
}

// 점수 포맷팅 (0-100)
export function formatScore(score: number): string {
  if (isNaN(score)) {
    return '0점';
  }
  
  return `${Math.round(score)}점`;
}

// 주파수 포맷팅 (Hz)
export function formatFrequency(frequency: number): string {
  if (isNaN(frequency) || frequency <= 0) {
    return '0 Hz';
  }
  
  if (frequency >= 1000) {
    return `${(frequency / 1000).toFixed(1)} kHz`;
  } else {
    return `${frequency.toFixed(1)} Hz`;
  }
}

// 템포 포맷팅 (BPM)
export function formatTempo(bpm: number): string {
  if (isNaN(bpm)) {
    return '0 BPM';
  }
  
  return `${Math.round(bpm)} BPM`;
}

// 텍스트 자르기 (말줄임표)
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}

// 텍스트 하이라이트 (검색어 강조)
export function highlightText(text: string, searchTerm: string): string {
  if (!searchTerm || !text) {
    return text;
  }
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// URL 유효성 검사
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 이메일 유효성 검사
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 전화번호 포맷팅 (한국)
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  return phone;
}

// 색상 코드 변환 (RGB to Hex)
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// 색상 코드 변환 (Hex to RGB)
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// 랜덤 ID 생성
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// 딜레이 함수 (Promise 기반)
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 스로틀 함수
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
