import React, { useState, useEffect } from 'react';
import { Play, Upload, ArrowLeft, Music, Clock, Calendar, Star, CheckCircle, Pause } from 'lucide-react';
import { Box, Typography, Button, Card, CardContent, IconButton, CircularProgress, Alert, Chip, LinearProgress } from '@mui/material';
import { PlayArrow, Pause as MuiPause, VolumeUp, MusicNote, TrendingUp, Timer } from '@mui/icons-material';
import type { Recording } from '../../types/recording';
import type { RecommendedSong } from '../../types/recommendation';
import CoverFlow from '../recommendation/CoverFlow';

interface ExistingRecordingSelectionProps {
  onSelectRecording: (recording: Recording) => void;
  onBack: () => void;
}

// 앨범 페이지와 동일한 더미 녹음 데이터
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
    song: { title: '벚꽃 엔딩', artist: '버스커 버스커' },
    audioUrl: '',
    duration: 198, // 3:18
    createdAt: '2025-01-13T00:00:00Z',
    analysis: {
      pitchAccuracy: 90,
      tempoAccuracy: 88,
      vocalRange: { min: 220, max: 850 },
      toneAnalysis: { brightness: 80, warmth: 75, clarity: 85 },
      overallScore: 88,
      feedback: ['매우 안정적인 음정', '표현력이 뛰어납니다'],
    },
  },
  {
    id: '4',
    userId: 'user1',
    songId: 'song4',
    song: { title: '나만, 봄', artist: '볼빨간사춘기' },
    audioUrl: '',
    duration: 234, // 3:54
    createdAt: '2025-01-12T00:00:00Z',
    analysis: {
      pitchAccuracy: 82,
      tempoAccuracy: 75,
      vocalRange: { min: 190, max: 780 },
      toneAnalysis: { brightness: 75, warmth: 90, clarity: 80 },
      overallScore: 82,
      feedback: ['감성적인 표현', '음정을 조금 더 연습해보세요'],
    },
  },
  {
    id: '5',
    userId: 'user1',
    songId: 'song5',
    song: { title: '좋은 날', artist: '아이유' },
    audioUrl: '',
    duration: 267, // 4:27
    createdAt: '2025-01-11T00:00:00Z',
    analysis: {
      pitchAccuracy: 88,
      tempoAccuracy: 92,
      vocalRange: { min: 210, max: 900 },
      toneAnalysis: { brightness: 85, warmth: 70, clarity: 90 },
      overallScore: 90,
      feedback: ['완벽한 음정', '리듬감이 뛰어납니다'],
    },
  },
  {
    id: '6',
    userId: 'user1',
    songId: 'song6',
    song: { title: '밤편지', artist: '아이유' },
    audioUrl: '',
    duration: 243, // 4:03
    createdAt: '2025-01-10T00:00:00Z',
    analysis: {
      pitchAccuracy: 85,
      tempoAccuracy: 80,
      vocalRange: { min: 200, max: 820 },
      toneAnalysis: { brightness: 70, warmth: 85, clarity: 75 },
      overallScore: 83,
      feedback: ['안정적인 톤', '감정 표현이 좋습니다'],
    },
  }
];

const ExistingRecordingSelection: React.FC<ExistingRecordingSelectionProps> = ({ 
  onSelectRecording, 
  onBack 
}) => {
  const [existingRecordings, setExistingRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'select' | 'preview' | 'recommendations'>('select');
  const [recommendedSongs, setRecommendedSongs] = useState<RecommendedSong[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // 기존 녹음본 목록 가져오기
  useEffect(() => {
    const loadExistingRecordings = async () => {
      setIsLoading(true);
      try {
        // 실제로는 API에서 가져와야 함
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 앨범 페이지와 동일한 더미 데이터 사용
        setExistingRecordings(dummyRecordings);
      } catch (error) {
        console.error('녹음본 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingRecordings();
  }, []);

  const handleSelectRecording = (recording: Recording) => {
    setSelectedRecording(recording);
    setCurrentStep('preview');
  };

  const playRecording = (recording: Recording) => {
    if (isPlaying && currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
      setCurrentAudio(null);
      return;
    }

    if (recording.audioUrl) {
      const audio = new Audio(recording.audioUrl);
      audio.play();
      setCurrentAudio(audio);
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };
    } else {
      // 시뮬레이션 재생
      console.log('재생:', recording.song.title);
      setIsPlaying(true);
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    }
  };

  const handleConfirmRecording = () => {
    if (selectedRecording) {
      // 추천 노래 생성 (시뮬레이션)
      generateRecommendations(selectedRecording);
      setCurrentStep('recommendations');
    }
  };

  const generateRecommendations = (recording: Recording) => {
    // 실제로는 AI 분석을 통해 추천을 생성해야 함
    const mockRecommendations: RecommendedSong[] = [
      {
        id: '1',
        title: '좋은 날',
        artist: '아이유',
        album: 'Real',
        duration: '3:29',
        genre: '팝',
        difficulty: 'medium',
        score: 92,
        matchScore: 92,
        key: 'C',
        tempo: 120,
        vocalRange: { min: 200, max: 800 },
        reason: '비슷한 음역대와 감성적인 표현',
        audioUrl: '',
        coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
      },
      {
        id: '2',
        title: '밤편지',
        artist: '아이유',
        album: 'Palette',
        duration: '4:03',
        genre: '팝',
        difficulty: 'medium',
        score: 88,
        matchScore: 88,
        key: 'D',
        tempo: 110,
        vocalRange: { min: 180, max: 750 },
        reason: '안정적인 톤과 감정 표현',
        audioUrl: '',
        coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
      },
      {
        id: '3',
        title: '벚꽃 엔딩',
        artist: '버스커 버스커',
        album: '버스커 버스커 1집',
        duration: '3:18',
        genre: '인디',
        difficulty: 'easy',
        score: 85,
        matchScore: 85,
        key: 'G',
        tempo: 95,
        vocalRange: { min: 150, max: 600 },
        reason: '따뜻한 감성과 쉬운 멜로디',
        audioUrl: '',
        coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
      },
      {
        id: '4',
        title: '나만, 봄',
        artist: '볼빨간사춘기',
        album: 'Red Diary Page.1',
        duration: '3:54',
        genre: '인디',
        difficulty: 'medium',
        score: 87,
        matchScore: 87,
        key: 'F',
        tempo: 105,
        vocalRange: { min: 170, max: 700 },
        reason: '감성적인 표현과 비슷한 음색',
        audioUrl: '',
        coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
      },
      {
        id: '5',
        title: '사랑은 은하수 다방에서',
        artist: '10cm',
        album: '4.0',
        duration: '4:12',
        genre: '인디',
        difficulty: 'hard',
        score: 83,
        matchScore: 83,
        key: 'A',
        tempo: 130,
        vocalRange: { min: 190, max: 850 },
        reason: '복잡한 멜로디와 감정 표현',
        audioUrl: '',
        coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
      },
      {
        id: '6',
        title: '좋아',
        artist: '윤종신',
        album: '좋아',
        duration: '3:45',
        genre: '발라드',
        difficulty: 'medium',
        score: 90,
        matchScore: 90,
        key: 'E',
        tempo: 115,
        vocalRange: { min: 160, max: 720 },
        reason: '완벽한 음정과 리듬감',
        audioUrl: '',
        coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
      },
      {
        id: '7',
        title: '기다린 만큼, 더',
        artist: '볼빨간사춘기',
        album: 'Red Diary Page.2',
        duration: '3:42',
        genre: '인디',
        difficulty: 'medium',
        score: 86,
        matchScore: 86,
        key: 'B',
        tempo: 100,
        vocalRange: { min: 175, max: 680 },
        reason: '비슷한 음역대와 감성적 표현',
        audioUrl: '',
        coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
      }
    ];
    
    setRecommendedSongs(mockRecommendations);
  };

  const handleSelectSong = (song: RecommendedSong) => {
    // 선택한 노래로 녹음하러 가기
    console.log('선택한 노래:', song);
    // 실제로는 녹음 페이지로 이동
    window.location.href = '/record';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#42FDEB';
    if (score >= 80) return '#FB42D4';
    if (score >= 70) return '#FFD93D';
    return '#FF6B6B';
  };

  const getQualityText = (score: number) => {
    if (score >= 90) return '고품질';
    if (score >= 80) return '중품질';
    return '저품질';
  };

  // 단계별 렌더링
  if (currentStep === 'select') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)',
        color: '#ffffff',
        fontFamily: 'neon, monospace',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* 사이버펑크 배경 효과 */}
        <div style={{
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
          animation: 'cyberGlow 4s ease-in-out infinite alternate'
        }} />
        
        {/* 그리드 패턴 */}
        <div style={{
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
          animation: 'gridMove 20s linear infinite'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: '40px',
          height: '100%',
          overflow: 'auto'
        }}>
          {/* 헤더 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
            gap: '20px'
          }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(30,10,20,.6)',
                border: '2px solid rgba(251, 66, 212, 0.3)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FB42D4',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(251, 66, 212, 0.2)'
              }}
            >
              <ArrowLeft size={24} />
            </button>
            
            <h1 style={{
              fontSize: '36px',
              color: '#FB42D4',
              margin: 0,
              textShadow: '0 0 20px #F40AD5',
              fontFamily: 'neon, monospace'
            }}>
              기존 녹음본 선택
            </h1>
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#42FDEB'
            }}>
              <div style={{
                fontSize: '18px',
                marginBottom: '20px'
              }}>
                📡 녹음본을 불러오는 중...
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #42FDEB',
                borderTop: '3px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }} />
            </div>
          )}

          {/* 녹음본 목록 */}
          {!isLoading && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '30px',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {existingRecordings.map((recording) => (
                <div
                  key={recording.id}
                  style={{
                    background: 'rgba(30,10,20,.6)',
                    border: '2px solid rgba(66, 253, 235, 0.3)',
                    borderRadius: '20px',
                    padding: '25px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 0 20px rgba(66, 253, 235, 0.2)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.borderColor = 'rgba(66, 253, 235, 0.6)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(66, 253, 235, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(66, 253, 235, 0.3)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(66, 253, 235, 0.2)';
                  }}
                >
                  {/* 녹음본 정보 */}
                  <div style={{ marginBottom: '15px' }}>
                    <h3 style={{
                      fontSize: '20px',
                      color: '#FB42D4',
                      marginBottom: '8px',
                      fontWeight: 'bold',
                      textShadow: '0 0 10px #F40AD5'
                    }}>
                      {recording.song.title}
                    </h3>
                    
                    <div style={{
                      fontSize: '16px',
                      color: '#42FDEB',
                      marginBottom: '10px',
                      textShadow: '0 0 5px #23F6EF'
                    }}>
                      {recording.song.artist}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '15px',
                      marginBottom: '10px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#42FDEB',
                        fontSize: '14px'
                      }}>
                        <Clock size={16} />
                        <span>{formatDuration(recording.duration)}</span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#42FDEB',
                        fontSize: '14px'
                      }}>
                        <Calendar size={16} />
                        <span>{formatDate(recording.createdAt)}</span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: getScoreColor(recording.analysis?.overallScore || 0),
                        fontSize: '14px',
                        textShadow: `0 0 5px ${getScoreColor(recording.analysis?.overallScore || 0)}`
                      }}>
                        <Star size={16} />
                        <span>{getQualityText(recording.analysis?.overallScore || 0)}</span>
                      </div>
                    </div>

                    {/* 점수 표시 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '15px'
                    }}>
                      <span style={{
                        color: '#42FDEB',
                        fontSize: '14px'
                      }}>
                        점수:
                      </span>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        color: getScoreColor(recording.analysis?.overallScore || 0),
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textShadow: `0 0 5px ${getScoreColor(recording.analysis?.overallScore || 0)}`
                      }}>
                        {recording.analysis?.overallScore || 0}점
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playRecording(recording);
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #42FDEB, #23F6EF)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '25px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 0 15px rgba(66, 253, 235, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      {isPlaying ? '정지' : '재생'}
                    </button>
                    
                    <button
                      onClick={() => handleSelectRecording(recording)}
                      style={{
                        background: 'linear-gradient(45deg, #FB42D4, #F40AD5)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '25px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 0 15px rgba(251, 66, 212, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <CheckCircle size={16} />
                      선택
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CSS 애니메이션 */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            @keyframes cyberGlow {
              0% { opacity: 0.3; }
              100% { opacity: 0.7; }
            }
            
            @keyframes gridMove {
              0% { transform: translate(0, 0); }
              100% { transform: translate(50px, 50px); }
            }
          `}
        </style>
      </div>
    );
  }

  // 미리듣기 화면
  if (currentStep === 'preview' && selectedRecording) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)',
        color: '#ffffff',
        fontFamily: 'neon, monospace',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* 사이버펑크 배경 효과 */}
        <div style={{
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
          animation: 'cyberGlow 4s ease-in-out infinite alternate'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: '600px',
          padding: '40px'
        }}>
          {/* 헤더 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            gap: '20px'
          }}>
            <button
              onClick={() => setCurrentStep('select')}
              style={{
                background: 'rgba(30,10,20,.6)',
                border: '2px solid rgba(251, 66, 212, 0.3)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FB42D4',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(251, 66, 212, 0.2)'
              }}
            >
              <ArrowLeft size={24} />
            </button>
            
            <h1 style={{
              fontSize: '36px',
              color: '#FB42D4',
              margin: 0,
              textShadow: '0 0 20px #F40AD5',
              fontFamily: 'neon, monospace'
            }}>
              녹음본 미리듣기
            </h1>
          </div>

          {/* 선택된 녹음본 정보 */}
          <div style={{
            background: 'rgba(30,10,20,.6)',
            border: '2px solid rgba(66, 253, 235, 0.3)',
            borderRadius: '25px',
            padding: '40px',
            marginBottom: '40px',
            boxShadow: '0 0 30px rgba(66, 253, 235, 0.2)'
          }}>
            <h2 style={{
              fontSize: '28px',
              color: '#FB42D4',
              marginBottom: '15px',
              textShadow: '0 0 15px #F40AD5'
            }}>
              {selectedRecording.song.title}
            </h2>
            
            <p style={{
              fontSize: '20px',
              color: '#42FDEB',
              marginBottom: '30px',
              textShadow: '0 0 10px #23F6EF'
            }}>
              {selectedRecording.song.artist}
            </p>

            {/* 재생 버튼 */}
            <button
              onClick={() => playRecording(selectedRecording)}
              style={{
                background: isPlaying 
                  ? 'linear-gradient(45deg, #ff4444, #cc0000)' 
                  : 'linear-gradient(45deg, #42FDEB, #23F6EF)',
                color: isPlaying ? '#fff' : '#000',
                border: 'none',
                borderRadius: '50px',
                padding: '20px 40px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isPlaying 
                  ? '0 0 25px rgba(255, 68, 68, 0.8)' 
                  : '0 0 25px rgba(66, 253, 235, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                margin: '0 auto'
              }}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              {isPlaying ? '정지' : '재생'}
            </button>

            {/* 녹음본 정보 */}
            <div style={{
              marginTop: '30px',
              display: 'flex',
              justifyContent: 'center',
              gap: '30px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#42FDEB',
                fontSize: '16px'
              }}>
                <Clock size={20} />
                <span>{formatDuration(selectedRecording.duration)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#42FDEB',
                fontSize: '16px'
              }}>
                <Calendar size={20} />
                <span>{formatDate(selectedRecording.createdAt)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: getScoreColor(selectedRecording.analysis?.overallScore || 0),
                fontSize: '16px',
                textShadow: `0 0 5px ${getScoreColor(selectedRecording.analysis?.overallScore || 0)}`
              }}>
                <Star size={20} />
                <span>{selectedRecording.analysis?.overallScore || 0}점</span>
              </div>
            </div>
          </div>

          {/* 확인 버튼 */}
          <button
            onClick={handleConfirmRecording}
            style={{
              background: 'linear-gradient(45deg, #FB42D4, #F40AD5)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              padding: '20px 50px',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 30px rgba(251, 66, 212, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              margin: '0 auto'
            }}
          >
            <CheckCircle size={24} />
            이 녹음본으로 추천받기
          </button>
        </div>

        {/* CSS 애니메이션 */}
        <style>
          {`
            @keyframes cyberGlow {
              0% { opacity: 0.3; }
              100% { opacity: 0.7; }
            }
          `}
        </style>
      </div>
    );
  }

  // 추천 노래 목록 화면
  if (currentStep === 'recommendations') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)',
        color: '#ffffff',
        fontFamily: 'neon, monospace',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* 사이버펑크 배경 효과 */}
        <div style={{
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
          animation: 'cyberGlow 4s ease-in-out infinite alternate'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: '40px'
        }}>
          {/* 헤더 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
            gap: '20px'
          }}>
            <button
              onClick={() => setCurrentStep('preview')}
              style={{
                background: 'rgba(30,10,20,.6)',
                border: '2px solid rgba(251, 66, 212, 0.3)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FB42D4',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(251, 66, 212, 0.2)'
              }}
            >
              <ArrowLeft size={24} />
            </button>
            
            <h1 style={{
              fontSize: '36px',
              color: '#FB42D4',
              margin: 0,
              textShadow: '0 0 20px #F40AD5',
              fontFamily: 'neon, monospace'
            }}>
              맞춤 추천 노래
            </h1>
          </div>

          {/* 선택된 녹음본 정보 */}
          {selectedRecording && (
            <div style={{
              background: 'rgba(30,10,20,.6)',
              border: '2px solid rgba(66, 253, 235, 0.3)',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '40px',
              textAlign: 'center',
              boxShadow: '0 0 20px rgba(66, 253, 235, 0.2)'
            }}>
              <p style={{
                fontSize: '18px',
                color: '#42FDEB',
                margin: 0,
                textShadow: '0 0 10px #23F6EF'
              }}>
                "{selectedRecording.song.title}" 분석을 바탕으로 한 추천
              </p>
            </div>
          )}

          {/* 추천 노래 목록 - CoverFlow */}
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            height: '600px'
          }}>
            <CoverFlow
              songs={recommendedSongs}
              onSongSelect={handleSelectSong}
              isOpen={true}
            />
          </div>
        </div>

        {/* CSS 애니메이션 */}
        <style>
          {`
            @keyframes cyberGlow {
              0% { opacity: 0.3; }
              100% { opacity: 0.7; }
            }
          `}
        </style>
      </div>
    );
  }

  return null;
};

export default ExistingRecordingSelection;