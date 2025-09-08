import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box } from '@mui/material';
import { Menu as MenuIcon, Notifications as NotificationsIcon, AccountCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: 'primary.main' }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          AI 노래방
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" onClick={() => navigate('/recommendations')}>
            추천
          </Button>
          <Button color="inherit" onClick={() => navigate('/record')}>
            녹음
          </Button>
          <Button color="inherit" onClick={() => navigate('/albums/create')}>
            앨범
          </Button>
          <Button color="inherit" onClick={() => navigate('/feed')}>
            피드
          </Button>
          
          {isAuthenticated ? (
            <>
              <IconButton color="inherit">
                <NotificationsIcon />
              </IconButton>
              <Button color="inherit" onClick={() => navigate('/me')}>
                <AccountCircle sx={{ mr: 1 }} />
                {user?.nickname}
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                로그아웃
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              로그인
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
