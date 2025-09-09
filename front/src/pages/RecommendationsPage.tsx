// 추천 페이지 메인 컴포넌트 - 음성 테스트 기반 맞춤 추천 시스템
import React, { useState, useCallback, useMemo } from 'react';
import { Container, Typography, Box, Alert, Snackbar, Paper, Button } from '@mui/material';

// 추천 관련 컴포넌트들
import RecommendationFilters from '../components/recommendation/RecommendationFilters'; // 장르/난이도/기분 필터
import RecommendationList from '../components/recommendation/RecommendationList'; // 추천 곡 목록
import RangeMatchGraph from '../components/recommendation/RangeMatchGraph'; // 음역대 매칭 시각화

// 음성 테스트 관련 컴포넌트들
import VoiceTestGame from '../components/voiceTest/VoiceTestGame'; // 게임형 음성 테스트
import VoiceTestResults from '../components/voiceTest/VoiceTestResults'; // 테스트 결과 분석 화면

// 데이터 및 유틸리티
import { musicDatabase } from '../data/musicDatabase'; // 더미 음악 데이터베이스
import { 
  convertTestResultsToAnalysis, // 테스트 결과를 음성 분석으로 변환
  calculateRecommendationScore, // 추천 점수 계산
  generateRecommendationReason, // 추천 이유 생성
  convertToRecommendedSong // 음악 데이터를 추천 곡으로 변환
} from '../utils/recommendationEngine';

// 타입 정의
import type { RecommendedSong, RecommendationFilter } from '../types/recommendation';
import type { VoiceTestResult, VoiceAnalysis } from '../types/voiceAnalysis';

const RecommendationsPage: React.FC = () => {
  // ===== 상태 관리 =====
  
  // 추천 필터 상태 (장르, 난이도, 기분, 음역대)
  const [filter, setFilter] = useState<RecommendationFilter>({
    genre: 'all',
    difficulty: 'all',
    mood: [],
    vocalRange: {
      min: 80,
      max: 500
    }
  });
  
  // 곡 선택 및 북마크 상태
  const [selectedSong, setSelectedSong] = useState<RecommendedSong | undefined>();
  const [bookmarkedSongs, setBookmarkedSongs] = useState<string[]>([]);
  const [isLoading] = useState(false);
  
  // 사용자 알림 상태
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });
  
  // 음성 테스트 관련 상태
  const [hasCompletedVoiceTest, setHasCompletedVoiceTest] = useState(false); // 테스트 완료 여부
  const [userVoiceAnalysis, setUserVoiceAnalysis] = useState<VoiceAnalysis | null>(null); // 사용자 음성 분석 결과
  const [showVoiceTest, setShowVoiceTest] = useState(false); // 테스트 화면 표시 여부
  const [showVoiceResults, setShowVoiceResults] = useState(false); // 결과 화면 표시 여부

  // ===== 추천 로직 =====
  
  // 추천 곡 생성 - 음성 분석 결과와 음악 DB를 비교하여 매칭 점수 계산
  const recommendedSongs = useMemo(() => {
    // 음성 테스트가 완료되지 않았으면 빈 배열 반환
    if (!hasCompletedVoiceTest || !userVoiceAnalysis) {
      return [];
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
  }, [hasCompletedVoiceTest, userVoiceAnalysis, filter]);

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

  // 북마크 토글 핸들러 - 곡을 저장 목록에 추가/제거
  const handleSongBookmark = useCallback((song: RecommendedSong) => {
    setBookmarkedSongs(prev => {
      const isBookmarked = prev.includes(song.id);
      if (isBookmarked) {
        setSnackbar({ open: true, message: `${song.title}을(를) 저장 목록에서 제거했습니다.`, severity: 'info' });
        return prev.filter(id => id !== song.id);
      } else {
        setSnackbar({ open: true, message: `${song.title}을(를) 저장 목록에 추가했습니다.`, severity: 'success' });
        return [...prev, song.id];
      }
    });
  }, []);

  // 예약 핸들러 - 곡을 녹음 예약 목록에 추가
  const handleSongReserve = useCallback((song: RecommendedSong) => {
    setSnackbar({ open: true, message: `${song.title}을(를) 예약 목록에 추가했습니다.`, severity: 'success' });
    // TODO: 실제 예약 로직 구현 (RecordPage의 ReservationQueue와 연동)
  }, []);

  // 필터 변경 핸들러 - 추천 필터 업데이트
  const handleFilterChange = useCallback((newFilter: RecommendationFilter) => {
    setFilter(newFilter);
    setSelectedSong(undefined); // 필터 변경 시 선택된 곡 초기화
  }, []);

  // 필터 초기화 핸들러 - 모든 필터를 기본값으로 리셋
  const handleFilterReset = useCallback(() => {
    const resetFilter: RecommendationFilter = {
      genre: 'all',
      difficulty: 'all',
      mood: [],
      vocalRange: {
        min: 80,
        max: 500
      }
    };
    setFilter(resetFilter);
    setSelectedSong(undefined);
  }, []);

  // 스낵바 닫기 핸들러 - 사용자 알림 메시지 닫기
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // ===== 음성 테스트 관련 핸들러 =====
  
  // 음성 테스트 완료 핸들러 - 테스트 결과를 분석하여 추천에 사용
  const handleVoiceTestComplete = useCallback((results: VoiceTestResult[]) => {
    const analysis = convertTestResultsToAnalysis(results); // 테스트 결과를 음성 분석으로 변환
    setUserVoiceAnalysis(analysis); // 분석 결과 저장
    setHasCompletedVoiceTest(true); // 테스트 완료 상태로 변경
    setShowVoiceTest(false); // 테스트 화면 숨김
    setShowVoiceResults(true); // 결과 화면 표시
    setSnackbar({ 
      open: true, 
      message: '음성 테스트가 완료되었습니다! 분석 결과를 확인해보세요.', 
      severity: 'success' 
    });
  }, []);

  // 음성 테스트 취소 핸들러 - 테스트 중단
  const handleVoiceTestCancel = useCallback(() => {
    setShowVoiceTest(false);
  }, []);

  // 음성 테스트 시작 핸들러 - 게임형 테스트 화면 표시
  const handleStartVoiceTest = useCallback(() => {
    setShowVoiceTest(true);
  }, []);

  // 음성 테스트 결과 닫기 핸들러 - 결과 화면에서 추천 화면으로 이동
  const handleCloseVoiceResults = useCallback(() => {
    setShowVoiceResults(false);
  }, []);

  // ===== 조건부 렌더링 =====
  
  // 음성 테스트 화면 표시 - 게임형 테스트 진행
  if (showVoiceTest) {
    return (
      <Box sx={{ flex: 1, backgroundColor: '#fafafa', minHeight: '100vh' }}>
        <VoiceTestGame
          onTestComplete={handleVoiceTestComplete}
          onTestCancel={handleVoiceTestCancel}
        />
      </Box>
    );
  }

  // 음성 테스트 결과 화면 표시 - 분석 결과 상세 보기
  if (showVoiceResults && userVoiceAnalysis) {
    return (
      <Box sx={{ flex: 1, backgroundColor: '#fafafa', minHeight: '100vh' }}>
        <VoiceTestResults
          analysis={userVoiceAnalysis}
          onClose={handleCloseVoiceResults}
        />
      </Box>
    );
  }

  // ===== 메인 추천 화면 =====
  
  return (
    <Box sx={{ flex: 1, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* 페이지 헤더 */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              color: '#2c2c2c',
              mb: 1
            }}
          >
            🎵 추천 곡
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: '1.1rem' }}
          >
            당신의 음역대와 취향에 맞는 곡을 추천해드립니다
          </Typography>
        </Box>

        {/* 음성 테스트 안내 - 테스트 미완료 시에만 표시 */}
        {!hasCompletedVoiceTest && (
          <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              🎤 음성 테스트가 필요합니다
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              맞춤 추천을 받으려면 먼저 음성 테스트를 완료해주세요.<br />
              간단한 게임 형태로 당신의 음역대와 음색을 분석합니다.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartVoiceTest}
              sx={{ minWidth: 200, height: 50, fontSize: '1.1rem' }}
            >
              🎮 음성 테스트 시작하기
            </Button>
          </Paper>
        )}

        {/* 필터 섹션 - 음성 테스트 완료 후에만 표시 */}
        {hasCompletedVoiceTest && (
          <RecommendationFilters
            filter={filter}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />
        )}

        {/* 메인 콘텐츠 - 음성 테스트 완료 후에만 표시 */}
        {hasCompletedVoiceTest && userVoiceAnalysis && (
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* 왼쪽: 추천 곡 목록 - 매칭 점수 순으로 정렬된 곡들 */}
            <Box sx={{ flex: '2 1 600px', minWidth: '300px' }}>
              <RecommendationList
                songs={filteredSongs}
                selectedSong={selectedSong}
                bookmarkedSongs={bookmarkedSongs}
                isLoading={isLoading}
                onSongSelect={handleSongSelect}
                onSongBookmark={handleSongBookmark}
                onSongReserve={handleSongReserve}
              />
            </Box>

            {/* 오른쪽: 음역대 매칭 그래프 - 사용자와 선택된 곡의 음역대 비교 */}
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <RangeMatchGraph
                userRange={userVoiceAnalysis.vocalRange}
                selectedSong={selectedSong}
              />
            </Box>
          </Box>
        )}

        {/* 통계 정보 - 음성 테스트 완료 후에만 표시 */}
        {hasCompletedVoiceTest && filteredSongs.length > 0 && (
          <Box sx={{ mt: 4, p: 2, backgroundColor: 'white', borderRadius: 2, boxShadow: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              📊 추천 분석 결과
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">총 추천 곡</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {filteredSongs.length}곡
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">평균 매칭 점수</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {Math.round(filteredSongs.reduce((sum, song) => sum + song.matchScore, 0) / filteredSongs.length)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">저장된 곡</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {bookmarkedSongs.length}곡
                </Typography>
              </Box>
              {userVoiceAnalysis && (
                <Box>
                  <Typography variant="body2" color="text.secondary">분석 신뢰도</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {Math.round(userVoiceAnalysis.confidence)}%
                  </Typography>
                </Box>
              )}
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
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default RecommendationsPage;
