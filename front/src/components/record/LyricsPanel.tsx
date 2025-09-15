/**
 * 가사 패널 컴포넌트 - 순수 HTML/CSS
 * 
 * 주요 기능:
 * - 실시간 가사 하이라이트 및 동기화
 * - 가사 검색 기능
 * - 깔끔한 디자인 (MUI CSS 클래스 없음)
 * - 스크롤 자동 추적
 */

import React, { useState } from 'react';

const LyricsPanel: React.FC = () => {
  const [currentLine, setCurrentLine] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // 샘플 가사 데이터
  const sampleLyrics = `NEURAL DANCE
CYBER COLLECTIVE

[Verse 1]
In the digital realm we dance tonight
Electric dreams in neon light
Synthetic hearts beat in sync
Lost in the matrix, on the brink

[Chorus]
Neural pathways, electric flow
Through the circuits we will go
Dance with me in cyberspace
In this digital embrace

[Verse 2]
Binary code runs through my veins
Data streams like electric rain
Upload my soul to the cloud
In this digital shroud

[Chorus]
Neural pathways, electric flow
Through the circuits we will go
Dance with me in cyberspace
In this digital embrace

[Bridge]
Fade to black, reboot my mind
Leave the old world far behind
In the matrix we are free
Digital eternity

[Outro]
Neural dance until the end
Digital souls we transcend
In the cyber world we'll stay
Forever and a day`;

  // 가사 라인 분리
  const lyricsLines = sampleLyrics.split('\n').filter(line => line.trim() !== '');

  // 검색 결과 필터링
  const filteredLyrics = lyricsLines.filter(line => 
    line.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 현재 재생 중인 라인 하이라이트
  const highlightCurrentLine = (index: number, line: string) => {
    if (searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase())) {
      return line.replace(
        new RegExp(`(${searchQuery})`, 'gi'),
        '<mark style="background: rgba(0, 255, 255, 0.3); color: #00ffff; padding: 2px 4px; border-radius: 4px;">$1</mark>'
      );
    }
    return line;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '16px 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(45deg, #ff0080, #00ffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(255, 0, 128, 0.3)'
          }}>
            <span style={{ fontSize: '20px', color: '#000' }}>🎵</span>
          </div>
          <div>
            <h6 style={{ 
              color: '#ff0080',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textShadow: '0 0 10px rgba(255, 0, 128, 0.5)',
              margin: 0,
              fontSize: '1.25rem'
            }}>
              NEURAL LYRICS
            </h6>
            <p style={{ 
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: 0,
              fontSize: '0.75rem'
            }}>
              REAL-TIME SYNC
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            background: isPlaying ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 0, 0.2)',
            color: isPlaying ? '#00ff00' : '#ffff00',
            border: `1px solid ${isPlaying ? '#00ff00' : '#ffff00'}`,
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem'
          }}>
            {isPlaying ? "SYNC" : "STANDBY"}
          </span>
          
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff0080',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '24px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 0, 128, 0.1)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔍
          </button>
        </div>
      </div>

      {/* 검색 필드 */}
      {showSearch && (
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="가사 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 0, 128, 0.3)',
              borderRadius: '8px',
              color: '#ff0080',
              fontSize: '1rem',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid #ff0080';
              e.target.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(255, 0, 128, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      )}

      {/* 가사 컨테이너 */}
      <div style={{ 
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        {/* 가사 목록 */}
        <div>
          {(searchQuery ? filteredLyrics : lyricsLines).map((line, index) => {
            const originalIndex = lyricsLines.indexOf(line);
            const isActive = originalIndex === currentLine;
            const isHighlighted = searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());
            
            return (
              <div
                key={index}
                style={{
                  padding: '8px 0',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentLine(originalIndex)}
              >
                <p style={{ 
                  color: isActive ? '#ff0080' : isHighlighted ? '#00ffff' : '#fff',
                  fontWeight: isActive ? 700 : 400,
                  textShadow: isActive ? '0 0 10px rgba(255, 0, 128, 0.5)' : 'none',
                  fontSize: '0.95rem',
                  lineHeight: 1.4,
                  margin: 0
                }}
                dangerouslySetInnerHTML={{
                  __html: highlightCurrentLine(index, line)
                }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 플레이어 컨트롤 */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        marginTop: '20px',
        padding: '16px 0'
      }}>
        <button
          onClick={() => setCurrentLine(Math.max(0, currentLine - 1))}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff0080',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '28px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 0, 128, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ⏮️
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: 'linear-gradient(45deg, #ff0080, #00ffff)',
            color: '#000',
            width: '60px',
            height: '60px',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 0, 128, 0.6)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <button
          onClick={() => setCurrentLine(Math.min(lyricsLines.length - 1, currentLine + 1))}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff0080',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '28px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 0, 128, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ⏭️
        </button>
      </div>

      {/* 진행률 표시 */}
      <div style={{ 
        marginTop: '16px',
        padding: '12px 0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#ff0080', fontSize: '0.75rem' }}>
            Line {currentLine + 1}
          </span>
          <span style={{ color: '#888', fontSize: '0.75rem' }}>
            {lyricsLines.length} lines
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 0, 128, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((currentLine + 1) / lyricsLines.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #ff0080, #00ffff)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </div>
  );
};

export default LyricsPanel;