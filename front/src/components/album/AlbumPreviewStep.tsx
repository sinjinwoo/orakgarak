import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Chip,
  Divider,
  Alert,
  AlertTitle,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Send,
  ArrowBack,
  MusicNote,
  Public,
  Lock,
  Schedule,
  AudioFile,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

// 타입 및 훅 import
import { Recording } from '@/types/recording';
import { Album, CreateAlbumRequest } from '@/types/album';
import {
  useAlbumCreationSelectors,
  useAlbumCreationActions
} from '@/stores/albumStore';
import {
  useCreateCompleteAlbum,
  useUploadCover,
  useGenerateCover
} from '@/hooks/useAlbum';

interface AlbumPreviewStepProps {
  recordings: Recording[];
  recordingsLoading: boolean;
  recordingsError: string | null;
  onPrev: () => void;
  onComplete: (createdAlbum: Album) => void;
}

const AlbumPreviewStep: React.FC<AlbumPreviewStepProps> = ({
  recordings,
  recordingsLoading,
  recordingsError,
  onPrev,
  onComplete,
}) => {
  // Zustand store hooks
  const {
    selectedRecordIds,
    selectedCoverUploadId,
    albumInfo,
    isValidForCreation,
  } = useAlbumCreationSelectors();

  const {
    updateAlbumInfo,
    getCompleteAlbumData,
    resetCreationState,
  } = useAlbumCreationActions();

  // React Query mutations
  const createCompleteAlbum = useCreateCompleteAlbum();

  // Local state
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // 선택된 녹음들 필터링
  const selectedRecordings = useMemo(() => {
    return recordings.filter(recording =>
      selectedRecordIds.includes(Number(recording.id))
    );
  }, [recordings, selectedRecordIds]);

  // 총 재생 시간 계산
  const totalDuration = useMemo(() => {
    return selectedRecordings.reduce((total, recording) => {
      return total + (recording.duration || 0);
    }, 0);
  }, [selectedRecordings]);

  // 재생 시간 포맷팅
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 점수 색상 결정
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#ff9800';
    if (score >= 70) return '#2196f3';
    return '#f44336';
  };

  // 재생/일시정지 토글
  const togglePlayback = (recordingId: string) => {
    if (currentPlayingId === recordingId) {
      setCurrentPlayingId(null);
    } else {
      setCurrentPlayingId(recordingId);
    }
  };

  // 앨범 발행
  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      const albumData = getCompleteAlbumData();
      if (!albumData) {
        toast.error('앨범 정보가 완전하지 않습니다.');
        return;
      }

      // 숫자 형태의 recordId로 변환
      const recordIds = selectedRecordIds.map(id => Number(id));

      const createdAlbum = await createCompleteAlbum.mutateAsync({
        albumData,
        recordIds,
      });

      toast.success('앨범이 성공적으로 발행되었습니다!');
      resetCreationState();
      onComplete(createdAlbum);

    } catch (error: any) {
      console.error('앨범 발행 실패:', error);
      toast.error(error.message || '앨범 발행에 실패했습니다.');
    } finally {
      setIsPublishing(false);
    }
  };

  // 로딩 상태
  if (recordingsLoading) {
    return (
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          앨범 미리보기
        </Typography>
        <Box mt={3}>
          <Skeleton variant="rectangular" height={200} />
          <Box mt={2}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Box>
        </Box>
      </Box>
    );
  }

  // 에러 상태
  if (recordingsError) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>녹음 데이터 로드 실패</AlertTitle>
          {recordingsError}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={onPrev}
        >
          이전 단계로
        </Button>
      </Box>
    );
  }

  // 유효성 검사
  if (!isValidForCreation() || selectedRecordings.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>앨범 생성 불가</AlertTitle>
          앨범 제목, 공개 설정, 그리고 최소 1개의 녹음이 필요합니다.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={onPrev}
        >
          이전 단계로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Box p={3}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          앨범 미리보기
        </Typography>

        <Typography variant="body1" color="text.secondary" gutterBottom>
          생성할 앨범의 최종 확인 후 발행하세요.
        </Typography>

        {/* 앨범 정보 카드 */}
        <Paper elevation={3} sx={{ p: 3, mt: 3, mb: 3 }}>
          <Box display="flex" alignItems="flex-start" gap={3}>
            {/* 앨범 커버 */}
            <Box
              sx={{
                width: 200,
                height: 200,
                bgcolor: 'grey.200',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {selectedCoverUploadId ? (
                <Avatar
                  sx={{ width: '100%', height: '100%', borderRadius: 2 }}
                  variant="rounded"
                >
                  <MusicNote sx={{ fontSize: 80 }} />
                </Avatar>
              ) : (
                <Box textAlign="center">
                  <MusicNote sx={{ fontSize: 60, color: 'grey.400' }} />
                  <Typography variant="body2" color="grey.500">
                    기본 커버
                  </Typography>
                </Box>
              )}
            </Box>

            {/* 앨범 메타데이터 */}
            <Box flex={1}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {albumInfo.title}
              </Typography>

              {albumInfo.description && (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {albumInfo.description}
                </Typography>
              )}

              <Box display="flex" gap={1} mb={2}>
                <Chip
                  icon={albumInfo.isPublic ? <Public /> : <Lock />}
                  label={albumInfo.isPublic ? '공개' : '비공개'}
                  color={albumInfo.isPublic ? 'primary' : 'default'}
                  size="small"
                />
                <Chip
                  icon={<AudioFile />}
                  label={`${selectedRecordings.length}곡`}
                  size="small"
                />
                <Chip
                  icon={<Schedule />}
                  label={formatDuration(totalDuration)}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* 트랙 리스트 */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              트랙 목록 ({selectedRecordings.length}곡)
            </Typography>

            <List>
              {selectedRecordings.map((recording, index) => (
                <React.Fragment key={recording.id}>
                  <ListItem
                    sx={{
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <ListItemAvatar>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      >
                        {index + 1}
                      </Box>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="medium">
                          {recording.song?.title || `녹음 ${recording.id}`}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {recording.song?.artist || '알 수 없는 아티스트'}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <Typography variant="caption">
                              {formatDuration(recording.duration)}
                            </Typography>
                            {recording.analysis && (
                              <Chip
                                label={`점수: ${recording.analysis.overallScore}`}
                                size="small"
                                sx={{
                                  bgcolor: getScoreColor(recording.analysis.overallScore),
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />

                    <IconButton
                      onClick={() => togglePlayback(recording.id)}
                      color="primary"
                      size="large"
                    >
                      {currentPlayingId === recording.id ? <Pause /> : <PlayArrow />}
                    </IconButton>
                  </ListItem>

                  {index < selectedRecordings.length - 1 && <Divider variant="inset" />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </Paper>

        {/* 액션 버튼들 */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onPrev}
            disabled={isPublishing}
            size="large"
          >
            이전 단계
          </Button>

          <Button
            variant="contained"
            startIcon={
              isPublishing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send />
              )
            }
            onClick={handlePublish}
            disabled={isPublishing || !isValidForCreation()}
            size="large"
            sx={{
              minWidth: 140,
              fontWeight: 'bold',
            }}
          >
            {isPublishing ? '발행 중...' : '앨범 발행'}
          </Button>
        </Box>

        {/* 발행 진행 상태 */}
        <AnimatePresence>
          {isPublishing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert severity="info" sx={{ mt: 3 }}>
                <AlertTitle>앨범을 발행하고 있습니다...</AlertTitle>
                잠시만 기다려주세요. 앨범 생성 및 트랙 추가가 진행 중입니다.
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 오류 상태 */}
        {createCompleteAlbum.isError && (
          <Alert severity="error" sx={{ mt: 3 }}>
            <AlertTitle>앨범 발행 실패</AlertTitle>
            {createCompleteAlbum.error?.message || '알 수 없는 오류가 발생했습니다.'}
          </Alert>
        )}
      </Box>
    </motion.div>
  );
};

export default AlbumPreviewStep;