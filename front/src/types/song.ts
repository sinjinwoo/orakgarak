// 곡 관련 타입 정의

export interface Song {
  id: number;
  songId: number;
  songName: string;
  artistName: string;
  albumName: string;
  musicUrl: string;
  lyrics: string; // JSON 문자열로 저장된 가사 데이터
  albumCoverUrl: string;
  spotifyTrackId: string;
  durationMs?: number;
  popularity?: number;
  status: string;
  
  // 호환성을 위한 추가 속성들
  title?: string;
  artist?: string;
  duration?: number;
  youtubeId?: string;
}

// 가사 데이터 구조 (lyrics JSON을 파싱했을 때)
export interface LyricsData {
  lyrics: {
    syncType: "LINE_SYNCED" | "UNSYNCED";
    lines: LyricsLine[];
    provider: string;
    providerLyricsId: string;
    providerDisplayName: string;
    syncLyricsUri: string;
    isDenseTypeface: boolean;
    alternatives: any[];
    language: string;
    isRtlLanguage: boolean;
    capStatus: string;
    previewLines: LyricsLine[];
  };
  colors: {
    background: number;
    text: number;
    highlightText: number;
  };
  hasVocalRemoval: boolean;
}

export interface LyricsLine {
  startTimeMs: string;
  words: string;
  syllables: any[];
  endTimeMs: string;
  transliteratedWords: string;
}

// 곡 검색 요청
export interface SongSearchRequest {
  keyword: string;
  limit?: number;
  offset?: number;
}

// 곡 검색 응답
export type SongSearchResponse = Song[];

// 특정 곡 조회 응답
export type SongDetailResponse = Song;
