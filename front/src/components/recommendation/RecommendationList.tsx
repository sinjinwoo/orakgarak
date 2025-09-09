// 추천 곡 목록 컴포넌트 - 매칭 점수 순으로 정렬된 추천 곡들을 표시
import React from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import SongCard from './SongCard'; // 개별 곡 카드 컴포넌트
import type { RecommendedSong } from '../../types/recommendation';

// 추천 목록 컴포넌트 Props 타입 정의
interface RecommendationListProps {
  songs: RecommendedSong[]; // 추천 곡 목록
  selectedSong?: RecommendedSong; // 현재 선택된 곡
  bookmarkedSongs: string[]; // 북마크된 곡 ID 목록
  isLoading?: boolean; // 로딩 상태
  onSongSelect?: (song: RecommendedSong) => void; // 곡 선택 콜백
  onSongBookmark?: (song: RecommendedSong) => void; // 북마크 토글 콜백
  onSongReserve?: (song: RecommendedSong) => void; // 예약 추가 콜백
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
  // ===== 로딩 상태 처리 =====
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

  // ===== 빈 목록 상태 처리 =====
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

  // ===== 추천 곡 목록 렌더링 =====
  return (
    <Box>
      {/* 목록 헤더 - 총 곡 수 표시 */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        🎵 추천 곡 목록 ({songs.length}곡)
      </Typography>
      
      {/* 곡 카드 목록 - 매칭 점수 순으로 정렬된 곡들 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            isSelected={selectedSong?.id === song.id} // 선택된 곡 하이라이트
            isBookmarked={bookmarkedSongs.includes(song.id)} // 북마크 상태 표시
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
