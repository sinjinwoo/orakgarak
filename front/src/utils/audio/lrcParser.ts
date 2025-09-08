/**
 * LRC (Lyrics) 파일 파싱 유틸리티
 */

export interface LyricLine {
  time: number; // 밀리초
  text: string;
  timestamp: string; // [mm:ss.xx] 형식
}

export interface ParsedLyrics {
  lines: LyricLine[];
  metadata: {
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
  };
}

// LRC 파일 파싱
export function parseLRC(lrcContent: string): ParsedLyrics {
  const lines = lrcContent.split('\n');
  const lyricLines: LyricLine[] = [];
  const metadata: ParsedLyrics['metadata'] = {};

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;

    // 메타데이터 파싱 [ti:제목], [ar:아티스트], [al:앨범], [length:길이]
    if (trimmedLine.startsWith('[') && trimmedLine.includes(':')) {
      const match = trimmedLine.match(/^\[(\w+):(.+)\]$/);
      if (match) {
        const [, key, value] = match;
        switch (key.toLowerCase()) {
          case 'ti':
            metadata.title = value;
            break;
          case 'ar':
            metadata.artist = value;
            break;
          case 'al':
            metadata.album = value;
            break;
          case 'length':
            metadata.duration = parseFloat(value);
            break;
        }
      }
      continue;
    }

    // 시간 태그가 있는 가사 라인 파싱
    const timeMatch = trimmedLine.match(/^\[(\d{2}):(\d{2})\.(\d{2})\](.*)$/);
    if (timeMatch) {
      const [, minutes, seconds, centiseconds, text] = timeMatch;
      const time = parseInt(minutes) * 60000 + parseInt(seconds) * 1000 + parseInt(centiseconds) * 10;
      
      lyricLines.push({
        time,
        text: text.trim(),
        timestamp: `[${minutes}:${seconds}.${centiseconds}]`
      });
    }
  }

  // 시간순으로 정렬
  lyricLines.sort((a, b) => a.time - b.time);

  return {
    lines: lyricLines,
    metadata
  };
}

// 현재 재생 시간에 맞는 가사 라인 찾기
export function getCurrentLyricLine(
  lyrics: ParsedLyrics,
  currentTime: number
): LyricLine | null {
  const { lines } = lyrics;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].time <= currentTime) {
      return lines[i];
    }
  }
  
  return null;
}

// 다음 가사 라인 찾기
export function getNextLyricLine(
  lyrics: ParsedLyrics,
  currentTime: number
): LyricLine | null {
  const { lines } = lyrics;
  
  for (const line of lines) {
    if (line.time > currentTime) {
      return line;
    }
  }
  
  return null;
}

// 가사 하이라이트를 위한 라인 인덱스 찾기
export function getLyricLineIndex(
  lyrics: ParsedLyrics,
  currentTime: number
): number {
  const { lines } = lyrics;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].time <= currentTime) {
      return i;
    }
  }
  
  return -1;
}

// 가사 텍스트만 추출 (시간 태그 제거)
export function extractLyricText(lyrics: ParsedLyrics): string[] {
  return lyrics.lines.map(line => line.text).filter(text => text.trim());
}

// 가사 검색
export function searchLyrics(
  lyrics: ParsedLyrics,
  query: string,
  caseSensitive: boolean = false
): LyricLine[] {
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  
  return lyrics.lines.filter(line => {
    const text = caseSensitive ? line.text : line.text.toLowerCase();
    return text.includes(searchQuery);
  });
}

// 가사 통계 정보
export function getLyricsStats(lyrics: ParsedLyrics): {
  totalLines: number;
  totalWords: number;
  averageWordsPerLine: number;
  duration: number;
} {
  const { lines } = lyrics;
  const totalWords = lines.reduce((count, line) => {
    return count + line.text.split(/\s+/).filter(word => word.trim()).length;
  }, 0);
  
  const duration = lines.length > 0 ? lines[lines.length - 1].time : 0;
  
  return {
    totalLines: lines.length,
    totalWords,
    averageWordsPerLine: lines.length > 0 ? Math.round(totalWords / lines.length) : 0,
    duration
  };
}

// 가사 동기화 검증
export function validateLyricsSync(lyrics: ParsedLyrics): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const { lines } = lyrics;
  
  // 시간 순서 검증
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].time < lines[i - 1].time) {
      issues.push(`시간 순서 오류: 라인 ${i} (${lines[i].timestamp})가 이전 라인보다 빠름`);
    }
  }
  
  // 중복 시간 검증
  const timeMap = new Map<number, number>();
  lines.forEach((line, index) => {
    if (timeMap.has(line.time)) {
      issues.push(`중복 시간: 라인 ${index}와 라인 ${timeMap.get(line.time)}이 같은 시간 (${line.timestamp})`);
    } else {
      timeMap.set(line.time, index);
    }
  });
  
  // 빈 가사 라인 검증
  lines.forEach((line, index) => {
    if (!line.text.trim()) {
      issues.push(`빈 가사 라인: 라인 ${index} (${line.timestamp})`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// 가사 포맷팅 (HTML 변환)
export function formatLyricsHTML(
  lyrics: ParsedLyrics,
  currentTime: number,
  highlightClass: string = 'highlight'
): string {
  const currentIndex = getLyricLineIndex(lyrics, currentTime);
  
  return lyrics.lines.map((line, index) => {
    const isCurrent = index === currentIndex;
    const className = isCurrent ? highlightClass : '';
    
    return `<div class="lyric-line ${className}" data-time="${line.time}">${line.text}</div>`;
  }).join('\n');
}

// 가사 내보내기 (LRC 형식)
export function exportLRC(lyrics: ParsedLyrics): string {
  const lines: string[] = [];
  
  // 메타데이터 추가
  if (lyrics.metadata.title) {
    lines.push(`[ti:${lyrics.metadata.title}]`);
  }
  if (lyrics.metadata.artist) {
    lines.push(`[ar:${lyrics.metadata.artist}]`);
  }
  if (lyrics.metadata.album) {
    lines.push(`[al:${lyrics.metadata.album}]`);
  }
  if (lyrics.metadata.duration) {
    lines.push(`[length:${lyrics.metadata.duration}]`);
  }
  
  // 빈 줄 추가
  if (lines.length > 0) {
    lines.push('');
  }
  
  // 가사 라인 추가
  lyrics.lines.forEach(line => {
    lines.push(`${line.timestamp}${line.text}`);
  });
  
  return lines.join('\n');
}
