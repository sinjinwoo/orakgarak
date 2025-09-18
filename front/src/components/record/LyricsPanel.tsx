import React, { useState, useEffect, useRef } from 'react';

interface LyricsPanelProps {
  selectedSong?: {
    id: string;
    title: string;
    artist: string;
    lyrics?: string;
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
        linear-gradient(135deg, 
          rgba(10, 0, 30, 0.98) 0%,
          rgba(30, 0, 50, 0.95) 25%,
          rgba(20, 10, 40, 0.95) 50%,
          rgba(40, 0, 60, 0.95) 75%,
          rgba(15, 5, 35, 0.98) 100%
        ),
        radial-gradient(circle at 20% 20%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 0, 128, 0.1) 0%, transparent 50%)
      `,
      borderRadius: '20px',
      border: '2px solid rgba(0, 255, 255, 0.4)',
      boxShadow: `
        0 0 30px rgba(0, 255, 255, 0.3),
        0 0 60px rgba(255, 0, 128, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        inset 0 -1px 0 rgba(0, 0, 0, 0.3)
      `,
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* 사이버펑크 배경 효과 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.03) 2px,
            rgba(0, 255, 255, 0.03) 4px
          )
        `,
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      {/* 네온 그리드 효과 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        opacity: 0.3,
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* 헤더 */}
      <div style={{
        padding: '20px',
        borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
        textAlign: 'center',
        background: `
          linear-gradient(90deg, 
            rgba(0, 255, 255, 0.1) 0%,
            rgba(255, 0, 128, 0.1) 50%,
            rgba(0, 255, 255, 0.1) 100%
          )
        `,
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.8), transparent)',
          boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
        }} />
        
        <h3 style={{
          color: '#00ffff',
          fontSize: '1.3rem',
          fontWeight: 'bold',
          margin: '0',
          textShadow: `
            0 0 10px rgba(0, 255, 255, 0.8),
            0 0 20px rgba(0, 255, 255, 0.4),
            0 0 30px rgba(0, 255, 255, 0.2)
          `,
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          ⚡ LYRICS ⚡
        </h3>
        {selectedSong && (
          <p style={{
            color: '#ff0080',
            fontSize: '0.95rem',
            margin: '12px 0 0 0',
            textShadow: '0 0 8px rgba(255, 0, 128, 0.6)',
            fontWeight: '500'
          }}>
            <span style={{ color: '#00ffff' }}>{selectedSong.title}</span>
            <span style={{ color: '#888', margin: '0 8px' }}>•</span>
            <span style={{ color: '#ff0080' }}>{selectedSong.artist}</span>
          </p>
        )}
        
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 0, 128, 0.8), transparent)',
          boxShadow: '0 0 8px rgba(255, 0, 128, 0.5)'
        }} />
      </div>

      {/* 가사 영역 */}
      <div 
        ref={lyricsContainerRef}
        style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 255, 255, 0.3) rgba(20, 20, 30, 0.3)',
        }}
        className="lyrics-scrollbar"
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
                padding: '16px 20px',
                margin: '6px 0',
                borderRadius: '15px',
                fontSize: '1.1rem',
                lineHeight: '1.7',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                ...(index === currentLine ? {
                  background: `
                    linear-gradient(135deg, 
                      rgba(0, 255, 255, 0.25) 0%,
                      rgba(255, 0, 128, 0.25) 50%,
                      rgba(0, 255, 255, 0.25) 100%
                    )
                  `,
                  color: '#ffffff',
                  fontWeight: 'bold',
                  textShadow: `
                    0 0 15px rgba(0, 255, 255, 1),
                    0 0 30px rgba(0, 255, 255, 0.6),
                    0 0 45px rgba(0, 255, 255, 0.3),
                    2px 2px 4px rgba(0, 0, 0, 0.8)
                  `,
                  border: '2px solid rgba(0, 255, 255, 0.6)',
                  transform: 'scale(1.03) translateX(10px)',
                  boxShadow: `
                    0 0 20px rgba(0, 255, 255, 0.4),
                    0 0 40px rgba(255, 0, 128, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                  `,
                  animation: 'pulse-glow 2s ease-in-out infinite alternate'
                } : {
                  color: index < currentLine ? '#666' : '#999',
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.03) 0%,
                      rgba(0, 255, 255, 0.02) 50%,
                      rgba(255, 255, 255, 0.03) 100%
                    )
                  `,
                  border: '1px solid rgba(0, 255, 255, 0.1)',
                  textShadow: index < currentLine ? 'none' : '0 0 5px rgba(255, 255, 255, 0.1)'
                })
              }}
              onMouseEnter={(e) => {
                if (index !== currentLine) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 128, 0.1))';
                  e.currentTarget.style.border = '1px solid rgba(0, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateX(5px)';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentLine) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0.03) 100%)';
                  e.currentTarget.style.border = '1px solid rgba(0, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              {/* 현재 라인 표시기 */}
              {index === currentLine && (
                <div style={{
                  position: 'absolute',
                  left: '-10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '4px',
                  height: '60%',
                  background: 'linear-gradient(180deg, #00ffff, #ff0080)',
                  borderRadius: '2px',
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
                  animation: 'slide-in 0.3s ease-out'
                }} />
              )}
              
              {/* 가사 텍스트 */}
              <span style={{
                position: 'relative',
                zIndex: 1
              }}>
                {lyric.text}
              </span>
            </div>
          ))
        )}
      </div>

      {/* 플립 버튼 */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(0, 255, 255, 0.2)',
        textAlign: 'center'
      }}>
        <button
          onClick={onFlip}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(45deg, #ff0080, #00ffff)',
            border: 'none',
            borderRadius: '25px',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            boxShadow: '0 4px 15px rgba(0, 255, 255, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
          }}
        >
          🔄 MR로 돌아가기
        </button>
      </div>

      <style jsx>{`
        .lyrics-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .lyrics-scrollbar::-webkit-scrollbar-track {
          background: rgba(10, 0, 30, 0.5);
          border-radius: 5px;
          border: 1px solid rgba(0, 255, 255, 0.1);
        }
        .lyrics-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #00ffff, #ff0080);
          border-radius: 5px;
          border: 1px solid rgba(0, 255, 255, 0.3);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        }
        .lyrics-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #ff0080, #00ffff);
          box-shadow: 0 0 15px rgba(255, 0, 128, 0.5);
        }
        
        @keyframes pulse-glow {
          0% {
            box-shadow: 
              0 0 20px rgba(0, 255, 255, 0.4),
              0 0 40px rgba(255, 0, 128, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          100% {
            box-shadow: 
              0 0 30px rgba(0, 255, 255, 0.6),
              0 0 60px rgba(255, 0, 128, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
        }
        
        @keyframes slide-in {
          0% {
            transform: translateY(-50%) translateX(-20px);
            opacity: 0;
          }
          100% {
            transform: translateY(-50%) translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes neon-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default LyricsPanel;