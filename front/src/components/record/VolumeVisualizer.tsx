/**
 * 실시간 볼륨 시각화 컴포넌트
 * - 녹음 상태에 따라 자동으로 마이크 입력 분석
 * - 단순한 파형과 원형 시각화로 볼륨 표시
 * - 녹음 중일 때만 활성화
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface VolumeVisualizerProps {
  isRecording: boolean;
}

const VolumeVisualizer: React.FC<VolumeVisualizerProps> = ({ isRecording }) => {
  // 상태 관리
  const [volume, setVolume] = useState(0);           // 현재 볼륨 레벨 (0-100)
  const [isActive, setIsActive] = useState(false);   // 시각화 활성화 상태
  
  // refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // 색상 팔레트 (볼륨에 따라 변화)
  const getColorPalette = (vol: number) => {
    if (vol < 20) return '#4A90E2'; // 파란색
    if (vol < 40) return '#32CD32'; // 초록색
    if (vol < 60) return '#FFD700'; // 노란색
    if (vol < 80) return '#FF6347'; // 주황색
    return '#FF0000'; // 빨간색
  };

  // 볼륨 분석 함수
  const analyzeVolume = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // 평균 볼륨 계산
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;
    const volumeLevel = Math.min(100, (average / 255) * 100);
    
    setVolume(volumeLevel);
  }, []);

  // 애니메이션 루프
  const animate = useCallback(() => {
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

    // 파형 그리기
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      const color = getColorPalette(volume);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sliceWidth = width / dataArrayRef.current.length;
      let x = 0;
      
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const v = dataArrayRef.current[i] / 255.0;
        const y = height - (v * height * 0.6) - height * 0.2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
    }

    // 중앙 원형 시각화
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = (volume / 100) * Math.min(width, height) * 0.25;
    const color = getColorPalette(volume);
    
    // 외부 링
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // 내부 원
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, color + '80');
    gradient.addColorStop(1, color + '20');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    animationRef.current = requestAnimationFrame(animate);
  }, [volume]);

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
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      // 데이터 배열 생성
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // 연결
      microphone.connect(analyser);
      
      setIsActive(true);
      
    } catch (err) {
      console.error('마이크 접근 실패:', err);
      setIsActive(false);
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
    setVolume(0);
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
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isActive, animate]);

  // 볼륨 분석 주기적 실행
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(analyzeVolume, 50);
    return () => clearInterval(interval);
  }, [isActive, analyzeVolume]);

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
            <Typography sx={{ color: '#000', fontSize: 20, fontWeight: 'bold' }}>🔊</Typography>
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
              NEURAL VOLUME
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              AUDIO ANALYZER
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
      
      {/* 볼륨 레벨 표시 */}
      <Paper elevation={2} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          color: getColorPalette(volume),
          textShadow: `0 0 10px ${getColorPalette(volume)}40`
        }}>
          {Math.round(volume)}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isRecording ? '녹음 중...' : '대기 중...'}
        </Typography>
      </Paper>

      {/* 시각화 캔버스 */}
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

export default VolumeVisualizer;
