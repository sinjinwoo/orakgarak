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
  Snackbar
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

  // API 응답을 RecommendedSong 형식으로 변환
  const convertToRecommendedSongs = (apiRecommendations: any[]): RecommendedSong[] => {
    return apiRecommendations.map((item, index) => {
      // 안전한 lyrics JSON 파싱
      let parsedLyrics = null;
      if (item.lyrics && typeof item.lyrics === 'string') {
        try {
          parsedLyrics = JSON.parse(item.lyrics);
        } catch (error) {
          console.warn(`곡 ${item.songName}의 가사 파싱 실패:`, error);
          parsedLyrics = null;
        }
      }

      return {
        id: item.songId.toString(),
        title: item.songName,
        artist: item.artistName,
        album: item.albumName,
        imageUrl: item.albumCoverUrl,
        spotifyUrl: `https://open.spotify.com/track/${item.spotifyTrackId}`,
        youtubeUrl: item.musicUrl,
        duration: Math.floor(item.durationMs / 1000), // ms를 초로 변환
        popularity: item.popularity,
        lyrics: parsedLyrics,
      
        // 추천 관련 메타데이터
        recommendationScore: 85 + (index * -5), // 임시 점수 (첫 번째가 가장 높음)
        matchReason: '음성 분석 기반 추천',
        genre: '발라드', // API에서 제공되지 않으므로 기본값
        mood: ['감성적', '서정적'],
        difficulty: 'medium' as const,
        vocalRange: { min: 100, max: 400 },
        
        // 메타데이터
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

  const recommendedSongs = recommendationData ? convertToRecommendedSongs(recommendationData.recommendations) : [];

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

        {/* 음성 분석 결과 */}
        {recommendationData?.voiceAnalysis && (
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
              
              <Typography 
                variant="h6"
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontFamily: "'Courier New', monospace",
                  lineHeight: 1.8,
                  letterSpacing: 1,
                  maxWidth: 800,
                  mx: 'auto'
                }}
              >
                {recommendationData.voiceAnalysis}
              </Typography>
            </Box>
          </Fade>
        )}

        {/* 추천 곡 CoverFlow */}
        {recommendedSongs.length > 0 && (
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
                RECOMMENDED TRACKS ({recommendedSongs.length})
              </Typography>

              <CoverFlow
                songs={recommendedSongs}
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
        {recommendedSongs.length === 0 && !isLoading && (
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
              NO RECOMMENDATIONS FOUND
            </Typography>
            <Typography 
              variant="body1"
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                fontFamily: "'Courier New', monospace",
                letterSpacing: 1
              }}
            >
              Unable to generate recommendations from this recording
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
