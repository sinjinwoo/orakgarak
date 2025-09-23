/**
 * AudioFileUpload - 오디오 파일 업로드 컴포넌트
 * - 드래그 앤 드롭 지원
 * - 파일 형식 검증 (MP3, WAV, M4A, FLAC, WebM)
 * - 파일 크기 제한 (50MB)
 * - 사이버펑크 디자인
 * - 기존 녹음 API 엔드포인트 활용
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
  TextField,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { 
  CloudUpload, 
  PlayArrow, 
  Pause, 
  Save, 
  Delete, 
  Close,
  MusicNote,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useProcessRecording } from '../../hooks/useRecording';
import { validateAudioFile, formatFileSize, formatDuration } from '../../utils/fileUpload';

// 파일 업로드 상태 타입
type UploadState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface AudioFileUploadProps {
  onUploadComplete?: (recording: any) => void;
  selectedSongId?: number;
  onUploadChange?: (isUploading: boolean) => void;
}

const AudioFileUpload: React.FC<AudioFileUploadProps> = ({
  onUploadComplete,
  selectedSongId,
  onUploadChange,
}) => {
  // 상태 관리
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [playableAudioBlob, setPlayableAudioBlob] = useState<Blob | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // 훅
  const processRecording = useProcessRecording();

  // 지원되는 파일 형식
  const acceptedFormats = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/webm', 'audio/mpeg', 'audio/mp4'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  // 파일 검증
  const validateFile = useCallback((file: File): boolean => {
    try {
      // 파일 크기 검증
      if (file.size > maxFileSize) {
        throw new Error(`파일 크기가 너무 큽니다. 최대 ${formatFileSize(maxFileSize)}까지 허용됩니다.`);
      }

      // 파일 형식 검증
      if (!acceptedFormats.includes(file.type)) {
        throw new Error('지원되지 않는 파일 형식입니다. MP3, WAV, M4A, FLAC, WebM 파일만 업로드 가능합니다.');
      }

      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '파일 검증에 실패했습니다.');
      setShowSnackbar(true);
      return false;
    }
  }, [maxFileSize]);

  // 파일 선택 처리
  const handleFileSelect = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    setErrorMessage('');
    setUploadState('idle');

    try {
      // 파일을 Blob으로 변환
      const blob = new Blob([file], { type: file.type });
      setAudioBlob(blob);

      // 재생용 오디오 준비 (WebM이 아닌 경우 그대로 사용)
      if (file.type.includes('webm')) {
        // WebM은 WAV로 변환 필요
        try {
          const { convertWebMToWAV } = await import('../../utils/fileUpload');
          const playableBlob = await convertWebMToWAV(blob);
          setPlayableAudioBlob(playableBlob);
        } catch (error) {
          console.warn('WAV 변환 실패, 원본 사용:', error);
          setPlayableAudioBlob(blob);
        }
      } else {
        setPlayableAudioBlob(blob);
      }

      // 오디오 길이 가져오기
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };
      audio.src = URL.createObjectURL(blob);

      // 기본 제목 설정
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setRecordingTitle(baseName);

      console.log('파일 선택 완료:', {
        name: file.name,
        size: file.size,
        type: file.type,
        duration: audio.duration
      });

    } catch (error) {
      console.error('파일 처리 실패:', error);
      setErrorMessage('파일 처리에 실패했습니다.');
      setShowSnackbar(true);
    }
  }, [validateFile]);

  // 드래그 앤 드롭 처리
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // 파일 입력 처리
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // 오디오 재생/일시정지
  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !playableAudioBlob) return;

    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying, playableAudioBlob]);

  // 오디오 시간 업데이트
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // 오디오 재생 완료
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // 파일 업로드 처리
  const handleUpload = useCallback(async () => {
    if (!audioBlob || !selectedFile) return;

    const title = recordingTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, '');

    try {
      setUploadState('uploading');
      setUploadProgress(0);
      onUploadChange?.(true);

      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 기존 녹음 처리 로직 사용
      const recording = await processRecording.mutateAsync({
        title,
        audioBlob,
        songId: selectedSongId,
        durationSeconds: Math.floor(duration),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadState('completed');

      // 성공 처리
      setShowSnackbar(true);
      setErrorMessage('파일이 성공적으로 업로드되었습니다!');
      onUploadComplete?.(recording);

      // 2초 후 상태 초기화
      setTimeout(() => {
        setUploadState('idle');
        setSelectedFile(null);
        setAudioBlob(null);
        setPlayableAudioBlob(null);
        setRecordingTitle('');
        setUploadProgress(0);
        setShowModal(false);
        onUploadChange?.(false);
      }, 2000);

    } catch (error) {
      console.error('업로드 실패:', error);
      setUploadState('error');
      setErrorMessage(error instanceof Error ? error.message : '업로드에 실패했습니다.');
      setShowSnackbar(true);
      onUploadChange?.(false);
    }
  }, [audioBlob, selectedFile, recordingTitle, duration, selectedSongId, processRecording, onUploadComplete, onUploadChange]);

  // 파일 삭제
  const handleDelete = useCallback(() => {
    setSelectedFile(null);
    setAudioBlob(null);
    setPlayableAudioBlob(null);
    setRecordingTitle('');
    setUploadState('idle');
    setUploadProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setShowModal(false);
    setErrorMessage('');
  }, []);

  // 모달 열기
  const handleOpenModal = useCallback(() => {
    if (selectedFile && audioBlob) {
      setShowModal(true);
    }
  }, [selectedFile, audioBlob]);

  return (
    <>
      {/* 사이버펑크 스타일 */}
      <style>
        {`
          @keyframes neonPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
          }
          
          @keyframes cyberGridFlow {
            0% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-5px, -3px) rotate(0.5deg); }
            50% { transform: translate(0, -5px) rotate(0deg); }
            75% { transform: translate(3px, -3px) rotate(-0.5deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
          
          @keyframes neonScanLine {
            0% { left: -100%; opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { left: 100%; opacity: 0; }
          }
          
          @keyframes uploadPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(0,255,255,0.3); }
            50% { box-shadow: 0 0 40px rgba(0,255,255,0.6); }
          }
        `}
      </style>

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 3,
        }}
      >
        {/* 업로드 영역 */}
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            position: 'relative',
            width: 300,
            height: 200,
            border: `2px dashed ${isDragOver ? '#ff0080' : '#00ffff'}`,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: isDragOver 
              ? 'linear-gradient(135deg, rgba(255,0,128,0.1), rgba(0,255,255,0.05))'
              : 'linear-gradient(135deg, rgba(0,255,255,0.05), rgba(255,0,128,0.02))',
            boxShadow: isDragOver 
              ? '0 0 30px rgba(255,0,128,0.3)'
              : '0 0 20px rgba(0,255,255,0.2)',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: '0 0 35px rgba(0,255,255,0.4)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 4,
              background: `
                linear-gradient(45deg, 
                  rgba(0,255,255,0.1) 0%, 
                  rgba(255,0,128,0.1) 50%, 
                  rgba(0,255,255,0.1) 100%
                )
              `,
              opacity: isDragOver ? 1 : 0.5,
              transition: 'opacity 0.3s ease',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '-100%',
              width: '100%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
              boxShadow: '0 0 10px #00ffff',
              animation: 'neonScanLine 3s ease-in-out infinite',
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          <CloudUpload
            sx={{
              fontSize: 48,
              color: isDragOver ? '#ff0080' : '#00ffff',
              mb: 2,
              filter: 'drop-shadow(0 0 10px currentColor)',
              animation: 'neonPulse 2s ease-in-out infinite',
            }}
          />

          <Typography
            variant="h6"
            sx={{
              color: isDragOver ? '#ff0080' : '#00ffff',
              fontWeight: 700,
              textAlign: 'center',
              textShadow: '0 0 10px currentColor',
              fontFamily: 'monospace',
            }}
          >
            {isDragOver ? '파일을 놓으세요' : '파일을 드래그하거나 클릭'}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              mt: 1,
              fontFamily: 'monospace',
            }}
          >
            MP3, WAV, M4A, FLAC, WebM
            <br />
            최대 {formatFileSize(maxFileSize)}
          </Typography>
        </Box>

        {/* 선택된 파일 정보 */}
        {selectedFile && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(0,255,255,0.08), rgba(255,0,128,0.04))',
              border: '1px solid rgba(0,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              width: '100%',
              maxWidth: 400,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <MusicNote sx={{ color: '#00ffff', fontSize: 32 }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00ffff',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    textShadow: '0 0 8px rgba(0,255,255,0.5)',
                  }}
                >
                  {selectedFile.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'monospace',
                  }}
                >
                  {formatFileSize(selectedFile.size)} • {selectedFile.type.split('/')[1].toUpperCase()}
                </Typography>
              </Box>
            </Box>

            {/* 진행률 표시 */}
            {uploadState === 'uploading' && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #00ffff, #ff0080)',
                      boxShadow: '0 0 15px rgba(0,255,255,0.6)',
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#00ffff',
                    fontFamily: 'monospace',
                    mt: 1,
                    display: 'block',
                  }}
                >
                  업로드 중... {uploadProgress}%
                </Typography>
              </Box>
            )}

            {/* 상태 표시 */}
            {uploadState === 'completed' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircle sx={{ color: '#00ff88', fontSize: 20 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#00ff88',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  업로드 완료!
                </Typography>
              </Box>
            )}

            {uploadState === 'error' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ErrorIcon sx={{ color: '#ff0080', fontSize: 20 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ff0080',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  업로드 실패
                </Typography>
              </Box>
            )}

            {/* 액션 버튼들 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PlayArrow />}
                onClick={handleOpenModal}
                disabled={uploadState === 'uploading'}
                sx={{
                  border: '1px solid #00ffff',
                  color: '#00ffff',
                  fontFamily: 'monospace',
                  '&:hover': {
                    bgcolor: 'rgba(0,255,255,0.1)',
                    boxShadow: '0 0 15px rgba(0,255,255,0.3)',
                  },
                }}
              >
                미리보기
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={uploadState === 'uploading' ? <CircularProgress size={16} /> : <Save />}
                onClick={handleUpload}
                disabled={uploadState === 'uploading' || uploadState === 'completed'}
                sx={{
                  background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                  color: '#000',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00ffaa, #00e695)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0,255,136,0.4)',
                  },
                  '&:disabled': {
                    background: 'rgba(128,128,128,0.2)',
                    color: '#666',
                  },
                }}
              >
                {uploadState === 'uploading' ? '업로드 중...' : '업로드'}
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<Delete />}
                onClick={handleDelete}
                disabled={uploadState === 'uploading'}
                sx={{
                  border: '1px solid #ff0080',
                  color: '#ff0080',
                  fontFamily: 'monospace',
                  '&:hover': {
                    bgcolor: 'rgba(255,0,128,0.1)',
                    boxShadow: '0 0 15px rgba(255,0,128,0.3)',
                  },
                }}
              >
                삭제
              </Button>
            </Box>
          </Paper>
        )}

        {/* 미리보기 모달 */}
        <Modal
          open={showModal && !!selectedFile}
          onClose={() => setShowModal(false)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: '90%',
              maxWidth: 500,
              p: 0,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(0,255,255,0.1), rgba(255,0,128,0.05))',
              border: '2px solid rgba(0,255,255,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 50px rgba(0,255,255,0.3)',
            }}
          >
            {/* 헤더 */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 3,
                borderBottom: '1px solid rgba(0,255,255,0.2)',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#00ffff',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  textShadow: '0 0 10px rgba(0,255,255,0.5)',
                }}
              >
                🎵 파일 미리보기
              </Typography>
              <IconButton
                onClick={() => setShowModal(false)}
                sx={{
                  color: '#00ffff',
                  '&:hover': {
                    bgcolor: 'rgba(0,255,255,0.1)',
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* 본문 */}
            <Box sx={{ p: 3 }}>
              {/* 파일 정보 */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00ffff',
                    mb: 1,
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedFile?.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'monospace',
                  }}
                >
                  {formatFileSize(selectedFile?.size || 0)} • {selectedFile?.type.split('/')[1].toUpperCase()}
                </Typography>
              </Box>

              {/* 오디오 플레이어 */}
              {playableAudioBlob && (
                <Box sx={{ mb: 3 }}>
                  <audio
                    ref={audioRef}
                    src={URL.createObjectURL(playableAudioBlob)}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    preload="metadata"
                  />

                  {/* 재생 컨트롤 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <IconButton
                      onClick={togglePlayback}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: isPlaying ? 'rgba(255,0,128,0.2)' : 'rgba(0,255,255,0.2)',
                        color: isPlaying ? '#ff0080' : '#00ffff',
                        border: `2px solid ${isPlaying ? '#ff0080' : '#00ffff'}`,
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: `0 0 20px ${isPlaying ? 'rgba(255,0,128,0.5)' : 'rgba(0,255,255,0.5)'}`,
                        },
                      }}
                    >
                      {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#00ffff',
                          fontFamily: 'monospace',
                          mb: 1,
                        }}
                      >
                        {formatDuration(currentTime)} / {formatDuration(duration)}
                      </Typography>
                      
                      {/* 진행바 */}
                      <Box
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                            background: 'linear-gradient(90deg, #00ffff, #ff0080)',
                            boxShadow: '0 0 10px rgba(0,255,255,0.6)',
                            transition: 'width 0.1s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* 제목 입력 */}
              <TextField
                fullWidth
                label="녹음 제목"
                placeholder="녹음 제목을 입력하세요"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                disabled={uploadState === 'uploading'}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(0,255,255,0.3)',
                    color: '#fff',
                    '&:hover': {
                      borderColor: 'rgba(0,255,255,0.5)',
                    },
                    '&.Mui-focused': {
                      borderColor: '#00ffff',
                      boxShadow: '0 0 12px rgba(0,255,255,0.3)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                    '&.Mui-focused': {
                      color: '#00ffff',
                    },
                  },
                }}
              />

              {/* 액션 버튼들 */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={uploadState === 'uploading' ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleUpload}
                  disabled={uploadState === 'uploading'}
                  sx={{
                    background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                    color: '#000',
                    fontWeight: 700,
                    py: 1.5,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #00ffaa, #00e695)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(0,255,136,0.4)',
                    },
                    '&:disabled': {
                      background: 'rgba(128,128,128,0.2)',
                      color: '#666',
                    },
                  }}
                >
                  {uploadState === 'uploading' ? '업로드 중...' : '업로드'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleDelete}
                  disabled={uploadState === 'uploading'}
                  sx={{
                    border: '2px solid #ff0080',
                    color: '#ff0080',
                    fontWeight: 700,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'rgba(255,0,128,0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(255,0,128,0.3)',
                    },
                  }}
                >
                  삭제
                </Button>
              </Box>
            </Box>
          </Paper>
        </Modal>

        {/* 에러 메시지 스낵바 */}
        <Snackbar
          open={showSnackbar}
          autoHideDuration={4000}
          onClose={() => setShowSnackbar(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowSnackbar(false)}
            severity={errorMessage.includes('실패') ? 'error' : 'success'}
            sx={{
              width: '100%',
              bgcolor: errorMessage.includes('실패') ? 'rgba(255,0,128,0.1)' : 'rgba(0,255,136,0.1)',
              border: `1px solid ${errorMessage.includes('실패') ? '#ff0080' : '#00ff88'}`,
              color: errorMessage.includes('실패') ? '#ff0080' : '#00ff88',
            }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default AudioFileUpload;
