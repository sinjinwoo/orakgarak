import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Grid,
  Typography,
  Chip,
  Button,
  Stack,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  TextField
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Stop as StopIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  ArrowForward as ArrowForwardIcon,
  KeyboardBackspace as KeyboardBackspaceIcon
} from '@mui/icons-material';
import {
  Cloud as CloudIcon,
  Zap,
  DollarSign,
  Phone
} from 'lucide-react';

// API Services
import { albumService } from '../services/api/albums';
import { recordingService } from '../services/api/recordings';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import type { Album } from '../types/album';
import LPRecord from '../components/LPRecord';

// Types for VinyList
interface VinyListTrack {
  id: string;
  position: string;
  title: string;
  artist: string;
  duration: string;
  iconType: 'cloud' | 'zap' | 'dollar' | 'phone';
}

interface VinyListAlbum {
  id: string;
  title: string;
  artist: string;
  year: string;
  description: string;
  coverImage: string;
  tracks: VinyListTrack[];
}

const AlbumDetailPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [album, setAlbum] = useState<VinyListAlbum | null>(null);
  const [albumUserId, setAlbumUserId] = useState<number | null>(null);
  
  // 현재 사용자가 앨범 소유자인지 확인 (앨범 데이터가 로드된 후 확인)
  const isOwner = useMemo(() => {
    if (!user || albumUserId === null) return false;
    return user.id === albumUserId.toString();
  }, [user, albumUserId]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:07');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(1); // 두 번째 트랙이 선택된 상태
  
  // Track editing modal state
  const [editTracksOpen, setEditTracksOpen] = useState(false);
  const [availableRecordings, setAvailableRecordings] = useState<any[]>([]);
  const [selectedRecordings, setSelectedRecordings] = useState<number[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [deletingAlbum, setDeletingAlbum] = useState(false);
  const [likingAlbum, setLikingAlbum] = useState(false);

  // Load album data
  useEffect(() => {
    const loadAlbum = async () => {
      if (!albumId) return;

      try {
        setLoading(true);
        
        // Load album data
        const albumData = await albumService.getAlbum(parseInt(albumId));
        
        // 앨범 소유자 ID 저장
        setAlbumUserId(albumData.userId);
        
        // Load tracks
        let tracksData: any[] = [];
        try {
          const tracksResponse = await albumService.getAlbumTracks(parseInt(albumId));
          tracksData = tracksResponse.tracks || [];
        } catch (tracksError: any) {
          console.warn('트랙 정보 로드 실패:', tracksError);
          // 트랙이 없는 경우 빈 배열로 처리
          tracksData = [];
        }

        // Convert to VinyList format
        const iconTypes: Array<'cloud' | 'zap' | 'dollar' | 'phone'> = ['cloud', 'zap', 'dollar', 'phone'];
        const vinyListTracks: VinyListTrack[] = tracksData.map((track, index) => ({
          id: track.id.toString(),
          position: String(index + 1).padStart(2, '0'),
          title: track.recordTitle || `Track ${index + 1}`,
          artist: 'Sample',
          duration: `${Math.floor(track.durationSeconds / 60)}:${(track.durationSeconds % 60).toString().padStart(2, '0')}`,
          iconType: iconTypes[index % 4]
        }));

        const vinyListAlbum: VinyListAlbum = {
          id: albumData.id.toString(),
          title: albumData.title,
          artist: albumData.userNickname || `사용자 ${albumData.userId}`,
          year: new Date(albumData.createdAt).getFullYear().toString(),
          description: albumData.description || '이 앨범에 대한 설명이 없습니다.',
          coverImage: albumData.coverImageUrl || '/placeholder-album.jpg',
          tracks: vinyListTracks
        };

        setAlbum(vinyListAlbum);
        setError(null);
      } catch (error: any) {
        console.error('앨범 로드 실패:', error);
        setError('앨범을 불러올 수 없습니다.');
        showToast('앨범을 불러올 수 없습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAlbum();
  }, [albumId, showToast]);

  // Icon component mapping
  const getTrackIcon = (iconType: string) => {
    const iconProps = { size: 18 };
    switch (iconType) {
      case 'cloud': return <CloudIcon {...iconProps} />;
      case 'zap': return <Zap {...iconProps} />;
      case 'dollar': return <DollarSign {...iconProps} />;
      case 'phone': return <Phone {...iconProps} />;
      default: return <CloudIcon {...iconProps} />;
    }
  };

  // Track selection handlers
  const handleTrackSelect = (trackIndex: number) => {
    setCurrentTrackIndex(trackIndex);
    setIsPlaying(true);
  };

  const handlePreviousTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const handleNextTrack = () => {
    if (album && currentTrackIndex < album.tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };

  // Album action handlers
  const handleLikeToggle = async () => {
    if (!albumId) return;
    
    try {
      setLikingAlbum(true);
      // 좋아요 상태에 따라 API 호출
      // 실제 구현에서는 현재 좋아요 상태를 확인해야 함
      await albumService.likeAlbum(parseInt(albumId));
      showToast('앨범을 좋아요했습니다!', 'success');
    } catch (error: any) {
      console.error('좋아요 실패:', error);
      
      // 서버 오류에 대한 더 구체적인 처리
      if (error?.statusCode === 500) {
        showToast('서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.', 'error');
      } else if (error?.statusCode === 401) {
        showToast('로그인이 필요합니다.', 'error');
      } else if (error?.statusCode === 404) {
        showToast('앨범을 찾을 수 없습니다.', 'error');
      } else {
        showToast('좋아요 처리 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setLikingAlbum(false);
    }
  };

  const handleEditTracks = async () => {
    if (!albumId) return;
    
    try {
      setLoadingRecordings(true);
      // 사용자의 녹음 목록 가져오기
      const recordings = await recordingService.getMyRecordings();
      
      if (!recordings || recordings.length === 0) {
        showToast('사용 가능한 녹음이 없습니다. 먼저 녹음을 생성해주세요.', 'warning');
        setAvailableRecordings([]);
      } else {
        setAvailableRecordings(recordings);
        
        // 현재 앨범의 트랙 ID들을 선택된 상태로 설정
        const currentTrackIds = album?.tracks.map(track => parseInt(track.id)) || [];
        setSelectedRecordings(currentTrackIds);
      }
      
      setEditTracksOpen(true);
    } catch (error: any) {
      console.error('수록곡 편집 실패:', error);
      
      if (error?.statusCode === 401) {
        showToast('로그인이 필요합니다.', 'error');
      } else if (error?.statusCode === 500) {
        showToast('서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.', 'error');
      } else {
        showToast('수록곡 편집 중 오류가 발생했습니다.', 'error');
      }
      
      setAvailableRecordings([]);
    } finally {
      setLoadingRecordings(false);
    }
  };

  const handleSaveTracks = async () => {
    if (!albumId) return;
    
    // 선택된 녹음이 있는지 확인
    if (selectedRecordings.length === 0) {
      showToast('최소 하나의 녹음을 선택해주세요.', 'warning');
      return;
    }
    
    try {
      // 기존 트랙들을 모두 삭제 (순서대로) - 에러가 발생해도 계속 진행
      const currentTracks = album?.tracks || [];
      for (let i = currentTracks.length; i >= 1; i--) {
        try {
          await albumService.removeTrack(parseInt(albumId), i);
        } catch (error) {
          console.warn(`트랙 ${i} 삭제 실패:`, error);
          // 개별 트랙 삭제 실패는 무시하고 계속 진행
        }
      }
      
      // 선택된 녹음들을 앨범에 추가
      const tracksToAdd = selectedRecordings.map((recordId, index) => ({
        recordId,
        trackOrder: index + 1
      }));
      
      if (tracksToAdd.length > 0) {
        await albumService.addTracks(parseInt(albumId), { tracks: tracksToAdd });
      }
      
      showToast('수록곡이 업데이트되었습니다.', 'success');
      setEditTracksOpen(false);
      
      // 앨범 데이터 다시 로드
      const albumData = await albumService.getAlbum(parseInt(albumId));
      // 트랙 데이터도 다시 로드
      let updatedTracksData: any[] = [];
      try {
        const tracksResponse = await albumService.getAlbumTracks(parseInt(albumId));
        updatedTracksData = tracksResponse.tracks || [];
      } catch (error) {
        console.warn('트랙 로드 실패:', error);
      }
      
      // Album 타입을 VinyListAlbum으로 변환
      const iconTypes: Array<'cloud' | 'zap' | 'dollar' | 'phone'> = ['cloud', 'zap', 'dollar', 'phone'];
      const vinyListAlbum: VinyListAlbum = {
        id: albumData.id.toString(),
        title: albumData.title,
        artist: albumData.userNickname || `사용자 ${albumData.userId}`,
        year: albumData.createdAt ? new Date(albumData.createdAt).getFullYear().toString() : '2025',
        coverImage: albumData.coverImageUrl || '/default-album.jpg',
        description: albumData.description || '이 앨범에 대한 설명이 없습니다.',
        tracks: updatedTracksData.map((track: any, index: number) => ({
          id: track.id.toString(),
          position: String(index + 1).padStart(2, '0'),
          title: track.recordTitle || `Track ${index + 1}`,
          artist: 'Sample',
          duration: track.durationSeconds ? 
            `${Math.floor(track.durationSeconds / 60)}:${(track.durationSeconds % 60).toString().padStart(2, '0')}` :
            (track.duration || '0:00'),
          iconType: iconTypes[index % 4]
        }))
      };
      setAlbum(vinyListAlbum);
    } catch (error: any) {
      console.error('수록곡 저장 실패:', error);
      
      // 구체적인 오류 메시지 처리
      if (error?.statusCode === 404) {
        if (error?.message?.includes('녹음 파일을 찾을 수 없습니다')) {
          showToast('선택한 녹음 파일을 찾을 수 없습니다. 다른 녹음을 선택해주세요.', 'error');
        } else {
          showToast('앨범을 찾을 수 없습니다.', 'error');
        }
      } else if (error?.statusCode === 500) {
        showToast('서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.', 'error');
      } else if (error?.statusCode === 401) {
        showToast('로그인이 필요합니다.', 'error');
      } else {
        showToast('수록곡 저장 중 오류가 발생했습니다.', 'error');
      }
    }
  };

  const handleRecordingToggle = (recordingId: number) => {
    setSelectedRecordings(prev => 
      prev.includes(recordingId) 
        ? prev.filter(id => id !== recordingId)
        : [...prev, recordingId]
    );
  };

  const handleDeleteAlbum = async () => {
    if (!albumId) return;
    
    // 삭제 확인
    if (window.confirm('정말로 이 앨범을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        setDeletingAlbum(true);
        await albumService.deleteAlbum(parseInt(albumId));
        showToast('앨범이 삭제되었습니다.', 'success');
        
        // 이전 페이지로 돌아가기 (피드 페이지 또는 마이 페이지)
        const previousPage = window.history.state?.from || '/feed';
        navigate(previousPage);
      } catch (error: any) {
        console.error('앨범 삭제 실패:', error);
        
        // 구체적인 오류 메시지 처리
        if (error?.statusCode === 500) {
          showToast('서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.', 'error');
        } else if (error?.statusCode === 401) {
          showToast('로그인이 필요합니다.', 'error');
        } else if (error?.statusCode === 403) {
          showToast('이 앨범을 삭제할 권한이 없습니다.', 'error');
        } else if (error?.statusCode === 404) {
          showToast('앨범을 찾을 수 없습니다.', 'error');
        } else {
          showToast('앨범 삭제 중 오류가 발생했습니다.', 'error');
        }
      } finally {
        setDeletingAlbum(false);
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{
          background: 'linear-gradient(135deg, #E8F4FD 0%, #B3E0FF 30%, #7AC7F7 70%, #4A9EE7 100%)'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error || !album) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{
          background: 'linear-gradient(135deg, #E8F4FD 0%, #B3E0FF 30%, #7AC7F7 70%, #4A9EE7 100%)'
        }}
      >
        <Typography variant="h6" color="error" mb={2}>
          {error || '앨범을 찾을 수 없습니다.'}
        </Typography>
        <Button onClick={() => navigate('/feed')}>피드로 돌아가기</Button>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          background: `
            linear-gradient(135deg, 
              #FFFFFF 0%, 
              #FFFFFF 50%, 
              transparent 50%, 
              transparent 100%
            ),
            linear-gradient(45deg, 
              #87CEEB 0%, 
              #87CEEB 50%, 
              #F4D03F 50%, 
              #F4D03F 100%
            )
          `,
          backgroundSize: '100% 100%, 100% 100%',
          backgroundPosition: '0 0, 0 0',
          minHeight: '100vh',
          pb: 12 // Bottom player space
        }}
      >

        {/* Main Content */}
        <Container maxWidth={false} sx={{ maxWidth: '1400px', px: 5, py: 5 }}>
          {/* 뒤로 가기 버튼 */}
          <Box sx={{ mb: 3 }}>
            <Button
              startIcon={<KeyboardBackspaceIcon />}
              onClick={() => {
                const previousPage = window.history.state?.from || '/feed';
                navigate(previousPage);
              }}
              sx={{
                color: '#8A8A8A',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#000'
                }
              }}
            >
              뒤로 가기
            </Button>
          </Box>
          
          <Grid 
            container 
            sx={{ 
              gridTemplateColumns: '1fr 400px 1fr',
              gap: 5,
              display: 'grid'
            }}
          >
            {/* Left Section */}
            <Box sx={{ width: '100%', px: 2.5 }}>
              {/* Album Info Card */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 4,
                  p: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Box
                  component="img"
                  src={album.coverImage}
                  alt={album.title}
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 1,
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={600} 
                    color="#000"
                    sx={{ 
                      fontSize: '16px',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {album.title}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="#8A8A8A"
                    sx={{ fontSize: '12px' }}
                  >
                    by {album.artist}
                  </Typography>
                </Box>
                <Chip
                  label={album.year}
                  size="small"
                  sx={{
                    bgcolor: '#4A6CF7',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '11px',
                    height: 24,
                    flexShrink: 0
                  }}
                />
              </Box>

              {/* A Side Title */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: '120px',
                    fontWeight: 800,
                    color: 'rgba(0, 0, 0, 0.08)',
                    lineHeight: 0.8,
                    userSelect: 'none',
                    letterSpacing: '-2px'
                  }}
                >
                  A side
                </Typography>
              </Box>

              {/* Track List */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {album.tracks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: '#8A8A8A' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      수록곡이 없습니다
                    </Typography>
                    <Typography variant="body2">
                      이 앨범에는 아직 수록곡이 추가되지 않았습니다.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {album.tracks.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          py: 1.5,
                          px: 1,
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                            transform: 'translateX(4px)'
                          }
                        }}
                        onClick={() => handleTrackSelect(index)}
                      >
                        {/* Track Number */}
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#8A8A8A',
                            bgcolor: 'rgba(255, 255, 255, 0.6)'
                          }}
                        >
                          {track.position}
                        </Box>

                        {/* Track Icon */}
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: track.iconType === 'cloud' ? 'rgba(135, 206, 235, 0.2)' :
                                     track.iconType === 'zap' ? 'rgba(44, 62, 80, 0.2)' :
                                     track.iconType === 'dollar' ? 'rgba(243, 156, 18, 0.2)' : 'rgba(241, 196, 15, 0.2)',
                            color: track.iconType === 'cloud' ? '#87CEEB' :
                                   track.iconType === 'zap' ? '#2C3E50' :
                                   track.iconType === 'dollar' ? '#F39C12' : '#F1C40F'
                          }}
                        >
                          {getTrackIcon(track.iconType)}
                        </Box>

                        {/* Track Info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            fontWeight={500} 
                            color="#000"
                            sx={{ mb: 0.5 }}
                          >
                            {track.title}
                          </Typography>
                          <Typography variant="caption" color="#8A8A8A">
                            {track.artist}
                          </Typography>
                        </Box>

                        {/* Duration */}
                        <Typography 
                          variant="caption" 
                          color="#8A8A8A" 
                          fontWeight={500}
                        >
                          {track.duration}
                        </Typography>
                      </Box>
                    </motion.div>
                    ))}
                  </Stack>
                )}
              </motion.div>
            </Box>

            {/* Center Section */}
            <Box 
              sx={{ 
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                height: '400px'
              }}
            >
              {/* Vinyl Record */}
              <LPRecord />
            </Box>

            {/* Right Section */}
            <Box sx={{ width: '100%', px: 2.5 }}>
              {/* Album Cover */}
              <Box sx={{ mb: 4 }}>
                <Box
                  component="img"
                  src={album.coverImage}
                  alt={album.title}
                  sx={{
                    width: '100%',
                    height: 200,
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    objectFit: 'cover'
                  }}
                />
              </Box>

              {/* Album Info Header */}
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="caption" 
                  color="#8A8A8A"
                  sx={{ 
                    textTransform: 'uppercase', 
                    letterSpacing: 1,
                    fontSize: '12px',
                    display: 'block',
                    mb: 1
                  }}
                >
                  Album by {album.artist}
                </Typography>
                
                <Typography 
                  variant="h5" 
                  fontWeight={700} 
                  color="#000"
                  sx={{ 
                    fontSize: '24px',
                    lineHeight: 1.2,
                    mb: 1
                  }}
                >
                  {album.title}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="#8A8A8A"
                  sx={{ fontSize: '14px' }}
                >
                  {album.year} • {album.tracks.length} tracks
                </Typography>
              </Box>

              {/* Info Section */}
              <Box
                sx={{
                  bgcolor: '#F4D03F',
                  borderRadius: 2,
                  p: 3,
                  mb: 3
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  fontWeight={600} 
                  color="#000"
                  sx={{ 
                    mb: 2,
                    fontSize: '16px'
                  }}
                >
                  About This Album
                </Typography>
                <Typography 
                  variant="body2" 
                  color="#000"
                  sx={{ 
                    lineHeight: 1.6, 
                    fontSize: '14px'
                  }}
                >
                  {album.description}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Like Button - 모든 사용자에게 표시 */}
                <Button
                  variant="outlined"
                  onClick={() => handleLikeToggle()}
                  disabled={likingAlbum}
                  sx={{
                    borderColor: '#4A6CF7',
                    color: '#4A6CF7',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: '#4A6CF7',
                      color: 'white'
                    },
                    '&:disabled': {
                      borderColor: 'rgba(74, 108, 247, 0.3)',
                      color: 'rgba(74, 108, 247, 0.3)'
                    }
                  }}
                >
                  {likingAlbum ? '처리 중...' : '❤️ 좋아요'}
                </Button>

                {/* 소유자만 볼 수 있는 버튼들 */}
                {isOwner && (
                  <>
                    {/* Edit Tracks Button */}
                    <Button
                      variant="outlined"
                      onClick={() => handleEditTracks()}
                      sx={{
                        borderColor: '#F4D03F',
                        color: '#F4D03F',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        py: 1.5,
                        '&:hover': {
                          bgcolor: '#F4D03F',
                          color: 'white'
                        }
                      }}
                    >
                      ✏️ 수록곡 편집
                    </Button>

                    {/* Delete Album Button */}
                    <Button
                      variant="outlined"
                      onClick={() => handleDeleteAlbum()}
                      disabled={deletingAlbum}
                      sx={{
                        borderColor: '#f44336',
                        color: '#f44336',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        py: 1.5,
                        '&:hover': {
                          bgcolor: '#f44336',
                          color: 'white'
                        },
                        '&:disabled': {
                          borderColor: 'rgba(244, 67, 54, 0.3)',
                          color: 'rgba(244, 67, 54, 0.3)'
                        }
                      }}
                    >
                      {deletingAlbum ? '삭제 중...' : '🗑️ 앨범 삭제'}
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Grid>
        </Container>

        {/* Bottom Player */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          {/* Left: Previous Track Button */}
          <Box
            sx={{
              width: '20%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#4A4AEB'
            }}
          >
            <IconButton
              onClick={handlePreviousTrack}
              sx={{
                bgcolor: '#4A4AEB',
                color: 'white',
                borderRadius: 2,
                width: 60,
                height: 60,
                '&:hover': {
                  bgcolor: '#3A3ADB'
                }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Box>

          {/* Center: Player Controls */}
          <Box
            sx={{
              width: '60%',
              height: '100%',
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              gap: 2
            }}
          >
            {/* Stop Button */}
            <IconButton sx={{ color: '#666' }}>
              <StopIcon />
            </IconButton>

            {/* Play/Pause Button */}
            <IconButton 
              onClick={() => setIsPlaying(!isPlaying)}
              sx={{ color: '#4A4AEB' }}
            >
              {isPlaying ? <PauseIcon sx={{ fontSize: 28 }} /> : <PlayArrowIcon sx={{ fontSize: 28 }} />}
            </IconButton>

            {/* Current Time */}
            <Typography 
              variant="body2" 
              color="#666"
              sx={{ minWidth: 'fit-content' }}
            >
              {currentTime}
            </Typography>

            {/* Waveform Visualization */}
            <Box
              sx={{
                flex: 1,
                height: 30,
                display: 'flex',
                alignItems: 'end',
                gap: '1px',
                mx: 2
              }}
            >
              {Array.from({ length: 40 }, (_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: '2px',
                    height: `${Math.random() * 20 + 5}px`,
                    background: i < 8 ? '#4A4AEB' : '#E0E0E0', // 재생된 부분은 파란색
                    borderRadius: '1px',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Box>

            {/* Total Time */}
            <Typography 
              variant="body2" 
              color="#666"
              sx={{ minWidth: 'fit-content' }}
            >
              {album?.tracks[currentTrackIndex]?.duration || '6:28'}
            </Typography>
          </Box>

          {/* Right: Next Track Button */}
          <Box
            sx={{
              width: '20%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'white'
            }}
          >
            <IconButton
              onClick={handleNextTrack}
              sx={{
                bgcolor: 'white',
                color: '#000',
                borderRadius: 2,
                width: 60,
                height: 60,
                border: '1px solid #E0E0E0',
                '&:hover': {
                  bgcolor: '#F5F5F5'
                }
              }}
            >
              <ArrowForwardIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Track Editing Modal */}
      <Dialog 
        open={editTracksOpen} 
        onClose={() => setEditTracksOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6" fontWeight={600} component="div">
              수록곡 편집
            </Typography>
            <Typography variant="body2" color="text.secondary">
              앨범에 포함할 녹음을 선택하세요
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {loadingRecordings ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {availableRecordings.map((recording) => (
                <ListItem key={recording.id} divider>
                  <Checkbox
                    checked={selectedRecordings.includes(recording.id)}
                    onChange={() => handleRecordingToggle(recording.id)}
                    color="primary"
                  />
                  <ListItemText
                    primary={recording.title || '제목 없음'}
                    secondary={`${recording.duration || '0:00'} • ${recording.createdAt ? new Date(recording.createdAt).toLocaleDateString() : ''}`}
                  />
                </ListItem>
              ))}
              
              {availableRecordings.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    사용 가능한 녹음이 없습니다.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    먼저 녹음을 생성한 후 앨범에 추가해보세요.
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setEditTracksOpen(false)}
            color="inherit"
          >
            취소
          </Button>
          <Button 
            onClick={handleSaveTracks}
            variant="contained"
            disabled={loadingRecordings || selectedRecordings.length === 0}
          >
            저장 ({selectedRecordings.length}개 선택됨)
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default AlbumDetailPage;
