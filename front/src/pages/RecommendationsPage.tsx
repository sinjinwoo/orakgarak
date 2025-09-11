// 추천 페이지 메인 컴포넌트 - 음성 테스트 기반 맞춤 추천 시스템
import React, { useState, useCallback, useMemo } from 'react';
import { Container, Typography, Box, Alert, Snackbar, Button } from '@mui/material';

// 추천 관련 컴포넌트들
import CoverFlow from '../components/recommendation/CoverFlow'; // 3D 커버플로우

// 음성 테스트 관련 컴포넌트들
import VoiceTestGame from '../components/voiceTest/VoiceTestGame'; // 게임형 음성 테스트

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
  
  // 사용자 알림 상태
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });
  
  // 음성 테스트 관련 상태
  const [, setHasCompletedVoiceTest] = useState(true); // 테스트 완료 여부 (기본값 true로 변경)
  const [userVoiceAnalysis, setUserVoiceAnalysis] = useState<VoiceAnalysis | null>({
    vocalRange: {
      min: 100,
      max: 350,
      comfortable: {
        min: 120,
        max: 330
      }
    },
    confidence: 85,
    vocalCharacteristics: {
      pitchVariation: 0.7,
      vibrato: 0.5,
      breathiness: 0.3,
      brightness: 0.8
    }
  }); // 기본 음성 분석 결과 설정
  const [showVoiceTest, setShowVoiceTest] = useState(false); // 테스트 화면 표시 여부
  
  // 이전 추천 곡들 상태
  const [previousRecommendations, setPreviousRecommendations] = useState<RecommendedSong[]>([]);
  const [showPreviousRecommendations, setShowPreviousRecommendations] = useState(false);

  // ===== 추천 로직 =====
  
  // 추천 곡 생성 - 음성 분석 결과와 음악 DB를 비교하여 매칭 점수 계산
  const recommendedSongs = useMemo(() => {
    // 기본 추천 곡들 생성 (음성 테스트 없이도 표시)
    if (!userVoiceAnalysis) {
      return musicDatabase
        .slice(0, 10) // 처음 10개 곡만 선택
        .map(musicData => {
          const score = Math.floor(Math.random() * 40) + 60; // 60-100점 사이 랜덤 점수
          const reason = "인기 있는 곡으로 추천합니다";
          return convertToRecommendedSong(musicData, score, reason);
        })
        .sort((a, b) => b.matchScore - a.matchScore);
    }
    
    return musicDatabase
      .map(musicData => {
        // 사용자 음성 특성과 곡의 특성을 비교하여 추천 점수 계산
        const score = calculateRecommendationScore(userVoiceAnalysis, musicData, {
          genre: filter.genre !== 'all' ? filter.genre : undefined,
          difficulty: filter.difficulty !== 'all' ? filter.difficulty : undefined,
          mood: filter.mood
        });
        
        // 추천 이유 생성 (음역대 매칭, 음색 특성 등)
        const reason = generateRecommendationReason(userVoiceAnalysis, musicData, score);
        
        // 음악 데이터를 추천 곡 형태로 변환
        return convertToRecommendedSong(musicData, score, reason);
      })
      .filter(song => song.matchScore >= 30) // 최소 30점 이상만 표시
      .sort((a, b) => b.matchScore - a.matchScore); // 매칭 점수 순으로 정렬
  }, [userVoiceAnalysis, filter]);

  // 필터링된 곡 목록 - 사용자 설정한 음역대 범위에 맞는 곡만 필터링
  const filteredSongs = useMemo(() => {
    return recommendedSongs.filter(song => {
      // 음역대 필터: 곡의 음역대가 사용자 설정 범위를 벗어나면 제외
      if (song.vocalRange.min < filter.vocalRange.min || song.vocalRange.max > filter.vocalRange.max) {
        return false;
      }
      
      return true;
    });
  }, [recommendedSongs, filter]);

  // ===== 이벤트 핸들러 =====
  
  // 곡 선택 핸들러 - 선택된 곡을 상태에 저장하여 상세 정보 표시
  const handleSongSelect = useCallback((song: RecommendedSong) => {
    setSelectedSong(song);
  }, []);



  // 스낵바 닫기 핸들러 - 사용자 알림 메시지 닫기
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // ===== 음성 테스트 관련 핸들러 =====
  
  // 음성 테스트 완료 핸들러 - 테스트 결과를 분석하여 추천에 사용
  const handleVoiceTestComplete = useCallback((results: { pitchRange: { minPitch: number; maxPitch: number; minNote: string; maxNote: string }; score: number; timestamp: number }[]) => {
    // 간단한 음성 분석 결과 생성
    const analysis: VoiceAnalysis = {
      vocalRange: {
        min: results[0]?.pitchRange?.minPitch || 80,
        max: results[0]?.pitchRange?.maxPitch || 400,
        comfortable: {
          min: (results[0]?.pitchRange?.minPitch || 80) + 20,
          max: (results[0]?.pitchRange?.maxPitch || 400) - 20
        }
      },
      confidence: 85,
      vocalCharacteristics: {
        pitchVariation: 0.7,
        vibrato: 0.5,
        breathiness: 0.3,
        brightness: 0.8
      }
    };
    
    setUserVoiceAnalysis(analysis); // 분석 결과 저장
    setHasCompletedVoiceTest(true); // 테스트 완료 상태로 변경
    setShowVoiceTest(false); // 테스트 화면 숨김
    
    // 이전 추천 곡들을 현재 추천으로 저장
    if (recommendedSongs.length > 0) {
      setPreviousRecommendations(recommendedSongs);
    }
    
    setSnackbar({ 
      open: true, 
      message: '음성 테스트가 완료되었습니다! 분석 결과를 확인해보세요.', 
      severity: 'success' 
    });
  }, [recommendedSongs]);

  // 음성 테스트 취소 핸들러 - 테스트 중단
  const handleVoiceTestCancel = useCallback(() => {
    setShowVoiceTest(false);
  }, []);

  // 음성 테스트 시작 핸들러 - 게임형 테스트 화면 표시
  const handleStartVoiceTest = useCallback(() => {
    setShowVoiceTest(true);
  }, []);


  // ===== 조건부 렌더링 =====
  
  // 음성 테스트 화면 표시 - 게임형 테스트 진행
  if (showVoiceTest) {
    return (
      <Box sx={{ 
        flex: 1, 
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        minHeight: '100vh' 
      }}>
        <VoiceTestGame
          onTestComplete={handleVoiceTestComplete}
          onTestCancel={handleVoiceTestCancel}
        />
      </Box>
    );
  }


  // ===== 메인 추천 화면 =====
  
  return (
    <Box sx={{ 
      flex: 1, 
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 배경 효과 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)
        `,
        zIndex: 0
      }} />
      
      <Container maxWidth="xl" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
        {/* 페이지 헤더 */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #22c55e 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
            }}
          >
            🎵 NEON RECOMMENDATIONS
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#94a3b8',
              fontSize: '1.2rem',
              fontWeight: 300,
              letterSpacing: '0.5px',
              mb: 3
            }}
          >
            당신의 음역대와 취향에 맞는 미래적 사운드를 추천해드립니다
          </Typography>
          
          {/* 테스트 버튼 - 항상 표시 */}
          <Button
            variant="contained"
            size="large"
            onClick={handleStartVoiceTest}
            sx={{ 
              minWidth: 250, 
              height: 60, 
              fontSize: '1.2rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '15px',
              textTransform: 'none',
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(139, 92, 246, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            🎮 VOICE TEST
          </Button>
        </Box>



        {/* 이전 추천 곡들 섹션 - 항상 표시 */}
        {previousRecommendations.length > 0 && (
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '20px',
            p: 4,
            mb: 4,
            backdropFilter: 'blur(10px)',
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
                radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
              `,
              zIndex: 0
            }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  🎵 PREVIOUS RECOMMENDATIONS
                </Typography>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => setShowPreviousRecommendations(!showPreviousRecommendations)}
                  sx={{
                    border: '2px solid rgba(34, 197, 94, 0.4)',
                    color: '#22c55e',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    px: 3,
                    '&:hover': {
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '2px solid rgba(34, 197, 94, 0.6)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {showPreviousRecommendations ? '숨기기' : '보기'} ({previousRecommendations.length})
                </Button>
              </Box>
              
              {showPreviousRecommendations && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {previousRecommendations.slice(0, 6).map((song) => (
                    <Box
                      key={song.id}
                      sx={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '15px',
                        p: 2,
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.4)'
                        }
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#fff',
                          fontWeight: 'bold',
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {song.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#86efac',
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {song.artist}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#22c55e',
                            fontWeight: 'bold'
                          }}
                        >
                          {song.matchScore}%
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#94a3b8',
                            fontSize: '0.8rem'
                          }}
                        >
                          {song.genre}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* 메인 콘텐츠 - 항상 표시 */}
        {(
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            minHeight: '80vh'
          }}>
            {/* 중앙: 커버플로우 - 추천 곡들을 3D 형태로 표시 */}
            <Box sx={{ 
              width: '100%',
              maxWidth: '1200px',
              background: 'rgba(15, 23, 42, 0.2)',
              borderRadius: '30px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              backdropFilter: 'blur(20px)',
              p: 4,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.2)'
            }}>
              {/* 배경 패턴 */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.05) 0%, transparent 70%)
                `,
                zIndex: 0
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <CoverFlow
                  songs={filteredSongs}
                  selectedSong={selectedSong}
                  onSongSelect={handleSongSelect}
                />
              </Box>
            </Box>

          </Box>
        )}



        {/* 스낵바 - 사용자 액션 피드백 */}
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
