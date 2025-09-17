/**
 * 곡 정보 타입 정의
 * - 예약 큐와 검색에서 사용되는 곡 데이터 구조
 */

export interface Song {
  id: number;        // 곡 고유 ID
  title: string;     // 곡 제목
  artist: string;    // 아티스트명
  genre: string;     // 장르
  duration: string;  // 재생 시간
  youtubeId?: string; // 유튜브 MR 영상 ID (선택)
}