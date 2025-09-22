/**
 * Feed 관련 컴포넌트들 통합
 * 피드, 댓글, 팔로우 등 소셜 기능 컴포넌트들을 한 곳에 모아 관리합니다.
 */

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Chip, 
  Avatar,
  IconButton,
  Drawer,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Favorite, 
  FavoriteBorder, 
  Comment, 
  Share, 
  PersonAdd, 
  PersonRemove,
  FilterList,
  Send
} from '@mui/icons-material';

// ===== Album Feed Grid =====

interface AlbumFeedGridProps {
  albums: any[];
  onAlbumClick?: (album: any) => void;
  onLike?: (albumId: string | number) => void;
  onComment?: (albumId: string | number) => void;
  isLoading?: boolean;
}

export const AlbumFeedGrid: React.FC<AlbumFeedGridProps> = ({
  albums,
  onAlbumClick,
  onLike,
  onComment,
  isLoading = false
}) => {
  return (
    <Grid container spacing={2}>
      {albums.map((album, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ cursor: 'pointer' }}>
            <Box
              sx={{
                height: 200,
                backgroundImage: `url(${album.coverImageUrl || '/images/default-album.png'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              onClick={() => onAlbumClick?.(album)}
            />
            <CardContent>
              <Typography variant="h6" noWrap>
                {album.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {album.user?.nickname || 'Unknown Artist'} • {album.trackCount}곡
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={() => onLike?.(album.id)}>
                    {album.isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
                  </IconButton>
                  <IconButton size="small" onClick={() => onComment?.(album.id)}>
                    <Comment />
                  </IconButton>
                  <IconButton size="small">
                    <Share />
                  </IconButton>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {album.likeCount || 0} 좋아요
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// ===== Follow Button =====

interface FollowButtonProps {
  userId: string | number;
  isFollowing: boolean;
  onFollow: (userId: string | number) => void;
  onUnfollow: (userId: string | number) => void;
  isLoading?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing,
  onFollow,
  onUnfollow,
  isLoading = false
}) => {
  const handleClick = () => {
    if (isFollowing) {
      onUnfollow(userId);
    } else {
      onFollow(userId);
    }
  };

  return (
    <Button
      variant={isFollowing ? "outlined" : "contained"}
      startIcon={isFollowing ? <PersonRemove /> : <PersonAdd />}
      onClick={handleClick}
      disabled={isLoading}
      size="small"
    >
      {isFollowing ? '언팔로우' : '팔로우'}
    </Button>
  );
};

// ===== Feed Filters =====

interface FeedFiltersProps {
  selectedGenre?: string;
  selectedSort?: 'latest' | 'popular' | 'trending';
  onGenreChange: (genre: string) => void;
  onSortChange: (sort: 'latest' | 'popular' | 'trending') => void;
}

export const FeedFilters: React.FC<FeedFiltersProps> = ({
  selectedGenre = '',
  selectedSort = 'latest',
  onGenreChange,
  onSortChange
}) => {
  const genres = ['전체', 'K-POP', '발라드', 'R&B', '힙합', '재즈', '클래식'];
  const sortOptions = [
    { value: 'latest', label: '최신순' },
    { value: 'popular', label: '인기순' },
    { value: 'trending', label: '트렌딩' }
  ];

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
      <FilterList color="action" />
      
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>장르</InputLabel>
        <Select
          value={selectedGenre}
          onChange={(e) => onGenreChange(e.target.value)}
          label="장르"
        >
          {genres.map((genre) => (
            <MenuItem key={genre} value={genre}>
              {genre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>정렬</InputLabel>
        <Select
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value as any)}
          label="정렬"
        >
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

// ===== Comment Drawer =====

interface CommentDrawerProps {
  open: boolean;
  onClose: () => void;
  albumId?: string | number;
  comments: any[];
  onAddComment: (comment: string) => void;
  isLoading?: boolean;
}

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  open,
  onClose,
  albumId,
  comments,
  onAddComment,
  isLoading = false
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 400, maxWidth: '90vw' } }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          댓글 ({comments.length})
        </Typography>
        
        {/* 댓글 목록 */}
        <Box sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', mb: 2 }}>
          {comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              첫 번째 댓글을 남겨보세요!
            </Typography>
          ) : (
            comments.map((comment, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar sx={{ width: 24, height: 24 }}>
                    {comment.user?.nickname?.[0]}
                  </Avatar>
                  <Typography variant="body2" fontWeight="bold">
                    {comment.user?.nickname || 'Anonymous'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {comment.content}
                </Typography>
              </Box>
            ))
          )}
        </Box>

        {/* 댓글 작성 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={isLoading}
          />
          <IconButton 
            onClick={handleSubmit} 
            disabled={!newComment.trim() || isLoading}
            color="primary"
          >
            <Send />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
};
