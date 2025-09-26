// 추천 페이지 메인 컴포넌트 - 달력 기반 녹음본 선택 및 드래그앤드롭 추천 시스템
import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';

// 추천 관련 컴포넌트들
import RecordingCalendar from "../components/recommendation/RecordingCalendar";
import DateRecordingsList from "../components/recommendation/DateRecordingsList";
import RecommendationDropZone from "../components/recommendation/RecommendationDropZone";
import RecommendationResult from "../components/voiceTest/RecommendationResult"; // 추천 결과

// API 서비스
import { recordingService } from "../services/api";

// 타입 정의
import type { Recording } from "../types/recording";

const RecommendationsPage: React.FC = () => {
  // ===== 상태 관리 =====

  // 페이지 상태
  const [currentStep, setCurrentStep] = useState<
    "welcome" | "selection" | "recommendations"
  >("welcome");

  // 녹음본 관련 상태
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);
  const [selectedRecordingForRecommendation, setSelectedRecordingForRecommendation] = useState<Recording | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);

  // 선택된 날짜와 해당 날짜의 녹음본들
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateRecordings, setSelectedDateRecordings] = useState<Recording[]>([]);

  // 재생 상태
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // 드래그 상태
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedRecording, setDraggedRecording] = useState<Recording | null>(null);

  // 추천 결과 관련 상태
  const [showRecommendationResult, setShowRecommendationResult] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // ===== 이벤트 핸들러 =====

  // 녹음본 로드
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        setRecordingsLoading(true);
        setRecordingsError(null);
        const response = await recordingService.getMyRecordings();
        
        // 각 녹음본의 URL 상태를 상세히 로깅
        console.log("📊 로딩된 녹음본 상세 정보:");
        (response || []).forEach((recording, index) => {
          console.log(`📊 녹음본 ${index + 1}:`, {
            id: recording.id,
            title: recording.title,
            url: recording.url,
            publicUrl: recording.publicUrl,
            audioUrl: recording.audioUrl,
            urlStatus: recording.urlStatus,
            extension: recording.extension,
            content_type: recording.content_type,
            file_size: recording.file_size,
            createdAt: recording.createdAt,
            uploadId: recording.uploadId,
            '전체 객체': recording
          });
        });
        
        setRecordings(response || []);
      } catch (error: unknown) {
        console.error("녹음 목록 로드 실패:", error);
        let errorMessage = "녹음 목록을 불러오는데 실패했습니다.";
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
        setRecordings([]);
      } finally {
        setRecordingsLoading(false);
      }
    };
    loadRecordings();
  }, []);

  // 추천받기 시작
  const handleGetRecommendations = useCallback(() => {
    console.log("🎵 RecommendationsPage: handleGetRecommendations 호출됨 - 추천받기 시작");
    setCurrentStep("selection");
  }, []);

  // 달력 날짜 클릭 핸들러
  const handleDateClick = useCallback((date: Date, recordings: Recording[]) => {
    setSelectedDate(date);
    setSelectedDateRecordings(recordings);
  }, []);

  // 녹음본 선택/해제 핸들러 (가운데 영역용)
  const handleToggleRecording = useCallback((recordingId: string) => {
    const recording = selectedDateRecordings.find(r => String(r.id) === recordingId) || 
                     recordings.find(r => String(r.id) === recordingId);
    if (!recording) return;

    if (selectedRecordingForRecommendation?.id === recording.id) {
      // 이미 선택된 녹음본이면 해제
      setSelectedRecordingForRecommendation(null);
      setSelectedUploadId(null);
    } else {
      // 새로운 녹음본 선택 (기존 선택 해제하고 새로 선택)
      setSelectedRecordingForRecommendation(recording);
      setSelectedUploadId(recording.uploadId || null);
    }
  }, [selectedDateRecordings, recordings, selectedRecordingForRecommendation]);

  // 드래그 시작 핸들러
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const recording = selectedDateRecordings.find(r => String(r.id) === active.id) || 
                     recordings.find(r => String(r.id) === active.id);
    if (recording) {
      setDraggedRecording(recording);
    }
  }, [selectedDateRecordings, recordings]);

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedRecording(null);

    if (!over || over.id !== 'recommendation-drop-zone') return;

    const recording = selectedDateRecordings.find(r => String(r.id) === active.id) || 
                     recordings.find(r => String(r.id) === active.id);
    if (recording) {
      setSelectedRecordingForRecommendation(recording);
      setSelectedUploadId(recording.uploadId || null);
    }
  }, [selectedDateRecordings, recordings]);


  // 재생/일시정지 핸들러
  const handlePlayToggle = useCallback(async (recordingId: string) => {
    const recording = selectedDateRecordings.find(r => String(r.id) === recordingId) || 
                     recordings.find(r => String(r.id) === recordingId);
    if (!recording) {
      console.warn('녹음본을 찾을 수 없습니다:', recordingId);
      return;
    }

    console.log('🎵 재생 시도:', {
      id: recording.id,
      title: recording.title,
      url: recording.url,
      urlStatus: recording.urlStatus,
      extension: recording.extension
    });

    // URL 확인 및 재생 가능 여부 체크
    const audioUrl = recording.url || recording.publicUrl || recording.audioUrl;
    const isPlayable = !!audioUrl && (!recording.urlStatus || recording.urlStatus === 'SUCCESS');
    
    if (!isPlayable) {
      console.warn('재생 불가능한 녹음본:', { 
        audioUrl, 
        urlStatus: recording.urlStatus,
        recording: recording
      });
      
      let errorMessage = '이 녹음본은 아직 재생할 수 없습니다.';
      if (!audioUrl) {
        errorMessage = '오디오 파일 URL이 없습니다. 녹음본이 아직 처리 중이거나 업로드에 실패했을 수 있습니다.';
      } else if (recording.urlStatus === 'FAILED') {
        errorMessage = '오디오 파일 처리에 실패했습니다.';
      } else if (recording.urlStatus === 'PROCESSING') {
        errorMessage = '오디오 파일이 아직 처리 중입니다. 잠시 후 다시 시도해주세요.';
      }
      
      alert(errorMessage);
      return;
    }

    // URL 유효성 사전 테스트
    console.log('🔍 URL 유효성 테스트 시작:', audioUrl);
    try {
      const testResponse = await fetch(audioUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.error('🔍 URL 테스트 실패:', testResponse.status, testResponse.statusText);
        alert(`오디오 파일에 접근할 수 없습니다. (${testResponse.status}: ${testResponse.statusText})\n파일이 S3에서 삭제되었거나 권한이 없을 수 있습니다.`);
        return;
      }
      console.log('🔍 URL 테스트 성공:', testResponse.status);
    } catch (fetchError) {
      console.error('🔍 URL 테스트 중 오류:', fetchError);
      alert('오디오 파일에 접근할 수 없습니다. 네트워크 연결을 확인해주세요.');
      return;
    }

    // Audio 엘리먼트 초기화
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.preload = 'metadata';
      
      audioRef.current.addEventListener('ended', () => {
        console.log('🎵 재생 완료');
        setCurrentPlayingId(null);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('🎵 재생 오류:', e);
        setCurrentPlayingId(null);
        alert('오디오 재생 중 오류가 발생했습니다.');
      });

      audioRef.current.addEventListener('loadstart', () => {
        console.log('🎵 로딩 시작');
      });

      audioRef.current.addEventListener('canplay', () => {
        console.log('🎵 재생 가능');
      });
    }

    const audio = audioRef.current;

    // 이미 재생 중인 경우 일시정지
    if (currentPlayingId === recordingId) {
      try {
        audio.pause();
        audio.currentTime = 0;
        console.log('🎵 재생 일시정지');
      } catch (error) {
        console.warn('Audio pause failed:', error);
      }
      setCurrentPlayingId(null);
      return;
    }

    // 다른 녹음본이 재생 중이면 정지
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (error) {
      console.warn('Audio pause failed:', error);
    }

    // 새 녹음본 재생
    console.log('🎵 새 녹음본 재생 시작:', audioUrl);
    audio.src = audioUrl;
    audio.load(); // 새로운 소스 로드
    
    audio.play()
      .then(() => {
        console.log('🎵 재생 성공');
        setCurrentPlayingId(recordingId);
      })
      .catch((error) => {
        console.error('🎵 재생 실패:', error);
        setCurrentPlayingId(null);
        
        // 사용자에게 친화적인 오류 메시지
        if (error.name === 'NotAllowedError') {
          alert('브라우저에서 오디오 재생을 허용해주세요. 페이지를 클릭한 후 다시 시도해보세요.');
        } else if (error.name === 'NotSupportedError') {
          alert('이 오디오 형식은 지원되지 않습니다.');
        } else {
          alert('오디오 재생에 실패했습니다. 네트워크 연결을 확인해주세요.');
        }
      });
  }, [selectedDateRecordings, recordings, currentPlayingId]);

  // 추천 실행
  const handleGetRecommendation = useCallback(() => {
    if (!selectedRecordingForRecommendation || !selectedUploadId) {
      alert("추천을 위한 녹음본을 선택해주세요.");
      return;
    }
    setShowRecommendationResult(true);
  }, [selectedRecordingForRecommendation, selectedUploadId]);

  // 추천 결과에서 뒤로가기
  const handleBackFromRecommendationResult = useCallback(() => {
    setShowRecommendationResult(false);
    setSelectedRecordingForRecommendation(null);
    setSelectedUploadId(null);
    setCurrentStep("welcome");
  }, []);

  // 녹음본 제거
  const handleRemoveRecording = useCallback(() => {
    setSelectedRecordingForRecommendation(null);
    setSelectedUploadId(null);
  }, []);

  // 뒤로가기
  const handleBackToWelcome = useCallback(() => {
    setCurrentStep("welcome");
    setSelectedRecordingForRecommendation(null);
    setSelectedUploadId(null);
    setSelectedDate(null);
    setSelectedDateRecordings([]);
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current.load(); // 리소스 해제
        } catch (error) {
          console.warn('Audio cleanup failed:', error);
        }
        audioRef.current = null;
      }
    };
  }, []);

  // 페이지 벗어날 때 재생 중지
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ===== 조건부 렌더링 =====

  // 추천 결과 화면
  if (
    showRecommendationResult &&
    selectedRecordingForRecommendation &&
    selectedUploadId
  ) {
    return (
      <RecommendationResult
        recording={selectedRecordingForRecommendation}
        uploadId={selectedUploadId}
        onBack={handleBackFromRecommendationResult}
        onGoToRecord={() => window.location.href = "/record"}
      />
    );
  }

  // 녹음본 선택 화면
  if (currentStep === "selection") {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
          position: 'relative',
        }}>
          <div className="relative pt-20 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr_350px] gap-4 min-h-[calc(100vh-8rem)]">
                
                {/* Left Column - Recording Calendar */}
                <div className="w-full">
                  <RecordingCalendar
                    recordings={recordings}
                    selectedRecordings={selectedRecordingForRecommendation ? [String(selectedRecordingForRecommendation.id)] : []}
                    onToggleRecording={handleToggleRecording}
                    onPlayRecording={handlePlayToggle}
                    onDateClick={handleDateClick}
                    currentPlayingId={currentPlayingId}
                    loading={recordingsLoading}
                    error={recordingsError}
                  />
                </div>

                {/* Middle Column - Date Recordings List */}
                <div className="relative flex flex-col min-w-0">
                  <DateRecordingsList
                    selectedDate={selectedDate}
                    recordings={selectedDateRecordings}
                    selectedRecordings={selectedRecordingForRecommendation ? [String(selectedRecordingForRecommendation.id)] : []}
                    onToggleRecording={handleToggleRecording}
                    onPlayRecording={handlePlayToggle}
                    currentPlayingId={currentPlayingId}
                    activeId={activeId}
                  />
                </div>

                {/* Right Column - Drop Zone */}
                <div className="relative flex flex-col min-w-0">
                  <RecommendationDropZone
                    selectedRecording={selectedRecordingForRecommendation}
                    onRemoveRecording={handleRemoveRecording}
                    onPlayRecording={handlePlayToggle}
                    currentPlayingId={currentPlayingId}
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-xl border-t-2 border-cyan-300/80 p-4 z-50 shadow-2xl shadow-cyan-300/50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <button
                    onClick={handleBackToWelcome}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 text-white hover:bg-white/15 border border-white/30 hover:border-pink-300/60"
                  >
                    <span>뒤로가기</span>
                  </button>

                  <button
                    onClick={handleGetRecommendation}
                    disabled={!selectedRecordingForRecommendation}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      selectedRecordingForRecommendation
                        ? 'bg-gradient-to-r from-pink-300 to-cyan-300 hover:from-pink-400 hover:to-cyan-400 text-white shadow-lg shadow-pink-300/40'
                        : 'bg-gray-600 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    <span>추천 받기</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedRecording ? (
            <div className="transform rotate-3 scale-105 opacity-90 shadow-2xl">
              <div className="bg-gray-800/95 backdrop-blur-sm border-2 border-yellow-300/70 rounded-xl p-4 min-w-[300px] shadow-lg shadow-yellow-300/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-200 rounded-lg flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-yellow-300/70">
                    🎵
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {draggedRecording.title || '제목 없음'}
                    </div>
                    <div className="text-white/60 text-sm truncate">
                      {draggedRecording.song?.artist || '아티스트 없음'}
                    </div>
                    <div className="text-white/40 text-xs">
                      {Math.floor((draggedRecording.durationSeconds || draggedRecording.duration || 0) / 60)}:{(draggedRecording.durationSeconds || draggedRecording.duration || 0) % 60 < 10 ? '0' : ''}{(draggedRecording.durationSeconds || draggedRecording.duration || 0) % 60}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  // ===== 메인 UI =====

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
      <div className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 웰컴 화면 */}
          {currentStep === "welcome" && (
            <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
              {/* 메인 콘텐츠 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-2 text-center max-w-600px px-3"
              >
                {/* 타이틀 */}
                <div className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-light text-cyan-300 mb-4 tracking-wide">
                    당신만의 맞춤 추천을 받아보세요
                  </h1>
                  <p className="text-lg text-white/70">
                    달력에서 녹음본을 선택하고 드래그하여 추천을 받아보세요
                  </p>
                </div>

                {/* 추천받기 버튼 */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -10 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGetRecommendations}
                  className="relative cursor-pointer group"
                >
                  <div className="bg-gradient-to-br from-pink-500/20 to-cyan-500/20 border-2 border-pink-300/40 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-pink-300/30 hover:shadow-pink-300/50 transition-all duration-400 min-w-[320px] mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400/5 to-cyan-400/5 rounded-3xl" />
                    
                    <div className="relative z-2 text-center">
                      <div className="text-6xl mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                        🎵
                      </div>
                      <h2 className="text-3xl font-bold text-pink-300 mb-4 tracking-wide">
                        추천받기
                      </h2>
                      <p className="text-lg text-cyan-300 leading-relaxed">
                        달력에서 녹음본을 선택하여<br />
                        맞춤형 노래 추천을 받습니다
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* 통계 정보 - 전문적인 디자인 */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="mt-16 max-w-4xl mx-auto"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* 총 녹음본 카드 */}
                    <motion.div 
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                      <div className="relative bg-gray-900/40 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                              {recordings.length}
                            </div>
                            <div className="text-xs text-blue-400/80 font-medium tracking-wide uppercase">
                              Total
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-white font-semibold text-lg">총 녹음본</h3>
                          <p className="text-white/60 text-sm leading-relaxed">
                            지금까지 녹음한 모든 음성 데이터
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* 오늘 녹음 카드 */}
                    <motion.div 
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-red-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                      <div className="relative bg-gray-900/40 backdrop-blur-xl border border-pink-400/30 rounded-2xl p-6 shadow-2xl shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-400 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent">
                              {recordings.filter(r => {
                                const today = new Date().toISOString().split('T')[0];
                                const recordingDate = new Date(r.createdAt).toISOString().split('T')[0];
                                return recordingDate === today;
                              }).length}
                            </div>
                            <div className="text-xs text-pink-400/80 font-medium tracking-wide uppercase">
                              Today
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-white font-semibold text-lg">오늘 녹음</h3>
                          <p className="text-white/60 text-sm leading-relaxed">
                            오늘 새로 추가된 녹음본 수
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* 녹음 일수 카드 */}
                    <motion.div 
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.2, delay: 0.2 }}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-amber-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                      <div className="relative bg-gray-900/40 backdrop-blur-xl border border-yellow-400/30 rounded-2xl p-6 shadow-2xl shadow-yellow-500/20 group-hover:shadow-yellow-500/40 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                              {new Set(recordings.map(r => new Date(r.createdAt).toISOString().split('T')[0])).size}
                            </div>
                            <div className="text-xs text-yellow-400/80 font-medium tracking-wide uppercase">
                              Days
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-white font-semibold text-lg">녹음 일수</h3>
                          <p className="text-white/60 text-sm leading-relaxed">
                            녹음 활동을 한 총 일수
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* 추가 통계 정보 */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-8 text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm text-white/70">실시간 업데이트</span>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPage;