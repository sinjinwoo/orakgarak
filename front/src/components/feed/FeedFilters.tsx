import React from 'react';
import { Box, Typography } from '@mui/material';

const FeedFilters: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        피드 필터
      </Typography>
      <Typography variant="body2" color="text.secondary">
        장르, 인기순/최신순 필터
      </Typography>
    </Box>
  );
};

export default FeedFilters;
