import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import { usePublicAlbums, useFollowingAlbums, useAlbumLike, useFollow } from '../hooks/useSocial';
import CommentDrawer from '../components/feed/CommentDrawer';
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
  MusicNote
} from '@mui/icons-material';

// 타입 정의 (API 응답에 맞게 수정)
interface FeedAlbum {
  id: number;
  userId: number;
  title: string;
  description: string;
  uploadId: number;
  isPublic: boolean;
  trackCount: number;
  totalDuration: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  // UI를 위한 추가 필드들 (나중에 백엔드에서 제공하거나 클라이언트에서 처리)
  user?: {
    nickname: string;
    avatar: string;
  };
  coverImage?: string;
  playCount?: number;
  tags?: string[];
  commentCount?: number;
}

interface MyAlbum {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  trackCount: number;
  duration?: string;
  tags: string[];
}

// 더미 피드 데이터 제거 - 실제 데이터만 사용

// 내 앨범 데이터를 localStorage에서 가져오는 함수
const getMyAlbums = (): MyAlbum[] => {
  const savedAlbums = localStorage.getItem('myAlbums');
  if (savedAlbums) {
    return JSON.parse(savedAlbums);
  }
  return [];
};

// 팔로잉 데이터를 localStorage에서 가져오는 함수
const getFollowingUsers = (): string[] => {
  const savedFollowing = localStorage.getItem('followingUsers');
  return savedFollowing ? JSON.parse(savedFollowing) : [];
};

// 팔로잉 데이터를 localStorage에 저장하는 함수
const saveFollowingUsers = (followingUsers: string[]) => {
  localStorage.setItem('followingUsers', JSON.stringify(followingUsers));
};

// 테스트용 더미 팔로잉 데이터 초기화 함수
const initializeDummyFollowing = () => {
  const existingFollowing = getFollowingUsers();
  if (existingFollowing.length === 0) {
    // 테스트용으로 몇 명의 사용자를 팔로잉 목록에 추가
    const dummyFollowing = ['음악마스터', '멜로디킹', '비트메이커'];
    saveFollowingUsers(dummyFollowing);
    return dummyFollowing;
  }
  return existingFollowing;
};

// 피드 데이터를 localStorage에서 가져오는 함수
const getFeedAlbums = (): FeedAlbum[] => {
  const savedFeedAlbums = localStorage.getItem('feedAlbums');
  if (savedFeedAlbums) {
    const feedAlbums = JSON.parse(savedFeedAlbums);
    
    // 존재하는 앨범만 필터링
    const myAlbums = getMyAlbums();
    const validFeedAlbums = feedAlbums.filter((feed: FeedAlbum) => {
      // 해당 앨범이 실제로 존재하는지 확인
      return myAlbums.some(album => album.id === feed.albumId);
    });
    
    // 유효하지 않은 피드 데이터가 있으면 localStorage 업데이트
    if (validFeedAlbums.length !== feedAlbums.length) {
      localStorage.setItem('feedAlbums', JSON.stringify(validFeedAlbums));
    }
    
    return validFeedAlbums;
  }
  return []; // 더미 데이터 대신 빈 배열 반환
};

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useUIStore();
  const [tabValue, setTabValue] = useState(0);
  const [sortBy, setSortBy] = useState('latest');
  
  // 실제 API 훅 사용
  const { albums: publicAlbums, isLoading: publicLoading, error: publicError, refetch: refetchPublic } = usePublicAlbums();
  const { albums: followingAlbums, isLoading: followingLoading, error: followingError, refetch: refetchFollowing } = useFollowingAlbums();
  const { likeAlbum, unlikeAlbum } = useAlbumLike();
  const { followUser, unfollowUser } = useFollow();
  
  // 로컬 상태 (모달 등)
  const [myAlbums, setMyAlbums] = useState(getMyAlbums());
  const [createFeedModalOpen, setCreateFeedModalOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [feedDescription, setFeedDescription] = useState('');
  
  // 댓글 상태
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [selectedAlbumForComment, setSelectedAlbumForComment] = useState<FeedAlbum | null>(null);

  // 페이지 이동 시 데이터 새로고침
  useEffect(() => {
    setMyAlbums(getMyAlbums());
    refetchPublic();
    refetchFollowing();
  }, [location.pathname]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 현재 탭에 따라 필터링된 피드 데이터
  const getFilteredFeedAlbums = (): FeedAlbum[] => {
    if (tabValue === 0) {
      // 전체 피드 - 공개 앨범 사용
      return publicAlbums || [];
    } else {
      // 팔로잉 피드 - 팔로잉 사용자 앨범 사용
      return followingAlbums || [];
    }
  };

  const filteredFeedAlbums = getFilteredFeedAlbums();
  const isLoading = tabValue === 0 ? publicLoading : followingLoading;
  const error = tabValue === 0 ? publicError : followingError;

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value as string);
  };

  // 좋아요 처리
  const handleLikeToggle = async (albumId: number, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikeAlbum(albumId);
        showToast('좋아요를 취소했습니다.', 'success');
      } else {
        await likeAlbum(albumId);
        showToast('좋아요를 눌렀습니다.', 'success');
      }
      // 데이터 새로고침
      if (tabValue === 0) {
        refetchPublic();
      } else {
        refetchFollowing();
      }
    } catch (error) {
      showToast('좋아요 처리에 실패했습니다.', 'error');
    }
  };

  // 팔로우 처리
  const handleFollowToggle = async (userId: number, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        showToast('언팔로우했습니다.', 'success');
      } else {
        await followUser(userId);
        showToast('팔로우했습니다.', 'success');
      }
      // 팔로잉 데이터 새로고침
      refetchFollowing();
    } catch (error) {
      showToast('팔로우 처리에 실패했습니다.', 'error');
    }
  };

  // 댓글 처리
  const handleCommentClick = (album: FeedAlbum) => {
    setSelectedAlbumForComment(album);
    setCommentDrawerOpen(true);
  };

  const handleCommentDrawerClose = () => {
    setCommentDrawerOpen(false);
    setSelectedAlbumForComment(null);
  };

  const handleAlbumClick = (feed: FeedAlbum) => {
    // 피드에 albumId가 있으면 그것을 사용, 없으면 피드 ID 사용
    const albumId = feed.albumId || feed.id;
    // 앨범 상세 페이지로 이동 (이전 페이지 정보 전달)
    navigate(`/albums/${albumId}`, { 
      state: { from: '/feed' } 
    });
  };

  const handleCreateFeed = () => {
    // 최신 앨범 데이터 가져오기
    const latestMyAlbums = getMyAlbums();
    setMyAlbums(latestMyAlbums);
    
    // 앨범이 없으면 안내 메시지
    if (latestMyAlbums.length === 0) {
      showToast('먼저 앨범을 생성해주세요.', 'info');
      return;
    }
    
    // 피드 생성 모달 열기
    setCreateFeedModalOpen(true);
  };

  const handleCloseCreateFeedModal = () => {
    setCreateFeedModalOpen(false);
    setSelectedAlbumId('');
    setFeedDescription('');
  };

  const handleAlbumSelect = (albumId: string) => {
    setSelectedAlbumId(albumId);
  };

  const handleFeedSubmit = () => {
    if (!selectedAlbumId || !feedDescription.trim()) {
      showToast('앨범을 선택하고 설명을 입력해주세요.', 'warning');
      return;
    }
    
    // 선택된 앨범 정보 가져오기
    const selectedAlbum = myAlbums.find((album: MyAlbum) => album.id === selectedAlbumId);
    if (!selectedAlbum) {
      showToast('선택된 앨범을 찾을 수 없습니다.', 'error');
      return;
    }
    
    // 새로운 피드 생성
    const newFeed = {
      id: Date.now().toString(),
      albumId: selectedAlbum.id, // 실제 앨범 ID 저장
      user: {
        nickname: '나', // 현재 사용자 (나중에 실제 사용자 정보로 교체)
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      },
      createdAt: new Date().toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric' 
      }).replace(/\./g, '.').replace(/\s/g, ''),
      coverImage: selectedAlbum.coverImage,
      title: selectedAlbum.title,
      description: feedDescription,
      trackCount: selectedAlbum.trackCount,
      playCount: 0,
      tags: selectedAlbum.tags || [],
      likeCount: 0,
      commentCount: 0,
    };
    
    // 상태 업데이트와 localStorage 저장을 동시에 처리
    setFeedAlbums((prev: FeedAlbum[]) => {
      const updatedFeedAlbums = [newFeed, ...prev];
      // localStorage에 최신 상태 저장
      localStorage.setItem('feedAlbums', JSON.stringify(updatedFeedAlbums));
      return updatedFeedAlbums;
    });
    
    // 모달 닫기
    handleCloseCreateFeedModal();
    showToast('피드가 성공적으로 생성되었습니다!', 'success');
    
    // 피드 목록 자동 새로고침 (추가 안전장치)
    setTimeout(() => {
      setFeedAlbums(getFeedAlbums());
    }, 100);
  };

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
        animation: 'pulse 4s ease-in-out infinite alternate'
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.3), transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(196, 71, 233, 0.4), transparent),
          radial-gradient(1px 1px at 90px 40px, rgba(255, 107, 157, 0.5), transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.2), transparent),
          radial-gradient(2px 2px at 160px 30px, rgba(139, 92, 246, 0.3), transparent)
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 100px',
        pointerEvents: 'none',
        animation: 'sparkle 8s linear infinite'
      },
      '@keyframes pulse': {
        '0%': {
          opacity: 0.8
        },
        '100%': {
          opacity: 1
        }
      },
      '@keyframes sparkle': {
        '0%': {
          transform: 'translateY(0px)'
        },
        '100%': {
          transform: 'translateY(-100px)'
        }
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
          {/* 메인 콘텐츠 */}
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
            <Paper sx={{ 
              p: 4, 
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 0 20px rgba(196, 71, 233, 0.3)'
            }}>
              {/* 페이지 헤더 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  mb: 1, 
                  textAlign: 'center',
                  color: '#FFFFFF',
                  background: theme.colors.primary.gradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(196, 71, 233, 0.5)'
                }}>
                  ORAK GRAK
                </Typography>
                <Typography variant="body1" sx={{ 
                  mb: 4, 
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  color: '#B3B3B3'
                }}>
                  다른 사용자들의 멋진 앨범을 둘러보고 소통해보세요
                </Typography>
                
                {/* 피드 필터 탭 */}
                <Box sx={{ 
                  borderBottom: 1, 
                  borderColor: 'rgba(255, 255, 255, 0.1)', 
                  mb: 4,
                  '& .MuiTabs-indicator': {
                    background: theme.colors.primary.gradient,
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    boxShadow: '0 0 10px rgba(196, 71, 233, 0.5)'
                  }
                }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    centered
                    sx={{
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#737373',
                        '&.Mui-selected': {
                          color: '#FFFFFF',
                        },
                        '&:hover': {
                          color: '#B3B3B3'
                        }
                      }
                    }}
                  >
                    <Tab label="전체 피드" />
                    <Tab label="팔로잉" />
                  </Tabs>
                </Box>

                {/* 앨범 개수, 정렬, 내 피드 만들기 */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 3,
                  flexWrap: 'wrap',
                  gap: 2
                }}>
                  <Typography variant="body1" sx={{ 
                    fontSize: '1rem',
                    color: '#B3B3B3',
                    fontWeight: 500
                  }}>
                    {filteredFeedAlbums.length}개 앨범
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FilterList sx={{ color: '#B3B3B3' }} />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={sortBy}
                          onChange={handleSortChange}
                          displayEmpty
                          sx={{
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#FFFFFF',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(196, 71, 233, 0.3)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(196, 71, 233, 0.5)',
                              boxShadow: '0 0 10px rgba(196, 71, 233, 0.3)'
                            },
                            '& .MuiSelect-select': {
                              color: '#FFFFFF'
                            },
                            '& .MuiSvgIcon-root': {
                              color: '#B3B3B3'
                            }
                          }}
                        >
                          <MenuItem value="latest" sx={{ color: '#FFFFFF' }}>최신순</MenuItem>
                          <MenuItem value="popular" sx={{ color: '#FFFFFF' }}>인기순</MenuItem>
                          <MenuItem value="trending" sx={{ color: '#FFFFFF' }}>트렌딩</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleCreateFeed}
                      sx={{
                        background: theme.colors.primary.gradient,
                        color: '#FFFFFF',
            borderRadius: 2,
                        px: 3,
                        py: 1.5,
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
                      내 피드 만들기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 앨범 카드 목록 */}
              {filteredFeedAlbums.length === 0 ? (
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
                        background: theme.colors.primary.gradient,
                        color: '#FFFFFF',
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
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
                      앨범 피드 올리기
                    </Button>
                  )}
                         </Box>
              ) : (
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
                  gap: 3,
                  '@media (min-width: 1200px)': {
                    gap: 4
                  }
                }}>
                  {filteredFeedAlbums.map((album: FeedAlbum, index: number) => (
                  <motion.div
                    key={album.id}
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
                        <CardMedia
                          component="img"
                          sx={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'all 0.3s ease',
                          }}
                          image={album.coverImage}
                          alt={album.title}
                        />
                      </Box>

                      {/* 앨범 제목과 정보 */}
                      <Box sx={{ px: 0 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          color: '#FFFFFF',
                          fontSize: '1.1rem',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {album.title}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.85rem',
                          fontWeight: 400,
                          color: 'rgba(255, 255, 255, 0.6)',
                          mb: 1
                        }}>
                          ({album.createdAt.split('.')[0]}년)
                        </Typography>

                        {/* 사용자 정보 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar 
                            src={album.user.avatar} 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              mr: 1,
                              border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                          />
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.8rem',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            {album.user.nickname}
                          </Typography>
                        </Box>


                        {/* 앨범 통계 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            ♫ {album.trackCount}곡
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            ▶ {album.playCount}회
                          </Typography>
                        </Box>
                          
                        {/* 태그 */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(album.tags || []).slice(0, 2).map((tag: string) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(196, 71, 233, 0.1)',
                                color: '#C147E9',
                                fontSize: '0.65rem',
                                height: 18,
                                border: '1px solid rgba(196, 71, 233, 0.3)',
                                '&:hover': {
                                  backgroundColor: 'rgba(196, 71, 233, 0.2)',
                                  borderColor: 'rgba(196, 71, 233, 0.5)'
                                }
                              }}
                            />
                          ))}
                        </Box>

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
                       background: theme.colors.primary.gradient,
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
                   onChange={(e) => handleAlbumSelect(e.target.value)}
                 >
                   {myAlbums.map((album: MyAlbum) => (
                   <FormControlLabel
                     key={album.id}
                     value={album.id}
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
                         border: selectedAlbumId === album.id 
                           ? '2px solid rgba(196, 71, 233, 0.5)' 
                           : '1px solid rgba(255, 255, 255, 0.2)',
                         borderRadius: 2,
                         ml: 1,
                         width: '100%',
                         backgroundColor: selectedAlbumId === album.id 
                           ? 'rgba(196, 71, 233, 0.1)' 
                           : 'rgba(255, 255, 255, 0.05)',
                         backdropFilter: 'blur(10px)',
                         transition: 'all 0.3s ease-in-out',
                         boxShadow: selectedAlbumId === album.id 
                           ? '0 0 20px rgba(196, 71, 233, 0.3)' 
                           : 'none',
                         '&:hover': {
                           backgroundColor: 'rgba(196, 71, 233, 0.1)',
                           borderColor: 'rgba(196, 71, 233, 0.3)',
                           boxShadow: '0 0 15px rgba(196, 71, 233, 0.2)'
                         }
                       }}>
                         <CardMedia
                           component="img"
                           sx={{ 
                             width: 80, 
                             height: 80, 
                             borderRadius: 1,
                             objectFit: 'cover',
                             mr: 2,
                             border: '2px solid rgba(196, 71, 233, 0.3)',
                             boxShadow: '0 0 10px rgba(196, 71, 233, 0.3)'
                           }}
                           image={album.coverImage}
                           alt={album.title}
                         />
                         <Box sx={{ flex: 1 }}>
                           <Typography variant="h6" sx={{ 
                             fontWeight: 600, 
                             mb: 1,
                             color: '#FFFFFF'
                           }}>
                             {album.title}
                           </Typography>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                             <Typography variant="body2" sx={{ color: '#B3B3B3' }}>
                               {album.trackCount || 0}곡
                             </Typography>
                             <Typography variant="body2" sx={{ color: '#B3B3B3' }}>
                               {album.duration || '0분'}
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

       {/* 댓글 드로어 */}
       {selectedAlbumForComment && (
         <CommentDrawer
           open={commentDrawerOpen}
           onClose={handleCommentDrawerClose}
           albumId={selectedAlbumForComment.id}
           albumTitle={selectedAlbumForComment.title}
         />
       )}
    </Box>
  );
};

export default FeedPage;
