import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAlbumStore } from '../stores/albumStore';
import {
  Box,
  Container,
  Typography,
  Button,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  TextField,
  Paper,
  Avatar,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  ExpandMore,
  Favorite,
  Share,
  MoreVert,
  Send,
  ArrowBack,
} from '@mui/icons-material';

// 더미 앨범 데이터
const dummyAlbum = {
  id: '1',
  title: 'My Favorite Songs',
  description: '내가 좋아하는 노래들을 모아서 만든 첫 번째 앨범입니다. 감성적인 발라드부터 신나는 댄스곡까지 다양한 장르를 담았어요.',
  coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  userId: 'user1',
  user: {
    nickname: '음악러버',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  },
  tracks: [
    { id: '1', title: '좋아', artist: '윤종신', score: 85, duration: '3:45' },
    { id: '2', title: '사랑은 은하수 다방에서', artist: '10cm', score: 92, duration: '4:12' },
    { id: '3', title: '밤편지', artist: '아이유', score: 88, duration: '3:23' },
  ],
  isPublic: true,
  tags: ['K-POP', '발라드', '감성', '힐링'],
  likeCount: 42,
  playCount: 156,
  commentCount: 12,
  createdAt: '2025-01-15T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
};

// 더미 댓글 데이터
const dummyComments = [
  {
    id: '1',
    userId: 'user2',
    user: {
      nickname: '뮤직팬',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    },
    content: '정말 좋은 선곡이네요! 특히 2번째 곡이 너무 감동적이었어요 👋',
    createdAt: '2025-01-13T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user3',
    user: {
      nickname: '노래왕',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    },
    content: '목소리가 정말 좋으시네요. 다음 앨범도 기대할게요!',
    createdAt: '2025-01-14T00:00:00Z',
  },
];

const AlbumDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { albumId } = useParams<{ albumId: string }>();
  const { getAlbumById } = useAlbumStore();
  const [album, setAlbum] = useState(dummyAlbum);
  const [comments, setComments] = useState(dummyComments);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 앨범 데이터 로드
  useEffect(() => {
    const loadAlbum = () => {
      if (!albumId) {
        setLoading(false);
        return;
      }

      const foundAlbum = getAlbumById(albumId);
      
      if (foundAlbum) {
        // 앨범 데이터를 상세 페이지 형식으로 변환
        const albumData = {
          id: foundAlbum.id,
          title: foundAlbum.title,
          description: foundAlbum.description,
          coverImage: foundAlbum.coverImage,
          userId: 'current-user',
          user: {
            nickname: '음악러버', // 실제로는 사용자 정보에서 가져와야 함
            profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
          },
          tracks: [
            // 실제로는 녹음 데이터에서 가져와야 함
            { id: '1', title: '좋아', artist: '윤종신', score: 85, duration: '3:45' },
            { id: '2', title: '사랑은 은하수 다방에서', artist: '10cm', score: 92, duration: '4:12' },
            { id: '3', title: '밤편지', artist: '아이유', score: 88, duration: '3:23' },
          ],
          isPublic: foundAlbum.isPublic,
          tags: ['K-POP', '발라드', '감성', '힐링'], // 실제로는 앨범 데이터에서 가져와야 함
          likeCount: foundAlbum.likeCount,
          playCount: foundAlbum.playCount,
          commentCount: 0, // 실제로는 댓글 데이터에서 가져와야 함
          createdAt: foundAlbum.createdAt,
          updatedAt: foundAlbum.createdAt,
        };
        
        setAlbum(albumData);
        setLikeCount(foundAlbum.likeCount);
      }
      
      setLoading(false);
    };

    loadAlbum();
  }, [albumId, getAlbumById]);

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

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        userId: 'current-user',
        user: {
          nickname: '나',
          profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        },
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleCommentSubmit();
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">앨범을 불러오는 중...</Typography>
      </Container>
    );
  }

  if (!album || album.id !== albumId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3, color: '#666' }}
        >
          뒤로가기
        </Button>
        <Typography variant="h6" color="text.secondary">
          앨범을 찾을 수 없습니다.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 뒤로가기 버튼 */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3, color: '#666' }}
        >
          뒤로가기
        </Button>

        {/* 앨범 정보 */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <CardMedia
            component="img"
            sx={{ width: 200, height: 200, borderRadius: 2 }}
            image={album.coverImage}
            alt={album.title}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {album.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar src={album.user.profileImage} sx={{ width: 32, height: 32 }} />
              <Typography variant="body1" color="text.secondary">
                {album.user.nickname}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(album.createdAt)}
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              ♫ {album.tracks.length}곡 • {album.tracks.reduce((total, track) => {
                const [minutes, seconds] = track.duration.split(':').map(Number);
                return total + minutes * 60 + seconds;
              }, 0) / 60}분
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {album.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    backgroundColor: '#f0f0f0',
                    color: '#666',
                    fontSize: '0.75rem',
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
                ▷ 전체 재생
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExpandMore />}
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
              <IconButton sx={{ color: '#666' }}>
                <Share />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                공유
              </Typography>
              <IconButton sx={{ color: '#666' }}>
                <MoreVert />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* 앨범 설명 */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            {album.description}
          </Typography>
        </Paper>

        {/* 수록곡 */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
            ♪ 수록곡
          </Typography>
          <List>
            {album.tracks.map((track, index) => (
              <ListItem key={track.id} sx={{ py: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                        {index + 1}.
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {track.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        - {track.artist}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: getScoreColor(track.score),
                          fontWeight: 600,
                        }}
                      >
                        {track.score}점
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {track.duration}
                      </Typography>
                    </Box>
                  }
                />
                <IconButton size="small">
                  <PlayArrow sx={{ color: '#666' }} />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* 통계 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Favorite sx={{ fontSize: 16, color: '#666' }} />
            <Typography variant="body2" color="text.secondary">
              {likeCount}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 16, color: '#666' }}>💬</Typography>
            <Typography variant="body2" color="text.secondary">
              {album.commentCount}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlayArrow sx={{ fontSize: 16, color: '#666' }} />
            <Typography variant="body2" color="text.secondary">
              {album.playCount}
            </Typography>
          </Box>
        </Box>

        {/* 댓글 섹션 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
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
            />
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleCommentSubmit}
              disabled={!newComment.trim()}
              sx={{
                backgroundColor: '#2c2c2c',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1a1a1a',
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#9e9e9e',
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
                <Avatar src={comment.user.profileImage} sx={{ width: 40, height: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {comment.user.nickname}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(comment.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                    {comment.content}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
    </Container>
  );
};

export default AlbumDetailPage;