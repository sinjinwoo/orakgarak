/**
 * MRLyricsCard - 완전 순수 HTML/CSS MR/가사 카드 컴포넌트
 * 카드 크기에 맞춰 최적화된 레이아웃
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

// 곡별 가사 데이터베이스
const lyricsDatabase: { [key: string]: { time: number; text: string }[] } = {
  '1': [ // NEURAL DANCE
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
    { time: 55, text: "True freedom we find" }
  ],
  '2': [ // Dynamite
    { time: 0, text: "Cause ah-ah, I'm in the stars tonight" },
    { time: 5, text: "So watch me bring the fire and set the night alight" },
    { time: 10, text: "Shoes on, get up in the morn'" },
    { time: 15, text: "Cup of milk, let's rock and roll" },
    { time: 20, text: "King Kong, kick the drum" },
    { time: 25, text: "Rolling on like a Rolling Stone" }
  ],
  '3': [ // Butter
    { time: 0, text: "Smooth like butter, like a criminal undercover" },
    { time: 5, text: "Gon' pop like trouble breaking into your heart like that" },
    { time: 10, text: "Cool shade, stunner, yeah, I owe it all to my mother" },
    { time: 15, text: "Hot like summer, yeah, I'm making you sweat like that" }
  ]
};

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
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // 현재 곡의 가사 가져오기
  const currentLyrics = lyricsDatabase[currentSong.id] || lyricsDatabase['1'];
  
  const filteredLyrics = currentLyrics.filter(lyric => 
    lyric.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div style={{ 
      perspective: '1000px',
      width: '100%',
      height: '100%'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.8s ease',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
      }}>
        
        {/* MR 면 (앞면) */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '15px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          
          {/* MR 플레이어 헤더 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                🎵
              </div>
              <div>
                <h4 style={{ 
                  color: '#00ffff',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  margin: '0 0 2px 0'
                }}>
                  NEURAL PLAYER
                </h4>
                <p style={{ 
                  color: '#888',
                  fontSize: '0.6rem',
                  margin: '0',
                  textTransform: 'uppercase'
                }}>
                  AUDIO SYSTEM
                </p>
              </div>
            </div>

            <span style={{ 
              background: isPlaying ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 0, 0.2)',
              color: isPlaying ? '#00ff00' : '#ffff00',
              border: `1px solid ${isPlaying ? '#00ff00' : '#ffff00'}`,
              padding: '3px 6px',
              borderRadius: '8px',
              fontSize: '0.6rem',
              fontWeight: 'bold'
            }}>
              {isPlaying ? "PLAYING" : "STANDBY"}
            </span>
          </div>

          {/* 곡 정보 */}
          <div style={{ 
            textAlign: 'center',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ 
              background: 'linear-gradient(45deg, #00ffff, #ff0080)',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🎵
            </div>
            
            <h3 style={{ 
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              margin: '0 0 6px 0',
              lineHeight: 1.2
            }}>
              {currentSong.title}
            </h3>
            
            <h4 style={{ 
              color: '#00ffff',
              fontSize: '0.9rem',
              margin: '0 0 4px 0'
            }}>
              {currentSong.artist}
            </h4>
            
            <span style={{ 
              background: 'rgba(255, 0, 128, 0.2)',
              color: '#ff0080',
              border: '1px solid #ff0080',
              padding: '3px 6px',
              borderRadius: '8px',
              fontSize: '0.6rem'
            }}>
              {currentSong.genre}
            </span>
          </div>

          {/* 플레이어 컨트롤 */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            flexShrink: 0
          }}>
            <button
              onClick={onPlayPause}
              style={{
                background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                color: '#000',
                width: '40px',
                height: '40px',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#00ffff', fontSize: '14px' }}>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
                style={{
                  width: '60px',
                  height: '3px',
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
            borderRadius: '6px',
            padding: '8px',
            width: '100%',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px'
            }}>
              <span style={{ color: '#00ffff', fontSize: '0.6rem' }}>
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
              </span>
              <span style={{ color: '#888', fontSize: '0.6rem' }}>
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '3px',
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
          <button
            onClick={handleFlip}
            style={{
              background: 'rgba(255, 0, 128, 0.2)',
              color: '#ff0080',
              border: '1px solid #ff0080',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 0, 128, 0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 0, 128, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🔄 FLIP
          </button>
        </div>

        {/* 가사 면 (뒤면) */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 0, 128, 0.3)',
          borderRadius: '15px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'visible', // 스피커가 카드 밖으로 나올 수 있도록
          zIndex: 10 // 카드 레이어 (스피커보다 낮게)
        }}>
          
          {/* 가사 헤더 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'linear-gradient(45deg, #ff0080, #00ffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                📝
              </div>
              <div>
                <h4 style={{ 
                  color: '#ff0080',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  margin: '0 0 2px 0'
                }}>
                  NEURAL LYRICS
                </h4>
                <p style={{ 
                  color: '#888',
                  fontSize: '0.6rem',
                  margin: '0',
                  textTransform: 'uppercase'
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
                padding: '4px',
                fontSize: '14px'
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
                padding: '6px 8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 0, 128, 0.3)',
                borderRadius: '4px',
                color: '#ff0080',
                fontSize: '0.7rem',
                outline: 'none',
                marginBottom: '8px',
                boxSizing: 'border-box',
                flexShrink: 0
              }}
            />
          )}

          {/* 가사 목록 */}
          <div style={{ 
            flex: 1,
            overflow: 'auto',
            paddingRight: '4px',
            minHeight: 0
          }}>
            {(searchQuery ? filteredLyrics : currentLyrics).map((lyric, index) => {
              const isActive = Math.floor(currentTime) >= lyric.time && 
                             Math.floor(currentTime) < (currentLyrics[index + 1]?.time || duration);
              const isHighlighted = searchQuery && lyric.text.toLowerCase().includes(searchQuery.toLowerCase());
              
              return (
                <div
                  key={index}
                  style={{
                    padding: '4px 0',
                    cursor: 'pointer'
                  }}
                >
                  <p style={{ 
                    color: isActive ? '#ff0080' : isHighlighted ? '#00ffff' : '#fff',
                    fontWeight: isActive ? 'bold' : 'normal',
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    margin: '0 0 2px 0'
                  }}>
                    {lyric.text}
                  </p>
                  <span style={{ 
                    color: '#888',
                    fontSize: '0.6rem'
                  }}>
                    {Math.floor(lyric.time / 60)}:{(lyric.time % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 뒤집기 버튼 */}
          <button
            onClick={handleFlip}
            style={{
              background: 'rgba(0, 255, 255, 0.2)',
              color: '#00ffff',
              border: '1px solid #00ffff',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              marginTop: '8px',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🔄 FLIP
          </button>
        </div>
      </div>
    </div>
  );
};

export default MRLyricsCard;