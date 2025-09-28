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
 * 상대적 시간 포맷팅 (N일 전, N시간 전 등)
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '1일 전';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
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
