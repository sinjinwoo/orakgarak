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
  TextField,
  Switch,
  FormControlLabel
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
  Send as SendIcon,
  Public as PublicIcon,
  Lock as LockIcon
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
  audioUrl: string;
}

interface VinyListAlbum {
  id: string;
  title: string;
  artist: string;
  year: string;
  description: string;
  coverImage: string;
  tracks: VinyListTrack[];
  isPublic?: boolean;
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
    const result = user.id.toString() === albumUserId.toString();
    console.log('isOwner 계산:', {
      userId: user.id,
      userIdString: user.id.toString(),
      albumUserId: albumUserId,
      albumUserIdString: albumUserId.toString(),
      result: result
    });
    return result;
  }, [user, albumUserId]);

  const [selectedTab, setSelectedTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentlyPlayingTrack, setCurrentlyPlayingTrack] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

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
        console.log('앨범 소유자 확인:', {
          albumUserId: albumData.userId,
          currentUserId: user?.id,
          userIdType: typeof user?.id,
          albumUserIdType: typeof albumData.userId,
          isEqual: user?.id === albumData.userId.toString()
        });

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
          iconType: iconTypes[index % 4],
          audioUrl: track.audioUrl // 오디오 URL 추가
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
        console.log('트랙 데이터:', vinyListTracks);
        console.log('원본 트랙 데이터:', tracksData);
        setAlbum(vinyListAlbum);

        // Load like count and status
        setLikeCount(albumData.likeCount || 0);

        // Check user's like and follow status for this album
        try {
          const promises: any[] = [
            socialService.albums.checkLikeStatus(parseInt(albumId)),
            socialService.albums.getLikeCount(parseInt(albumId)),
          ];

          if (user && albumData.userId.toString() !== user.id) { // Check if not owner
            promises.push(socialService.follow.checkFollowStatus(albumData.userId));
          }

          const [likeStatus, likeCountResult, followStatus] = await Promise.all(promises);

          if (likeStatus) setIsLiked(likeStatus.isLiked);
          if (likeCountResult) setLikeCount(likeCountResult.count);
          if (followStatus) setIsFollowing(followStatus.isFollowing);

        } catch (socialError: any) {
          console.warn('소셜 상태(좋아요/팔로우) 확인 실패:', socialError);
          // Keep existing state on failure
        }

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
      } finally {
        setLoading(false);
      }
    };

    loadAlbum();
  }, [albumId]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);

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

  // 오디오 재생 관련 함수들
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrackSelect = async (trackIndex: number) => {
    if (!album || !album.tracks[trackIndex]) return;

    const track = album.tracks[trackIndex];
    console.log('트랙 선택:', track);
    console.log('오디오 URL:', track.audioUrl);
    
    if (!track.audioUrl) {
      return;
    }

    setIsLoading(true);

    try {
      // 기존 오디오가 있으면 정지
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      // 새로운 오디오 엘리먼트 생성
      const audio = new Audio(track.audioUrl);
      
      // 오디오 이벤트 리스너 설정
      audio.addEventListener('loadedmetadata', () => {
        setDuration(formatTime(audio.duration));
        setIsLoading(false);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(formatTime(audio.currentTime));
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime('0:00');
        // 자동으로 다음 트랙 재생
        if (trackIndex < album.tracks.length - 1) {
          handleTrackSelect(trackIndex + 1);
        }
      });

      audio.addEventListener('error', () => {
        setIsLoading(false);
        setIsPlaying(false);
      });

      // 오디오 재생 시작
      await audio.play();
      
      setAudioElement(audio);
      setCurrentTrackIndex(trackIndex);
      setCurrentlyPlayingTrack(trackIndex);
      setIsPlaying(true);
      
    } catch (error) {
      console.error('오디오 재생 오류:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audioElement) return;

    try {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        await audioElement.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('재생/일시정지 오류:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!albumUserId || isOwner || !user || user.id.toString() === albumUserId.toString()) return;

    try {
      if (isFollowing) {
        await socialService.follow.unfollowUser(albumUserId);
      } else {
        await socialService.follow.followUser(albumUserId);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('팔로우/언팔로우 실패:', error);
    }
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
    } catch (error: any) {
      console.error('댓글 등록 실패:', error);
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
    } catch (error: any) {
      console.error('대댓글 등록 실패:', error);
    } finally {
      setSubmittingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handlePreviousTrack = () => {
    if (currentTrackIndex > 0) {
      handleTrackSelect(currentTrackIndex - 1);
    }
  };

  const handleNextTrack = () => {
    if (album && currentTrackIndex < album.tracks.length - 1) {
      handleTrackSelect(currentTrackIndex + 1);
    }
  };

  // Refresh like status from server
  const refreshLikeStatus = async () => {
    if (!albumId) return;

    try {
      const [likeStatus, likeCountResult] = await Promise.all([
        socialService.albums.checkLikeStatus(parseInt(albumId)),
        socialService.albums.getLikeCount(parseInt(albumId))
      ]);

      setIsLiked(likeStatus.isLiked);
      setLikeCount(likeCountResult.count);
    } catch (error) {
      console.warn('좋아요 상태 새로고침 실패:', error);
    }
  };

  // Album action handlers
  const handleLikeToggle = async () => {
    if (!albumId || likingAlbum) return;

    try {
      setLikingAlbum(true);

      // 토글 API 사용
      const result = await socialService.albums.toggleLike(parseInt(albumId));

      if (result.success) {
        // 상태 업데이트
        setIsLiked(result.isLiked);

        // 좋아요 수 새로고침
        const likeCountResult = await socialService.albums.getLikeCount(parseInt(albumId));
        if (likeCountResult.success) {
          setLikeCount(likeCountResult.count);
        }

      } else {
        throw new Error('토글 요청 실패');
      }

    } catch (error: any) {
      console.error('좋아요 처리 실패:', error);

      // 에러 발생 시에도 서버 상태와 동기화
      await refreshLikeStatus();
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
        setAvailableRecordings([]);
      } else {
        setAvailableRecordings(recordings);
        const currentTrackIds = album?.tracks.map(track => parseInt(track.id)) || [];
        setSelectedRecordings(currentTrackIds);
      }

      setEditTracksOpen(true);
    } catch (error: any) {
      console.error('수록곡 편집 실패:', error);
      setAvailableRecordings([]);
    } finally {
      setLoadingRecordings(false);
    }
  };

  const handleSaveTracks = async () => {
    if (!albumId) return;

    if (selectedRecordings.length === 0) {
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

      setEditTracksOpen(false);

      // Reload album data
      window.location.reload();
    } catch (error: any) {
      console.error('수록곡 저장 실패:', error);
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

        const previousPage = window.history.state?.from || '/feed';
        navigate(previousPage);
      } catch (error: any) {
        console.error('앨범 삭제 실패:', error);
      } finally {
        setDeletingAlbum(false);
      }
    }
  };

  const handleTogglePrivacy = async () => {
    if (!albumId || !album) return;

    try {
      setUpdatingPrivacy(true);
      const newIsPublic = !album.isPublic;
      
      // 서버 요청 성공 후에만 로컬 상태 업데이트
      await albumService.updateAlbum(parseInt(albumId), {
        title: album.title,
        description: album.description,
        isPublic: newIsPublic
      });

      // 서버 응답 성공 후 로컬 상태 업데이트
      setAlbum(prev => prev ? { ...prev, isPublic: newIsPublic } : null);
      
      showToast(
        newIsPublic ? '앨범이 공개되었습니다.' : '앨범이 비공개되었습니다.',
        'success'
      );
    } catch (error: any) {
      console.error('앨범 공개 설정 변경 실패:', error);
      showToast('앨범 공개 설정 변경에 실패했습니다.', 'error');
      // 실패 시 UI는 원래 상태 유지 (롤백 불필요)
    } finally {
      setUpdatingPrivacy(false);
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
              gridTemplateColumns: '500px 400px 1fr',
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
                </Box>
              ) : (
                <Stack spacing={1} sx={{ position: 'relative', zIndex: 1 }}>
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
                          justifyContent: 'space-between',
                          gap: 2,
                          p: 1.5,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          bgcolor: currentlyPlayingTrack === index
                            ? 'rgba(251, 66, 212, 0.2)'
                            : 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            bgcolor: 'rgba(251, 66, 212, 0.1)',
                            transform: 'translateY(-1px)',
                          }
                        }}
                        onClick={() => handleTrackSelect(index)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2}}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontWeight: 500,
                              minWidth: '20px',
                              textAlign: 'center'
                            }}
                          >
                            {track.id}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: 'white',
                              fontWeight: 500,
                            }}
                          >
                            {track.title}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 500,
                            minWidth: '40px',
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography
                    variant="caption"
                    color="rgba(255, 255, 255, 0.6)"
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                      fontSize: '12px',
                    }}
                  >
                    Album by {album.artist}
                  </Typography>
                  {!isOwner && user && albumUserId && user.id.toString() !== albumUserId.toString() && (
                    <Button
                      size="small"
                      variant={isFollowing ? "contained" : "outlined"}
                      onClick={handleFollowToggle}
                      sx={{
                        borderColor: isFollowing ? '#fb42d4' : '#38bdf8',
                        backgroundColor: isFollowing ? '#fb42d4' : 'transparent',
                        color: isFollowing ? 'white' : '#38bdf8',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: isFollowing ? '#d946c5' : 'rgba(56, 189, 248, 0.1)',
                          transform: 'translateY(-1px)',
                        }
                      }}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </Box>

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
              {album.description && (
                <Typography
                  variant="body2"
                  color="rgba(255, 255, 255, 0.8)"
                  sx={{
                    lineHeight: 1.6,
                    fontSize: '14px',
                    mb: 4,
                    fontStyle: 'italic'
                  }}
                >
                  "{album.description}"
                </Typography>
              )}

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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <IconButton
                    onClick={handleLikeToggle}
                    disabled={likingAlbum}
                    sx={{
                      color: isLiked ? '#fb42d4' : 'rgba(255, 255, 255, 0.6)',
                      '&:hover': {
                        color: '#fb42d4',
                        backgroundColor: 'rgba(251, 66, 212, 0.1)'
                      },
                      transition: 'all 0.2s ease',
                      p: 1
                    }}
                  >
                    <FavoriteIcon sx={{ fontSize: '1.2rem' }} />
                  </IconButton>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500,
                      fontSize: '14px'
                    }}
                  >
                    {likeCount} likes
                  </Typography>
                </Box>

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
                                {comment.userNickname || `사용자 ${comment.userId}`}
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
                                      {reply.userNickname || `사용자 ${reply.userId}`}
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
                      {/* 공개/비공개 토글 */}
                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={album?.isPublic || false}
                              onChange={handleTogglePrivacy}
                              disabled={updatingPrivacy}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#C147E9',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#C147E9',
                                },
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {album?.isPublic ? (
                                <PublicIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                              ) : (
                                <LockIcon sx={{ fontSize: 16, color: '#FF9800' }} />
                              )}
                              <Typography
                                variant="body2"
                                sx={{
                                  color: album?.isPublic ? '#4CAF50' : '#FF9800',
                                  fontWeight: 500
                                }}
                              >
                                {album?.isPublic ? '공개 앨범' : '비공개 앨범'}
                              </Typography>
                              {updatingPrivacy && (
                                <CircularProgress size={16} sx={{ ml: 1 }} />
                              )}
                            </Box>
                          }
                          sx={{ alignItems: 'center' }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            ml: 4,
                            display: 'block',
                            mt: 0.5
                          }}
                        >
                          {album?.isPublic 
                            ? '다른 사용자들이 이 앨범을 볼 수 있습니다'
                            : '이 앨범은 나만 볼 수 있습니다'
                          }
                        </Typography>
                      </Box>

                      <Button
                        variant="text"
                        onClick={() => handleDeleteAlbum()}
                        disabled={deletingAlbum}
                        size="small"
                        sx={{
                          color: 'rgba(239, 68, 68, 0.8)',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '13px',
                          py: 0.5,
                          px: 1,
                          borderRadius: 1,
                          alignSelf: 'flex-start',
                          '&:hover': {
                            bgcolor: 'rgba(239, 68, 68, 0.05)',
                            color: '#ef4444'
                          },
                          '&:disabled': {
                            color: 'rgba(239, 68, 68, 0.3)'
                          }
                        }}
                      >
                        {deletingAlbum ? 'Deleting...' : 'Delete Album'}
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
              onClick={handlePlayPause}
              disabled={isLoading || !audioElement}
              sx={{
                color: '#fb42d4',
                '&:hover': {
                  color: '#fb42d4',
                  textShadow: '0 0 10px rgba(251, 66, 212, 0.5)'
                },
                '&:disabled': {
                  color: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={28} sx={{ color: '#fb42d4' }} />
              ) : isPlaying ? (
                <PauseIcon sx={{ fontSize: 28 }} />
              ) : (
                <PlayArrowIcon sx={{ fontSize: 28 }} />
              )}
            </IconButton>

            {/* Current Time */}
            <Typography
              variant="body2"
              color="rgba(255, 255, 255, 0.6)"
              sx={{ minWidth: 'fit-content', fontFamily: 'monospace' }}
            >
              {currentTime} / {duration}
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