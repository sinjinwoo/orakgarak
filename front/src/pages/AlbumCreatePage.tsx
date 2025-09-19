/**
 * Album Create Page - Refactored with vertical timeline stepper & 2-column layout
 * 앨범 생성 페이지 - 세로 타임라인 스테퍼와 2컬럼 레이아웃으로 리팩토링
 */

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  useAlbumCreationSelectors,
  useAlbumCreationActions,
} from "../stores/albumStore";
import type { Recording } from "../types/recording";
import NewRecordingSelectionStep from "../components/album/NewRecordingSelectionStep";
import NewCoverSelectionStep from "../components/album/NewCoverSelectionStep";
import AlbumInfoStep from "../components/album/AlbumInfoStep";
import AlbumPreviewStep from "../components/album/AlbumPreviewStep";
import { recordingAPI } from "../services/backend";

// 더미 녹음 데이터
const dummyRecordings: Recording[] = [
  {
    id: "1",
    userId: "user1",
    songId: "song1",
    song: { title: "좋아", artist: "윤종신" },
    audioUrl: "", // 실제 오디오 파일이 없으므로 빈 문자열 사용
    duration: 225, // 3:45
    createdAt: "2025-01-15T00:00:00Z",
    analysis: {
      pitchAccuracy: 85,
      tempoAccuracy: 80,
      vocalRange: { min: 200, max: 800 },
      toneAnalysis: { brightness: 70, warmth: 80, clarity: 75 },
      overallScore: 85,
      feedback: ["음정이 정확합니다", "리듬감이 좋습니다"],
    },
  },
  {
    id: "2",
    userId: "user1",
    songId: "song2",
    song: { title: "사랑은 은하수 다방에서", artist: "10cm" },
    audioUrl: "", // 실제 오디오 파일이 없으므로 빈 문자열 사용
    duration: 252, // 4:12
    createdAt: "2025-01-14T00:00:00Z",
    analysis: {
      pitchAccuracy: 75,
      tempoAccuracy: 85,
      vocalRange: { min: 180, max: 750 },
      toneAnalysis: { brightness: 65, warmth: 85, clarity: 70 },
      overallScore: 78,
      feedback: ["감정 표현이 좋습니다", "발음을 더 명확히 해보세요"],
    },
  },
  {
    id: "3",
    userId: "user1",
    songId: "song3",
    song: { title: "밤편지", artist: "아이유" },
    audioUrl: "", // 실제 오디오 파일이 없으므로 빈 문자열 사용
    duration: 203, // 3:23
    createdAt: "2025-01-13T00:00:00Z",
    analysis: {
      pitchAccuracy: 95,
      tempoAccuracy: 90,
      vocalRange: { min: 220, max: 850 },
      toneAnalysis: { brightness: 80, warmth: 90, clarity: 95 },
      overallScore: 92,
      feedback: ["완벽한 음정", "아름다운 음색"],
    },
  },
  {
    id: "4",
    userId: "user1",
    songId: "song4",
    song: { title: "Spring Day", artist: "BTS" },
    audioUrl: "/audio/sample4.mp3",
    duration: 246, // 4:06
    createdAt: "2025-01-12T00:00:00Z",
    analysis: {
      pitchAccuracy: 80,
      tempoAccuracy: 75,
      vocalRange: { min: 200, max: 780 },
      toneAnalysis: { brightness: 75, warmth: 70, clarity: 80 },
      overallScore: 81,
      feedback: ["리듬감을 더 살려보세요", "음정은 좋습니다"],
    },
  },
  {
    id: "5",
    userId: "user1",
    songId: "song5",
    song: { title: "너를 만나", artist: "폴킴" },
    audioUrl: "/audio/sample5.mp3",
    duration: 238, // 3:58
    createdAt: "2025-01-11T00:00:00Z",
    analysis: {
      pitchAccuracy: 88,
      tempoAccuracy: 85,
      vocalRange: { min: 190, max: 820 },
      toneAnalysis: { brightness: 85, warmth: 85, clarity: 88 },
      overallScore: 88,
      feedback: ["매우 좋은 연습입니다", "감정이 잘 전달됩니다"],
    },
  },
];

// New imports for the refactored components
import StepperTimeline, {
  type StageId,
} from "../components/album/StepperTimeline";
import MiniPreviewCard from "../components/album/MiniPreviewCard";
import ActionBar from "../components/album/ActionBar";
import ToastContainer, { type Toast } from "../components/album/Toast";

// Track type for the new layout
interface Track extends Recording {
  order: number;
}

const AlbumCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, selectedRecordIds, albumInfo } =
    useAlbumCreationSelectors();

  const {
    setCreationStep,
    nextStep,
    prevStep,
    setSelectedRecordIds,
    updateAlbumInfo,
    resetCreationState,
  } = useAlbumCreationActions();

  // Legacy compatibility getters
  const title = albumInfo.title || "";
  const description = albumInfo.description || "";
  const isPublic = albumInfo.isPublic ?? false;
  const selectedRecordings = useMemo(
    () => selectedRecordIds.map(String),
    [selectedRecordIds]
  );
  const coverImage = albumInfo.coverImageUrl || null; // 커버 이미지 URL

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Convert currentStep to StageId
  const currentStage: StageId =
    currentStep === "recordings"
      ? "recordings"
      : currentStep === "cover"
      ? "cover"
      : currentStep === "metadata"
      ? "metadata"
      : "preview";

  // Track completed stages
  const completedStages: StageId[] = [];
  if (selectedRecordings.length > 0) completedStages.push("recordings");
  if (coverImage) completedStages.push("cover");
  if (title && description) completedStages.push("metadata");

  // Toast management
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [
      ...prev,
      { ...toast, id, duration: toast.duration || 4000 },
    ]);
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  // Stage navigation
  const goToStep = useCallback(
    (stage: StageId) => {
      setCreationStep(stage);
    },
    [setCreationStep]
  );

  const handleStageChange = useCallback(
    (stage: StageId) => {
      goToStep(stage);
    },
    [goToStep]
  );

  // 임시저장 함수
  const saveDraft = useCallback(() => {
    // 현재 상태를 로컬 스토리지에 저장하거나 서버에 임시저장
    console.log("임시저장:", {
      title,
      description,
      selectedRecordIds,
      coverImage,
    });
    // TODO: 실제 임시저장 API 호출
  }, [title, description, selectedRecordIds, coverImage]);

  // 앨범 초기화 함수
  const resetAlbum = useCallback(() => {
    resetCreationState();
  }, [resetCreationState]);

  // 앨범 데이터 생성 함수
  const getAlbumData = useCallback(() => {
    return {
      title,
      description,
      isPublic,
      coverImageUrl: coverImage,
    };
  }, [title, description, isPublic, coverImage]);

  // 앨범 생성 함수 (임시)
  const createAlbum = useCallback((albumData: any, recordings: Recording[]) => {
    // TODO: 실제 앨범 생성 API 호출
    console.log("앨범 생성:", albumData, recordings);
    return Date.now(); // 임시 앨범 ID
  }, []);

  // Action bar handlers
  const handleNext = useCallback(() => {
    if (currentStage === "recordings" && selectedRecordIds.length === 0) {
      addToast({
        type: "warning",
        message: "최소 1곡 이상 선택해주세요.",
      });
      return;
    }
    nextStep();
  }, [currentStage, selectedRecordIds.length, nextStep, addToast]);

  const handlePrev = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      saveDraft();
      addToast({
        type: "success",
        message: "임시저장이 완료되었습니다.",
      });
    } catch (error) {
      addToast({
        type: "error",
        message: "임시저장에 실패했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [saveDraft, addToast]);

  // Load recordings data
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        setRecordingsLoading(true);
        setRecordingsError(null);
        const response = await recordingAPI.getMyRecordings();
        setRecordings(response.data || []);
      } catch (error: any) {
        console.error("녹음 목록 로드 실패:", error);

        // 에러 타입에 따른 적절한 메시지 설정
        let errorMessage = "녹음 목록을 불러오는데 실패했습니다.";

        if (error?.response?.status === 401) {
          errorMessage = "로그인이 필요합니다.";
        } else if (error?.response?.status === 403) {
          errorMessage = "접근 권한이 없습니다.";
        } else if (error?.response?.status >= 500) {
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if (error?.message?.includes("Network Error")) {
          errorMessage = "네트워크 연결을 확인해주세요.";
        }

        setRecordingsError(errorMessage);

        // 더미 데이터로 fallback (개발 중)
        console.warn("녹음 API 실패로 더미 데이터 사용");
        setRecordings(dummyRecordings);
      } finally {
        setRecordingsLoading(false);
      }
    };

    loadRecordings();
  }, []);

  // Convert selected recordings to tracks
  useEffect(() => {
    const selectedRecordingIds = selectedRecordIds.map(String);
    const newTracks = recordings
      .filter((recording) => selectedRecordingIds.includes(recording.id))
      .map((recording, index) => ({
        ...recording,
        order: index + 1,
        durationSec: recording.duration || 0,
      }));
    setTracks(newTracks);
  }, [recordings, selectedRecordIds]);

  // Navigation guards
  const canGoNext = useMemo(() => {
    switch (currentStage) {
      case "recordings":
        return selectedRecordings.length > 0;
      case "cover":
        return true; // Cover is optional
      case "metadata":
        return title.trim().length > 0;
      case "preview":
        return true;
      default:
        return false;
    }
  }, [currentStage, selectedRecordIds.length, title]);

  const canGoPrev = useMemo(() => {
    return currentStage !== "recordings";
  }, [currentStage]);

  // Single stage component renderer
  const renderCurrentStage = () => {
    switch (currentStage) {
      case "recordings":
        return (
          <NewRecordingSelectionStep
            recordings={recordings}
            selectedRecordings={selectedRecordings}
            loading={recordingsLoading}
            error={recordingsError}
            onToggleRecording={(recordingId) => {
              if (selectedRecordings.includes(recordingId)) {
                removeRecording(recordingId);
              } else {
                if (selectedRecordings.length >= 10) {
                  addToast({
                    type: "warning",
                    message: "최대 10곡까지만 선택할 수 있습니다.",
                  });
                  return;
                }
                addRecording(recordingId);
              }
            }}
            onAddToast={addToast}
          />
        );
      case "cover":
        return (
          <NewCoverSelectionStep selectedRecordings={selectedRecordings} />
        );
      case "metadata":
        return (
          <AlbumInfoStep
            title={title}
            description={description}
            isPublic={isPublic}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onIsPublicChange={setIsPublic}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case "preview":
        return (
          <AlbumPreviewStep
            title={title}
            description={description}
            coverImage={coverImage}
            isPublic={isPublic}
            selectedRecordings={selectedRecordings}
            onPublish={handlePublish}
            onPrev={handlePrev}
          />
        );
      default:
        return null;
    }
  };

  const handlePublish = async () => {
    try {
      const albumData = getAlbumData();
      const albumId = createAlbum(albumData, recordings);

      addToast({
        type: "success",
        message: "앨범이 성공적으로 발행되었습니다!",
      });

      // 짧은 지연 후 페이지 이동
      setTimeout(() => {
        navigate("/me/albums");
        resetAlbum();
      }, 1500);
    } catch (error) {
      console.error("Failed to publish album:", error);
      addToast({
        type: "error",
        message: "앨범 발행에 실패했습니다.",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentStep === "completed") {
        resetAlbum();
      }
    };
  }, [currentStep, resetAlbum]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,107,157,0.15)_0%,transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(196,71,233,0.2)_0%,transparent_40%)] pointer-events-none" />

      {/* Main container with 2-column grid */}
      <div className="relative z-10 pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[280px_1fr] gap-6 min-h-[calc(100vh-8rem)]">
            {/* Left Column - Stepper Timeline */}
            <StepperTimeline
              currentStage={currentStage}
              onStageChange={handleStageChange}
              completedStages={completedStages}
            />

            {/* Right Column - Stage Content */}
            <div className="relative flex flex-col min-w-[720px]">
              {/* Mini Preview Card - Always show, but adjust position for cover stage */}
              <div
                className={`absolute top-0 right-0 z-20 transition-transform duration-300 ${
                  currentStage === "cover" ? "translate-y-4 scale-90" : ""
                }`}
              >
                <MiniPreviewCard
                  tracks={tracks}
                  coverImageUrl={coverImage}
                  albumTitle={title || "새 앨범"}
                />
              </div>

              {/* Stage Content */}
              <div
                className={`flex-1 ${
                  currentStage !== "cover" ? "pr-80" : "pr-72"
                }`}
              >
                <motion.div
                  key={currentStage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {renderCurrentStage()}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar - Fixed at bottom */}
      <ActionBar
        currentStage={currentStage}
        onPrev={handlePrev}
        onNext={handleNext}
        onSaveDraft={handleSaveDraft}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        isSaving={isSaving}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default AlbumCreatePage;
