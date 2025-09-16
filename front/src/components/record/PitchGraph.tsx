/**
 * 실시간 피치 그래프 컴포넌트
 * - Web Audio API를 활용한 실시간 피치 감지
 * - 피치 데이터를 line chart로 시각화
 * - 녹음 상태에 따라 자동으로 활성화/비활성화
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface PitchGraphProps {
  isRecording: boolean;
}

interface PitchData {
  frequency: number;
  timestamp: number;
  note: string;
  octave: number;
  cents: number;
}

const PitchGraph: React.FC<PitchGraphProps> = ({ isRecording }) => {
  // 상태 관리
  const [pitchData, setPitchData] = useState<PitchData[]>([]);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    micLevel: 0,
    dataPoints: 0,
    lastUpdate: '',
    isDetecting: false,
    error: ''
  });
  
  // refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);

  // 음계 정보
  const noteNames = useMemo(() => ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], []);
  
  // 주파수를 음계로 변환
  const frequencyToNote = useCallback((frequency: number): { note: string; octave: number; cents: number } => {
    if (frequency <= 0) return { note: '', octave: 0, cents: 0 };
    
    // A4 = 440Hz를 기준으로 계산
    const A4 = 440;
    const semitone = 12 * Math.log2(frequency / A4);
    const noteNumber = Math.round(semitone) + 69; // MIDI note number
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    const note = noteNames[noteIndex < 0 ? noteIndex + 12 : noteIndex];
    
    // 센트 계산
    const cents = (semitone - Math.round(semitone)) * 100;
    
    return { note, octave, cents: Math.round(cents) };
  }, [noteNames]);

  // 간단하고 효과적인 피치 감지 알고리즘 (주파수 도메인 분석)
  const detectFundamentalFrequency = useCallback((buffer: Float32Array, sampleRate: number): number => {
    // 1. 신호 에너지 계산 (노이즈 필터링)
    let energy = 0;
    for (let i = 0; i < buffer.length; i++) {
      energy += Math.abs(buffer[i]);
    }
    energy = energy / buffer.length;
    
    // 2. 최소 에너지 임계값 (너무 작은 소리는 무시)
    if (energy < 0.01) {
      return 0;
    }
    
    // 3. 주파수 도메인에서 최대 피크 찾기
    let maxMagnitude = -Infinity;
    let maxIndex = 0;
    
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] > maxMagnitude) {
        maxMagnitude = buffer[i];
        maxIndex = i;
      }
    }
    
    // 4. 주파수 계산
    const frequency = (maxIndex / buffer.length) * (sampleRate / 2);
    
    // 5. 음성 주파수 범위 확인 (80Hz ~ 800Hz)
    if (frequency < 80 || frequency > 800) {
      return 0;
    }
    
    // 6. 신호 강도 확인 (dB 스케일에서 -50dB 이상)
    if (maxMagnitude < -50) {
      return 0;
    }
    
    console.log('🎵 피치 감지:', {
      frequency: Math.round(frequency),
      magnitude: maxMagnitude.toFixed(2),
      energy: energy.toFixed(4),
      index: maxIndex
    });
    
    return frequency;
  }, []);

  // 피치 분석 함수 (간단하고 안정적)
  const analyzePitch = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    // 주파수 도메인 데이터 가져오기
    analyserRef.current.getFloatFrequencyData(dataArrayRef.current);
    
    // 마이크 입력 레벨 계산 (볼륨 표시용)
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += Math.abs(dataArrayRef.current[i]);
    }
    const micLevel = (sum / dataArrayRef.current.length) * 100;
    
    // 피치 감지
    const frequency = detectFundamentalFrequency(dataArrayRef.current, audioContextRef.current?.sampleRate || 44100);
    
    // 디버그 정보 업데이트
    setDebugInfo(prev => ({
      ...prev,
      micLevel: Math.round(micLevel),
      dataPoints: pitchData.length,
      lastUpdate: new Date().toLocaleTimeString(),
      isDetecting: frequency > 0,
      error: ''
    }));
    
    // 피치가 감지되면 데이터 추가
    if (frequency > 0) {
      const noteInfo = frequencyToNote(frequency);
      const pitchDataPoint: PitchData = {
        frequency,
        timestamp: Date.now(),
        note: noteInfo.note,
        octave: noteInfo.octave,
        cents: noteInfo.cents,
      };
      
      setCurrentPitch(pitchDataPoint);
      setPitchData(prev => [...prev.slice(-199), pitchDataPoint]); // 최근 200개만 유지
    }
  }, [pitchData.length, frequencyToNote, detectFundamentalFrequency]);

  // 그래프 그리기 함수
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // 캔버스 클리어
    ctx.clearRect(0, 0, width, height);
    
    // 배경
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // 마이크 입력 레벨 표시
    const micLevelBar = (debugInfo.micLevel / 100) * width;
    ctx.fillStyle = debugInfo.micLevel > 5 ? '#4CAF50' : '#666';
    ctx.fillRect(0, height - 5, micLevelBar, 5);

    // 피치 데이터 정규화 (80Hz ~ 800Hz 범위)
    const minFreq = 80;
    const maxFreq = 800;
    
    // 시간 범위 계산 (최근 15초)
    const now = Date.now();
    const timeRange = 15000; // 15초
    const startTime = now - timeRange;
    
    // 최근 15초 데이터 필터링 및 정규화
    const normalizedData = pitchData
      .filter(p => p.timestamp >= startTime) // 최근 15초 데이터만
      .map((p) => ({
        x: ((p.timestamp - startTime) / timeRange) * width,
        y: height - ((p.frequency - minFreq) / (maxFreq - minFreq)) * height,
        frequency: p.frequency,
        note: p.note,
        octave: p.octave,
        cents: p.cents
      }))
      .sort((a, b) => a.x - b.x); // X 좌표 순으로 정렬

    // 상태 표시
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`마이크: ${debugInfo.micLevel}%`, 5, 15);
    ctx.fillText(`데이터: ${debugInfo.dataPoints}개`, 5, 30);
    ctx.fillText(`감지: ${debugInfo.isDetecting ? 'YES' : 'NO'}`, 5, 45);
    ctx.fillText(`그래프: ${normalizedData.length}개`, 5, 60);

    if (pitchData.length < 2) {
      // 데이터가 없을 때 안내 메시지
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('피치 데이터를 수집 중...', width / 2, height / 2);
      ctx.fillText('마이크에 소리를 내보세요', width / 2, height / 2 + 20);
      return;
    }

    // 그리드 그리기
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // 수평선 (주파수 기준선)
    const midY = height / 2;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();


    // 피치 라인 그리기
    if (normalizedData.length > 0) {
      // 메인 피치 라인
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      // 첫 번째 점으로 이동
      ctx.moveTo(normalizedData[0].x, normalizedData[0].y);
      
      // 나머지 점들을 연결
      for (let i = 1; i < normalizedData.length; i++) {
        ctx.lineTo(normalizedData[i].x, normalizedData[i].y);
      }
      
      ctx.stroke();
      
      // 그라데이션 배경 (피치 영역)
      if (normalizedData.length > 1) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#4CAF5020');
        gradient.addColorStop(1, '#4CAF5005');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(normalizedData[0].x, height);
        for (let i = 0; i < normalizedData.length; i++) {
          ctx.lineTo(normalizedData[i].x, normalizedData[i].y);
        }
        ctx.lineTo(normalizedData[normalizedData.length - 1].x, height);
        ctx.closePath();
        ctx.fill();
      }
      
      // 최근 데이터 포인트들을 강조 표시
      ctx.fillStyle = '#4CAF50';
      normalizedData.slice(-10).forEach((point, index) => {
        const alpha = (index + 1) / 10; // 최근일수록 더 밝게
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1; // 알파값 리셋
    }

    // 현재 피치 표시 (실시간 움직임 강조)
    if (currentPitch) {
      const currentX = width - 20;
      const currentY = height - ((currentPitch.frequency - minFreq) / (maxFreq - minFreq)) * height;
      
      // 현재 피치 수평선 (깜빡이는 효과)
      const time = Date.now();
      const blink = Math.sin(time / 200) > 0; // 200ms마다 깜빡임
      ctx.strokeStyle = blink ? '#FF5722' : '#FF572280';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(width, currentY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // 현재 피치 점 (펄스 효과)
      const pulse = 4 + Math.sin(time / 100) * 2; // 100ms마다 크기 변화
      ctx.fillStyle = '#FF5722';
      ctx.beginPath();
      ctx.arc(currentX, currentY, pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // 외부 링 (펄스 효과)
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(currentX, currentY, pulse + 8, 0, Math.PI * 2);
      ctx.stroke();
      
      // 현재 피치 정보 텍스트 (배경 추가)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(currentX - 60, currentY - 25, 55, 35);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${currentPitch.note}${currentPitch.octave}`, currentX - 5, currentY - 8);
      ctx.font = '10px Arial';
      ctx.fillText(`${Math.round(currentPitch.frequency)}Hz`, currentX - 5, currentY + 8);
    }

    // 주파수 범위 표시
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${minFreq}Hz`, 5, height - 5);
    ctx.textAlign = 'right';
    ctx.fillText(`${maxFreq}Hz`, width - 5, 15);
  }, [pitchData, currentPitch, debugInfo.micLevel, debugInfo.dataPoints, debugInfo.isDetecting]);

  // 마이크 시작 함수
  const startMicrophone = useCallback(async () => {
    try {
      // 오디오 컨텍스트 생성
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass() as AudioContext;
      audioContextRef.current = audioContext;
      
      // 마이크 스트림 가져오기
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // 오디오 소스 생성
      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      
      // 분석기 생성
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      // 데이터 배열 생성
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Float32Array(bufferLength);
      
      // 연결
      microphone.connect(analyser);
      
      setIsActive(true);
      setPitchData([]);
      
    } catch (err) {
      console.error('마이크 접근 실패:', err);
      setIsActive(false);
      setDebugInfo(prev => ({
        ...prev,
        error: `마이크 접근 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
        micLevel: 0
      }));
    }
  }, []);

  // 리소스 정리 함수
  const cleanupResources = useCallback(() => {
    // 애니메이션 정리
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    
    // 마이크 연결 해제
    if (microphoneRef.current) {
      try {
        microphoneRef.current.disconnect();
      } catch (error) {
        console.warn('마이크 연결 해제 중 오류:', error);
      }
      microphoneRef.current = null;
    }
    
    // 오디오 컨텍스트 정리
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
    
    // 분석기 정리
    analyserRef.current = null;
    dataArrayRef.current = null;
    
    setIsActive(false);
    setCurrentPitch(null);
  }, []);

  // 마이크 중지 함수
  const stopMicrophone = useCallback(() => {
    cleanupResources();
  }, [cleanupResources]);

  // 녹음 상태에 따라 마이크 시작/중지
  useEffect(() => {
    if (isRecording) {
      startMicrophone();
    } else {
      stopMicrophone();
    }
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      cleanupResources();
    };
  }, [isRecording, startMicrophone, stopMicrophone, cleanupResources]);

  // 활성화 상태에 따라 애니메이션 시작/중지
  useEffect(() => {
    if (isActive) {
      const animate = () => {
        drawGraph();
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    }
  }, [isActive, drawGraph]);

  // 피치 분석 주기적 실행 (적절한 주기로 실시간성과 성능 균형)
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(analyzePitch, 100); // 100ms마다 분석 (10fps)
    return () => clearInterval(interval);
  }, [isActive, analyzePitch]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'linear-gradient(45deg, #00ffff, #ff0080)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
          }}>
            <Typography sx={{ color: '#000', fontSize: 20, fontWeight: 'bold' }}>🎵</Typography>
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#00ffff',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
              }}
            >
              NEURAL PITCH
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              FREQUENCY ANALYZER
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isActive ? '#00ff00' : '#888',
            boxShadow: isActive ? '0 0 10px #00ff00' : 'none',
            animation: isActive ? 'pulse 1s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 }
            }
          }} />
          <Typography 
            variant="caption" 
            sx={{ 
              color: isActive ? '#00ff00' : '#888',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontFamily: 'monospace'
            }}
          >
            {isActive ? 'ACTIVE' : 'STANDBY'}
          </Typography>
        </Box>
      </Box>
      
      {/* 디버그 정보 표시 */}
      <Paper elevation={1} sx={{ p: 1, mb: 2, backgroundColor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color={debugInfo.micLevel > 5 ? 'success.main' : 'text.secondary'}>
            마이크: {debugInfo.micLevel}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            데이터: {debugInfo.dataPoints}개
          </Typography>
          <Typography variant="caption" color={debugInfo.isDetecting ? 'success.main' : 'text.secondary'}>
            감지: {debugInfo.isDetecting ? 'YES' : 'NO'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            업데이트: {debugInfo.lastUpdate}
          </Typography>
        </Box>
        {debugInfo.error && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            {debugInfo.error}
          </Typography>
        )}
      </Paper>
      
      {/* 현재 피치 정보 표시 */}
      {currentPitch && (
        <Paper elevation={2} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            color: '#4CAF50',
            textShadow: `0 0 10px #4CAF5040`
          }}>
            {currentPitch.note}{currentPitch.octave}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(currentPitch.frequency)}Hz
            {currentPitch.cents !== 0 && ` (${currentPitch.cents > 0 ? '+' : ''}${currentPitch.cents}¢)`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isRecording ? '녹음 중...' : '대기 중...'}
          </Typography>
        </Paper>
      )}

      {/* 피치 그래프 캔버스 */}
      <Paper elevation={3} sx={{ overflow: 'hidden', borderRadius: 2 }}>
        <canvas
          ref={canvasRef}
          width={300}
          height={200}
          style={{
            width: '100%',
            height: '200px',
            display: 'block'
          }}
        />
      </Paper>
    </Box>
  );
};

export default PitchGraph;
