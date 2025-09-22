// 타입 호환성을 위한 유틸리티 함수들

// ID를 string으로 변환 (Set이나 Map에서 사용)
export const toStringId = (id: string | number): string => {
  return typeof id === 'string' ? id : id.toString();
};

// ID를 number로 변환 (API 호출에서 사용)
export const toNumberId = (id: string | number): number => {
  return typeof id === 'number' ? id : parseInt(id, 10);
};

// ID 비교 (타입에 관계없이)
export const compareIds = (id1: string | number, id2: string | number): boolean => {
  return toStringId(id1) === toStringId(id2);
};

// Recording 데이터 정규화 (호환성 속성 추가)
export const normalizeRecording = (recording: any): any => {
  return {
    ...recording,
    duration: recording.duration || recording.durationSeconds,
    audioUrl: recording.audioUrl || recording.publicUrl || '',
    song: recording.song || {
      title: recording.title || '',
      artist: recording.artistName || 'Unknown Artist',
    },
    analysis: recording.analysis || {
      overallScore: 0,
      pitchAccuracy: 0,
      tempoAccuracy: 0,
      vocalRange: { min: 0, max: 0 },
      toneAnalysis: { clarity: 0, brightness: 0, warmth: 0 },
      feedback: [],
    },
  };
};

// Song 데이터 정규화 (호환성 속성 추가)
export const normalizeSong = (song: any): any => {
  return {
    ...song,
    title: song.title || song.songName,
    artist: song.artist || song.artistName,
    duration: song.duration || Math.floor((song.durationMs || 0) / 1000),
    youtubeId: song.youtubeId || song.spotifyTrackId,
  };
};

// Album 데이터 정규화
export const normalizeAlbum = (album: any): any => {
  return {
    ...album,
    year: album.year || new Date(album.createdAt || Date.now()).getFullYear().toString(),
  };
};
