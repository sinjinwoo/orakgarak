import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/onboarding/survey');
  };

  return (
    <Container maxWidth="lg">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
        gap={4}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          AI 노래방 서비스
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          당신의 목소리로 만드는 특별한 음악 경험
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          AI 기술을 활용한 맞춤형 노래 추천과 음성 분석으로<br />
          더 나은 노래 실력을 향상시켜보세요
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleGetStarted}
          sx={{ mt: 2 }}
        >
          시작하기
        </Button>
      </Box>
    </Container>
  );
};

export default LandingPage;
