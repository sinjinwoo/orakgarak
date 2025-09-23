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
import { recordingService } from "../services/api";
import { useCreateAlbum } from "@/hooks/useAlbum";
import { useAlbumMetaStore } from "@/stores/albumMetaStore";

import StepperTimeline, {
  type StageId,
} from "../components/album/StepperTimeline";
import MiniPreviewCard from "../components/album/MiniPreviewCard";
import ActionBar from "../components/album/ActionBar";
import ToastContainer, { type Toast } from "../components/album/Toast";

// ... (dummy data and types remain the same) ...

const cyberpunkStyles = `
    @keyframes hologramScan {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    @keyframes pulseGlow {
      0% { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
      100% { text-shadow: 0 0 30px currentColor, 0 0 60px currentColor; }
    }
  `;

const AlbumCreatePage: React.FC = () => {
  // ... (all hooks and state logic remains the same) ...
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
  const coverImage = albumInfo.coverImageUrl || null;

  const createAlbumMutation = useCreateAlbum();
  const { cover } = useAlbumMetaStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
      setSelectedRecordIds(Array.from(newSet));
    },
    [selectedRecordIds, setSelectedRecordIds, addToast]
  );

  const removeRecording = useCallback(
    (recordingId: string) => {
      const currentSet = new Set(selectedRecordIds.map(String));
      currentSet.delete(recordingId);
      setSelectedRecordIds(Array.from(currentSet));
    },
    [selectedRecordIds, setSelectedRecordIds]
  );

  const currentStage: StageId = useMemo(() => 
    currentStep === 1 ? "recordings" :
    currentStep === 2 ? "cover" :
    currentStep === 3 ? "metadata" : "preview",
  [currentStep]);

  const completedStages: StageId[] = useMemo(() => {
      const stages: StageId[] = [];
      if (selectedRecordings.length > 0) stages.push("recordings");
      if (coverImage) stages.push("cover");
      if (title && description) stages.push("metadata");
      return stages;
  }, [selectedRecordings.length, coverImage, title, description]);

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
  }, [currentStage, selectedRecordIds.length, nextStep, addToast]);

  const handlePrev = useCallback(() => prevStep(), [prevStep]);

  const resetAlbum = useCallback(() => {
    resetCreationState();
    setTracks([]);
  }, [resetCreationState]);

  const getAlbumData = useCallback(() => {
    return {
      title,
      description,
      isPublic,
      uploadId: selectedCoverUploadId || cover.uploadId,
    };
  }, [title, description, isPublic, selectedCoverUploadId, cover.uploadId]);

  const handlePublish = async () => {
    try {
      const albumData = getAlbumData();
      const album = await createAlbumMutation.mutateAsync(albumData);

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

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      console.log("임시저장:", { title, description, selectedRecordIds, coverImage });
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
  }, [title, description, selectedRecordIds, coverImage, addToast]);

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
      } catch (error: any) {
        console.error("녹음 목록 로드 실패:", error);
        setRecordingsError("녹음 목록을 불러오는데 실패했습니다.");
      } finally {
        setRecordingsLoading(false);
      }
    };
    loadRecordings();
  }, []);

  useEffect(() => {
    resetCreationState();
  }, [resetCreationState]);

  useEffect(() => {
    const uniqueSelectedSet = new Set(selectedRecordIds.map(String));
    const newTracks = recordings
      .filter((recording) => uniqueSelectedSet.has(String(recording.id)))
      .map((recording, index) => ({
        ...recording,
        order: index + 1,
        title: recording.song?.title || "제목 없음",
        durationSec: recording.duration || 0,
      }));
    setTracks(newTracks);
  }, [recordings, selectedRecordIds]);

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
          radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)
        `,
      color: '#fff',
    }}>
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />
      <div style={{
        opacity: isInitialized ? 1 : 0,
        transform: isInitialized ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease'
      }}>
        {/* The original component content starts here, but without its own background */}
        <div className="relative pt-20 pb-32">

          <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #00ffff, #ff0080)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 10px 0',
              textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
            }}>
              ALBUM CRAFTING
            </h1>
            <p style={{
              color: '#00ffff',
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              Forge Your Sound, Define Your Story
            </p>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr] lg:grid-cols-1 gap-6 min-h-[calc(100vh-8rem)]">
              {/* Left Column - Stepper Timeline */}
              <div className="hidden xl:block">
                <div style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(0, 255, 255, 0.2)',
                    borderRadius: '15px',
                    padding: '20px',
                    backdropFilter: 'blur(10px)',
                    height: '100%'
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
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(0, 255, 255, 0.2)',
                    borderRadius: '15px',
                    padding: '16px',
                    backdropFilter: 'blur(10px)',
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
              <div className="relative flex flex-col xl:min-w-[720px] min-w-0">
                <div style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(0, 255, 255, 0.2)',
                    borderRadius: '15px',
                    padding: '20px',
                    backdropFilter: 'blur(10px)',
                    height: '100%',
                    position: 'relative' // For MiniPreviewCard positioning
                }}>
                  <div
                    className={`absolute top-0 right-0 z-20 transition-transform duration-300 hidden xl:block ${
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
                      currentStage !== "cover" ? "xl:pr-80 pr-0" : "xl:pr-72 pr-0"
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
          onSaveDraft={handleSaveDraft}
          canGoNext={canGoNext}
          canGoPrev={canGoPrev}
          isSaving={isSaving}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
};

export default AlbumCreatePage;