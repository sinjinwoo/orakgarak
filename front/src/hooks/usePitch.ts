import { useState, useEffect, useRef, useCallback } from 'react';
import { frequencyToNote, calculatePitchAccuracy } from '../utils/audio/pitchUtils';

export interface PitchData {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  accuracy: number;
  timestamp: number;
}

export interface PitchAnalysis {
  averageFrequency: number;
  dominantNote: string;
  pitchStability: number;
  accuracyScore: number;
  pitchHistory: PitchData[];
}

export interface UsePitchOptions {
  targetFrequency?: number;
  tolerance?: number; // 센트 단위
  sampleRate?: number;
  onPitchDetected?: (pitch: PitchData) => void;
  onAnalysisComplete?: (analysis: PitchAnalysis) => void;
}

export function usePitch(options: UsePitchOptions = {}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [pitchHistory, setPitchHistory] = useState<PitchData[]>([]);
  const [analysis, setAnalysis] = useState<PitchAnalysis | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);

  // 피치 감지 시작
  const startPitchDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;
      
      bufferRef.current = new Float32Array(analyser.frequencyBinCount);
      
      setIsAnalyzing(true);
      setPitchHistory([]);
      
      const detectPitch = () => {
        if (!analyserRef.current || !bufferRef.current) return;
        
        analyserRef.current.getFloatFrequencyData(bufferRef.current);
        
        const frequency = detectFundamentalFrequency(bufferRef.current, audioContext.sampleRate);
        
        if (frequency > 0) {
          const noteInfo = frequencyToNote(frequency);
          const accuracy = options.targetFrequency 
            ? calculatePitchAccuracy(options.targetFrequency, frequency, options.tolerance)
            : 100;
          
          const pitchData: PitchData = {
            frequency,
            note: noteInfo.note,
            octave: noteInfo.octave,
            cents: noteInfo.cents,
            accuracy,
            timestamp: Date.now(),
          };
          
          setCurrentPitch(pitchData);
          setPitchHistory(prev => [...prev.slice(-99), pitchData]); // 최근 100개만 유지
          
          options.onPitchDetected?.(pitchData);
        }
        
        animationFrameRef.current = requestAnimationFrame(detectPitch);
      };
      
      detectPitch();
      
    } catch (error) {
      console.error('피치 감지 시작 실패:', error);
    }
  }, [options]);

  // 피치 감지 중지
  const stopPitchDetection = useCallback(() => {
    setIsAnalyzing(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setCurrentPitch(null);
  }, []);

  // 피치 분석 수행
  const analyzePitch = useCallback(() => {
    if (pitchHistory.length === 0) return null;
    
    const frequencies = pitchHistory.map(p => p.frequency);
    const notes = pitchHistory.map(p => p.note);
    
    // 평균 주파수
    const averageFrequency = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
    
    // 가장 많이 나타나는 음계
    const noteCount: Record<string, number> = {};
    notes.forEach(note => {
      noteCount[note] = (noteCount[note] || 0) + 1;
    });
    const dominantNote = Object.entries(noteCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';
    
    // 피치 안정성 계산
    const variance = frequencies.reduce((sum, freq) => sum + Math.pow(freq - averageFrequency, 2), 0) / frequencies.length;
    const standardDeviation = Math.sqrt(variance);
    const pitchStability = Math.max(0, 100 - (standardDeviation / averageFrequency) * 100);
    
    // 정확도 점수
    const accuracyScore = pitchHistory.reduce((sum, p) => sum + p.accuracy, 0) / pitchHistory.length;
    
    const analysisResult: PitchAnalysis = {
      averageFrequency,
      dominantNote,
      pitchStability: Math.round(pitchStability),
      accuracyScore: Math.round(accuracyScore),
      pitchHistory: [...pitchHistory],
    };
    
    setAnalysis(analysisResult);
    options.onAnalysisComplete?.(analysisResult);
    
    return analysisResult;
  }, [pitchHistory, options]);

  // 기본 주파수 감지 (YIN 알고리즘 간단 버전)
  const detectFundamentalFrequency = (buffer: Float32Array, sampleRate: number): number => {
    const minPeriod = Math.floor(sampleRate / 800); // 최대 800Hz
    const maxPeriod = Math.floor(sampleRate / 80);  // 최소 80Hz
    
    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      let norm = 0;
      
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += buffer[i] * buffer[i + period];
        norm += buffer[i] * buffer[i];
      }
      
      if (norm > 0) {
        correlation /= norm;
        
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestPeriod = period;
        }
      }
    }
    
    if (bestCorrelation > 0.1) { // 임계값
      return sampleRate / bestPeriod;
    }
    
    return 0;
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopPitchDetection();
    };
  }, [stopPitchDetection]);

  return {
    isAnalyzing,
    currentPitch,
    pitchHistory,
    analysis,
    startPitchDetection,
    stopPitchDetection,
    analyzePitch,
  };
}

// 실시간 피치 모니터링을 위한 훅
export function usePitchMonitor(targetFrequency: number, tolerance: number = 50) {
  const [isInTune, setIsInTune] = useState(false);
  const [deviation, setDeviation] = useState(0);
  const [feedback, setFeedback] = useState<string>('');
  
  const { currentPitch, startPitchDetection, stopPitchDetection } = usePitch({
    targetFrequency,
    tolerance,
    onPitchDetected: (pitch) => {
      const accuracy = calculatePitchAccuracy(targetFrequency, pitch.frequency, tolerance);
      const centsDiff = Math.abs(pitch.cents);
      
      setIsInTune(accuracy >= 80);
      setDeviation(centsDiff);
      
      if (accuracy >= 90) {
        setFeedback('완벽합니다!');
      } else if (accuracy >= 80) {
        setFeedback('좋습니다!');
      } else if (accuracy >= 60) {
        setFeedback('조금 더 노력해보세요');
      } else {
        setFeedback('음정을 다시 확인해보세요');
      }
    },
  });

  return {
    isInTune,
    deviation,
    feedback,
    currentPitch,
    startMonitoring: startPitchDetection,
    stopMonitoring: stopPitchDetection,
  };
}

// 음역대 측정을 위한 훅
export function useVocalRangeMeasurement() {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementData, setMeasurementData] = useState<PitchData[]>([]);
  const [vocalRange, setVocalRange] = useState<{ min: number; max: number } | null>(null);
  
  const { currentPitch, startPitchDetection, stopPitchDetection } = usePitch({
    onPitchDetected: (pitch) => {
      if (isMeasuring && pitch.frequency > 0) {
        setMeasurementData(prev => [...prev, pitch]);
      }
    },
  });

  const startMeasurement = useCallback(() => {
    setIsMeasuring(true);
    setMeasurementData([]);
    setVocalRange(null);
    startPitchDetection();
  }, [startPitchDetection]);

  const stopMeasurement = useCallback(() => {
    setIsMeasuring(false);
    stopPitchDetection();
    
    if (measurementData.length > 0) {
      const frequencies = measurementData.map(p => p.frequency);
      const minFreq = Math.min(...frequencies);
      const maxFreq = Math.max(...frequencies);
      
      setVocalRange({ min: minFreq, max: maxFreq });
    }
  }, [measurementData, stopPitchDetection]);

  const resetMeasurement = useCallback(() => {
    setMeasurementData([]);
    setVocalRange(null);
  }, []);

  return {
    isMeasuring,
    measurementData,
    vocalRange,
    currentPitch,
    startMeasurement,
    stopMeasurement,
    resetMeasurement,
  };
}
