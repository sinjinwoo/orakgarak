import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { MusicNote, AccountCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth, useSocialAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { loginWithGoogle, isLoading } = useSocialAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      // 로그인 성공 시 메인 페이지로 이동
      navigate('/recommendations');
    }
    // 로그인 실패 시에는 현재 페이지에 그대로 머물러 있음
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
              <AccountCircle sx={{ color: 'white', mr: 1 }} />
              <Typography sx={{ color: 'white', mr: 2 }}>
                {user?.nickname}
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
