import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const RecommendationsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          추천 곡
        </Typography>
        <Typography variant="body1" color="text.secondary">
          추천 곡 페이지가 여기에 구현됩니다.
        </Typography>
      </Box>
    </Container>
  );
};

export default RecommendationsPage;
