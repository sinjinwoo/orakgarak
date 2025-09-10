import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

export interface AudioControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  load: (src: string) => void;
}

export interface UseAudioOptions {
  autoPlay?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onError?: (error: Event) => void;
}

export function useAudio(options: UseAudioOptions = {}): [AudioState, AudioControls] {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
  });

  // 오디오 엘리먼트 초기화
  useEffect(() => {
    const audio = new Audio();
    audio.preload = options.preload || 'metadata';
    audio.loop = options.loop || false;
    audioRef.current = audio;

    // 이벤트 리스너 등록
    const handleLoadStart = () => setState(prev => ({ ...prev, isLoading: true }));
    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        duration: audio.duration || 0,
        volume: audio.volume,
        playbackRate: audio.playbackRate,
      }));
      options.onLoadedMetadata?.(audio.duration || 0);
    };
    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
      options.onTimeUpdate?.(audio.currentTime);
    };
    const handlePlay = () => setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    const handlePause = () => setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false, isPaused: false, currentTime: 0 }));
      options.onEnded?.();
    };
    const handleError = (e: Event) => {
      setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
      options.onError?.(e);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [options]);

  // 컨트롤 함수들
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState(prev => ({ ...prev, currentTime: 0 }));
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
      setState(prev => ({ ...prev, volume: audioRef.current?.volume || 0 }));
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setState(prev => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  const load = useCallback((src: string) => {
    if (audioRef.current) {
      audioRef.current.src = src;
      setState(prev => ({ ...prev, isLoading: true }));
    }
  }, []);

  const controls: AudioControls = {
    play,
    pause,
    stop,
    seek,
    setVolume,
    setPlaybackRate,
    load,
  };

  return [state, controls];
}

// 볼륨 레벨 분석을 위한 훅
export function useVolumeAnalyzer(audioElement?: HTMLAudioElement) {
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioElement || !isAnalyzing) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioElement);

    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const analyze = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // 평균 볼륨 계산
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedVolume = (average / 255) * 100;
        
        setVolumeLevel(normalizedVolume);
        animationFrameRef.current = requestAnimationFrame(analyze);
      }
    };

    analyze();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [audioElement, isAnalyzing]);

  const startAnalyzing = useCallback(() => {
    setIsAnalyzing(true);
  }, []);

  const stopAnalyzing = useCallback(() => {
    setIsAnalyzing(false);
    setVolumeLevel(0);
  }, []);

  return {
    volumeLevel,
    isAnalyzing,
    startAnalyzing,
    stopAnalyzing,
  };
}

// 오디오 녹음을 위한 훅
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // 스트림 정리
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // 타이머 시작
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('녹음 시작 실패:', error);
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // 타이머 재시작
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, []);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl('');
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
}
