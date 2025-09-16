import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';

export type YouTubeMRPlayerHandle = {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (percent: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isReady: () => boolean;
};

interface YouTubeMRPlayerProps {
  videoId: string;
  startSeconds?: number;
  volumePercent?: number; // 0-100
  playing?: boolean;
  onReady?: () => void;
  onError?: (error: any) => void;
  onStateChange?: (state: number) => void;
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
  getPlayerState: () => number;
  getIframe?: () => HTMLIFrameElement;
  destroy?: () => void;
};

// YouTube Player States
const YTPlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
};

declare global {
  interface Window {
    YT?: { 
      Player: new (el: Element, opts: unknown) => YTPlayer;
      PlayerState: typeof YTPlayerState;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const loadYouTubeAPI = (): Promise<void> => {
  if (window.YT && window.YT.Player) return Promise.resolve();
  
  return new Promise<void>((resolve, reject) => {
    // 이미 스크립트가 로딩 중인지 확인
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    
    if (existing) {
      // 이미 로드된 경우
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }
      
      // 로딩 중인 경우 기다림
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('YouTube API loading timeout'));
      }, 10000);
      
      return;
    }

    // 새로 로드
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => reject(new Error('Failed to load YouTube API'));
    
    const originalCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      originalCallback?.();
      resolve();
    };
    
    document.body.appendChild(tag);
  });
};

const YouTubeMRPlayer = forwardRef<YouTubeMRPlayerHandle, YouTubeMRPlayerProps>(({
  videoId,
  startSeconds = 0,
  volumePercent = 70,
  playing = false,
  onReady,
  onError,
  onStateChange
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(videoId);

  // 플레이어 준비 완료 콜백
  const handleReady = useCallback(() => {
    console.log('YouTube MR Player ready');
    setReady(true);
    onReady?.();
  }, [onReady]);

  // 에러 콜백
  const handleError = useCallback((error: any) => {
    console.error('YouTube MR Player error:', error);
    setReady(false);
    onError?.(error);
  }, [onError]);

  // 상태 변경 콜백
  const handleStateChange = useCallback((event: any) => {
    const state = event.data;
    console.log('YouTube MR Player state changed:', state);
    onStateChange?.(state);
    
    // 자동재생 정책 우회를 위한 추가 처리
    if (state === YTPlayerState.CUED && playing) {
      // 비디오가 큐되고 재생 요청이 있으면 재생 시도
      setTimeout(() => {
        if (playerRef.current && ready) {
          try {
            playerRef.current.playVideo();
          } catch (err) {
            console.warn('Auto-play failed:', err);
          }
        }
      }, 100);
    }
  }, [onStateChange, playing, ready]);

  // 플레이어 제어 메서드들
  useImperativeHandle(ref, () => ({
    play: () => {
      if (playerRef.current && ready) {
        try {
          playerRef.current.playVideo();
          console.log('YouTube MR play command executed');
        } catch (error) {
          console.error('Play error:', error);
          handleError(error);
        }
      }
    },
    pause: () => {
      if (playerRef.current && ready) {
        try {
          playerRef.current.pauseVideo();
          console.log('YouTube MR pause command executed');
        } catch (error) {
          console.error('Pause error:', error);
          handleError(error);
        }
      }
    },
    seekTo: (seconds: number) => {
      if (playerRef.current && ready) {
        try {
          const safeSeconds = Math.max(0, Math.floor(seconds));
          playerRef.current.seekTo(safeSeconds, true);
          console.log(`YouTube MR seek to ${safeSeconds}s`);
        } catch (error) {
          console.error('Seek error:', error);
          handleError(error);
        }
      }
    },
    setVolume: (percent: number) => {
      if (playerRef.current && ready) {
        try {
          const safeVolume = Math.max(0, Math.min(100, Math.round(percent)));
          playerRef.current.setVolume(safeVolume);
          if (safeVolume > 0) {
            playerRef.current.unMute();
          }
          console.log(`YouTube MR volume set to ${safeVolume}%`);
        } catch (error) {
          console.error('Volume error:', error);
          handleError(error);
        }
      }
    },
    getCurrentTime: () => {
      if (playerRef.current && ready) {
        try {
          return playerRef.current.getCurrentTime() ?? 0;
        } catch (error) {
          console.error('getCurrentTime error:', error);
          return 0;
        }
      }
      return 0;
    },
    getDuration: () => {
      if (playerRef.current && ready) {
        try {
          return playerRef.current.getDuration() ?? 0;
        } catch (error) {
          console.error('getDuration error:', error);
          return 0;
        }
      }
      return 0;
    },
    isReady: () => ready
  }), [ready]);

  // YouTube API 로드
  useEffect(() => {
    let mounted = true;

    loadYouTubeAPI()
      .then(() => {
        if (mounted) {
          setApiLoaded(true);
        }
      })
      .catch((error) => {
        console.error('Failed to load YouTube API:', error);
        if (mounted) {
          handleError(error);
        }
      });

    return () => {
      mounted = false;
    };
  }, [handleError]);

  // 플레이어 생성/재생성
  useEffect(() => {
    if (!apiLoaded || !containerRef.current || !videoId) return;

    let mounted = true;

    // 기존 플레이어 정리
    if (playerRef.current) {
      try {
        if (playerRef.current.destroy) {
          playerRef.current.destroy();
        }
      } catch (error) {
        console.warn('Player destroy error:', error);
      }
      playerRef.current = null;
      setReady(false);
    }

    // 새 플레이어 생성
    try {
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
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            if (!mounted) return;
            
            console.log('YouTube player onReady');
            
            // iframe 설정
            const iframe = event.target?.getIframe?.();
            if (iframe) {
              iframe.setAttribute('allow', 'autoplay; encrypted-media');
              iframe.setAttribute('tabindex', '-1');
              iframe.style.width = '1px';
              iframe.style.height = '1px';
              iframe.style.position = 'absolute';
              iframe.style.left = '-9999px';
              iframe.style.top = '-9999px';
              iframe.style.visibility = 'hidden';
            }

            // 초기 설정
            const targetVolume = Math.max(0, Math.min(100, Math.round(volumePercent)));
            
            // 자동재생 정책 우회: mute → 볼륨 설정
            if (event.target) {
              event.target.mute();
              
              if (playing) {
                // 사용자 인터랙션이 있었다고 가정하고 재생 시도
                setTimeout(() => {
                  if (mounted && event.target) {
                    try {
                      event.target.playVideo();
                    } catch (err) {
                      console.warn('Initial play failed:', err);
                    }
                  }
                }, 100);
              }
              
              // 볼륨 설정
              setTimeout(() => {
                if (mounted && event.target) {
                  event.target.setVolume(targetVolume);
                  if (targetVolume > 0) {
                    event.target.unMute();
                  }
                }
              }, 500);
            }
            
            handleReady();
          },
          onStateChange: handleStateChange,
          onError: (event: any) => {
            if (!mounted) return;
            console.error('YouTube player error:', event.data);
            handleError(event.data);
          }
        }
      });

      setCurrentVideoId(videoId);

    } catch (error) {
      console.error('Player creation error:', error);
      if (mounted) {
        handleError(error);
      }
    }

    return () => {
      mounted = false;
      if (playerRef.current) {
        try {
          if (playerRef.current.destroy) {
            playerRef.current.destroy();
          }
        } catch (error) {
          console.warn('Cleanup destroy error:', error);
        }
        playerRef.current = null;
      }
      setReady(false);
    };
  }, [apiLoaded, videoId, startSeconds, volumePercent, playing, handleReady, handleStateChange, handleError]);

  // 비디오 변경 처리
  useEffect(() => {
    if (currentVideoId !== videoId && ready && playerRef.current) {
      console.log(`Changing video from ${currentVideoId} to ${videoId}`);
      // 비디오 변경 시 플레이어 재생성이 필요할 수 있음
      setCurrentVideoId(videoId);
      setReady(false);
    }
  }, [videoId, currentVideoId, ready]);

  // 재생/일시정지 상태 동기화
  useEffect(() => {
    if (!ready || !playerRef.current) return;

    try {
      const currentState = playerRef.current.getPlayerState();
      
      if (playing && (currentState === YTPlayerState.PAUSED || currentState === YTPlayerState.CUED)) {
        playerRef.current.playVideo();
      } else if (!playing && currentState === YTPlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      }
    } catch (error) {
      console.error('State sync error:', error);
    }
  }, [playing, ready]);

  // 볼륨 동기화
  useEffect(() => {
    if (!ready || !playerRef.current) return;

    try {
      const targetVolume = Math.max(0, Math.min(100, Math.round(volumePercent)));
      playerRef.current.setVolume(targetVolume);
      
      if (targetVolume > 0) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
    } catch (error) {
      console.error('Volume sync error:', error);
    }
  }, [volumePercent, ready]);

  return (
    <div style={{ 
      width: '1px', 
      height: '1px', 
      overflow: 'hidden',
      position: 'absolute',
      left: '-9999px',
      top: '-9999px',
      visibility: 'hidden',
      pointerEvents: 'none'
    }}>
      <div 
        ref={containerRef} 
        style={{ 
          width: '1px', 
          height: '1px' 
        }} 
      />
    </div>
  );
});

YouTubeMRPlayer.displayName = 'YouTubeMRPlayer';

export default YouTubeMRPlayer;