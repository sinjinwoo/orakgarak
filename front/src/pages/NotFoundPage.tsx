import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="sm" sx={{ pt: { xs: 12, sm: 14 } }}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
        gap={3}
      >
        <Typography variant="h1" component="h1" color="primary">
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          페이지를 찾을 수 없습니다
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleGoHome}
          size="large"
        >
          홈으로 돌아가기
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
