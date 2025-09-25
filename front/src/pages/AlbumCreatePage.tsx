import React, {
  useEffect,
  useState,
  useCallback,
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
import { recordingService } from "../services/api";
import { useCreateAlbum } from "@/hooks/useAlbum";
import { useAlbumMetaStore } from "@/stores/albumMetaStore";

// New imports for the refactored components
import StepperTimeline, {
  type StageId,
} from "../components/album/StepperTimeline";
import MiniPreviewCard from "../components/album/MiniPreviewCard";
import ActionBar from "../components/album/ActionBar";
import ToastContainer, { type Toast } from "../components/album/Toast";


const cyberpunkStyles = `
    @keyframes hologramScan {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    @keyframes pulseGlow {
      0% { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
      100% { text-shadow: 0 0 30px currentColor, 0 0 60px currentColor; }
    }
    @keyframes neonFlicker {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.9; }
    }
    @keyframes cyberGlow {
      0% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.4), 0 0 50px rgba(6, 182, 212, 0.3); }
      100% { box-shadow: 0 0 40px rgba(236, 72, 153, 0.6), 0 0 70px rgba(6, 182, 212, 0.4); }
    }
    @keyframes brightPulse {
      0%, 100% { filter: brightness(1) saturate(1); }
      50% { filter: brightness(1.2) saturate(1.3); }
    }
  `;

const AlbumCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, selectedRecordIds, albumInfo, selectedCoverUploadId } =
    useAlbumCreationSelectors();

  const {
    setCreationStep,
    nextStep,
    prevStep,
    setSelectedRecordIds,
    updateAlbumInfo,
    resetCreationState,
  } = useAlbumCreationActions();

  const title = albumInfo.title || "";
  const description = albumInfo.description || "";
  const isPublic = albumInfo.isPublic ?? false;
  const selectedRecordings = useMemo(
    () => Array.from(new Set(selectedRecordIds.map(String))),
    [selectedRecordIds]
  );
  // 타입 가드를 사용하여 안전하게 coverImageUrl 접근
  const coverImage = (() => {
    if (albumInfo && typeof albumInfo === 'object' && 'coverImageUrl' in albumInfo) {
      return (albumInfo as { coverImageUrl?: string }).coverImageUrl || null;
    }
    return null;
  })();

  const createAlbumMutation = useCreateAlbum();
  const { cover } = useAlbumMetaStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const addRecording = useCallback(
    (recordingId: string) => {
      const currentSet = new Set(selectedRecordIds.map(String));
      if (currentSet.has(recordingId)) return;
      if (currentSet.size >= 10) {
        addToast({ type: 'warning', message: '최대 10곡까지 선택할 수 있습니다.' });
        return;
      }
      const newSet = new Set([...currentSet, recordingId]);
      setSelectedRecordIds(Array.from(newSet).map(Number));
    },
    [selectedRecordIds, setSelectedRecordIds, addToast]
  );

  const removeRecording = useCallback(
    (recordingId: string) => {
      const currentSet = new Set(selectedRecordIds.map(String));
      currentSet.delete(recordingId);
      setSelectedRecordIds(Array.from(currentSet).map(Number));
      
      // 녹음 제거 시 토스트 알림
      addToast({ type: 'info', message: '녹음이 제거되었습니다.' });
    },
    [selectedRecordIds, setSelectedRecordIds, addToast]
  );

  const currentStage: StageId = useMemo(() => {
    const stageMap: Record<number, StageId> = {
      1: "recordings",
      2: "cover", 
      3: "metadata",
      4: "preview"
    };
    return stageMap[currentStep] || "recordings";
  }, [currentStep]);

  const completedStages: StageId[] = useMemo(() => {
      const stages: StageId[] = [];
      if (selectedRecordings.length > 0) stages.push("recordings");
      if (coverImage) stages.push("cover");
      if (title && description) stages.push("metadata");
      return stages;
  }, [selectedRecordings.length, coverImage, title, description]);

  // 선택된 녹음들을 트랙으로 변환
  const tracks = useMemo(() => {
    const uniqueSelectedSet = new Set(selectedRecordIds.map(String));
    return recordings
      .filter((recording) => uniqueSelectedSet.has(String(recording.id)))
      .map((recording, index) => ({
        id: String(recording.id),
        order: index + 1,
        title: recording.song?.title || "제목 없음",
        artist: recording.song?.artist || "아티스트 없음",
        durationSec: recording.duration || 0,
      }));
  }, [recordings, selectedRecordIds]);

  const handleStageChange = useCallback((stage: StageId) => {
    const stepNumber = stage === "recordings" ? 1 : stage === "cover" ? 2 : stage === "metadata" ? 3 : 4;
    setCreationStep(stepNumber);
  }, [setCreationStep]);

  const handleNext = useCallback(() => {
    if (currentStage === "recordings" && selectedRecordings.length === 0) {
      addToast({ type: "warning", message: "최소 1곡 이상 선택해주세요." });
      return;
    }
    nextStep();
  }, [currentStage, selectedRecordings.length, nextStep, addToast]);

  const handlePrev = useCallback(() => prevStep(), [prevStep]);

  const resetAlbum = useCallback(() => {
    resetCreationState();
  }, [resetCreationState]);

  const getAlbumData = useCallback(() => {
    const recordIds = tracks.map(track => track.id);
    const trackOrders = tracks.map(track => track.order);

    return {
      title,
      description,
      isPublic,
      uploadId: selectedCoverUploadId || cover.uploadId,
      recordIds,
      trackOrders,
    };
  }, [title, description, isPublic, selectedCoverUploadId, cover.uploadId, tracks]);

  const handlePublish = async () => {
    try {
      const albumData = getAlbumData();
      await createAlbumMutation.mutateAsync(albumData);

      addToast({
        type: "success",
        message: "앨범이 성공적으로 발행되었습니다!",
      });

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

  const setTitle = useCallback((newTitle: string) => updateAlbumInfo({ title: newTitle }), [updateAlbumInfo]);
  const setDescription = useCallback((newDescription: string) => updateAlbumInfo({ description: newDescription }), [updateAlbumInfo]);
  const setIsPublic = useCallback((newIsPublic: boolean) => updateAlbumInfo({ isPublic: newIsPublic }), [updateAlbumInfo]);

  useEffect(() => {
      const timer = setTimeout(() => setIsInitialized(true), 100);
      return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadRecordings = async () => {
      try {
        setRecordingsLoading(true);
        setRecordingsError(null);
        const response = await recordingService.getMyRecordings();
        setRecordings(response || []);
      } catch (error: unknown) {
        console.error("녹음 목록 로드 실패:", error);

        // 에러 타입에 따른 적절한 메시지 설정
        let errorMessage = "녹음 목록을 불러오는데 실패했습니다.";

        // 에러 객체의 타입을 확인하여 안전하게 접근
        const errorObj = error as { response?: { status: number }; message?: string };
        
        if (errorObj?.response?.status === 401) {
          errorMessage = "로그인이 필요합니다.";
        } else if (errorObj?.response?.status === 403) {
          errorMessage = "접근 권한이 없습니다.";
        } else if (errorObj?.response?.status >= 500) {
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if (errorObj?.message?.includes("Network Error")) {
          errorMessage = "네트워크 연결을 확인해주세요.";
        }

        setRecordingsError(errorMessage);

        // API 실패 시 빈 배열로 초기화
        console.warn("녹음 API 실패로 빈 배열 사용");
        setRecordings([]);
      } finally {
        setRecordingsLoading(false);
      }
    };
    loadRecordings();
  }, []);

  useEffect(() => {
    resetCreationState();
  }, [resetCreationState]);

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
              const currentSelectedSet = new Set(selectedRecordIds.map(String));
              if (currentSelectedSet.has(String(recordingId))) {
                removeRecording(String(recordingId));
              } else {
                addRecording(String(recordingId));
              }
            }}
            onAddToast={addToast}
          />
        );
      case "cover":
        return <NewCoverSelectionStep selectedRecordings={selectedRecordings} />;
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
            recordings={recordings}
            recordingsLoading={recordingsLoading}
            recordingsError={recordingsError}
            onPublish={handlePublish}
            onPrev={handlePrev}
          />
        );
      default:
        return null;
    }
  };

  const canGoNext = useMemo(() => {
    if (currentStage === "recordings") return selectedRecordings.length > 0;
    if (currentStage === "metadata") return title.trim().length > 0;
    return true;
  }, [currentStage, selectedRecordings.length, title]);

  const canGoPrev = useMemo(() => currentStage !== "recordings", [currentStage]);

  return (
    <div style={{
      minHeight: '100vh',
      background: `
          radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.25) 0%, transparent 60%),
          radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
          radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 80%),
          radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 70%),
          linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)
        `,
      color: '#fff',
      paddingTop: '100px',
      overflowX: 'hidden',
    }}>
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />
      <div style={{
        opacity: isInitialized ? 1 : 0,
        transform: isInitialized ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease'
      }}>
        {/* The original component content starts here, but without its own background */}
        <div className="relative pt-20 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,300px)_1fr] gap-6 min-h-[calc(100vh-8rem)]">
              {/* Left Column - Stepper Timeline */}
              <div className="hidden xl:block w-full">
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '4px solid rgba(6, 182, 212, 0.8)',
                    borderRadius: '15px',
                    padding: '0',
                    backdropFilter: 'blur(15px)',
                    height: '100%',
                    width: '100%',
                    maxWidth: '300px',
                    boxShadow: '0 0 50px rgba(6, 182, 212, 0.7), inset 0 0 50px rgba(236, 72, 153, 0.4)'
                }}>
                  <StepperTimeline
                    currentStage={currentStage}
                    onStageChange={handleStageChange}
                    completedStages={completedStages}
                  />
                </div>
              </div>

              {/* Mobile Stepper */}
              <div className="xl:hidden mb-6">
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '4px solid rgba(6, 182, 212, 0.8)',
                    borderRadius: '15px',
                    padding: '16px',
                    backdropFilter: 'blur(15px)',
                    boxShadow: '0 0 50px rgba(6, 182, 212, 0.7), inset 0 0 50px rgba(236, 72, 153, 0.4)'
                }}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">앨범 만들기</h2>
                    <div className="text-sm text-white/60">
                      {currentStep} / 4
                    </div>
                  </div>
                  <p className="text-sm text-white/60 mt-1">
                    {currentStage === 'recordings' ? '녹음 선택' :
                     currentStage === 'cover' ? '커버/스타일' :
                     currentStage === 'metadata' ? '앨범 정보' : '미리보기'}
                  </p>
                  <div className="mt-3 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-fuchsia-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentStep * 25}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Stage Content */}
              <div className="relative flex flex-col min-w-0">
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '4px solid rgba(236, 72, 153, 0.8)',
                    borderRadius: '15px',
                    padding: '20px',
                    backdropFilter: 'blur(15px)',
                    height: '100%',
                    position: 'relative',
                    boxShadow: '0 0 50px rgba(236, 72, 153, 0.7), inset 0 0 50px rgba(6, 182, 212, 0.4)'
                }}>
                  <div
                    className={`absolute top-4 right-4 z-20 transition-transform duration-300 hidden xl:block ${
                      currentStage === "cover" ? "translate-y-4 scale-90" : ""
                    }`}
                  >
                    <MiniPreviewCard
                      tracks={tracks}
                      coverImageUrl={coverImage}
                      albumTitle={title || "새 앨범"}
                    />
                  </div>

                  <div
                    className={`flex-1 ${
                      currentStage !== "cover" ? "xl:pr-60 pr-0" : "xl:pr-52 pr-0"
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
        </div>

        <ActionBar
          currentStage={currentStage}
          onPrev={handlePrev}
          onNext={handleNext}
          canGoNext={canGoNext}
          canGoPrev={canGoPrev}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
};

export default AlbumCreatePage;