import React from 'react';
import { Box, Typography } from '@mui/material';

const RecommendationList: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        추천 곡 목록
      </Typography>
      <Typography variant="body2" color="text.secondary">
        추천 곡들이 여기에 표시됩니다.
      </Typography>
    </Box>
  );
};

export default RecommendationList;
