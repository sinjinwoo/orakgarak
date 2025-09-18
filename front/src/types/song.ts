/**
 * 곡 정보 타입 정의
 * - 예약 큐와 검색에서 사용되는 곡 데이터 구조
 */

export interface Song {
  id: number;        // 곡 고유 ID
  title: string;     // 곡 제목
  artist: string;    // 아티스트명
  albumName: string; // 앨범명
  duration: string;  // 재생 시간 (mm:ss 형식)
  albumCoverUrl?: string; // 앨범 커버 URL
  youtubeId?: string; // 유튜브 MR 영상 ID (선택)
}

// API 응답 타입 정의
export interface SongApiResponse {
  id: number;
  songId: number;
  songName: string;
  artistName: string;
  albumName: string;
  musicUrl: string;
  lyrics: string;
  albumCoverUrl: string;
  spotifyTrackId: string;
  durationMs: number | null;
  popularity: number | null;
  status: string;
}