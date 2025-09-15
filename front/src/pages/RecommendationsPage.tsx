// 추천 페이지 메인 컴포넌트 - 음성 테스트 기반 맞춤 추천 시스템
import React, { useState, useCallback, useMemo } from 'react';
import { Container, Typography, Box, Alert, Snackbar, Button } from '@mui/material';

// 추천 관련 컴포넌트들
import CoverFlow from '../components/recommendation/CoverFlow'; // 3D 커버플로우
import QuickRecommendation from '../components/recommendation/QuickRecommendation'; // 빠른 추천

// 음성 테스트 관련 컴포넌트들
import VoiceTestGame from '../components/voiceTest/VoiceTestGame'; // 게임형 음성 테스트
import VoiceTestSelection from '../components/voiceTest/VoiceTestSelection'; // 음성 테스트 선택
import ExistingRecordingSelection from '../components/voiceTest/ExistingRecordingSelection'; // 기존 녹음본 선택

// 데이터 및 유틸리티
import { musicDatabase } from '../data/musicDatabase'; // 더미 음악 데이터베이스
import { 
  calculateRecommendationScore, // 추천 점수 계산
  generateRecommendationReason, // 추천 이유 생성
  convertToRecommendedSong // 음악 데이터를 추천 곡으로 변환
} from '../utils/recommendationEngine';

// 타입 정의
import type { RecommendedSong, RecommendationFilter } from '../types/recommendation';
import type { VoiceAnalysis } from '../types/voiceAnalysis';
import type { Recording } from '../types/recording';

const RecommendationsPage: React.FC = () => {
  // ===== 상태 관리 =====
  
  // 추천 필터 상태 (장르, 난이도, 기분, 음역대)
  const [filter] = useState<RecommendationFilter>({
    genre: 'all',
    difficulty: 'all',
    mood: [],
    vocalRange: {
      min: 80,
      max: 500
    }
  });
  
  // 곡 선택 상태
  const [selectedSong, setSelectedSong] = useState<RecommendedSong | undefined>();
  
  // 커버플로우 열기/닫기 상태
  const [isCoverFlowOpen, setIsCoverFlowOpen] = useState(false); // 처음에는 닫힌 상태
  
  // 사용자 피드백 상태
  const [userFeedback, setUserFeedback] = useState<{
    [songId: string]: 'like' | 'dislike' | null;
  }>({});
  
  // 추천 통계
  const [recommendationStats, setRecommendationStats] = useState({
    totalLikes: 0,
    totalDislikes: 0,
    averageScore: 0
  });
  
  // 사용자 알림 상태
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });
  
  // 음성 테스트 관련 상태
  const [showVoiceTest, setShowVoiceTest] = useState(false); // 테스트 화면 표시 여부
  
  // 추천 히스토리 관리
  const [recommendationHistory, setRecommendationHistory] = useState<{
    id: string;
    timestamp: Date;
    songs: RecommendedSong[];
    voiceAnalysis: VoiceAnalysis | null;
  }[]>([]);
  
  // 현재 추천 세션
  const [currentRecommendationId, setCurrentRecommendationId] = useState<string | null>(null);
  
  // 페이지 상태
  const [currentStep, setCurrentStep] = useState<'welcome' | 'test' | 'recommendations' | 'history'>('welcome');
  
  // 빠른 추천 관련 상태
  const [showQuickRecommendation, setShowQuickRecommendation] = useState(false);
  const [userRecordings, setUserRecordings] = useState<Recording[]>([]);
  
  // 음성 테스트 선택 관련 상태
  const [showVoiceTestSelection, setShowVoiceTestSelection] = useState(false);
  const [showExistingRecordingSelection, setShowExistingRecordingSelection] = useState(false);

  // ===== 추천 로직 =====
  
  // 현재 추천 곡들 (현재 세션)
  const currentRecommendation = useMemo(() => {
    return recommendationHistory.find(rec => rec.id === currentRecommendationId);
  }, [recommendationHistory, currentRecommendationId]);
  
  // 필터링된 곡 목록
  const filteredSongs = useMemo(() => {
    const recommendedSongs = currentRecommendation?.songs || [];
    return recommendedSongs.filter(song => {
      if (song.vocalRange.min < filter.vocalRange.min || song.vocalRange.max > filter.vocalRange.max) {
        return false;
      }
      return true;
    });
  }, [currentRecommendation, filter]);
  
  // 새로운 추천 생성 함수
  const generateNewRecommendation = useCallback((voiceAnalysis: VoiceAnalysis | null) => {
    const recommendationId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let songs: RecommendedSong[];
    
    if (!voiceAnalysis) {
      // 기본 추천 곡들 생성
      songs = musicDatabase
        .slice(0, 15)
        .map(musicData => {
          const score = Math.floor(Math.random() * 40) + 60;
          const reason = "인기 있는 곡으로 추천합니다";
          return convertToRecommendedSong(musicData, score, reason);
        })
        .sort((a, b) => b.matchScore - a.matchScore);
    } else {
      // 음성 분석 기반 추천
      songs = musicDatabase
        .map(musicData => {
          const score = calculateRecommendationScore(voiceAnalysis, musicData, {
            genre: filter.genre !== 'all' ? filter.genre : undefined,
            difficulty: filter.difficulty !== 'all' ? filter.difficulty : undefined,
            mood: filter.mood
          });
          const reason = generateRecommendationReason(voiceAnalysis, musicData, score);
          return convertToRecommendedSong(musicData, score, reason);
        })
        .filter(song => song.matchScore >= 30)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);
    }
    
    const newRecommendation = {
      id: recommendationId,
      timestamp: new Date(),
      songs,
      voiceAnalysis
    };
    
    setRecommendationHistory(prev => [newRecommendation, ...prev]);
    setCurrentRecommendationId(recommendationId);
    
    return newRecommendation;
  }, [filter]);

  // ===== 이벤트 핸들러 =====
  
  // 곡 선택 핸들러
  const handleSongSelect = useCallback((song: RecommendedSong) => {
    setSelectedSong(song);
    setSnackbar({
      open: true,
      message: `"${song.title}" 선택됨`,
      severity: 'success'
    });
  }, []);

  // 스낵바 닫기 핸들러
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // 테스트 시작 핸들러 (음성 테스트 + 빠른 추천 통합)
  const handleStartTest = useCallback(() => {
    setShowVoiceTestSelection(true);
  }, []);



  // 추천 히스토리에서 선택 핸들러
  const handleSelectRecommendation = useCallback((recommendationId: string) => {
    setCurrentRecommendationId(recommendationId);
    setCurrentStep('recommendations');
    setIsCoverFlowOpen(true);
  }, []);

  // 홈으로 돌아가기 핸들러
  const handleGoHome = useCallback(() => {
    setCurrentStep('welcome');
    setIsCoverFlowOpen(false);
    setSelectedSong(undefined);
  }, []);

  // 곡 피드백 핸들러
  const handleSongFeedback = useCallback((songId: string, feedback: 'like' | 'dislike') => {
    setUserFeedback(prev => {
      const newFeedback = { ...prev, [songId]: feedback };
      
      // 통계 업데이트
      const likes = Object.values(newFeedback).filter(f => f === 'like').length;
      const dislikes = Object.values(newFeedback).filter(f => f === 'dislike').length;
      
      setRecommendationStats({
        totalLikes: likes,
        totalDislikes: dislikes,
        averageScore: likes > 0 ? (likes / (likes + dislikes)) * 100 : 0
      });
      
      return newFeedback;
    });
    
    setSnackbar({
      open: true,
      message: feedback === 'like' ? '좋아요! 비슷한 곡을 더 추천해드릴게요' : '피드백 감사합니다! 다른 곡을 추천해드릴게요',
      severity: feedback === 'like' ? 'success' : 'info'
    });
  }, []);

  // 추천 리스트 페이지로 이동
  const handleGoToMyRecommendations = useCallback(() => {
    setCurrentStep('history');
  }, []);

  // 녹음본 데이터 로드 (MyPage의 더미 데이터 사용)
  const loadRecordings = useCallback(() => {
    // MyPage의 더미 녹음 데이터를 Recording 타입으로 변환
    const mockRecordings: Recording[] = [
      {
        id: 'rec_1',
        userId: 'user_1',
        songId: 'song_1',
        song: { title: '좋아', artist: '윤종신' },
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 225, // 3:45를 초로 변환
        createdAt: '2024-01-15T10:30:00Z',
        analysis: {
          pitchAccuracy: 85,
          tempoAccuracy: 90,
          vocalRange: { min: 80, max: 400 },
          toneAnalysis: { brightness: 70, warmth: 80, clarity: 75 },
          overallScore: 85,
          feedback: ['음정이 정확합니다', '감정 표현이 좋습니다']
        }
      },
      {
        id: 'rec_2',
        userId: 'user_1',
        songId: 'song_2',
        song: { title: '사랑은 은하수 다방에서', artist: '10cm' },
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 252, // 4:12를 초로 변환
        createdAt: '2024-01-14T14:20:00Z',
        analysis: {
          pitchAccuracy: 92,
          tempoAccuracy: 88,
          vocalRange: { min: 90, max: 380 },
          toneAnalysis: { brightness: 75, warmth: 85, clarity: 80 },
          overallScore: 92,
          feedback: ['음색이 아름답습니다', '리듬감이 좋습니다']
        }
      },
      {
        id: 'rec_3',
        userId: 'user_1',
        songId: 'song_3',
        song: { title: '밤편지', artist: '아이유' },
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 203, // 3:23을 초로 변환
        createdAt: '2024-01-13T16:45:00Z',
        analysis: {
          pitchAccuracy: 88,
          tempoAccuracy: 85,
          vocalRange: { min: 85, max: 350 },
          toneAnalysis: { brightness: 65, warmth: 90, clarity: 70 },
          overallScore: 88,
          feedback: ['감정이 잘 전달됩니다', '고음 처리가 좋습니다']
        }
      }
    ];
    
    setUserRecordings(mockRecordings);
  }, []);

  // 컴포넌트 마운트 시 녹음본 데이터 로드
  React.useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);


  // 빠른 추천 완료 핸들러
  const handleQuickRecommendationComplete = useCallback((songs: RecommendedSong[], selectedRecording: Recording) => {
    const recommendationId = `quick_rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newRecommendation = {
      id: recommendationId,
      timestamp: new Date(),
      songs,
      voiceAnalysis: selectedRecording.analysis ? {
        vocalRange: {
          min: selectedRecording.analysis.vocalRange.min,
          max: selectedRecording.analysis.vocalRange.max,
          comfortable: {
            min: selectedRecording.analysis.vocalRange.min + 20,
            max: selectedRecording.analysis.vocalRange.max - 20
          }
        },
        confidence: selectedRecording.analysis.overallScore,
        vocalCharacteristics: {
          pitchVariation: selectedRecording.analysis.pitchAccuracy / 100,
          vibrato: 0.5,
          breathiness: 1 - (selectedRecording.analysis.toneAnalysis.clarity / 100),
          brightness: selectedRecording.analysis.toneAnalysis.brightness / 100
        }
      } : null
    };
    
    setRecommendationHistory(prev => [newRecommendation, ...prev]);
    setCurrentRecommendationId(recommendationId);
    setShowQuickRecommendation(false);
    setCurrentStep('recommendations');
    setIsCoverFlowOpen(true);
    
    setSnackbar({
      open: true,
      message: `"${selectedRecording.song.title}" 녹음본으로 맞춤 추천을 생성했습니다!`,
      severity: 'success'
    });
  }, []);

  // 빠른 추천 닫기 핸들러
  const handleCloseQuickRecommendation = useCallback(() => {
    setShowQuickRecommendation(false);
  }, []);

  // 음성 테스트 관련 핸들러들
  const handleNewRecording = useCallback(() => {
    setShowVoiceTestSelection(false);
    setCurrentStep('test');
    setShowVoiceTest(true);
  }, []);

  const handleUseExistingRecording = useCallback((recording: { id: string; title: string }) => {
    console.log('🎵 RecommendationsPage: 기존 녹음본 사용', recording);
    setShowVoiceTestSelection(false);
    setShowExistingRecordingSelection(true);
  }, []);

  const handleSelectExistingRecording = useCallback((recording: Recording) => {
    console.log('🎵 RecommendationsPage: 기존 녹음본 선택', recording);
    setShowExistingRecordingSelection(false);
    // 기존 녹음본으로 바로 추천 생성
    setShowQuickRecommendation(true);
  }, []);

  const handleBackFromVoiceTestSelection = useCallback(() => {
    setShowVoiceTestSelection(false);
  }, []);

  const handleBackFromExistingSelection = useCallback(() => {
    setShowExistingRecordingSelection(false);
    setShowVoiceTestSelection(true);
  }, []);

  // ===== 조건부 렌더링 =====
  
  // 음성 테스트 화면
  if (showVoiceTest) {
    return (
      <Box sx={{ 
        flex: 1, 
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        minHeight: '100vh' 
      }}>
        <VoiceTestGame />
      </Box>
    );
  }

  // 음성 테스트 선택 화면
  if (showVoiceTestSelection) {
    return (
      <VoiceTestSelection
        onNewRecording={handleNewRecording}
        onUseExisting={handleUseExistingRecording}
        onBack={handleBackFromVoiceTestSelection}
      />
    );
  }

  // 기존 녹음본 선택 화면
  if (showExistingRecordingSelection) {
    return (
      <ExistingRecordingSelection
        onSelectRecording={handleSelectExistingRecording}
        onBack={handleBackFromExistingSelection}
      />
    );
  }

  // 빠른 추천 화면
  if (showQuickRecommendation) {
    return (
      <QuickRecommendation
        recordings={userRecordings}
        onRecommendationComplete={handleQuickRecommendationComplete}
        onClose={handleCloseQuickRecommendation}
      />
    );
  }

  // ===== 메인 UI =====
  
  return (
    <Box sx={{ 
      flex: 1, 
      background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'neon, monospace'
    }}>
      {/* 사이버펑크 배경 효과 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(251, 66, 212, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(66, 253, 235, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(251, 66, 212, 0.05) 0%, transparent 70%)
        `,
        animation: 'cyberGlow 4s ease-in-out infinite alternate',
        '@keyframes cyberGlow': {
          '0%': { opacity: 0.3 },
          '100%': { opacity: 0.7 }
        },
        zIndex: 0
      }} />
      
      {/* 그리드 패턴 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(251, 66, 212, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(66, 253, 235, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite',
        '@keyframes gridMove': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(50px, 50px)' }
        },
        zIndex: 0
      }} />
      
      <Container maxWidth="xl" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
        {/* 상단 네비게이션 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              color: '#FB42D4',
              fontSize: { xs: '2rem', md: '2.5rem' },
              textShadow: '0 0 20px #F40AD5',
              fontFamily: 'neon, monospace',
              animation: 'cyber 2s ease-in-out infinite alternate',
              '@keyframes cyber': {
                '0%': { textShadow: '0 0 20px #F40AD5' },
                '100%': { textShadow: '0 0 40px #F40AD5, 0 0 60px #F40AD5' }
              }
            }}
          >
            🎵 NEON RECOMMENDATIONS
          </Typography>
          
          {/* 추천 히스토리 버튼 */}
          {recommendationHistory.length > 0 && (
            <Button
              variant="outlined"
              onClick={() => setCurrentStep('history')}
              sx={{
                borderColor: 'rgba(66, 253, 235, 0.5)',
                color: '#42FDEB',
                fontFamily: 'neon, monospace',
                textShadow: '0 0 10px #23F6EF',
                '&:hover': {
                  borderColor: '#42FDEB',
                  backgroundColor: 'rgba(66, 253, 235, 0.1)',
                  boxShadow: '0 0 20px rgba(66, 253, 235, 0.3)',
                  textShadow: '0 0 15px #23F6EF'
                }
              }}
            >
              📚 히스토리 ({recommendationHistory.length})
            </Button>
          )}
        </Box>

        {/* 웰컴 화면 - 새로운 배치 */}
        {currentStep === 'welcome' && (
          <Box sx={{ 
            position: 'relative',
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {/* 사이버펑크 배경 애니메이션 */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 20%, rgba(251, 66, 212, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(66, 253, 235, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(251, 66, 212, 0.1) 0%, transparent 70%)
              `,
              animation: 'cyberPulse 4s ease-in-out infinite alternate',
              '@keyframes cyberPulse': {
                '0%': { opacity: 0.3 },
                '100%': { opacity: 0.7 }
              }
            }} />
            
            {/* 메인 콘텐츠 */}
            <Box sx={{ 
              position: 'relative', 
              zIndex: 2,
              textAlign: 'center',
              maxWidth: '800px',
              px: 3
            }}>
              {/* 타이틀 */}
              <Box sx={{ mb: 6 }}>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    color: '#FB42D4',
                    fontWeight: 'bold',
                    fontSize: { xs: '3rem', md: '4rem', lg: '5rem' },
                    mb: 2,
                    textShadow: '0 0 3vw #F40AD5',
                    fontFamily: 'neon, monospace',
                    animation: 'cyber 2.2s ease-in infinite',
                    '@keyframes cyber': {
                      '0%, 100%': { textShadow: '0 0 3vw #F40AD5, 0 0 6vw #F40AD5, 0 0 9vw #F40AD5' },
                      '50%': { textShadow: '0 0 1.5vw #F40AD5, 0 0 3vw #F40AD5, 0 0 4.5vw #F40AD5' }
                    }
                  }}
                >
                  NEON RECOMMENDATIONS
                </Typography>
                
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#42FDEB',
                    fontSize: { xs: '1.2rem', md: '1.5rem' },
                    fontWeight: 300,
                    letterSpacing: '0.5px',
                    lineHeight: 1.6,
                    textShadow: '0 0 10px #23F6EF',
                    fontFamily: 'neon, monospace'
                  }}
                >
                  당신만의 맞춤 추천을 받아보세요
                </Typography>
              </Box>

              {/* 카드형 선택 옵션 */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 4,
                maxWidth: '800px',
                mx: 'auto'
              }}>
                {/* 테스트 카드 (음성 테스트 + 빠른 추천 통합) */}
                <Box
                  onClick={handleStartTest}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(251, 66, 212, 0.1) 0%, rgba(66, 253, 235, 0.1) 100%)',
                    border: '2px solid rgba(251, 66, 212, 0.3)',
                    borderRadius: '25px',
                    p: 4,
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: 'neon, monospace',
                    '&:hover': {
                      transform: 'translateY(-10px) scale(1.02)',
                      border: '2px solid rgba(251, 66, 212, 0.6)',
                      boxShadow: '0 25px 50px rgba(251, 66, 212, 0.3)',
                      '& .card-icon': {
                        transform: 'scale(1.2) rotate(10deg)'
                      }
                    }
                  }}
                >
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(251, 66, 212, 0.05) 0%, rgba(66, 253, 235, 0.05) 50%, transparent 100%)',
                    zIndex: 1
                  }} />
                  
                  <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                    <Box 
                      className="card-icon"
                      sx={{
                        fontSize: '5rem',
                        mb: 3,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🎵
                    </Box>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: '#FB42D4',
                        fontWeight: 'bold',
                        mb: 2,
                        textShadow: '0 0 15px #F40AD5',
                        fontFamily: 'neon, monospace'
                      }}
                    >
                      테스트
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#42FDEB',
                        lineHeight: 1.6,
                        textShadow: '0 0 10px #23F6EF',
                        fontFamily: 'neon, monospace',
                        mb: 2
                      }}
                    >
                      음성 테스트 또는 기존 녹음본으로<br/>
                      맞춤 추천을 받아보세요
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#42FDEB',
                        lineHeight: 1.6,
                        textShadow: '0 0 5px #23F6EF',
                        fontFamily: 'neon, monospace',
                        opacity: 0.8
                      }}
                    >
                      새로 녹음하기 • 기존 녹음본 사용하기
                    </Typography>
                  </Box>
                </Box>

                {/* 추천 리스트 카드 */}
                <Box
                  onClick={handleGoToMyRecommendations}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(251, 66, 212, 0.1) 0%, rgba(175, 15, 90, 0.1) 100%)',
                    border: '2px solid rgba(251, 66, 212, 0.3)',
                    borderRadius: '25px',
                    p: 4,
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: 'neon, monospace',
                    '&:hover': {
                      transform: 'translateY(-10px) scale(1.02)',
                      border: '2px solid rgba(251, 66, 212, 0.6)',
                      boxShadow: '0 25px 50px rgba(251, 66, 212, 0.3)',
                      '& .card-icon': {
                        transform: 'scale(1.2) rotate(-10deg)'
                      }
                    }
                  }}
                >
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(251, 66, 212, 0.05) 0%, transparent 50%)',
                    zIndex: 1
                  }} />
                  
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Box 
                      className="card-icon"
                      sx={{
                        fontSize: '4rem',
                        mb: 2,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      📚
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#FB42D4',
                        fontWeight: 'bold',
                        mb: 2,
                        textShadow: '0 0 10px #F40AD5',
                        fontFamily: 'neon, monospace'
                      }}
                    >
                      내 추천 리스트
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#42FDEB',
                        lineHeight: 1.6,
                        textShadow: '0 0 5px #23F6EF',
                        fontFamily: 'neon, monospace'
                      }}
                    >
                      이전에 받은 추천들을<br/>
                      다시 확인해보세요
                    </Typography>
                  </Box>
                </Box>
              </Box>


            </Box>
          </Box>
        )}

        {/* 추천 화면 */}
        {currentStep === 'recommendations' && (
          <Box>
            {/* 추천 헤더 - 개선된 디자인 */}
            <Box sx={{ 
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '20px',
              p: 4,
              mb: 4,
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* 배경 패턴 */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)
                `,
                zIndex: 0
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: 3
                }}>
                  <Box>
                    <Typography variant="h4" sx={{ 
                      color: '#fff', 
                      mb: 1,
                      fontWeight: 'bold',
                      background: currentRecommendation?.voiceAnalysis 
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {currentRecommendation?.voiceAnalysis ? '🎤 맞춤 추천 곡' : '🎵 인기 추천 곡'}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                      {currentRecommendation?.timestamp && 
                        new Date(currentRecommendation.timestamp).toLocaleString('ko-KR')
                      }
                    </Typography>
                    
                    {/* 통계 정보 */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ 
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '12px',
                        px: 2,
                        py: 1
                      }}>
                        <Typography variant="body2" sx={{ color: '#22c55e', fontWeight: 'bold' }}>
                          👍 {recommendationStats.totalLikes}개 좋아요
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        px: 2,
                        py: 1
                      }}>
                        <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                          👎 {recommendationStats.totalDislikes}개 싫어요
                        </Typography>
                      </Box>
                      {recommendationStats.averageScore > 0 && (
                        <Box sx={{ 
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '12px',
                          px: 2,
                          py: 1
                        }}>
                          <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                            📊 만족도 {Math.round(recommendationStats.averageScore)}%
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      onClick={handleGoHome}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: '#fff',
                        borderRadius: '15px',
                        px: 3,
                        '&:hover': {
                          borderColor: '#fff',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🏠 홈으로
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={() => generateNewRecommendation(null)}
                      sx={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        borderRadius: '15px',
                        px: 3,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🔄 새 추천 생성
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* 커버플로우 */}
            <Box sx={{ 
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '25px',
              p: 3,
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CoverFlow
                songs={filteredSongs}
                selectedSong={selectedSong}
                onSongSelect={handleSongSelect}
                isOpen={isCoverFlowOpen}
                onClose={() => setIsCoverFlowOpen(false)}
                userFeedback={userFeedback}
                onSongFeedback={handleSongFeedback}
              />
              
              {/* 커버플로우가 닫혔을 때 다시 열기 버튼 */}
              {!isCoverFlowOpen && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '400px',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: '#fff', 
                      textAlign: 'center',
                      mb: 2,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 'bold'
                    }}
                  >
                    추천 곡을 확인해보세요
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setIsCoverFlowOpen(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                      borderRadius: '25px',
                      px: 4,
                      py: 1.5,
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                        boxShadow: '0 12px 35px rgba(139, 92, 246, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🎵 추천 곡 보기
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* 히스토리 화면 - 개선된 디자인 */}
        {currentStep === 'history' && (
          <Box>
            {/* 히스토리 헤더 */}
            <Box sx={{ 
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '20px',
              p: 4,
              mb: 4,
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* 배경 패턴 */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.05) 0%, transparent 50%)
                `,
                zIndex: 0
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="h4" sx={{ 
                    color: '#fff',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    📚 내 추천 히스토리
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentStep('welcome')}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: '#fff',
                      borderRadius: '15px',
                      px: 3,
                      '&:hover': {
                        borderColor: '#fff',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🏠 홈으로
                  </Button>
                </Box>
                
                <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                  총 {recommendationHistory.length}개의 추천 세션을 확인할 수 있습니다
                </Typography>
              </Box>
            </Box>
            
            {/* 히스토리 카드들 */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
              gap: 4 
            }}>
              {recommendationHistory.map((rec, index) => (
                <Box
                  key={rec.id}
                  onClick={() => handleSelectRecommendation(rec.id)}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '25px',
                    p: 4,
                    backdropFilter: 'blur(20px)',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 50px rgba(139, 92, 246, 0.3)',
                      border: '1px solid rgba(139, 92, 246, 0.6)',
                      '& .card-number': {
                        transform: 'scale(1.1)'
                      }
                    }
                  }}
                >
                  {/* 카드 번호 */}
                  <Box sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2
                  }}>
                    <Typography 
                      className="card-number"
                      variant="body2" 
                      sx={{ 
                        color: '#fff',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {index + 1}
                    </Typography>
                  </Box>
                  
                  {/* 배경 패턴 */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: rec.voiceAnalysis 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, transparent 50%)'
                      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                    zIndex: 1
                  }} />
                  
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="h6" sx={{ 
                      color: '#fff', 
                      mb: 2,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      {rec.voiceAnalysis ? '🎤 맞춤 추천' : '🎵 인기 추천'}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ 
                      color: '#94a3b8', 
                      mb: 3,
                      fontSize: '0.9rem'
                    }}>
                      {new Date(rec.timestamp).toLocaleString('ko-KR')}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Typography variant="body2" sx={{ 
                        color: '#8b5cf6',
                        fontWeight: 'bold'
                      }}>
                        {rec.songs.length}곡 추천
                      </Typography>
                      
                      <Typography variant="body2" sx={{ 
                        color: '#22c55e',
                        fontWeight: 'bold'
                      }}>
                        평균 {Math.round(rec.songs.reduce((acc, song) => acc + song.matchScore, 0) / rec.songs.length)}점
                      </Typography>
                    </Box>
                    
                    {/* 미리보기 곡들 */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1,
                      flexWrap: 'wrap'
                    }}>
                      {rec.songs.slice(0, 3).map((song, songIndex) => (
                        <Box
                          key={songIndex}
                          sx={{
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '8px',
                            px: 1.5,
                            py: 0.5,
                            fontSize: '0.75rem',
                            color: '#a78bfa',
                            fontWeight: 'bold'
                          }}
                        >
                          {song.title.length > 8 ? `${song.title.substring(0, 8)}...` : song.title}
                        </Box>
                      ))}
                      {rec.songs.length > 3 && (
                        <Box sx={{
                          background: 'rgba(107, 114, 128, 0.1)',
                          border: '1px solid rgba(107, 114, 128, 0.3)',
                          borderRadius: '8px',
                          px: 1.5,
                          py: 0.5,
                          fontSize: '0.75rem',
                          color: '#9ca3af',
                          fontWeight: 'bold'
                        }}>
                          +{rec.songs.length - 3}개
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* 스낵바 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              '& .MuiAlert-icon': {
                color: snackbar.severity === 'success' ? '#22c55e' : 
                       snackbar.severity === 'error' ? '#ef4444' : 
                       snackbar.severity === 'warning' ? '#f59e0b' : '#3b82f6'
              }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default RecommendationsPage;