import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Card, 
  CardContent, 
  CardMedia,
  Avatar,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
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
  Search,
  Favorite,
  ChatBubbleOutline,
  Share,
  PlayArrow,
  FilterList,
  Add,
  MusicNote,
  MoreVert
} from '@mui/icons-material';

// 타입 정의
interface FeedAlbum {
  id: string;
  albumId: string;
  user: {
    nickname: string;
    avatar: string;
  };
  createdAt: string;
  coverImage: string;
  title: string;
  description: string;
  trackCount: number;
  playCount: number;
  tags: string[];
  likeCount: number;
  commentCount: number;
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

// 더미 피드 데이터
const dummyFeedAlbums: FeedAlbum[] = [
  {
    id: '1',
    albumId: 'dummy1', // 더미 앨범 ID
    user: {
      nickname: '음악러버',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    },
    createdAt: '2025. 1. 15.',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    title: 'My Favorite Songs',
    description: '내가 좋아하는 노래들을 모아서 만든 첫 번째 앨범',
    trackCount: 3,
    playCount: 156,
    tags: ['K-POP', '발라드', '감성'],
    likeCount: 42,
    commentCount: 12,
  },
  {
    id: '2',
    albumId: 'dummy2',
    user: {
      nickname: '레인보우',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    },
    createdAt: '2025. 1. 14.',
    coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
    title: 'Rainy Day Playlist',
    description: '비오는 날 듣기 좋은 감성적인 곡들',
    trackCount: 5,
    playCount: 93,
    tags: ['인디', '감성', '비'],
    likeCount: 28,
    commentCount: 8,
  },
  {
    id: '3',
    albumId: 'dummy3',
    user: {
      nickname: '해피송',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    },
    createdAt: '2025. 1. 13.',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    title: 'Happy Vibes',
    description: '기분 좋아지는 신나는 곡들만 모았어요!',
    trackCount: 4,
    playCount: 234,
    tags: ['댄스', '신나는', '행복'],
    likeCount: 67,
    commentCount: 15,
  },
  {
    id: '4',
    albumId: 'dummy4',
    user: {
      nickname: '락매니아',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    },
    createdAt: '2025. 1. 12.',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    title: 'Rock Collection',
    description: '락 음악 명곡들만 모은 컬렉션',
    trackCount: 6,
    playCount: 89,
    tags: ['락', '헤비메탈', '클래식'],
    likeCount: 35,
    commentCount: 7,
  },
];

// 내 앨범 데이터를 localStorage에서 가져오는 함수
const getMyAlbums = (): MyAlbum[] => {
  const savedAlbums = localStorage.getItem('myAlbums');
  if (savedAlbums) {
    return JSON.parse(savedAlbums);
  }
  return [];
};

// 피드 데이터를 localStorage에서 가져오는 함수
const getFeedAlbums = (): FeedAlbum[] => {
  const savedFeedAlbums = localStorage.getItem('feedAlbums');
  if (savedFeedAlbums) {
    return JSON.parse(savedFeedAlbums);
  }
  return dummyFeedAlbums;
};

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [tabValue, setTabValue] = useState(0);
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 피드 데이터 상태
  const [feedAlbums, setFeedAlbums] = useState(getFeedAlbums());
  const [myAlbums, setMyAlbums] = useState(getMyAlbums());
  
  // 피드 생성 모달 관련 상태
  const [createFeedModalOpen, setCreateFeedModalOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [feedDescription, setFeedDescription] = useState('');

  // 컴포넌트 마운트 시 데이터 새로고침
  useEffect(() => {
    setFeedAlbums(getFeedAlbums());
    setMyAlbums(getMyAlbums());
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value);
  };

  const handleLike = (albumId: string) => {
    // 좋아요 기능 구현
    console.log('Like album:', albumId);
  };

  const handleComment = (albumId: string) => {
    // 댓글 기능 구현
    console.log('Comment on album:', albumId);
  };

  const handleShare = (albumId: string) => {
    // 공유 기능 구현
    console.log('Share album:', albumId);
  };

  const handlePlay = (albumId: string) => {
    // 재생 기능 구현
    console.log('Play album:', albumId);
  };

  const handleAlbumClick = (feed: FeedAlbum) => {
    // 피드에 albumId가 있으면 그것을 사용, 없으면 피드 ID 사용
    const albumId = feed.albumId || feed.id;
    // 앨범 상세 페이지로 이동
    navigate(`/albums/${albumId}`);
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
    <Box sx={{ flex: 1, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '25% 1fr',
          gap: 3
        }}>
          {/* 왼쪽 사이드바 */}
          <Box sx={{ 
            position: 'sticky',
            top: 20,
            height: 'fit-content'
          }}>
            {/* 검색 섹션 */}
            <Paper sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              backgroundColor: 'white'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mr: 1, color: '#333' }}>
                  Q
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                  검색
                </Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="앨범, 사용자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8f9fa',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ddd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#333',
                    },
                  }
                }}
              />
            </Paper>

            {/* 정렬 섹션 */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              backgroundColor: 'white'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterList sx={{ mr: 1, color: '#333' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                  정렬
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant={sortBy === 'latest' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('latest')}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 1.5,
                    backgroundColor: sortBy === 'latest' ? '#333' : 'transparent',
                    color: sortBy === 'latest' ? 'white' : '#333',
                    borderColor: '#ddd',
                    '&:hover': {
                      backgroundColor: sortBy === 'latest' ? '#1a1a1a' : '#f5f5f5',
                      borderColor: '#333',
                    }
                  }}
                >
                  최신순
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('popular')}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 1.5,
                    backgroundColor: sortBy === 'popular' ? '#333' : 'transparent',
                    color: sortBy === 'popular' ? 'white' : '#333',
                    borderColor: '#ddd',
                    '&:hover': {
                      backgroundColor: sortBy === 'popular' ? '#1a1a1a' : '#f5f5f5',
                      borderColor: '#333',
                    }
                  }}
                >
                  인기순
                </Button>
                <Button
                  variant={sortBy === 'trending' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('trending')}
          sx={{ 
                    justifyContent: 'flex-start', 
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 1.5,
                    backgroundColor: sortBy === 'trending' ? '#333' : 'transparent',
                    color: sortBy === 'trending' ? 'white' : '#333',
                    borderColor: '#ddd',
                    '&:hover': {
                      backgroundColor: sortBy === 'trending' ? '#1a1a1a' : '#f5f5f5',
                      borderColor: '#333',
                    }
                  }}
                >
                  트렌딩
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* 메인 콘텐츠 */}
          <Box>
            <Paper sx={{ 
              p: 4, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              backgroundColor: 'white'
            }}>
              {/* 페이지 헤더 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  mb: 1, 
                  textAlign: 'center',
                  color: '#333'
                }}>
                  커뮤니티 피드
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ 
                  mb: 4, 
                  textAlign: 'center',
                  fontSize: '1.1rem'
                }}>
                  다른 사용자들의 멋진 앨범을 둘러보고 소통해보세요
                </Typography>
                
                {/* 피드 필터 탭 */}
                <Box sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider', 
                  mb: 4,
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#333',
                    height: 3,
                    borderRadius: '3px 3px 0 0'
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
                        color: '#666',
                        '&.Mui-selected': {
                          color: '#333',
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
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                    {feedAlbums.length}개 앨범
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FilterList sx={{ color: '#666' }} />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={sortBy}
                          onChange={handleSortChange}
                          displayEmpty
                          sx={{
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#ddd',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#333',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#333',
                            }
                          }}
                        >
                          <MenuItem value="latest">최신순</MenuItem>
                          <MenuItem value="popular">인기순</MenuItem>
                          <MenuItem value="trending">트렌딩</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleCreateFeed}
                      sx={{
                        backgroundColor: '#333',
                        color: 'white',
            borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: '#1a1a1a',
                        },
                      }}
                    >
                      내 피드 만들기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 앨범 카드 목록 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {feedAlbums.map((album: FeedAlbum) => (
                  <Card 
                    key={album.id} 
                    sx={{ 
                      borderRadius: 3, 
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid #f0f0f0',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        transform: 'translateY(-2px)',
                        borderColor: '#ddd',
                      }
                    }}
                    onClick={() => handleAlbumClick(album)}
                  >
                    <CardContent sx={{ p: 4 }}>
                       {/* 사용자 정보 */}
                       <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                         <Avatar 
                           src={album.user.avatar} 
                           sx={{ 
                             width: 48, 
                             height: 48, 
                             mr: 2,
                             border: '2px solid #f0f0f0'
                           }}
                         />
                         <Box sx={{ flex: 1 }}>
                           <Typography variant="subtitle1" sx={{ 
                             fontWeight: 600, 
                             fontSize: '1.1rem',
                             color: '#333'
                           }}>
                             {album.user.nickname}
                           </Typography>
                           <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                             {album.createdAt}
                           </Typography>
                         </Box>
                         {/* MoreVert 버튼 */}
                         <IconButton
                           size="small"
                           onClick={(e) => {
                             e.stopPropagation();
                             // 추후 메뉴 기능 구현
                           }}
                           sx={{
                             color: '#666',
                             '&:hover': {
                               backgroundColor: 'rgba(0, 0, 0, 0.1)',
                               color: '#333'
                             }
                           }}
                         >
                           <MoreVert />
                         </IconButton>
                       </Box>

                      {/* 앨범 정보 */}
                      <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
                        <CardMedia
                          component="img"
                          sx={{ 
                            width: 140, 
                            height: 140, 
                            borderRadius: 2,
                            objectFit: 'cover',
                            border: '1px solid #f0f0f0'
                          }}
                          image={album.coverImage}
                          alt={album.title}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" sx={{ 
                            fontWeight: 700, 
                            mb: 1.5,
                            color: '#333',
                            fontSize: '1.4rem'
                          }}>
                            {album.title}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ 
                            mb: 2.5,
                            fontSize: '1rem',
                            lineHeight: 1.5
                          }}>
                            {album.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <MusicNote sx={{ fontSize: 18, color: '#666' }} />
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                {album.trackCount}곡
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PlayArrow sx={{ fontSize: 18, color: '#666' }} />
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                {album.playCount}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* 태그 */}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                             {(album.tags || []).map((tag: string) => (
                              <Chip
                                key={tag}
                                label={`#${tag}`}
                                size="small"
                                sx={{
                                  backgroundColor: '#f8f9fa',
                                  color: '#666',
                                  fontSize: '0.8rem',
                                  height: 28,
                                  borderRadius: 2,
                                  border: '1px solid #e0e0e0',
                                  '&:hover': {
                                    backgroundColor: '#f0f0f0'
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>

                      {/* 상호작용 버튼들 */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        pt: 3,
                        borderTop: '1px solid #f0f0f0'
                      }}>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                          <IconButton 
                            size="medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(album.id);
                            }}
            sx={{ 
                              color: '#f44336',
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                color: '#f44336'
                              }
                            }}
                          >
                            <Favorite sx={{ fontSize: 22 }} />
                            <Typography variant="body2" sx={{ ml: 1, fontWeight: 600 }}>
                              {album.likeCount}
          </Typography>
                          </IconButton>
                          <IconButton 
                            size="medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComment(album.id);
                            }}
                            sx={{ 
                              color: '#666',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                color: '#333'
                              }
                            }}
                          >
                            <ChatBubbleOutline sx={{ fontSize: 22 }} />
                            <Typography variant="body2" sx={{ ml: 1, fontWeight: 600 }}>
                              {album.commentCount}
          </Typography>
                          </IconButton>
                          <IconButton 
                            size="medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(album.id);
                            }}
                            sx={{ 
                              color: '#666',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                color: '#333'
                              }
                            }}
                          >
                            <Share sx={{ fontSize: 22 }} />
                          </IconButton>
                        </Box>
                        <Button
                          variant="contained"
                          startIcon={<PlayArrow />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlay(album.id);
                          }}
                          sx={{
                            backgroundColor: '#333',
                            color: 'white',
                            borderRadius: 3,
                            px: 3,
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                            '&:hover': {
                              backgroundColor: '#1a1a1a',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            },
                          }}
                        >
                          재생
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
        </Paper>
          </Box>
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
             maxHeight: '90vh'
           }
         }}
       >
         <DialogTitle sx={{ 
           textAlign: 'center', 
           fontSize: '1.5rem', 
           fontWeight: 700,
           color: '#333',
           pb: 2
         }}>
           내 피드 만들기
         </DialogTitle>
         
         <DialogContent sx={{ px: 4, py: 2 }}>
           {/* 앨범 선택 섹션 */}
           <Box sx={{ mb: 4 }}>
             <Typography variant="h6" sx={{ 
               fontWeight: 600, 
               mb: 1, 
               color: '#333' 
             }}>
               공유할 앨범 선택
             </Typography>
             <Typography variant="body2" sx={{ 
               color: '#666', 
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
                   color: 'text.secondary'
                 }}>
                   <MusicNote sx={{ fontSize: 48, color: '#ddd', mb: 2 }} />
                   <Typography variant="h6" sx={{ mb: 1, color: '#333' }}>
                     생성된 앨범이 없습니다
                   </Typography>
                   <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                     먼저 앨범을 생성한 후 피드로 공유해보세요
                   </Typography>
                   <Button
                     variant="contained"
                     onClick={() => {
                       handleCloseCreateFeedModal();
                       navigate('/albums/create');
                     }}
                     sx={{
                       backgroundColor: '#333',
                       color: 'white',
                       px: 3,
                       py: 1.5,
                       borderRadius: 2,
                       textTransform: 'none',
                       fontWeight: 600,
                       '&:hover': {
                         backgroundColor: '#1a1a1a',
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
                     control={<Radio sx={{ color: '#333' }} />}
                     label={
                       <Box sx={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         p: 2, 
                         border: selectedAlbumId === album.id ? '2px solid #333' : '1px solid #e0e0e0',
                         borderRadius: 2,
                         ml: 1,
                         width: '100%',
                         backgroundColor: selectedAlbumId === album.id ? '#f8f9fa' : 'transparent',
                         transition: 'all 0.2s ease-in-out',
                         '&:hover': {
                           backgroundColor: '#f8f9fa',
                           borderColor: '#333'
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
                             border: '1px solid #f0f0f0'
                           }}
                           image={album.coverImage}
                           alt={album.title}
                         />
                         <Box sx={{ flex: 1 }}>
                           <Typography variant="h6" sx={{ 
                             fontWeight: 600, 
                             mb: 1,
                             color: '#333'
                           }}>
                             {album.title}
                           </Typography>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                             <Typography variant="body2" color="text.secondary">
                               {album.trackCount || 0}곡
                             </Typography>
                             <Typography variant="body2" color="text.secondary">
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
                                   backgroundColor: '#f0f0f0',
                                   color: '#666',
                                   fontSize: '0.75rem',
                                   height: 24
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
               color: '#333' 
             }}>
               피드 설명 작성
             </Typography>
             <Typography variant="body2" sx={{ 
               color: '#666', 
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
                   '&:hover .MuiOutlinedInput-notchedOutline': {
                     borderColor: '#333',
                   },
                   '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                     borderColor: '#333',
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
               color: '#666',
               textTransform: 'none',
               fontWeight: 600
             }}
           >
             취소
           </Button>
           <Button
             onClick={handleFeedSubmit}
             variant="contained"
             disabled={!selectedAlbumId || !feedDescription.trim()}
             sx={{
               backgroundColor: selectedAlbumId && feedDescription.trim() ? '#333' : '#ccc',
               color: 'white',
               borderRadius: 2,
               px: 3,
               py: 1,
               textTransform: 'none',
               fontWeight: 600,
               '&:hover': {
                 backgroundColor: selectedAlbumId && feedDescription.trim() ? '#1a1a1a' : '#ccc',
               },
               '&:disabled': {
                 backgroundColor: '#ccc',
                 color: '#999',
               }
             }}
           >
             피드 공유하기
           </Button>
         </DialogActions>
       </Dialog>
    </Box>
  );
};

export default FeedPage;
