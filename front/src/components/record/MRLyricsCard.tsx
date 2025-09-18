/**
 * MRLyricsCard - 완전 순수 HTML/CSS MR/가사 카드 컴포넌트
 * 카드 크기에 맞춰 최적화된 레이아웃
 */

import React, { useEffect, useRef, useState } from 'react';
import YouTubeMRPlayer, { YouTubeMRPlayerHandle } from './YouTubeMRPlayer.tsx';

interface MRLyricsCardProps {
  currentSong?: {
    id: string;
    title: string;
    artist: string;
    genre: string;
    duration: string;
    youtubeId?: string;
  };
  onPlayPause?: () => void;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  onSeekRequest?: (seconds: number) => void;
  onTimeUpdateRequest?: (seconds: number, duration?: number) => void;
}

// Musixmatch 스타일 가사 → 내부 포맷으로 변환
function parseMusixmatchLines(lines: { startTimeMs: string; words: string }[]): { time: number; text: string }[] {
  return lines
    .filter(l => typeof l.words === 'string' && l.words.trim().length > 0)
    .map(l => {
      const ms = parseInt(l.startTimeMs || '0', 10);
      const time = isNaN(ms) ? 0 : Math.max(0, Math.floor(ms / 1000));
      return { time, text: l.words };
    })
    .sort((a, b) => a.time - b.time);
}

// 곡별 가사 데이터베이스
const lyricsDatabase: { [key: string]: { time: number; text: string }[] } = {
  '1': [
    { time: 0, text: "Welcome to the cyber world" },
    { time: 5, text: "Where neon lights shine bright" },
    { time: 10, text: "Digital dreams come alive" },
    { time: 15, text: "In this electric night" },
    { time: 20, text: "Neural pathways connect" },
    { time: 25, text: "Through the matrix we flow" },
    { time: 30, text: "Cyberpunk reality" },
    { time: 35, text: "Where the future glows" }
  ],
  '21': parseMusixmatchLines([
    { startTimeMs: '22770', words: '또렷해져 모두 잊어버리려' },
    { startTimeMs: '27470', words: '지워버리려 할수록' },
    { startTimeMs: '32040', words: '가득해져 가는 너의 빈자리' },
    { startTimeMs: '36770', words: '지나온 날들 너 아니면' },
    { startTimeMs: '42470', words: '아무것도 아니었다는 걸' },
    { startTimeMs: '47080', words: '바보처럼 나만 몰랐나봐' },
    { startTimeMs: '58630', words: '허전해져 많이 보고 싶어' },
    { startTimeMs: '63740', words: '니 얼굴을 떠올려 봐도' },
    { startTimeMs: '68880', words: '흐릿해져 가는 너의 모습에' },
    { startTimeMs: '73260', words: '사랑을 몰라 눈 가린 듯' },
    { startTimeMs: '79030', words: '모르는 척 니 맘을 버린 뒤' },
    { startTimeMs: '83370', words: '바보 같은 내 맘은' }
  ])
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
  // onVolumeChange - 향후 볼륨 슬라이더용
  onSeekRequest,
  onTimeUpdateRequest
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const currentLyrics = lyricsDatabase[currentSong.id] || lyricsDatabase['1'];
  
  // 유튜브 MR 제어
  const currentSongYoutubeId: string | undefined = (currentSong as { youtubeId?: string }).youtubeId;
  const isYouTubeMR = Boolean(currentSong.id === '21' || currentSongYoutubeId);
  const youTubeVideoId = currentSongYoutubeId || 'yNdQjHnyy_c';
  const playerRef = useRef<YouTubeMRPlayerHandle | null>(null);

  useEffect(() => {
    if (!isYouTubeMR || !playerRef.current) return;
    if (isPlaying) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying, isYouTubeMR]);

  useEffect(() => {
    if (!isYouTubeMR || !playerRef.current) return;
    playerRef.current.setVolume(Math.round((volume ?? 0.7) * 100));
  }, [volume, isYouTubeMR]);

  // 유튜브 현재 시간 폴링하여 상위 업데이트
  useEffect(() => {
    if (!isYouTubeMR || !playerRef.current) return;
    const interval = window.setInterval(() => {
      const ct = playerRef.current?.getCurrentTime() ?? currentTime;
      const du = playerRef.current?.getDuration() ?? duration;
      if (typeof onTimeUpdateRequest === 'function') {
        onTimeUpdateRequest(ct, du || undefined);
      }
    }, 500);
    return () => window.clearInterval(interval);
  }, [isYouTubeMR, onTimeUpdateRequest, currentTime, duration]);

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
          
          {/* 유튜브 MR 플레이어 (배경) */}
          {isYouTubeMR && (
            <div style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute', left: '-9999px' }}>
              <YouTubeMRPlayer
                ref={playerRef}
                videoId={youTubeVideoId}
                startSeconds={0}
                volumePercent={Math.round((volume ?? 0.7) * 100)}
                playing={isPlaying ?? false}
              />
            </div>
          )}

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
              margin: '0 0 6px 0'
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
              onClick={() => {
                console.log('Play button clicked, isYouTubeMR:', isYouTubeMR, 'isPlaying:', isPlaying);
                if (isYouTubeMR && playerRef.current) {
                  if (isPlaying) {
                    playerRef.current.pause();
                    console.log('YouTube paused');
                  } else {
                    try {
                      // 사용자 제스처로 강제 재생 시도
                      playerRef.current.play();
                      const targetVolume = Math.round((volume ?? 0.7) * 100);
                      playerRef.current.setVolume(targetVolume);
                      console.log('YouTube play attempted with volume:', targetVolume);
                    } catch (error) {
                      console.error('Play failed:', error);
                    }
                  }
                }
                onPlayPause?.();
              }}
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
                justifyContent: 'center'
              }}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
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
            <div
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                const seekSec = Math.max(0, Math.floor(ratio * (duration || 1)));
                if (isYouTubeMR && playerRef.current) {
                  playerRef.current.seekTo(seekSec);
                }
                onSeekRequest?.(seekSec);
              }}
              style={{
                width: '100%',
                height: '3px',
                background: 'rgba(0, 255, 255, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  width: `${(currentTime / (duration || 1)) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00ffff, #ff0080)',
                  transition: 'width 0.2s ease'
                }}
              />
            </div>
          </div>

          {/* 뒤집기 버튼 */}
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              background: 'rgba(255, 0, 128, 0.2)',
              color: '#ff0080',
              border: '1px solid #ff0080',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              marginTop: '8px'
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
          boxSizing: 'border-box'
        }}>
          
          <h4 style={{ 
            color: '#ff0080',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            margin: '0 0 12px 0'
          }}>
            NEURAL LYRICS
          </h4>

          {/* 가사 목록 */}
          <div style={{ 
            flex: 1,
            overflow: 'auto',
            paddingRight: '4px',
            minHeight: 0
          }}>
            {currentLyrics.map((lyric, index) => {
              const isActive = Math.floor(currentTime) >= lyric.time && 
                             Math.floor(currentTime) < (currentLyrics[index + 1]?.time || duration);
              
              return (
                <div
                  key={index}
                  style={{
                    padding: '4px 0',
                    cursor: 'pointer'
                  }}
                >
                  <p style={{ 
                    color: isActive ? '#ff0080' : '#fff',
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
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              background: 'rgba(0, 255, 255, 0.2)',
              color: '#00ffff',
              border: '1px solid #00ffff',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              marginTop: '8px'
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
