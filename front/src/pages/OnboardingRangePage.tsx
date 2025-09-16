import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const OnboardingRangePage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ pt: { xs: 12, sm: 14 } }}>
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          음역대 측정
        </Typography>
        <Typography variant="body1" color="text.secondary">
          음역대 측정 페이지가 여기에 구현됩니다.
        </Typography>
      </Box>
    </Container>
  );
};

export default OnboardingRangePage;
