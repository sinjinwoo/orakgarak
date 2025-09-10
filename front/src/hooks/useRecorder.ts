import { useState, useRef, useCallback, useEffect } from 'react';
import { useRecordStore } from '../stores/recordStore';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  volumeLevel: number;
  pitchAccuracy: number;
  tempoAccuracy: number;
}

export interface RecordingControls {
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
}

export interface UseRecorderOptions {
  onRecordingStart?: () => void;
  onRecordingStop?: (audioBlob: Blob) => void;
  onVolumeChange?: (volume: number) => void;
  onPitchChange?: (accuracy: number) => void;
  onTempoChange?: (accuracy: number) => void;
}

export function useRecorder(options: UseRecorderOptions = {}): [RecordingState, RecordingControls] {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    volumeLevel: 0,
    pitchAccuracy: 0,
    tempoAccuracy: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 볼륨 레벨 분석
  const analyzeVolume = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // 평균 볼륨 계산
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedVolume = (average / 255) * 100;

    setState(prev => ({ ...prev, volumeLevel: normalizedVolume }));
    options.onVolumeChange?.(normalizedVolume);
  }, [options]);

  // 피치 분석 (간단한 버전)
  const analyzePitch = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatFrequencyData(dataArray);

    // 기본 주파수 감지 (간단한 버전)
    let maxValue = 0;
    let maxIndex = 0;

    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }

    // 주파수 계산
    const frequency = (maxIndex * audioContextRef.current!.sampleRate) / (bufferLength * 2);
    
    // 피치 정확도 계산 (임시로 랜덤 값 사용)
    const accuracy = Math.random() * 100;
    
    setState(prev => ({ ...prev, pitchAccuracy: accuracy }));
    options.onPitchChange?.(accuracy);
  }, [options]);

  // 템포 분석
  const analyzeTempo = useCallback(() => {
    // 실제로는 더 복잡한 템포 분석 알고리즘이 필요
    const accuracy = Math.random() * 100;
    
    setState(prev => ({ ...prev, tempoAccuracy: accuracy }));
    options.onTempoChange?.(accuracy);
  }, [options]);

  // 실시간 분석 루프
  const startAnalysis = useCallback(() => {
    const analyze = () => {
      analyzeVolume();
      analyzePitch();
      analyzeTempo();
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    analyze();
  }, [analyzeVolume, analyzePitch, analyzeTempo]);

  const stopAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;

      // 오디오 컨텍스트 설정
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(stream as any);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // MediaRecorder 설정
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        options.onRecordingStop?.(blob);
        
        // 스트림 정리
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start();
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        volumeLevel: 0,
        pitchAccuracy: 0,
        tempoAccuracy: 0,
      }));

      // 타이머 시작
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      // 분석 시작
      startAnalysis();
      
      options.onRecordingStart?.();

    } catch (error) {
      console.error(' 실패:', error);
    }
  }, [options, startAnalysis]);

  // 녹음 일시정지
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      stopAnalysis();
    }
  }, [stopAnalysis]);

  // 녹음 재개
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      
      // 타이머 재시작
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      
      // 분석 재시작
      startAnalysis();
    }
  }, [startAnalysis]);

  // 녹음 중지
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      
      setState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      stopAnalysis();
      
      // 녹음 데이터 반환
      return new Promise((resolve) => {
        const checkChunks = () => {
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            resolve(blob);
          } else {
            setTimeout(checkChunks, 100);
          }
        };
        checkChunks();
      });
    }
    
    return null;
  }, [stopAnalysis]);

  // 녹음 리셋
  const resetRecording = useCallback(() => {
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      volumeLevel: 0,
      pitchAccuracy: 0,
      tempoAccuracy: 0,
    });
    
    chunksRef.current = [];
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    stopAnalysis();
  }, [stopAnalysis]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const controls: RecordingControls = {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };

  return [state, controls];
}

// 녹음 품질 분석을 위한 훅
export function useRecordingQuality() {
  const [quality, setQuality] = useState({
    volume: 0,
    clarity: 0,
    stability: 0,
    overall: 0,
  });

  const analyzeQuality = useCallback((audioBlob: Blob) => {
    // 실제로는 오디오 분석 라이브러리를 사용해야 함
    // 여기서는 임시로 랜덤 값 사용
    
    const volume = Math.random() * 100;
    const clarity = Math.random() * 100;
    const stability = Math.random() * 100;
    const overall = (volume + clarity + stability) / 3;
    
    setQuality({
      volume: Math.round(volume),
      clarity: Math.round(clarity),
      stability: Math.round(stability),
      overall: Math.round(overall),
    });
  }, []);

  return {
    quality,
    analyzeQuality,
  };
}

// 녹음 히스토리를 위한 훅
export function useRecordingHistory() {
  const [recordings, setRecordings] = useState<Array<{
    id: string;
    blob: Blob;
    duration: number;
    timestamp: number;
    quality: number;
  }>>([]);

  const addRecording = useCallback((blob: Blob, duration: number, quality: number) => {
    const recording = {
      id: Math.random().toString(36).substr(2, 9),
      blob,
      duration,
      timestamp: Date.now(),
      quality,
    };
    
    setRecordings(prev => [recording, ...prev.slice(0, 9)]); // 최근 10개만 유지
  }, []);

  const removeRecording = useCallback((id: string) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setRecordings([]);
  }, []);

  return {
    recordings,
    addRecording,
    removeRecording,
    clearHistory,
  };
}
