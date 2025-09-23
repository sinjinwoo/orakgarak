import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog,
  Box, 
  Typography, 
  Button, 
  IconButton, 
  LinearProgress,
  Chip,
  Fade,
  CircularProgress,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  Close,
  VolumeUp, 
  Error as ErrorIcon,
  MusicNote,
  AccessTime,
  GraphicEq,
  Equalizer,
  CloudDownload,
  Security,
  CheckCircle
} from '@mui/icons-material';
import { Recording } from '../../types/recording';
import { recordingService } from '../../services/api/recordings';
import '../../styles/cyberpunk-animations.css';

interface RecordingDetailModalProps {
  recording: Recording;
  open: boolean;
  onClose: () => void;
  onConfirm: (recording: Recording, uploadId?: number) => void;
}

export default function RecordingDetailModal({ 
  recording, 
  open, 
  onClose, 
  onConfirm 
}: RecordingDetailModalProps) {
  // 재생 상태 관리
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 녹음본 상세 정보 API 호출
  const { 
    data: recordingDetail, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['recordingDetail', recording.id],
    queryFn: () => recordingService.getRecordingDetail(recording.id),
    enabled: open, // 모달이 열렸을 때만 API 호출
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 모달 닫힐 때 오디오 정지
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [open]);

  // 오디오 재생/일시정지
  const togglePlayback = () => {
    // 우선순위: recordingDetail.presignedUrl > recording.url
    const audioUrl = recordingDetail?.presignedUrl || recording.url;
    
    console.log('🎵 모달 재생 시도:', {
      recordingId: recording.id,
      title: recording.title,
      recordingUrl: recording.url,
      presignedUrl: recordingDetail?.presignedUrl,
      finalUrl: audioUrl,
      urlStatus: recording.urlStatus
    });

    if (!audioUrl) {
      alert('오디오 URL을 불러올 수 없습니다.');
      return;
    }

    if (!audioRef.current) {
      // 새 오디오 생성
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // CORS 설정 (외부 URL인 경우에만)
      if (audioUrl.includes('w3schools.com') || 
          audioUrl.includes('googleapis.com') ||
          audioUrl.includes('amazonaws.com') ||
          audioUrl.includes('s3.')) {
        audio.crossOrigin = 'anonymous';
      }
      
      audio.preload = 'auto';
      audio.volume = 1.0;

      // 이벤트 리스너 설정
      audio.addEventListener('loadedmetadata', () => {
        console.log('🎵 모달 오디오 메타데이터 로드:', {
          duration: audio.duration,
          src: audio.src
        });
        setDuration(audio.duration);
      });

      audio.addEventListener('canplay', () => {
        console.log('🎵 모달 오디오 재생 준비됨');
      });

      audio.addEventListener('play', () => {
        console.log('🎵 모달 오디오 재생 시작');
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        console.log('🎵 모달 오디오 재생 완료');
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.addEventListener('error', (e) => {
        console.error('🎵 모달 오디오 재생 오류:', {
          error: audio.error,
          src: audio.src,
          networkState: audio.networkState,
          readyState: audio.readyState,
          event: e
        });
        alert('오디오 재생 중 오류가 발생했습니다.');
        setIsPlaying(false);
        audioRef.current = null;
      });
    }

    // 재생/일시정지
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // 재생 시작 (약간의 지연 후)
      setTimeout(() => {
        audioRef.current?.play().catch((error) => {
          console.error('🎵 모달 오디오 재생 실패:', error);
          if (error.name === 'NotAllowedError') {
            alert('브라우저에서 자동 재생이 차단되었습니다. 다시 클릭해주세요.');
          } else {
            alert('오디오 재생에 실패했습니다.');
          }
          setIsPlaying(false);
        });
      }, 100);
      setIsPlaying(true);
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('ko-KR');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'transparent',
          boxShadow: 'none',
          overflow: 'visible'
        }
      }}
      BackdropProps={{
        sx: {
          background: `
            radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 26, 0.95) 50%, rgba(10, 10, 10, 0.95) 100%)
          `,
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      <Fade in={open} timeout={600}>
        <Box 
          className="neon-card hologram-panel matrix-bg"
          sx={{ 
            position: 'relative',
            background: `
              linear-gradient(135deg, 
                rgba(26,26,26,0.98) 0%, 
                rgba(13,13,13,0.99) 50%,
                rgba(26,26,26,0.98) 100%
              )
            `,
            border: '2px solid rgba(0,255,255,0.4)',
            borderRadius: 4,
            p: 4,
            backdropFilter: 'blur(30px)',
            boxShadow: '0 0 60px rgba(0,255,255,0.3), inset 0 0 30px rgba(0,255,255,0.1)',
            overflow: 'hidden',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          {/* 닫기 버튼 */}
          <IconButton
            onClick={onClose}
            className="cyberpunk-button"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 48,
              height: 48,
              background: 'rgba(255,0,128,0.2)',
              color: '#ff0080',
              border: '1px solid rgba(255,0,128,0.4)',
              '&:hover': {
                background: 'rgba(255,0,128,0.3)',
                boxShadow: '0 0 20px rgba(255,0,128,0.5)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <Close />
          </IconButton>

          {/* 헤더 */}
          <Box sx={{ mb: 4, pr: 6 }}>
            <Typography 
              variant="h3" 
              className="hologram-text neon-text"
              sx={{ 
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                letterSpacing: 2,
                mb: 1
              }}
            >
              NEURAL ARCHIVE
            </Typography>
            <Typography 
              variant="body1"
              sx={{ 
                color: 'rgba(0,255,255,0.7)',
                fontFamily: "'Courier New', monospace",
                letterSpacing: 1
              }}
            >
              Detailed recording analysis and playback
            </Typography>
          </Box>

          {/* 로딩 상태 */}
          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box className="cyberpunk-spinner" sx={{ mx: 'auto', mb: 2 }} />
                <Typography 
                  variant="h6" 
                  className="hologram-text"
                  sx={{ 
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: 1
                  }}
                >
                  LOADING DATA...
                </Typography>
              </Box>
            </Box>
          )}

          {/* 에러 상태 (경고로 표시하되 계속 진행) */}
          {isError && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3,
                background: 'rgba(255,165,0,0.1)',
                border: '1px solid rgba(255,165,0,0.3)',
                color: '#ffaa00',
                '& .MuiAlert-icon': {
                  color: '#ffaa00'
                }
              }}
            >
              <Typography sx={{ fontFamily: "'Courier New', monospace" }}>
                Unable to load additional details. Using basic recording data.
              </Typography>
            </Alert>
          )}

          {/* 녹음본 정보 (API 데이터 또는 기본 데이터) */}
          {(recordingDetail || !isLoading) && (
            <Stack spacing={4}>
              {/* 기본 정보 카드 */}
              <Box 
                className="neon-card"
                sx={{ 
                  p: 3,
                  background: 'rgba(0,255,255,0.05)',
                  border: '1px solid rgba(0,255,255,0.2)',
                  borderRadius: 3
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {/* 재생 버튼 */}
                  <IconButton
                    onClick={togglePlayback}
                    disabled={!recordingDetail?.presignedUrl && !recording.url}
                    className="cyberpunk-button"
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 4,
                      background: (!recordingDetail?.presignedUrl && !recording.url) ?
                        'rgba(128,128,128,0.3)' :
                        (isPlaying 
                          ? 'linear-gradient(45deg, #ff0080, #ff4081)' 
                          : 'linear-gradient(45deg, #00ffff, #40c4ff)'),
                      color: (!recordingDetail?.presignedUrl && !recording.url) ? 
                        'rgba(255,255,255,0.3)' : 
                        '#000',
                      border: (!recordingDetail?.presignedUrl && !recording.url) ?
                        '2px solid rgba(128,128,128,0.3)' :
                        (isPlaying 
                          ? '2px solid rgba(255,0,128,0.8)' 
                          : '2px solid rgba(0,255,255,0.8)'),
                      boxShadow: (!recordingDetail?.presignedUrl && !recording.url) ?
                        'none' :
                        (isPlaying 
                          ? '0 0 30px rgba(255,0,128,0.6)' 
                          : '0 0 30px rgba(0,255,255,0.4)'),
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': (!recordingDetail?.presignedUrl && !recording.url) ? {} : {
                        transform: 'scale(1.1)',
                        boxShadow: isPlaying 
                          ? '0 0 50px rgba(255,0,128,0.8)' 
                          : '0 0 50px rgba(0,255,255,0.6)',
                      },
                      '&:active': (!recordingDetail?.presignedUrl && !recording.url) ? {} : {
                        transform: 'scale(0.95)',
                      },
                      '&:disabled': {
                        background: 'rgba(64,64,64,0.2)',
                        border: '2px solid rgba(128,128,128,0.2)',
                        color: 'rgba(255,255,255,0.3)'
                      }
                    }}
                  >
                    {(!recordingDetail?.presignedUrl && !recording.url) ? 
                      <ErrorIcon sx={{ fontSize: 36 }} /> :
                      (isPlaying ? <Pause sx={{ fontSize: 36 }} /> : <PlayArrow sx={{ fontSize: 36 }} />)
                    }
                  </IconButton>

                  {/* 녹음본 정보 */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography 
                        variant="h4" 
                        className={isPlaying ? 'hologram-text' : ''}
                        sx={{ 
                          fontFamily: "'Courier New', monospace",
                          fontWeight: 700,
                          color: isPlaying ? '#ff0080' : '#00ffff',
                          letterSpacing: 1,
                          textShadow: isPlaying 
                            ? '0 0 10px rgba(255,0,128,0.5)' 
                            : '0 0 10px rgba(0,255,255,0.3)'
                        }}
                      >
                        {recording.title}
                      </Typography>
                      
                      {isPlaying && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <VolumeUp sx={{ color: '#ff0080', fontSize: 24 }} />
                          <Equalizer 
                            className="neon-text"
                            sx={{ 
                              color: '#ff0080', 
                              fontSize: 24,
                              animation: 'neonPulse 1s ease-in-out infinite'
                            }} 
                          />
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ fontSize: 20, color: 'rgba(0,255,255,0.7)' }} />
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: 'rgba(255,255,255,0.9)',
                            fontFamily: "'Courier New', monospace",
                            fontWeight: 600
                          }}
                        >
                          {recording.durationSeconds ? formatTime(recording.durationSeconds) : 'UNKNOWN'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GraphicEq sx={{ fontSize: 20, color: 'rgba(0,255,255,0.7)' }} />
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: 'rgba(255,255,255,0.9)',
                            fontFamily: "'Courier New', monospace",
                            fontWeight: 600
                          }}
                        >
                          {recording.extension?.toUpperCase() || 'WAV'}
                        </Typography>
                      </Box>

                      <Chip
                        icon={
                          (recordingDetail?.presignedUrl || recording.url) ? 
                            <CheckCircle /> : 
                            <ErrorIcon />
                        }
                        label={
                          (recordingDetail?.presignedUrl || recording.url) ? 
                            "READY" : 
                            "NO AUDIO"
                        }
                        sx={{
                          background: (recordingDetail?.presignedUrl || recording.url) ? 
                            'rgba(0,255,0,0.2)' : 
                            'rgba(255,0,0,0.2)',
                          color: (recordingDetail?.presignedUrl || recording.url) ? 
                            '#00ff00' : 
                            '#ff0000',
                          border: (recordingDetail?.presignedUrl || recording.url) ? 
                            '1px solid rgba(0,255,0,0.4)' : 
                            '1px solid rgba(255,0,0,0.4)',
                          fontFamily: "'Courier New', monospace",
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}
                      />
                    </Box>

                    {/* 진행률 바 */}
                    {isPlaying && duration > 0 && (
                      <Fade in timeout={300}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#ff0080',
                              fontFamily: "'Courier New', monospace",
                              fontWeight: 700,
                              minWidth: 50,
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
                              minWidth: 50
                            }}
                          >
                            {formatTime(duration)}
                          </Typography>
                        </Box>
                      </Fade>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* 기술적 정보 (API 데이터가 있을 때만) */}
              {recordingDetail && (
                <>
                  <Divider sx={{ borderColor: 'rgba(0,255,255,0.3)' }} />

                  <Box>
                    <Typography 
                      variant="h5" 
                      className="hologram-text"
                      sx={{ 
                        fontFamily: "'Courier New', monospace",
                        fontWeight: 700,
                        mb: 3,
                        letterSpacing: 1
                      }}
                    >
                      TECHNICAL DATA
                    </Typography>

                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CloudDownload sx={{ color: 'rgba(0,255,255,0.7)' }} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Courier New', monospace" }}>
                          Upload ID:
                        </Typography>
                        <Typography sx={{ color: '#00ffff', fontFamily: "'Courier New', monospace", fontWeight: 700 }}>
                          {recordingDetail.uploadId}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Security sx={{ color: 'rgba(0,255,255,0.7)' }} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Courier New', monospace" }}>
                          S3 Key:
                        </Typography>
                        <Typography 
                          sx={{ 
                            color: '#00ffff', 
                            fontFamily: "'Courier New', monospace", 
                            fontWeight: 700,
                            wordBreak: 'break-all'
                          }}
                        >
                          {recordingDetail.s3Key}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AccessTime sx={{ color: 'rgba(0,255,255,0.7)' }} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Courier New', monospace" }}>
                          Expires:
                        </Typography>
                        <Typography sx={{ color: '#00ffff', fontFamily: "'Courier New', monospace", fontWeight: 700 }}>
                          {formatDate(recordingDetail.expirationTime)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </>
              )}

              <Divider sx={{ borderColor: 'rgba(0,255,255,0.3)' }} />

              {/* 액션 버튼들 */}
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
                <Button
                  onClick={onClose}
                  className="cyberpunk-button"
                  sx={{
                    px: 4,
                    py: 1.5,
                    background: 'rgba(128,128,128,0.2)',
                    border: '1px solid rgba(128,128,128,0.4)',
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: "'Courier New', monospace",
                    fontWeight: 600,
                    letterSpacing: 1,
                    borderRadius: 3,
                    '&:hover': {
                      background: 'rgba(128,128,128,0.3)',
                      border: '1px solid rgba(128,128,128,0.6)',
                    }
                  }}
                >
                  CANCEL
                </Button>

                <Button
                  onClick={() => onConfirm(recording, recordingDetail?.uploadId)}
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
                      transform: 'scale(1.05)',
                      boxShadow: '0 0 30px rgba(0,255,255,0.5)'
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    }
                  }}
                >
                  USE FOR RECOMMENDATIONS
                </Button>
              </Box>
            </Stack>
          )}
        </Box>
      </Fade>
    </Dialog>
  );
}
