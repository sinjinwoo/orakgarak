import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  LinearProgress,
  Chip,
  Alert,
  Stack,
  Fade,
  Slide
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  ArrowBack, 
  VolumeUp, 
  Error as ErrorIcon,
  MusicNote,
  AccessTime,
  GraphicEq,
  Equalizer
} from '@mui/icons-material';
import { Recording } from '../../types/recording';
import { recordingService } from '../../services/api/recordings';
import RecordingDetailModal from './RecordingDetailModal';
import '../../styles/cyberpunk-animations.css';

interface ExistingRecordingSelectionProps {
  onSelectRecording: (recording: Recording, uploadId?: number) => void;
  onBack: () => void;
}

export default function ExistingRecordingSelection({ 
  onSelectRecording, 
  onBack 
}: ExistingRecordingSelectionProps) {
  // 재생 상태 관리
  const [playingRecordingId, setPlayingRecordingId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  // 모달 상태 관리
  const [selectedRecordingForDetail, setSelectedRecordingForDetail] = useState<Recording | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // API로 내 녹음본 목록 가져오기
  const { 
    data: recordings = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['myRecordings'],
    queryFn: () => recordingService.getMyRecordings(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 에러 로깅
  if (isError) {
    console.error('내 녹음본 로드 실패:', error);
  }

  // API 응답 디버깅
  if (recordings.length > 0) {
    console.log('📊 내 녹음본 데이터:', recordings.map(rec => ({
      id: rec.id,
      title: rec.title,
      url: rec.url,
      urlStatus: rec.urlStatus,
      hasValidUrl: !!(rec.url && rec.urlStatus === 'SUCCESS')
    })));
  }

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }
    };
  }, []);

  // 오디오 재생/일시정지
  const playRecording = (recording: Recording) => {
    console.log('🎵 재생 요청:', {
      id: recording.id,
      title: recording.title,
      url: recording.url,
      urlStatus: recording.urlStatus,
      hasValidUrl: !!(recording.url && recording.urlStatus === 'SUCCESS')
    });

    // URL 유효성 검사
    if (!recording.url || recording.urlStatus !== 'SUCCESS') {
      let message = '오디오 파일을 재생할 수 없습니다.';
      if (recording.urlStatus === 'FAILED') {
        message = '오디오 파일 처리에 실패했습니다.';
      } else if (recording.urlStatus === 'PROCESSING') {
        message = '오디오 파일이 아직 처리 중입니다.';
      } else if (!recording.url) {
        message = '오디오 파일 URL이 없습니다.';
      }
      alert(message);
      return;
    }

    // 현재 재생 중인 오디오가 같은 녹음본인지 확인
    if (playingRecordingId === recording.id && currentAudio.current) {
      if (currentAudio.current.paused) {
        currentAudio.current.play().catch(console.error);
    } else {
        currentAudio.current.pause();
      }
      return;
    }

    // 이전 오디오 정지
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }

    // 새 오디오 생성 및 재생
    const audio = new Audio(recording.url);
    currentAudio.current = audio;
    setPlayingRecordingId(recording.id);

    // CORS 설정
    if (recording.url.includes('w3schools.com') || 
        recording.url.includes('googleapis.com') ||
        recording.url.includes('amazonaws.com')) {
      audio.crossOrigin = 'anonymous';
    }

    audio.preload = 'auto';
    audio.volume = 1.0;

    // 이벤트 리스너 설정
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setPlayingRecordingId(null);
      setCurrentTime(0);
      setDuration(0);
    });

    audio.addEventListener('error', () => {
      console.error('🎵 오디오 재생 오류');
      alert('오디오 재생 중 오류가 발생했습니다.');
      setPlayingRecordingId(null);
    });

    // 재생 시작
    setTimeout(() => {
      audio.play().catch((error) => {
        console.error('🎵 오디오 재생 실패:', error);
        if (error.name === 'NotAllowedError') {
          alert('브라우저에서 자동 재생이 차단되었습니다. 다시 클릭해주세요.');
        } else {
          alert('오디오 재생에 실패했습니다.');
        }
        setPlayingRecordingId(null);
      });
    }, 100);
  };

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 재생 버튼 상태 결정
  const getPlayButtonState = (recording: Recording) => {
    const hasValidUrl = !!(recording.url && recording.urlStatus === 'SUCCESS');
    const isPlaying = playingRecordingId === recording.id && currentAudio.current && !currentAudio.current.paused;
    
    return { hasValidUrl, isPlaying };
  };

  // 모달 관련 핸들러들
  const handleSelectClick = (recording: Recording) => {
    setSelectedRecordingForDetail(recording);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecordingForDetail(null);
  };

  const handleConfirmSelection = (recording: Recording, uploadId?: number) => {
    setIsDetailModalOpen(false);
    setSelectedRecordingForDetail(null);
    onSelectRecording(recording, uploadId);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <Box className="matrix-bg" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: 'center' }}>
            <Box className="cyberpunk-spinner" sx={{ mx: 'auto', mb: 3 }} />
            <Typography 
              variant="h5" 
              className="hologram-text neon-text"
              sx={{ 
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                letterSpacing: 2
              }}
            >
              LOADING ARCHIVES...
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(0,255,255,0.7)',
                fontFamily: "'Courier New', monospace",
                mt: 1,
                letterSpacing: 1
              }}
            >
              Scanning neural database
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <Box className="matrix-bg" sx={{ minHeight: '100vh', p: 3 }}>
        <Fade in timeout={800}>
          <Box sx={{ maxWidth: 600, mx: 'auto', pt: 8 }}>
            {/* 뒤로가기 버튼 */}
            <Button
              startIcon={<ArrowBack />}
              onClick={onBack}
              className="cyberpunk-button"
              sx={{
                mb: 4,
                px: 3,
                py: 1.5,
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(0,255,255,0.3)',
                color: '#00ffff',
                borderRadius: 3,
                fontFamily: "'Courier New', monospace",
                fontWeight: 600,
                letterSpacing: 1,
                '&:hover': {
                  background: 'rgba(0,255,255,0.1)',
                  border: '1px solid rgba(0,255,255,0.6)',
                  boxShadow: '0 0 20px rgba(0,255,255,0.3)'
                }
              }}
            >
              BACK TO MENU
            </Button>
            
            {/* 에러 알림 */}
            <Box 
              className="neon-card hologram-panel"
              sx={{ 
                p: 4, 
              textAlign: 'center',
                background: 'rgba(26,26,26,0.9)',
                border: '2px solid rgba(255,0,128,0.4)',
                borderRadius: 4,
                boxShadow: '0 0 30px rgba(255,0,128,0.2)'
              }}
            >
              <ErrorIcon sx={{ fontSize: 64, color: '#ff0080', mb: 2 }} />
              <Typography 
                variant="h4" 
                className="hologram-text"
                sx={{ 
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  mb: 2,
                  letterSpacing: 2
                }}
              >
                CONNECTION FAILED
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: "'Courier New', monospace",
                  mb: 3,
                  letterSpacing: 1
                }}
              >
                Unable to access neural archives.<br />
                Check your connection and try again.
              </Typography>
              
              <Button 
                variant="contained"
                onClick={() => window.location.reload()}
                className="cyberpunk-button"
                sx={{
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #ff0080, #00ffff)',
                  color: '#000',
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  letterSpacing: 1,
                  borderRadius: 3,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                    boxShadow: '0 0 30px rgba(0,255,255,0.5)'
                  }
                }}
              >
                RETRY CONNECTION
              </Button>
            </Box>
          </Box>
        </Fade>
      </Box>
    );
  }

  // 녹음본이 없는 경우
  if (recordings.length === 0) {
    return (
      <Box className="matrix-bg" sx={{ minHeight: '100vh', p: 3 }}>
        <Fade in timeout={800}>
          <Box sx={{ maxWidth: 600, mx: 'auto', pt: 8 }}>
            {/* 뒤로가기 버튼 */}
            <Button
              startIcon={<ArrowBack />}
              onClick={onBack}
              className="cyberpunk-button"
              sx={{
                mb: 4,
                px: 3,
                py: 1.5,
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(0,255,255,0.3)',
                color: '#00ffff',
                borderRadius: 3,
                fontFamily: "'Courier New', monospace",
                fontWeight: 600,
                letterSpacing: 1,
                '&:hover': {
                  background: 'rgba(0,255,255,0.1)',
                  border: '1px solid rgba(0,255,255,0.6)',
                  boxShadow: '0 0 20px rgba(0,255,255,0.3)'
                }
              }}
            >
              BACK TO MENU
            </Button>
            
            {/* 빈 상태 알림 */}
            <Box 
              className="neon-card hologram-panel"
              sx={{ 
                p: 4, 
                textAlign: 'center',
                background: 'rgba(26,26,26,0.9)',
                border: '2px solid rgba(0,255,255,0.4)',
                borderRadius: 4,
                boxShadow: '0 0 30px rgba(0,255,255,0.2)'
              }}
            >
              <MusicNote sx={{ fontSize: 64, color: '#00ffff', mb: 2 }} />
              <Typography 
                variant="h4" 
                className="hologram-text"
                sx={{ 
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  mb: 2,
                  letterSpacing: 2
                }}
              >
                NO ARCHIVES FOUND
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: "'Courier New', monospace",
                  mb: 3,
                  letterSpacing: 1
                }}
              >
                Neural database is empty.<br />
                Create your first recording to begin.
              </Typography>
              
              <Button 
                variant="contained"
                onClick={onBack}
                className="cyberpunk-button"
                sx={{
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                  color: '#000',
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  letterSpacing: 1,
                  borderRadius: 3,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ff0080, #00ffff)',
                    boxShadow: '0 0 30px rgba(255,0,128,0.5)'
                  }
                }}
              >
                CREATE NEW RECORDING
              </Button>
            </Box>
          </Box>
        </Fade>
      </Box>
    );
  }

    return (
    <Box className="matrix-bg cyberpunk-scrollbar" sx={{ minHeight: '100vh', p: 3 }}>
      <Fade in timeout={1000}>
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
          {/* 헤더 */}
          <Slide direction="down" in timeout={800}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pt: 2 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={onBack}
                className="cyberpunk-button"
                sx={{
                  mr: 3,
                  px: 3,
                  py: 1.5,
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(0,255,255,0.3)',
                  color: '#00ffff',
                  borderRadius: 3,
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 600,
                  letterSpacing: 1,
                  '&:hover': {
                    background: 'rgba(0,255,255,0.1)',
                    border: '1px solid rgba(0,255,255,0.6)',
                    boxShadow: '0 0 20px rgba(0,255,255,0.3)'
                  }
                }}
              >
                BACK
              </Button>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography 
                  variant="h3" 
                  className="hologram-text neon-text"
                  sx={{ 
                    fontFamily: "'Courier New', monospace",
                    fontWeight: 700,
                    letterSpacing: 3,
                    mb: 1
                  }}
                >
                  NEURAL ARCHIVES
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ 
                    color: 'rgba(0,255,255,0.7)',
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: 1
                  }}
                >
                  Select from your recorded data streams
                </Typography>
              </Box>
              
              <Chip 
                label={`${recordings.length} RECORDS`}
                className="neon-border"
                sx={{
                  px: 2,
                  py: 1,
                  background: 'rgba(0,255,255,0.1)',
                  color: '#00ffff',
                  border: '1px solid rgba(0,255,255,0.4)',
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  letterSpacing: 1,
                  fontSize: '0.9rem'
                }}
              />
            </Box>
          </Slide>

          {/* 녹음본 목록 */}
          <Stack spacing={3}>
            {recordings.map((recording, index) => {
              const { hasValidUrl, isPlaying } = getPlayButtonState(recording);
              const showProgress = playingRecordingId === recording.id && duration > 0;

              return (
                <Slide key={recording.id} direction="up" in timeout={1000 + index * 200}>
                  <Box 
                    className="neon-card hologram-panel hologram-corners"
                    sx={{ 
                      position: 'relative',
                      background: `
                        linear-gradient(135deg, 
                          rgba(26,26,26,0.95) 0%, 
                          rgba(13,13,13,0.98) 50%,
                          rgba(26,26,26,0.95) 100%
                        )
                      `,
                      border: playingRecordingId === recording.id 
                        ? '2px solid rgba(255,0,128,0.6)' 
                        : '1px solid rgba(0,255,255,0.3)',
                      borderRadius: 4,
                      p: 3,
                      backdropFilter: 'blur(20px)',
                      boxShadow: playingRecordingId === recording.id
                        ? '0 0 40px rgba(255,0,128,0.3), inset 0 0 20px rgba(255,0,128,0.1)'
                        : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,255,255,0.1)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden',
                      '&:hover': { 
                        transform: 'translateY(-4px) scale(1.02)',
                        border: '2px solid rgba(0,255,255,0.6)',
                        boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 40px rgba(0,255,255,0.2)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* 재생 버튼 */}
                      <IconButton
                        onClick={() => playRecording(recording)}
                        disabled={!hasValidUrl}
                        className="cyberpunk-button"
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 4,
                          background: hasValidUrl 
                            ? (isPlaying 
                                ? 'linear-gradient(45deg, #ff0080, #ff4081)' 
                                : 'linear-gradient(45deg, #00ffff, #40c4ff)')
                            : 'rgba(128,128,128,0.2)',
                          color: hasValidUrl ? '#000' : 'rgba(255,255,255,0.3)',
                          border: hasValidUrl 
                            ? (isPlaying 
                                ? '2px solid rgba(255,0,128,0.8)' 
                                : '2px solid rgba(0,255,255,0.8)')
                            : '2px solid rgba(128,128,128,0.3)',
                          boxShadow: hasValidUrl 
                            ? (isPlaying 
                                ? '0 0 30px rgba(255,0,128,0.6)' 
                                : '0 0 30px rgba(0,255,255,0.4)')
                            : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': hasValidUrl ? {
                            transform: 'scale(1.1) rotate(5deg)',
                boxShadow: isPlaying 
                              ? '0 0 50px rgba(255,0,128,0.8)' 
                              : '0 0 50px rgba(0,255,255,0.6)',
                          } : {},
                          '&:active': {
                            transform: 'scale(0.95)',
                          },
                          '&:disabled': {
                            background: 'rgba(64,64,64,0.2)',
                            border: '2px solid rgba(128,128,128,0.2)'
                          }
                        }}
                      >
                        {!hasValidUrl ? (
                          <ErrorIcon sx={{ fontSize: 36 }} />
                        ) : isPlaying ? (
                          <Pause sx={{ fontSize: 36 }} />
                        ) : (
                          <PlayArrow sx={{ fontSize: 36 }} />
                        )}
                      </IconButton>

            {/* 녹음본 정보 */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Typography 
                            variant="h5" 
                            className={playingRecordingId === recording.id ? 'hologram-text' : ''}
                            sx={{ 
                              fontFamily: "'Courier New', monospace",
                              fontWeight: 700,
                              color: playingRecordingId === recording.id ? '#ff0080' : '#00ffff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              letterSpacing: 1,
                              textShadow: playingRecordingId === recording.id 
                                ? '0 0 10px rgba(255,0,128,0.5)' 
                                : '0 0 10px rgba(0,255,255,0.3)'
                            }}
                          >
                            {recording.title}
                          </Typography>
                          
                          {playingRecordingId === recording.id && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <VolumeUp sx={{ color: '#ff0080', fontSize: 20 }} />
                              <Equalizer 
                                className="neon-text"
                                sx={{ 
                                  color: '#ff0080', 
                                  fontSize: 20,
                                  animation: 'neonPulse 1s ease-in-out infinite'
                                }} 
                              />
                            </Box>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ fontSize: 18, color: 'rgba(0,255,255,0.7)' }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'rgba(255,255,255,0.8)',
                                fontFamily: "'Courier New', monospace",
                                fontWeight: 600,
                                letterSpacing: 0.5
                              }}
                            >
                              {recording.durationSeconds ? formatTime(recording.durationSeconds) : 'UNKNOWN'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GraphicEq sx={{ fontSize: 18, color: 'rgba(0,255,255,0.7)' }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'rgba(255,255,255,0.8)',
                                fontFamily: "'Courier New', monospace",
                                fontWeight: 600,
                                letterSpacing: 0.5
                              }}
                            >
                              {recording.extension?.toUpperCase() || 'WAV'}
                            </Typography>
                          </Box>

                          {/* 상태 표시 */}
                          <Chip
                            size="small"
                            label={hasValidUrl ? 'READY' : 'ERROR'}
                            sx={{
                              background: hasValidUrl 
                                ? 'rgba(0,255,0,0.2)' 
                                : 'rgba(255,0,0,0.2)',
                              color: hasValidUrl ? '#00ff00' : '#ff0000',
                              border: hasValidUrl 
                                ? '1px solid rgba(0,255,0,0.4)' 
                                : '1px solid rgba(255,0,0,0.4)',
                              fontFamily: "'Courier New', monospace",
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              letterSpacing: 0.5
                            }}
                          />
                        </Box>

                        {/* 진행률 바 */}
                        {showProgress && (
                          <Fade in timeout={300}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: '#ff0080',
                                  fontFamily: "'Courier New', monospace",
                                  fontWeight: 700,
                                  minWidth: 40,
                                  textAlign: 'right'
                                }}
                              >
                                {formatTime(currentTime)}
                              </Typography>
                              
                              <LinearProgress
                                variant="determinate"
                                value={(currentTime / duration) * 100}
                                sx={{ 
                                  flexGrow: 1, 
                                  height: 8, 
                                  borderRadius: 4,
                                  background: 'rgba(0,0,0,0.4)',
                                  '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(90deg, #ff0080, #00ffff)',
                                    borderRadius: 4,
                                    boxShadow: '0 0 10px rgba(255,0,128,0.5)'
                                  }
                                }}
                              />
                              
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'rgba(0,255,255,0.8)',
                                  fontFamily: "'Courier New', monospace",
                                  fontWeight: 700,
                                  minWidth: 40
                                }}
                              >
                                {formatTime(duration)}
                              </Typography>
                            </Box>
                          </Fade>
                        )}
                      </Box>

                      {/* 선택 버튼 */}
                      <Button
                        variant="contained"
                        onClick={() => handleSelectClick(recording)}
                        className="cyberpunk-button"
                        sx={{
                          px: 4,
                          py: 2,
                          background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                          color: '#000',
                          fontFamily: "'Courier New', monospace",
                          fontWeight: 700,
                          letterSpacing: 1,
                          borderRadius: 3,
                          minWidth: 120,
                          '&:hover': {
                            background: 'linear-gradient(45deg, #ff0080, #00ffff)',
                            transform: 'scale(1.05)',
                            boxShadow: '0 0 30px rgba(0,255,255,0.5)'
                          },
                          '&:active': {
                            transform: 'scale(0.98)',
                          }
                        }}
                      >
                        SELECT
                      </Button>
                    </Box>
                  </Box>
                </Slide>
              );
            })}
          </Stack>
        </Box>
      </Fade>

      {/* 녹음본 상세 정보 모달 */}
      {selectedRecordingForDetail && (
        <RecordingDetailModal
          recording={selectedRecordingForDetail}
          open={isDetailModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmSelection}
        />
      )}
    </Box>
  );
}