import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  MusicNote,
  TrendingUp,
  Timer,
  CheckCircle
} from '@mui/icons-material';
import type { Recording } from '../../types/recording';
import type { RecommendedSong } from '../../types/recommendation';

interface QuickRecommendationProps {
  recordings: Recording[];
  onRecommendationComplete: (songs: RecommendedSong[], selectedRecording: Recording) => void;
  onClose: () => void;
}

const QuickRecommendation: React.FC<QuickRecommendationProps> = ({
  recordings,
  onRecommendationComplete,
  onClose
}) => {
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'select' | 'preview' | 'generating' | 'complete'>('select');
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // 오디오 요소 생성 및 정리
  useEffect(() => {
    if (selectedRecording && currentStep === 'preview') {
      const audio = new Audio(selectedRecording.audioUrl);
      setAudioElement(audio);
      
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setProgress(progress);
      });
      
      return () => {
        audio.pause();
        audio.removeEventListener('ended', () => setIsPlaying(false));
        audio.removeEventListener('timeupdate', () => {});
      };
    }
  }, [selectedRecording, currentStep]);

  // 녹음본 선택 핸들러
  const handleRecordingSelect = useCallback((recording: Recording) => {
    setSelectedRecording(recording);
    setCurrentStep('preview');
  }, []);

  // 재생/일시정지 핸들러
  const handlePlayPause = useCallback(() => {
    if (!audioElement) return;
    
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  }, [audioElement, isPlaying]);

  // 빠른 추천 생성 핸들러
  const handleGenerateRecommendation = useCallback(async () => {
    if (!selectedRecording) return;
    
    setCurrentStep('generating');
    setIsGenerating(true);
    setProgress(0);
    
    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    // 실제 추천 생성 로직 (여기서는 시뮬레이션)
    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      
      // 녹음본 분석을 기반으로 추천 곡 생성
      const mockRecommendations: RecommendedSong[] = [
        {
          id: 'rec_1',
          title: 'Perfect',
          artist: 'Ed Sheeran',
          coverImage: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Perfect',
          matchScore: 95,
          reason: '선택한 녹음본의 음역대와 잘 맞는 곡입니다',
          vocalRange: { min: 80, max: 400 },
          genre: 'Pop',
          difficulty: 'Medium',
          mood: ['Romantic', 'Calm']
        },
        {
          id: 'rec_2',
          title: 'All of Me',
          artist: 'John Legend',
          coverImage: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=All+of+Me',
          matchScore: 88,
          reason: '비슷한 음색과 감정 표현이 가능한 곡입니다',
          vocalRange: { min: 90, max: 380 },
          genre: 'R&B',
          difficulty: 'Medium',
          mood: ['Romantic', 'Soulful']
        },
        {
          id: 'rec_3',
          title: 'Someone You Loved',
          artist: 'Lewis Capaldi',
          coverImage: 'https://via.placeholder.com/300x300/22c55e/ffffff?text=Someone+You+Loved',
          matchScore: 82,
          reason: '녹음본의 감정적 표현과 잘 어울리는 곡입니다',
          vocalRange: { min: 85, max: 350 },
          genre: 'Pop',
          difficulty: 'Easy',
          mood: ['Emotional', 'Melancholic']
        }
      ];
      
      setTimeout(() => {
        setCurrentStep('complete');
        setIsGenerating(false);
        onRecommendationComplete(mockRecommendations, selectedRecording);
      }, 1000);
    }, 3000);
  }, [selectedRecording, onRecommendationComplete]);

  // 다시 선택하기 핸들러
  const handleReselect = useCallback(() => {
    setSelectedRecording(null);
    setCurrentStep('select');
    setIsPlaying(false);
    setProgress(0);
    if (audioElement) {
      audioElement.pause();
    }
  }, [audioElement]);

  // 녹음본 카드 컴포넌트
  const RecordingCard: React.FC<{ recording: Recording }> = ({ recording }) => (
    <Card
      onClick={() => handleRecordingSelect(recording)}
      sx={{
        cursor: 'pointer',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: '2px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '20px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          border: '2px solid rgba(139, 92, 246, 0.6)',
          boxShadow: '0 20px 50px rgba(139, 92, 246, 0.3)',
        }
      }}
    >
      {/* 배경 패턴 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
        `,
        zIndex: 0
      }} />
      
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '50%',
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2
          }}>
            <MusicNote sx={{ color: 'white', fontSize: '1.5rem' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 0.5 }}>
              {recording.song.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#a78bfa' }}>
              {recording.song.artist}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            icon={<Timer />}
            label={`${Math.floor(recording.duration / 60)}:${(recording.duration % 60).toString().padStart(2, '0')}`}
            size="small"
            sx={{
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#a78bfa',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
          />
          {recording.analysis && (
            <Chip
              icon={<TrendingUp />}
              label={`${recording.analysis.overallScore}점`}
              size="small"
              sx={{
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}
            />
          )}
        </Box>
        
        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
          {new Date(recording.createdAt).toLocaleDateString('ko-KR')}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 헤더 */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
        p: { xs: 2, sm: 3 },
        backdropFilter: 'blur(20px)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography variant="h4" sx={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            🎵 빠른 추천 받기
          </Typography>
          <Button
            onClick={onClose}
            sx={{
              color: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              minWidth: { xs: '100px', sm: 'auto' },
              '&:hover': {
                borderColor: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
            variant="outlined"
          >
            닫기
          </Button>
        </Box>
      </Box>

      {/* 메인 콘텐츠 */}
      <Box sx={{ 
        flex: 1, 
        p: { xs: 2, sm: 3, md: 4 }, 
        overflow: 'auto' 
      }}>
        {/* 1단계: 녹음본 선택 */}
        {currentStep === 'select' && (
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', mb: 3, textAlign: 'center' }}>
              추천에 사용할 녹음본을 선택해주세요
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4, textAlign: 'center' }}>
              선택한 녹음본의 음성 특성을 분석하여 맞춤 추천을 제공합니다
            </Typography>
            
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(2, 1fr)', 
                lg: 'repeat(3, 1fr)' 
              },
              gap: { xs: 2, sm: 3 },
              maxWidth: '1200px',
              mx: 'auto',
              px: { xs: 1, sm: 0 }
            }}>
              {recordings.map((recording) => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
            </Box>
          </Box>
        )}

        {/* 2단계: 녹음본 미리듣기 */}
        {currentStep === 'preview' && selectedRecording && (
          <Box sx={{ 
            maxWidth: { xs: '100%', sm: '600px' }, 
            mx: 'auto', 
            textAlign: 'center',
            px: { xs: 2, sm: 0 }
          }}>
            <Typography variant="h5" sx={{ color: '#fff', mb: 3 }}>
              선택한 녹음본을 확인해보세요
            </Typography>
            
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '25px',
              p: 4,
              mb: 4
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 3
                }}>
                  <MusicNote sx={{ color: 'white', fontSize: '2rem' }} />
                </Box>
                <Box sx={{ flex: 1, textAlign: 'left' }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 0.5 }}>
                    {selectedRecording.song.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#a78bfa' }}>
                    {selectedRecording.song.artist}
                  </Typography>
                </Box>
              </Box>
              
              {/* 오디오 플레이어 */}
              <Box sx={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '15px',
                p: 3,
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <IconButton
                    onClick={handlePlayPause}
                    sx={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      width: 60,
                      height: 60,
                      mr: 2,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    {isPlaying ? <Pause sx={{ fontSize: '2rem' }} /> : <PlayArrow sx={{ fontSize: '2rem' }} />}
                  </IconButton>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                      {isPlaying ? '재생 중...' : '재생하려면 버튼을 클릭하세요'}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          borderRadius: 3
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleReselect}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                    '&:hover': {
                      borderColor: '#fff',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  다시 선택
                </Button>
                <Button
                  variant="contained"
                  onClick={handleGenerateRecommendation}
                  sx={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)'
                    }
                  }}
                >
                  🎯 이 녹음본으로 추천받기
                </Button>
              </Box>
            </Card>
          </Box>
        )}

        {/* 3단계: 추천 생성 중 */}
        {currentStep === 'generating' && (
          <Box sx={{ 
            maxWidth: { xs: '100%', sm: '500px' }, 
            mx: 'auto', 
            textAlign: 'center',
            px: { xs: 2, sm: 0 }
          }}>
            <Typography variant="h5" sx={{ color: '#fff', mb: 3 }}>
              맞춤 추천을 생성하고 있습니다
            </Typography>
            
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '25px',
              p: 4
            }}>
              <CircularProgress
                size={80}
                sx={{
                  color: '#8b5cf6',
                  mb: 3
                }}
              />
              
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                음성 분석 중...
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                선택한 녹음본의 음역대, 음색, 감정 표현을 분석하여<br/>
                최적의 추천 곡을 찾고 있습니다
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      borderRadius: 4
                    }
                  }}
                />
                <Typography variant="body2" sx={{ color: '#a78bfa', mt: 1 }}>
                  {Math.round(progress)}% 완료
                </Typography>
              </Box>
            </Card>
          </Box>
        )}

        {/* 4단계: 완료 */}
        {currentStep === 'complete' && (
          <Box sx={{ 
            maxWidth: { xs: '100%', sm: '500px' }, 
            mx: 'auto', 
            textAlign: 'center',
            px: { xs: 2, sm: 0 }
          }}>
            <Typography variant="h5" sx={{ color: '#fff', mb: 3 }}>
              추천이 완료되었습니다!
            </Typography>
            
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '2px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '25px',
              p: 4
            }}>
              <CheckCircle sx={{ fontSize: '4rem', color: '#22c55e', mb: 2 }} />
              
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                맞춤 추천이 준비되었습니다
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                선택한 녹음본을 기반으로 최적화된 추천 곡들을<br/>
                커버플로우에서 확인해보세요
              </Typography>
              
              <Button
                variant="contained"
                onClick={onClose}
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)'
                  }
                }}
              >
                추천 결과 보기
              </Button>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default QuickRecommendation;
