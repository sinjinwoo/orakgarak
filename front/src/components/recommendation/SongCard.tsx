import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Box,
  Button
} from '@mui/material';
import { 
  BookmarkAdd
} from '@mui/icons-material';
import type { RecommendedSong } from '../../types/recommendation';
import '../../styles/cyberpunk-animations.css';

interface SongCardProps {
  song: RecommendedSong;
  isSelected?: boolean;
  onSelect?: (song: RecommendedSong) => void;
  onReservation?: (song: RecommendedSong) => void;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  isSelected = false,
  onSelect,
  onReservation
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // 카드 클릭 핸들러 (뒤집기)
  const handleCardClick = (e: React.MouseEvent) => {
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

  return (
    <Box 
      sx={{ 
        width: 320,  // 가로 크기 증가 (통일)
        height: 380, // 세로 크기 유지 (통일)
        position: 'relative',
        perspective: '1000px'
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

        {/* 뒷면 - 예약 버튼만 */}
        <Card
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `
              linear-gradient(135deg, 
                rgba(26,26,26,0.98) 0%, 
                rgba(13,13,13,0.99) 50%,
                rgba(26,26,26,0.98) 100%
              )
            `,
            border: '2px solid rgba(0,255,255,0.4)',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            boxShadow: '0 0 40px rgba(0,255,255,0.2)'
          }}
          className="matrix-bg hologram-panel"
        >
          {/* 곡 정보 */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
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
              {song.title}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'rgba(0,255,255,0.8)',
                fontFamily: "'Courier New', monospace",
                fontWeight: 600,
                mb: 1,
                letterSpacing: 1
              }}
            >
              {song.artist}
            </Typography>
            {song.album && (
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: 0.5
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
              px: 8,
              py: 3,
              background: 'linear-gradient(45deg, #00ffff, #ff0080)',
              color: '#000',
              fontFamily: "'Courier New', monospace",
              fontWeight: 700,
              letterSpacing: 2,
              borderRadius: 3,
              fontSize: '1.2rem',
              minWidth: 200,
              '&:hover': {
                background: 'linear-gradient(45deg, #ff0080, #00ffff)',
                transform: 'scale(1.1)',
                boxShadow: '0 0 40px rgba(0,255,255,0.6)'
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
              color: 'rgba(255,255,255,0.5)',
              fontFamily: "'Courier New', monospace",
              textAlign: 'center',
              mt: 3,
              letterSpacing: 1,
              lineHeight: 1.6
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