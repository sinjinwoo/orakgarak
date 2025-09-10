/**
 * 곡 검색 패널 컴포넌트
 * - 실시간 곡 검색 기능 (곡명, 아티스트, 장르로 검색)
 * - 자동 추천 기능 (타이핑하는 즉시 검색 결과 표시)
 * - 검색된 곡을 예약 큐에 추가하는 기능
 * - 중복 예약 방지 및 사용자 알림
 * - 나중에 백엔드 API와 연동하여 실제 곡 데이터를 가져올 예정
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton,
  Avatar,
  Chip,
  Paper,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { Search, MusicNote, Add } from '@mui/icons-material';
import { useReservation } from '../../hooks/useReservation';
import type { Song } from '../../types/song';

// 임시 더미 데이터 (나중에 백엔드 API로 대체 예정)
const dummySongs = [
  { id: 1, title: 'Dynamite', artist: 'BTS', genre: 'K-Pop', duration: '3:19' },
  { id: 2, title: 'Butter', artist: 'BTS', genre: 'K-Pop', duration: '2:42' },
  { id: 3, title: 'Permission to Dance', artist: 'BTS', genre: 'K-Pop', duration: '3:07' },
  { id: 4, title: 'Spring Day', artist: 'BTS', genre: 'K-Pop', duration: '4:34' },
  { id: 5, title: 'Boy With Luv', artist: 'BTS', genre: 'K-Pop', duration: '3:49' },
  { id: 6, title: 'How You Like That', artist: 'BLACKPINK', genre: 'K-Pop', duration: '3:00' },
  { id: 7, title: 'Lovesick Girls', artist: 'BLACKPINK', genre: 'K-Pop', duration: '3:12' },
  { id: 8, title: 'Kill This Love', artist: 'BLACKPINK', genre: 'K-Pop', duration: '3:11' },
  { id: 9, title: 'DDU-DU DDU-DU', artist: 'BLACKPINK', genre: 'K-Pop', duration: '3:29' },
  { id: 10, title: 'Love Scenario', artist: 'iKON', genre: 'K-Pop', duration: '3:29' },
  { id: 11, title: 'Good Boy', artist: 'GD X TAEYANG', genre: 'K-Pop', duration: '3:29' },
  { id: 12, title: 'Fantastic Baby', artist: 'BIGBANG', genre: 'K-Pop', duration: '3:50' },
  { id: 13, title: 'Bang Bang Bang', artist: 'BIGBANG', genre: 'K-Pop', duration: '3:40' },
  { id: 14, title: 'Gangnam Style', artist: 'PSY', genre: 'K-Pop', duration: '3:39' },
  { id: 15, title: 'Gentleman', artist: 'PSY', genre: 'K-Pop', duration: '3:14' },
  { id: 16, title: 'Shape of You', artist: 'Ed Sheeran', genre: 'Pop', duration: '3:53' },
  { id: 17, title: 'Perfect', artist: 'Ed Sheeran', genre: 'Pop', duration: '4:23' },
  { id: 18, title: 'Thinking Out Loud', artist: 'Ed Sheeran', genre: 'Pop', duration: '4:41' },
  { id: 19, title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Pop', duration: '3:20' },
  { id: 20, title: 'Levitating', artist: 'Dua Lipa', genre: 'Pop', duration: '3:23' }
];

const SongSearchPanel: React.FC = () => {
  // 검색 관련 상태 관리
  const [searchTerm, setSearchTerm] = useState('');                    // 검색어
  const [searchResults, setSearchResults] = useState<Song[]>([]);      // 검색 결과 목록
  const [showResults, setShowResults] = useState(false);              // 검색 결과 표시 여부
  
  // 알림 관련 상태 관리
  const [snackbarOpen, setSnackbarOpen] = useState(false);            // 스낵바 표시 여부
  const [snackbarMessage, setSnackbarMessage] = useState('');         // 스낵바 메시지
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info'>('success'); // 스낵바 타입
  
  // 예약 큐 관련 함수들 가져오기
  const { addToQueue, reservationQueue } = useReservation();

  // 검색어 변경 시 자동 추천 기능
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // 곡명, 아티스트, 장르에서 검색어 포함 여부 확인 (대소문자 무시)
    const filtered = dummySongs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(filtered.slice(0, 8)); // 최대 8개 결과만 표시
    setShowResults(true);
  }, [searchTerm]);

  // 곡 선택 시 예약 큐에 추가하는 함수
  const handleSongSelect = (song: Song) => {
    // 이미 큐에 있는 곡인지 확인 (중복 방지)
    const isAlreadyInQueue = reservationQueue.some(item => item.id === song.id);
    
    if (isAlreadyInQueue) {
      // 이미 예약된 곡인 경우 정보 알림
      setSnackbarMessage(`${song.title}은(는) 이미 예약 큐에 있습니다.`);
      setSnackbarSeverity('info');
    } else {
      // 새로 예약하는 경우 성공 알림
      addToQueue(song);
      setSnackbarMessage(`${song.title}이(가) 예약 큐에 추가되었습니다.`);
      setSnackbarSeverity('success');
    }
    
    setSnackbarOpen(true);    // 알림 표시
    setSearchTerm('');        // 검색어 초기화
    setShowResults(false);    // 검색 결과 숨기기
  };

  // Enter 키 또는 검색 버튼 클릭 시 검색 실행
  const handleSearchSubmit = () => {
    if (searchTerm.trim() === '') return;
    
    // 전체 검색 결과 필터링
    const filtered = dummySongs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(filtered);
    setShowResults(true);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* 제목 */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        곡 검색
      </Typography>
      
      {/* 검색 입력 필드 */}
      <TextField
        fullWidth
        placeholder="곡명, 아티스트, 장르로 검색하세요"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}  // 검색어 변경 시 자동 추천
        onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}  // Enter 키로 검색
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton onClick={handleSearchSubmit} size="small">
                <Search />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />

      {/* 검색 결과 드롭다운 */}
      {showResults && (
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            maxHeight: 400,
            overflow: 'auto'
          }}
        >
          {searchResults.length > 0 ? (
            <List dense>
              {searchResults.map((song) => (
                <ListItem key={song.id} disablePadding>
                  <ListItemButton 
                    onClick={() => handleSongSelect(song)}  // 곡 클릭 시 예약 큐에 추가
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      py: 1.5
                    }}
                  >
                    {/* 곡 아이콘 */}
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <MusicNote />
                    </Avatar>
                    
                    {/* 곡 정보 */}
                    <ListItemText
                      primary={song.title}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {song.artist}
                          </Typography>
                          <Chip 
                            label={song.genre} 
                            size="small" 
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {song.duration}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    {/* 추가 버튼 */}
                    <IconButton size="small" color="primary">
                      <Add />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            // 검색 결과가 없을 때
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                검색 결과가 없습니다.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* 검색 사용법 힌트 */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        💡 팁: "BTS", "K-Pop", "Dynamite" 등으로 검색해보세요
      </Typography>

      {/* 예약 결과 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SongSearchPanel;
