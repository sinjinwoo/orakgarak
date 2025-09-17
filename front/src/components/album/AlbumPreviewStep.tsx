import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  IconButton,
} from '@mui/material';
import {
  PlayArrow,
  ExpandMore,
  Send,
} from '@mui/icons-material';
import ImmersivePlaybackModal from './ImmersivePlaybackModal';

interface AlbumPreviewStepProps {
  title: string;
  description: string;
  coverImage?: string;
  isPublic: boolean;
  selectedRecordings: string[];
  onPublish: () => void;
  onPrev: () => void;
}

const AlbumPreviewStep: React.FC<AlbumPreviewStepProps> = ({
  title,
  description,
  coverImage,
  isPublic,
  selectedRecordings,
  onPublish,
  onPrev,
}) => {
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isImmersiveModalOpen, setIsImmersiveModalOpen] = useState(false);
  // 더미 데이터
  const dummyTracks = [
    { id: '1', title: '좋아', artist: '윤종신', score: 85, duration: '3:45' },
    { id: '2', title: '사랑은 은하수 다방에서', artist: '10cm', score: 78, duration: '4:12' },
    { id: '3', title: '밤편지', artist: '아이유', score: 92, duration: '3:23' },
    { id: '4', title: 'Spring Day', artist: 'BTS', score: 81, duration: '4:06' },
    { id: '5', title: '너를 만나', artist: '폴킴', score: 88, duration: '3:58' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#2196f3';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  const totalDuration = '20분'; // 더미 데이터

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 48, color: '#C147E9' }}>👁️</Typography>
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1, color: '#FFFFFF' }}>
          새 앨범 만들기
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          녹음본으로 나만의 앨범을 만들어보세요
        </Typography>
      </Box>

      {/* 앨범 미리보기 */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: 'transparent',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 1, 
          display: 'flex', 
          alignItems: 'center',
          color: '#FFFFFF'
        }}>
          ◎ 앨범 미리보기
        </Typography>
        <Typography variant="body2" sx={{ 
          mb: 3,
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          발행하기 전에 앨범이 어떻게 보일지 확인해보세요
        </Typography>

        {/* 사용법 안내 */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
            💡 클릭: 곡 넘기기 | 더블클릭: 앨범 닫기
          </Typography>
        </Box>

        {/* 3D 앨범 미리보기 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          mb: 4,
          perspective: '1000px'
        }}>
          <Box sx={{
            position: 'relative',
            width: '400px',
            height: '450px',
            transformStyle: 'preserve-3d',
            // 성능 최적화: will-change 속성 추가 및 transition 간소화
            willChange: 'transform',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isAlbumOpen 
              ? 'translate(40px, 0) rotateX(35deg) rotateY(0deg) rotateZ(35deg) scale(0.7)' 
              : 'translate(0, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(0.7)',
            cursor: 'pointer'
          }}
          onClick={() => {
            if (isAlbumOpen) {
              // 앨범이 열려있으면 다음 곡으로 넘기기
              setCurrentTrackIndex((prev) => (prev + 1) % dummyTracks.length);
            } else {
              // 앨범이 닫혀있으면 열기
              setIsAlbumOpen(true);
            }
          }}
          onDoubleClick={() => {
            // 더블클릭으로 앨범 닫기
            setIsAlbumOpen(false);
            setCurrentTrackIndex(0);
          }}>
            {/* 앨범 표지 */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transformStyle: 'preserve-3d',
              // 성능 최적화: transition 간소화
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isAlbumOpen ? 'rotateY(-180deg)' : 'rotateY(0deg)'
            }}>
              {/* 앨범 앞면 */}
              <Box sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                borderRadius: '8px',
                background: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg, #0095a3 0%, #007e8a 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }} />
              
              {/* 앨범 뒷면 */}
              <Box sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                borderRadius: '8px',
                background: '#e1e1e1',
                transform: 'rotateY(180deg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 3
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333', textAlign: 'center' }}>
                  {dummyTracks[currentTrackIndex]?.title || '곡 제목'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: '#666', textAlign: 'center' }}>
                  {dummyTracks[currentTrackIndex]?.artist || '아티스트'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: '#666', textAlign: 'center' }}>
                  {dummyTracks[currentTrackIndex]?.duration || '0:00'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: getScoreColor(dummyTracks[currentTrackIndex]?.score || 0), textAlign: 'center', fontWeight: 600 }}>
                  {dummyTracks[currentTrackIndex]?.score || 0}점
                </Typography>
                <Typography variant="caption" sx={{ color: '#999', textAlign: 'center' }}>
                  {currentTrackIndex + 1} / {dummyTracks.length}
                </Typography>
              </Box>
            </Box>

            {/* 앨범 옆면 - 성능 최적화를 위해 transform 간소화 */}
            <Box sx={{
              position: 'absolute',
              left: '-30px',
              top: 0,
              width: '30px',
              height: '100%',
              background: '#007e8a',
              transformOrigin: '100% 100%',
              transform: 'rotateY(-90deg)',
              borderRadius: '6px 0 0 6px'
            }} />

            {/* 앨범 하단 - 성능 최적화를 위해 transform 간소화 */}
            <Box sx={{
              position: 'absolute',
              bottom: '-30px',
              left: 0,
              width: '100%',
              height: '30px',
              background: '#d4d3d3',
              transformOrigin: '100% 100%',
              transform: 'rotateX(90deg)',
              borderRadius: '0 0 6px 6px'
            }} />

            {/* 앨범 그림자 - 성능 최적화를 위해 box-shadow 대신 pseudo-element 사용 고려 */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'transparent',
              transform: 'translateZ(-30px)',
              boxShadow: '15px 15px 0px 0px #aaa',
              zIndex: 1,
              borderRadius: '8px'
            }} />
          </Box>
          
          {/* 앨범 정보 */}
          <Box sx={{
            mt: 3,
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#FFFFFF' }}>
              {title || '앨범 제목'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
              ♫ {selectedRecordings.length}곡 • {totalDuration}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
              {description || '앨범 설명이 없습니다'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              sx={{
                background: 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)',
                color: 'white',
                borderRadius: 2,
                px: 2,
                py: 1,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: '0 4px 15px rgba(196, 71, 233, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)',
                  boxShadow: '0 6px 20px rgba(196, 71, 233, 0.6)',
                  transform: 'translateY(-2px)'
                },
              }}
            >
              ▷ 전체 재생
            </Button>
          </Box>
        </Box>

        {/* 수록곡 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', color: '#FFFFFF' }}>
            ♪ 수록곡
          </Typography>
          <List sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            {dummyTracks.map((track, index) => (
              <ListItem key={track.id} sx={{ py: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ minWidth: 20, color: 'rgba(255, 255, 255, 0.6)' }}>
                      {index + 1}.
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
                      {track.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      - {track.artist}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: getScoreColor(track.score),
                        fontWeight: 600,
                      }}
                    >
                      {track.score}점
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {track.duration}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small" sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(196, 71, 233, 0.1)',
                  }
                }}>
                  <PlayArrow sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 앨범 설명 */}
        {description && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.8)' }}>
              {description}
            </Typography>
          </Box>
        )}


        {/* 액션 버튼들 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ExpandMore />}
            onClick={() => setIsImmersiveModalOpen(true)}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#C147E9',
                backgroundColor: 'rgba(196, 71, 233, 0.1)',
                color: '#FFFFFF',
              },
            }}
          >
            몰입 재생
          </Button>
        </Box>
      </Paper>

      {/* 발행 준비 완료 */}
      <Paper sx={{ 
        p: 3, 
        textAlign: 'center', 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#FFFFFF' }}>
          앨범 발행 준비 완료!
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
          {isPublic ? '공개 앨범으로 발행하면 다른 사용자들이 볼 수 있습니다.' : '비공개 앨범으로 발행하면 나만 볼 수 있습니다.'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={onPublish}
          sx={{
            background: 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)',
            color: 'white',
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: '0 4px 15px rgba(196, 71, 233, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)',
              boxShadow: '0 6px 20px rgba(196, 71, 233, 0.6)',
              transform: 'translateY(-2px)'
            },
          }}
        >
          앨범 발행하기
        </Button>
      </Paper>

      {/* 네비게이션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onPrev}
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.3)',
            color: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 2,
            px: 3,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#C147E9',
              backgroundColor: 'rgba(196, 71, 233, 0.1)',
              color: '#FFFFFF',
            },
          }}
        >
          ← 이전 단계
        </Button>
      </Box>

      {/* 몰입재생 모달 */}
      <ImmersivePlaybackModal
        open={isImmersiveModalOpen}
        onClose={() => setIsImmersiveModalOpen(false)}
        albumData={{
          id: 'preview-album',
          title: title || '앨범 제목',
          tracks: dummyTracks.map(track => ({
            id: track.id,
            title: track.title,
            audioUrl: '', // 실제 오디오 URL이 있다면 여기에 추가
            duration: track.duration
          })),
          coverImage: coverImage || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
          description: description || '앨범 설명이 없습니다'
        }}
      />
    </Box>
  );
};

export default AlbumPreviewStep;
