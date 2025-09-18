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
        background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.05), rgba(255, 0, 128, 0.05))',
        borderRadius: '16px',
        border: '1px solid rgba(0, 255, 255, 0.2)',
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
          color: '#00ffff',
          fontSize: '1.4rem',
          fontWeight: 'bold',
          margin: '0 0 12px 0',
          textShadow: '0 0 15px rgba(0, 255, 255, 0.8)'
        }}>
          노래를 선택해주세요
        </h3>
        <p style={{
          color: '#888',
          fontSize: '1rem',
          margin: '0 0 20px 0',
          lineHeight: 1.5
        }}>
          예약 큐에서 노래를 클릭하면<br/>
          <span style={{ color: '#00ffff' }}>새로고침 효과</span>와 함께<br/>
          완벽하게 재생됩니다
        </p>
        <div style={{
          padding: '12px 20px',
          background: 'rgba(0, 255, 255, 0.1)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '20px',
          fontSize: '0.9rem',
          color: '#00ffff',
          textShadow: '0 0 8px rgba(0, 255, 255, 0.6)'
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
          
          {/* MR 헤더 */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              color: '#ff0080',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              textShadow: '0 0 10px rgba(255, 0, 128, 0.6)',
              letterSpacing: '1px'
            }}>
              🎤 MR 컨트롤
            </h3>
            
            {/* 곡 정보 + 앨범 커버 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '16px'
            }}>
              {/* 앨범 커버 */}
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(255, 0, 128, 0.5)',
                boxShadow: '0 0 12px rgba(255, 0, 128, 0.4)',
                background: 'rgba(255, 0, 128, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {currentSong.albumCoverUrl ? (
                  <img 
                    src={currentSong.albumCoverUrl} 
                    alt={`${currentSong.title} album cover`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <span style={{
                    fontSize: '1.5rem',
                    color: '#ff0080',
                    textShadow: '0 0 8px rgba(255, 0, 128, 0.8)'
                  }}>🎤</span>
                )}
              </div>
              
              <div style={{ textAlign: 'left' }}>
                <h4 style={{
                  color: '#ffffff',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  margin: '0 0 4px 0'
                }}>
                  {currentSong.title}
                </h4>
                <p style={{
                  color: '#ff0080',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  {currentSong.artist}
                </p>
              </div>
            </div>
          </div>

          {/* 재생 컨트롤 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            flex: 1,
            justifyContent: 'center'
          }}>
            {/* 재생/정지 버튼 */}
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
                  ? 'linear-gradient(45deg, #ffa500, #ff8c00)'
                  : isPlaying 
                    ? 'linear-gradient(45deg, #ff4444, #cc0000)'
                    : 'linear-gradient(45deg, #00ff00, #00cc00)',
                color: '#fff',
                width: '60px',
                height: '60px',
                border: 'none',
                borderRadius: '50%',
                cursor: (isPlayerLoading || (isYouTubeMR && !isPlayerReady)) ? 'not-allowed' : 'pointer',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isPlayerLoading 
                  ? '0 0 25px rgba(255, 165, 0, 0.6)' 
                  : isPlaying
                    ? '0 0 25px rgba(255, 68, 68, 0.6)'
                    : '0 0 25px rgba(0, 255, 0, 0.6)',
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
                opacity: (isPlayerLoading || (isYouTubeMR && !isPlayerReady)) ? 0.6 : 1,
                animation: isPlayerLoading ? 'pulse 1.5s infinite' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isPlayerLoading && (isPlayerReady || !isYouTubeMR)) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isPlayerLoading ? '⏳' : (isPlaying ? '⏹️' : '▶️')}
            </button>

            {/* 상태 표시 */}
            <div style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.85rem',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              {isYouTubeMR ? (
                <>
                  <span style={{ color: '#ff0080' }}>🎵 YouTube MR</span><br />
                  {isPlayerLoading ? (
                    <span style={{ color: '#ffa500' }}>⏳ 플레이어 준비 중...</span>
                  ) : !isPlayerReady ? (
                    <span style={{ color: '#ff4444' }}>❌ 플레이어 로딩 중</span>
                  ) : isPlaying ? (
                    <span style={{ color: '#00ff00' }}>🎵 재생 중</span>
                  ) : (
                    <span style={{ color: '#888' }}>⏹️ 정지 상태</span>
                  )}
                </>
              ) : (
                <>
                  <span style={{ color: '#ff0080' }}>🎤 일반 모드</span><br />
                  {isPlaying ? (
                    <span style={{ color: '#00ff00' }}>🎵 재생 중</span>
                  ) : (
                    <span style={{ color: '#888' }}>⏹️ 정지 상태</span>
                  )}
                </>
              )}
            </div>

            {/* 진행률 표시 */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              width: '100%',
              maxWidth: '200px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{ color: '#ff0080', fontSize: '0.7rem' }}>
                  {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
                </span>
                <span style={{ color: '#888', fontSize: '0.7rem' }}>
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
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 0, 128, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    width: `${(currentTime / (duration || 1)) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #ff0080, #00ffff)',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* 볼륨 컨트롤 */}
            {onVolumeChange && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                maxWidth: '200px'
              }}>
                <span style={{ color: '#ff0080', fontSize: '0.8rem' }}>🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  style={{
                    flex: 1,
                    height: '4px',
                    background: 'rgba(255, 0, 128, 0.2)',
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ color: '#888', fontSize: '0.7rem' }}>
                  {Math.round(volume * 100)}%
                </span>
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
            🔄 가사로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MRLyricsCard;