import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { MusicNote } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSocialAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';

const SimpleHeader: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, isLoading } = useSocialAuth();
  const { tempLogin } = useAuthStore();

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      // 로그인 성공 시 메인 페이지로 이동
      navigate('/recommendations');
    }
    // 로그인 실패 시에는 현재 페이지에 그대로 머물러 있음
  };

  const handleTempLogin = () => {
    tempLogin();
    navigate('/recommendations');
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

        {/* 로그인 버튼들 */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            color="inherit" 
            onClick={handleTempLogin}
            sx={{ 
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              fontSize: '0.8rem',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.5)'
              }
            }}
          >
            임시 로그인
          </Button>
          <Button 
            color="inherit" 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            sx={{ 
              color: 'white',
              px: 3,
              py: 1,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.5)'
              }
            }}
          >
            {isLoading ? '로그인 중...' : '구글로 로그인'}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default SimpleHeader;
