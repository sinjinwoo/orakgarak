import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Box,
  Button,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  BookmarkAdd,
  ThumbDown,
  ThumbDownOffAlt
} from '@mui/icons-material';
import { songService } from '../../services/api/songs';
import type { RecommendedSong } from '../../types/recommendation';
import '../../styles/cyberpunk-animations.css';

interface SongCardProps {
  song: RecommendedSong;
  isSelected?: boolean;
  onSelect?: (song: RecommendedSong) => void;
  onReservation?: (song: RecommendedSong) => void;
  showDislike?: boolean;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  isSelected = false,
  onSelect,
  onReservation,
  showDislike = true
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 카드 클릭 핸들러 (뒤집기)
  const handleCardClick = (e: React.MouseEvent) => {
    // 싫어요 버튼 클릭인지 확인
    const target = e.target as HTMLElement;
    if (target.closest('[data-dislike-button]')) {
      console.log('싫어요 버튼 클릭 감지 - 카드 클릭 무시');
      return;
    }
    
    e.stopPropagation();
    console.log('카드 클릭 - 뒤집기:', !isFlipped);
    setIsFlipped(!isFlipped);
    onSelect?.(song);
  };

  // 예약 버튼 핸들러
  const handleReservation = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('예약 버튼 클릭:', song.title);
    onReservation?.(song);
  };

  // 싫어요 버튼 핸들러
  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log('싫어요 토글:', song.title, song.songId);
      const response = await songService.toggleDislike(song.songId);
      
      setIsDisliked(response.isDisliked);
      console.log('싫어요 토글 결과:', response);
    } catch (error) {
      console.error('싫어요 토글 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 스낵바 닫기

  return (
    <Box 
      sx={{ 
        width: 240,  // 가로 크기 더 감소
        height: 300, // 세로 크기 더 감소
        minWidth: 240,  // 최소 크기 강제
        minHeight: 300, // 최소 크기 강제
        maxWidth: 240,  // 최대 크기 강제
        maxHeight: 300, // 최대 크기 강제
        position: 'relative',
        perspective: '1000px',
        flexShrink: 0, // 크기 축소 방지
        overflow: 'hidden' // 넘치는 내용 숨김
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
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
          '&:hover': {
            transform: isFlipped ? 'rotateY(180deg) scale(1.02)' : 'rotateY(0deg) scale(1.02)',
          }
        }}
        onClick={handleCardClick}
      >
        {/* 앞면 - 앨범 커버 */}
        <Card
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            border: isSelected 
              ? '3px solid rgba(255,0,128,0.8)' 
              : '2px solid rgba(0,255,255,0.3)',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: isSelected 
              ? '0 0 40px rgba(255,0,128,0.4)' 
              : '0 8px 32px rgba(0,0,0,0.4)',
            pointerEvents: isFlipped ? 'none' : 'auto'
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: song.imageUrl || song.coverImage 
                ? `url(${song.imageUrl || song.coverImage}) center/cover`
                : 'linear-gradient(135deg, rgba(26,26,26,0.9), rgba(13,13,13,0.9))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              position: 'relative'
            }}
          >
            {/* 앨범 커버 오버레이 */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  linear-gradient(
                    to bottom,
                    transparent 0%,
                    transparent 70%,
                    rgba(0,0,0,0.8) 95%,
                    rgba(0,0,0,0.95) 100%
                  )
                `
              }}
            />


            {/* 앞면 하단 정보 */}
            <Box sx={{ position: 'relative', zIndex: 2, p: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#fff',
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  textShadow: '0 0 10px rgba(0,255,255,0.8)',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.5
                }}
              >
                {song.title}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: "'Courier New', monospace",
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {song.artist}
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* 뒷면 - 예약 버튼과 싫어요 버튼 */}
        <Card
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `
              linear-gradient(135deg, 
                rgba(45, 20, 45, 0.95) 0%, 
                rgba(35, 15, 55, 0.98) 30%,
                rgba(25, 30, 65, 0.95) 70%,
                rgba(45, 20, 45, 0.95) 100%
              ) !important
            `,
            border: '2px solid rgba(236, 72, 153, 0.4)',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2.5,
            boxShadow: '0 0 40px rgba(236, 72, 153, 0.3)',
            pointerEvents: isFlipped ? 'auto' : 'none'
          }}
          className="hologram-panel"
        >
          {/* 싫어요 버튼 (뒷면 좌하단, 안쪽으로 배치) */}
          {showDislike && (
          <Box 
            data-dislike-button
            sx={{ 
              position: 'absolute', 
              bottom: 12, 
              left: 12, 
              zIndex: 1000,
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              console.log('싫어요 버튼 Box 클릭');
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              console.log('싫어요 버튼 Box 마우스다운');
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <IconButton
              data-dislike-button
              onClick={(e) => {
                console.log('싫어요 버튼 IconButton 클릭');
                e.preventDefault();
                e.stopPropagation();
                handleDislike(e);
              }}
              onMouseDown={(e) => {
                console.log('싫어요 버튼 IconButton 마우스다운');
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseUp={(e) => {
                console.log('싫어요 버튼 IconButton 마우스업');
                e.preventDefault();
                e.stopPropagation();
              }}
              disabled={isLoading}
              sx={{
                background: isDisliked 
                  ? 'rgba(255, 0, 0, 0.8)' 
                  : 'rgba(0, 0, 0, 0.6)',
                color: isDisliked ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                border: isDisliked 
                  ? '2px solid rgba(255, 0, 0, 0.8)' 
                  : '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                width: 32,
                height: 32,
                backdropFilter: 'blur(10px)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                '&:hover': {
                  background: isDisliked 
                    ? 'rgba(255, 0, 0, 0.9)' 
                    : 'rgba(255, 0, 0, 0.7)',
                  color: '#fff',
                  border: '2px solid rgba(255, 0, 0, 0.9)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              {isDisliked ? <ThumbDown /> : <ThumbDownOffAlt />}
            </IconButton>
          </Box>
          )}
          {/* 곡 정보 */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography 
              variant="h5" 
              className="hologram-text neon-text"
              sx={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 700,
                letterSpacing: 0.5,
                mb: 1.5,
                fontSize: '1.25rem',
                background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 10px rgba(236, 72, 153, 0.5)'
              }}
            >
              {song.title}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(6, 182, 212, 0.9)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 600,
                mb: 1,
                letterSpacing: 0.3,
                fontSize: '1rem',
                textShadow: '0 0 8px rgba(6, 182, 212, 0.4)'
              }}
            >
              {song.artist}
            </Typography>
            {song.album && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: 0.2,
                  fontSize: '0.8rem',
                  textShadow: '0 0 5px rgba(236, 72, 153, 0.3)'
                }}
              >
                {song.album}
              </Typography>
            )}
          </Box>

          {/* 예약 버튼 */}
          <Button
            onClick={handleReservation}
            startIcon={<BookmarkAdd />}
            className="cyberpunk-button"
            sx={{
              px: 6,
              py: 2,
              background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
              color: '#000',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              letterSpacing: 0.5,
              borderRadius: 2,
              fontSize: '1rem',
              minWidth: 160,
              '&:hover': {
                background: 'linear-gradient(45deg, #06b6d4, #ec4899)',
                transform: 'scale(1.1)',
                boxShadow: '0 0 40px rgba(236, 72, 153, 0.6)'
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            예약하기
          </Button>

          {/* 안내 텍스트 */}
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textAlign: 'center',
              mt: 2,
              letterSpacing: 0.3,
              lineHeight: 1.4,
              fontSize: '0.75rem',
              textShadow: '0 0 5px rgba(6, 182, 212, 0.3)'
            }}
          >
            Add to recording queue<br />
            녹음 대기열에 추가됩니다
          </Typography>
        </Card>
      </Box>

    </Box>
  );
};

export default SongCard;