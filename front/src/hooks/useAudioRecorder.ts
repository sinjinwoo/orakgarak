import { useState, useRef, useCallback, useEffect } from 'react';
import {
  RecordingState,
  AudioRecorderConfig,
  AudioVisualizationData,
  RecordingPermissions
} from '../types/recording';

interface UseAudioRecorderReturn {
  recordingState: RecordingState;
  visualizationData: AudioVisualizationData | null;
  permissions: RecordingPermissions;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  checkPermissions: () => Promise<RecordingPermissions>;
}

const DEFAULT_CONFIG: AudioRecorderConfig = {
  sampleRate: 44100,
  channelCount: 1,
  bitRate: 128000,
  mimeType: 'audio/webm;codecs=opus',
};

const FALLBACK_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/wav',
];

export const useAudioRecorder = (config: AudioRecorderConfig = {}): UseAudioRecorderReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    volume: 0,
  });

  const [visualizationData, setVisualizationData] = useState<AudioVisualizationData | null>(null);
  const [permissions, setPermissions] = useState<RecordingPermissions>({
    microphone: 'prompt',
    supported: typeof MediaRecorder !== 'undefined',
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  const getSupportedMimeType = useCallback((): string => {
    for (const mimeType of FALLBACK_MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return 'audio/webm';
  }, []);

  const checkPermissions = useCallback(async (): Promise<RecordingPermissions> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const result: RecordingPermissions = {
          microphone: 'denied',
          supported: false,
          error: 'MediaDevices API is not supported in this browser',
        };
        setPermissions(result);
        return result;
      }

      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      const result: RecordingPermissions = {
        microphone: permissionStatus.state as 'granted' | 'denied' | 'prompt',
        supported: typeof MediaRecorder !== 'undefined',
      };

      setPermissions(result);
      return result;
    } catch (error) {
      const result: RecordingPermissions = {
        microphone: 'prompt',
        supported: typeof MediaRecorder !== 'undefined',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setPermissions(result);
      return result;
    }
  }, []);

  const setupAudioContext = useCallback(async (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: finalConfig.sampleRate,
      });

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const gainNode = audioContext.createGain();
      const source = audioContext.createMediaStreamSource(stream);

      source.connect(gainNode);
      gainNode.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      gainNodeRef.current = gainNode;

      return { audioContext, analyser, gainNode };
    } catch (error) {
      console.error('Failed to setup audio context:', error);
      throw error;
    }
  }, [finalConfig.sampleRate]);

  const updateVisualization = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.fftSize);

    analyser.getByteFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(timeData);

    const volume = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length / 255;
    const peak = Math.max(...frequencyData) / 255;

    setVisualizationData({
      frequencyData,
      timeData,
      volume,
      peak,
    });

    setRecordingState(prev => ({ ...prev, volume }));

    if (recordingState.isRecording && !recordingState.isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  const updateDuration = useCallback(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      const elapsed = (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000;
      setRecordingState(prev => ({ ...prev, duration: elapsed }));
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: finalConfig.sampleRate,
          channelCount: finalConfig.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      await setupAudioContext(stream);

      const mimeType = finalConfig.mimeType || getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: finalConfig.bitRate,
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;

      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        volume: 0,
      });

      updateVisualization();

      const durationInterval = setInterval(updateDuration, 100);

      mediaRecorder.onstop = () => {
        clearInterval(durationInterval);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [finalConfig, setupAudioContext, getSupportedMimeType, updateVisualization, updateDuration]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || 'audio/webm',
        });

        setRecordingState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioData: blob,
        }));

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording && !recordingState.isPaused) {
      mediaRecorderRef.current.pause();
      pausedTimeRef.current += Date.now() - startTimeRef.current;

      setRecordingState(prev => ({ ...prev, isPaused: true }));

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording && recordingState.isPaused) {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();

      setRecordingState(prev => ({ ...prev, isPaused: false }));
      updateVisualization();
    }
  }, [recordingState.isRecording, recordingState.isPaused, updateVisualization]);

  const resetRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    chunksRef.current = [];
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;

    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      volume: 0,
      audioData: undefined,
    });

    setVisualizationData(null);
  }, []);

  useEffect(() => {
    checkPermissions();

    return () => {
      resetRecording();
    };
  }, [checkPermissions, resetRecording]);

  return {
    recordingState,
    visualizationData,
    permissions,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    checkPermissions,
  };
};