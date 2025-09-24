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
  KeyboardBackspace as KeyboardBackspaceIcon,
  Favorite as FavoriteIcon,
  ChatBubbleOutline as CommentIcon,
  Send as SendIcon
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
import { socialService, type Comment } from '../services/api/social';
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
  const [currentTrackIndex, setCurrentTrackIndex] = useState(1);
  const [currentlyPlayingTrack, setCurrentlyPlayingTrack] = useState<number | null>(null);

  // Track editing modal state
  const [editTracksOpen, setEditTracksOpen] = useState(false);
  const [availableRecordings, setAvailableRecordings] = useState<any[]>([]);
  const [selectedRecordings, setSelectedRecordings] = useState<number[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [deletingAlbum, setDeletingAlbum] = useState(false);
  const [likingAlbum, setLikingAlbum] = useState(false);

  // New state for comments and likes
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyInputs, setReplyInputs] = useState<{[key: number]: string}>({});
  const [submittingReplies, setSubmittingReplies] = useState<{[key: number]: boolean}>({});
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

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
          console.log('트랙 데이터 로드 성공:', tracksData);
        } catch (tracksError: any) {
          console.warn('트랙 정보 로드 실패:', tracksError);
          tracksData = [];
        }

        // Convert to VinyList format with actual DB data
        const iconTypes: Array<'cloud' | 'zap' | 'dollar' | 'phone'> = ['cloud', 'zap', 'dollar', 'phone'];
        const vinyListTracks: VinyListTrack[] = tracksData.map((track, index) => ({
          id: track.id.toString(),
          position: String(track.trackOrder).padStart(2, '0'),
          title: track.recordTitle || `트랙 ${track.trackOrder}`,
          artist: albumData.userNickname || `사용자 ${albumData.userId}`,
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

        console.log('변환된 앨범 데이터:', vinyListAlbum);
        console.log('트랙 개수:', vinyListTracks.length);
        setAlbum(vinyListAlbum);

        // Load like count and status
        setLikeCount(albumData.likeCount || 0);

        // Load comments
        try {
          setLoadingComments(true);
          const commentsResponse = await socialService.comments.getAlbumComments(parseInt(albumId));
          setComments(commentsResponse.content || []);
        } catch (commentsError: any) {
          console.warn('댓글 로드 실패:', commentsError);
          setComments([]);
        } finally {
          setLoadingComments(false);
        }

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
    setCurrentlyPlayingTrack(trackIndex);
    setIsPlaying(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !albumId) return;

    try {
      setSubmittingComment(true);
      await socialService.comments.createAlbumComment(parseInt(albumId), newComment.trim());

      // Reload comments after successful submission
      const commentsResponse = await socialService.comments.getAlbumComments(parseInt(albumId));
      setComments(commentsResponse.content || []);
      setNewComment('');
      showToast('댓글이 등록되었습니다.', 'success');
    } catch (error: any) {
      console.error('댓글 등록 실패:', error);
      showToast('댓글 등록 중 오류가 발생했습니다.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (commentId: number) => {
    const replyContent = replyInputs[commentId];
    if (!replyContent?.trim() || !albumId) return;

    try {
      setSubmittingReplies(prev => ({ ...prev, [commentId]: true }));
      await socialService.comments.createReply(commentId, replyContent.trim());

      // Reload comments after successful reply submission
      const commentsResponse = await socialService.comments.getAlbumComments(parseInt(albumId));
      setComments(commentsResponse.content || []);
      setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
      showToast('대댓글이 등록되었습니다.', 'success');
    } catch (error: any) {
      console.error('대댓글 등록 실패:', error);
      showToast('대댓글 등록 중 오류가 발생했습니다.', 'error');
    } finally {
      setSubmittingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handlePreviousTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setCurrentlyPlayingTrack(currentTrackIndex - 1);
    }
  };

  const handleNextTrack = () => {
    if (album && currentTrackIndex < album.tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setCurrentlyPlayingTrack(currentTrackIndex + 1);
    }
  };

  // Album action handlers
  const handleLikeToggle = async () => {
    if (!albumId) return;

    try {
      setLikingAlbum(true);

      if (isLiked) {
        await socialService.albums.unlikeAlbum(parseInt(albumId));
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        showToast('좋아요를 취소했습니다.', 'success');
      } else {
        await socialService.albums.likeAlbum(parseInt(albumId));
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        showToast('앨범을 좋아요했습니다!', 'success');
      }
    } catch (error: any) {
      console.error('좋아요 실패:', error);
      showToast('좋아요 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setLikingAlbum(false);
    }
  };

  const handleEditTracks = async () => {
    if (!albumId) return;

    try {
      setLoadingRecordings(true);
      const recordings = await recordingService.getMyRecordings();

      if (!recordings || recordings.length === 0) {
        showToast('사용 가능한 녹음이 없습니다. 먼저 녹음을 생성해주세요.', 'warning');
        setAvailableRecordings([]);
      } else {
        setAvailableRecordings(recordings);
        const currentTrackIds = album?.tracks.map(track => parseInt(track.id)) || [];
        setSelectedRecordings(currentTrackIds);
      }

      setEditTracksOpen(true);
    } catch (error: any) {
      console.error('수록곡 편집 실패:', error);
      showToast('수록곡 편집 중 오류가 발생했습니다.', 'error');
      setAvailableRecordings([]);
    } finally {
      setLoadingRecordings(false);
    }
  };

  const handleSaveTracks = async () => {
    if (!albumId) return;

    if (selectedRecordings.length === 0) {
      showToast('최소 하나의 녹음을 선택해주세요.', 'warning');
      return;
    }

    try {
      const currentTracks = album?.tracks || [];
      for (let i = currentTracks.length; i >= 1; i--) {
        try {
          await albumService.removeTrack(parseInt(albumId), i);
        } catch (error) {
          console.warn(`트랙 ${i} 삭제 실패:`, error);
        }
      }

      const tracksToAdd = selectedRecordings.map((recordId, index) => ({
        recordId,
        trackOrder: index + 1
      }));

      if (tracksToAdd.length > 0) {
        await albumService.addTracks(parseInt(albumId), { tracks: tracksToAdd });
      }

      showToast('수록곡이 업데이트되었습니다.', 'success');
      setEditTracksOpen(false);

      // Reload album data
      window.location.reload();
    } catch (error: any) {
      console.error('수록곡 저장 실패:', error);
      showToast('수록곡 저장 중 오류가 발생했습니다.', 'error');
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

    if (window.confirm('정말로 이 앨범을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        setDeletingAlbum(true);
        await albumService.deleteAlbum(parseInt(albumId));
        showToast('앨범이 삭제되었습니다.', 'success');

        const previousPage = window.history.state?.from || '/feed';
        navigate(previousPage);
      } catch (error: any) {
        console.error('앨범 삭제 실패:', error);
        showToast('앨범 삭제 중 오류가 발생했습니다.', 'error');
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
          background: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)',
          color: 'white'
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
          background: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)',
          color: 'white'
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
            radial-gradient(circle at 20% 50%, rgba(251, 66, 212, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)
          `,
          minHeight: '100vh',
          pb: 12,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(251, 66, 212, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0
          }
        }}
      >
        {/* Main Content */}
        <Container maxWidth={false} sx={{ maxWidth: '1400px', px: 5, py: 5 }}>
          {/* Back Button */}
          <Box sx={{ mb: 3 }}>
            <Button
              startIcon={<KeyboardBackspaceIcon />}
              onClick={() => {
                const previousPage = window.history.state?.from || '/feed';
                navigate(previousPage);
              }}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(251, 66, 212, 0.1)',
                  color: '#fb42d4',
                  textShadow: '0 0 10px rgba(251, 66, 212, 0.5)'
                }
              }}
            >
              Back
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
            {/* Left Section - Track List */}
            <Box sx={{
              width: '100%',
              px: 2.5,
              position: 'relative',
              zIndex: 1
            }}>
              <Typography
                variant="h4"
                sx={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: 'white',
                  mb: 3,
                  textShadow: '0 0 20px rgba(251, 66, 212, 0.5)'
                }}
              >
                Tracklist
              </Typography>

              {!album.tracks || album.tracks.length === 0 ? (
                <Box sx={{
                  textAlign: 'center',
                  py: 8,
                  color: 'rgba(255, 255, 255, 0.6)',
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 2,
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    트랙이 없습니다
                  </Typography>
                  <Typography variant="body2">
                    이 앨범에는 아직 트랙이 추가되지 않았습니다.
                  </Typography>
                  {isOwner && (
                    <Typography variant="caption" sx={{ mt: 2, display: 'block', opacity: 0.7 }}>
                      우측 하단의 "Edit Tracks" 버튼을 클릭하여 트랙을 추가해보세요.
                    </Typography>
                  )}
                </Box>
              ) : (
                <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
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
                          gap: 3,
                          p: 2,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          bgcolor: currentlyPlayingTrack === index
                            ? 'rgba(251, 66, 212, 0.2)'
                            : 'rgba(0, 0, 0, 0.6)',
                          border: currentlyPlayingTrack === index
                            ? '2px solid #fb42d4'
                            : '1px solid rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(20px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          position: 'relative',
                          zIndex: 2,
                          '&:hover': {
                            bgcolor: 'rgba(251, 66, 212, 0.15)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(251, 66, 212, 0.3)'
                          }
                        }}
                        onClick={() => handleTrackSelect(index)}
                      >
                        {/* Play/Pause Button */}
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: currentlyPlayingTrack === index && isPlaying
                              ? 'rgba(251, 66, 212, 0.8)'
                              : 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            border: '2px solid rgba(251, 66, 212, 0.5)',
                            fontSize: '20px'
                          }}
                        >
                          {currentlyPlayingTrack === index && isPlaying ? (
                            <PauseIcon />
                          ) : (
                            <PlayArrowIcon />
                          )}
                        </Box>

                        {/* Track Number */}
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 600,
                            minWidth: '30px'
                          }}
                        >
                          {track.position}
                        </Typography>

                        {/* Track Info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: 'white',
                              fontWeight: 600,
                              mb: 0.5,
                              textShadow: currentlyPlayingTrack === index
                                ? '0 0 10px rgba(251, 66, 212, 0.5)'
                                : 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {track.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.6)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {track.artist}
                          </Typography>
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
                            bgcolor: track.iconType === 'cloud' ? 'rgba(251, 66, 212, 0.2)' :
                                     track.iconType === 'zap' ? 'rgba(56, 189, 248, 0.2)' :
                                     track.iconType === 'dollar' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                            color: track.iconType === 'cloud' ? '#fb42d4' :
                                   track.iconType === 'zap' ? '#38bdf8' :
                                   track.iconType === 'dollar' ? '#22c55e' : '#f97316',
                            border: '1px solid currentColor'
                          }}
                        >
                          {getTrackIcon(track.iconType)}
                        </Box>

                        {/* Duration */}
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 500,
                            minWidth: '50px',
                            textAlign: 'right'
                          }}
                        >
                          {track.duration}
                        </Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Center Section - LP Record */}
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                height: '500px',
                flexDirection: 'column'
              }}
            >
              <LPRecord />

              {/* Currently Playing Info */}
              {currentlyPlayingTrack !== null && (
                <Box
                  sx={{
                    mt: 4,
                    p: 3,
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: 3,
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(251, 66, 212, 0.3)',
                    textAlign: 'center',
                    minWidth: 280
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      mb: 1,
                      textTransform: 'uppercase',
                      letterSpacing: 1
                    }}
                  >
                    Now Playing
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      textShadow: '0 0 10px rgba(251, 66, 212, 0.5)'
                    }}
                  >
                    {album.tracks[currentlyPlayingTrack]?.title}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Right Section - Album Info */}
            <Box sx={{ width: '100%', px: 2.5 }}>
              {/* Album Cover */}
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                <Box
                  component="img"
                  src={album.coverImage}
                  alt={album.title}
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    aspectRatio: '1',
                    borderRadius: 3,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    objectFit: 'cover',
                    border: '2px solid rgba(251, 66, 212, 0.3)'
                  }}
                />
              </Box>

              {/* Album Info Header */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="caption"
                  color="rgba(255, 255, 255, 0.6)"
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    fontSize: '12px',
                    display: 'block',
                    mb: 1
                  }}
                >
                  Album by {album.artist}
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="white"
                  sx={{
                    fontSize: '28px',
                    lineHeight: 1.2,
                    mb: 2,
                    textShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
                  }}
                >
                  {album.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="rgba(255, 255, 255, 0.7)"
                  sx={{ fontSize: '16px' }}
                >
                  {album.year} • {album.tracks.length} tracks
                </Typography>
              </Box>

              {/* Album Description */}
              <Box
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 3,
                  p: 3,
                  mb: 4,
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="white"
                  sx={{
                    mb: 2,
                    fontSize: '18px',
                    textShadow: '0 0 10px rgba(56, 189, 248, 0.3)'
                  }}
                >
                  About This Album
                </Typography>
                <Typography
                  variant="body1"
                  color="rgba(255, 255, 255, 0.9)"
                  sx={{
                    lineHeight: 1.8,
                    fontSize: '14px'
                  }}
                >
                  {album.description}
                </Typography>
              </Box>

              {/* Interaction Section */}
              <Box
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 3,
                  p: 3,
                  border: '1px solid rgba(251, 66, 212, 0.3)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Like Button */}
                <Button
                  variant={isLiked ? "contained" : "outlined"}
                  onClick={handleLikeToggle}
                  disabled={likingAlbum}
                  fullWidth
                  sx={{
                    borderColor: '#fb42d4',
                    color: isLiked ? 'white' : '#fb42d4',
                    backgroundColor: isLiked ? '#fb42d4' : 'transparent',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    py: 1.5,
                    mb: 3,
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      bgcolor: isLiked ? 'rgba(251, 66, 212, 0.8)' : 'rgba(251, 66, 212, 0.1)',
                      boxShadow: '0 0 20px rgba(251, 66, 212, 0.3)'
                    }
                  }}
                >
                  <FavoriteIcon sx={{ mr: 1 }} />
                  {likingAlbum ? 'Processing...' : `${isLiked ? 'Liked' : 'Like'} (${likeCount})`}
                </Button>

                {/* Comments Section */}
                <Typography
                  variant="subtitle2"
                  color="white"
                  sx={{ mb: 2, fontWeight: 600 }}
                >
                  <CommentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Comments ({comments.length})
                </Typography>

                {/* Add Comment */}
                <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(251, 66, 212, 0.5)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fb42d4'
                        }
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  />
                  <IconButton
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                    sx={{
                      bgcolor: 'rgba(251, 66, 212, 0.2)',
                      color: '#fb42d4',
                      '&:hover': {
                        bgcolor: 'rgba(251, 66, 212, 0.3)'
                      },
                      '&:disabled': {
                        color: 'rgba(255, 255, 255, 0.3)'
                      }
                    }}
                  >
                    {submittingComment ? <CircularProgress size={20} /> : <SendIcon />}
                  </IconButton>
                </Box>

                {/* Comments List */}
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {loadingComments ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : (
                    <>
                      {comments.map((comment) => (
                        <Box key={comment.id} sx={{ mb: 2 }}>
                          {/* Main Comment */}
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: 2,
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  fontWeight: 600
                                }}
                              >
                                사용자 {comment.userId}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  ml: 1
                                }}
                              >
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.9)',
                                mb: 1
                              }}
                            >
                              {comment.content}
                            </Typography>

                            {/* Reply Input */}
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="대댓글을 입력하세요..."
                                value={replyInputs[comment.id] || ''}
                                onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddReply(comment.id);
                                  }
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                                    color: 'white',
                                    fontSize: '12px',
                                    '& fieldset': {
                                      borderColor: 'rgba(255, 255, 255, 0.2)'
                                    },
                                    '&:hover fieldset': {
                                      borderColor: 'rgba(251, 66, 212, 0.5)'
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: '#fb42d4'
                                    }
                                  },
                                  '& .MuiOutlinedInput-input::placeholder': {
                                    color: 'rgba(255, 255, 255, 0.4)',
                                    fontSize: '12px'
                                  }
                                }}
                              />
                              <IconButton
                                onClick={() => handleAddReply(comment.id)}
                                disabled={!replyInputs[comment.id]?.trim() || submittingReplies[comment.id]}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(251, 66, 212, 0.2)',
                                  color: '#fb42d4',
                                  '&:hover': {
                                    bgcolor: 'rgba(251, 66, 212, 0.3)'
                                  },
                                  '&:disabled': {
                                    color: 'rgba(255, 255, 255, 0.3)'
                                  }
                                }}
                              >
                                {submittingReplies[comment.id] ?
                                  <CircularProgress size={16} /> :
                                  <SendIcon sx={{ fontSize: 16 }} />
                                }
                              </IconButton>
                            </Box>
                          </Box>

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <Box sx={{ ml: 3, mt: 1 }}>
                              {comment.replies.map((reply) => (
                                <Box
                                  key={reply.id}
                                  sx={{
                                    p: 1.5,
                                    mb: 1,
                                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: 1,
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    borderLeft: '3px solid rgba(251, 66, 212, 0.3)'
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        fontWeight: 600,
                                        fontSize: '11px'
                                      }}
                                    >
                                      사용자 {reply.userId}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'rgba(255, 255, 255, 0.4)',
                                        ml: 1,
                                        fontSize: '10px'
                                      }}
                                    >
                                      {new Date(reply.createdAt).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: 'rgba(255, 255, 255, 0.8)',
                                      fontSize: '13px'
                                    }}
                                  >
                                    {reply.content}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      ))}

                      {comments.length === 0 && !loadingComments && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            textAlign: 'center',
                            py: 2
                          }}
                        >
                          댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                        </Typography>
                      )}
                    </>
                  )}
                </Box>

                {/* Owner Actions */}
                {isOwner && (
                  <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Stack spacing={2}>
                      <Button
                        variant="outlined"
                        onClick={() => handleEditTracks()}
                        fullWidth
                        sx={{
                          borderColor: '#38bdf8',
                          color: '#38bdf8',
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: 'rgba(56, 189, 248, 0.1)',
                            boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
                          }
                        }}
                      >
                        ✏️ Edit Tracks
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={() => handleDeleteAlbum()}
                        disabled={deletingAlbum}
                        fullWidth
                        sx={{
                          borderColor: '#ef4444',
                          color: '#ef4444',
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                          }
                        }}
                      >
                        {deletingAlbum ? 'Deleting...' : '🗑️ Delete Album'}
                      </Button>
                    </Stack>
                  </Box>
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
              bgcolor: 'rgba(251, 66, 212, 0.9)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <IconButton
              onClick={handlePreviousTrack}
              sx={{
                bgcolor: 'rgba(251, 66, 212, 0.8)',
                color: 'white',
                borderRadius: 2,
                width: 60,
                height: 60,
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(251, 66, 212, 1)',
                  boxShadow: '0 0 20px rgba(251, 66, 212, 0.5)'
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
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              gap: 2
            }}
          >
            {/* Stop Button */}
            <IconButton sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              <StopIcon />
            </IconButton>

            {/* Play/Pause Button */}
            <IconButton
              onClick={() => setIsPlaying(!isPlaying)}
              sx={{
                color: '#fb42d4',
                '&:hover': {
                  color: '#fb42d4',
                  textShadow: '0 0 10px rgba(251, 66, 212, 0.5)'
                }
              }}
            >
              {isPlaying ? <PauseIcon sx={{ fontSize: 28 }} /> : <PlayArrowIcon sx={{ fontSize: 28 }} />}
            </IconButton>

            {/* Current Time */}
            <Typography
              variant="body2"
              color="rgba(255, 255, 255, 0.6)"
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
                    background: i < 8 ? '#fb42d4' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '1px',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Box>

            {/* Total Time */}
            <Typography
              variant="body2"
              color="rgba(255, 255, 255, 0.6)"
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
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <IconButton
              onClick={handleNextTrack}
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                borderRadius: 2,
                width: 60,
                height: 60,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  borderColor: '#38bdf8',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
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