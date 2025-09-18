import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type YouTubeMRPlayerHandle = {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (percent: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

interface YouTubeMRPlayerProps {
  videoId: string; // YouTube 비디오 ID (예: 'szCnpElg-4k' from https://www.youtube.com/watch?v=szCnpElg-4k)
  startSeconds?: number;
  volumePercent?: number; // 0-100
  playing?: boolean;
  onSongFinished?: () => void; // 곡이 끝났을 때 호출할 콜백
  onPlayerReady?: () => void; // 플레이어가 준비되었을 때 호출할 콜백
}

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (percent: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  mute: () => void;
  unMute: () => void;
  getIframe?: () => HTMLIFrameElement;
  destroy?: () => void;
};

declare global {
  interface Window {
    YT?: { Player: new (el: Element, opts: unknown) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// YouTube iframe API 로드 - MR 비디오 재생을 위해 필요
const loadYouTubeAPI = () => {
  if (window.YT && window.YT.Player) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      if (window.YT && window.YT.Player) {
        resolve();
      } else {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          resolve();
        };
      }
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api'; // YouTube iframe API 로드
    window.onYouTubeIframeAPIReady = () => resolve();
    document.body.appendChild(tag);
  });
};

const YouTubeMRPlayer = forwardRef<YouTubeMRPlayerHandle, YouTubeMRPlayerProps>(({
  videoId,
  startSeconds = 0,
  volumePercent = 70,
  playing = false,
  onSongFinished,
  onPlayerReady,
}, ref) => {
  const containerRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);

  // 플레이어가 실제로 준비되었는지 확인하는 함수
  const isPlayerActuallyReady = () => {
    return playerRef.current && 
           ready && 
           typeof playerRef.current.playVideo === 'function' &&
           typeof playerRef.current.pauseVideo === 'function' &&
           typeof playerRef.current.setVolume === 'function';
  };

  useImperativeHandle(ref, () => ({
    play: () => {
      if (isPlayerActuallyReady()) {
        try {
          playerRef.current!.playVideo();
          console.log('YouTube playVideo called successfully');
        } catch (error) {
          console.error('YouTube playVideo failed:', error);
        }
      } else {
        console.warn('YouTube player not ready for play operation', {
          hasPlayer: !!playerRef.current,
          ready,
          hasPlayVideo: playerRef.current ? typeof playerRef.current.playVideo === 'function' : false
        });
      }
    },
    pause: () => {
      if (isPlayerActuallyReady()) {
        try {
          playerRef.current!.pauseVideo();
          console.log('YouTube pauseVideo called successfully');
        } catch (error) {
          console.error('YouTube pauseVideo failed:', error);
        }
      } else {
        console.warn('YouTube player not ready for pause operation', {
          hasPlayer: !!playerRef.current,
          ready,
          hasPauseVideo: playerRef.current ? typeof playerRef.current.pauseVideo === 'function' : false
        });
      }
    },
    seekTo: (seconds: number) => {
      if (isPlayerActuallyReady()) {
        try {
          playerRef.current!.seekTo(seconds, true);
          console.log('YouTube seekTo called successfully');
        } catch (error) {
          console.error('YouTube seekTo failed:', error);
        }
      } else {
        console.warn('YouTube player not ready for seek operation');
      }
    },
    setVolume: (percent: number) => {
      if (isPlayerActuallyReady()) {
        try {
          playerRef.current!.setVolume(Math.max(0, Math.min(100, Math.round(percent))));
          console.log('YouTube setVolume called successfully');
        } catch (error) {
          console.error('YouTube setVolume failed:', error);
        }
      } else {
        console.warn('YouTube player not ready for volume operation');
      }
    },
    getCurrentTime: () => {
      if (isPlayerActuallyReady()) {
        try {
          return playerRef.current!.getCurrentTime() ?? 0;
        } catch (error) {
          console.error('YouTube getCurrentTime failed:', error);
          return 0;
        }
      }
      return 0;
    },
    getDuration: () => {
      if (isPlayerActuallyReady()) {
        try {
          return playerRef.current!.getDuration() ?? 0;
        } catch (error) {
          console.error('YouTube getDuration failed:', error);
          return 0;
        }
      }
      return 0;
    }
  }), [ready]);

  useEffect(() => {
    let isMounted = true;
    loadYouTubeAPI().then(() => {
      if (!isMounted || !containerRef.current) return;
      // 이미 생성된 경우 파괴
      if (playerRef.current) {
        if (playerRef.current.destroy) {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
        }
        playerRef.current = null;
      }
      playerRef.current = new window.YT!.Player(containerRef.current, {
        videoId,
        playerVars: {
          start: Math.max(0, Math.floor(startSeconds)),
          autoplay: playing ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          // 임베드 제한 우회 시도
          origin: window.location.origin,
          enablejsapi: 1
        },
        events: {
          onReady: () => {
            console.log('YouTube Player Ready - checking methods...');
            
            // 플레이어 메서드들이 실제로 사용 가능한지 확인
            const hasRequiredMethods = playerRef.current && 
              typeof playerRef.current.playVideo === 'function' &&
              typeof playerRef.current.pauseVideo === 'function' &&
              typeof playerRef.current.setVolume === 'function';
            
            if (hasRequiredMethods) {
              console.log('YouTube Player fully ready with all methods');
              setReady(true);
              
              // 상위 컴포넌트에 플레이어 준비 완료 알림
              if (onPlayerReady) {
                onPlayerReady();
              }
              
              // autoplay 권한 부여
              const iframe = playerRef.current?.getIframe?.();
              if (iframe) {
                iframe.setAttribute('allow', 'autoplay; encrypted-media; microphone');
                iframe.setAttribute('tabindex', '-1');
              }
              const targetVolume = Math.max(0, Math.min(100, Math.round(volumePercent)));
              
              // 자동재생 정책 우회: 무음→재생→볼륨복구 시퀀스
              if (playerRef.current) {
                try {
                  playerRef.current.mute();
                  if (playing) {
                    playerRef.current.playVideo();
                    console.log('Auto-play attempted');
                  }
                  setTimeout(() => {
                    if (playerRef.current && targetVolume > 0) {
                      playerRef.current.unMute();
                      playerRef.current.setVolume(targetVolume);
                      console.log('Volume restored to', targetVolume);
                    }
                  }, 300);
                } catch (error) {
                  console.error('Auto-play setup failed:', error);
                }
              }
            } else {
              console.warn('YouTube Player ready but methods not available yet, retrying...');
              // 메서드가 아직 준비되지 않았으면 잠시 후 다시 시도
              setTimeout(() => {
                const recheckMethods = playerRef.current && 
                  typeof playerRef.current.playVideo === 'function' &&
                  typeof playerRef.current.pauseVideo === 'function' &&
                  typeof playerRef.current.setVolume === 'function';
                
                if (recheckMethods) {
                  console.log('YouTube Player methods now available');
                  setReady(true);
                  if (onPlayerReady) {
                    onPlayerReady();
                  }
                } else {
                  console.error('YouTube Player methods still not available');
                }
              }, 500);
            }
          },
          onStateChange: (event: { data: number }) => {
            console.log('YouTube Player State:', event.data);
            // 상태 0: 종료됨 (곡이 끝남)
            if (event.data === 0 && onSongFinished) {
              console.log('Song finished, calling onSongFinished');
              onSongFinished();
            }
          },
          onError: (event: { data: number }) => {
            console.error('YouTube Player Error:', event.data);
            // 오류 코드별 처리
            switch (event.data) {
              case 2:
                console.error('Invalid video ID');
                break;
              case 5:
                console.error('HTML5 player error');
                break;
              case 100:
                console.error('Video not found');
                break;
              case 101:
              case 150:
                console.error('Video cannot be embedded (restricted by owner)');
                // 대체 영상으로 시도할 수 있음
                break;
              default:
                console.error('Unknown YouTube error');
            }
          }
        },
      });
    });
    return () => {
      isMounted = false;
      if (playerRef.current) {
        if (playerRef.current.destroy) {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
        }
        playerRef.current = null;
      }
    };
  }, [videoId, playing, startSeconds, volumePercent]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;
    playerRef.current.setVolume(Math.max(0, Math.min(100, Math.round(volumePercent))));
  }, [volumePercent, ready]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (playing) playerRef.current.playVideo(); else playerRef.current.pauseVideo();
  }, [playing, ready]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '-1000px', 
      left: '-1000px', 
      width: '560px', 
      height: '315px', 
      zIndex: -9999,
      pointerEvents: 'none',
      opacity: 0
    }}>
      <iframe
        ref={containerRef}
        width="560"
        height="315"
        // YouTube MR 비디오 임베드 URL (예: https://www.youtube.com/watch?v=szCnpElg-4k)
        src={`https://www.youtube.com/embed/${videoId}?autoplay=${playing ? 1 : 0}&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
        title="YouTube MR Player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
});

export default YouTubeMRPlayer;


