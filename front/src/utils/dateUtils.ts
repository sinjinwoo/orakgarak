/**
 * 날짜 관련 유틸리티 함수들
 */

/**
 * 활동 시작일 포맷팅 (YYYY. M. D.부터 활동)
 */
export const formatActivityStartDate = (createdAt: string): string => {
  const date = new Date(createdAt);
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.부터 활동`;
};

/**
 * 년도만 추출 (YYYY)
 */
export const extractYear = (createdAt: string): string => {
  const date = new Date(createdAt);
  return date.getFullYear().toString();
};

/**
 * 한국어 날짜 포맷팅 (M월 D일)
 */
export const formatKoreanDate = (createdAt: string): string => {
  const date = new Date(createdAt);
  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric"
  });
};

/**
 * 상대적 시간 포맷팅 (N분 전, N시간 전, N일 전 등)
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  
  // 분 단위 차이
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  // 1분 미만
  if (diffMinutes < 1) return '방금 전';
  
  // 1시간 미만
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  
  // 24시간 미만
  if (diffHours < 24) return `${diffHours}시간 전`;
  
  // 7일 미만
  if (diffDays < 7) return `${diffDays}일 전`;
  
  // 4주 미만
  if (diffWeeks < 4) return `${diffWeeks}주 전`;
  
  // 12개월 미만
  if (diffMonths < 12) return `${diffMonths}개월 전`;
  
  // 1년 이상
  return `${diffYears}년 전`;
};

/**
 * ISO 날짜 문자열을 YYYY-MM-DD 형식으로 변환
 */
export const formatISODate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 날짜가 유효한지 확인
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
