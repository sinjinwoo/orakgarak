import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAlbumStore } from '../stores/albumStore';
import { useAlbum } from '../hooks/useAlbum';
import { albumService } from '../services/api/albums';
import { useAuth } from '../hooks/useAuth';
import { recordingService } from '../services/api/recordings';
import { useSocial } from '../hooks/useSocial';
import ImmersivePlaybackModal from '../components/album/ImmersivePlaybackModal';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  CardMedia,
  List,
  ListItem,
  Chip,
  IconButton,
  TextField,
  Paper,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  PlayArrow,
  ExpandMore,
  Favorite,
  Send,
  ArrowBack,
  Delete,
  Edit,
} from '@mui/icons-material';

// 앨범 상세 데이터 타입
interface AlbumDetailData {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  userId: string;
  user: {
    nickname: string;
    avatar?: string;
  };
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    score: number;
    duration: string;
    audioUrl?: string;
  }>;
  isPublic: boolean;
  createdAt: string;
  tags: string[];
  likeCount: number;
  playCount: number;
  commentCount: number;
}

// 댓글 데이터 타입
interface Comment {
  id: string;
  userId: string;
  user: {
    nickname: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  replies?: Comment[];
}

const AlbumDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { albumId } = useParams<{ albumId: string }>();
  const { user } = useAuth();
  const { createComment, likeAlbum, unlikeAlbum } = useSocial();
  // const { getAlbumById } = useAlbumStore(); // 사용하지 않음
  const { data: albumData, isLoading, error } = useAlbum(parseInt(albumId || '0'));
  
  // 이전 페이지 추적을 위한 상태
  const [previousPage, setPreviousPage] = useState<string>('/feed');
  const [album, setAlbum] = useState<AlbumDetailData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editTracksDialogOpen, setEditTracksDialogOpen] = useState(false);
  const [immersivePlaybackOpen, setImmersivePlaybackOpen] = useState(false);
  
  // 수록곡 편집 상태
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [allRecordings, setAllRecordings] = useState<Array<{
    id: string;
    title: string;
    artist: string;
    score: number;
    duration: string;
    audioUrl?: string;
  }>>([]);

  // 앨범 데이터 로드
  useEffect(() => {
    const loadAlbum = async () => {
      if (!albumId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 실제 API에서 앨범 상세 정보 가져오기
        const albumResponse = await albumService.getAlbum(parseInt(albumId));
        
        if (albumResponse) {
          // 앨범 트랙 정보도 함께 가져오기
          let tracksData = [];
          try {
            const tracksResponse = await albumService.getAlbumTracks(parseInt(albumId));
            tracksData = tracksResponse.tracks.map(track => ({
              id: track.id.toString(),
              title: track.recordTitle,
              artist: '아티스트', // TODO: 실제 아티스트 정보 가져오기
              score: 0, // TODO: 실제 점수 정보 가져오기
              duration: `${Math.floor(track.durationSeconds / 60)}:${(track.durationSeconds % 60).toString().padStart(2, '0')}`,
              audioUrl: track.audioUrl,
            }));
          } catch (trackError) {
            console.error('트랙 정보 로드 실패:', trackError);
            tracksData = [];
          }
          
          // 앨범 데이터를 상세 페이지 형식으로 변환
          const albumDetailData: AlbumDetailData = {
            id: albumResponse.id.toString(),
            title: albumResponse.title,
            description: albumResponse.description || '',
            coverImageUrl: albumResponse.coverImageUrl || '',
            userId: albumResponse.userId.toString(),
            user: {
              nickname: '사용자', // TODO: 실제 사용자 정보 API 연동 필요
              avatar: undefined,
            },
            tracks: tracksData,
            isPublic: albumResponse.isPublic,
            tags: albumResponse.tags || [],
            likeCount: albumResponse.likeCount || 0,
            playCount: albumResponse.playCount || 0,
            commentCount: albumResponse.commentCount || 0,
            createdAt: albumResponse.createdAt || new Date().toISOString(),
          };
          
          setAlbum(albumDetailData);
          setLikeCount(albumDetailData.likeCount);
          
          // 댓글 데이터 로드
          await loadComments(parseInt(albumId));
        }
      } catch (error) {
        console.error('앨범 데이터 로드 실패:', error);
        // 에러 시 기본 데이터로 폴백
        setAlbum(null);
      } finally {
        setLoading(false);
      }
    };

    loadAlbum();
  }, [albumId]);

  // 댓글 데이터 로드 함수
  const loadComments = async (albumId: number) => {
    try {
      // TODO: 실제 댓글 API 연동 필요
      // const commentsResponse = await commentService.getAlbumComments(albumId);
      // setComments(commentsResponse);
      setComments([]); // 임시로 빈 배열
    } catch (error) {
      console.error('댓글 데이터 로드 실패:', error);
      setComments([]);
    }
  };

  // 앨범을 찾을 수 없으면 이전 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && !album) {
      navigate(previousPage, { replace: true });
    }
  }, [loading, album, navigate, previousPage]);

  // 이전 페이지 추적
  useEffect(() => {
    // location.state에서 이전 페이지 정보를 가져오거나, referrer를 사용
    if (location.state?.from) {
      setPreviousPage(location.state.from);
    } else if (document.referrer) {
      try {
        // referrer에서 페이지 경로 추출
        const referrerPath = new URL(document.referrer).pathname;
        if (referrerPath && referrerPath !== location.pathname) {
          setPreviousPage(referrerPath);
        }
      } catch (error) {
        // referrer 파싱 실패 시 기본값 사용
        console.warn('Failed to parse referrer:', error);
      }
    }
    
    // 브라우저 히스토리에서 이전 페이지 확인
    if (window.history.length > 1) {
      // 현재 페이지가 아닌 이전 페이지로 설정
      const currentPath = location.pathname;
      if (currentPath !== '/feed' && currentPath !== '/me') {
        // 현재 경로에 따라 적절한 이전 페이지 설정
        if (currentPath.includes('/albums/')) {
          // 앨범 상세 페이지에서 온 경우, 일반적으로 피드나 마이페이지에서 왔을 가능성이 높음
          setPreviousPage('/feed');
        }
      }
    }
  }, [location]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#2196f3';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1일 전';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const handleLike = async () => {
    if (!albumId) return;
    
    try {
      if (isLiked) {
        await unlikeAlbum(parseInt(albumId));
        setLikeCount(prev => prev - 1);
      } else {
        await likeAlbum(parseInt(albumId));
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      // 에러 처리 (토스트 메시지 등)
    }
  };

  const handleCommentSubmit = async () => {
    if (newComment.trim() && albumId && user) {
      try {
        // 실제 API를 통해 댓글 작성
        await createComment(parseInt(albumId), newComment.trim());
        
        // 댓글 목록 새로고침
        await loadComments(parseInt(albumId));
        
        // 입력 필드 초기화
        setNewComment('');
      } catch (error) {
        console.error('댓글 작성 실패:', error);
        // 에러 처리 (토스트 메시지 등)
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleCommentSubmit();
    }
  };

  const handleDeleteAlbum = () => {
    setDeleteDialogOpen(true);
  };

  const handleEditTracks = async () => {
    try {
      // 실제 사용자의 녹음 데이터 가져오기
      const recordings = await recordingService.getMyRecordings();
      
      // 녹음 데이터를 수록곡 형식으로 변환
      const availableRecordings = recordings.map(recording => ({
        id: recording.id.toString(),
        title: recording.title || '제목 없음',
        artist: recording.song?.artist || '아티스트 없음',
        score: recording.analysis?.overallScore || 0,
        duration: recording.durationSeconds ? 
          `${Math.floor(recording.durationSeconds / 60)}:${(recording.durationSeconds % 60).toString().padStart(2, '0')}` : 
          '0:00',
        audioUrl: recording.audioUrl,
      }));
      
      setAllRecordings(availableRecordings);
      
      // 현재 앨범의 수록곡 ID들을 선택된 상태로 설정
      if (album) {
        setSelectedTracks(album.tracks.map(track => track.id));
      }
      
      setEditTracksDialogOpen(true);
    } catch (error) {
      console.error('녹음 데이터 로드 실패:', error);
      // 에러 시 빈 배열로 설정
      setAllRecordings([]);
      setEditTracksDialogOpen(true);
    }
  };

  // 앨범 삭제 확인
  const handleConfirmDelete = async () => {
    try {
      if (albumId) {
        await albumService.deleteAlbum(parseInt(albumId));
        // 삭제 성공 시 이전 페이지로 이동
        if (window.history.length > 1) {
          navigate(-1); // 브라우저의 뒤로가기
        } else {
          // 히스토리가 없으면 이전 페이지로 이동
          navigate(previousPage);
        }
      }
    } catch (error) {
      console.error('앨범 삭제 실패:', error);
      // 에러 처리 (토스트 메시지 등)
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // 수록곡 편집 핸들러
  const handleTrackToggle = (trackId: string) => {
    setSelectedTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const handleSelectAllTracks = () => {
    setSelectedTracks(allRecordings.map(recording => recording.id));
  };

  const handleDeselectAllTracks = () => {
    setSelectedTracks([]);
  };

  const handleSaveTracks = async () => {
    try {
      if (!albumId) return;
      
      // 선택된 녹음들을 트랙 형식으로 변환
      const tracksToAdd = allRecordings
        .filter(recording => selectedTracks.includes(recording.id))
        .map((recording, index) => ({
          recordId: parseInt(recording.id),
          trackOrder: index + 1,
        }));
      
      // API를 통해 앨범의 수록곡 업데이트
      if (tracksToAdd.length > 0) {
        await albumService.addTracks(parseInt(albumId), { tracks: tracksToAdd });
        
        // 앨범 트랙 목록 새로고침
        const updatedTracks = await albumService.getAlbumTracks(parseInt(albumId));
        
        // 현재 앨범 상태 업데이트
        if (album && updatedTracks) {
          setAlbum(prev => prev ? {
            ...prev,
            tracks: updatedTracks.tracks.map(track => ({
              id: track.id.toString(),
              title: track.recordTitle,
              artist: '아티스트', // TODO: 실제 아티스트 정보 가져오기
              score: 0, // TODO: 실제 점수 정보 가져오기
              duration: `${Math.floor(track.durationSeconds / 60)}:${(track.durationSeconds % 60).toString().padStart(2, '0')}`,
              audioUrl: track.audioUrl,
            })),
            trackCount: updatedTracks.totalTracks
          } : null);
        }
      }
      
      setEditTracksDialogOpen(false);
    } catch (error) {
      console.error('수록곡 저장 실패:', error);
      // 에러 처리 (토스트 메시지 등)
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">앨범을 불러오는 중...</Typography>
      </Container>
    );
  }

  if (!album) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#B3B3B3' }}>
          앨범을 찾을 수 없습니다. 피드 페이지로 이동합니다...
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{
      flex: 1,
      background: theme.colors.background.main,
      minHeight: '100vh',
      pt: { xs: 16, sm: 20 },
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 30% 30%, rgba(255, 107, 157, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 70% 70%, rgba(196, 71, 233, 0.2) 0%, transparent 40%),
          radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 30%)
        `,
        pointerEvents: 'none',
        zIndex: 1
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 80% 20%, rgba(255, 107, 157, 0.1) 0%, transparent 30%),
          radial-gradient(circle at 20% 80%, rgba(196, 71, 233, 0.15) 0%, transparent 30%)
        `,
        pointerEvents: 'none',
        zIndex: 1
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 뒤로가기 버튼 */}
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(previousPage)}
            sx={{ 
              mb: 3, 
              color: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                color: '#FFFFFF',
                backgroundColor: 'rgba(196, 71, 233, 0.1)'
              }
            }}
          >
            뒤로가기
          </Button>

          {/* 앨범 정보 */}
          <Paper sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 3,
            background: 'transparent',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 0 20px rgba(196, 71, 233, 0.3)'
          }}>
            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
              <CardMedia
                component="img"
                sx={{ 
                  width: 200, 
                  height: 200, 
                  borderRadius: 2,
                  border: '3px solid rgba(196, 71, 233, 0.3)',
                  boxShadow: '0 0 20px rgba(196, 71, 233, 0.3)'
                }}
                image={album.coverImageUrl}
                alt={album.title}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg,rgb(249, 248, 248) 0%, #C147E9 50%, #8B5CF6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(210, 151, 228, 0.5)'
                }}>
                  {album.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar 
                    src={album.user.avatar} 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      border: '2px solid rgba(196, 71, 233, 0.3)',
                      boxShadow: '0 0 10px rgba(196, 71, 233, 0.3)'
                    }} 
                  />
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {album.user.nickname}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {formatDate(album.createdAt)}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ 
                  mb: 2,
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1.1rem'
                }}>
                  ♫ {album.tracks.length}곡 • {(() => {
                    const totalSeconds = album.tracks.reduce((total, track) => {
                      if (!track.duration) return total;
                      const parts = track.duration.split(':');
                      if (parts.length === 2) {
                        const [minutes, seconds] = parts.map(Number);
                        return total + (minutes * 60) + seconds;
                      }
                      return total;
                    }, 0);
                    const totalMinutes = Math.floor(totalSeconds / 60);
                    return totalMinutes > 0 ? `${totalMinutes}분` : '0분';
                  })()}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {album.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(196, 71, 233, 0.1)',
                        color: '#C147E9',
                        fontSize: '0.75rem',
                        border: '1px solid rgba(196, 71, 233, 0.3)',
                        '&:hover': {
                          backgroundColor: 'rgba(196, 71, 233, 0.2)',
                          borderColor: 'rgba(196, 71, 233, 0.5)'
                        }
                      }}
                    />
                  ))}
                </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                sx={{
                  backgroundColor: '#2c2c2c',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                  },
                }}
              >
                전체 재생
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExpandMore />}
                onClick={() => setImmersivePlaybackOpen(true)}
                sx={{
                  borderColor: '#2c2c2c',
                  color: '#2c2c2c',
                  '&:hover': {
                    borderColor: '#1a1a1a',
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                몰입 재생
              </Button>
              <IconButton onClick={handleLike} sx={{ color: isLiked ? '#f44336' : '#666' }}>
                <Favorite />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {likeCount}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Delete />}
                onClick={handleDeleteAlbum}
                sx={{
                  borderColor: '#FF6B6B',
                  color: '#FF6B6B',
                  fontSize: '0.8rem',
                  px: 2,
                  py: 0.5,
                  '&:hover': {
                    borderColor: '#FF5252',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  },
                }}
              >
                앨범 삭제
              </Button>
            </Box>
          </Box>
        </Box>
          </Paper>

        {/* 앨범 설명 */}
        <Paper sx={{ 
          p: 3, 
          mb: 4,
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3
        }}>
          <Typography variant="body1" sx={{ 
            lineHeight: 1.6,
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            {album.description}
          </Typography>
        </Paper>

        {/* 수록곡 */}
        <Paper sx={{ 
          p: 3, 
          mb: 4,
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center',
              color: '#FFFFFF'
            }}>
              ♪ 수록곡
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleEditTracks}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.8rem',
                px: 2,
                py: 0.5,
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              수록곡 편집
            </Button>
          </Box>
          <List>
            {album.tracks.map((track, index) => (
              <ListItem key={track.id} sx={{ py: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ 
                      minWidth: 20,
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      {index + 1}.
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 500,
                      color: '#FFFFFF'
                    }}>
                      {track.title}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
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
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      {track.duration}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small" sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}>
                  <PlayArrow sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      color: '#FFFFFF'
                    }
                  }} />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* 댓글 섹션 */}
        <Paper sx={{ 
          p: 3,
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            mb: 2,
            color: '#FFFFFF'
          }}>
            댓글 ({comments.length})
          </Typography>
          
          {/* 댓글 작성 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="이 앨범에 대한 생각을 남겨보세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused fieldset': {
                    border: '1px solid rgba(196, 71, 233, 0.5)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#FFFFFF',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    opacity: 1,
                  },
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleCommentSubmit}
              disabled={!newComment.trim()}
              sx={{
                background: theme.colors.primary.gradient,
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)',
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              댓글 작성
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* 댓글 목록 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {comments.map((comment) => (
              <Box key={comment.id} sx={{ display: 'flex', gap: 2 }}>
                <Avatar src={comment.user.avatar} sx={{ width: 40, height: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 500,
                      color: '#FFFFFF'
                    }}>
                      {comment.user.nickname}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      {formatDate(comment.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ 
                    lineHeight: 1.5,
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    {comment.content}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* 앨범 삭제 확인 다이얼로그 */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              background: theme.colors.background.main,
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
            }
          }}
        >
          <DialogTitle sx={{ 
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            pb: 2
          }}>
            앨범 삭제
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              mt: 2
            }}>
              정말로 이 앨범을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            pt: 2,
            px: 3
          }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                }
              }}
            >
              취소
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF7B7B 0%, #FF6B6B 100%)',
                },
              }}
            >
              삭제
            </Button>
          </DialogActions>
        </Dialog>

        {/* 수록곡 편집 다이얼로그 */}
        <Dialog
          open={editTracksDialogOpen}
          onClose={() => setEditTracksDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: theme.colors.background.main,
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
            }
          }}
        >
          <DialogTitle sx={{ 
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            pb: 2
          }}>
            수록곡 편집
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button 
                size="small" 
                onClick={handleSelectAllTracks}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    borderColor: '#C147E9',
                    backgroundColor: 'rgba(196, 71, 233, 0.1)',
                  }
                }}
              >
                전체 선택
              </Button>
              <Button 
                size="small" 
                onClick={handleDeselectAllTracks}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    borderColor: '#C147E9',
                    backgroundColor: 'rgba(196, 71, 233, 0.1)',
                  }
                }}
              >
                전체 해제
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: '#FFFFFF'
            }}>
              내 녹음 목록에서 선택하세요
            </Typography>
            <List>
              {allRecordings.map((recording, index) => {
                const duration = recording.duration;
                return (
                  <ListItem key={recording.id} sx={{ py: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedTracks.includes(recording.id)}
                          onChange={() => handleTrackToggle(recording.id)}
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-checked': {
                              color: '#C147E9',
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                          <Typography variant="body2" sx={{ 
                            minWidth: 20,
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}>
                            {index + 1}.
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 500,
                            color: '#FFFFFF'
                          }}>
                            {recording.title}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}>
                            - {recording.artist}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: getScoreColor(recording.score),
                              fontWeight: 600,
                            }}
                          >
                            {recording.score}점
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}>
                            {duration}
                          </Typography>
      </Box>
                      }
                      sx={{ width: '100%' }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </DialogContent>
          <DialogActions sx={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            pt: 2,
            px: 3
          }}>
            <Button 
              onClick={() => setEditTracksDialogOpen(false)}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                }
              }}
            >
              취소
            </Button>
            <Button 
              onClick={handleSaveTracks} 
              variant="contained"
              sx={{
                background: theme.colors.primary.gradient,
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)',
                },
              }}
            >
              저장
            </Button>
          </DialogActions>
        </Dialog>

        {/* 몰입 재생 모달 */}
        <ImmersivePlaybackModal
          open={immersivePlaybackOpen}
          onClose={() => setImmersivePlaybackOpen(false)}
          albumData={{
            id: album.id,
            title: album.title,
            tracks: album.tracks.map(track => ({
              id: track.id,
              title: track.title,
              audioUrl: track.audioUrl,
              duration: track.duration,
            })),
            coverImageUrl: album.coverImageUrl,
            description: album.description,
          }}
        />
        </motion.div>
      </Container>
    </Box>
  );
};

export default AlbumDetailPage;