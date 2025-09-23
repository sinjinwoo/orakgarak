import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { albumService } from '../services/api/albums';
import { motion } from 'framer-motion';
import type { Album } from '../types/album';
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

// 타입 정의 - Album 타입 확장
interface FeedAlbum extends Album {
  user?: {
    nickname: string;
    avatar?: string;
  };
  tags?: string[];
  playCount?: number;
  commentCount?: number;
}

interface MyAlbum {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  trackCount: number;
  duration?: string;
  tags: string[];
}

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
    const myAlbums = getMyAlbums();
    const validFeedAlbums = feedAlbums.filter((feed: FeedAlbum) => {
      return myAlbums.some(album => album.id === feed.albumId);
    });
    if (validFeedAlbums.length !== feedAlbums.length) {
      localStorage.setItem('feedAlbums', JSON.stringify(validFeedAlbums));
    }
    return validFeedAlbums;
  }
  return [];
};

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

  const loadPublicAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await albumService.getPublicAlbums({ page: 0, size: 20 });
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
      console.error('공개 앨범 로드 실패:', error);
      setError('앨범을 불러오는데 실패했습니다.');
      setFeedAlbums(getFeedAlbums());
    } finally {
      setLoading(false);
    }
  };

  const loadFollowedUsersAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await albumService.getFollowedUsersAlbums({ page: 0, size: 20 });
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
      console.error('팔로우 사용자 앨범 로드 실패:', error);
      setError('팔로우 사용자의 앨범을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicAlbums();
    setMyAlbums(getMyAlbums());
  }, []);

  useEffect(() => {
    if (tabValue === 0) {
      loadPublicAlbums();
    } else {
      loadFollowedUsersAlbums();
    }
  }, [tabValue]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value as string);
  };

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
    const selectedAlbum = myAlbums.find((album: MyAlbum) => album.id === selectedAlbumId);
    if (!selectedAlbum) {
      showToast('선택된 앨범을 찾을 수 없습니다.', 'error');
      return;
    }
    const newFeed = {
      id: Date.now().toString(),
      albumId: selectedAlbum.id,
      user: {
        nickname: '나',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      },
      createdAt: new Date().toLocaleDateString('ko-KR'),
      coverImage: selectedAlbum.coverImageUrl,
      title: selectedAlbum.title,
      description: feedDescription,
      trackCount: selectedAlbum.trackCount,
      playCount: 0,
      tags: selectedAlbum.tags || [],
      likeCount: 0,
      commentCount: 0,
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
    <div style={{
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

                {error && <Typography color="error">{error}</Typography>}
                {loading && <Typography sx={{color: 'white'}}>로딩 중...</Typography>}
                
                {!loading && !error && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
                    {feedAlbums.map((album: FeedAlbum, index: number) => (
                      <motion.div
                        key={album.id ? `album-${album.id}` : `album-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Box 
                          sx={{
                            cursor: 'pointer',
                            overflow: 'hidden',
                            borderRadius: '10px',
                            p: 2,
                            background: 'rgba(26, 26, 26, 0.8)',
                            border: '1px solid rgba(0, 255, 255, 0.2)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              borderColor: 'rgba(0, 255, 255, 0.6)',
                              boxShadow: '0 10px 20px rgba(0, 255, 255, 0.1)',
                            }
                          }}
                          onClick={() => handleAlbumClick(album)}
                        >
                          <Box sx={{ position: 'relative', mb: 2, width: '100%', aspectRatio: '1', borderRadius: 1, overflow: 'hidden' }}>
                            <CardMedia
                              component="img"
                              image={album.coverImageUrl || ''}
                              alt={album.title}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '1.1rem' }}>
                            {album.title || '제목 없음'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                            {album.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar src={album.user?.avatar} sx={{ width: 20, height: 20, mr: 1 }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {album.userNickname || album.user?.nickname || `사용자 ${album.userId}`}
                            </Typography>
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
      </div>
    </div>
  );
};

export default FeedPage;