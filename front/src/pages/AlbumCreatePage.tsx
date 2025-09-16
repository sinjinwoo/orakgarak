import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAlbumStore } from '../stores/albumStore';
import type { Recording } from '../types/recording';
import AlbumCreateStepper from '../components/album/AlbumCreateStepper';
import RecordingSelectionStep from '../components/album/RecordingSelectionStep';
import CoverSelectionStep from '../components/album/CoverSelectionStep';
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
    resetAlbum,
    createAlbum,
    getAlbumData,
  } = useAlbumStore();

  const [recordings] = useState<Recording[]>(dummyRecordings);

  // 단계별 컴포넌트 렌더링
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'recordings':
        return (
          <RecordingSelectionStep
            recordings={recordings}
            selectedRecordings={selectedRecordings}
            onToggleRecording={(recordingId) => {
              if (selectedRecordings.includes(recordingId)) {
                removeRecording(recordingId);
              } else {
                addRecording(recordingId);
              }
            }}
            onSelectAll={() => {
              setSelectedRecordings(recordings.map(r => r.id));
            }}
            onNext={nextStep}
          />
        );
      case 'cover':
        return (
          <CoverSelectionStep
            selectedRecordings={selectedRecordings}
            onNext={nextStep}
            onPrev={prevStep}
            onCoverSelect={setCoverImage}
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
            onNext={nextStep}
            onPrev={prevStep}
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
            onPrev={prevStep}
          />
        );
      default:
        return null;
    }
  };

  const handlePublish = async () => {
    try {
      // 앨범 생성
      const albumData = getAlbumData();
      const albumId = createAlbum(albumData, recordings);
      
      console.log('Album created successfully:', albumId);
      
      // 성공 시 마이페이지의 내 앨범 섹션으로 이동
      navigate('/me/albums');
      
      // 스토어 초기화
      resetAlbum();
    } catch (error) {
      console.error('Failed to publish album:', error);
    }
  };

  // 컴포넌트 언마운트 시 초기화
  useEffect(() => {
    return () => {
      // 페이지를 벗어날 때만 초기화 (미리보기에서 뒤로가기 등은 제외)
      if (currentStep === 'completed') {
        resetAlbum();
      }
    };
  }, [currentStep, resetAlbum]);

  const getCurrentStepNumber = () => {
    const steps = ['recordings', 'cover', 'metadata', 'preview'];
    return steps.indexOf(currentStep);
  };

  return (
    <Box sx={{
      flex: 1,
      background: `
        radial-gradient(circle at 20% 20%, rgba(255, 107, 157, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(196, 71, 233, 0.4) 0%, transparent 50%),
        radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
        linear-gradient(135deg, #0A0A0A 0%, #1A0A1A 25%, #2A0A2A 50%, #1A0A1A 75%, #0A0A0A 100%)
      `,
      minHeight: '100vh',
      pt: { xs: 12, sm: 14 },
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 30% 30%, rgba(255, 107, 157, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 70% 70%, rgba(196, 71, 233, 0.2) 0%, transparent 40%),
          radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 30%)
        `,
        pointerEvents: 'none',
        zIndex: 1
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 80% 20%, rgba(255, 107, 157, 0.1) 0%, transparent 30%),
          radial-gradient(circle at 20% 80%, rgba(196, 71, 233, 0.15) 0%, transparent 30%)
        `,
        pointerEvents: 'none',
        zIndex: 1
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 3,
            background: 'transparent',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 0 20px rgba(196, 71, 233, 0.3)'
          }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 700, 
                mb: 1,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg,rgb(249, 248, 248) 0%, #C147E9 50%, #8B5CF6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(210, 151, 228, 0.5)'
              }}>
                🎵 앨범 생성 페이지가 업데이트되었습니다!
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.1rem'
              }}>
                새로운 4단계 앨범 생성 프로세스를 확인해보세요.
              </Typography>
            </Box>
            
            <AlbumCreateStepper currentStep={getCurrentStepNumber()} />
          </Paper>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {renderCurrentStep()}
        </motion.div>
      </Container>
    </Box>
  );
};

export default AlbumCreatePage;
