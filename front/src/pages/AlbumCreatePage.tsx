/**
 * Album Create Page - Refactored with vertical timeline stepper & 2-column layout
 * 앨범 생성 페이지 - 세로 타임라인 스테퍼와 2컬럼 레이아웃으로 리팩토링
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAlbumStore } from '../stores/albumStore';
import type { Recording } from '../types/recording';
import NewRecordingSelectionStep from '../components/album/NewRecordingSelectionStep';
import NewCoverSelectionStep from '../components/album/NewCoverSelectionStep';
import AlbumInfoStep from '../components/album/AlbumInfoStep';
import AlbumPreviewStep from '../components/album/AlbumPreviewStep';

// 더미 녹음 데이터
const dummyRecordings: Recording[] = [
  {
    id: '1',
    userId: 'user1',
    songId: 'song1',
    song: { title: '좋아', artist: '윤종신' },
    audioUrl: '', // 실제 오디오 파일이 없으므로 빈 문자열 사용
    duration: 225, // 3:45
    createdAt: '2025-01-15T00:00:00Z',
    analysis: {
      pitchAccuracy: 85,
      tempoAccuracy: 80,
      vocalRange: { min: 200, max: 800 },
      toneAnalysis: { brightness: 70, warmth: 80, clarity: 75 },
      overallScore: 85,
      feedback: ['음정이 정확합니다', '리듬감이 좋습니다'],
    },
  },
  {
    id: '2',
    userId: 'user1',
    songId: 'song2',
    song: { title: '사랑은 은하수 다방에서', artist: '10cm' },
    audioUrl: '', // 실제 오디오 파일이 없으므로 빈 문자열 사용
    duration: 252, // 4:12
    createdAt: '2025-01-14T00:00:00Z',
    analysis: {
      pitchAccuracy: 75,
      tempoAccuracy: 85,
      vocalRange: { min: 180, max: 750 },
      toneAnalysis: { brightness: 65, warmth: 85, clarity: 70 },
      overallScore: 78,
      feedback: ['감정 표현이 좋습니다', '발음을 더 명확히 해보세요'],
    },
  },
  {
    id: '3',
    userId: 'user1',
    songId: 'song3',
    song: { title: '밤편지', artist: '아이유' },
    audioUrl: '', // 실제 오디오 파일이 없으므로 빈 문자열 사용
    duration: 203, // 3:23
    createdAt: '2025-01-13T00:00:00Z',
    analysis: {
      pitchAccuracy: 95,
      tempoAccuracy: 90,
      vocalRange: { min: 220, max: 850 },
      toneAnalysis: { brightness: 80, warmth: 90, clarity: 95 },
      overallScore: 92,
      feedback: ['완벽한 음정', '아름다운 음색'],
    },
  },
  {
    id: '4',
    userId: 'user1',
    songId: 'song4',
    song: { title: 'Spring Day', artist: 'BTS' },
    audioUrl: '/audio/sample4.mp3',
    duration: 246, // 4:06
    createdAt: '2025-01-12T00:00:00Z',
    analysis: {
      pitchAccuracy: 80,
      tempoAccuracy: 75,
      vocalRange: { min: 200, max: 780 },
      toneAnalysis: { brightness: 75, warmth: 70, clarity: 80 },
      overallScore: 81,
      feedback: ['리듬감을 더 살려보세요', '음정은 좋습니다'],
    },
  },
  {
    id: '5',
    userId: 'user1',
    songId: 'song5',
    song: { title: '너를 만나', artist: '폴킴' },
    audioUrl: '/audio/sample5.mp3',
    duration: 238, // 3:58
    createdAt: '2025-01-11T00:00:00Z',
    analysis: {
      pitchAccuracy: 88,
      tempoAccuracy: 85,
      vocalRange: { min: 190, max: 820 },
      toneAnalysis: { brightness: 85, warmth: 85, clarity: 88 },
      overallScore: 88,
      feedback: ['매우 좋은 연습입니다', '감정이 잘 전달됩니다'],
    },
  },
];

// New imports for the refactored components
import StepperTimeline, { type StageId } from '../components/album/StepperTimeline';
import MiniPreviewCard from '../components/album/MiniPreviewCard';
import ActionBar from '../components/album/ActionBar';
import ToastContainer, { type Toast } from '../components/album/Toast';

// Track type for the new layout
interface Track extends Recording {
  order: number;
}

const AlbumCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    title,
    description,
    coverImage,
    isPublic,
    selectedRecordings,
    setTitle,
    setDescription,
    setCoverImage,
    setIsPublic,
    addRecording,
    removeRecording,
    setSelectedRecordings,
    nextStep,
    prevStep,
    goToStep,
    resetAlbum,
    createAlbum,
    getAlbumData,
    saveDraft,
  } = useAlbumStore();

  const [recordings] = useState<Recording[]>(dummyRecordings);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Convert currentStep to StageId
  const currentStage: StageId = currentStep === 'recordings' ? 'recordings' :
                                currentStep === 'cover' ? 'cover' :
                                currentStep === 'metadata' ? 'metadata' : 'preview';

  // Track completed stages
  const completedStages: StageId[] = [];
  if (selectedRecordings.length > 0) completedStages.push('recordings');
  if (coverImage) completedStages.push('cover');
  if (title && description) completedStages.push('metadata');

  // Toast management
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id, duration: toast.duration || 4000 }]);
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  // Stage navigation
  const handleStageChange = useCallback((stage: StageId) => {
    goToStep(stage);
  }, [goToStep]);

  // Action bar handlers
  const handleNext = useCallback(() => {
    if (currentStage === 'recordings' && selectedRecordings.length === 0) {
      addToast({
        type: 'warning',
        message: '최소 1곡 이상 선택해주세요.',
      });
      return;
    }
    nextStep();
  }, [currentStage, selectedRecordings.length, nextStep, addToast]);

  const handlePrev = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      saveDraft();
      addToast({
        type: 'success',
        message: '임시저장이 완료되었습니다.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: '임시저장에 실패했습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [saveDraft, addToast]);

  // Convert selected recordings to tracks
  useEffect(() => {
    const newTracks = recordings
      .filter(recording => selectedRecordings.includes(recording.id))
      .map((recording, index) => ({
        ...recording,
        order: index + 1,
        durationSec: recording.duration || 0,
      }));
    setTracks(newTracks);
  }, [recordings, selectedRecordings]);

  // Navigation guards
  const canGoNext = useMemo(() => {
    switch (currentStage) {
      case 'recordings':
        return selectedRecordings.length > 0;
      case 'cover':
        return true; // Cover is optional
      case 'metadata':
        return title.trim().length > 0;
      case 'preview':
        return true;
      default:
        return false;
    }
  }, [currentStage, selectedRecordings.length, title]);

  const canGoPrev = useMemo(() => {
    return currentStage !== 'recordings';
  }, [currentStage]);

  // Single stage component renderer
  const renderCurrentStage = () => {
    switch (currentStage) {
      case 'recordings':
        return (
          <NewRecordingSelectionStep
            recordings={recordings}
            selectedRecordings={selectedRecordings}
            onToggleRecording={(recordingId) => {
              if (selectedRecordings.includes(recordingId)) {
                removeRecording(recordingId);
              } else {
                if (selectedRecordings.length >= 10) {
                  addToast({
                    type: 'warning',
                    message: '최대 10곡까지만 선택할 수 있습니다.',
                  });
                  return;
                }
                addRecording(recordingId);
              }
            }}
            onAddToast={addToast}
          />
        );
      case 'cover':
        return (
          <NewCoverSelectionStep
            selectedRecordings={selectedRecordings}
          />
        );
      case 'metadata':
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
      case 'preview':
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
        type: 'success',
        message: '앨범이 성공적으로 발행되었습니다!',
      });

      // 짧은 지연 후 페이지 이동
      setTimeout(() => {
        navigate('/me/albums');
        resetAlbum();
      }, 1500);
    } catch (error) {
      console.error('Failed to publish album:', error);
      addToast({
        type: 'error',
        message: '앨범 발행에 실패했습니다.',
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentStep === 'completed') {
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
              {/* Mini Preview Card - Only show for non-cover stages */}
              {currentStage !== 'cover' && (
                <div className="absolute top-0 right-0 z-20">
                  <MiniPreviewCard
                    tracks={tracks}
                    coverImageUrl={coverImage}
                    albumTitle={title || '새 앨범'}
                  />
                </div>
              )}

              {/* Stage Content */}
              <div className={`flex-1 ${currentStage !== 'cover' ? 'pr-80' : ''}`}>
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
