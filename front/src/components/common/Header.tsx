import React from 'react';
import { Typography, Button, Box } from '@mui/material';
import { MusicNote } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useSocialAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { loginWithGoogle, isLoading } = useSocialAuth();
  const isLandingPage = location.pathname === '/';


  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      navigate('/recommendations');
    }
  };

  const menuItems = [
    { label: '추천', path: '/recommendations' },
    { label: 'AI 데모', path: '/ai-demo' },
    { label: '녹음', path: '/record' },
    { label: '피드', path: '/feed' },
    { label: '앨범 만들기', path: '/albums/create' },
    { label: '마이페이지', path: '/me' },
  ];

  const navButtonStyles = {
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: 500,
    padding: '10px 20px',
    borderRadius: '4px',
    transition: 'all 0.3s ease',
    textTransform: 'none' as const,
    textShadow: isLandingPage ? '0 1px 2px rgba(0, 0, 0, 0.5)' : 'none',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      transform: 'translateY(-1px)',
    }
  };

  const authButtonStyles = {
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: 500,
    padding: '10px 20px',
    borderRadius: '2px',
    backgroundColor: isLandingPage ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    textTransform: 'none' as const,
    textShadow: isLandingPage ? '0 1px 2px rgba(0, 0, 0, 0.5)' : 'none',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderColor: 'rgba(255, 255, 255, 0.4)',
      transform: 'translateY(-1px)',
    },
    '&:disabled': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: 'rgba(255, 255, 255, 0.5)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    }
  };

  return (
    <div 
      className="fixed top-0 left-0 right-2 z-40"
      style={{
        background: isLandingPage 
          ? 'transparent'
          : 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%)',
        backdropFilter: isLandingPage ? 'none' : 'blur(20px)',
        borderBottom: isLandingPage ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isLandingPage ? 'none' : '0 4px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: { xs: '20px 16px', sm: '24px 32px' },
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* 로고 */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/');
          }}
          sx={{
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 500,
            padding: '10px 20px',
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            textTransform: 'none' as const,
            textShadow: isLandingPage ? '0 1px 2px rgba(0, 0, 0, 0.5)' : 'none',
            backgroundColor: 'transparent',
            minWidth: 'auto',
            width: 'fit-content',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateY(-1px)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MusicNote sx={{ 
              color: '#FFFFFF', 
              fontSize: '32px',
              filter: isLandingPage
                ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))'
                : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
              transition: 'all 0.3s ease',
            }} />
            <Typography
              component="h1"
              sx={{ 
                fontSize: { xs: '22px', sm: '24px' },
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                textShadow: isLandingPage
                  ? '0 2px 4px rgba(0, 0, 0, 0.5)'
                  : '0 1px 2px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
              }}
            >
              오락가락
            </Typography>
          </Box>
        </Button>

        {/* 네비게이션 메뉴 + 인증 버튼 - 중간부터 오른쪽까지 */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          justifyContent: 'center',
          flex: 1,
        }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
            {menuItems.map((item) => (
              <Button 
                key={item.path}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(item.path);
                }}
                sx={navButtonStyles}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {isAuthenticated ? (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              sx={authButtonStyles}
            >
              로그아웃
            </Button>
          ) : (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleGoogleLogin();
              }}
              disabled={isLoading}
              sx={authButtonStyles}
            >
              {isLoading ? '로그인 중...' : '구글 로그인'}
            </Button>
          )}
        </Box>
      </Box>
    </div>
  );
};

export default Header;