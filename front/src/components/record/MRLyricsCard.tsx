/**
 * MRLyricsCard - LyricsPanel 중심의 플립 카드 컴포넌트
 * 가사 카드가 메인, MR 카드는 뒤집었을 때만 표시
 */

import React, { useEffect, useRef, useState } from 'react';
import YouTubeMRPlayer, { YouTubeMRPlayerHandle } from './YouTubeMRPlayer';
import LyricsPanel from './LyricsPanel';

interface MRLyricsCardProps {
  currentSong?: {
    id: string;
    title: string;
    artist: string;
    genre: string;
    duration: string;
    youtubeId?: string;
    lyrics?: string;
    albumCoverUrl?: string;
  };
  onPlayPause?: () => void;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  onSeekRequest?: (seconds: number) => void;
  onTimeUpdateRequest?: (seconds: number, duration?: number) => void;
  onSongFinished?: () => void;
  onVolumeChange?: (volume: number) => void;
}

const MRLyricsCard: React.FC<MRLyricsCardProps> = ({
  currentSong,
  onPlayPause,
  isPlaying = false,
  currentTime = 0,
  duration = 180,
  volume = 0.7,
  onSeekRequest,
  onTimeUpdateRequest,
  onSongFinished,
  onVolumeChange
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // YouTube 플레이어 관련
  const playerRef = useRef<YouTubeMRPlayerHandle | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);

  // YouTube 관련 로직
  const currentSongYoutubeId: string | undefined = currentSong ? (currentSong as { youtubeId?: string }).youtubeId : undefined;
  const isYouTubeMR = currentSong ? Boolean(currentSong.id === '21' || currentSong.id === '27015' || currentSong.id === '27071' || currentSongYoutubeId) : false;
  
  const getYouTubeVideoId = () => {
    if (!currentSong) return 'szCnpElg-4k';
    if (currentSongYoutubeId) return currentSongYoutubeId;
    if (currentSong.id === '21') return 'szCnpElg-4k';
    if (currentSong.id === '27015') return 'NHwn7cGbciU';
    if (currentSong.id === '27071') return 'UZy29hJkWfY';
    if (currentSong.id === '27879') return 'BU7qOLyqRjE';
    return 'szCnpElg-4k';
  };
  const youTubeVideoId = getYouTubeVideoId();

  // YouTube 재생 함수
  const resetAndPlayYouTube = async () => {
    console.log('🎬 YouTube 재생 시작:', youTubeVideoId);

    if (!isYouTubeMR || !playerRef.current || !isPlayerReady) {
      console.log('❌ 재생 불가:', { isYouTubeMR, hasPlayer: !!playerRef.current, isPlayerReady });
      return;
    }

    try {
      const player = playerRef.current;
      await player.seekTo(0);
      await player.play();
      console.log('✅ YouTube 재생 성공');
    } catch (error) {
      console.error('❌ YouTube 재생 실패:', error);
    }
  };

  // YouTube 정지 함수
  const stopYouTube = async () => {
    console.log('🛑 YouTube 정지:', youTubeVideoId);

    if (!isYouTubeMR || !playerRef.current || !isPlayerReady) {
      console.log('❌ 정지 불가:', { isYouTubeMR, hasPlayer: !!playerRef.current, isPlayerReady });
      return;
    }

    try {
      const player = playerRef.current;
      await player.pause();
      await player.seekTo(0);
      console.log('✅ YouTube 정지 성공');
    } catch (error) {
      console.error('❌ YouTube 정지 실패:', error);
    }
  };

  // 재생 상태 변화 감지
  useEffect(() => {
    console.log('🎮 재생 상태 변화:', {
      isPlaying,
      isYouTubeMR,
      isPlayerReady,
      currentSong: currentSong?.title
    });

    if (!isYouTubeMR || !isPlayerReady) {
      console.log('⏸️ 재생 조건 미충족, 스킵');
      return;
    }
    
    if (isPlaying) {
      console.log('▶️ 재생 시작');
      resetAndPlayYouTube();
    } else {
      console.log('⏹️ 재생 정지');
      stopYouTube();
    }
  }, [isPlaying, isYouTubeMR, isPlayerReady]);

  // 볼륨 변화 감지
  useEffect(() => {
    if (!isYouTubeMR || !playerRef.current || !isPlayerReady) return;
    try {
      playerRef.current.setVolume(Math.round((volume ?? 0.7) * 100));
    } catch (error) {
      console.error('Volume setting failed:', error);
    }
  }, [volume, isYouTubeMR, isPlayerReady]);

  // YouTube 시간 추적 - 고정밀 가사 싱크용
  useEffect(() => {
    if (!isYouTubeMR || !isPlayerReady || !isPlaying || !playerRef.current) {
      return;
    }
    
    console.log('⏰ 고정밀 시간 추적 시작 (가사 싱크용)');
    
    const interval = setInterval(() => {
      try {
        const player = playerRef.current;
        if (player && onTimeUpdateRequest) {
          const currentSeconds = player.getCurrentTime();
          const totalDuration = player.getDuration();
          
          // 정밀한 시간 전달 (가사 싱크를 위해)
          if (currentSeconds > 0 && totalDuration > 0) {
            onTimeUpdateRequest(currentSeconds, totalDuration);
            
            console.log('🎵 시간 동기화:', {
              current: currentSeconds.toFixed(2),
              duration: totalDuration.toFixed(2),
              progress: `${((currentSeconds / totalDuration) * 100).toFixed(1)}%`
            });
          }
          
          // 곡 종료 확인 (더 정확한 타이밍)
          if (currentSeconds >= totalDuration - 0.5) {
            console.log('🏁 곡 종료 감지');
            onSongFinished?.();
          }
        }
      } catch (error) {
        console.error('❌ 시간 추적 오류:', error);
      }
    }, 200); // 0.2초마다 업데이트로 더 정밀한 가사 싱크
    
    return () => {
      console.log('⏰ 시간 추적 정리');
      clearInterval(interval);
    };
  }, [isYouTubeMR, isPlayerReady, isPlaying, onTimeUpdateRequest, onSongFinished]);

  // 노래 변경 감지 - 플레이어 완전 재설정
  useEffect(() => {
    console.log('🔄 노래 변경 감지:', {
      currentSong: currentSong?.title,
      youTubeVideoId,
      isYouTubeMR
    });
    
    if (!currentSong) {
      console.log('🚫 노래 없음 - 플레이어 리셋');
      setIsPlayerReady(false);
      setIsPlayerLoading(false);
      return;
    }
    
    if (isYouTubeMR) {
      console.log('🎬 YouTube MR 노래 - 플레이어 대기');
      setIsPlayerReady(false); // 새 노래이므로 준비 상태 리셋
      setIsPlayerLoading(true);
      
      // YouTube 플레이어가 새 비디오로 로드될 때까지 대기
      // onPlayerReady 콜백에서 setIsPlayerReady(true)가 호출됨
    } else {
      console.log('🎤 일반 노래 - YouTube 플레이어 불필요');
      setIsPlayerReady(false);
      setIsPlayerLoading(false);
    }
  }, [currentSong?.id, youTubeVideoId, isYouTubeMR]);

  // 노래가 선택되지 않은 경우 초기 상태 가이드 표시
  if (!currentSong) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        color: '#888',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(236, 72, 153, 0.08))',
        borderRadius: '16px',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        animation: 'fadeIn 0.5s ease-in-out'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '20px',
          opacity: 0.7,
          animation: 'pulse 2s infinite'
        }}>
          🎵
        </div>
        <h3 style={{
          color: '#06b6d4',
          fontSize: '1.4rem',
          fontWeight: 'bold',
          margin: '0 0 12px 0',
          textShadow: '0 0 15px rgba(6, 182, 212, 0.6)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          노래를 선택해 주세요
        </h3>
        <p style={{
          color: '#888',
          fontSize: '1rem',
          margin: '0 0 20px 0',
          lineHeight: 1.5,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          예약 큐에서 노래를 클릭하면<br/>
          <span style={{ color: '#06b6d4' }}>새로고침 효과</span>와 함께<br/>
          완벽하게 재생됩니다
        </p>
        <div style={{
          padding: '12px 20px',
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '20px',
          fontSize: '0.9rem',
          color: '#06b6d4',
          textShadow: '0 0 8px rgba(6, 182, 212, 0.6)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          🎵 노래 클릭 = 새로고침 + 완벽 재생 ✨
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      perspective: '1000px',
      width: '100%',
      height: '100%'
    }}>
      {/* 유튜브 MR 플레이어 (숨김) */}
      {isYouTubeMR && (
        <div style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute', left: '-9999px' }}>
          <YouTubeMRPlayer
            ref={playerRef}
            videoId={youTubeVideoId}
            startSeconds={0}
            volumePercent={Math.round((volume ?? 0.7) * 100)}
            playing={false}
            onSongFinished={onSongFinished}
            onPlayerReady={(player) => {
              console.log('🎬 YouTube player ready:', youTubeVideoId);
              console.log('🎬 플레이어 객체 직접 전달받음:', !!player);
              
              if (player) {
                playerRef.current = player;
                console.log('🔧 플레이어 ref 직접 할당 완료');
                
                const hasAllMethods = 
                  typeof player.playVideo === 'function' &&
                  typeof player.pauseVideo === 'function' &&
                  typeof player.seekTo === 'function' &&
                  typeof player.setVolume === 'function' &&
                  typeof player.getCurrentTime === 'function' &&
                  typeof player.getDuration === 'function';
                
                console.log('✅ 플레이어 함수 확인:', hasAllMethods);
                
                if (hasAllMethods) {
                  try {
                    player.seekTo(0);
                    player.setVolume(Math.round((volume ?? 0.7) * 100));
                    setIsPlayerReady(true);
                    setIsPlayerLoading(false);
                    console.log('✅ 플레이어 완전 준비 완료');
                  } catch (error) {
                    console.error('❌ 초기 설정 실패:', error);
                  }
                }
              }
            }}
          />
        </div>
      )}

      {/* 플립 카드 컨테이너 */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.8s ease',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
      }}>
        
        {/* 앞면: 가사 패널 (메인) */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {/* 네온 윤곽선 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 16,
              padding: 2,
              pointerEvents: 'none',
              background: 'linear-gradient(45deg, rgba(236,72,153,0.95), rgba(6,182,212,0.95))',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              boxShadow: '0 0 24px rgba(236,72,153,0.45), 0 0 30px rgba(6,182,212,0.4)'
            }}
          />
          <LyricsPanel 
            selectedSong={currentSong ? {
              id: currentSong.id,
              title: currentSong.title,
              artist: currentSong.artist,
              lyrics: currentSong.lyrics,
              albumCoverUrl: currentSong.albumCoverUrl
            } : undefined}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onFlip={() => setIsFlipped(true)}
          />
        </div>

        {/* 뒤면: MR 컨트롤 패널 */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: `
            linear-gradient(145deg, 
              rgba(15, 15, 25, 0.95) 0%,
              rgba(25, 15, 35, 0.92) 50%,
              rgba(15, 15, 25, 0.95) 100%
            )
          `,
          border: '1px solid rgba(255, 0, 128, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          {/* 네온 윤곽선 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 16,
              padding: 2,
              pointerEvents: 'none',
              background: 'linear-gradient(45deg, rgba(236,72,153,0.95), rgba(6,182,212,0.95))',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              boxShadow: '0 0 24px rgba(236,72,153,0.45), 0 0 30px rgba(6,182,212,0.4)'
            }}
          />
          {/* 볼륨 네온 스타일 */}
          <style>
            {`
            .neon-volume { -webkit-appearance: none; appearance: none; background: transparent; }
            .neon-volume:focus { outline: none; }
            .neon-volume::-webkit-slider-runnable-track {
              height: 8px;
              background: linear-gradient(90deg, rgba(236,72,153,0.7), rgba(6,182,212,0.7));
              border-radius: 4px;
              box-shadow: 0 0 12px rgba(236,72,153,0.5), 0 0 18px rgba(6,182,212,0.4);
            }
            .neon-volume::-moz-range-track {
              height: 8px;
              background: linear-gradient(90deg, rgba(236,72,153,0.7), rgba(6,182,212,0.7));
              border-radius: 4px;
              box-shadow: 0 0 12px rgba(236,72,153,0.5), 0 0 18px rgba(6,182,212,0.4);
            }
            .neon-volume::-webkit-slider-thumb {
              -webkit-appearance: none; appearance: none;
              width: 16px; height: 16px; border-radius: 50%; background: #ffffff;
              border: 2px solid rgba(236,72,153,0.9);
              box-shadow: 0 0 12px rgba(236,72,153,0.6), 0 0 18px rgba(6,182,212,0.5);
              margin-top: -4px; /* center on track */
            }
            .neon-volume::-moz-range-thumb {
              width: 16px; height: 16px; border-radius: 50%; background: #ffffff;
              border: 2px solid rgba(236,72,153,0.9);
              box-shadow: 0 0 12px rgba(236,72,153,0.6), 0 0 18px rgba(6,182,212,0.5);
            }
            `}
          </style>
          
          {/* MR 헤더 + 곡 정보 (좌) / 상태(우) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 0 18px rgba(236,72,153,0.25)', background: 'rgba(236, 72, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {currentSong.albumCoverUrl ? (
                  <img src={currentSong.albumCoverUrl} alt={`${currentSong.title} album cover`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.3rem', color: '#ec4899' }}>🎵</span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#ec4899', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.2px', marginBottom: 4, fontFamily: 'system-ui, -apple-system, sans-serif' }}>MR 컨트롤</div>
                <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{currentSong.title}</h4>
                <div style={{ color: '#06b6d4', fontSize: '0.85rem', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{currentSong.artist}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
              {currentSong.albumCoverUrl ? (
                <img src={currentSong.albumCoverUrl} alt="cover" style={{ width: 18, height: 18, borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
              ) : (
                <span style={{ fontSize: '1rem' }}>🎵</span>
              )}
              <div style={{ color: '#ec4899', fontSize: '0.82rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{isYouTubeMR ? 'YouTube MR' : '일반 모드'}</div>
              <div style={{ color: isPlayerLoading ? '#fbbf24' : (!isPlayerReady && isYouTubeMR) ? '#f87171' : isPlaying ? '#22c55e' : '#888', fontSize: '0.82rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {isPlayerLoading ? '⏳ 준비 중' : (!isPlayerReady && isYouTubeMR) ? '❌ 로딩 중' : isPlaying ? '재생 중' : '정지'}
              </div>
            </div>
          </div>

          {/* 재생 컨트롤 섹션: 중앙(버튼+진행바), 우측 세로 볼륨 */}
          <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 120px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: 60, paddingLeft: 60 }}>
            {/* 재생/정지 버튼 (중앙 상단) */}
            <button
              onClick={() => {
                console.log('🎮 MR 재생 버튼 클릭:', {
                  isPlaying,
                  isYouTubeMR,
                  isPlayerReady,
                  songTitle: currentSong.title
                });
                
                if (isYouTubeMR && !isPlayerReady) {
                  console.log('⚠️ 플레이어 준비되지 않음');
                  return;
                }
                
                onPlayPause?.();
              }}
              disabled={isPlayerLoading || (isYouTubeMR && !isPlayerReady)}
              style={{
                background: isPlayerLoading
                  ? 'linear-gradient(45deg, rgba(148,163,184,0.35), rgba(148,163,184,0.2))'
                  : isPlaying 
                    ? 'linear-gradient(45deg, rgba(6,182,212,0.8), rgba(236,72,153,0.8))'
                    : 'linear-gradient(45deg, rgba(236,72,153,0.8), rgba(6,182,212,0.8))',
                color: '#ffffff',
                width: '72px',
                height: '72px',
                border: 'none',
                borderRadius: '50%',
                cursor: (isPlayerLoading || (isYouTubeMR && !isPlayerReady)) ? 'not-allowed' : 'pointer',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isPlayerLoading 
                  ? '0 0 18px rgba(148,163,184,0.35)'
                  : '0 0 26px rgba(236,72,153,0.35), 0 0 26px rgba(6,182,212,0.35)',
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
                opacity: (isPlayerLoading || (isYouTubeMR && !isPlayerReady)) ? 0.6 : 1,
                animation: isPlayerLoading ? 'pulse 1.5s infinite' : 'none',
                marginBottom: 12
              }}
              onMouseEnter={(e) => {
                if (!isPlayerLoading && (isPlayerReady || !isYouTubeMR)) {
                  e.currentTarget.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isPlayerLoading ? '…' : (isPlaying ? '■' : '▶')}
            </button>

            {/* 진행률 표시 (중앙, 버튼 아래) */}
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px 16px', width: '100%', maxWidth: 560, marginTop: 8 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{ color: '#ec4899', fontSize: '0.75rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
                </span>
                <span style={{ color: '#888', fontSize: '0.75rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                  const seekSec = Math.max(0, Math.floor(ratio * (duration || 1)));
                  if (isYouTubeMR && playerRef.current && isPlayerReady) {
                    try {
                      playerRef.current.seekTo(seekSec);
                    } catch (error) {
                      console.error('Seek failed:', error);
                    }
                  }
                  onSeekRequest?.(seekSec);
                }}
                style={{ width: '100%', height: '8px', background: 'rgba(236,72,153,0.25)', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: `${(currentTime / (duration || 1)) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #ec4899, #06b6d4)',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* 볼륨 컨트롤 (우측 세로) */}
            {onVolumeChange && (
              <div style={{ position: 'absolute', right: -50, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 8 }}>
                <span style={{ color: '#ec4899', fontSize: '0.75rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>볼륨</span>
                <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    style={{
                      transform: 'rotate(-90deg)',
                      width: 140,
                      height: 8,
                      background: 'transparent',
                      borderRadius: 4,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    className="neon-volume"
                  />
                </div>
                <span style={{ color: '#888', fontSize: '0.75rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{Math.round(volume * 100)}%</span>
              </div>
            )}
          </div>

          {/* MR로 돌아가기 버튼 */}
          <button
            onClick={() => setIsFlipped(false)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(45deg, rgba(255, 0, 128, 0.3), rgba(0, 255, 255, 0.3))',
              border: '1px solid rgba(255, 0, 128, 0.4)',
              borderRadius: '20px',
              color: '#ff0080',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textShadow: '0 0 8px rgba(255, 0, 128, 0.6)',
              boxShadow: '0 2px 8px rgba(255, 0, 128, 0.2)',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = 'linear-gradient(45deg, rgba(255, 0, 128, 0.4), rgba(0, 255, 255, 0.4))';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 0, 128, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'linear-gradient(45deg, rgba(255, 0, 128, 0.3), rgba(0, 255, 255, 0.3))';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 0, 128, 0.2)';
            }}
          >
            가사 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MRLyricsCard;