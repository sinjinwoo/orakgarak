import React from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import SongCard from './SongCard';
import type { RecommendedSong } from '../../types/recommendation';

interface RecommendationListProps {
  songs: RecommendedSong[];
  selectedSong?: RecommendedSong;
  bookmarkedSongs: string[];
  isLoading?: boolean;
  onSongSelect?: (song: RecommendedSong) => void;
  onSongBookmark?: (song: RecommendedSong) => void;
  onSongReserve?: (song: RecommendedSong) => void;
}

const RecommendationList: React.FC<RecommendationListProps> = ({
  songs,
  selectedSong,
  bookmarkedSongs,
  isLoading = false,
  onSongSelect,
  onSongBookmark,
  onSongReserve
}) => {
  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          추천 곡을 분석하고 있습니다...
        </Typography>
      </Paper>
    );
  }

  if (songs.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          추천 곡이 없습니다
        </Typography>
        <Typography variant="body2" color="text.secondary">
          필터 조건을 조정해보세요
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        🎵 추천 곡 목록 ({songs.length}곡)
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            isSelected={selectedSong?.id === song.id}
            isBookmarked={bookmarkedSongs.includes(song.id)}
            onSelect={onSongSelect}
            onBookmark={onSongBookmark}
            onReserve={onSongReserve}
          />
        ))}
      </Box>
    </Box>
  );
};

export default RecommendationList;
