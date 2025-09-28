import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Fade,
  Container,
  Snackbar,
} from '@mui/material';
import { ArrowBack, Mic, CheckCircle, Refresh } from '@mui/icons-material';
import { Recording } from '../../types/recording';
import { recordingService } from '../../services/api/recordings';
import CoverFlow from '../recommendation/CoverFlow';
import type { RecommendedSong } from '../../types/recommendation';
import '../../styles/cyberpunk-animations.css';
import { useReservation } from '../../hooks/useReservation';
import type { Song } from '../../types/song';

interface RecommendationResultProps {
  recording: Recording;
  uploadId: number;
  onBack: () => void;
  onGoToRecord?: () => void; // 녹음 페이지로 이동
  onRerecommend?: () => void; // 다시 추천 받기
}

export default function RecommendationResult({ 
  recording, 
  uploadId, 
  onBack,
  onGoToRecord,
  onRerecommend
}: RecommendationResultProps) {
  const [selectedSong, setSelectedSong] = useState<RecommendedSong | undefined>();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const queryClient = useQueryClient();
  
  // 예약 큐 훅은 컴포넌트 최상단에서 호출
  const { addToQueue } = useReservation();

  // 추천 API 호출
  const { 
    data: recommendationData, 
    isLoading, 
    isError, 
    error,
    refetch: refetchRecommendations
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
    error: errorSimilar,
    refetch: refetchSimilarRecommendations
  } = useQuery({
    queryKey: ['similar-voice-recommendations', uploadId],
    queryFn: () => recordingService.getSimilarVoiceRecommendations(uploadId),
    retry: 0,
    staleTime: 10 * 60 * 1000,
  });

  // 탭 상태: 'ai' | 'similar'
  const [tab, setTab] = useState<'ai' | 'similar'>('ai');

  // 예약된 노래 보기 상태
  const [showReservedSongs, setShowReservedSongs] = useState(false);
  const [reservedSongs, setReservedSongs] = useState<RecommendedSong[]>([]);
  
  // 예약된 노래 보기 토글 함수
  const handleShowReservedSongs = () => {
    setShowReservedSongs(!showReservedSongs);
  };

  // 내부에서 처리하는 다시 추천 받기 함수
  const handleInternalRerecommend = async () => {
    console.log("🔄 RecommendationResult 내부에서 다시 추천 받기 처리");
    
    // 선택된 노래 초기화
    setSelectedSong(undefined);
    
    // 캐시 무효화 및 새로운 데이터 가져오기
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['recommendations', uploadId]
      }),
      queryClient.invalidateQueries({
        queryKey: ['similar-voice-recommendations', uploadId]
      })
    ]);
    
    // 강제로 새로운 데이터 가져오기
    await Promise.all([
      refetchRecommendations(),
      refetchSimilarRecommendations()
    ]);
    
    console.log("✅ 새로운 추천 데이터 가져오기 완료");
    
    // 외부 함수도 호출
    onRerecommend?.();
  };

  // API 응답을 RecommendedSong 형식으로 변환 (업데이트된 스키마 반영)
  const convertToRecommendedSongs = (apiRecommendations: unknown[]): RecommendedSong[] => {
    return apiRecommendations.map((item, index) => {
      const song = item as Record<string, unknown>;
      return {
        id: song.songId?.toString?.() ?? String(song.id),
        songId: (song.songId as number) ?? (song.id as number), // 백엔드 songId 추가
        title: song.songName as string,
        artist: song.artistName as string,
        imageUrl: song.albumCoverUrl as string,
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

    try {
      const mapped: Song = {
        id: Number(song.songId ?? song.id),
        songId: Number(song.songId ?? song.id),
        songName: song.title,
        artistName: song.artist,
        albumName: song.album ?? '',
        musicUrl: '',
        lyrics: typeof song.lyrics === 'string' ? song.lyrics : JSON.stringify(song.lyrics ?? ''),
        albumCoverUrl: song.imageUrl ?? song.coverImage ?? '',
        spotifyTrackId: '',
        durationMs: song.duration ? song.duration * 1000 : undefined,
        popularity: song.popularity,
        status: 'AVAILABLE',
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        youtubeId: undefined,
      };

      addToQueue(mapped);
      
      // 예약된 노래를 reservedSongs에 추가 (중복 방지)
      setReservedSongs(prev => {
        const exists = prev.some(reservedSong => reservedSong.id === song.id);
        if (!exists) {
          return [...prev, song];
        }
        return prev;
      });
      
      setSnackbarMessage(`"${song.title}" - ${song.artist} 곡이 예약되었습니다!`);
      setSnackbarOpen(true);
    } catch (e) {
      console.error('예약 추가 실패:', e);
      setSnackbarMessage('예약 처리 중 오류가 발생했습니다.');
      setSnackbarOpen(true);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pt: 12,
        background: `
          radial-gradient(circle at 30% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 1) 100%)
        `,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* 메인 로딩 컨테이너 */}
        <Box sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          zIndex: 2
        }}>
          {/* 브랜드 로고 영역 */}
          <Box sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            {/* 브랜드명 */}
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: "'Courier New', monospace",
                fontWeight: 900,
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                animation: 'textGlow 2s ease-in-out infinite',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                '@keyframes textGlow': {
                  '0%, 100%': {
                    filter: 'brightness(1)',
                    textShadow: '0 0 20px rgba(236, 72, 153, 0.5)'
                  },
                  '50%': {
                    filter: 'brightness(1.2)',
                    textShadow: '0 0 30px rgba(236, 72, 153, 0.8), 0 0 50px rgba(6, 182, 212, 0.4)'
                  }
                }
              }}
            >
              ORAKGARAK
            </Typography>
            
            {/* 슬로건 */}
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontStyle: 'italic',
                animation: 'fadeInOut 3s ease-in-out infinite',
                '@keyframes fadeInOut': {
                  '0%, 100%': { opacity: 0.6 },
                  '50%': { opacity: 1 }
                }
              }}
            >
              "당신의 목소리로 찾는 완벽한 노래"
            </Typography>
          </Box>

          {/* 진행 상태 영역 */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            width: '100%',
            maxWidth: '400px'
          }}>
            {/* 로딩 메시지 */}
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#06b6d4',
                fontWeight: 600,
                textAlign: 'center',
                animation: 'messageSlide 2s ease-in-out infinite',
                '@keyframes messageSlide': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-2px)' }
                }
              }}
            >
              당신을 위한 완벽한 노래를 찾고 있어요...
            </Typography>
            
            {/* 프로그레스 바 */}
            <Box sx={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <Box sx={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #ec4899, #06b6d4)',
                borderRadius: '3px',
                animation: 'progressLoad 3s ease-in-out infinite',
                '@keyframes progressLoad': {
                  '0%': { transform: 'translateX(-100%)' },
                  '50%': { transform: 'translateX(0%)' },
                  '100%': { transform: 'translateX(100%)' }
                }
              }} />
            </Box>
            
            {/* 단계별 메시지 */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem'
                }}
              >
                🎤 목소리 분석 중...
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem'
                }}
              >
                음성 분석 및 추천 시스템 실행 중...
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem'
                }}
              >
                🎵 완벽한 노래 매칭 중...
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <Box className="matrix-bg" sx={{ minHeight: '100vh', pt: 12, p: 3 }}>
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
  const hasSimilarTab = true; // 항상 탭 노출하여 상태 확인 가능하게
  const currentSongs = tab === 'ai' ? aiSongs : similarSongs;
  const currentAnalysis = tab === 'ai' ? recommendationData?.voiceAnalysis : similarVoiceData?.voiceAnalysis;

  return (
    <Box sx={{ 
      minHeight: '120vh',
      background: `
        radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.25) 0%, transparent 60%),
        radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
        radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 80%),
        radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 70%),
        linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)
      `,
      color: '#fff',
      position: 'relative'
    }}>
      <Container maxWidth="xl" sx={{ pt: 12, pb: 8 }}>
        {/* 헤더 */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={onBack}
            sx={{
              px: 3,
              py: 1.5,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              borderRadius: 2,
              fontWeight: 500,
              fontSize: '0.9rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            뒤로가기
          </Button>

          <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1, px: 2 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
            >
              추천 결과
            </Typography>
            <Typography 
              variant="body1"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 400,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              "{recording.title}" 분석 기반
            </Typography>
          </Box>

          {/* 다시 추천 받기 버튼 */}
          {onRerecommend && (
            <Button
              startIcon={<Refresh />}
              onClick={handleInternalRerecommend}
              sx={{
                px: 3,
                py: 1.5,
                background: 'linear-gradient(45deg, rgba(0, 255, 150, 0.2), rgba(0, 180, 255, 0.2))',
                border: '1px solid rgba(0, 255, 150, 0.4)',
                color: '#00ff96',
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.9rem',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(0, 255, 150, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, rgba(0, 255, 150, 0.3), rgba(0, 180, 255, 0.3))',
                  border: '1px solid rgba(0, 255, 150, 0.6)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 0 30px rgba(0, 255, 150, 0.4)',
                }
              }}
            >
              다시 추천 받기
            </Button>
          )}
        </Box>

        {/* 탭: AI 추천 / 유사 음색 추천 */}
        {hasSimilarTab && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={() => setTab('ai')}
                variant={tab === 'ai' ? 'contained' : 'outlined'}
              sx={{
                  px: 3,
                  py: 1,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  ...(tab === 'ai' ? {
                    background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #06b6d4, #ec4899)',
                    }
                  } : {
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      color: '#fff'
                    }
                  })
                }}
              >
                추천 곡
              </Button>
              <Button
                onClick={() => setTab('similar')}
                disabled={!similarSongs || similarSongs.length === 0}
                variant={tab === 'similar' ? 'contained' : 'outlined'}
                    sx={{
                  px: 3,
                  py: 1,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                          borderRadius: 2,
                  textTransform: 'none',
                  ...(tab === 'similar' ? {
                    background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #06b6d4, #ec4899)',
                    }
                  } : {
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      color: '#fff'
                    },
                    '&.Mui-disabled': {
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255,255,255,0.3)',
                      opacity: 0.5
                    }
                  })
                }}
              >
                {isLoadingSimilar ? '비슷한 목소리 (로딩중)' : 
                 (isErrorSimilar ? '비슷한 목소리 (오류)' : '비슷한 목소리')}
              </Button>
            </Box>
          </Box>
        )}

        {/* 좌우 2분할 레이아웃 */}
        <Box sx={{ 
          display: 'flex', 
          gap: 4,
          flexDirection: { xs: 'column', lg: 'row' },
          minHeight: 'calc(100vh - 100px)',
          paddingBottom: 6
        }}>
          
          {/* 좌측: CoverFlow (3분의 2) */}
          <Box sx={{ 
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
        {/* 추천 곡 CoverFlow */}
        {tab === 'similar' && isLoadingSimilar && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#06b6d4', mb: 2 }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>비슷한 목소리 추천을 불러오는 중...</Typography>
          </Box>
        )}

        {tab === 'similar' && isErrorSimilar && (
          <Alert 
            severity="warning" 
            sx={{ 
              background: 'rgba(255,165,0,0.1)',
              border: '1px solid rgba(255,165,0,0.4)',
              color: '#ffb74d',
                  mb: 2,
                  fontSize: '0.85rem'
            }}
          >
            비슷한 목소리 추천을 가져올 수 없습니다. (사유: {errorSimilar?.message || '알 수 없음'})
          </Alert>
        )}

        {currentSongs.length > 0 && (
          <Fade in timeout={1200}>
            <Box>
                  {/* 추천 곡 섹션 제목 */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography 
                      variant="h5" 
                sx={{ 
                  fontWeight: 700,
                        mb: 1,
                        background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '1.2rem', sm: '1.4rem' }
                      }}
                    >
                      {tab === 'ai' ? '추천 곡' : '비슷한 목소리 추천'}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 400,
                        fontSize: { xs: '0.8rem', sm: '0.9rem' }
                      }}
                    >
                      {tab === 'ai' 
                        ? '당신에게 어울리는 곡들입니다' 
                        : '비슷한 음색을 가진 사람들이 많이 부르는 곡들입니다'
                      }
              </Typography>
                  </Box>

              <CoverFlow
                songs={currentSongs}
                selectedSong={selectedSong}
                onSongSelect={setSelectedSong}
                showMRButton={false} // MR 재생 버튼 숨김
                onReservation={handleReservation}
                showDislike={tab === 'ai'}
              />

                </Box>
              </Fade>
            )}

            {/* 추천 곡이 없는 경우 */}
            {currentSongs.length === 0 && !isLoading && !isLoadingSimilar && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    mb: 2,
                    color: '#fff',
                    fontSize: { xs: '1rem', sm: '1.1rem' }
                  }}
                >
                  {tab === 'ai' ? '추천 곡을 찾을 수 없습니다' : (isErrorSimilar ? '비슷한 목소리 서비스 오류' : '비슷한 목소리 추천이 없습니다')}
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' }
                  }}
                >
                  {tab === 'ai' 
                    ? '이 녹음본으로는 추천을 생성할 수 없습니다'
                    : (isErrorSimilar ? '비슷한 목소리 서비스에서 오류가 발생했습니다' : '비슷한 음색의 사람들이 자주 부르는 곡이 없습니다')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* 우측: 음성 분석 결과 (3분의 1) */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}>
            {currentAnalysis && (
              <Fade in timeout={800}>
                <Box 
                  sx={{ 
                    width: '100%',
                    height: '400px',
                    position: 'relative',
                    perspective: '1000px',
                    mt: 3
                  }}
                >
                  {/* 3D 카드 컨테이너 */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: showReservedSongs ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      cursor: 'pointer'
                    }}
                    onClick={handleShowReservedSongs}
                  >
                    {/* 앞면 - 음성 분석 결과 */}
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        p: 3, 
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 3,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                        textAlign: 'left',
                        overflow: 'hidden'
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontSize: { xs: '1.1rem', sm: '1.2rem' },
                          mb: 2
                        }}
                      >
                        음성 분석 결과
                      </Typography>
                    
                    {/* 분석 요약 */}
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1.5,
                        mb: 2,
                        fontWeight: 400,
                        fontSize: { xs: '0.85rem', sm: '0.9rem' }
                      }}
                    >
                      {typeof currentAnalysis === 'string' 
                        ? currentAnalysis 
                        : currentAnalysis.summary}
                    </Typography>

                    {/* 어울리는 장르 */}
                    {typeof currentAnalysis !== 'string' && currentAnalysis.allowedGenres?.length > 0 && (
                      <Box>
                        <Typography 
                          variant="subtitle2"
                          sx={{
                            color: '#fff',
                            mb: 1.5,
                            fontWeight: 600,
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                          }}
                        >
                          어울리는 장르
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {currentAnalysis.allowedGenres.map((g: string) => (
                            <Box
                              key={g}
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1.5,
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: '#fff',
                                background: 'rgba(255, 255, 255, 0.1)',
                                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                fontWeight: 500,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  background: 'rgba(255, 255, 255, 0.2)',
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              {g}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {/* 예약 곡 보기 버튼 */}
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowReservedSongs();
                        }}
                        variant="outlined"
                        sx={{
                          px: 3,
                          py: 1,
                          border: '1px solid rgba(236, 72, 153, 0.5)',
                          color: '#ec4899',
                          borderRadius: 2,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            border: '1px solid rgba(236, 72, 153, 0.8)',
                            background: 'rgba(236, 72, 153, 0.1)',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        {showReservedSongs ? '음성 분석 보기' : '예약 곡 보기'}
                      </Button>
                    </Box>
                    </Box>

                    {/* 뒷면 - 예약된 노래 목록 */}
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        p: 3, 
                        background: `
                          linear-gradient(135deg, 
                            rgba(45, 20, 45, 0.95) 0%, 
                            rgba(35, 15, 55, 0.98) 30%,
                            rgba(25, 30, 65, 0.95) 70%,
                            rgba(45, 20, 45, 0.95) 100%
                          ) !important
                        `,
                        border: '2px solid rgba(236, 72, 153, 0.4)',
                        borderRadius: 3,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 0 40px rgba(236, 72, 153, 0.3)',
                        textAlign: 'left',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontSize: { xs: '1.1rem', sm: '1.2rem' },
                          mb: 3,
                          textAlign: 'center'
                        }}
                      >
                        예약된 노래 목록
                      </Typography>
                      
                      {reservedSongs.length === 0 ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          height: '100%',
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.9rem'
                        }}>
                          아직 예약된 노래가 없습니다
                        </Box>
                      ) : (
                        <Box sx={{ 
                          flex: 1,
                          overflow: 'auto',
                          '&::-webkit-scrollbar': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(236, 72, 153, 0.5)',
                            borderRadius: '3px',
                          },
                        }}>
                          {reservedSongs.map((song) => (
                            <Box
                              key={song.id}
                              sx={{
                                p: 2,
                                mb: 1,
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              <Typography 
                                variant="subtitle1"
                                sx={{ 
                                  color: '#fff',
                                  fontWeight: 600,
                                  fontSize: '0.95rem',
                                  mb: 0.5,
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
                                  color: 'rgba(6, 182, 212, 0.9)',
                                  fontSize: '0.85rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {song.artist}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Fade>
            )}


            {/* 노래 부르러 가기 버튼 */}
              {onGoToRecord && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button
                    onClick={onGoToRecord}
                    startIcon={<Mic />}
                    sx={{
                    px: 4,
                    py: 1.5,
                    background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: 2,
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
                    transition: 'all 0.3s ease',
                      '&:hover': {
                      background: 'linear-gradient(45deg, #06b6d4, #ec4899)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)'
                      },
                      '&:active': {
                      transform: 'translateY(0px)',
                      }
                    }}
                  >
                    노래 부르러 가기
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
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
