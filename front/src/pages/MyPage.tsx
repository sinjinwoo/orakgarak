import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Avatar,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment
} from '@mui/material';
import { theme } from '../styles/theme';
import { 
  Add, 
  Album, 
  Mic, 
  MusicNote, 
  Favorite, 
  PlayArrow,
  Edit,
  Search,
  Person,
  CalendarToday,
  Star,
  Delete,
  Wallpaper
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useProfile';
import { motion } from 'framer-motion';
import AlbumCoverflow from '../components/AlbumCoverflow';
import { albumService, userService, apiClient } from '../services/api';
import type { 
  Album as AlbumType, 
  MyPageStats, 
  MyPageAlbumListResponse, 
  MyPageLikedAlbumListResponse 
} from '../types/album';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// 이미지 fallback 컴포넌트
interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback: string;
  alt: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  fallback, 
  alt, 
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);
  
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallback);
    }
  };
  
  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
    />
  );
};

// 통계 카드 컴포넌트
interface StatCardProps {
  icon: React.ComponentType<{ sx?: object }>;
  value: number;
  label: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, color = '#FFFFFF' }) => {
  const cardStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: 0.8,
    px: 1.2,
    py: 0.8,
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 1.5,
    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
    minWidth: 'fit-content',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.08)',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    }
  };

  const iconStyles = {
    color,
    fontSize: 16,
    filter: color === '#FFFFFF' 
      ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))'
      : `drop-shadow(0 0 4px ${color}50)`
  };

  return (
    <Box sx={cardStyles}>
      <Icon sx={iconStyles} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          color: '#FFFFFF',
          fontSize: '0.9rem',
          lineHeight: 1
        }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.65rem',
          whiteSpace: 'nowrap'
        }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { user, updateProfile } = useAuth();
  const { 
    updateMyProfile, 
    updateMyProfileWithImage, 
    checkNicknameDuplicate,
    isLoading: profileLoading,
    error: profileError 
  } = useMyProfile();
  const [tabValue, setTabValue] = useState(0);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followType, setFollowType] = useState<'following' | 'followers'>('following');
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  
  // 배경 이미지 캐싱
  const backgroundImage = useMemo(() => {
    const customBg = localStorage.getItem('customBackground');
    return customBg ? `url(${customBg})` : 'url(/images/background/Music.jpg)';
  }, []);
  
  // 앨범 데이터 상태
  const [myAlbums, setMyAlbums] = useState<AlbumType[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [albumsError, setAlbumsError] = useState<string | null>(null);

  // 좋아요한 앨범 상태
  const [likedAlbums, setLikedAlbums] = useState<AlbumType[]>([]);
  const [likedAlbumsLoading, setLikedAlbumsLoading] = useState(true);
  const [likedAlbumsError, setLikedAlbumsError] = useState<string | null>(null);

  // 마이페이지 통계 상태
  const [myPageStats, setMyPageStats] = useState<MyPageStats>({
    followerCount: 0,
    followingCount: 0,
    albumCount: 0,
    // likedAlbumCount: 0 // 사용하지 않는 속성 제거
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // 프로필 상태 관리
  const [profileData, setProfileData] = useState(() => {
    // localStorage에서 프로필 데이터 불러오기
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      return {
        nickname: parsed.nickname || '음악러버',
        introduction: parsed.introduction || '음악을 사랑하는 평범한 사람입니다. 노래 부르는 것이 취미예요!',
        profileImage: null as File | null,
        profileImageUrl: parsed.profileImageUrl || ''
      };
    }
    return {
      nickname: '음악러버',
      introduction: '음악을 사랑하는 평범한 사람입니다. 노래 부르는 것이 취미예요!',
      profileImage: null as File | null,
      profileImageUrl: ''
    };
  });
  

  // 편집 폼 상태
  const [editForm, setEditForm] = useState({
    nickname: profileData.nickname,
    introduction: profileData.introduction
  });

  // 실제 데이터 상태 관리
  const [recordings, setRecordings] = useState([
    { title: '좋아', artist: '윤종신', score: 85, quality: '높음', duration: '3:45', date: '1월 15일' },
    { title: '사랑은 은하수 다방에서', artist: '10cm', score: 92, quality: '높음', duration: '4:12', date: '1월 14일' },
    { title: '밤편지', artist: '아이유', score: 88, quality: '보통', duration: '3:23', date: '1월 13일' }
  ]);


  // 실제 사용자 통계 데이터 (나중에 API에서 가져올 예정)
  const [userStats, setUserStats] = useState({
    albums: 0,
    recordings: 0,
    likes: 0,
    totalPlays: 0
  });

  // 더미 데이터 제거됨 - 실제 API 데이터 사용

  // 마이페이지 데이터 로드
  useEffect(() => {
    const loadMyPageData = async () => {
      try {
        // 통계 데이터 로드
        setStatsLoading(true);
        try {
          const statsResponse = await apiClient.get('/profiles/mypage/stats');
          setMyPageStats(statsResponse.data);
        } catch (error) {
          console.error('통계 데이터 로드 실패:', error);
          // 기본값 유지
        }

        // 내 앨범 목록 로드
        setAlbumsLoading(true);
        setAlbumsError(null);
        try {
          const albumsResponse = await apiClient.get('/profiles/mypage/albums', {
            params: { page: 0, size: 100 }
          });
          const albumsData: MyPageAlbumListResponse = albumsResponse.data;
          console.log('앨범 데이터:', albumsData.albums);
          setMyAlbums(albumsData.albums);
        } catch (error) {
          console.error('앨범 데이터 로드 실패:', error);
          setAlbumsError('앨범을 불러오는데 실패했습니다.');
          setMyAlbums([]);
        }

        // 좋아요한 앨범 목록 로드
        setLikedAlbumsLoading(true);
        setLikedAlbumsError(null);
        try {
          const likedAlbumsResponse = await apiClient.get('/profiles/mypage/liked-albums', {
            params: { page: 0, size: 100 }
          });
          const likedAlbumsData: MyPageLikedAlbumListResponse = likedAlbumsResponse.data;
          setLikedAlbums(likedAlbumsData.albums || likedAlbumsData.content || []);
        } catch (error) {
          console.error('좋아요한 앨범 데이터 로드 실패:', error);
          setLikedAlbumsError('좋아요한 앨범을 불러오는데 실패했습니다.');
          setLikedAlbums([]);
        }

      } finally {
        setAlbumsLoading(false);
        setLikedAlbumsLoading(false);
        setStatsLoading(false);
      }
    };

    loadMyPageData();
  }, []);

  // 통계 데이터 계산 (API 데이터 사용)
  useEffect(() => {
    setUserStats({
      albums: myPageStats.albumCount,
      recordings: recordings.length, // 녹음 데이터는 아직 더미 데이터
      likes: myPageStats.totalLikes || 0,
      totalPlays: 0 // totalPlays는 현재 API에 없으므로 0으로 설정
    });
  }, [myPageStats, recordings]);


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  const handleNewRecording = () => {
    navigate('/record');
  };

  const handleProfileEdit = () => {
    setEditForm({
      nickname: profileData.nickname,
      introduction: profileData.introduction
    });
    setProfileEditOpen(true);
  };

  const handleFollowClick = (type: 'following' | 'followers') => {
    setFollowType(type);
    setFollowModalOpen(true);
  };

  const handleFormChange = (field: 'nickname' | 'introduction', value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        showToast('파일 크기는 5MB 이하여야 합니다.', 'error');
        return;
      }
      
      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드 가능합니다.', 'error');
        return;
      }

      try {
        // 실제 백엔드 API 호출
        const updatedProfile = await updateMyProfileWithImage({
          image: file,
          nickname: profileData.nickname,
          gender: 'male', // TODO: 성별 선택 UI 추가 후 실제 값 사용
          description: profileData.introduction
        });

        if (updatedProfile) {
          // 로컬 상태 업데이트
          const updatedProfileData = {
            ...profileData,
            profileImage: file,
            profileImageUrl: updatedProfile.profileImageUrl
          };
          
          setProfileData(updatedProfileData);
          
          // localStorage에 프로필 데이터 저장
          localStorage.setItem('userProfile', JSON.stringify({
            nickname: updatedProfile.nickname,
            introduction: updatedProfile.description,
            profileImageUrl: updatedProfile.profileImageUrl
          }));
          
          // authStore 업데이트 (Header 동기화를 위해)
          if (user) {
            updateProfile({
              nickname: updatedProfile.nickname,
              profileImage: updatedProfile.profileImageUrl
            });
          }
          
          showToast('프로필 사진이 업로드되었습니다.', 'success');
        }
      } catch (error) {
        console.error('프로필 이미지 업로드 실패:', error);
        showToast('프로필 사진 업로드에 실패했습니다.', 'error');
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      // 실제 백엔드 API 호출
      const updatedProfile = await updateMyProfile({
        nickname: editForm.nickname,
        gender: 'male', // TODO: 성별 선택 UI 추가 후 실제 값 사용
        description: editForm.introduction
      });

      if (updatedProfile) {
        // 로컬 상태 업데이트
        const updatedProfileData = {
          ...profileData,
          nickname: updatedProfile.nickname,
          introduction: updatedProfile.description
        };
        
        setProfileData(updatedProfileData);
        
        // localStorage에 프로필 데이터 저장
        localStorage.setItem('userProfile', JSON.stringify({
          nickname: updatedProfile.nickname,
          introduction: updatedProfile.description,
          profileImageUrl: profileData.profileImageUrl
        }));
        
        // authStore 업데이트 (Header 동기화를 위해)
        if (user) {
          updateProfile({
            nickname: updatedProfile.nickname,
            profileImage: profileData.profileImageUrl
          });
        }
        
        setProfileEditOpen(false);
        showToast('프로필이 성공적으로 저장되었습니다.', 'success');
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      showToast('프로필 저장에 실패했습니다.', 'error');
    }
  };

  const handleResetProfileImage = () => {
    const updatedProfileData = {
      ...profileData,
      profileImage: null,
      profileImageUrl: ''
    };
    
    setProfileData(updatedProfileData);
    
    // localStorage에 프로필 데이터 저장
    localStorage.setItem('userProfile', JSON.stringify({
      nickname: profileData.nickname,
      introduction: profileData.introduction,
      profileImageUrl: ''
    }));
    
    // authStore 업데이트 (Header 동기화를 위해)
    if (user) {
      updateProfile({
        profileImage: ''
      });
    }
    
    showToast('프로필 사진이 기본 이미지로 변경되었습니다.', 'success');
  };

  // 녹음 추가 함수 (나중에 녹음 페이지에서 호출)
  const addRecording = (newRecording: { title: string; artist: string; score: number; quality: string; duration: string; date: string }) => {
    setRecordings(prev => [...prev, newRecording]);
    showToast('새 녹음이 추가되었습니다.', 'success');
  };


  // 녹음 삭제 함수
  const deleteRecording = (recordingIndex: number) => {
    setRecordings(prev => prev.filter((_, index) => index !== recordingIndex));
    showToast('녹음이 삭제되었습니다.', 'success');
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case '높음': return '#4caf50';
      case '보통': return '#ff9800';
      case '낮음': return '#f44336';
      default: return '#9e9e9e';
    }
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
      <Container maxWidth="lg" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper 
            elevation={0}
            sx={{ 
              background: 'transparent',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
          {/* 프로필 섹션 */}
          <Box sx={{ 
            p: 4, 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)',
              pointerEvents: 'none',
              zIndex: 0
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3, position: 'relative', zIndex: 1 }}>
              <Avatar 
                src={profileData.profileImageUrl}
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'rgba(196, 71, 233, 0.2)',
                  fontSize: '2rem',
                  border: '3px solid rgba(196, 71, 233, 0.3)',
                  boxShadow: '0 0 20px rgba(196, 71, 233, 0.3)',
                  color: '#C147E9'
                }}
              >
                {!profileData.profileImageUrl && <Person />}
              </Avatar>
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
                  {profileData.nickname}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Button 
                    variant="text" 
                    onClick={() => handleFollowClick('following')}
                    sx={{ 
                      p: 0, 
                      minWidth: 'auto', 
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(196, 71, 233, 0.1)'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      24 팔로잉
                    </Typography>
                  </Button>
                  <Button 
                    variant="text" 
                    onClick={() => handleFollowClick('followers')}
                    sx={{ 
                      p: 0, 
                      minWidth: 'auto', 
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(196, 71, 233, 0.1)'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      67 팔로워
                    </Typography>
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarToday sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    2024. 12. 1.부터 활동
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
                  {profileData.introduction}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleProfileEdit}
                    sx={{ 
                      textTransform: 'none',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF'
                      }
                    }}
                  >
                    프로필 편집
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Wallpaper />}
                    onClick={() => setIsBackgroundModalOpen(true)}
                    sx={{ 
                      textTransform: 'none',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF'
                      }
                    }}
                  >
                    배경화면 설정
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* 통계 카드 - 컴팩트 정돈 */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mb: 3,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <StatCard 
                icon={Album} 
                value={userStats.albums} 
                label="앨범" 
                color="#FFFFFF" 
              />
              <StatCard 
                icon={Mic} 
                value={userStats.recordings} 
                label="녹음" 
                color="#FFFFFF" 
              />
              <StatCard 
                icon={Favorite} 
                value={userStats.likes} 
                label="좋아요" 
                color="#FF6B9D" 
              />
              <StatCard 
                icon={PlayArrow} 
                value={userStats.totalPlays} 
                label="총 재생" 
                color="#8B5CF6" 
              />
            </Box>
          </Box>

          {/* 탭 네비게이션 */}
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#C147E9',
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#C147E9',
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab 
                icon={<Album />} 
                label="내 앨범" 
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
              <Tab 
                icon={<Mic />} 
                label="내 녹음" 
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
              <Tab 
                icon={<Star />} 
                label="추천 받은 곡" 
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
              <Tab 
                icon={<Favorite />} 
                label="좋아요한 앨범" 
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
            </Tabs>
          </Box>

          {/* 탭 콘텐츠 */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
                  내 앨범 ({myAlbums.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/albums/create')}
                  sx={{ 
                    textTransform: 'none',
                    background: theme.colors.primary.gradient,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)',
                    }
                  }}
                >
                  새 앨범 만들기
                </Button>
              </Box>
              
              {/* 앨범 로딩/에러/데이터 표시 */}
              {albumsLoading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    앨범을 불러오는 중...
                  </Typography>
                </Box>
              ) : albumsError ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" sx={{ color: '#FF6B6B', mb: 2 }}>
                    {albumsError}
                  </Typography>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outlined"
                    sx={{ color: '#FFFFFF', borderColor: '#FFFFFF' }}
                  >
                    다시 시도
                  </Button>
                </Box>
              ) : myAlbums.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Album sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.6)', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                    아직 만든 앨범이 없습니다
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3 }}>
                    첫 번째 앨범을 만들어보세요!
                  </Typography>
                </Box>
              ) : (
                /* 3D Coverflow */
                <AlbumCoverflow
                  albums={myAlbums.map((album) => {
                    const mappedAlbum = {
                      id: album.id.toString(),
                      title: album.title,
                      coverImageUrl: album.coverImageUrl || '/images/default-album-cover.png',
                      artist: '나',
                      year: new Date(album.createdAt).getFullYear().toString(),
                      trackCount: album.trackCount
                    };
                    console.log('앨범 매핑:', album.title, 'coverImageUrl:', album.coverImageUrl, 'mappedCoverImageUrl:', mappedAlbum.coverImageUrl);
                    return mappedAlbum;
                  })}
                  onAlbumClick={(album) => navigate(`/albums/${album.id}`, {
                    state: { from: '/me' }
                  })}
                  onPlayClick={(album) => {
                    // 재생 기능 구현
                    console.log('Play album:', album.title);
                  }}
                />
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
                ♫ 내 녹음 ({recordings.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleNewRecording}
                  sx={{ textTransform: 'none' }}
                >
                  새 녹음하기
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => addRecording({
                    title: `테스트 곡 ${recordings.length + 1}`,
                    artist: '테스트 아티스트',
                    score: Math.floor(Math.random() * 40) + 60,
                    quality: ['높음', '보통', '낮음'][Math.floor(Math.random() * 3)],
                    duration: `${Math.floor(Math.random() * 3) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                    date: new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
                  })}
                  sx={{ textTransform: 'none' }}
                >
                  테스트 녹음 추가
                </Button>
              </Box>
            </Box>

            <TextField
              fullWidth
              placeholder="제목이나 가수명으로 검색..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 3,
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

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>곡 정보</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>점수</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>품질</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>재생시간</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>녹음일</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recordings.map((recording, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: '#FFFFFF',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              }
                            }}
                          >
                            <PlayArrow />
                          </IconButton>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
                              {recording.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              {recording.artist}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
                          {recording.score}점
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={recording.quality}
                          size="small"
                          sx={{
                            backgroundColor: getQualityColor(recording.quality),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                          {recording.duration}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                          {recording.date}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={() => deleteRecording(index)}
                          sx={{ 
                            color: '#FF6B6B',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 107, 107, 0.1)',
                              color: '#FF5252',
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#FFFFFF' }}>
              ☆ 추천 받은 곡 (0)
            </Typography>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <MusicNote sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.6)', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                아직 추천받은 곡이 없습니다
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                추천 페이지에서 AI가 추천한 곡들을 확인해보세요!
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#FFFFFF' }}>
              ❤️ 좋아요한 앨범 ({likedAlbums.length})
            </Typography>
            {likedAlbumsLoading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  로딩 중...
                </Typography>
              </Box>
            ) : likedAlbumsError ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                  오류가 발생했습니다
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {likedAlbumsError}
                </Typography>
              </Box>
            ) : likedAlbums.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Favorite sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.6)', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                  아직 좋아요한 앨범이 없습니다
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  마음에 드는 앨범에 좋아요를 눌러보세요!
                </Typography>
              </Box>
            ) : (
              <AlbumCoverflow
                albums={likedAlbums.map(album => ({
                  id: album.id.toString(),
                  title: album.title,
                  artist: 'Various Artists', // 좋아요한 앨범은 아티스트 정보가 없을 수 있음
                  coverImageUrl: album.coverImageUrl || '/images/default-album-cover.png',
                  year: new Date(album.createdAt).getFullYear().toString(),
                  trackCount: album.trackCount
                }))}
                onAlbumClick={(album) => {
                  console.log('좋아요한 앨범 클릭:', album);
                  navigate(`/albums/${album.id}`, {
                    state: { from: '/me' }
                  });
                }}
              />
            )}
          </TabPanel>
        </Paper>
        </motion.div>
      </Container>

      {/* 프로필 편집 모달 */}
      <Dialog 
        open={profileEditOpen} 
        onClose={() => setProfileEditOpen(false)} 
        maxWidth="sm" 
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
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#FFFFFF',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2
        }}>
          <Person sx={{ color: '#C147E9' }} />
          프로필 편집
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar 
              src={profileData.profileImageUrl}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'rgba(255, 255, 255, 0.2)' }}
            >
              {!profileData.profileImageUrl && <Person sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />}
            </Avatar>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-image-upload"
              type="file"
              onChange={handleImageUpload}
              onClick={(e) => {
                // 같은 파일을 다시 선택할 수 있도록 value 초기화
                (e.target as HTMLInputElement).value = '';
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <label htmlFor="profile-image-upload">
                <Button 
                  variant="outlined" 
                  startIcon={<Edit />} 
                  component="span"
                  sx={{
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: '#C147E9',
                      backgroundColor: 'rgba(196, 71, 233, 0.1)',
                    }
                  }}
                >
                  사진 변경
                </Button>
              </label>
              {profileData.profileImageUrl && (
                <Button 
                  variant="outlined" 
                  onClick={handleResetProfileImage}
                  sx={{
                    color: '#FF6B6B',
                    borderColor: 'rgba(255, 107, 107, 0.3)',
                    '&:hover': {
                      borderColor: '#FF6B6B',
                      backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    }
                  }}
                >
                  초기화
                </Button>
              )}
            </Box>
          </Box>
          <TextField
            fullWidth
            label="활동명 *"
            value={editForm.nickname}
            onChange={(e) => handleFormChange('nickname', e.target.value)}
            helperText={`${editForm.nickname.length} / 20자`}
            inputProps={{ maxLength: 20 }}
            sx={{ 
              mb: 3,
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
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#C147E9',
                },
              },
              '& .MuiFormHelperText-root': {
                color: 'rgba(255, 255, 255, 0.6)',
              },
            }}
          />
          <TextField
            fullWidth
            label="소개"
            multiline
            rows={4}
            value={editForm.introduction}
            onChange={(e) => handleFormChange('introduction', e.target.value)}
            helperText={`${editForm.introduction.length} / 200자`}
            inputProps={{ maxLength: 200 }}
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
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#C147E9',
                },
              },
              '& .MuiFormHelperText-root': {
                color: 'rgba(255, 255, 255, 0.6)',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          pt: 2,
          px: 3
        }}>
          <Button 
            onClick={() => setProfileEditOpen(false)}
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
            variant="contained" 
            onClick={handleSaveProfile}
            disabled={!editForm.nickname.trim()}
            sx={{
              background: 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 팔로잉/팔로워 모달 */}
      <Dialog open={followModalOpen} onClose={() => setFollowModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {followType === 'following' ? '팔로잉' : '팔로워'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            {followType === 'following' ? '팔로잉 중인 사용자' : '나를 팔로우하는 사용자'} 목록이 여기에 표시됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowModalOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 배경화면 설정 모달 */}
      <Dialog 
        open={isBackgroundModalOpen} 
        onClose={() => setIsBackgroundModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#FFFFFF', 
          fontSize: '1.5rem', 
          fontWeight: 600,
          textAlign: 'center',
          pb: 2
        }}>
          배경화면 설정
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              color: '#FFFFFF', 
              mb: 2, 
              fontSize: '1.1rem',
              fontWeight: 500
            }}>
              사진 업로드
            </Typography>
            <Box 
              component="label"
              sx={{
                border: '2px dashed rgba(255, 255, 255, 0.3)',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'block',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const imageUrl = event.target?.result as string;
                      // 배경 이미지 설정 로직
                      localStorage.setItem('customBackground', imageUrl);
                      showToast('배경 이미지가 설정되었습니다.', 'success');
                      setIsBackgroundModalOpen(false);
                      // 페이지 새로고침으로 배경 적용
                      window.location.reload();
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <Wallpaper sx={{ 
                fontSize: 48, 
                color: 'rgba(255, 255, 255, 0.6)', 
                mb: 1 
              }} />
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                mb: 1
              }}>
                클릭하여 배경 이미지 업로드
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                JPG, PNG 파일만 지원됩니다
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              color: '#FFFFFF', 
              mb: 2, 
              fontSize: '1.1rem',
              fontWeight: 500
            }}>
              앨범 커버에서 선택
            </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 2,
              maxHeight: 200,
              overflowY: 'auto',
              pr: 1
            }}>
              {myAlbums.map((album) => (
                <Box
                  key={album.id}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', // 기본 배경색 추가
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      transform: 'scale(1.05)',
                    }
                  }}
                  onClick={() => {
                    // 현재는 커버 이미지가 없으므로 기본 동작 비활성화
                    showToast('앨범 커버 이미지가 설정되지 않았습니다.', 'info');
                  }}
                >
                  <Album sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.6)' }} />
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ 
              color: '#FFFFFF', 
              mb: 2, 
              fontSize: '1.1rem',
              fontWeight: 500
            }}>
              기본 배경으로 복원
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                // 기본 배경으로 복원하는 로직
                localStorage.removeItem('customBackground');
                showToast('기본 배경으로 복원되었습니다.', 'success');
                setIsBackgroundModalOpen(false);
                // 페이지 새로고침으로 배경 적용
                window.location.reload();
              }}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.8)',
                py: 1.5,
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              기본 배경으로 복원
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setIsBackgroundModalOpen(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyPage;
