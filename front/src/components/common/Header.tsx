import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { MusicNote, AccountCircle, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth, useSocialAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { loginWithGoogle, isLoading } = useSocialAuth();
  
  // 프로필 데이터 상태
  const [profileData, setProfileData] = useState({
    nickname: '음악러버',
    profileImageUrl: ''
  });

  // localStorage에서 프로필 데이터 불러오기
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfileData({
        nickname: parsed.nickname || '음악러버',
        profileImageUrl: parsed.profileImageUrl || ''
      });
    }
  }, []);

  // localStorage 변경 감지 및 커스텀 이벤트 감지
  useEffect(() => {
    const handleStorageChange = () => {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfileData({
          nickname: parsed.nickname || '음악러버',
          profileImageUrl: parsed.profileImageUrl || ''
        });
      }
    };

    const handleProfileUpdate = (event: CustomEvent) => {
      setProfileData({
        nickname: event.detail.nickname || '음악러버',
        profileImageUrl: event.detail.profileImageUrl || ''
      });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleGoogleLogin = async () => {
    // 구글 OAuth2 리다이렉트 시작 (페이지가 리다이렉트됨)
    await loginWithGoogle();
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: '#2c2c2c',
        boxShadow: 'none',
        borderBottom: '1px solid #404040'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* 로고 */}
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <MusicNote sx={{ mr: 1, color: 'white' }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem'
            }}
          >
            오락가락
          </Typography>
        </Box>

        {/* 네비게이션 메뉴 */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Button 
            color="inherit" 
            onClick={() => navigate('/recommendations')}
            sx={{ 
              color: 'white',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            추천
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/record')}
            sx={{ 
              color: 'white',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            녹음
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/feed')}
            sx={{ 
              color: 'white',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            피드
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/albums/create')}
            sx={{ 
              color: 'white',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            앨범 만들기
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/me')}
            sx={{ 
              color: 'white',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            마이페이지
          </Button>
        </Box>

        {/* 우측 버튼들 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isAuthenticated ? (
            <>
              <Avatar 
                src={profileData.profileImageUrl}
                sx={{ 
                  width: 32, 
                  height: 32, 
                  mr: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {!profileData.profileImageUrl && <Person sx={{ fontSize: 20 }} />}
              </Avatar>
              <Typography sx={{ color: 'white', mr: 2, fontWeight: 500 }}>
                {profileData.nickname}
              </Typography>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={{ 
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <Button 
              color="inherit" 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              sx={{ color: 'white' }}
            >
              {isLoading ? '로그인 중...' : '구글로 로그인'}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
