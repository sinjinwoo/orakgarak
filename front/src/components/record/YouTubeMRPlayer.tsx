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
        },
        events: {
          onReady: () => {
            setReady(true);
            // autoplay 권한 부여
            const iframe = playerRef.current?.getIframe?.();
            if (iframe) {
              iframe.setAttribute('allow', 'autoplay');
              iframe.setAttribute('tabindex', '-1');
              iframe.style.width = '1px';
              iframe.style.height = '1px';
              iframe.style.position = 'absolute';
              iframe.style.left = '-9999px';
            }
            const targetVolume = Math.max(0, Math.min(100, Math.round(volumePercent)));
            // mute → play → volume 올리기 (자동재생 우회)
            if (playerRef.current) playerRef.current.mute();
            if (playing && playerRef.current) playerRef.current.playVideo();
            setTimeout(() => {
              if (playerRef.current) playerRef.current.setVolume(targetVolume);
              if (targetVolume > 0 && playerRef.current) playerRef.current.unMute();
            }, 250);
          },
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
    <div style={{ width: '100%', height: '1px', opacity: 0, pointerEvents: 'none' }}>
      <div ref={containerRef} />
    </div>
  );
});

export default YouTubeMRPlayer;


