import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/router';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import './app/index.css';

function App() {
  return (
    <AppProviders>
      <CssBaseline />
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
        <Header />
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
    </AppProviders>
  );
}

export default App;
