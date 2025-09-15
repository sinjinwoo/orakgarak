import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
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
import { 
  Add, 
  Album, 
  Mic, 
  MusicNote, 
  Favorite, 
  PlayArrow,
  Edit,
  Search,
  MoreVert,
  Person,
  CalendarToday,
  Star,
  LocalFireDepartment,
  TrendingUp,
  Favorite as HeartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';

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

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [tabValue, setTabValue] = useState(0);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followType, setFollowType] = useState<'following' | 'followers'>('following');
  
  // 앨범 데이터 (localStorage에서 불러오기)
  const [myAlbums, setMyAlbums] = useState(() => {
    const savedAlbums = localStorage.getItem('myAlbums');
    if (savedAlbums) {
      return JSON.parse(savedAlbums);
    }
    // 기본 더미 데이터
    return [
      {
        id: '1',
        title: 'My Favorite Songs',
        description: '내가 좋아하는 노래들을 모아서 만든 첫 번째 앨범입니다.',
        coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        isPublic: true,
        trackCount: 3,
        duration: '11분',
        likeCount: 42,
        playCount: 156,
        createdAt: '2025-01-15T00:00:00Z',
      },
      {
        id: '2',
        title: '감성 발라드 모음',
        description: '마음에 담고 싶은 감성적인 발라드들',
        coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
        isPublic: false,
        trackCount: 5,
        duration: '18분',
        likeCount: 0,
        playCount: 12,
        createdAt: '2025-01-10T00:00:00Z',
      },
    ];
  });
  
  // 프로필 상태 관리
  const [profileData, setProfileData] = useState({
    nickname: '음악러버',
    introduction: '음악을 사랑하는 평범한 사람입니다. 노래 부르는 것이 취미예요!',
    profileImage: null as File | null,
    profileImageUrl: ''
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

  // const [albums, setAlbums] = useState([
  //   { 
  //     title: 'My Favorite Songs', 
  //     status: '공개', 
  //     songs: 3, 
  //     likes: 42, 
  //     plays: 156, 
  //     date: '1월 15일',
  //     cover: '/api/placeholder/200/200'
  //   },
  //   { 
  //     title: 'Rainy Day Mood', 
  //     status: '비공개', 
  //     songs: 5, 
  //     likes: 0, 
  //     plays: 23, 
  //     date: '1월 10일',
  //     cover: '/api/placeholder/200/200'
  //   }
  // ]);

  // 실제 사용자 통계 데이터 (나중에 API에서 가져올 예정)
  const [userStats, setUserStats] = useState({
    albums: 0,
    recordings: 0,
    likes: 0,
    totalPlays: 0
  });

  // 앨범 데이터 새로고침
  React.useEffect(() => {
    const savedAlbums = localStorage.getItem('myAlbums');
    if (savedAlbums) {
      setMyAlbums(JSON.parse(savedAlbums));
    }
  }, []);

  // 통계 데이터 로드 (실제로는 API 호출)
  React.useEffect(() => {
    // 임시로 더미 데이터 설정 (나중에 API 호출로 교체)
    setUserStats({
      albums: myAlbums.length,
      recordings: recordings.length,
      likes: myAlbums.reduce((sum: number, album: { likeCount: number }) => sum + album.likeCount, 0),
      totalPlays: myAlbums.reduce((sum: number, album: { playCount: number }) => sum + album.playCount, 0)
    });
  }, [myAlbums, recordings]);

  const achievements = [
    { icon: <MusicNote />, text: '첫 앨범', color: '#1976d2' },
    { icon: <LocalFireDepartment />, text: '인기 앨범', color: '#ff6b6b' },
    { icon: <TrendingUp />, text: '보컬리스트', color: '#4caf50' },
    { icon: <HeartIcon />, text: '소셜 스타', color: '#ff9800' }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // const handleCreateAlbum = () => {
  //   navigate('/albums/create');
  // };

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profileImage: file,
          profileImageUrl: e.target?.result as string
        }));
        showToast('프로필 사진이 업로드되었습니다.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // 실제로는 여기서 API 호출하여 서버에 저장
    setProfileData(prev => ({
      ...prev,
      nickname: editForm.nickname,
      introduction: editForm.introduction
    }));
    setProfileEditOpen(false);
    showToast('프로필이 성공적으로 저장되었습니다.', 'success');
  };

  const handleResetProfileImage = () => {
    setProfileData(prev => ({
      ...prev,
      profileImage: null,
      profileImageUrl: ''
    }));
    showToast('프로필 사진이 기본 이미지로 변경되었습니다.', 'success');
  };

  // 앨범 추가 함수 (나중에 앨범 생성 페이지에서 호출)
  // const addAlbum = (newAlbum: any) => {
  //   setAlbums(prev => [...prev, newAlbum]);
  //   showToast('success' as const, '새 앨범이 추가되었습니다.');
  // };

  // 녹음 추가 함수 (나중에 녹음 페이지에서 호출)
  const addRecording = (newRecording: { title: string; artist: string; score: number; quality: string; duration: string; date: string }) => {
    setRecordings(prev => [...prev, newRecording]);
    showToast('새 녹음이 추가되었습니다.', 'success');
  };

  // 앨범 삭제 함수
  // const deleteAlbum = (albumIndex: number) => {
  //   setAlbums(prev => prev.filter((_, index) => index !== albumIndex));
  //   showToast('success' as const, '앨범이 삭제되었습니다.');
  // };

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
    <Box sx={{ flex: 1, backgroundColor: '#fafafa' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper 
          elevation={0}
          sx={{ 
            backgroundColor: 'white',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* 프로필 섹션 */}
          <Box sx={{ p: 4, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
              <Avatar 
                src={profileData.profileImageUrl}
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#e0e0e0',
                  fontSize: '2rem'
                }}
              >
                {!profileData.profileImageUrl && <Person />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {profileData.nickname}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Button 
                    variant="text" 
                    onClick={() => handleFollowClick('following')}
                    sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      24 팔로잉
                    </Typography>
                  </Button>
                  <Button 
                    variant="text" 
                    onClick={() => handleFollowClick('followers')}
                    sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      67 팔로워
                    </Typography>
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    2024. 12. 1.부터 활동
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {profileData.introduction}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleProfileEdit}
                  sx={{ textTransform: 'none' }}
                >
                  프로필 편집
                </Button>
              </Box>
            </Box>

            {/* 통계 카드 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
                <CardContent sx={{ p: 1 }}>
                  <Album sx={{ color: '#1976d2', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {userStats.albums}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    앨범
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
                <CardContent sx={{ p: 1 }}>
                  <Mic sx={{ color: '#1976d2', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {userStats.recordings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    녹음
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
                <CardContent sx={{ p: 1 }}>
                  <Favorite sx={{ color: '#e91e63', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {userStats.likes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    좋아요
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
                <CardContent sx={{ p: 1 }}>
                  <PlayArrow sx={{ color: '#1976d2', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {userStats.totalPlays}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    총 재생
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* 성취 섹션 */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                성취
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {achievements.map((achievement, index) => (
                  <Chip
                    key={index}
                    icon={achievement.icon}
                    label={achievement.text}
                    sx={{ 
                      backgroundColor: achievement.color,
                      color: 'white',
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* 탭 네비게이션 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
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
            </Tabs>
          </Box>

          {/* 탭 콘텐츠 */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                내 앨범 ({myAlbums.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/albums/create')}
                sx={{ textTransform: 'none' }}
              >
                새 앨범 만들기
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {myAlbums.map((album: { id: string; title: string; description: string; coverImage: string; isPublic: boolean; trackCount: number; duration: string; likeCount: number; playCount: number; createdAt: string }) => (
                <Card 
                  key={album.id} 
                  sx={{ width: 280, cursor: 'pointer' }}
                  onClick={() => navigate(`/albums/${album.id}`)}
                >
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={album.coverImage}
                      alt={album.title}
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover'
                      }}
                    />
                    <Chip
                      label={album.isPublic ? '공개' : '비공개'}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: album.isPublic ? '#4caf50' : '#ff9800',
                        color: 'white'
                      }}
                    />
                  </Box>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {album.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {album.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {album.trackCount}곡 • {album.duration}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(album.createdAt).toLocaleDateString('ko-KR')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Favorite sx={{ fontSize: 16, color: '#f44336' }} />
                          <Typography variant="body2">{album.likeCount}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PlayArrow sx={{ fontSize: 16, color: '#2196f3' }} />
                          <Typography variant="body2">{album.playCount}</Typography>
                        </Box>
                      </Box>
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
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
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>곡 정보</TableCell>
                    <TableCell>점수</TableCell>
                    <TableCell>품질</TableCell>
                    <TableCell>재생시간</TableCell>
                    <TableCell>녹음일</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recordings.map((recording, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <IconButton size="small">
                            <PlayArrow />
                          </IconButton>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {recording.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {recording.artist}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
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
                        <Typography variant="body2">
                          {recording.duration}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {recording.date}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={() => deleteRecording(index)}
                          sx={{ color: 'error.main' }}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              ☆ 추천 받은 곡 (0)
            </Typography>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <MusicNote sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                아직 추천받은 곡이 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                추천 페이지에서 AI가 추천한 곡들을 확인해보세요!
              </Typography>
            </Box>
          </TabPanel>
        </Paper>
      </Container>

      {/* 프로필 편집 모달 */}
      <Dialog open={profileEditOpen} onClose={() => setProfileEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person />
          프로필 편집
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar 
              src={profileData.profileImageUrl}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: '#e0e0e0' }}
            >
              {!profileData.profileImageUrl && <Person />}
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
                <Button variant="outlined" startIcon={<Edit />} component="span">
                  사진 변경
                </Button>
              </label>
              {profileData.profileImageUrl && (
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={handleResetProfileImage}
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
            sx={{ mb: 3 }}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileEditOpen(false)}>
            취소
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveProfile}
            disabled={!editForm.nickname.trim()}
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
          <Typography variant="body2" color="text.secondary">
            {followType === 'following' ? '팔로잉 중인 사용자' : '나를 팔로우하는 사용자'} 목록이 여기에 표시됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowModalOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyPage;
