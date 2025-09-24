import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { albumService } from '../services/api/albums';
import { motion } from 'framer-motion';
import { 
  FeedAlbum, 
  getMyAlbums, 
  getFeedAlbums,
  clearDummyAlbums
} from '../utils/feedUtils';
import { getErrorMessage as getApiErrorMessage, logError, isRetryableError } from '../utils/errorHandler';
import { API_CONSTANTS, WARNING_MESSAGES } from '../utils/constants';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  CardMedia,
  Avatar,
  Chip,
  Button,
  TextField,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel
} from '@mui/material';
import {
  FilterList,
  Add,
  MusicNote,
  Person
} from '@mui/icons-material';

// 타입 정의는 feedUtils.ts로 이동됨

// MyAlbum 타입은 feedUtils.ts에서 FeedAlbum로 통합됨

// 더미 피드 데이터 제거 - 실제 데이터만 사용

// 내 앨범 데이터를 localStorage에서 가져오는 함수는 feedUtils.ts로 이동됨

// 유틸리티 함수들은 feedUtils.ts로 이동됨

const cyberpunkStyles = `
    @keyframes hologramScan {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    @keyframes pulseGlow {
      0% { 
        text-shadow: 0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor, 0 0 80px currentColor;
        transform: perspective(500px) rotateX(15deg) scale(1);
      }
      100% { 
        text-shadow: 0 0 30px currentColor, 0 0 60px currentColor, 0 0 90px currentColor, 0 0 120px currentColor;
        transform: perspective(500px) rotateX(15deg) scale(1.05);
      }
    }
    @keyframes neonScan {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
  `;

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { user } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [sortBy, setSortBy] = useState('latest');
  const [feedAlbums, setFeedAlbums] = useState<FeedAlbum[]>([]);
  const [myAlbums, setMyAlbums] = useState(getMyAlbums());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [createFeedModalOpen, setCreateFeedModalOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [feedDescription, setFeedDescription] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // API로 공개 앨범 데이터 로드
  const loadPublicAlbums = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await albumService.getPublicAlbums({ page: 0, size: API_CONSTANTS.DEFAULT_PAGE_SIZE });
      const albums = response.content || [];
      const mappedAlbums: FeedAlbum[] = albums.map(album => ({
        ...album,
        user: {
          nickname: album.userNickname || `사용자 ${album.userId}`,
          avatar: album.userProfileImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
        },
        tags: ['캐주얼', '힐링'],
        playCount: Math.floor(Math.random() * 1000),
        commentCount: Math.floor(Math.random() * 50)
      }));
      setFeedAlbums(mappedAlbums);
    } catch (error) {
      logError(error, '공개 앨범 로드');
      const errorMessage = getApiErrorMessage(error);
      setError(errorMessage);
      
      // 에러 시 localStorage 데이터로 폴백
      setFeedAlbums(getFeedAlbums());
      
      // 재시도 가능한 에러인 경우 사용자에게 알림
      if (isRetryableError(error)) {
        showToast(WARNING_MESSAGES.NETWORK_RETRY, 'warning');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // 팔로우한 사용자들의 앨범 로드
  const loadFollowedUsersAlbums = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await albumService.getFollowedUsersAlbums({ page: 0, size: API_CONSTANTS.DEFAULT_PAGE_SIZE });
      const albums = response.content || [];
      const mappedAlbums: FeedAlbum[] = albums.map(album => ({
        ...album,
        user: {
          nickname: album.userNickname || `사용자 ${album.userId}`,
          avatar: album.userProfileImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
        },
        tags: ['커버', '감성'],
        playCount: Math.floor(Math.random() * 1000),
        commentCount: Math.floor(Math.random() * 50)
      }));
      setFeedAlbums(mappedAlbums);
    } catch (error) {
      logError(error, '팔로우 사용자 앨범 로드');
      const errorMessage = getApiErrorMessage(error);
      setError(errorMessage);
      
      // 재시도 가능한 에러인 경우 사용자에게 알림
      if (isRetryableError(error)) {
        showToast(WARNING_MESSAGES.DATA_LOAD_FAILED, 'warning');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // 댓글 상태 (현재 사용하지 않음)
  // const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  // const [selectedAlbumForComment, setSelectedAlbumForComment] = useState<FeedAlbum | null>(null);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    // 더미 데이터 제거
    clearDummyAlbums();
    
    loadPublicAlbums();
    setMyAlbums(getMyAlbums());
  }, [loadPublicAlbums]);

  useEffect(() => {
    if (tabValue === 0) {
      loadPublicAlbums();
    } else {
      loadFollowedUsersAlbums();
    }
  }, [tabValue, loadPublicAlbums, loadFollowedUsersAlbums]);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  // 현재 탭에 따라 필터링된 피드 데이터 (이미 API에서 필터링된 데이터를 사용)
  const filteredFeedAlbums = useMemo(() => feedAlbums, [feedAlbums]);

  const handleSortChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSortBy(event.target.value as string);
  }, []);

  // 좋아요 처리 (현재 사용하지 않음)
  // const handleLikeToggle = useCallback(async (albumId: number, isLiked: boolean) => {
  //   // 좋아요 처리 로직
  // }, [showToast, tabValue, loadPublicAlbums, loadFollowedUsersAlbums]);

  // 팔로우 처리 (현재 사용하지 않음)
  // const handleFollowToggle = useCallback(async (userId: number, isFollowing: boolean) => {
  //   // 팔로우 처리 로직
  // }, [showToast, loadFollowedUsersAlbums]);

  // 댓글 처리 (현재 사용하지 않음)
  // const handleCommentClick = (album: FeedAlbum) => {
  //   setSelectedAlbumForComment(album);
  //   setCommentDrawerOpen(true);
  // };

  // const handleCommentDrawerClose = () => {
  //   setCommentDrawerOpen(false);
  //   setSelectedAlbumForComment(null);
  // };
  const handleAlbumClick = (feed: FeedAlbum) => {
    navigate(`/albums/${feed.id}`, { state: { from: '/feed' } });
  };

  const handleCreateFeed = () => {
    const latestMyAlbums = getMyAlbums();
    setMyAlbums(latestMyAlbums);
    if (latestMyAlbums.length === 0) {
      showToast('먼저 앨범을 생성해주세요.', 'info');
      return;
    }
    setCreateFeedModalOpen(true);
  };

  const handleCloseCreateFeedModal = () => {
    setCreateFeedModalOpen(false);
    setSelectedAlbumId('');
    setFeedDescription('');
  };

  const handleFeedSubmit = () => {
    if (!selectedAlbumId || !feedDescription.trim()) {
      showToast('앨범을 선택하고 설명을 입력해주세요.', 'warning');
      return;
    }
    
    // 선택된 앨범 정보 가져오기
    const selectedAlbum = myAlbums.find((album: FeedAlbum) => album.id.toString() === selectedAlbumId);
    if (!selectedAlbum) {
      showToast('선택된 앨범을 찾을 수 없습니다.', 'error');
      return;
    }
    
    // 새로운 피드 생성
    const newFeed: FeedAlbum = {
      id: selectedAlbum.id,
      userId: selectedAlbum.userId,
      title: selectedAlbum.title,
      description: feedDescription,
      coverImageUrl: selectedAlbum.coverImageUrl,
      isPublic: selectedAlbum.isPublic,
      trackCount: selectedAlbum.trackCount,
      totalDuration: selectedAlbum.totalDuration,
      likeCount: 0,
      playCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        nickname: user?.nickname || '사용자', // 실제 사용자 정보 사용
        avatar: user?.profileImageUrl || user?.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      },
      tags: selectedAlbum.tags || [],
    };
    setFeedAlbums((prev: FeedAlbum[]) => {
      const updatedFeedAlbums = [newFeed, ...prev];
      localStorage.setItem('feedAlbums', JSON.stringify(updatedFeedAlbums));
      return updatedFeedAlbums;
    });
    handleCloseCreateFeedModal();
    showToast('피드가 성공적으로 생성되었습니다!', 'success');
  };

  return (
        <Box sx={{ 
      flex: 1, 
      minHeight: '100vh',
      background: `
          radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(0, 255, 0, 0.05) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)
        `,
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      paddingTop: '80px',
      position: 'relative',
      overflow: 'auto'
    }}>
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />
      
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        opacity: isInitialized ? 1 : 0,
        transform: isInitialized ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #00ffff, #ff0080)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 10px 0',
            textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
          }}>
            ORAK GRAK FEED
          </h1>
          <p style={{
            color: '#00ffff',
            fontSize: '1rem',
            margin: '0',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            EXPLORE THE COMMUNITY'S CREATIONS
          </p>
        </div>

        <Container maxWidth="lg" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Paper sx={{ 
                p: 4, 
                borderRadius: '15px',
                background: 'rgba(26, 26, 26, 0.9)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
              }}>
                <Box sx={{ mb: 4 }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    centered
                    sx={{
                      mb: 4,
                      borderBottom: 1, 
                      borderColor: 'rgba(0, 255, 255, 0.2)',
                      '& .MuiTabs-indicator': {
                        background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                        height: 3,
                        borderRadius: '3px 3px 0 0',
                        boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
                      }
                    }}
                  >
                    <Tab label="전체 피드" sx={{ color: '#B3B3B3', '&.Mui-selected': { color: '#FFFFFF' } }} />
                    <Tab label="팔로잉" sx={{ color: '#B3B3B3', '&.Mui-selected': { color: '#FFFFFF' } }} />
                  </Tabs>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="body1" sx={{ color: '#00ffff', fontWeight: 500 }}>
                      {feedAlbums.length}개 앨범
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FilterList sx={{ color: '#00ffff' }} />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={sortBy}
                          onChange={handleSortChange}
                          displayEmpty
                          sx={{
                            borderRadius: 2,
                            backgroundColor: 'rgba(0, 255, 255, 0.05)',
                            color: '#FFFFFF',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 255, 255, 0.3)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 255, 255, 0.5)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 255, 255, 0.7)' },
                            '& .MuiSvgIcon-root': { color: '#00ffff' }
                          }}
                        >
                          <MenuItem value="latest">최신순</MenuItem>
                          <MenuItem value="popular">인기순</MenuItem>
                          <MenuItem value="trending">트렌딩</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreateFeed}
                        sx={{
                          background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                          color: '#000000',
                          fontWeight: 'bold',
                          boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
                          '&:hover': {
                            boxShadow: '0 0 25px rgba(0, 255, 255, 0.7)',
                          },
                        }}
                      >
                        내 피드 만들기
                      </Button>
                    </Box>
                  </Box>
                </Box>

              {/* 에러 상태 표시 */}
              {error && (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  px: 3,
                  mb: 3,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  borderRadius: 2,
                }}>
                  <Typography variant="h6" sx={{ color: '#FF6B6B', mb: 1 }}>
                    데이터를 불러오는데 실패했습니다
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    서버에 일시적인 문제가 있을 수 있습니다.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => tabValue === 0 ? loadPublicAlbums() : loadFollowedUsersAlbums()}
                    sx={{ mt: 1 }}
                  >
                    다시 시도
                  </Button>
                </Box>
              )}

              {/* 로딩 상태 표시 */}
              {loading && (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                }}>
                  <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    앨범을 불러오는 중...
                  </Typography>
                </Box>
              )}

              {/* 앨범 카드 목록 */}
              {!loading && !error && filteredFeedAlbums.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  color: '#B3B3B3'
                }}>
                  <Typography variant="h5" sx={{ mb: 2, color: '#FFFFFF' }}>
                    {tabValue === 0 ? '아직 피드에 올라온 앨범이 없습니다' : '팔로잉한 사용자의 피드가 없습니다'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4 }}>
                    {tabValue === 0 
                      ? '첫 번째 앨범을 피드에 올려보세요!'
                      : '다른 사용자를 팔로우하거나 앨범을 만들어보세요'
                    }
                  </Typography>
                  {tabValue === 0 && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleCreateFeed}
                      sx={{ 
                        background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                        color: '#FFFFFF',
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 15px rgba(0, 255, 255, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00ffff, #ff0080)',
                          boxShadow: '0 6px 20px rgba(0, 255, 255, 0.6)',
                          transform: 'translateY(-2px)'
                        },
                      }}
                    >
                      앨범 피드 올리기
                    </Button>
                  )}
                         </Box>
              ) : !loading && !error && (
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { 
                    xs: '1fr', 
                    sm: '1fr', 
                    md: '1fr 1fr', 
                    lg: '1fr 1fr 1fr' 
                  },
                  gap: 3,
                  minWidth: '280px',
                  '@media (min-width: 600px) and (max-width: 899px)': {
                    gridTemplateColumns: '1fr'
                  },
                  '@media (min-width: 900px) and (max-width: 1199px)': {
                    gridTemplateColumns: '1fr 1fr'
                  },
                  '@media (min-width: 1200px)': {
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 4
                  }
                }}>
                  {filteredFeedAlbums.map((album: FeedAlbum, index: number) => (
                  <motion.div
                    key={album.id ? `album-${album.id}` : `album-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Box 
                      sx={{
                        position: 'relative',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        borderRadius: 2,
                        p: 2,
                        minWidth: '280px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                        }
                      }}
                      onClick={() => handleAlbumClick(album)}
                    >
                      {/* 앨범 커버 이미지 */}
                      <Box sx={{
                        position: 'relative',
                        mb: 2,
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 1,
                        overflow: 'hidden',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                        }
                      }}>
                        {album.coverImageUrl ? (
                          <CardMedia
                            component="img"
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'all 0.3s ease',
                            }}
                            image={album.coverImageUrl}
                            alt={album.title}
                            onError={(e) => {
                              // 이미지 로딩 실패 시 기본 배경으로 변경
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        {/* 기본 커버 이미지 또는 이미지 로딩 실패 시 표시할 UI */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: album.coverImageUrl
                              ? 'none'
                              : 'linear-gradient(135deg, #00ffff, #ff0080)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: album.coverImageUrl ? -1 : 1,
                          }}
                        >
                          {!album.coverImageUrl && (
                            <MusicNote
                              sx={{
                                fontSize: '2rem',
                                color: 'rgba(255, 255, 255, 0.8)',
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '1.1rem', mb: 1 }}>
                        {album.title || '제목 없음'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                        {album.description}
                      </Typography>

                      <Typography variant="body2" sx={{
                        fontSize: '0.8rem',
                        fontWeight: 400,
                        color: 'rgba(255, 255, 255, 0.5)',
                        mb: 1
                      }}>
                        {album.createdAt ? new Date(album.createdAt).toLocaleDateString('ko-KR') : '날짜 없음'}
                      </Typography>

                      {/* 사용자 정보 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar 
                          src={album.user?.avatar} 
                          sx={{ 
                            width: 20, 
                            height: 20, 
                            mr: 1,
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          <Person sx={{ fontSize: 12 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{
                          fontSize: '0.8rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {album.userNickname || album.user?.nickname || `사용자 ${album.userId}`}
                        </Typography>
                      </Box>

                      {/* 앨범 통계 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}>
                          ♫ {album.trackCount || 0}곡
                        </Typography>
                        {album.totalDuration > 0 && (
                          <Typography variant="body2" sx={{
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            ⏱ {Math.floor((album.totalDuration || 0) / 60)}분 {(album.totalDuration || 0) % 60}초
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(album.tags || []).map((tag: string) => (
                            <Chip key={tag} label={tag} size="small" sx={{ backgroundColor: 'rgba(0, 255, 255, 0.1)', color: '#00ffff' }} />
                          ))}
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              )}
            </Paper>
          </motion.div>
         </Box>
      </Container>

       {/* 피드 생성 모달 */}
       <Dialog 
         open={createFeedModalOpen} 
         onClose={handleCloseCreateFeedModal}
         maxWidth="md"
         fullWidth
         sx={{
           '& .MuiDialog-paper': {
             borderRadius: 3,
             maxHeight: '90vh',
             background: 'rgba(15, 15, 15, 0.95)',
             backdropFilter: 'blur(20px)',
             border: '1px solid rgba(196, 71, 233, 0.3)',
             boxShadow: '0 0 40px rgba(196, 71, 233, 0.3)'
           }
         }}
       >
         <DialogTitle sx={{ 
           textAlign: 'center', 
           fontSize: '1.5rem', 
           fontWeight: 700,
           color: '#FFFFFF',
           pb: 2,
           background: 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 50%, #8B5CF6 100%)',
           backgroundClip: 'text',
           WebkitBackgroundClip: 'text',
           WebkitTextFillColor: 'transparent',
           textShadow: '0 0 20px rgba(196, 71, 233, 0.5)'
         }}>
           내 피드 만들기
         </DialogTitle>
         
         <DialogContent sx={{ px: 4, py: 2 }}>
           {/* 앨범 선택 섹션 */}
           <Box sx={{ mb: 4 }}>
             <Typography variant="h6" sx={{ 
               fontWeight: 600, 
               mb: 1, 
               color: '#FFFFFF' 
             }}>
               공유할 앨범 선택
             </Typography>
             <Typography variant="body2" sx={{ 
               color: '#B3B3B3', 
               mb: 2,
               fontSize: '0.9rem'
             }}>
               공유하고 싶은 앨범을 하나 선택해주세요
             </Typography>
             
             <FormControl component="fieldset">
               {myAlbums.length === 0 ? (
                 <Box sx={{ 
                   textAlign: 'center', 
                   py: 4,
                   color: '#B3B3B3'
                 }}>
                   <MusicNote sx={{ fontSize: 48, color: '#C147E9', mb: 2 }} />
                   <Typography variant="h6" sx={{ mb: 1, color: '#FFFFFF' }}>
                     생성된 앨범이 없습니다
                   </Typography>
                   <Typography variant="body2" sx={{ mb: 3, color: '#B3B3B3' }}>
                     먼저 앨범을 생성한 후 피드로 공유해보세요
                   </Typography>
                   <Button
                     variant="contained"
                     onClick={() => {
                       handleCloseCreateFeedModal();
                       navigate('/albums/create');
                     }}
                     sx={{
                       background: 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)',
                       color: '#FFFFFF',
                       px: 3,
                       py: 1.5,
                       borderRadius: 2,
                       textTransform: 'none',
                       fontWeight: 600,
                       boxShadow: '0 4px 15px rgba(196, 71, 233, 0.4)',
                       '&:hover': {
                         background: 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)',
                         boxShadow: '0 6px 20px rgba(196, 71, 233, 0.6)',
                         transform: 'translateY(-2px)'
                       },
                     }}
                   >
                     앨범 만들기
                   </Button>
                 </Box>
               ) : (
                 <RadioGroup
                   value={selectedAlbumId}
                   onChange={(e) => setSelectedAlbumId(e.target.value)}
                 >
                   {myAlbums.map((album: FeedAlbum) => (
                   <FormControlLabel
                     key={album.id}
                     value={album.id.toString()}
                     control={<Radio sx={{ 
                       color: '#C147E9',
                       '&.Mui-checked': {
                         color: '#C147E9'
                       }
                     }} />}
                     label={
                       <Box sx={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         p: 2, 
                         border: selectedAlbumId === album.id.toString() 
                           ? '2px solid rgba(196, 71, 233, 0.5)' 
                           : '1px solid rgba(255, 255, 255, 0.2)',
                         borderRadius: 2,
                         ml: 1,
                         width: '100%',
                         backgroundColor: selectedAlbumId === album.id.toString() 
                           ? 'rgba(196, 71, 233, 0.1)' 
                           : 'rgba(255, 255, 255, 0.05)',
                         backdropFilter: 'blur(10px)',
                         transition: 'all 0.3s ease-in-out',
                         boxShadow: selectedAlbumId === album.id.toString() 
                           ? '0 0 20px rgba(196, 71, 233, 0.3)' 
                           : 'none',
                         '&:hover': {
                           backgroundColor: 'rgba(196, 71, 233, 0.1)',
                           borderColor: 'rgba(196, 71, 233, 0.3)',
                           boxShadow: '0 0 15px rgba(196, 71, 233, 0.2)'
                         }
                       }}>
                         <Box
                           sx={{
                             width: 80,
                             height: 80,
                             borderRadius: 1,
                             mr: 2,
                             border: '2px solid rgba(196, 71, 233, 0.3)',
                             boxShadow: '0 0 10px rgba(196, 71, 233, 0.3)',
                             position: 'relative',
                             overflow: 'hidden',
                             backgroundColor: 'rgba(255, 255, 255, 0.1)',
                           }}
                         >
                           {album.coverImageUrl ? (
                             <CardMedia
                               component="img"
                               sx={{
                                 width: '100%',
                                 height: '100%',
                                 objectFit: 'cover',
                               }}
                               image={album.coverImageUrl}
                               alt={album.title}
                               onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 target.style.display = 'none';
                               }}
                             />
                           ) : null}
                           {/* 기본 커버 이미지 */}
                           <Box
                             sx={{
                               position: 'absolute',
                               top: 0,
                               left: 0,
                               width: '100%',
                               height: '100%',
                               background: album.coverImageUrl
                                 ? 'none'
                                 : 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 50%, #8B5CF6 100%)',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               zIndex: album.coverImageUrl ? -1 : 1,
                             }}
                           >
                             {!album.coverImageUrl && (
                               <MusicNote
                                 sx={{
                                   fontSize: '2rem',
                                   color: 'rgba(255, 255, 255, 0.8)',
                                 }}
                               />
                             )}
                           </Box>
                         </Box>
                         <Box sx={{ flex: 1 }}>
                           <Typography variant="h6" sx={{ 
                             fontWeight: 600, 
                             mb: 1,
                             color: '#FFFFFF'
                           }}>
                             {album.title || '제목 없음'}
                           </Typography>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                             <Typography variant="body2" sx={{ color: '#B3B3B3' }}>
                               {album.trackCount || 0}곡
                             </Typography>
                             <Typography variant="body2" sx={{ color: '#B3B3B3' }}>
                               {album.totalDuration ? `${Math.floor(album.totalDuration / 60)}분` : '0분'}
                             </Typography>
                           </Box>
                           <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                             {(album.tags || []).map((tag: string) => (
                               <Chip
                                 key={tag}
                                 label={tag}
                                 size="small"
                                 sx={{
                                   backgroundColor: 'rgba(196, 71, 233, 0.1)',
                                   color: '#C147E9',
                                   fontSize: '0.75rem',
                                   height: 24,
                                   border: '1px solid rgba(196, 71, 233, 0.3)'
                                 }}
                               />
                             ))}
                           </Box>
                         </Box>
                       </Box>
                     }
                     sx={{ width: '100%', m: 0 }}
                   />
                 ))}
                 </RadioGroup>
               )}
             </FormControl>
           </Box>

           {/* 설명 입력 섹션 */}
           <Box>
             <Typography variant="h6" sx={{ 
               fontWeight: 600, 
               mb: 1, 
               color: '#FFFFFF' 
             }}>
               피드 설명 작성
             </Typography>
             <Typography variant="body2" sx={{ 
               color: '#B3B3B3', 
               mb: 2,
               fontSize: '0.9rem'
             }}>
               이 앨범에 대한 이야기나 감상을 자유롭게 작성해주세요. 이 내용이 피드에 표시됩니다.
             </Typography>
             <TextField
               fullWidth
               multiline
               rows={4}
               placeholder="이 앨범에 대한 이야기를 공유해보세요..."
               value={feedDescription}
               onChange={(e) => setFeedDescription(e.target.value)}
               sx={{
                 '& .MuiOutlinedInput-root': {
                   borderRadius: 2,
                   backgroundColor: 'rgba(255, 255, 255, 0.05)',
                   color: '#FFFFFF',
                   '&:hover .MuiOutlinedInput-notchedOutline': {
                     borderColor: 'rgba(196, 71, 233, 0.3)',
                   },
                   '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                     borderColor: 'rgba(196, 71, 233, 0.5)',
                     boxShadow: '0 0 10px rgba(196, 71, 233, 0.3)'
                   },
                 },
                 '& .MuiInputBase-input': {
                   color: '#FFFFFF',
                   '&::placeholder': {
                     color: '#737373',
                     opacity: 1
                   }
                 }
               }}
             />
           </Box>
         </DialogContent>
         
         <DialogActions sx={{ px: 4, pb: 3, gap: 2 }}>
           <Button
             onClick={handleCloseCreateFeedModal}
             sx={{
               color: '#B3B3B3',
               textTransform: 'none',
               fontWeight: 600,
               '&:hover': {
                 color: '#FFFFFF',
                 backgroundColor: 'rgba(255, 255, 255, 0.1)'
               }
             }}
           >
             취소
           </Button>
           <Button
             onClick={handleFeedSubmit}
             variant="contained"
             disabled={!selectedAlbumId || !feedDescription.trim()}
             sx={{
               background: selectedAlbumId && feedDescription.trim() 
                 ? 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)' 
                 : 'rgba(255, 255, 255, 0.1)',
               color: '#FFFFFF',
               borderRadius: 2,
               px: 3,
               py: 1,
               textTransform: 'none',
               fontWeight: 600,
               boxShadow: selectedAlbumId && feedDescription.trim() 
                 ? '0 4px 15px rgba(196, 71, 233, 0.4)' 
                 : 'none',
               '&:hover': {
                 background: selectedAlbumId && feedDescription.trim() 
                   ? 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)' 
                   : 'rgba(255, 255, 255, 0.1)',
                 boxShadow: selectedAlbumId && feedDescription.trim() 
                   ? '0 6px 20px rgba(196, 71, 233, 0.6)' 
                   : 'none',
                 transform: selectedAlbumId && feedDescription.trim() ? 'translateY(-2px)' : 'none'
               },
               '&:disabled': {
                 backgroundColor: 'rgba(255, 255, 255, 0.1)',
                 color: '#737373',
                 boxShadow: 'none'
               }
             }}
           >
             피드 공유하기
           </Button>
         </DialogActions>
       </Dialog>

       {/* 댓글 드로어 - TODO: CommentDrawer 컴포넌트 구현 필요 */}
       {/* {selectedAlbumForComment && (
         <CommentDrawer
           open={commentDrawerOpen}
           onClose={handleCommentDrawerClose}
           albumId={selectedAlbumForComment.id}
           albumTitle={selectedAlbumForComment.title}
         />
       )} */}
      </div>
    </Box>
  );
};

export default FeedPage;