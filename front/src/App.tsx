import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/router';
import Header from './components/common/Header';
import SimpleHeader from './components/common/SimpleHeader';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
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
        overflow: 'hidden'
      }}
    >
      {/* 인증 상태에 따라 다른 헤더 렌더링 */}
      {isAuthenticated ? <Header /> : <SimpleHeader />}
      <Box 
        component="main"
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden'
        }}
      >
        <AppRouter />
      </Box>
      <Footer />
      <Toast />
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
