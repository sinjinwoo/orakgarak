import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Avatar,
  Chip,
  LinearProgress,
  IconButton
} from '@mui/material';
import { 
  PlayArrow, 
  Bookmark, 
  BookmarkBorder,
  Schedule 
} from '@mui/icons-material';
import type { RecommendedSong } from '../../types/recommendation';

interface SongCardProps {
  song: RecommendedSong;
  isSelected?: boolean;
  isBookmarked?: boolean;
  onSelect?: (song: RecommendedSong) => void;
  onBookmark?: (song: RecommendedSong) => void;
  onReserve?: (song: RecommendedSong) => void;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  isSelected = false,
  isBookmarked = false,
  onSelect,
  onBookmark,
  onReserve
}) => {
  // 난이도 색상
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  // 매칭 점수 색상
  const getMatchColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
      onClick={() => onSelect?.(song)}
    >
      <CardContent sx={{ p: 3 }}>
        {/* 상단: 앨범 커버와 기본 정보 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Avatar
            src={song.coverImage}
            sx={{ 
              width: 60, 
              height: 60,
              borderRadius: 1
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
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
              color="text.secondary" 
              sx={{ 
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {song.artist}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={song.genre} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={song.difficulty === 'easy' ? '쉬움' : song.difficulty === 'medium' ? '보통' : '어려움'} 
                size="small" 
                color={getDifficultyColor(song.difficulty) as any}
              />
              <Chip 
                label={`${song.key}키`} 
                size="small" 
                variant="outlined"
              />
            </Box>
          </Box>
          
          {/* 재생 버튼 */}
          <IconButton 
            sx={{ 
              alignSelf: 'flex-start',
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            <PlayArrow />
          </IconButton>
        </Box>

        {/* 매칭 점수 */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              매칭 점수
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold',
                color: `${getMatchColor(song.matchScore)}.main`
              }}
            >
              {song.matchScore}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={song.matchScore} 
            color={getMatchColor(song.matchScore) as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* 곡 정보 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>추천 이유:</strong> {song.reason}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              ⏱️ {song.duration}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🎵 {song.tempo} BPM
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🎼 {song.vocalRange.min}Hz - {song.vocalRange.max}Hz
            </Typography>
          </Box>
        </Box>

        {/* 액션 버튼들 */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<Schedule />}
              onClick={(e) => {
                e.stopPropagation();
                onReserve?.(song);
              }}
            >
              예약
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={isBookmarked ? <Bookmark /> : <BookmarkBorder />}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.(song);
              }}
            >
              {isBookmarked ? '저장됨' : '저장'}
            </Button>
          </Box>
          
          {isSelected && (
            <Chip 
              label="선택됨" 
              color="primary" 
              size="small"
              sx={{ alignSelf: 'center' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SongCard;
