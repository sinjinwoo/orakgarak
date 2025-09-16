/**
 * MR/가사 카드 컴포넌트 - 카드 뒤집기 시스템 (순수 HTML/CSS)
 * 
 * 주요 기능:
 * - MR 플레이어와 가사 패널을 하나의 카드로 통합
 * - 3D 뒤집기 애니메이션으로 MR과 가사 간 전환
 * - 깔끔한 디자인 (MUI CSS 클래스 없음)
 * - 실시간 가사 하이라이트 기능
 * - 가사 검색 기능
 */

import React, { useState } from 'react';

interface MRLyricsCardProps {
  currentSong?: {
    id: string;
    title: string;
    artist: string;
    genre: string;
    duration: string;
  };
  onPlayPause?: () => void;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

// 임시 더미 가사 데이터
const dummyLyrics = [
  { time: 0, text: "Welcome to the cyber world" },
  { time: 5, text: "Where neon lights shine bright" },
  { time: 10, text: "Digital dreams come alive" },
  { time: 15, text: "In this electric night" },
  { time: 20, text: "Neural pathways connect" },
  { time: 25, text: "Through the matrix we flow" },
  { time: 30, text: "Cyberpunk reality" },
  { time: 35, text: "Where the future glows" },
  { time: 40, text: "Electric pulse in my veins" },
  { time: 45, text: "Technology runs through my mind" },
  { time: 50, text: "In this digital domain" },
  { time: 55, text: "True freedom we find" },
  { time: 60, text: "Welcome to the cyber world" },
  { time: 65, text: "Where neon lights shine bright" },
  { time: 70, text: "Digital dreams come alive" },
  { time: 75, text: "In this electric night" },
  { time: 80, text: "Neural pathways connect" },
  { time: 85, text: "Through the matrix we flow" },
  { time: 90, text: "Cyberpunk reality" },
  { time: 95, text: "Where the future glows" }
];

const MRLyricsCard: React.FC<MRLyricsCardProps> = ({
  currentSong = {
    id: '1',
    title: 'NEURAL DANCE',
    artist: 'CYBER COLLECTIVE',
    genre: 'Cyberpunk',
    duration: '3:00'
  },
  onPlayPause,
  isPlaying = false,
  currentTime = 0,
  duration = 180,
  volume = 0.7,
  onVolumeChange
}) => {
  // 카드 뒤집기 상태
  const [isFlipped, setIsFlipped] = useState(false);
  
  // 가사 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // 가사 검색 결과 필터링
  const filteredLyrics = dummyLyrics.filter(lyric => 
    lyric.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 뒤집기 핸들러
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div style={{ 
      perspective: '1000px',
      width: '100%',
      height: '500px'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
      }}>
        {/* MR 면 (앞면) */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          background: `
            linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 128, 0.1) 100%),
            rgba(26, 26, 26, 0.95)
          `,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 홀로그램 코너 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
            boxShadow: '0 0 10px #00ffff'
          }} />
          
          {/* MR 플레이어 헤더 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
              }}>
                <span style={{ fontSize: '20px', color: '#000' }}>🎵</span>
              </div>
              <div>
                <h6 style={{ 
                  color: '#00ffff',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                  margin: 0,
                  fontSize: '1.25rem'
                }}>
                  NEURAL PLAYER
                </h6>
                <p style={{ 
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  margin: 0,
                  fontSize: '0.75rem'
                }}>
                  AUDIO SYSTEM
                </p>
              </div>
            </div>

            <span style={{ 
              background: isPlaying ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 0, 0.2)',
              color: isPlaying ? '#00ff00' : '#ffff00',
              border: `1px solid ${isPlaying ? '#00ff00' : '#ffff00'}`,
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem'
            }}>
              {isPlaying ? "PLAYING" : "STANDBY"}
            </span>
          </div>

          {/* 곡 정보 */}
          <div style={{ 
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <div style={{ 
              background: 'linear-gradient(45deg, #00ffff, #ff0080)',
              width: 80,
              height: 80,
              borderRadius: '50%',
              margin: '0 auto 16px',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px'
            }}>
              🎵
            </div>
            
            <h5 style={{ 
              color: '#fff',
              fontWeight: 700,
              marginBottom: '8px',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
              margin: '0 0 8px 0',
              fontSize: '1.5rem'
            }}>
              {currentSong.title}
            </h5>
            
            <h6 style={{ 
              color: '#00ffff',
              fontWeight: 600,
              marginBottom: '4px',
              margin: '0 0 4px 0',
              fontSize: '1.25rem'
            }}>
              {currentSong.artist}
            </h6>
            
            <span style={{ 
              background: 'rgba(255, 0, 128, 0.2)',
              color: '#ff0080',
              border: '1px solid #ff0080',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem'
            }}>
              {currentSong.genre}
            </span>
          </div>

          {/* 플레이어 컨트롤 */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <button
              onClick={onPlayPause}
              style={{
                background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                color: '#000',
                width: 60,
                height: 60,
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.6)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00ffff', fontSize: '20px' }}>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
                style={{
                  width: '100px',
                  height: '4px',
                  background: 'rgba(0, 255, 255, 0.3)',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* 진행률 표시 */}
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#00ffff', fontSize: '0.75rem' }}>
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
              </span>
              <span style={{ color: '#888', fontSize: '0.75rem' }}>
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(0, 255, 255, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(currentTime / duration) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00ffff, #ff0080)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* 뒤집기 버튼 */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            marginTop: 'auto'
          }}>
            <button
              onClick={handleFlip}
              style={{
                background: 'rgba(255, 0, 128, 0.2)',
                color: '#ff0080',
                border: '1px solid #ff0080',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 700
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 128, 0.3)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 0, 128, 0.4)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 128, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🔄 FLIP
            </button>
          </div>
        </div>

        {/* 가사 면 (뒤면) */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: `
            linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(0, 255, 255, 0.1) 100%),
            rgba(26, 26, 26, 0.95)
          `,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 0, 128, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 홀로그램 코너 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ff0080, transparent)',
            boxShadow: '0 0 10px #ff0080'
          }} />
          
          {/* 가사 헤더 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                <span style={{ fontSize: '20px', color: '#000' }}>📝</span>
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

          {/* 가사 검색 */}
          {showSearch && (
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
                outline: 'none',
                marginBottom: '16px'
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
          )}

          {/* 가사 목록 */}
          <div style={{ 
            flex: 1,
            overflow: 'auto',
            paddingRight: '8px'
          }}>
            {(searchQuery ? filteredLyrics : dummyLyrics).map((lyric, index) => {
              const isActive = Math.floor(currentTime) >= lyric.time && 
                             Math.floor(currentTime) < (dummyLyrics[index + 1]?.time || duration);
              const isHighlighted = searchQuery && lyric.text.toLowerCase().includes(searchQuery.toLowerCase());
              
              return (
                <div
                  key={index}
                  style={{
                    padding: '8px 0',
                    cursor: 'pointer'
                  }}
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
                    __html: isHighlighted 
                      ? lyric.text.replace(
                          new RegExp(`(${searchQuery})`, 'gi'), 
                          '<mark style="background: rgba(0, 255, 255, 0.3); color: #00ffff; padding: 2px 4px; border-radius: 4px;">$1</mark>'
                        )
                      : lyric.text
                  }}
                  />
                  <span style={{ 
                    color: '#888',
                    marginTop: '4px',
                    display: 'block',
                    fontSize: '0.75rem'
                  }}>
                    {Math.floor(lyric.time / 60)}:{(lyric.time % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 뒤집기 버튼 */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            marginTop: '16px'
          }}>
            <button
              onClick={handleFlip}
              style={{
                background: 'rgba(0, 255, 255, 0.2)',
                color: '#00ffff',
                border: '1px solid #00ffff',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 700
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 255, 255, 0.3)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.4)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🔄 FLIP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MRLyricsCard;