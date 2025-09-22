import React, { useState, useMemo } from "react";
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
} from "@mui/material";
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
} from "@mui/icons-material";
import { Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import StepHeader from './StepHeader';

// 타입 및 훅 import
import { Recording } from "@/types/recording";
import { Album, CreateAlbumRequest } from "@/types/album";
import {
  useAlbumCreationSelectors,
  useAlbumCreationActions,
} from "@/stores/albumStore";
import {
  useCreateCompleteAlbum,
  useUploadCover,
  useGenerateCover,
} from "@/hooks/useAlbum";

interface AlbumPreviewStepProps {
  title: string;
  description: string;
  coverImage: string | null;
  isPublic: boolean;
  selectedRecordings: string[];
  recordings?: Recording[];
  recordingsLoading?: boolean;
  recordingsError?: string | null;
  onPrev: () => void;
  onPublish: () => void;
  onComplete?: (createdAlbum: Album) => void;
}

const AlbumPreviewStep: React.FC<AlbumPreviewStepProps> = ({
  title,
  description,
  coverImage,
  isPublic,
  selectedRecordings,
  recordings,
  recordingsLoading,
  recordingsError,
  onPrev,
  onPublish,
  onComplete,
}) => {
  // Zustand store hooks
  const { selectedCoverUploadId } = useAlbumCreationSelectors();
  const { updateAlbumInfo, getCompleteAlbumData, resetCreationState } =
    useAlbumCreationActions();

  // Props에서 받은 값들을 우선 사용
  const selectedRecordIds = selectedRecordings.map(Number);
  const isValidForCreation =
    title.trim() !== "" &&
    description.trim() !== "" &&
    selectedRecordIds.length > 0;

  // React Query mutations
  const createCompleteAlbum = useCreateCompleteAlbum();

  // Local state
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // 선택된 녹음들 필터링
  const filteredRecordings = useMemo(() => {
    return (
      recordings?.filter((recording) =>
        selectedRecordIds.includes(Number(recording.id))
      ) || []
    );
  }, [recordings, selectedRecordIds]);

  // 총 재생 시간 계산
  const totalDuration = useMemo(() => {
    return filteredRecordings.reduce((total, recording) => {
      return total + (recording.duration || 0);
    }, 0);
  }, [filteredRecordings]);

  // 재생 시간 포맷팅
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // 점수 색상 결정
  const getScoreColor = (score: number): string => {
    if (score >= 90) return "#4caf50";
    if (score >= 80) return "#ff9800";
    if (score >= 70) return "#2196f3";
    return "#f44336";
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
        toast.error("앨범 정보가 완전하지 않습니다.");
        return;
      }

      // 숫자 형태의 recordId로 변환
      const recordIds = selectedRecordIds.map((id) => Number(id));

      const createdAlbum = await createCompleteAlbum.mutateAsync({
        albumData,
        recordIds,
      });

      toast.success("앨범이 성공적으로 발행되었습니다!");
      resetCreationState();
      onComplete(createdAlbum);
    } catch (error: any) {
      console.error("앨범 발행 실패:", error);
      toast.error(error.message || "앨범 발행에 실패했습니다.");
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
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrev}>
          이전 단계로
        </Button>
      </Box>
    );
  }

  // 유효성 검사
  if (!isValidForCreation || selectedRecordings.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>앨범 생성 불가</AlertTitle>
          앨범 제목, 공개 설정, 그리고 최소 1개의 녹음이 필요합니다.
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrev}>
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
        <StepHeader
          title="미리보기"
          description="생성할 앨범의 최종 확인 후 발행하세요"
          icon={<Eye className="w-6 h-6 text-fuchsia-400" />}
        />

        {/* 앨범 정보 카드 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 앨범 커버 */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 rounded-xl border border-white/10 overflow-hidden">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <MusicNote sx={{ fontSize: 48, color: 'rgba(255,255,255,0.4)' }} />
                      <div className="text-white/40 text-sm mt-2">기본 커버</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 앨범 메타데이터 */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">{title || '제목 없음'}</h2>

              {description && (
                <p className="text-white/70 text-base mb-4 leading-relaxed">
                  {description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  isPublic
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                }`}>
                  {isPublic ? <Public sx={{ fontSize: 16 }} /> : <Lock sx={{ fontSize: 16 }} />}
                  {isPublic ? '공개' : '비공개'}
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  <AudioFile sx={{ fontSize: 16 }} />
                  {filteredRecordings.length}곡
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Schedule sx={{ fontSize: 16 }} />
                  {formatDuration(totalDuration)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 트랙 리스트 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MusicNote sx={{ fontSize: 24, color: '#C147E9' }} />
            트랙 목록 ({filteredRecordings.length}곡)
          </h3>

          <div className="space-y-3">
            {filteredRecordings.map((recording, index) => (
              <div
                key={recording.id}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                {/* 트랙 번호 */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>

                {/* 트랙 정보 */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-base mb-1 truncate">
                    {recording.song?.title || `녹음 ${recording.id}`}
                  </h4>
                  <p className="text-white/60 text-sm mb-2 truncate">
                    {recording.song?.artist || "알 수 없는 아티스트"}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/50">
                      {formatDuration(recording.duration || 0)}
                    </span>
                    {recording.analysis && (
                      <div
                        className="px-2 py-1 rounded-full text-white font-medium"
                        style={{
                          backgroundColor: getScoreColor(recording.analysis.overallScore),
                        }}
                      >
                        점수: {recording.analysis.overallScore}
                      </div>
                    )}
                  </div>
                </div>

                {/* 재생 버튼 */}
                <button
                  onClick={() => togglePlayback(recording.id)}
                  className="flex-shrink-0 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  {currentPlayingId === recording.id ? (
                    <Pause sx={{ fontSize: 20, color: '#C147E9' }} />
                  ) : (
                    <PlayArrow sx={{ fontSize: 20, color: '#C147E9' }} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={onPrev}
            disabled={isPublishing}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowBack sx={{ fontSize: 20 }} />
            이전 단계
          </button>

          <button
            onClick={onPublish}
            disabled={isPublishing || !isValidForCreation}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
          >
            {isPublishing ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              <Send sx={{ fontSize: 20 }} />
            )}
            {isPublishing ? "발행 중..." : "앨범 발행"}
          </button>
        </div>

        {/* 발행 진행 상태 */}
        <AnimatePresence>
          {isPublishing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CircularProgress size={16} sx={{ color: '#93c5fd' }} />
                  <span className="font-semibold">앨범을 발행하고 있습니다...</span>
                </div>
                <p className="text-sm text-blue-200">
                  잠시만 기다려주세요. 앨범 생성 및 트랙 추가가 진행 중입니다.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 오류 상태 */}
        {createCompleteAlbum.isError && (
          <Alert severity="error" sx={{ mt: 3 }}>
            <AlertTitle>앨범 발행 실패</AlertTitle>
            {createCompleteAlbum.error?.message ||
              "알 수 없는 오류가 발생했습니다."}
          </Alert>
        )}
      </Box>
    </motion.div>
  );
};

export default AlbumPreviewStep;
