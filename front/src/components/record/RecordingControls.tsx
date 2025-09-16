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
          elevation={8}
          sx={{
            width: '90%',
            maxWidth: 500,
            p: 4,
            borderRadius: 3,
            outline: 'none',
          }}
        >
          {/* 모달 헤더 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              녹음 미리보기
            </Typography>
          </Box>

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
                <IconButton
                  onClick={togglePlayPause}
                  size="large"
                  sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Typography>
                  <Slider
                    value={currentTime}
                    max={duration || 0}
                    onChange={handleSliderChange}
                    sx={{ color: 'primary.main' }}
                  />
                </Box>
              </Box>

              {/* 파일 정보 */}
              <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  📁 파일 크기: {(audioBlob.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ⏱️ 재생 시간: {formatTime(recordingTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  🎵 형식: {audioBlob.type}
                </Typography>
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
                    background: 'linear-gradient(45deg, #00ff00, #00cc00)',
                    border: '1px solid #00ff00',
                    color: '#000',
                    fontWeight: 700,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #00ff00, #00ff80)',
                      boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
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
                    '&:hover': {
                      border: '1px solid #00ffff',
                      background: 'rgba(0, 255, 255, 0.1)',
                      boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
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
                    '&:hover': {
                      border: '1px solid #ff0080',
                      background: 'rgba(255, 0, 128, 0.1)',
                      boxShadow: '0 0 15px rgba(255, 0, 128, 0.3)'
                    }
                  }}
                >
                  DELETE
                </Button>
              </Box>
            </>
          )}
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
        `}
      </style>
    </Box>
  );
};

export default RecordingControls;
