import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Fade,
  Container,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import { ArrowBack, MusicNote, Mic, CheckCircle } from '@mui/icons-material';
import { Recording } from '../../types/recording';
import { recordingService } from '../../services/api/recordings';
import CoverFlow from '../recommendation/CoverFlow';
import type { RecommendedSong } from '../../types/recommendation';
import '../../styles/cyberpunk-animations.css';

interface RecommendationResultProps {
  recording: Recording;
  uploadId: number;
  onBack: () => void;
  onGoToRecord?: () => void; // 녹음 페이지로 이동
}

export default function RecommendationResult({ 
  recording, 
  uploadId, 
  onBack,
  onGoToRecord
}: RecommendationResultProps) {
  const [selectedSong, setSelectedSong] = useState<RecommendedSong | undefined>();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // 추천 API 호출
  const { 
    data: recommendationData, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['recommendations', uploadId],
    queryFn: () => recordingService.getRecommendations(uploadId),
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10분
  });

  // 유사 음색 기반 추천 호출 (실패하더라도 전체 기능은 동작해야 하므로 retry 0)
  const { 
    data: similarVoiceData,
    isLoading: isLoadingSimilar,
    isError: isErrorSimilar,
    error: errorSimilar
  } = useQuery({
    queryKey: ['similar-voice-recommendations', uploadId],
    queryFn: () => recordingService.getSimilarVoiceRecommendations(uploadId),
    retry: 0,
    staleTime: 10 * 60 * 1000,
  });

  // 탭 상태: 'ai' | 'similar'
  const [tab, setTab] = useState<'ai' | 'similar'>('ai');
  const handleTabChange = (_: React.SyntheticEvent, value: 'ai' | 'similar') => setTab(value);

  // API 응답을 RecommendedSong 형식으로 변환 (업데이트된 스키마 반영)
  const convertToRecommendedSongs = (apiRecommendations: any[]): RecommendedSong[] => {
    return apiRecommendations.map((item, index) => {
      return {
        id: item.songId?.toString?.() ?? String(item.id),
        songId: item.songId ?? item.id, // 백엔드 songId 추가
        title: item.songName,
        artist: item.artistName,
        imageUrl: item.albumCoverUrl,
        // 이하 필드는 새 응답에 없으므로 기본/생략 처리
        album: undefined,
        spotifyUrl: undefined,
        youtubeUrl: undefined,
        duration: 0,
        popularity: undefined,
        lyrics: undefined,
        // 메타데이터 기본값 유지
        recommendationScore: 85 + (index * -5),
        matchReason: '음성 분석 기반 추천',
        genre: undefined,
        mood: undefined,
        difficulty: 'medium' as const,
        vocalRange: { min: 0, max: 0 },
        addedAt: new Date().toISOString(),
        playCount: 0,
        liked: false,
      };
    });
  };

  // 예약 핸들러
  const handleReservation = (song: RecommendedSong) => {
    console.log('🎵 곡 예약:', song.title, song.artist);
    
    // TODO: 실제 예약 API 호출
    // 임시로 로컬 스토리지에 저장
    const reservations = JSON.parse(localStorage.getItem('songReservations') || '[]');
    const newReservation = {
      id: Date.now(),
      songId: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      imageUrl: song.imageUrl,
      reservedAt: new Date().toISOString()
    };
    
    reservations.push(newReservation);
    localStorage.setItem('songReservations', JSON.stringify(reservations));
    
    setSnackbarMessage(`"${song.title}" - ${song.artist} 곡이 예약되었습니다!`);
    setSnackbarOpen(true);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <Box className="matrix-bg" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: 'center' }}>
            <Box className="cyberpunk-spinner" sx={{ mx: 'auto', mb: 3 }} />
            <Typography 
              variant="h4" 
              className="hologram-text neon-text"
              sx={{ 
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                letterSpacing: 2,
                mb: 2
              }}
            >
              ANALYZING VOICE...
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(0,255,255,0.7)',
                fontFamily: "'Courier New', monospace",
                letterSpacing: 1
              }}
            >
              Neural networks processing your vocal patterns
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <Box className="matrix-bg" sx={{ minHeight: '100vh', p: 3 }}>
        <Container maxWidth="md">
          <Button
            startIcon={<ArrowBack />}
            onClick={onBack}
            className="cyberpunk-button"
            sx={{
              mb: 4,
              px: 3,
              py: 1.5,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(0,255,255,0.3)',
              color: '#00ffff',
              borderRadius: 3,
              fontFamily: "'Courier New', monospace",
              fontWeight: 600,
              letterSpacing: 1,
              '&:hover': {
                background: 'rgba(0,255,255,0.1)',
                border: '1px solid rgba(0,255,255,0.6)',
                boxShadow: '0 0 20px rgba(0,255,255,0.3)'
              }
            }}
          >
            BACK TO SELECTION
          </Button>

          <Alert 
            severity="error" 
            sx={{ 
              background: 'rgba(255,0,0,0.1)',
              border: '1px solid rgba(255,0,0,0.3)',
              color: '#ff4444',
              '& .MuiAlert-icon': {
                color: '#ff4444'
              }
            }}
          >
            <Typography sx={{ fontFamily: "'Courier New', monospace" }}>
              RECOMMENDATION SYSTEM ERROR: {error?.message}
            </Typography>
          </Alert>
        </Container>
      </Box>
    );
  }

  const aiSongs = recommendationData ? convertToRecommendedSongs(recommendationData.recommendations) : [];
  const similarSongs = similarVoiceData ? convertToRecommendedSongs(similarVoiceData.recommendations) : [];
  const aiCount = aiSongs.length;
  const similarCount = similarSongs.length;
  const hasSimilarTab = true; // 항상 탭 노출하여 상태 확인 가능하게
  const currentSongs = tab === 'ai' ? aiSongs : similarSongs;
  const currentAnalysis = tab === 'ai' ? recommendationData?.voiceAnalysis : similarVoiceData?.voiceAnalysis;

  return (
    <Box className="matrix-bg cyberpunk-scrollbar" sx={{ minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={onBack}
            className="cyberpunk-button"
            sx={{
              mr: 3,
              px: 3,
              py: 1.5,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(0,255,255,0.3)',
              color: '#00ffff',
              borderRadius: 3,
              fontFamily: "'Courier New', monospace",
              fontWeight: 600,
              letterSpacing: 1,
              '&:hover': {
                background: 'rgba(0,255,255,0.1)',
                border: '1px solid rgba(0,255,255,0.6)',
                boxShadow: '0 0 20px rgba(0,255,255,0.3)'
              }
            }}
          >
            BACK
          </Button>

          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h3" 
              className="hologram-text neon-text"
              sx={{ 
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                letterSpacing: 3,
                mb: 1
              }}
            >
              NEURAL RECOMMENDATIONS
            </Typography>
            <Typography 
              variant="body1"
              sx={{ 
                color: 'rgba(0,255,255,0.7)',
                fontFamily: "'Courier New', monospace",
                letterSpacing: 1
              }}
            >
              Based on analysis of "{recording.title}"
            </Typography>
          </Box>
        </Box>

        {/* 탭: AI 추천 / 유사 음색 추천 (유사 음색 데이터가 있을 때만 표시) */}
        {hasSimilarTab && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #00ffff, #ff0080)', height: 3, borderRadius: 2 },
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: 42,
                  '&.Mui-selected': { color: '#00ffff' }
                }
              }}
            >
              <Tab value="ai" label={`AI 추천 (${aiCount})`} />
              <Tab 
                value="similar" 
                label={
                  isLoadingSimilar ? '비슷한 목소리 추천 (로딩중)' : 
                  (isErrorSimilar ? '비슷한 목소리 추천 (오류)' : `비슷한 목소리 추천 (${similarCount})`)
                }
              />
            </Tabs>
          </Box>
        )}

        {/* 음성 분석 결과 */}
        {currentAnalysis && (
          <Fade in timeout={800}>
            <Box 
              className="neon-card hologram-panel"
              sx={{ 
                p: 4, 
                mb: 4,
                background: `
                  linear-gradient(135deg, 
                    rgba(26,26,26,0.95) 0%, 
                    rgba(13,13,13,0.98) 50%,
                    rgba(26,26,26,0.95) 100%
                  )
                `,
                border: '2px solid rgba(0,255,255,0.4)',
                borderRadius: 4,
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 40px rgba(0,255,255,0.2)',
                textAlign: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <MusicNote sx={{ fontSize: 32, color: '#00ffff', mr: 2 }} />
                <Typography 
                  variant="h5" 
                  className="hologram-text"
                  sx={{ 
                    fontFamily: "'Courier New', monospace",
                    fontWeight: 700,
                    letterSpacing: 2
                  }}
                >
                  VOICE ANALYSIS RESULT
                </Typography>
              </Box>
              
              {/* summary */}
              <Typography 
                variant="h6"
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontFamily: "'Courier New', monospace",
                  lineHeight: 1.8,
                  letterSpacing: 1,
                  maxWidth: 800,
                  mx: 'auto',
                  mb: 2
                }}
              >
                {typeof currentAnalysis === 'string' 
                  ? currentAnalysis 
                  : currentAnalysis.summary}
              </Typography>

              {/* allowedGenres */}
              {typeof currentAnalysis !== 'string' && currentAnalysis.allowedGenres?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography 
                    variant="subtitle1"
                    sx={{
                      color: '#00ffff',
                      fontFamily: "'Courier New', monospace",
                      mb: 1
                    }}
                  >
                    어울리는 장르
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {currentAnalysis.allowedGenres.map((g: string) => (
                      <Box
                        key={g}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          border: '1px solid rgba(0,255,255,0.4)',
                          color: '#00ffff',
                          background: 'rgba(0,255,255,0.08)',
                          fontFamily: "'Courier New', monospace",
                          fontSize: 14
                        }}
                      >
                        {g}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* 추천 곡 CoverFlow */}
        {tab === 'similar' && isLoadingSimilar && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#00ffff', mb: 2 }} />
            <Typography sx={{ color: 'rgba(0,255,255,0.8)', fontFamily: "'Courier New', monospace" }}>비슷한 목소리 추천을 불러오는 중...</Typography>
          </Box>
        )}

        {tab === 'similar' && isErrorSimilar && (
          <Alert 
            severity="warning" 
            sx={{ 
              background: 'rgba(255,165,0,0.1)',
              border: '1px solid rgba(255,165,0,0.4)',
              color: '#ffb74d',
              mb: 3
            }}
          >
            비슷한 목소리 추천을 가져올 수 없습니다. (사유: {errorSimilar?.message || '알 수 없음'})
          </Alert>
        )}

        {currentSongs.length > 0 && (
          <Fade in timeout={1200}>
            <Box>
              <Typography 
                variant="h4" 
                className="hologram-text"
                sx={{ 
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  letterSpacing: 2,
                  textAlign: 'center',
                  mb: 4
                }}
              >
                {tab === 'ai' ? 'RECOMMENDED TRACKS' : 'SIMILAR VOICE PICKS'} ({currentSongs.length})
              </Typography>

              <CoverFlow
                songs={currentSongs}
                selectedSong={selectedSong}
                onSongSelect={setSelectedSong}
                showMRButton={false} // MR 재생 버튼 숨김
                onReservation={handleReservation}
              />

              {/* 녹음 페이지로 이동 버튼 */}
              {onGoToRecord && (
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                  <Button
                    onClick={onGoToRecord}
                    startIcon={<Mic />}
                    className="cyberpunk-button"
                    sx={{
                      px: 6,
                      py: 2,
                      background: 'linear-gradient(45deg, #ff0080, #00ffff)',
                      color: '#000',
                      fontFamily: "'Courier New', monospace",
                      fontWeight: 700,
                      letterSpacing: 2,
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                        transform: 'scale(1.05)',
                        boxShadow: '0 0 40px rgba(255,0,128,0.5)'
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      }
                    }}
                  >
                    노래 부르러 가기
                  </Button>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* 추천 곡이 없는 경우 */}
        {currentSongs.length === 0 && !isLoading && !isLoadingSimilar && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography 
              variant="h5" 
              className="hologram-text"
              sx={{ 
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                letterSpacing: 2,
                mb: 2
              }}
            >
              {tab === 'ai' ? 'NO RECOMMENDATIONS FOUND' : (isErrorSimilar ? 'SIMILAR VOICE UNAVAILABLE' : 'NO SIMILAR VOICE PICKS')}
            </Typography>
            <Typography 
              variant="body1"
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                fontFamily: "'Courier New', monospace",
                letterSpacing: 1
              }}
            >
              {tab === 'ai' 
                ? 'Unable to generate recommendations from this recording'
                : (isErrorSimilar ? 'The similar-voice service responded with an error' : 'No frequently sung tracks found among similar voices')}
            </Typography>
          </Box>
        )}
      </Container>

      {/* 예약 성공 알림 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success"
          icon={<CheckCircle />}
          sx={{
            background: 'rgba(0,255,0,0.2)',
            color: '#00ff00',
            border: '1px solid rgba(0,255,0,0.4)',
            fontFamily: "'Courier New', monospace",
            '& .MuiAlert-icon': {
              color: '#00ff00'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
