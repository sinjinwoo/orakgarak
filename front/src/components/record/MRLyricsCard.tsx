/**
 * MRLyricsCard - 완전 순수 HTML/CSS MR/가사 카드 컴포넌트
 * 카드 크기에 맞춰 최적화된 레이아웃
 */

import React, { useEffect, useRef, useState } from 'react';
import YouTubeMRPlayer, { YouTubeMRPlayerHandle } from './YouTubeMRPlayer.tsx';
import LyricsPanel from './LyricsPanel';

interface MRLyricsCardProps {
  currentSong?: {
    id: string;
    title: string;
    artist: string;
    genre: string;
    duration: string;
    youtubeId?: string; // YouTube MR 비디오 ID (예: 'szCnpElg-4k')
    lyrics?: string; // 가사 정보 (JSON 문자열)
  };
  onPlayPause?: () => void;
  onDelete?: () => void; // 곡 삭제 콜백
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  onSeekRequest?: (seconds: number) => void;
  onTimeUpdateRequest?: (seconds: number, duration?: number) => void;
  onSongFinished?: () => void; // 곡이 끝났을 때 호출할 콜백
}


const MRLyricsCard: React.FC<MRLyricsCardProps> = ({
  currentSong,
  onPlayPause,
  onDelete,
  isPlaying = false,
  currentTime = 0,
  duration = 180,
  volume = 0.7,
  // onVolumeChange - 향후 볼륨 슬라이더용
  onSeekRequest,
  onTimeUpdateRequest,
  onSongFinished
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // 모든 Hook을 먼저 호출
  const playerRef = useRef<YouTubeMRPlayerHandle | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);

  // 유튜브 MR 제어 관련 변수들
  const currentSongYoutubeId: string | undefined = currentSong ? (currentSong as { youtubeId?: string }).youtubeId : undefined;
  const isYouTubeMR = currentSong ? Boolean(currentSong.id === '21' || currentSong.id === '27015' || currentSong.id === '27071' || currentSongYoutubeId) : false;
  
  const getYouTubeVideoId = () => {
    if (!currentSong) return 'szCnpElg-4k';
    if (currentSongYoutubeId) return currentSongYoutubeId;
    if (currentSong.id === '21') return 'szCnpElg-4k';
    if (currentSong.id === '27015') return 'NHwn7cGbciU';
    if (currentSong.id === '27071') return 'UZy29hJkWfY';
    return 'szCnpElg-4k';
  };
  const youTubeVideoId = getYouTubeVideoId();

  // YouTube 재생 함수 - 단순화
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

  // YouTube 정지 함수 - 단순화
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

  // 재생 상태 변화 감지 - 단순화
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        borderRadius: '20px',
        border: '2px solid rgba(0, 255, 255, 0.2)',
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
          textShadow: '0 0 15px rgba(0, 255, 255, 0.8)',
          animation: 'glow 2s ease-in-out infinite alternate'
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
      {/* 로딩 애니메이션 CSS */}
      <style dangerouslySetInnerHTML={{ 
        __html: `
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
          }
        `
      }} />
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
                playing={false} // 수동 제어로 변경
                onSongFinished={onSongFinished}
                onPlayerReady={(player) => {
                  console.log('🎬 YouTube player ready:', youTubeVideoId);
                  console.log('🎬 플레이어 객체 직접 전달받음:', !!player);
                  
                  // 플레이어 객체를 직접 playerRef에 할당
                  if (player) {
                    playerRef.current = player;
                    console.log('🔧 플레이어 ref 직접 할당 완료');
                    
                    // 즉시 함수 확인
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
            
            
            {/* 상태 표시 */}
            <div style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem',
              margin: '8px 0 0 0',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>
              {isYouTubeMR ? (
                <>
                  <span style={{ color: '#00ffff' }}>🎵 YouTube MR</span><br />
                  {isPlayerLoading ? (
                    <span style={{ color: '#ffa500' }}>⏳ 플레이어 준비 중...</span>
                  ) : !isPlayerReady ? (
                    <span style={{ color: '#ff4444' }}>❌ 플레이어 로딩 중</span>
                  ) : isPlaying ? (
                    <span style={{ color: '#00ff00' }}>🎵 재생 중 - 정지하면 초기화</span>
                  ) : (
                    <span style={{ color: '#888' }}>⏹️ 정지 상태 - 버튼을 눌러 재생</span>
                  )}
                </>
              ) : (
                <>
                  <span style={{ color: '#ff0080' }}>🎤 일반 모드</span><br />
                  {isPlaying ? (
                    <span style={{ color: '#00ff00' }}>🎵 재생 중 - 정지하면 초기화</span>
                  ) : (
                    <span style={{ color: '#888' }}>⏹️ 정지 상태 - 버튼을 눌러 재생</span>
                  )}
                </>
              )}
            </div>
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
            {/* 재생/정지 버튼 */}
            <button
              onClick={() => {
                console.log('🎮 재생 버튼 클릭:', {
                  isPlaying,
                  isYouTubeMR,
                  isPlayerReady,
                  songTitle: currentSong.title
                });
                
                // YouTube MR인 경우 플레이어 준비 확인
                if (isYouTubeMR && !isPlayerReady) {
                  console.log('⚠️ 플레이어 준비되지 않음');
                  return;
                }
                
                onPlayPause?.();
              }}
              disabled={isPlayerLoading || (isYouTubeMR && !isPlayerReady)}
              style={{
                background: isPlayerLoading
                  ? 'linear-gradient(45deg, #ffa500, #ff8c00)' // 로딩 - 주황색
                  : isPlaying 
                    ? 'linear-gradient(45deg, #ff4444, #cc0000)' // 정지 - 빨간색
                    : 'linear-gradient(45deg, #00ff00, #00cc00)', // 재생 - 초록색
                color: '#fff',
                width: '48px',
                height: '48px',
                border: 'none',
                borderRadius: '50%',
                cursor: (isPlayerLoading || (isYouTubeMR && !isPlayerReady)) ? 'not-allowed' : 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isPlayerLoading 
                  ? '0 0 20px rgba(255, 165, 0, 0.6)' 
                  : isPlaying
                    ? '0 0 20px rgba(255, 68, 68, 0.6)'
                    : '0 0 20px rgba(0, 255, 0, 0.6)',
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
            
            {/* 삭제 버튼 */}
            <button
              onClick={() => {
                console.log('Delete button clicked');
                // 재생 중이면 정지
                if (isPlaying && isYouTubeMR && playerRef.current && isPlayerReady) {
                  stopYouTube();
                }
                // 곡 삭제 로직 (상위 컴포넌트에서 처리)
                onDelete?.();
              }}
              style={{
                background: 'linear-gradient(45deg, #666, #333)',
                color: '#fff',
                width: '40px',
                height: '40px',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
                marginLeft: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = 'linear-gradient(45deg, #ff4444, #cc0000)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(45deg, #666, #333)';
              }}
            >
              🗑️
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
            🔄 가사 보기
          </button>
        </div>

        {/* 가사 면 (뒤면) - LyricsPanel 사용 */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 0, 128, 0.3)',
          borderRadius: '15px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          
          {/* LyricsPanel 컴포넌트 사용 */}
          <LyricsPanel 
            selectedSong={{
              id: currentSong?.id || '',
              title: currentSong?.title || '',
              artist: currentSong?.artist || '',
              lyrics: currentSong?.lyrics
            }}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onFlip={() => setIsFlipped(false)}
          />

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
              margin: '8px',
              alignSelf: 'center'
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