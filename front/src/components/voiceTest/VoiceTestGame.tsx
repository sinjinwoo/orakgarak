import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import {
  Mic,
  MicOff,
  PlayArrow,
  Pause,
  VolumeUp,
  MusicNote,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import type { VoiceTestStep, VoiceTestResult, VoiceTestSession } from '../../types/voiceAnalysis';

interface VoiceTestGameProps {
  onTestComplete: (results: VoiceTestResult[]) => void;
  onTestCancel: () => void;
}

// 테스트 단계 정의
const testSteps: VoiceTestStep[] = [
  {
    id: 'warmup',
    title: '🎤 워밍업',
    description: '마이크를 켜고 간단한 소리를 내보세요',
    instruction: '마이크 버튼을 누르고 "아" 소리를 3초간 내보세요',
    duration: 3,
    type: 'range'
  },
  {
    id: 'low_note',
    title: '🎵 낮은 음',
    description: '가장 낮은 음을 내보세요',
    instruction: '마이크 버튼을 누르고 가능한 한 낮은 음으로 "아" 소리를 4초간 내보세요',
    duration: 4,
    type: 'range'
  },
  {
    id: 'high_note',
    title: '🎶 높은 음',
    description: '가장 높은 음을 내보세요',
    instruction: '마이크 버튼을 누르고 가능한 한 높은 음으로 "아" 소리를 4초간 내보세요',
    duration: 4,
    type: 'range'
  },
  {
    id: 'sustain',
    title: '🎼 음 유지',
    description: '안정적으로 음을 유지해보세요',
    instruction: '마이크 버튼을 누르고 편안한 음으로 "아" 소리를 5초간 일정하게 유지해보세요',
    duration: 5,
    type: 'sustain'
  },
  {
    id: 'melody',
    title: '🎹 멜로디',
    description: '간단한 멜로디를 따라해보세요',
    instruction: '마이크 버튼을 누르고 "도레미파솔"을 따라 불러보세요',
    duration: 6,
    type: 'melody'
  }
];

const VoiceTestGame: React.FC<VoiceTestGameProps> = ({ onTestComplete, onTestCancel }) => {
  const [session, setSession] = useState<VoiceTestSession>({
    id: `session_${Date.now()}`,
    startTime: Date.now(),
    currentStep: 0,
    results: [],
    isCompleted: false,
    overallScore: 0
  });

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const currentStep = testSteps[session.currentStep];
  
  // currentStep이 undefined인 경우를 방지
  if (!currentStep) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          테스트 단계를 찾을 수 없습니다.
        </Typography>
        <Button
          variant="contained"
          onClick={handleCancel}
          sx={{ mt: 2 }}
        >
          테스트 취소
        </Button>
      </Box>
    );
  }

  // 오디오 분석 시작
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
      });
      
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      microphone.connect(analyser);
      
      // 볼륨 분석
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const analyzeVolume = () => {
        if (analyser && isRecording) {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setVolume(Math.min(100, (average / 255) * 100));
          animationRef.current = requestAnimationFrame(analyzeVolume);
        }
      };
      
      analyzeVolume();
    } catch (err) {
      setError('마이크 접근에 실패했습니다. 마이크 권한을 확인해주세요.');
    }
  }, [isRecording]);

  // 오디오 분석 중지
  const stopAudioAnalysis = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    if (microphoneRef.current) {
      try {
        microphoneRef.current.disconnect();
      } catch (error) {
        console.warn('마이크 연결 해제 중 오류:', error);
      }
      microphoneRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (error) {
        console.warn('오디오 컨텍스트 정리 중 오류:', error);
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setVolume(0);
  }, []);

  // 다음 단계로
  const nextStep = useCallback(() => {
    // 타이머 정리
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (session.currentStep < testSteps.length - 1) {
      setSession(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
      setCurrentTime(0);
    } else {
      // 테스트 완료
      const overallScore = Math.floor(
        session.results.reduce((sum, result) => sum + result.score, 0) / session.results.length
      );
      
      setSession(prev => ({
        ...prev,
        isCompleted: true,
        overallScore,
        endTime: Date.now()
      }));
      
      onTestComplete(session.results);
    }
  }, [session.currentStep, session.results, onTestComplete]);

  // 녹음 분석
  const analyzeRecording = useCallback(() => {
    setIsAnalyzing(true);
    
    // 시뮬레이션된 분석 (실제로는 오디오 데이터를 분석)
    setTimeout(() => {
      const result: VoiceTestResult = {
        stepId: currentStep.id,
        score: Math.floor(Math.random() * 40) + 60, // 60-100점
        data: {
          frequency: currentStep.type === 'range' ? Math.random() * 200 + 100 : undefined,
          stability: currentStep.type === 'sustain' ? Math.random() * 30 + 70 : undefined,
          accuracy: currentStep.type === 'melody' ? Math.random() * 25 + 75 : undefined,
          characteristics: {
            pitchVariation: Math.random() * 100,
            vibrato: Math.random() * 100,
            breathiness: Math.random() * 100,
            brightness: Math.random() * 100
          }
        },
        timestamp: Date.now()
      };
      
      setSession(prev => ({
        ...prev,
        results: [...prev.results, result]
      }));
      
      setIsAnalyzing(false);
      nextStep();
    }, 2000);
  }, [currentStep, nextStep]);

  // 녹음 중지
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    stopAudioAnalysis();
    
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // 분석 시작
    analyzeRecording();
  }, [stopAudioAnalysis, analyzeRecording]);

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsRecording(true);
      setCurrentTime(0);
      
      await startAudioAnalysis();
      
      // 타이머 시작
      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= currentStep.duration) {
            stopRecording();
            return currentStep.duration;
          }
          return newTime;
        });
      }, 100);
      
    } catch (err) {
      setError('녹음을 시작할 수 없습니다.');
      setIsRecording(false);
    }
  }, [currentStep.duration, startAudioAnalysis, stopRecording]);

  // 테스트 취소
  const handleCancel = useCallback(() => {
    stopAudioAnalysis();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onTestCancel();
  }, [stopAudioAnalysis, onTestCancel]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopAudioAnalysis();
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [stopAudioAnalysis]);

  const progress = (session.currentStep / testSteps.length) * 100;
  const timeProgress = (currentTime / currentStep.duration) * 100;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          🎤 목소리 테스트
        </Typography>
        <Typography variant="body1" color="text.secondary">
          당신의 음역대와 음색을 분석하여 맞춤 추천을 제공합니다
        </Typography>
      </Box>

      {/* 전체 진행률 */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            진행률
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {session.currentStep + 1} / {testSteps.length}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Paper>

      {/* 현재 단계 */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            {currentStep.title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            {currentStep.description}
          </Typography>
          
          <Paper elevation={1} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              📋 지시사항:
            </Typography>
            <Typography variant="body2">
              {currentStep.instruction}
            </Typography>
          </Paper>

          {/* 녹음 컨트롤 */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {!isRecording && !isAnalyzing && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Mic />}
                onClick={startRecording}
                sx={{ minWidth: 200, height: 60, fontSize: '1.1rem' }}
              >
                녹음 시작
              </Button>
            )}
            
            {isRecording && (
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<MicOff />}
                onClick={stopRecording}
                sx={{ minWidth: 200, height: 60, fontSize: '1.1rem' }}
              >
                녹음 중지
              </Button>
            )}
            
            {isAnalyzing && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={60} />
                <Typography variant="body1">
                  음성 분석 중...
                </Typography>
              </Box>
            )}
          </Box>

          {/* 시간 진행률 */}
          {isRecording && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  녹음 시간
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentTime.toFixed(1)}s / {currentStep.duration}s
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={timeProgress} 
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          {/* 볼륨 표시 */}
          {isRecording && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  음량
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(volume)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={volume} 
                color={volume > 50 ? 'success' : volume > 20 ? 'warning' : 'error'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 결과 표시 */}
      {session.results.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            📊 테스트 결과
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {session.results.map((result, index) => (
              <Box key={`${result.stepId}-${index}-${result.timestamp}`} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {testSteps[index]?.title || result.stepId}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {result.score}점
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* 취소 버튼 */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleCancel}
          startIcon={<Cancel />}
        >
          테스트 취소
        </Button>
      </Box>
    </Box>
  );
};

export default VoiceTestGame;
