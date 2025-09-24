/**
 * 타입 호환성을 위한 유틸리티 함수들
 * 
 * 프론트엔드와 백엔드 간의 타입 불일치를 해결하기 위해 사용됩니다.
 * 주로 ID 타입 변환과 데이터 정규화에 사용됩니다.
 * 
 * ## 데이터 흐름에서의 정규화 적용 위치:
 * 
 * 1. **API 서비스 레벨** (권장):
 *    - `services/api/recordings.ts` - getMyRecordings(), getRecording()
 *    - `services/api/songs.ts` - searchSongs()
 *    - `services/api/albums.ts` - getAlbums(), getAlbum()
 * 
 * 2. **컴포넌트 레벨** (필요시):
 *    - 외부 API 데이터 처리 시
 *    - 레거시 코드와의 호환성이 필요한 경우
 * 
 * ## 주의사항:
 * - 정규화는 한 번만 적용되어야 합니다 (중복 적용 방지)
 * - null/undefined 체크를 반드시 포함해야 합니다
 * - 기본값 제공으로 런타임 에러를 방지합니다
 */

/**
 * ID를 string으로 변환
 * @param id - 변환할 ID (string 또는 number)
 * @returns string 형태의 ID
 * @usage Set이나 Map에서 키로 사용할 때
 */
export const toStringId = (id: string | number): string => {
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return id.toString();
  throw new Error(`Invalid ID type: ${typeof id}`);
};

/**
 * ID를 number로 변환
 * @param id - 변환할 ID (string 또는 number)
 * @returns number 형태의 ID
 * @usage API 호출 시 백엔드로 전송할 때
 */
export const toNumberId = (id: string | number): number => {
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) throw new Error(`Cannot convert "${id}" to number`);
    return parsed;
  }
  throw new Error(`Invalid ID type: ${typeof id}`);
};

/**
 * ID 비교 (타입에 관계없이)
 * @param id1 - 첫 번째 ID
 * @param id2 - 두 번째 ID
 * @returns 두 ID가 같은지 여부
 */
export const compareIds = (id1: string | number, id2: string | number): boolean => {
  try {
    return toStringId(id1) === toStringId(id2);
  } catch {
    return false;
  }
};

/**
 * Recording 데이터 정규화
 * 
 * 백엔드 API 응답과 프론트엔드 컴포넌트 간의 호환성을 위해
 * 누락된 속성들을 추가하고 데이터 형식을 통일합니다.
 * 
 * @param recording - 백엔드에서 받은 Recording 데이터
 * @returns 정규화된 Recording 객체
 * 
 * @example
 * const normalized = normalizeRecording(apiResponse);
 * console.log(normalized.song.title); // 안전하게 접근 가능
 */
export const normalizeRecording = (recording: any): any => {
  if (!recording) return null;
  
  // 백엔드 RecordResponseDTO 응답을 그대로 반환 (정규화 없이)
  // 호환성을 위한 최소한의 매핑만 추가
  return {
    ...recording,
    // 호환성 매핑 (기존 컴포넌트가 사용할 수 있도록)
    publicUrl: recording.url,
    audioUrl: recording.url,
    duration: recording.durationSeconds,
    processingStatus: recording.urlStatus === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
    song: {
      title: recording.title || 'Unknown Title',
      artist: 'Unknown Artist',
    },
  };
};

/**
 * Song 데이터 정규화
 * 
 * 백엔드 API와 외부 API(Spotify, Kakao) 간의 속성명 차이를 해결합니다.
 * 
 * @param song - 정규화할 Song 데이터
 * @returns 정규화된 Song 객체
 * 
 * @example
 * const spotifySong = { songName: "Title", artistName: "Artist", durationMs: 180000 };
 * const normalized = normalizeSong(spotifySong);
 * console.log(normalized.title); // "Title"
 * console.log(normalized.duration); // 180
 */
export const normalizeSong = (song: any): any => {
  if (!song) return null;
  
  return {
    ...song,
    // 제목 호환성
    title: song.title || song.songName || 'Unknown Title',
    
    // 아티스트 호환성  
    artist: song.artist || song.artistName || 'Unknown Artist',
    
    // 재생 시간 호환성 (초 단위로 통일)
    duration: song.duration || Math.floor((song.durationMs || 0) / 1000) || 0,
    
    // 외부 ID 호환성
    youtubeId: song.youtubeId || song.spotifyTrackId || '',
  };
};

/**
 * Album 데이터 정규화
 * 
 * 앨범 데이터에 누락된 UI 표시용 속성들을 추가합니다.
 * 
 * @param album - 정규화할 Album 데이터
 * @returns 정규화된 Album 객체
 * 
 * @example
 * const album = { title: "My Album", createdAt: "2023-01-01T00:00:00Z" };
 * const normalized = normalizeAlbum(album);
 * console.log(normalized.year); // "2023"
 */
export const normalizeAlbum = (album: any): any => {
  if (!album) return null;

  return {
    ...album,
    // 연도 정보 추가 (UI 표시용)
    year: album.year || new Date(album.createdAt || Date.now()).getFullYear().toString(),

    // 커버 이미지: 없을 경우 null로 설정 (기본 그라데이션 표시를 위해)
    coverImageUrl: album.coverImageUrl || null,
  };
};
