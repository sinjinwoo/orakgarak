import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const RecommendationsPage: React.FC = () => {
  return (
    <Box sx={{ flex: 1, backgroundColor: '#fafafa' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            backgroundColor: 'white',
            borderRadius: 2,
            minHeight: '60vh'
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: '#2c2c2c',
              mb: 3
            }}
          >
            추천 곡
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: '1.1rem' }}
          >
            추천 곡 페이지가 여기에 구현됩니다.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default RecommendationsPage;
