/**
 * 녹음 컨트롤 컴포넌트 - 마이크 디자인 버튼
 * - 마이크를 사용한 실시간 녹음 기능
 * - 마이크 모양의 큰 버튼으로 녹음 시작/중지
 * - 녹음 상태에 따른 UI 변화
 * - 녹음된 오디오 파일을 백엔드로 전송하는 기능
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  Modal,
  IconButton,
  Slider
} from '@mui/material';
import { 
  Mic,
  PlayArrow,
  Pause,
  Save,
  Delete
} from '@mui/icons-material';

// 녹음 상태 타입 정의
type RecordingState = 'idle' | 'recording' | 'paused' | 'completed' | 'error';

interface RecordingControlsProps {
  onRecordingChange?: (isRecording: boolean) => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({ onRecordingChange }) => {
  // 녹음 관련 상태 관리
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  // 모달 관련 상태 관리
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // 녹음 관련 refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isCancelledRef = useRef<boolean>(false); // ref로 취소 상태 추적

  // 녹음 시간을 포맷팅하는 함수
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 녹음 시작 함수
  const startRecording = useCallback(async () => {
    try {
      // 취소 상태 초기화
      isCancelledRef.current = false;
      
      // 마이크 권한 요청 및 미디어 스트림 가져오기
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // MediaRecorder 설정
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // 녹음 데이터 수집
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 녹음 완료 시 처리
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setRecordingState('completed');
        
        // ref로 취소 상태 확인 (클로저 문제 해결)
        if (!isCancelledRef.current) {
          setShowModal(true);
        }
        
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop());
      };

      // 녹음 시작
      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setRecordingState('recording');
      setRecordingTime(0);
      setErrorMessage('');
      
      // 녹음 상태 변경 알림
      onRecordingChange?.(true);

      // 타이머 시작
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('녹음 시작 실패:', error);
      setErrorMessage('마이크 권한이 필요합니다. 브라우저 설정을 확인해주세요.');
      setRecordingState('error');
       setShowSnackbar(true);
     }
   }, [onRecordingChange]);

  // 녹음 중지 함수
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      
      // 타이머 정리
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // 녹음 상태 변경 알림
      onRecordingChange?.(false);
    }
  }, [recordingState, onRecordingChange]);

  // 리소스 정리 함수
  const cleanupResources = useCallback(() => {
    // MediaRecorder 정리
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.warn('MediaRecorder 정리 중 오류:', error);
      }
      mediaRecorderRef.current = null;
    }

    // 타이머 정리
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 오디오 청크 정리
    audioChunksRef.current = [];
  }, []);


  // 다시 녹음 함수 (모달에서 또는 취소 후)
  const retakeRecording = useCallback(() => {
    // 오디오 정리
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    // 리소스 정리
    cleanupResources();

    // 상태 초기화
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    setErrorMessage('');
    setShowModal(false);
    setCurrentTime(0);
    setDuration(0);
    isCancelledRef.current = false;
  }, [cleanupResources]);

  // 오디오 재생/일시정지 함수
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // 오디오 시간 업데이트 함수
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // 오디오 메타데이터 로드 함수
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  // 오디오 재생 완료 함수
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // 슬라이더 값 변경 함수
  const handleSliderChange = useCallback((_event: Event, newValue: number | number[]) => {
    const time = newValue as number;
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);


  // 녹음 파일을 백엔드로 전송하는 함수 (나중에 구현)
  const saveRecording = useCallback(async () => {
    if (!audioBlob) return;

    try {
      // TODO: 백엔드 API로 녹음 파일 전송
      console.log('녹음 파일 전송:', {
        size: audioBlob.size,
        type: audioBlob.type,
        duration: recordingTime
      });

      // 임시로 성공 처리
      setShowSnackbar(true);
      setErrorMessage('녹음이 성공적으로 저장되었습니다!');
      
      // 상태 초기화
      setRecordingState('idle');
      setRecordingTime(0);
      setAudioBlob(null);
      setShowModal(false);

    } catch (error) {
      console.error('파일 전송 실패:', error);
      setErrorMessage('파일 전송에 실패했습니다.');
      setShowSnackbar(true);
    }
  }, [audioBlob, recordingTime]);

  // 녹음 삭제 함수
  const deleteRecording = useCallback(() => {
    // 리소스 정리
    cleanupResources();
    
    setAudioBlob(null);
    setShowModal(false);
    setRecordingState('idle');
    setRecordingTime(0);
    isCancelledRef.current = false;
  }, [cleanupResources]);

  // 컴포넌트 언마운트 시 정리
  React.useEffect(() => {
    // ref를 변수로 캡처
    const audioElement = audioRef.current;
    
    return () => {
      // 모든 리소스 정리
      cleanupResources();
      
      // 오디오 정리
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [cleanupResources]);

  return (
    <>
      {/* 네온 사이버펑크 애니메이션 스타일 */}
      <style>
        {`
          @keyframes neonBorderPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes cyberGridFlow {
            0% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-10px, -5px) rotate(1deg); }
            50% { transform: translate(0, -10px) rotate(0deg); }
            75% { transform: translate(5px, -5px) rotate(-1deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
          
          @keyframes neonScanLine1 {
            0% { left: -120%; opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { left: 120%; opacity: 0; }
          }
          
          @keyframes neonScanLine2 {
            0% { right: -120%; opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { right: 120%; opacity: 0; }
          }
          
          @keyframes neonParticle1 {
            0%, 100% { transform: translateY(0px) scale(1); opacity: 1; }
            25% { transform: translateY(-15px) scale(1.2); opacity: 0.8; }
            50% { transform: translateY(-25px) scale(0.8); opacity: 1; }
            75% { transform: translateY(-10px) scale(1.1); opacity: 0.9; }
          }
          
          @keyframes neonParticle2 {
            0%, 100% { transform: translateX(0px) scale(1); opacity: 1; }
            25% { transform: translateX(20px) scale(0.9); opacity: 0.7; }
            50% { transform: translateX(30px) scale(1.3); opacity: 1; }
            75% { transform: translateX(10px) scale(0.8); opacity: 0.8; }
          }
          
          @keyframes neonPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.8); }
          }
          
          @keyframes neonTextFlow {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          @keyframes eqBar {
            0%, 100% { transform: scaleY(1); opacity: 0.7; }
            50% { transform: scaleY(1.5); opacity: 1; }
          }
        `}
      </style>
      
      <Box sx={{ 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 3
    }}>
      
      {/* 시간 표시 */}
      <Typography variant="h3" sx={{ 
        fontFamily: 'monospace',
        color: recordingState === 'recording' ? '#ff0080' : '#00ffff',
        fontWeight: 700,
        textShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
        fontSize: '3rem'
      }}>
        {formatTime(recordingTime)}
      </Typography>

      {/* 사이버펑크 마이크 버튼 */}
      <Box
        onClick={() => {
          if (recordingState === 'idle') {
            startRecording();
          } else if (recordingState === 'recording') {
            stopRecording();
          } else if (recordingState === 'completed') {
            retakeRecording();
          }
        }}
        sx={{
          position: 'relative',
          width: 200,
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        {/* 마이크 이미지 */}
        <Box
          component="img"
          src="/images/mic/mico.png"
          alt="Cyberpunk Microphone"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: recordingState === 'recording' 
              ? 'hue-rotate(280deg) saturate(1.5) brightness(1.2) drop-shadow(0 0 20px #ff0080)'
              : recordingState === 'completed'
              ? 'hue-rotate(120deg) saturate(1.3) brightness(1.1) drop-shadow(0 0 15px #00ff00)'
              : 'hue-rotate(180deg) saturate(1.2) brightness(1.1) drop-shadow(0 0 15px #00ffff)',
            transition: 'all 0.3s ease',
            animation: recordingState === 'recording' ? 'pulse 1s infinite' : 'none'
          }}
        />
      </Box>

      {/* 녹음 미리보기 모달 */}
      <Modal
        open={showModal}
        onClose={() => {}} // 외부 클릭으로 닫기 방지
        aria-labelledby="recording-preview-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '92%',
            maxWidth: 680,
            p: 0,
            borderRadius: '24px',
            outline: 'none',
            position: 'relative',
            overflow: 'hidden',
            background: `
              radial-gradient(circle at 15% 15%, rgba(0, 255, 255, 0.12) 0%, transparent 60%),
              radial-gradient(circle at 85% 85%, rgba(255, 0, 128, 0.12) 0%, transparent 60%),
              radial-gradient(circle at 50% 50%, rgba(0, 255, 170, 0.08) 0%, transparent 70%),
              linear-gradient(135deg, 
                rgba(2, 6, 12, 0.98) 0%, 
                rgba(8, 12, 20, 0.96) 25%,
                rgba(12, 16, 26, 0.94) 50%,
                rgba(6, 10, 18, 0.96) 75%,
                rgba(2, 6, 12, 0.98) 100%
              )
            `,
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            boxShadow: `
              0 0 80px rgba(0, 255, 255, 0.25),
              0 0 120px rgba(255, 0, 128, 0.15),
              0 0 160px rgba(0, 255, 170, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.08),
              inset 0 -1px 0 rgba(0, 255, 255, 0.15)
            `,
            backdropFilter: 'blur(30px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '24px',
              padding: '2px',
              background: `
                linear-gradient(45deg, 
                  #00ffff 0%, 
                  #ff0080 25%, 
                  #00ffaa 50%, 
                  #ff0080 75%, 
                  #00ffff 100%
                )
              `,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              animation: 'neonBorderPulse 4s ease-in-out infinite',
            },
          }}
        >
          {/* 강화된 네온 그리드 패턴 */}
          <Box sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.2,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(255, 0, 128, 0.15) 0%, transparent 50%),
              linear-gradient(0deg, rgba(0,255,255,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px),
              linear-gradient(45deg, rgba(255,0,128,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 120px 120px, 35px 35px, 35px 35px, 50px 50px',
            maskImage: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.2) 100%)',
            pointerEvents: 'none',
            animation: 'cyberGridFlow 25s linear infinite',
          }} />
          
          {/* 다중 네온 스캔 라인 */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '-120%',
                top: '25%',
                width: '60%',
                height: '3px',
                background: `
                  linear-gradient(90deg, 
                    transparent, 
                    rgba(0,255,255,0.3), 
                    rgba(0,255,255,0.9), 
                    rgba(0,255,255,0.3), 
                    transparent
                  )
                `,
                boxShadow: '0 0 15px rgba(0,255,255,0.6), 0 0 30px rgba(0,255,255,0.3)',
                animation: 'neonScanLine1 5s ease-in-out infinite',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                right: '-120%',
                top: '65%',
                width: '50%',
                height: '2px',
                background: `
                  linear-gradient(90deg, 
                    transparent, 
                    rgba(255,0,128,0.3), 
                    rgba(255,0,128,0.8), 
                    rgba(255,0,128,0.3), 
                    transparent
                  )
                `,
                boxShadow: '0 0 12px rgba(255,0,128,0.5), 0 0 25px rgba(255,0,128,0.2)',
                animation: 'neonScanLine2 6s ease-in-out infinite 1.5s',
              },
            }}
          />
          
          {/* 네온 파티클 효과 */}
          <Box sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '15%',
              left: '12%',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #00ffff, rgba(0,255,255,0.3))',
              boxShadow: '0 0 20px #00ffff, 0 0 40px rgba(0,255,255,0.5)',
              animation: 'neonParticle1 8s ease-in-out infinite',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '75%',
              right: '18%',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ff0080, rgba(255,0,128,0.3))',
              boxShadow: '0 0 15px #ff0080, 0 0 30px rgba(255,0,128,0.4)',
              animation: 'neonParticle2 10s ease-in-out infinite 3s',
            },
          }} />

          {/* 네온 사이버펑크 헤더 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 4,
            py: 3,
            borderBottom: '2px solid transparent',
            background: `
              linear-gradient(135deg, 
                rgba(0,255,255,0.12) 0%, 
                rgba(255,0,128,0.08) 50%,
                rgba(0,255,255,0.12) 100%
              ),
              linear-gradient(180deg, rgba(0,0,0,0.3), transparent)
            `,
            backdropFilter: 'blur(15px)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00ffff 20%, #ff0080 50%, #00ffff 80%, transparent)',
              boxShadow: '0 0 10px rgba(0,255,255,0.5)',
            },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* 네온 상태 인디케이터 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #00ffff 30%, rgba(0,255,255,0.3) 70%)',
                  boxShadow: `
                    0 0 20px #00ffff,
                    0 0 40px rgba(0,255,255,0.5),
                    inset 0 0 10px rgba(255,255,255,0.2)
                  `,
                  animation: 'neonPulse 2s ease-in-out infinite',
                }} />
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #ff0080 30%, rgba(255,0,128,0.3) 70%)',
                  boxShadow: '0 0 15px #ff0080, 0 0 30px rgba(255,0,128,0.4)',
                  animation: 'neonPulse 2s ease-in-out infinite 0.5s',
                }} />
                <Box sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #00ffaa 30%, rgba(0,255,170,0.3) 70%)',
                  boxShadow: '0 0 12px #00ffaa, 0 0 25px rgba(0,255,170,0.3)',
                  animation: 'neonPulse 2s ease-in-out infinite 1s',
                }} />
              </Box>
              
              <Typography
                id="recording-preview-modal"
                variant="h5"
                sx={{
                  m: 0,
                  fontWeight: 900,
                  letterSpacing: 2,
                  fontFamily: 'monospace',
                  background: `
                    linear-gradient(45deg, 
                      #00ffff 0%, 
                      #ffffff 25%, 
                      #ff0080 50%, 
                      #ffffff 75%, 
                      #00ffff 100%
                    )
                  `,
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(0,255,255,0.5)',
                  animation: 'neonTextFlow 3s linear infinite',
                  textTransform: 'uppercase',
                }}
              >
                ◆ NEURAL AUDIO ◆
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  letterSpacing: 1.5,
                  color: 'rgba(0,255,255,0.8)',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CYBER_STUDIO.EXE
              </Typography>
              <IconButton
                aria-label="close"
                onClick={() => setShowModal(false)}
                size="medium"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '8px',
                  color: '#00ffff',
                  border: '2px solid rgba(0,255,255,0.4)',
                  bgcolor: 'rgba(0,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 20px rgba(0,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255,0,128,0.15)',
                    borderColor: 'rgba(255,0,128,0.6)',
                    color: '#ff0080',
                    boxShadow: '0 0 25px rgba(255,0,128,0.4)',
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <Typography sx={{ fontWeight: 900, fontSize: '18px' }}>✕</Typography>
              </IconButton>
            </Box>
          </Box>

          {/* 본문 */}
          <Box sx={{ p: 3 }}>

          {/* 오디오 플레이어 */}
          {audioBlob && (
            <>
              {/* 숨겨진 오디오 엘리먼트 */}
              <audio
                ref={audioRef}
                src={URL.createObjectURL(audioBlob)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
              />

              {/* 재생 컨트롤 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                {/* EQ 장식 */}
                <Box sx={{ display: 'flex', gap: 0.6, mr: 0.5 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Box key={i} sx={{
                      width: 4,
                      height: 18 + (i % 3) * 6,
                      borderRadius: 1,
                      background: 'linear-gradient(180deg, #00ffff, #ff0080)',
                      boxShadow: '0 0 8px rgba(0,255,255,0.6)',
                      animation: 'eqBar 1s ease-in-out infinite',
                      animationDelay: `${i * 0.08}s`
                    }} />
                  ))}
                </Box>
                <IconButton
                  onClick={togglePlayPause}
                  size="large"
                  sx={{ 
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    bgcolor: 'rgba(0,255,255,0.12)', 
                    color: '#00ffff',
                    border: '1px solid rgba(0,255,255,0.35)',
                    boxShadow: '0 0 16px rgba(0,255,255,0.25)',
                    backdropFilter: 'blur(6px)',
                    '&:hover': { bgcolor: 'rgba(0,255,255,0.2)' }
                  }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1, fontFamily: 'monospace' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Typography>
                  <Slider
                    value={currentTime}
                    max={duration || 0}
                    onChange={handleSliderChange}
                    sx={{ 
                      color: '#00ffff',
                      height: 8,
                      '& .MuiSlider-rail': {
                        opacity: 0.3,
                        background: 'linear-gradient(90deg, rgba(0,255,255,0.2), rgba(255,0,128,0.2))',
                        height: 8,
                      },
                      '& .MuiSlider-track': {
                        border: 'none',
                        background: 'linear-gradient(90deg, #00ffff, #ff0080)',
                        boxShadow: '0 0 12px rgba(0,255,255,0.6)',
                      },
                      '& .MuiSlider-thumb': {
                        width: 18,
                        height: 18,
                        backgroundColor: '#0b0f14',
                        border: '2px solid #00ffff',
                        boxShadow: '0 0 12px rgba(0,255,255,0.6)',
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 16px rgba(0,255,255,0.9)'
                        }
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* 파일 정보 */}
              <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    📁 파일 크기: {(audioBlob.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    ⏱️ 재생 시간: {formatTime(recordingTime)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    🎵 형식: {audioBlob.type}
                  </Typography>
                </Box>
              </Paper>

              {/* 액션 버튼들 */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  onClick={saveRecording}
                  sx={{ 
                    minWidth: 120,
                    background: 'linear-gradient(45deg, #00ff88, #00cc66)',
                    border: '1px solid #00ffaa',
                    color: '#000',
                    fontWeight: 800,
                    letterSpacing: 1,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #00ffaa, #00e695)',
                      boxShadow: '0 0 20px rgba(0, 255, 170, 0.5)'
                    }
                  }}
                >
                  SAVE
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Mic />}
                  onClick={retakeRecording}
                  sx={{ 
                    minWidth: 120,
                    border: '1px solid #00ffff',
                    color: '#00ffff',
                    fontWeight: 800,
                    letterSpacing: 1,
                    '&:hover': {
                      border: '1px solid #00ffff',
                      background: 'rgba(0, 255, 255, 0.12)',
                      boxShadow: '0 0 15px rgba(0, 255, 255, 0.35)'
                    }
                  }}
                >
                  RETRY RECORD
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Delete />}
                  onClick={deleteRecording}
                  sx={{ 
                    minWidth: 120,
                    border: '1px solid #ff0080',
                    color: '#ff0080',
                    fontWeight: 800,
                    letterSpacing: 1,
                    '&:hover': {
                      border: '1px solid #ff0080',
                      background: 'rgba(255, 0, 128, 0.12)',
                      boxShadow: '0 0 15px rgba(255, 0, 128, 0.35)'
                    }
                  }}
                >
                  DELETE
                </Button>
              </Box>
            </>
          )}
          </Box>
        </Paper>
      </Modal>

      {/* 오류 메시지 스낵바 */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={errorMessage.includes('실패') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* CSS 애니메이션 */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          @keyframes hologramScan {
            0% { transform: translateX(0); }
            100% { transform: translateX(260%); }
          }
          @keyframes eqBar {
            0%, 100% { transform: scaleY(0.6); opacity: 0.7; }
            50% { transform: scaleY(1.2); opacity: 1; }
          }
          @keyframes gridScroll {
            0% { background-position: 0 0, 0 0; }
            100% { background-position: 0 40px, 40px 0; }
          }
        `}
      </Box>
    </>
  );
};

export default RecordingControls;
