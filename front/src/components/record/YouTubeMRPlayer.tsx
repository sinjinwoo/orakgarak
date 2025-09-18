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
  videoId: string;
  startSeconds?: number;
  volumePercent?: number; // 0-100
  playing?: boolean;
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
    tag.src = 'https://www.youtube.com/iframe_api';
    window.onYouTubeIframeAPIReady = () => resolve();
    document.body.appendChild(tag);
  });
};

const YouTubeMRPlayer = forwardRef<YouTubeMRPlayerHandle, YouTubeMRPlayerProps>(({
  videoId,
  startSeconds = 0,
  volumePercent = 70,
  playing = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (playerRef.current && ready) playerRef.current.playVideo();
    },
    pause: () => {
      if (playerRef.current && ready) playerRef.current.pauseVideo();
    },
    seekTo: (seconds: number) => {
      if (playerRef.current && ready) playerRef.current.seekTo(seconds, true);
    },
    setVolume: (percent: number) => {
      if (playerRef.current && ready) playerRef.current.setVolume(Math.max(0, Math.min(100, Math.round(percent))));
    },
    getCurrentTime: () => {
      if (playerRef.current && ready && typeof playerRef.current.getCurrentTime === 'function') {
        return playerRef.current.getCurrentTime() ?? 0;
      }
      return 0;
    },
    getDuration: () => {
      if (playerRef.current && ready && typeof playerRef.current.getDuration === 'function') {
        return playerRef.current.getDuration() ?? 0;
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
            console.log('YouTube Player Ready');
            setReady(true);
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
          },
          onStateChange: (event: { data: number }) => {
            console.log('YouTube Player State:', event.data);
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


