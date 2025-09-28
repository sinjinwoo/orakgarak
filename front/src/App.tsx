import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/router';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import { useAuth } from './hooks/useAuth';
import './app/index.css';
import './styles/immersive-playback.css';

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        backgroundColor: '#fafafa',
      }}
    >
      {/* 인증 상태에 따라 다른 헤더 렌더링 */}
      {isAuthenticated && <Header />}
      <Box 
        component="main"
        id="app-main"
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100vw',
        }}
      >
        <AppRouter />
      </Box>
      <Footer />
    </Box>
  );
}

function App() {
  return (
    <AppProviders>
      <CssBaseline />
      <AppContent />
    </AppProviders>
  );
}

export default App;
