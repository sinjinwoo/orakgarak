import React, { useState, useEffect, useRef } from 'react';

interface LyricsPanelProps {
  selectedSong?: {
    id: string;
    title: string;
    artist: string;
    lyrics?: string;
    albumCoverUrl?: string;
  };
  currentTime: number;
  isPlaying: boolean;
  onFlip: () => void;
}

interface ParsedLyric {
  text: string;
  startTime: number;
}

const LyricsPanel: React.FC<LyricsPanelProps> = ({ 
  selectedSong, 
  currentTime, 
  isPlaying, 
  onFlip 
}) => {
  const [parsedLyrics, setParsedLyrics] = useState<ParsedLyric[]>([]);
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [processedSongId, setProcessedSongId] = useState<string>('');
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // 선택된 노래가 변경될 때 가사 파싱
  useEffect(() => {
    console.log('🎵 LyricsPanel - 노래 변경 감지');
    console.log('📋 받은 selectedSong 전체 데이터:', selectedSong);
    console.log('📋 selectedSong 타입:', typeof selectedSong);
    console.log('📋 selectedSong 키들:', selectedSong ? Object.keys(selectedSong) : 'undefined');

    if (!selectedSong) {
      console.log('🚫 selectedSong이 없음');
      setParsedLyrics([]);
      setCurrentLine(0);
      setProcessedSongId('');
      return;
    }

    console.log('✅ selectedSong 존재 확인');
    console.log('- ID:', selectedSong.id, '(타입:', typeof selectedSong.id, ')');
    console.log('- 제목:', selectedSong.title);
    console.log('- 아티스트:', selectedSong.artist);
    console.log('- 가사 존재:', !!selectedSong.lyrics);
    console.log('- 가사 타입:', typeof selectedSong.lyrics);
    console.log('- 가사 길이:', selectedSong.lyrics?.length || 0);

    // 새 노래이거나 가사가 업데이트된 경우만 파싱
    const currentSongKey = `${selectedSong.id}_${selectedSong.lyrics ? selectedSong.lyrics.length : 0}`;
    if (processedSongId === currentSongKey && selectedSong.lyrics) {
      console.log('🔄 이미 처리된 노래, 파싱 스킵');
      return;
    }

    setProcessedSongId(currentSongKey);
    console.log('🆔 새 노래 키 설정:', currentSongKey);

    // 가사가 없는 경우 빈 배열 사용
    if (!selectedSong.lyrics || selectedSong.lyrics.trim() === '') {
      console.log('📝 가사 없음 - 빈 가사 표시');
      setParsedLyrics([]);
      setCurrentLine(0);
      return;
    }
    
    // 가사가 있는 경우 파싱 진행
    console.log('🎵 가사 파싱 시작:', selectedSong.title);
    console.log('📝 가사 데이터 샘플 (첫 100자):', selectedSong.lyrics.substring(0, 100));

    // 정규식으로 직접 파싱 - 가장 안정적인 방법
    try {
      const lyricsText = selectedSong.lyrics;
      
      // 'words'와 'startTimeMs' 패턴 찾기 (Python dict 형태 지원)
      const wordMatches = [...lyricsText.matchAll(/'words':\s*'([^']*(?:''[^']*)*)'/g)];
      const timeMatches = [...lyricsText.matchAll(/'startTimeMs':\s*'(\d+)'/g)];
      
      console.log('📋 찾은 words 개수:', wordMatches.length);
      console.log('📋 찾은 time 개수:', timeMatches.length);
      
      if (wordMatches.length > 0 && timeMatches.length > 0) {
        const newParsedLyrics: ParsedLyric[] = [];
        const maxLength = Math.min(wordMatches.length, timeMatches.length);
        
        for (let i = 0; i < maxLength; i++) {
          const words = wordMatches[i][1]
            .replace(/''/g, "'") // '' -> ' 변환
            .replace(/\\'/g, "'") // \' -> ' 변환
            .trim();
          const startTimeMs = parseInt(timeMatches[i][1]);
          
          // 빈 가사나 음악 기호 제외
          if (words && words !== '' && words !== '♪') {
            newParsedLyrics.push({
              text: words,
              startTime: startTimeMs / 1000 // ms를 초로 변환
            });
          }
        }
        
        console.log('✅ 파싱 성공:', newParsedLyrics.length, '줄');
        console.log('📋 첫 5줄 샘플:', newParsedLyrics.slice(0, 5));
        setParsedLyrics(newParsedLyrics);
        setCurrentLine(0);
      } else {
        console.log('❌ 가사 패턴을 찾을 수 없음');
        setParsedLyrics([]);
        setCurrentLine(0);
      }
    } catch (error) {
      console.error('❌ 가사 파싱 실패:', error);
      setParsedLyrics([]);
      setCurrentLine(0);
    }
  }, [selectedSong, processedSongId]);

  // 현재 시간에 따른 가사 라인 업데이트 - 정밀한 싱크
  useEffect(() => {
    if (parsedLyrics.length === 0 || !isPlaying) return;

    console.log('🎵 가사 싱크 업데이트:', {
      currentTime: Math.floor(currentTime),
      totalLyrics: parsedLyrics.length,
      currentLine: currentLine
    });

    // 현재 시간에 맞는 가사 라인 찾기 - 더 정확한 로직
    let newCurrentLine = 0;
    
    // 현재 시간보다 작거나 같은 시작 시간을 가진 마지막 라인 찾기
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (parsedLyrics[i].startTime <= currentTime + 0.5) { // 0.5초 여유
        newCurrentLine = i;
      } else {
        break;
      }
    }

    // 다음 가사가 곧 나올 예정이면 미리 준비 (1초 전)
    const nextLine = newCurrentLine + 1;
    if (nextLine < parsedLyrics.length) {
      const timeToNext = parsedLyrics[nextLine].startTime - currentTime;
      if (timeToNext <= 1 && timeToNext > 0) {
        console.log('🔜 다음 가사 준비:', {
          nextLine,
          timeToNext: timeToNext.toFixed(1),
          nextText: parsedLyrics[nextLine].text.substring(0, 20)
        });
      }
    }

    if (newCurrentLine !== currentLine) {
      console.log('📝 가사 라인 변경:', {
        from: currentLine,
        to: newCurrentLine,
        text: parsedLyrics[newCurrentLine]?.text.substring(0, 30)
      });
      
      setCurrentLine(newCurrentLine);
      
      // 현재 가사로 부드럽게 스크롤 - 더 정확한 타이밍
      if (lyricsContainerRef.current) {
        const lineElement = lyricsContainerRef.current.children[newCurrentLine] as HTMLElement;
        if (lineElement) {
          // 스크롤 애니메이션 최적화
          setTimeout(() => {
            lineElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }, 100); // 약간의 지연으로 더 자연스러운 스크롤
        }
      }
    }
  }, [currentTime, parsedLyrics, currentLine, isPlaying]);

  return (
      <div style={{ 
      width: '100%',
      height: '100%',
        display: 'flex', 
      flexDirection: 'column',
      background: `
        linear-gradient(145deg, 
          rgba(15, 15, 25, 0.95) 0%,
          rgba(25, 15, 35, 0.92) 50%,
          rgba(15, 15, 25, 0.95) 100%
        )
      `,
      borderRadius: '16px',
      border: '1px solid rgba(0, 255, 255, 0.3)',
      boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 0 60px rgba(0, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.05)
      `,
      overflow: 'hidden',
      position: 'relative',
      backdropFilter: 'blur(10px)'
    }}>
      {/* 미니멀 배경 효과 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 10% 20%, rgba(0, 255, 255, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 90% 80%, rgba(255, 0, 128, 0.05) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* 헤더 - 모던 미니멀 */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        <h3 style={{
          color: '#00ffff',
          fontSize: '1.1rem',
          fontWeight: '600',
          margin: '0',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.6)',
          letterSpacing: '1px'
        }}>
          🎵 가사
        </h3>
        {selectedSong && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '8px',
            gap: '8px'
          }}>
            {/* 앨범 커버 */}
            {selectedSong.albumCoverUrl && (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(0, 255, 255, 0.4)',
                boxShadow: '0 0 8px rgba(0, 255, 255, 0.3)'
              }}>
                <img 
                  src={selectedSong.albumCoverUrl} 
                  alt="album cover"
            style={{
              width: '100%',
                    height: '100%',
                    objectFit: 'cover'
            }}
          />
        </div>
      )}
            <p style={{
              color: '#ffffff',
              fontSize: '0.9rem',
              margin: '0',
              fontWeight: '500'
            }}>
              <span style={{ color: '#00ffff' }}>{selectedSong.title}</span>
              <span style={{ color: '#666', margin: '0 6px' }}>•</span>
              <span style={{ color: '#ff0080' }}>{selectedSong.artist}</span>
            </p>
          </div>
        )}
      </div>

      {/* 가사 영역 - 모던 스크롤 */}
      <div 
        ref={lyricsContainerRef}
                style={{
          flex: 1,
          padding: '16px 20px',
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 255, 255, 0.4) rgba(15, 15, 25, 0.3)',
        }}
        className="custom-scrollbar"
      >
        {parsedLyrics.length === 0 ? (
      <div style={{ 
        display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        justifyContent: 'center',
            height: '100%',
            color: '#666',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.3 }}>📝</div>
            <p style={{ fontSize: '1.1rem', margin: '0' }}>가사가 없습니다</p>
            {selectedSong && (
              <p style={{ fontSize: '0.9rem', margin: '8px 0 0 0', opacity: 0.7 }}>
                {selectedSong.title}에 대한 가사를 찾을 수 없습니다
              </p>
            )}
          </div>
        ) : (
          parsedLyrics.map((lyric, index) => (
            <div
              key={index}
          style={{
                padding: '12px 16px',
                margin: '4px 0',
                borderRadius: '8px',
                fontSize: '1rem',
                lineHeight: '1.6',
                transition: 'all 0.3s ease',
            cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                ...(index === currentLine ? {
                  // 현재 재생 중인 가사 - 강조
                  background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.15), rgba(255, 0, 128, 0.15))',
                  color: '#ffffff',
                  fontWeight: '600',
                  textShadow: '0 0 12px rgba(0, 255, 255, 0.8)',
                  border: '1px solid rgba(0, 255, 255, 0.4)',
                  transform: 'translateX(8px) scale(1.02)',
                  boxShadow: '0 4px 16px rgba(0, 255, 255, 0.2)'
                } : index < currentLine ? {
                  // 이미 지나간 가사 - 흐리게
                  color: '#555',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  opacity: 0.6
                } : {
                  // 아직 나오지 않은 가사 - 기본
                  color: '#aaa',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(0, 255, 255, 0.1)',
                  opacity: 0.8
                })
          }}
          onMouseEnter={(e) => {
                if (index !== currentLine) {
                  e.currentTarget.style.background = 'rgba(0, 255, 255, 0.08)';
                  e.currentTarget.style.border = '1px solid rgba(0, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.opacity = '1';
                }
          }}
          onMouseLeave={(e) => {
                if (index !== currentLine) {
                  e.currentTarget.style.background = index < currentLine ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.border = index < currentLine ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.opacity = index < currentLine ? '0.6' : '0.8';
                }
              }}
            >
              {/* 현재 라인 표시기 */}
              {index === currentLine && (
                <div style={{
                  position: 'absolute',
                  left: '-8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '70%',
                  background: 'linear-gradient(180deg, #00ffff, #ff0080)',
                  borderRadius: '2px',
                  boxShadow: '0 0 8px rgba(0, 255, 255, 0.6)'
                }} />
              )}
              
              {/* 가사 텍스트 */}
              {lyric.text}
            </div>
          ))
        )}
      </div>

      {/* 플립 버튼 - 모던 미니멀 */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(0, 255, 255, 0.15)',
        textAlign: 'center'
      }}>
        <button
          onClick={onFlip}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(45deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 128, 0.2))',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '20px',
            color: '#00ffff',
            fontSize: '0.85rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textShadow: '0 0 8px rgba(0, 255, 255, 0.6)',
            boxShadow: '0 2px 8px rgba(0, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.background = 'linear-gradient(45deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 128, 0.3))';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 255, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'linear-gradient(45deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 128, 0.2))';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 255, 255, 0.2)';
          }}
        >
          MR 컨트롤
        </button>
      </div>

      {/* 오버레이 스크롤바 사용 (index.css의 .custom-scrollbar 클래스 활용) */}
    </div>
  );
};

export default LyricsPanel;