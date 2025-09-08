import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const OnboardingSurveyPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          온보딩 설문
        </Typography>
        <Typography variant="body1" color="text.secondary">
          설문 페이지가 여기에 구현됩니다.
        </Typography>
      </Box>
    </Container>
  );
};

export default OnboardingSurveyPage;
