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
    youtubeId?: string; // YouTube MR 비디오 ID (예: 'szCnpElg-4k')
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

// Musixmatch 스타일 가사 → 내부 포맷으로 변환 (1초 늦게 표시 적용)
function parseMusixmatchLines(lines: { startTimeMs: string; words: string }[]): { time: number; text: string }[] {
  return lines
    .filter(l => typeof l.words === 'string' && l.words.trim().length > 0)
    .map(l => {
      const ms = parseInt(l.startTimeMs || '0', 10);
      // 가사 싱크를 위해 1초(1000ms) 늦게 표시
      const adjustedMs = ms + 1000;
      const time = isNaN(ms) ? 0 : Math.max(0, Math.floor(adjustedMs / 1000));
      return { time, text: l.words };
    })
    .sort((a, b) => a.time - b.time);
}

// 백엔드 API 응답 형식의 가사 데이터 파싱 함수
function parseBackendLyrics(lyricsData: { lyrics: { lines: { startTimeMs: string; words: string }[] } }): { time: number; text: string }[] {
  if (!lyricsData?.lyrics?.lines) return [];
  
  return parseMusixmatchLines(lyricsData.lyrics.lines);
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
  ]),
  '27015': parseMusixmatchLines([
    { startTimeMs: '8130', words: '너에게로 다가가면' },
    { startTimeMs: '13720', words: '언제나 많은 사람들 중에 하날 뿐이지' },
    { startTimeMs: '22780', words: '때론 내게 말을 하지' },
    { startTimeMs: '28170', words: '사랑이라는 건 우정보다 유치하다고' },
    { startTimeMs: '35340', words: '너에게 이런 내가 부담인줄 알지만' },
    { startTimeMs: '43360', words: '너무 많은 이해심은 무관심일수도 있지' },
    { startTimeMs: '50550', words: '넌 내 곁에서 한발 물러서 있지만' },
    { startTimeMs: '56540', words: '너의 마음 깊은 곳에서 날 찾고 싶었던 거야' },
    { startTimeMs: '71910', words: '널 사랑한다 말을 한다면' },
    { startTimeMs: '77560', words: '넌 내게 구속이라 말을 하겠지만' },
    { startTimeMs: '84710', words: '너에게 나만의 널 원하는 건 아냐' },
    { startTimeMs: '91670', words: '다만 내게 조금만 더 널 보여줘' },
    { startTimeMs: '97030', words: '있는 그대로의 네 모습을' },
    { startTimeMs: '114980', words: '너에게 이런 내가 부담인줄 알지만' },
    { startTimeMs: '122810', words: '너무 많은 이해심은 무관심일수도 있지' },
    { startTimeMs: '130040', words: '넌 내 곁에서 한발 물러서 있지만' },
    { startTimeMs: '135820', words: '너의 마음 깊은 곳에서 날 찾고 싶었던 거야' },
    { startTimeMs: '151410', words: '널 사랑한다 말을 한다면' },
    { startTimeMs: '156960', words: '넌 내게 구속이라 말을 하겠지만' },
    { startTimeMs: '164160', words: '너에게 나만의 널 원하는 건 아냐' },
    { startTimeMs: '170950', words: '다만 내게 조금만 더 널 보여줘' },
    { startTimeMs: '176310', words: '있는 그대로의 네 모습을' },
    { startTimeMs: '180170', words: '널 사랑한다 말을 한다면' },
    { startTimeMs: '185920', words: '넌 내게 구속이라 말을 하겠지만' },
    { startTimeMs: '193090', words: '너에게 나만의 널 원하는 건 아냐' },
    { startTimeMs: '199830', words: '다만 내게 조금만 더 널 보여줘' },
    { startTimeMs: '205320', words: '있는 그대로의 네 모습을' }
  ]),
  '27071': parseMusixmatchLines([
    { startTimeMs: '20490', words: '내가 이렇게 아픈데 그댄 어떨까요' },
    { startTimeMs: '33680', words: '원래 떠나는 사람이 더 힘든 법인데' },
    { startTimeMs: '48370', words: '아무 말 하지 말아요 그대 마음 알아요' },
    { startTimeMs: '62450', words: '간신히 참고 있는 날 울게 하지 마요' },
    { startTimeMs: '76810', words: '이별은 시간을 멈추게 하니까' },
    { startTimeMs: '83530', words: '모든 걸 빼앗고 추억만 주니까' },
    { startTimeMs: '89840', words: '아무리 웃어 보려고 안간힘 써 봐도' },
    { startTimeMs: '96960', words: '밥 먹다가도 울겠지만' },
    { startTimeMs: '103490', words: '그대 오직 그대만이' },
    { startTimeMs: '110180', words: '내 첫사랑 내 끝사랑' },
    { startTimeMs: '117000', words: '지금부터 달라질 수 없는 한 가지' },
    { startTimeMs: '124790', words: '그대만이 영원한 내 사랑' },
    { startTimeMs: '146660', words: '그대도 나처럼 잘못했었다면' },
    { startTimeMs: '155750', words: '그 곁에 머물기 수월했을까요' },
    { startTimeMs: '162990', words: '사랑해 떠난다는 말' },
    { startTimeMs: '166290', words: '과분하다는 말' },
    { startTimeMs: '169730', words: '코웃음치던 나였지만' },
    { startTimeMs: '176500', words: '그대 오직 그대만이' },
    { startTimeMs: '183260', words: '내 첫사랑 내 끝사랑' },
    { startTimeMs: '190390', words: '지금부터 그대 나를 잊고 살아도' },
    { startTimeMs: '198070', words: '그대만이 영원한 내 사랑' },
    { startTimeMs: '219790', words: '나는 다시는 사랑을' },
    { startTimeMs: '227350', words: '못 할 것 같아요 그대가 아니면' }
  ])
};

const MRLyricsCard: React.FC<MRLyricsCardProps> = ({
  currentSong = {
    id: '1',
    title: 'NEURAL DANCE',
    artist: 'CYBER COLLECTIVE',
    genre: 'Cyberpunk',
    duration: '3:00',
    youtubeId: undefined // 기본값은 YouTube MR 없음
  },
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
  const currentLyrics = lyricsDatabase[currentSong.id] || lyricsDatabase['1'];
  
  // 유튜브 MR 제어 - 특정 곡들에 대해 YouTube MR 재생
  const currentSongYoutubeId: string | undefined = (currentSong as { youtubeId?: string }).youtubeId;
  // 곡 ID '21', '27015', '27071' 또는 youtubeId가 있는 경우 YouTube MR 사용
  const isYouTubeMR = Boolean(currentSong.id === '21' || currentSong.id === '27015' || currentSong.id === '27071' || currentSongYoutubeId);
  // 곡별 YouTube MR 비디오 ID 설정
  const getYouTubeVideoId = () => {
    if (currentSongYoutubeId) return currentSongYoutubeId;
    if (currentSong.id === '21') return 'szCnpElg-4k'; // https://www.youtube.com/watch?v=szCnpElg-4k
    if (currentSong.id === '27015') return 'NHwn7cGbciU'; // https://www.youtube.com/watch?v=NHwn7cGbciU
    if (currentSong.id === '27071') return 'UZy29hJkWfY'; // https://www.youtube.com/watch?v=UZy29hJkWfY
    return 'szCnpElg-4k'; // 기본값
  };
  const youTubeVideoId = getYouTubeVideoId();
  const playerRef = useRef<YouTubeMRPlayerHandle | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);

  // YouTube 플레이어 재시작 함수
  const resetAndPlayYouTube = async () => {
    if (!isYouTubeMR || !playerRef.current || !isPlayerReady || isPlayerLoading) {
      console.log('Cannot play YouTube: MR:', isYouTubeMR, 'Player:', !!playerRef.current, 'Ready:', isPlayerReady, 'Loading:', isPlayerLoading);
      return;
    }

    setIsPlayerLoading(true);
    console.log('Resetting and playing YouTube from start');
    
    try {
      const player = playerRef.current;
      
      // 1. 먼저 일시정지
      player.pause();
      
      // 2. 잠시 대기 후 0초로 이동
      await new Promise(resolve => setTimeout(resolve, 200));
      player.seekTo(0);
      
      // 3. 다시 잠시 대기 후 한 번 더 0초로 이동 (확실히 하기 위해)
      await new Promise(resolve => setTimeout(resolve, 300));
      player.seekTo(0);
      
      // 4. 볼륨 설정
      const targetVolume = Math.round((volume ?? 0.7) * 100);
      player.setVolume(targetVolume);
      
      // 5. 재생 시작
      await new Promise(resolve => setTimeout(resolve, 500));
      player.play();
      
      console.log('YouTube play started successfully from beginning');
      
      // 6. 재생 시작 후 위치 확인 및 보정
      setTimeout(() => {
        if (player && isPlayerReady) {
          const currentTime = player.getCurrentTime();
          if (currentTime > 3) { // 3초 이상이면 다시 0초로
            console.log('Correcting playback position to start, current was:', currentTime);
            player.seekTo(0);
          }
        }
        setIsPlayerLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('YouTube play error:', error);
      setIsPlayerLoading(false);
    }
  };

  // YouTube 플레이어 정지 함수
  const stopYouTube = async () => {
    if (!isYouTubeMR || !playerRef.current || !isPlayerReady) {
      return;
    }

    console.log('Stopping YouTube and resetting to start');
    
    try {
      const player = playerRef.current;
      
      // 1. 일시정지
      player.pause();
      
      // 2. 잠시 대기 후 0초로 이동
      await new Promise(resolve => setTimeout(resolve, 200));
      player.seekTo(0);
      
      // 3. 한 번 더 확인
      setTimeout(() => {
        if (player && isPlayerReady) {
          player.seekTo(0);
          console.log('YouTube stopped and reset to beginning');
        }
      }, 300);
      
    } catch (error) {
      console.error('YouTube stop error:', error);
    }
  };

  // isPlaying 상태 변화 감지
  useEffect(() => {
    if (!isYouTubeMR || !isPlayerReady) return;
    
    if (isPlaying) {
      resetAndPlayYouTube();
    } else {
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

  // 유튜브 현재 시간 폴링하여 상위 업데이트
  useEffect(() => {
    if (!isYouTubeMR || !playerRef.current || !isPlayerReady) return;
    
    const interval = window.setInterval(() => {
      try {
        const ct = playerRef.current?.getCurrentTime() ?? currentTime;
        const du = playerRef.current?.getDuration() ?? duration;
        if (typeof onTimeUpdateRequest === 'function') {
          onTimeUpdateRequest(ct, du || undefined);
        }
      } catch (error) {
        // 에러는 조용히 무시 (플레이어가 준비되지 않았을 수 있음)
      }
    }, 500);
    
    return () => window.clearInterval(interval);
  }, [isYouTubeMR, onTimeUpdateRequest, isPlayerReady]);

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
                playing={false} // 수동 제어로 변경
                onSongFinished={onSongFinished}
                onPlayerReady={() => {
                  console.log('YouTube player ready callback received');
                  setIsPlayerReady(true);
                  setIsPlayerLoading(false);
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
            
            {/* 컨트롤 가이드 */}
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
                  {isPlaying ? '정지하면 처음부터 다시 시작됩니다' : '▶️ 재생 | 🗑️ 삭제'}
                  {isPlayerLoading && <><br /><span style={{ color: '#ff0080' }}>로딩 중...</span></>}
                </>
              ) : (
                <>
                  <span style={{ color: '#ff0080' }}>🎤 일반 모드</span><br />
                  {isPlaying ? '정지하면 처음부터 다시 시작됩니다' : '▶️ 재생 | 🗑️ 삭제'}
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
                console.log('Play/Stop button clicked, isYouTubeMR:', isYouTubeMR, 'isPlaying:', isPlaying, 'isPlayerReady:', isPlayerReady);
                
                // 로딩 중이면 무시
                if (isPlayerLoading) {
                  console.log('Player is loading, ignoring button click');
                  return;
                }
                
                // YouTube MR이 있는 경우 플레이어 준비 상태 확인
                if (isYouTubeMR && !isPlayerReady) {
                  console.warn('YouTube player not ready, ignoring button click');
                  return;
                }
                
                // 상위 컴포넌트에 상태 변경 알림 (YouTube 제어는 useEffect에서 처리)
                onPlayPause?.();
              }}
              disabled={isPlayerLoading}
              style={{
                background: isPlaying 
                  ? 'linear-gradient(45deg, #ff4444, #cc0000)' // 정지 - 빨간색
                  : 'linear-gradient(45deg, #00ffff, #ff0080)', // 재생 - 기존 컬러
                color: '#fff',
                width: '48px',
                height: '48px',
                border: 'none',
                borderRadius: '50%',
                cursor: isPlayerLoading ? 'not-allowed' : 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
                opacity: isPlayerLoading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isPlayerLoading) {
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